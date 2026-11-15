import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { OrderStatus, StockMovementType } from '@prisma/client';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private auditLog: AuditLogService,
  ) {}

  // ── WORKFLOW: Request Return ──
  // Validates eligibility → creates return request → assigns staff → notifies
  // Does NOT change inventory at this stage
  async requestReturn(orderId: string, reason: string, vendorId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendorId },
      include: { items: { include: { product: true } } },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(`Cannot return an order with status ${order.status}. Must be DELIVERED.`);
    }

    const daysSinceDelivery = (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      throw new BadRequestException('Return window has expired (7 days from delivery)');
    }

    const existingReturn = await this.prisma.return.findFirst({
      where: { orderId, status: { not: 'REJECTED' } },
    });
    if (existingReturn) {
      throw new BadRequestException('A return request already exists for this order');
    }

    const returnRequest = await this.prisma.return.create({
      data: {
        orderId,
        reason,
        status: 'REQUESTED',
        refundAmount: order.totalAmount,
      },
    });

    // Update order status to RETURNED
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.RETURNED },
    });

    // Assign staff for RETURN_VERIFY task
    const staff = await this.prisma.staff.findFirst({
      where: { vendorId },
      orderBy: { performance: 'asc' },
    });
    if (staff) {
      await this.prisma.staffTask.create({
        data: {
          orderId,
          staffId: staff.userId || staff.id,
          taskType: 'RETURN_VERIFY',
          status: 'PENDING',
        },
      });
    }

    this.notifications.emitReturnUpdate(vendorId, {
      returnId: returnRequest.id,
      orderId,
      status: 'REQUESTED',
    });

    await this.auditLog.log(userId, 'REQUEST_RETURN', 'returns', {
      returnId: returnRequest.id,
      orderId,
      reason,
    });

    return returnRequest;
  }

  // ── WORKFLOW: Approve Return ──
  // Approval only changes status to AWAITING_RECEIPT.
  // *** NO INVENTORY CHANGE HERE *** — inventory is only restocked when physical goods arrive
  // and pass QC inspection (triggered by barcode scan RETURN_VERIFY action).
  async approveReturn(returnId: string, vendorId: string, userId: string, role?: string) {
    const returnReq = await this.findOne(returnId, vendorId, role);

    if (returnReq.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot approve return with status ${returnReq.status}`);
    }

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: { status: 'APPROVED' },
    });

    const actualVendorId = returnReq.order.vendorId;
    if (actualVendorId) {
      this.notifications.emitReturnUpdate(actualVendorId, {
        returnId,
        orderId: returnReq.orderId,
        status: 'APPROVED',
        message: 'Return approved. Awaiting physical receipt of goods at warehouse.',
      });
    }

    await this.auditLog.log(userId, 'APPROVE_RETURN', 'returns', {
      returnId,
      orderId: returnReq.orderId,
      note: 'Inventory will be restocked only after physical receipt and QC inspection.',
    });

    return updated;
  }

  // ── WORKFLOW: Mark Return as Received (physical goods arrived at dock) ──
  // Called when warehouse staff physically receives the returned package.
  // This triggers the actual inventory restock ONCE.
  async receiveReturn(returnId: string, vendorId: string, userId: string, qcResult: 'PASS' | 'FAIL', role?: string) {
    const returnReq = await this.findOne(returnId, vendorId, role);

    if (returnReq.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot receive return with status ${returnReq.status}. Must be APPROVED first.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const newStatus = qcResult === 'PASS' ? 'RECEIVED' : 'REJECTED';

      const updated = await tx.return.update({
        where: { id: returnId },
        data: { status: newStatus },
      });

      const actualVendorId = returnReq.order.vendorId;

      if (qcResult === 'PASS') {
        // Restock inventory ONCE — only on successful physical QC inspection
        const orderItems = await tx.orderItem.findMany({
          where: { orderId: returnReq.orderId },
          include: { product: true },
        });

        for (const item of orderItems) {
          // Find the best inventory slot: prefer the warehouse the order shipped from
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: { productId: item.productId },
            orderBy: { quantity: 'desc' },
          });

          if (inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: { increment: item.quantity } },
            });

            await tx.stockLog.create({
              data: {
                inventoryItemId: inventoryItem.id,
                type: StockMovementType.INBOUND,
                quantityChange: item.quantity,
                reason: `Return received & QC passed — Order ${returnReq.order.orderNumber}`,
                performedById: userId,
              },
            });

            if (actualVendorId) {
              this.notifications.emitInventoryUpdate(actualVendorId, {
                productId: item.productId,
                sku: item.product.sku,
                quantity: item.quantity,
                warehouseId: inventoryItem.warehouseId,
              });
            }
          }
        }
      } else {
        this.logger.warn(`Return ${returnId} QC failed — goods will be scrapped, inventory NOT restocked`);
      }

      if (actualVendorId) {
        this.notifications.emitReturnUpdate(actualVendorId, {
          returnId,
          orderId: returnReq.orderId,
          status: newStatus,
          qcResult,
        });
      }

      await this.auditLog.log(userId, 'RECEIVE_RETURN', 'returns', {
        returnId,
        orderId: returnReq.orderId,
        qcResult,
        inventoryRestocked: qcResult === 'PASS',
      });

      return updated;
    });
  }

  // ── Reject Return ──
  async rejectReturn(returnId: string, vendorId: string, userId: string, role?: string) {
    const returnReq = await this.findOne(returnId, vendorId, role);
    if (returnReq.status !== 'REQUESTED') {
      throw new BadRequestException(`Cannot reject return with status ${returnReq.status}`);
    }

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: { status: 'REJECTED' },
    });

    // Revert order status back to DELIVERED
    await this.prisma.order.update({
      where: { id: returnReq.orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    const actualVendorId = returnReq.order.vendorId;
    if (actualVendorId) {
      this.notifications.emitReturnUpdate(actualVendorId, { returnId, orderId: returnReq.orderId, status: 'REJECTED' });
    }
    await this.auditLog.log(userId, 'REJECT_RETURN', 'returns', { returnId });

    return updated;
  }

  // ── WORKFLOW: Process Refund ──
  async processRefund(returnId: string, vendorId: string, userId: string, role?: string) {
    const returnReq = await this.findOne(returnId, vendorId, role);
    if (!['APPROVED', 'RECEIVED'].includes(returnReq.status)) {
      throw new BadRequestException('Return must be approved or received before processing refund');
    }

    const updated = await this.prisma.return.update({
      where: { id: returnId },
      data: { status: 'REFUNDED' },
    });

    const actualVendorId = returnReq.order.vendorId;
    if (actualVendorId) {
      this.notifications.emitReturnUpdate(actualVendorId, { returnId, orderId: returnReq.orderId, status: 'REFUNDED' });
    }
    await this.auditLog.log(userId, 'PROCESS_REFUND', 'returns', {
      returnId,
      refundAmount: Number(returnReq.refundAmount),
    });

    return { ...updated, message: `Refund of ₹${returnReq.refundAmount} processed` };
  }

  // ── Find One Return ──
  async findOne(returnId: string, vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? { id: returnId } : { id: returnId, order: { vendorId } };
    const returnReq = await this.prisma.return.findFirst({
      where,
      include: { order: { include: { items: { include: { product: true } } } } },
    });
    if (!returnReq) throw new NotFoundException(`Return ${returnId} not found`);
    return returnReq;
  }

  // ── Find All Returns ──
  async findAll(vendorId: string, filters?: { status?: string; page?: number; limit?: number }, role?: string) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where: { status?: string; order?: { vendorId?: string } } = isSuperAdmin ? {} : { order: { vendorId } };
    if (filters?.status) where.status = filters.status;

    const [returns, total] = await Promise.all([
      this.prisma.return.findMany({
        where,
        include: {
          order: {
            include: {
              vendor: { select: { name: true } },
              items: { include: { product: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.return.count({ where }),
    ]);

    return { returns, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
