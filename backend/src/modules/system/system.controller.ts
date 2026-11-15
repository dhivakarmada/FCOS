import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  @Roles(UserRole.SUPER_ADMIN)
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('queues')
  @Roles(UserRole.SUPER_ADMIN)
  getQueues() {
    return this.systemService.getQueues();
  }

  @Post('queues/retry')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'RETRY_FAILED_JOBS', module: 'system' })
  retryFailedJobs() {
    return this.systemService.retryFailedJobs();
  }

  @Get('kpis')
  @Roles(UserRole.SUPER_ADMIN)
  getGlobalKPIs() {
    return this.systemService.getGlobalKPIs();
  }
}
