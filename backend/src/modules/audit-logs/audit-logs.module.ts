import { Module, Global } from '@nestjs/common';
import { AuditLogService } from './audit-logs.service';
import { AuditLogController } from './audit-logs.controller';

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
