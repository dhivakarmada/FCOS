import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_VENDOR', module: 'vendors' })
  create(@Body() data: any) {
    return this.vendorsService.create(data);
  }

  @Post('onboard')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'ONBOARD_VENDOR', module: 'vendors' })
  onboardVendor(@Body() data: any) {
    return this.vendorsService.onboardVendor(data);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.vendorsService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  findOne(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.vendorId !== id) {
      throw new ForbiddenException('You do not have permission to access this vendor');
    }
    return this.vendorsService.findOne(id);
  }

  @Get(':id/dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  getDashboard(@Request() req, @Param('id') id: string) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.vendorId !== id) {
      throw new ForbiddenException('You do not have permission to access this vendor dashboard');
    }
    return this.vendorsService.getVendorDashboard(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'UPDATE_VENDOR', module: 'vendors' })
  update(@Request() req, @Param('id') id: string, @Body() data: any) {
    if (req.user.role !== UserRole.SUPER_ADMIN && req.user.vendorId !== id) {
      throw new ForbiddenException('You do not have permission to modify this vendor');
    }
    return this.vendorsService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'DEACTIVATE_VENDOR', module: 'vendors' })
  deactivate(@Param('id') id: string) {
    return this.vendorsService.deactivateVendor(id);
  }

  @Get('intelligence/rankings')
  @Roles(UserRole.SUPER_ADMIN)
  getIntelligence() {
    return this.vendorsService.getVendorIntelligence();
  }

  @Post(':id/toggle-status')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'TOGGLE_VENDOR_STATUS', module: 'vendors' })
  async toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.vendorsService.update(id, { isActive });
  }
}
