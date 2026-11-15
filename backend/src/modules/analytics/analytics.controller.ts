import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly searchService: SearchService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN, UserRole.STAFF)
  getDashboard(@Request() req: any) {
    return this.analyticsService.getDashboardMetrics(req.user.vendorId, req.user.role);
  }

  @Get('delivery')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getDeliveryStats(@Request() req: any) {
    return this.analyticsService.getDeliveryStats(req.user.vendorId, req.user.role);
  }

  @Get('returns')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getReturnStats(@Request() req: any) {
    return this.analyticsService.getReturnStats(req.user.vendorId, req.user.role);
  }

  @Get('revenue')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)
  getRevenueStats(
    @Request() req: any,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.analyticsService.getRevenueStats(req.user.vendorId, period, req.user.role);
  }

  @Get('performance')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getPerformance(@Request() req: any) {
    return this.analyticsService.getVendorPerformance(req.user.vendorId, req.user.role);
  }

  @Get('predictions')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getPredictions(@Request() req: any) {
    return this.analyticsService.getStockPredictions(req.user.vendorId, req.user.role);
  }

  @Get('search')
  globalSearch(@Request() req: any, @Query('q') q: string) {
    return this.searchService.globalSearch(q, req.user.vendorId, req.user.role);
  }
}
