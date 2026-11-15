import { Controller, Get, Post, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  requestReturn(
    @Request() req: { user: { vendorId: string; id: string } },
    @Body() body: { orderId: string; reason: string },
  ) {
    return this.returnsService.requestReturn(body.orderId, body.reason, req.user.vendorId, req.user.id);
  }

  @Get()
  findAll(
    @Request() req: { user: { vendorId: string; role: string } },
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.returnsService.findAll(req.user.vendorId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    }, req.user.role);
  }

  @Get(':id')
  findOne(
    @Request() req: { user: { vendorId: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.returnsService.findOne(id, req.user.vendorId, req.user.role);
  }

  @Post(':id/approve')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  approveReturn(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.returnsService.approveReturn(id, req.user.vendorId, req.user.id, req.user.role);
  }

  /**
   * POST /returns/:id/receive
   * Called when warehouse staff physically receives the returned goods.
   * qcResult: 'PASS' → restock inventory (ONCE). 'FAIL' → scrap, do not restock.
   * This is the ONLY place inventory is restocked for returns.
   */
  @Post(':id/receive')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  receiveReturn(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
    @Body('qcResult') qcResult: 'PASS' | 'FAIL',
  ) {
    if (!qcResult || !['PASS', 'FAIL'].includes(qcResult)) {
      return { error: 'qcResult must be PASS or FAIL' };
    }
    return this.returnsService.receiveReturn(id, req.user.vendorId, req.user.id, qcResult, req.user.role);
  }

  @Post(':id/reject')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  rejectReturn(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.returnsService.rejectReturn(id, req.user.vendorId, req.user.id, req.user.role);
  }

  @Post(':id/refund')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  processRefund(
    @Request() req: { user: { vendorId: string; id: string; role: string } },
    @Param('id') id: string,
  ) {
    return this.returnsService.processRefund(id, req.user.vendorId, req.user.id, req.user.role);
  }
}
