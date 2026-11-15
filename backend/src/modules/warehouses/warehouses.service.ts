import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { StockMovementType } from '@prisma/client';

@Injectable()
export class WarehousesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  async create(vendorId: string | null | undefined, data: { name: string; location: string }) {
    const warehouse = await this.prisma.warehouse.create({
      data: { name: data.name, location: data.location, vendorId: vendorId || null },
    });
    if (vendorId) {
      this.notifications.emitWarehouseUpdate(vendorId, {
        warehouseId: warehouse.id,
        action: 'CREATED',
      });
    }
    return warehouse;
  }

  async findAll(vendorId: string, role?: string) {
    const where = role === 'SUPER_ADMIN' 
      ? { deletedAt: null } 
      : { OR: [ { vendorId }, { vendorId: null } ], deletedAt: null };
    return this.prisma.warehouse.findMany({
      where,
      include: {
        bins: { include: { inventory: { include: { product: true } } } },
        _count: { select: { bins: true, inventory: true, staff: true } },
      },
    });
  }

  async findOne(id: string, vendorId: string, role?: string) {
    const where = role === 'SUPER_ADMIN' 
      ? { id, deletedAt: null } 
      : { id, OR: [ { vendorId }, { vendorId: null } ], deletedAt: null };
    const wh = await this.prisma.warehouse.findFirst({
      where,
      include: {
        bins: { include: { inventory: { include: { product: true } } } },
        staff: true,
        _count: { select: { bins: true, inventory: true } },
      },
    });
    if (!wh) throw new NotFoundException(`Warehouse ${id} not found`);
    return wh;
  }

  async update(id: string, vendorId: string, data: { name?: string; location?: string }, role?: string) {
    await this.findOne(id, vendorId, role);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async createBin(warehouseId: string, vendorId: string, code: string, role?: string) {
    await this.findOne(warehouseId, vendorId, role);
    return this.prisma.bin.create({
      data: { code, warehouseId },
    });
  }

  async getBins(warehouseId: string, vendorId: string, role?: string) {
    await this.findOne(warehouseId, vendorId, role);
    return this.prisma.bin.findMany({
      where: { warehouseId },
      include: { inventory: { include: { product: true } } },
    });
  }

  async moveStockBetweenBins(
    warehouseId: string,
    vendorId: string,
    data: { productId: string; fromBinId: string; toBinId: string; quantity: number },
    performedById: string,
    role?: string,
  ) {
    await this.findOne(warehouseId, vendorId, role);

    return this.prisma.$transaction(async (tx) => {
      const source = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId_binId: {
            productId: data.productId,
            warehouseId,
            binId: data.fromBinId,
          },
        },
      });

      if (!source || source.quantity < data.quantity) {
        throw new BadRequestException('Insufficient stock in source bin');
      }

      await tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: data.quantity } },
      });

      const target = await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId_binId: {
            productId: data.productId,
            warehouseId,
            binId: data.toBinId,
          },
        },
        create: {
          productId: data.productId,
          warehouseId,
          binId: data.toBinId,
          quantity: data.quantity,
        },
        update: { quantity: { increment: data.quantity } },
      });

      await tx.stockLog.createMany({
        data: [
          {
            inventoryItemId: source.id,
            type: StockMovementType.TRANSFER,
            quantityChange: -data.quantity,
            reason: `Bin transfer ${data.fromBinId} → ${data.toBinId}`,
            performedById,
          },
          {
            inventoryItemId: target.id,
            type: StockMovementType.TRANSFER,
            quantityChange: data.quantity,
            reason: `Bin transfer ${data.fromBinId} → ${data.toBinId}`,
            performedById,
          },
        ],
      });

      if (vendorId) {
        this.notifications.emitWarehouseUpdate(vendorId, {
          warehouseId,
          action: 'BIN_TRANSFER',
        });
      }

      return { source, target };
    });
  }

  async getWarehouseStock(warehouseId: string, vendorId: string, role?: string) {
    await this.findOne(warehouseId, vendorId, role);
    return this.prisma.inventoryItem.findMany({
      where: { warehouseId },
      include: { product: true, bin: true },
      orderBy: { quantity: 'desc' },
    });
  }

  async getWarehouseUtilization(warehouseId: string, vendorId: string, role?: string) {
    const wh = await this.findOne(warehouseId, vendorId, role);
    const bins = await this.prisma.bin.findMany({
      where: { warehouseId },
      include: { inventory: true },
    });

    const totalBins = bins.length;
    const occupiedBins = bins.filter(b => b.inventory.length > 0).length;
    const totalItems = bins.reduce((sum, b) => sum + b.inventory.reduce((s, i) => s + i.quantity, 0), 0);

    return {
      warehouseId,
      name: wh.name,
      totalBins,
      occupiedBins,
      emptyBins: totalBins - occupiedBins,
      utilizationRate: totalBins > 0 ? ((occupiedBins / totalBins) * 100).toFixed(1) : '0',
      totalItems,
      bins: bins.map(b => ({
        id: b.id,
        code: b.code,
        itemCount: b.inventory.length,
        totalQuantity: b.inventory.reduce((s, i) => s + i.quantity, 0),
        status: b.inventory.length === 0 ? 'EMPTY' : b.inventory.reduce((s, i) => s + i.quantity, 0) > 50 ? 'FULL' : 'PARTIAL',
      })),
    };
  }
}
