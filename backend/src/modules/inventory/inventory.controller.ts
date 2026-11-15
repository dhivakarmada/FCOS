import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, StockMovementType } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('products')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'CREATE_PRODUCT', module: 'inventory' })
  createProduct(@Request() req, @Body() data: any) {
    return this.inventoryService.createProduct(req.user.vendorId, data);
  }

  @Post('products/bulk')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'BULK_CREATE_PRODUCTS', module: 'inventory' })
  bulkCreateProducts(@Request() req, @Body() body: { products: any[]; vendorId?: string }) {
    const vendorId = req.user.role === UserRole.SUPER_ADMIN ? (body.vendorId || req.user.vendorId) : req.user.vendorId;
    return this.inventoryService.bulkCreateProducts(vendorId, body.products, req.user.id);
  }

  @Get('products')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  findAllProducts(@Request() req) {
    const isAdmin = req.user.role === UserRole.SUPER_ADMIN;
    return this.inventoryService.findAllProducts(req.user.vendorId, isAdmin);
  }

  @Get('products/:sku')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getProductBySKU(@Request() req, @Param('sku') sku: string) {
    const isAdmin = req.user.role === UserRole.SUPER_ADMIN;
    return this.inventoryService.findProductBySku(req.user.vendorId, sku, isAdmin);
  }

  @Put('products/:id')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'UPDATE_PRODUCT', module: 'inventory' })
  updateProduct(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateProduct(req.user.vendorId, id, data);
  }

  @Delete('products/:id')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'DELETE_PRODUCT', module: 'inventory' })
  deleteProduct(@Request() req, @Param('id') id: string) {
    return this.inventoryService.deleteProduct(req.user.vendorId, id);
  }

  @Get('products/:id/history')
  getInventoryHistory(@Param('id') id: string) {
    return this.inventoryService.getInventoryHistory(id);
  }

  @Post('stock/update')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'UPDATE_STOCK', module: 'inventory' })
  updateStock(
    @Request() req,
    @Body() body: {
      productId: string;
      warehouseId: string;
      binId: string;
      change: number;
      type: StockMovementType;
      reason: string;
      batchNumber?: string;
      expiryDate?: Date;
    },
  ) {
    const vendorId = req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.vendorId;
    return this.inventoryService.updateStock(
      body.productId, body.warehouseId, body.binId,
      body.change, body.type, body.reason, req.user.id,
      body.batchNumber, body.expiryDate, vendorId,
    );
  }

  @Post('stock/transfer')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'TRANSFER_STOCK', module: 'inventory' })
  transferStock(
    @Request() req,
    @Body() body: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      fromBinId: string;
      toBinId: string;
      quantity: number;
    },
  ) {
    const vendorId = req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.vendorId;
    return this.inventoryService.transferStock(
      body.productId, body.fromWarehouseId, body.toWarehouseId,
      body.fromBinId, body.toBinId, body.quantity, req.user.id,
      vendorId,
    );
  }

  @Post('scan-in')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  @AuditLog({ action: 'SCAN_IN', module: 'inventory' })
  scanIn(
    @Request() req,
    @Body() body: { barcode: string; quantity: number; warehouseId: string; binId: string; reason?: string },
  ) {
    return this.inventoryService.scanIn(req.user.vendorId, body, req.user.id);
  }

  @Post('scan-out')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'SCAN_OUT', module: 'inventory' })
  scanOut(
    @Request() req,
    @Body() body: { barcode: string; quantity: number; orderId: string },
  ) {
    return this.inventoryService.scanOut(req.user.vendorId, body, req.user.id);
  }

  @Get('low-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getLowStock(@Request() req) {
    const isAdmin = req.user.role === UserRole.SUPER_ADMIN;
    return this.inventoryService.getLowStockItems(req.user.vendorId, isAdmin);
  }

  @Get('predictions')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getPredictions(@Request() req) {
    const isAdmin = req.user.role === UserRole.SUPER_ADMIN;
    return this.inventoryService.getPredictions(req.user.vendorId, isAdmin);
  }
}
