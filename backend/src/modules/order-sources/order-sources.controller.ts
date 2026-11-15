import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrderSourcesService } from './order-sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('order-sources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderSourcesController {
  constructor(private readonly orderSourcesService: OrderSourcesService) {}

  @Get()
  @Roles(UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  getSources(@Req() req: any) {
    // If Super Admin, let's use a default vendor or parse from query. Since VENDOR_ADMIN is key here, req.user.vendorId is used.
    const vendorId = req.user.vendorId || 'demo-vendor';
    return this.orderSourcesService.getSources(vendorId);
  }

  @Post()
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'CREATE_ORDER_SOURCE', module: 'order-sources' })
  createSource(@Req() req: any, @Body() body: { name: string; type: string }) {
    return this.orderSourcesService.createSource(req.user.vendorId, body);
  }

  @Post(':id/toggle')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'TOGGLE_ORDER_SOURCE', module: 'order-sources' })
  toggleSource(@Req() req: any, @Param('id') id: string) {
    return this.orderSourcesService.toggleSource(id, req.user.vendorId);
  }

  @Post(':id/sync')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'SYNC_ORDER_SOURCE', module: 'order-sources' })
  syncSource(@Req() req: any, @Param('id') id: string) {
    return this.orderSourcesService.syncSource(id, req.user.vendorId);
  }
}
