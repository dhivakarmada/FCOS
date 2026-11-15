import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, StockMovementType, OrderStatus } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

import { StaffPerformanceService } from '../staff/staff-performance.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private performance: StaffPerformanceService,
  ) {}

  async createProduct(vendorId: string, data: any) {
    if (data.price !== undefined && Number(data.price) <= 0) {
      throw new BadRequestException('Product price must be greater than 0');
    }
    return this.prisma.product.create({
      data: {
        ...data,
        vendorId,
      },
    });
  }

  async bulkCreateProducts(vendorId: string, products: any[], performedById: string) {
    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required for product import');
    }
    
    let created = 0;
    let updated = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const p of products) {
        if (!p.sku || !p.name) {
          throw new BadRequestException('SKU and Name are required for all products');
        }

        // Check if product exists beforehand
        const existed = await tx.product.findFirst({
          where: { vendorId, sku: p.sku }
        });

        // 1. Upsert product
        const product = await tx.product.upsert({
          where: {
            vendorId_sku: {
              vendorId,
              sku: p.sku,
            },
          },
          create: {
            sku: p.sku,
            name: p.name,
            description: p.description || null,
            category: p.category || null,
            price: new Prisma.Decimal(p.price || 0),
            weight: p.weight ? parseFloat(p.weight) : null,
            barcode: p.barcode || null,
            vendorId,
          },
          update: {
            name: p.name,
            description: p.description !== undefined ? p.description : undefined,
            category: p.category !== undefined ? p.category : undefined,
            price: p.price !== undefined ? new Prisma.Decimal(p.price) : undefined,
            weight: p.weight !== undefined ? parseFloat(p.weight) : undefined,
            barcode: p.barcode !== undefined ? p.barcode : undefined,
            deletedAt: null, // restore if deleted
          },
        });

        if (existed && existed.deletedAt === null) {
          updated++;
        } else {
          created++;
        }

        // 2. If quantity is specified, add stock
        const rawQuantity = p.quantity !== undefined ? p.quantity : (p.stock !== undefined ? p.stock : 0);
        const quantity = parseInt(rawQuantity, 10);
        
        if (quantity > 0) {
          // Find or create warehouse
          let warehouse = null;
          const warehouseName = p.warehouse || p.warehouseName || 'Default Warehouse';
          
          warehouse = await tx.warehouse.findFirst({
            where: { vendorId, name: warehouseName, deletedAt: null }
          });

          if (!warehouse) {
            warehouse = await tx.warehouse.create({
              data: {
                name: warehouseName,
                location: p.warehouseLocation || 'Main Hub',
                vendorId,
              }
            });
          }

          // Find or create bin
          let bin = null;
          const binCode = p.bin || p.binCode || 'A-01-01';
          
          bin = await tx.bin.findFirst({
            where: { warehouseId: warehouse.id, code: binCode }
          });

          if (!bin) {
            bin = await tx.bin.create({
              data: {
                code: binCode,
                warehouseId: warehouse.id,
              }
            });
          }

          // Upsert inventory item and log stock movement
          const inventoryItem = await tx.inventoryItem.upsert({
            where: {
              productId_warehouseId_binId: {
                productId: product.id,
                warehouseId: warehouse.id,
                binId: bin.id,
              }
            },
            create: {
              productId: product.id,
              warehouseId: warehouse.id,
              binId: bin.id,
              quantity,
              minStock: p.minStock ? parseInt(p.minStock, 10) : 5,
            },
            update: {
              quantity: { increment: quantity },
              minStock: p.minStock ? parseInt(p.minStock, 10) : undefined,
            }
          });

          await tx.stockLog.create({
            data: {
              inventoryItemId: inventoryItem.id,
              type: StockMovementType.INBOUND,
              quantityChange: quantity,
              reason: 'Bulk Import',
              performedById,
            }
          });
        }
      }
    });

    return { success: true, created, updated };
  }

  async findAllProducts(vendorId: string, isAdmin: boolean = false) {
    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (!isAdmin) {
      where.vendorId = vendorId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        inventory: {
          include: { warehouse: true, bin: true },
        },
        vendor: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map(p => ({
      ...p,
      price: Number(p.price),
    }));
  }

  async updateProduct(vendorId: string, productId: string, data: any) {
    if (data.price !== undefined && Number(data.price) <= 0) {
      throw new BadRequestException('Product price must be greater than 0');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    return this.prisma.product.update({ where: { id: productId }, data });
  }

  async deleteProduct(vendorId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    return this.prisma.product.update({ where: { id: productId }, data: { deletedAt: new Date() } });
  }

  async getInventoryHistory(productId: string) {
    return this.prisma.stockLog.findMany({
      where: { inventoryItem: { productId } },
      include: {
        inventoryItem: { include: { warehouse: true, bin: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findProductBySku(vendorId: string, sku: string, isAdmin: boolean = false) {
    const where = isAdmin ? { sku, deletedAt: null } : { vendorId, sku, deletedAt: null };
    const product = await this.prisma.product.findFirst({
      where,
      include: {
        inventory: {
          include: {
            warehouse: true,
            bin: true,
          }
        }
      }
    });
    if (!product) return null;
    return { ...product, price: Number(product.price) };
  }

  async findProductByBarcode(vendorId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { 
        OR: [
          { barcode, vendorId },
          { sku: barcode, vendorId }
        ],
        deletedAt: null 
      },
      include: {
        inventory: { include: { warehouse: true, bin: true } }
      }
    });
    if (!product) throw new NotFoundException(`Product with barcode/SKU ${barcode} not found`);
    return { ...product, price: Number(product.price) };
  }

  async scanIn(
    vendorId: string,
    data: { barcode: string; quantity: number; warehouseId: string; binId: string; reason?: string },
    performedById: string
  ) {
    try {
      const product = await this.findProductByBarcode(vendorId, data.barcode);
      
      const inventory = await this.updateStock(
        product.id,
        data.warehouseId,
        data.binId,
        data.quantity,
        StockMovementType.INBOUND,
        data.reason || 'Barcode Scan Inbound',
        performedById
      );

      // Log Performance
      await this.performance.logActivity({
        staffId: performedById,
        actionType: 'PICK_SCAN', // Using PICK_SCAN as generic inbound scan for now
        sku: product.sku,
        quantity: data.quantity,
        isSuccess: true
      });

      // Emit Real-time Event
      this.notifications.emitInventoryUpdate(vendorId, {
        productId: product.id,
        sku: product.sku,
        quantity: inventory.quantity,
        warehouseId: data.warehouseId
      });

      return { product, inventory };
    } catch (error) {
      // Log Failure
      await this.performance.logActivity({
        staffId: performedById,
        actionType: 'ERROR_SCAN',
        sku: data.barcode,
        isSuccess: false,
        errorMessage: error.message
      });
      throw error;
    }
  }

  async scanOut(
    vendorId: string,
    data: { barcode: string; quantity: number; orderId: string },
    performedById: string
  ) {
    try {
      const product = await this.findProductByBarcode(vendorId, data.barcode);
      
      const order = await this.prisma.order.findFirst({
        where: { id: data.orderId, vendorId, deletedAt: null }
      });
      if (!order) {
        throw new BadRequestException(`Order ${data.orderId} not found or does not belong to this vendor`);
      }

      const orderItem = await this.prisma.orderItem.findFirst({
        where: { orderId: data.orderId, productId: product.id }
      });

      if (!orderItem) {
        throw new BadRequestException(`Product ${product.sku} is not part of Order ${data.orderId}`);
      }

      // Find stock item: prioritize the one with reservations
      const itemWithStock = await this.prisma.inventoryItem.findFirst({
        where: { productId: product.id, quantity: { gte: data.quantity } },
        orderBy: { reservedQuantity: 'desc' },
      });

      if (!itemWithStock) {
        throw new BadRequestException(`Insufficient stock for ${product.sku} in any bin`);
      }

      // Fulfill the reservation: decrement physical quantity AND release matching reservation
      const reservedDec = Math.min(itemWithStock.reservedQuantity, data.quantity);
      const inventory = await this.prisma.inventoryItem.update({
        where: { id: itemWithStock.id },
        data: {
          quantity: { decrement: data.quantity },
          reservedQuantity: { decrement: reservedDec },
        },
      });

      await this.prisma.stockLog.create({
        data: {
          inventoryItemId: itemWithStock.id,
          type: StockMovementType.OUTBOUND,
          quantityChange: -data.quantity,
          reason: `Picked & Scanned Out for Order ${order.orderNumber}`,
          performedById,
        },
      });

      // Log Performance
      await this.performance.logActivity({
        staffId: performedById,
        actionType: 'PICK_SCAN',
        orderId: data.orderId,
        sku: product.sku,
        quantity: data.quantity,
        isSuccess: true
      });

      this.notifications.emitInventoryUpdate(vendorId, {
        productId: product.id,
        sku: product.sku,
        quantity: inventory.quantity,
        warehouseId: itemWithStock.warehouseId
      });

      this.notifications.emitOrderUpdate(vendorId, {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
        status: 'PICKING'
      });

      return { product, inventory };
    } catch (error) {
      // Log Failure
      await this.performance.logActivity({
        staffId: performedById,
        actionType: 'ERROR_SCAN',
        orderId: data.orderId,
        sku: data.barcode,
        isSuccess: false,
        errorMessage: (error as Error).message
      });
      throw error;
    }
  }

  async updateStock(
    productId: string,
    warehouseId: string,
    binId: string,
    quantityChange: number,
    type: StockMovementType,
    reason: string,
    performedById: string,
    batchNumber?: string,
    expiryDate?: Date,
    vendorId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Tenant ownership check
      if (vendorId) {
        const product = await tx.product.findFirst({
          where: { id: productId, vendorId, deletedAt: null },
        });
        if (!product) throw new BadRequestException(`Product ${productId} does not belong to vendor`);

        const warehouse = await tx.warehouse.findFirst({
          where: { id: warehouseId, vendorId, deletedAt: null },
        });
        if (!warehouse) throw new BadRequestException(`Warehouse ${warehouseId} does not belong to vendor`);
      }

      const inventoryItem = await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId_binId: {
            productId,
            warehouseId,
            binId,
          }
        },
        create: {
          productId,
          warehouseId,
          binId,
          quantity: quantityChange > 0 ? quantityChange : 0,
          batchNumber,
          expiryDate,
        },
        update: {
          quantity: { increment: quantityChange },
          batchNumber: batchNumber || undefined,
          expiryDate: expiryDate || undefined,
        }
      });

      if (inventoryItem.quantity < 0) {
        throw new BadRequestException('Insufficient stock after update');
      }

      await tx.stockLog.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type,
          quantityChange,
          reason,
          performedById,
        }
      });

      return inventoryItem;
    });
  }

  async transferStock(
    productId: string,
    fromWarehouseId: string,
    toWarehouseId: string,
    fromBinId: string,
    toBinId: string,
    quantity: number,
    performedById: string,
    vendorId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Tenant ownership check
      if (vendorId) {
        const product = await tx.product.findFirst({
          where: { id: productId, vendorId, deletedAt: null },
        });
        if (!product) throw new BadRequestException(`Product ${productId} does not belong to vendor`);

        const fromWh = await tx.warehouse.findFirst({
          where: { id: fromWarehouseId, vendorId, deletedAt: null },
        });
        if (!fromWh) throw new BadRequestException(`Source warehouse ${fromWarehouseId} does not belong to vendor`);

        const toWh = await tx.warehouse.findFirst({
          where: { id: toWarehouseId, vendorId, deletedAt: null },
        });
        if (!toWh) throw new BadRequestException(`Destination warehouse ${toWarehouseId} does not belong to vendor`);
      }

      const sourceItem = await tx.inventoryItem.findUnique({
        where: {
          productId_warehouseId_binId: {
            productId,
            warehouseId: fromWarehouseId,
            binId: fromBinId
          }
        }
      });

      if (!sourceItem || sourceItem.quantity < quantity) {
        throw new BadRequestException('Insufficient stock in source bin');
      }

      await tx.inventoryItem.update({
        where: { id: sourceItem.id },
        data: { quantity: { decrement: quantity } }
      });

      const targetItem = await tx.inventoryItem.upsert({
        where: {
          productId_warehouseId_binId: {
            productId,
            warehouseId: toWarehouseId,
            binId: toBinId
          }
        },
        create: {
          productId,
          warehouseId: toWarehouseId,
          binId: toBinId,
          quantity
        },
        update: {
          quantity: { increment: quantity }
        }
      });

      await tx.stockLog.createMany({
        data: [
          {
            inventoryItemId: sourceItem.id,
            type: StockMovementType.TRANSFER,
            quantityChange: -quantity,
            reason: `Transfer to WH ${toWarehouseId} Bin ${toBinId}`,
            performedById
          },
          {
            inventoryItemId: targetItem.id,
            type: StockMovementType.TRANSFER,
            quantityChange: quantity,
            reason: `Transfer from WH ${fromWarehouseId} Bin ${fromBinId}`,
            performedById
          }
        ]
      });

      return { sourceItem, targetItem };
    });
  }

  async getLowStockItems(vendorId: string, isAdmin: boolean = false) {
    const where = isAdmin || !vendorId ? {} : { warehouse: { vendorId } };
    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: { product: true, warehouse: true }
    });
    return items.filter(item => item.quantity <= item.minStock);
  }

  async getPredictions(vendorId: string, isAdmin: boolean = false) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const where = isAdmin || !vendorId ? {} : { warehouse: { vendorId } };
    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
        logs: {
          where: {
            type: StockMovementType.OUTBOUND,
            createdAt: { gte: thirtyDaysAgo }
          }
        }
      }
    });

    return items.map(item => {
      const totalOutbound = item.logs.reduce((sum, log) => sum + Math.abs(log.quantityChange), 0);
      const dailyVelocity = totalOutbound / 30;
      const stockoutDays = dailyVelocity > 0 ? Math.floor(item.quantity / dailyVelocity) : null;
      const suggestedReorder = dailyVelocity > 0 ? Math.ceil(dailyVelocity * 30) - item.quantity : 0;

      return {
        id: item.id,
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        currentStock: item.quantity,
        dailyVelocity: dailyVelocity.toFixed(2),
        stockoutDays,
        isWarning: stockoutDays !== null && stockoutDays <= 5,
        suggestedReorder: suggestedReorder > 0 ? suggestedReorder : 0
      };
    }).sort((a, b) => {
      if (a.stockoutDays === null) return 1;
      if (b.stockoutDays === null) return -1;
      return a.stockoutDays - b.stockoutDays;
    });
  }
}
