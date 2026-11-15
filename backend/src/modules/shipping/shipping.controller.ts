import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get(':orderId/calculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.STAFF)
  calculateShipping(@Request() req, @Param('orderId') orderId: string) {
    return this.shippingService.calculateShipping(orderId, req.user.vendorId, req.user.role);
  }

  @Post(':orderId/assign-courier')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'ASSIGN_COURIER', module: 'shipping' })
  assignCourier(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body('courierName') courierName: string,
  ) {
    return this.shippingService.assignCourier(orderId, courierName, req.user.vendorId, req.user.id, req.user.role);
  }

  @Post(':orderId/generate-label')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'GENERATE_LABEL', module: 'shipping' })
  generateLabel(@Request() req, @Param('orderId') orderId: string) {
    return this.shippingService.generateShippingLabel(orderId, req.user.vendorId, req.user.role);
  }

  @Get(':orderId/track')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.STAFF)
  trackShipment(@Request() req, @Param('orderId') orderId: string) {
    return this.shippingService.trackShipment(orderId, req.user.vendorId, req.user.role);
  }
}
