import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLogModule } from '../audit-logs/audit-logs.module';
import { StaffPerformanceService } from './staff-performance.service';
import { StaffPerformanceController } from './staff-performance.controller';

@Module({
  imports: [NotificationsModule, AuditLogModule],
  controllers: [StaffController, StaffPerformanceController],
  providers: [StaffService, StaffPerformanceService],
  exports: [StaffService, StaffPerformanceService],
})
export class StaffModule {}
