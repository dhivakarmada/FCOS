import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';
export const AuditLog = (data: { action: string; module: string }) =>
  SetMetadata(AUDIT_LOG_KEY, data);
