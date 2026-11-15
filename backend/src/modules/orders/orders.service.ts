import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus, StockMovementType, UserRole } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { StaffPerformanceService } from '../staff/staff-performance.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private auditLog: AuditLogService,
    private performance: StaffPerformanceService,
    private analytics: AnalyticsService,
    @InjectQueue('orders') private ordersQueue: Queue,
  ) {}

  // ── WORKFLOW: Create Order ──
  // Creates order → RESERVES inventory (does NOT deduct) → assigns warehouse → assigns staff → emits events
  // Stock is only physically deducted at PICKED → PACKED transition (actual fulfillment)
  async create(data: any, vendorId: string, userId: string) {
    const { items, shippingAddress, warehouseId: requestedWarehouseId, ...orderData } = data;

    // 1. Enrich items: validate products exist and belong to this vendor, fetch prices
    const enrichedItems = await Promise.all(items.map(async (item: any) => {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, vendorId, deletedAt: null },
      });
      if (!product) throw new BadRequestException(`Product ${item.productId} not found or does not belong to this vendor`);
      if (Number(product.price) <= 0) throw new BadRequestException(`Product ${product.sku} has an invalid price`);
      return {
        ...item,
        price: Number(product.price),
        productName: product.name,
        sku: product.sku,
      };
    }));

    let totalAmount = 0;
    enrichedItems.forEach((item: any) => { totalAmount += item.price * item.quantity; });
    const gstAmount = totalAmount * 0.18;
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      // 2. Determine the fulfillment warehouse
      // If a specific warehouseId is not provided, auto-select the warehouse with the most available stock
      let assignedWarehouseId: string | null = requestedWarehouseId || null;

      if (!assignedWarehouseId) {
        // Auto-select: find warehouse under this vendor that has stock for all items
        const vendorWarehouses = await tx.warehouse.findMany({
          where: { vendorId, deletedAt: null },
        });
        for (const wh of vendorWarehouses) {
          let canFulfill = true;
          for (const item of enrichedItems) {
            const inv = await tx.inventoryItem.findFirst({
              where: { productId: item.productId, warehouseId: wh.id },
            });
            const available = inv ? inv.quantity - inv.reservedQuantity : 0;
            if (available < item.quantity) { canFulfill = false; break; }
          }
          if (canFulfill) { assignedWarehouseId = wh.id; break; }
        }
      }

      // 3. RESERVE inventory atomically for each item
      // We use reservedQuantity to track reservations; physical quantity is decremented only at fulfillment
      for (const item of enrichedItems) {
        const whereClause = assignedWarehouseId
          ? { productId: item.productId, warehouseId: assignedWarehouseId }
          : { productId: item.productId };

        const inventoryItems = await tx.inventoryItem.findMany({
          where: whereClause,
          orderBy: { quantity: 'desc' },
        });

        let remainingQty = item.quantity;
        for (const inv of inventoryItems) {
          if (remainingQty <= 0) break;
          const available = inv.quantity - inv.reservedQuantity;
          if (available <= 0) continue;
          const toReserve = Math.min(available, remainingQty);

          // Atomic reservation: increment reservedQuantity
          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: { reservedQuantity: { increment: toReserve } },
          });

          await tx.stockLog.create({
            data: {
              inventoryItemId: inv.id,
              type: StockMovementType.OUTBOUND,
              quantityChange: -toReserve,
              reason: `Order ${orderNumber} - stock reserved (not yet deducted)`,
              performedById: userId,
            },
          });

          remainingQty -= toReserve;
        }

        if (remainingQty > 0) {
          this.logger.warn(`Insufficient available stock for product ${item.productId} – short by ${remainingQty} units. Order created with partial reservation.`);
        }
      }

      // 4. Create the order record
      const order = await tx.order.create({
        data: {
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail || 'customer@example.com',
          customerPhone: orderData.customerPhone || null,
          addressLine1: shippingAddress || orderData.addressLine1 || 'N/A',
          addressLine2: orderData.addressLine2 || null,
          city: orderData.city || 'N/A',
          state: orderData.state || 'N/A',
          zipCode: orderData.zipCode || '000000',
          country: orderData.country || 'India',
          orderNumber,
          vendor: { connect: { id: vendorId } },
          ...(assignedWarehouseId ? { warehouse: { connect: { id: assignedWarehouseId } } } : {}),
          totalAmount,
          gstAmount,
          items: {
            create: enrichedItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } }, warehouse: true },
      });

      // 5. Auto-assign staff for PICKING task
      let staffUserId: string | null = null;

      const staffRecord = await tx.staff.findFirst({
        where: { vendorId, warehouseId: assignedWarehouseId || undefined },
        orderBy: { performance: 'asc' },
      });

      if (staffRecord && staffRecord.userId) {
        staffUserId = staffRecord.userId;
      } else {
        const staffUser = await tx.user.findFirst({
          where: { vendorId, role: UserRole.STAFF, deletedAt: null },
        });
        if (staffUser) staffUserId = staffUser.id;
      }

      if (staffUserId) {
        const task = await tx.staffTask.create({
          data: {
            orderId: order.id,
            staffId: staffUserId,
            taskType: 'PICKING',
            status: 'PENDING',
          },
        });

        this.notifications.emitTaskAssigned(vendorId, {
          taskId: task.id,
          staffId: staffUserId,
          taskType: 'PICKING',
          orderId: order.id,
          orderNumber,
        });
      }

      // 6. Emit real-time update & audit log
      this.notifications.emitOrderUpdate(vendorId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'CREATED',
      });

      await this.auditLog.log(userId, 'CREATE_ORDER', 'orders', {
        orderId: order.id,
        orderNumber,
        itemCount: items.length,
        totalAmount,
        warehouseId: assignedWarehouseId,
      });

      await this.analytics.invalidateVendorCache(vendorId);

      return order;
    });
  }

  // ── Find All Orders with Pagination & Filters ──
  async findAll(vendorId: string, filters?: { status?: string; page?: number; limit?: number; search?: string }, role?: string) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // BOLA: Non-super-admins always scoped to their vendorId
    const where: any = { deletedAt: null };
    if (role !== 'SUPER_ADMIN') {
      if (!vendorId) return { orders: [], total: 0, page, limit, totalPages: 0 };
      where.vendorId = vendorId;
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true } },
          shipment: true,
          returns: true,
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Find One Order ──
  // BOLA protection: non-super-admins can only access their own vendor's orders
  async findOne(id: string, vendorId: string, role?: string) {
    const where = role === 'SUPER_ADMIN' ? { id } : { id, vendorId };
    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: { include: { product: true } },
        shipment: true,
        returns: true,
        invoice: true,
        warehouse: true,
        tasks: { include: { staff: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  // ── WORKFLOW: Update Order Status (Full State Machine) ──
  // CREATED → PICKING → PICKED → QC_PENDING → QC_PASSED/QC_FAILED → PACKED → READY_FOR_DISPATCH → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
  async updateStatus(id: string, status: OrderStatus, vendorId: string, userId: string, role?: string) {
    const order = await this.findOne(id, vendorId, role);

    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PICKING]: [OrderStatus.PICKED, OrderStatus.CANCELLED],
      [OrderStatus.PICKED]: [OrderStatus.QC_PENDING, OrderStatus.PACKED, OrderStatus.CANCELLED],
      [OrderStatus.QC_PENDING]: [OrderStatus.QC_PASSED, OrderStatus.QC_FAILED],
      [OrderStatus.QC_PASSED]: [OrderStatus.PACKED],
      [OrderStatus.QC_FAILED]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PACKED]: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
      [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.RETURNED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };

    const allowedTransitions = validTransitions[order.status] || [];
    if (!allowedTransitions.includes(status)) {
      throw new BadRequestException(`Invalid transition: ${order.status} → ${status}. Allowed: [${allowedTransitions.join(', ')}]`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: { items: { include: { product: true } }, warehouse: true },
      });

      // ── Side effects per status ──

      if (status === OrderStatus.PICKING) {
        // Log picker activity
        await this.performance.logActivity({ staffId: userId, actionType: 'PICK_SCAN', orderId: id, isSuccess: true });
      }

      if (status === OrderStatus.PICKED) {
        // Physical stock deduction happens NOW (at pick completion)
        // Release reservation & deduct physical quantity atomically
        for (const item of order.items) {
          const whereInv = order.warehouseId
            ? { productId: item.productId, warehouseId: order.warehouseId }
            : { productId: item.productId };
          const inventoryItems = await tx.inventoryItem.findMany({ where: whereInv, orderBy: { reservedQuantity: 'desc' } });

          let remainingQty = item.quantity;
          for (const inv of inventoryItems) {
            if (remainingQty <= 0) break;
            const toDeduct = Math.min(inv.reservedQuantity, remainingQty);
            if (toDeduct <= 0) continue;

            // Atomic: deduct from both quantity and reservedQuantity
            const result = await tx.$executeRaw`
              UPDATE "InventoryItem"
              SET "quantity" = "quantity" - ${toDeduct},
                  "reservedQuantity" = "reservedQuantity" - ${toDeduct},
                  "updatedAt" = NOW()
              WHERE "id" = ${inv.id}
                AND "quantity" >= ${toDeduct}
                AND "reservedQuantity" >= ${toDeduct}
            `;

            if (result === 0) {
              throw new BadRequestException(`Concurrent stock conflict for product ${item.productId}. Please retry.`);
            }

            await tx.stockLog.create({
              data: {
                inventoryItemId: inv.id,
                type: StockMovementType.OUTBOUND,
                quantityChange: -toDeduct,
                reason: `Order ${order.orderNumber} picked — stock deducted`,
                performedById: userId,
              },
            });

            this.notifications.emitInventoryUpdate(vendorId, {
              productId: item.productId,
              sku: item.product.sku,
              quantity: -toDeduct,
              warehouseId: inv.warehouseId,
            });

            remainingQty -= toDeduct;
          }
        }

        // Create QC task
        const staff = await tx.staff.findFirst({ where: { vendorId }, orderBy: { performance: 'asc' } });
        if (staff?.userId) {
          await tx.staffTask.create({ data: { orderId: id, staffId: staff.userId, taskType: 'QC_CHECK', status: 'PENDING' } });
        }

        await this.performance.logActivity({ staffId: userId, actionType: 'PICK_SCAN', orderId: id, isSuccess: true });
      }

      if (status === OrderStatus.QC_PASSED) {
        const staff = await tx.staff.findFirst({ where: { vendorId }, orderBy: { performance: 'asc' } });
        if (staff?.userId) {
          await tx.staffTask.create({ data: { orderId: id, staffId: staff.userId, taskType: 'PACKING', status: 'PENDING' } });
        }
      }

      if (status === OrderStatus.QC_FAILED) {
        // Return items to shelf — increment reservedQuantity back (item goes back to picking queue)
        this.logger.warn(`QC Failed for order ${order.orderNumber} — items returned to shelf for re-pick`);
      }

      if (status === OrderStatus.PACKED) {
        await this.performance.logActivity({ staffId: userId, actionType: 'PACK_CONFIRM', orderId: id, isSuccess: true });
        await this.ordersQueue.add('generate-invoice', { orderId: id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
      }

      if (status === OrderStatus.READY_FOR_DISPATCH) {
        // Create dispatch task for courier handover
        const staff = await tx.staff.findFirst({ where: { vendorId }, orderBy: { performance: 'asc' } });
        if (staff?.userId) {
          await tx.staffTask.create({ data: { orderId: id, staffId: staff.userId, taskType: 'DISPATCH', status: 'PENDING' } });
        }
      }

      if (status === OrderStatus.SHIPPED) {
        await this.performance.logActivity({ staffId: userId, actionType: 'DISPATCH_SCAN', orderId: id, isSuccess: true });

        // Create shipment record if not existing
        const existingShipment = await tx.shipment.findUnique({ where: { orderId: id } });
        if (!existingShipment) {
          const trackingNumber = `TRK-FCOS-${Date.now().toString(36).toUpperCase()}`;
          await tx.shipment.create({
            data: {
              orderId: id,
              trackingNumber,
              courierName: 'Manual Dispatch',
              labelUrl: null,
              shippedAt: new Date(),
              estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          await tx.shipment.update({ where: { orderId: id }, data: { shippedAt: new Date() } });
        }
      }

      if (status === OrderStatus.DELIVERED) {
        await tx.shipment.update({ where: { orderId: id }, data: { deliveredAt: new Date() } }).catch(() => {});
        // Auto-generate invoice if not already generated
        const existingInvoice = await tx.invoice.findUnique({ where: { orderId: id } });
        if (!existingInvoice) {
          await this.ordersQueue.add('generate-invoice', { orderId: id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
        }
      }

      if (status === OrderStatus.CANCELLED) {
        // Release all reservations (do NOT restore physical stock — only the reservation)
        for (const item of order.items) {
          const whereInv = order.warehouseId
            ? { productId: item.productId, warehouseId: order.warehouseId }
            : { productId: item.productId };
          const inventoryItems = await tx.inventoryItem.findMany({ where: whereInv });

          for (const inv of inventoryItems) {
            const toRelease = Math.min(inv.reservedQuantity, item.quantity);
            if (toRelease <= 0) continue;
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { reservedQuantity: { decrement: toRelease } },
            });
            await tx.stockLog.create({
              data: {
                inventoryItemId: inv.id,
                type: StockMovementType.ADJUSTMENT,
                quantityChange: toRelease,
                reason: `Order ${order.orderNumber} cancelled — reservation released`,
                performedById: userId,
              },
            });
          }
        }

        await tx.staffTask.updateMany({
          where: { orderId: id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          data: { status: 'CANCELLED' },
        });
      }

      // Emit real-time notification
      this.notifications.emitOrderUpdate(vendorId, {
        orderId: id,
        orderNumber: order.orderNumber,
        status,
      });

      await this.auditLog.log(userId, 'UPDATE_ORDER_STATUS', 'orders', {
        orderId: id,
        from: order.status,
        to: status,
      });

      await this.analytics.invalidateVendorCache(vendorId);

      return updated;
    });
  }

  // ── WORKFLOW: Cancel Order (Shortcut that calls updateStatus) ──
  async cancelOrder(id: string, vendorId: string, userId: string, role?: string) {
    const order = await this.findOne(id, vendorId, role);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered order — use returns instead');
    }
    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Cannot cancel an in-transit order. Contact carrier for interception.');
    }

    return this.updateStatus(id, OrderStatus.CANCELLED, vendorId, userId, role);
  }

  // ── Get Order Timeline ──
  async getOrderTimeline(id: string, vendorId: string, role?: string) {
    const order = await this.findOne(id, vendorId, role);
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { module: 'orders', details: { path: ['orderId'], equals: id } },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    const timeline: Array<{ event: string; timestamp: Date; user?: string; details?: unknown }> = [
      { event: 'Order Created', timestamp: order.createdAt, details: { orderNumber: order.orderNumber } },
    ];

    for (const log of auditLogs) {
      timeline.push({
        event: log.action,
        timestamp: log.createdAt,
        user: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        details: log.details,
      });
    }

    if (order.shipment) {
      if (order.shipment.shippedAt) {
        timeline.push({ event: 'Shipped', timestamp: order.shipment.shippedAt, details: { tracking: order.shipment.trackingNumber } });
      }
      if (order.shipment.deliveredAt) {
        timeline.push({ event: 'Delivered', timestamp: order.shipment.deliveredAt });
      }
    }

    if (order.invoice) {
      timeline.push({ event: 'Invoice Generated', timestamp: order.invoice.createdAt, details: { url: order.invoice.invoiceUrl } });
    }

    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // ── Get Picking List (for warehouse staff) ──
  async getPickingList(vendorId: string, warehouseId?: string, role?: string) {
    const where: any = {
      status: { in: [OrderStatus.CREATED, OrderStatus.PICKING] },
    };

    if (role !== 'SUPER_ADMIN') {
      where.vendorId = vendorId;
    }
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: { inventory: { include: { bin: true, warehouse: true } } },
            },
          },
        },
        warehouse: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Enrich with bin location info for pick-path optimization
    return orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        locations: item.product.inventory.map(inv => ({
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouse.name,
          binId: inv.binId,
          binCode: inv.bin?.code || 'No Bin',
          availableQty: inv.quantity - inv.reservedQuantity,
        })).filter(loc => loc.warehouseId === (order.warehouseId || loc.warehouseId)),
      })),
    }));
  }
}
