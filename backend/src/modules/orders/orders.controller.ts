import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Request, Res } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import type { Response } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get('picking-list')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  getPickingList(
    @Request() req: { user: { vendorId: string; role: string; warehouseId?: string } },
    @Query('warehouseId') warehouseId?: string,
  ) {
    const effectiveWarehouseId = warehouseId || req.user.warehouseId;
    return this.ordersService.getPickingList(req.user.vendorId, effectiveWarehouseId, req.user.role);
  }

  @Get(':id/label')
  async getLabel(
    @Request() req: { user: { vendorId: string; role: string } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const order = await this.ordersService.findOne(id, req.user.vendorId, req.user.role);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=label-${order.orderNumber}.pdf`);
      this.invoiceService.generateLabel(order, res);
    } catch (error) {
      res.status(500).send({ message: 'Error generating label', error: (error as Error).message });
    }
  }

  @Get(':id/invoice')
  async getInvoice(
    @Request() req: { user: { vendorId: string; role: string } },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const order = await this.ordersService.findOne(id, req.user.vendorId, req.user.role);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
      this.invoiceService.generateInvoice(order, res);
    } catch (error) {
      res.status(500).send({ message: 'Error generating invoice', error: (error as Error).message });
    }
  }

  @Post()
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_ORDER', module: 'orders' })
  create(
    @Request() req: { user: { vendorId: string; id: string } },
    @Body() data: { items: Array<{ productId: string; quantity: number }>; customerName: string; [key: string]: unknown },
  ) {
    return this.ordersService.create(data, req.user.vendorId, req.user.id);
  }

  @Get()
  findAll(
    @Request() req: { user: { vendorId: string; role: string } },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(req.user.vendorId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    }, req.user.role);
  }

  @Get(':id')
  findOne(
    @Request() req: { user: { vendorId: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, req.user.vendorId, req.user.role);
  }

  @Get(':id/timeline')
  getTimeline(
    @Request() req: { user: { vendorId: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderTimeline(id, req.user.vendorId, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  updateStatus(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status, req.user.vendorId, req.user.id, req.user.role);
  }

  @Post(':id/cancel')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CANCEL_ORDER', module: 'orders' })
  cancelOrder(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancelOrder(id, req.user.vendorId, req.user.id, req.user.role);
  }
}
