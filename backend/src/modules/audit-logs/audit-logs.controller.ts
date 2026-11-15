import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  getLogs(@Request() req) {
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.auditLogService.findAllGlobal().then(res => res.logs);
    }
    return this.auditLogService.findAll(req.user.vendorId);
  }

  @Get('global')
  @Roles(UserRole.SUPER_ADMIN)
  getGlobalLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.findAllGlobal(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50
    );
  }
}

