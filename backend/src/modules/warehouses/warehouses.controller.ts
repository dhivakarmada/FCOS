import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'CREATE_WAREHOUSE', module: 'warehouses' })
  create(@Request() req, @Body() data: { name: string; location: string; vendorId?: string }) {
    const vendorId = req.user.role === UserRole.SUPER_ADMIN ? (data.vendorId || req.user.vendorId) : req.user.vendorId;
    return this.warehousesService.create(vendorId, data);
  }

  @Get()
  findAll(@Request() req) {
    return this.warehousesService.findAll(req.user.vendorId, req.user.role);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.warehousesService.findOne(id, req.user.vendorId, req.user.role);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'UPDATE_WAREHOUSE', module: 'warehouses' })
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.warehousesService.update(id, req.user.vendorId, data, req.user.role);
  }

  @Post(':id/bins')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_BIN', module: 'warehouses' })
  createBin(@Request() req, @Param('id') id: string, @Body('code') code: string) {
    return this.warehousesService.createBin(id, req.user.vendorId, code, req.user.role);
  }

  @Get(':id/bins')
  getBins(@Request() req, @Param('id') id: string) {
    return this.warehousesService.getBins(id, req.user.vendorId, req.user.role);
  }

  @Post(':id/move-stock')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'MOVE_STOCK', module: 'warehouses' })
  moveStock(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { productId: string; fromBinId: string; toBinId: string; quantity: number },
  ) {
    return this.warehousesService.moveStockBetweenBins(id, req.user.vendorId, data, req.user.id, req.user.role);
  }

  @Get(':id/stock')
  getStock(@Request() req, @Param('id') id: string) {
    return this.warehousesService.getWarehouseStock(id, req.user.vendorId, req.user.role);
  }

  @Get(':id/utilization')
  getUtilization(@Request() req, @Param('id') id: string) {
    return this.warehousesService.getWarehouseUtilization(id, req.user.vendorId, req.user.role);
  }
}
