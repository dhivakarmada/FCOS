import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AUDIT_LOG_KEY } from '../decorators/audit-log.decorator';
import { AuditLogService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditData = this.reflector.get<{ action: string; module: string }>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditData) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(() => {
        if (user) {
          this.auditLogService.log(
            user.id,
            auditData.action,
            auditData.module,
            {
              method: request.method,
              url: request.url,
              body: request.body,
              params: request.params,
            },
          );
        }
      }),
    );
  }
}
