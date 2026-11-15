import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { StaffPerformanceService } from './staff-performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('staff/performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffPerformanceController {
  constructor(private readonly performanceService: StaffPerformanceService) {}

  @Get('leaderboard')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  async getLeaderboard(@Request() req) {
    return this.performanceService.getLeaderboard(req.user.vendorId);
  }

  @Get('my-stats')
  @Roles(UserRole.STAFF)
  async getMyStats(@Request() req) {
    return this.performanceService.getStaffStats(req.user.id);
  }

  @Get(':userId/stats')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.VENDOR_ADMIN, UserRole.SUPER_ADMIN)
  async getStaffStats(@Param('userId') userId: string) {
    return this.performanceService.getStaffStats(userId);
  }
}
