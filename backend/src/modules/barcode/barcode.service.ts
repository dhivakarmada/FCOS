import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { StockMovementType, OrderStatus } from '@prisma/client';

export type BarcodeActionType = 'STOCK_IN' | 'STOCK_OUT' | 'DISPATCH' | 'RETURN_VERIFY';

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private auditLog: AuditLogService,
  ) {}

  // ── Generate Barcode ──
  generateBarcode(sku: string) {
    // EAN-13 style barcode string from SKU
    const hash = Array.from(sku).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const barcode = `FCOS${hash.toString().padStart(9, '0')}${(hash % 10)}`;
    return { sku, barcode, format: 'CODE128' };
  }

  // ── WORKFLOW: Scan Barcode ──
  // Resolves product from barcode/SKU → executes the appropriate action
  async scanBarcode(
    code: string,
    actionType: BarcodeActionType,
    context: { warehouseId?: string; binId?: string; orderId?: string; quantity?: number },
    vendorId: string,
    userId: string,
  ) {
    // Resolve product from SKU or barcode
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { sku: { equals: code, mode: 'insensitive' } },
          { sku: { contains: code, mode: 'insensitive' } },
        ],
        vendorId,
      },
      include: { inventory: true },
    });

    if (!product) throw new NotFoundException(`Product with code/SKU "${code}" not found`);

    switch (actionType) {
      case 'STOCK_IN':
        return this.handleStockIn(product, context, vendorId, userId);
      case 'STOCK_OUT':
        return this.handleStockOut(product, context, vendorId, userId);
      case 'DISPATCH':
        return this.handleDispatch(context, vendorId, userId);
      case 'RETURN_VERIFY':
        return this.handleReturnVerify(product, context, vendorId, userId);
      default:
        throw new BadRequestException(`Unknown action type: ${actionType}`);
    }
  }

  // ── STOCK_IN: Add stock via barcode scan ──
  private async handleStockIn(product: any, context: any, vendorId: string, userId: string) {
    const { warehouseId, binId, quantity = 1 } = context;
    if (!warehouseId || !binId) throw new BadRequestException('warehouseId and binId required for STOCK_IN');

    const inventoryItem = await this.prisma.inventoryItem.upsert({
      where: { productId_warehouseId_binId: { productId: product.id, warehouseId, binId } },
      create: { productId: product.id, warehouseId, binId, quantity },
      update: { quantity: { increment: quantity } },
    });

    await this.prisma.stockLog.create({
      data: {
        inventoryItemId: inventoryItem.id,
        type: StockMovementType.INBOUND,
        quantityChange: quantity,
        reason: `Barcode scan STOCK_IN — ${product.sku}`,
        performedById: userId,
      },
    });

    this.notifications.emitInventoryUpdate(vendorId, {
      productId: product.id,
      sku: product.sku,
      quantity,
      warehouseId,
    });

    await this.auditLog.log(userId, 'BARCODE_STOCK_IN', 'barcode', {
      sku: product.sku,
      quantity,
      warehouseId,
      binId,
    });

    return { action: 'STOCK_IN', product: { id: product.id, sku: product.sku, name: product.name }, quantity, newStock: inventoryItem.quantity };
  }

  // ── STOCK_OUT: Remove stock via barcode scan ──
  private async handleStockOut(product: any, context: any, vendorId: string, userId: string) {
    const { warehouseId, binId, quantity = 1 } = context;
    if (!warehouseId || !binId) throw new BadRequestException('warehouseId and binId required for STOCK_OUT');

    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { productId_warehouseId_binId: { productId: product.id, warehouseId, binId } },
    });

    if (!inventoryItem || inventoryItem.quantity < quantity) {
      throw new BadRequestException('Insufficient stock for STOCK_OUT');
    }

    const updated = await this.prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: { quantity: { decrement: quantity } },
    });

    await this.prisma.stockLog.create({
      data: {
        inventoryItemId: inventoryItem.id,
        type: StockMovementType.OUTBOUND,
        quantityChange: -quantity,
        reason: `Barcode scan STOCK_OUT — ${product.sku}`,
        performedById: userId,
      },
    });

    this.notifications.emitInventoryUpdate(vendorId, {
      productId: product.id,
      sku: product.sku,
      quantity: -quantity,
      warehouseId,
    });

    return { action: 'STOCK_OUT', product: { id: product.id, sku: product.sku, name: product.name }, quantity, newStock: updated.quantity };
  }

  // ── DISPATCH: Scan to dispatch an order (transitions READY_FOR_DISPATCH → SHIPPED) ──
  // Requires courier to be assigned first (shipment record must exist).
  private async handleDispatch(context: any, vendorId: string, userId: string) {
    const { orderId } = context;
    if (!orderId) throw new BadRequestException('orderId required for DISPATCH');

    const order = await this.prisma.order.findFirst({ where: { id: orderId, vendorId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.status !== OrderStatus.READY_FOR_DISPATCH && order.status !== OrderStatus.PACKED) {
      throw new BadRequestException(`Order must be READY_FOR_DISPATCH or PACKED to dispatch, current status: ${order.status}`);
    }

    const shipment = await this.prisma.shipment.findUnique({ where: { orderId } });
    if (!shipment || !shipment.trackingNumber) {
      throw new BadRequestException('Order must have an assigned courier and tracking number before dispatch scanning. Use POST /shipping/:orderId/assign-courier first.');
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.SHIPPED } });
    await this.prisma.shipment.update({ where: { orderId }, data: { shippedAt: new Date() } });

    this.notifications.emitOrderUpdate(vendorId, { orderId, orderNumber: order.orderNumber, status: 'SHIPPED' });
    await this.auditLog.log(userId, 'BARCODE_DISPATCH', 'barcode', { orderId, tracking: shipment.trackingNumber });

    return { action: 'DISPATCH', orderId, orderNumber: order.orderNumber, trackingNumber: shipment.trackingNumber, status: 'SHIPPED' };
  }

  // ── RETURN_VERIFY: Scan to verify a returned item at the dock ──
  // This action marks the return as physically received and pending QC.
  // Actual inventory restock is handled via POST /returns/:id/receive with qcResult.
  // The barcode scan here triggers receipt acknowledgment ONLY — no inventory change.
  private async handleReturnVerify(product: any, context: any, vendorId: string, userId: string) {
    const { orderId } = context;
    if (!orderId) throw new BadRequestException('orderId required for RETURN_VERIFY');

    const returnReq = await this.prisma.return.findFirst({
      where: { orderId, status: 'APPROVED' },
    });

    if (!returnReq) throw new NotFoundException('No approved return found for this order');

    // Mark return as RECEIVED for QC — inventory restock is a separate step
    // requiring explicit QC decision (PASS/FAIL) via POST /returns/:id/receive
    await this.prisma.return.update({
      where: { id: returnReq.id },
      data: { status: 'RECEIVED' },
    });

    this.notifications.emitReturnUpdate(vendorId, {
      returnId: returnReq.id,
      orderId,
      status: 'RECEIVED',
      message: 'Package received. Awaiting QC inspection before inventory restock.',
    });

    await this.auditLog.log(userId, 'BARCODE_RETURN_VERIFY', 'barcode', {
      orderId,
      sku: product.sku,
      note: 'Physical receipt scanned. Inventory restock pending QC decision via /returns/:id/receive',
    });

    return {
      action: 'RETURN_VERIFY',
      returnId: returnReq.id,
      product: { sku: product.sku, name: product.name },
      status: 'RECEIVED',
      nextStep: `POST /returns/${returnReq.id}/receive with qcResult: PASS or FAIL to complete return and update inventory`,
    };
  }
}
