import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';

@Injectable()
export class VendorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admin can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return next.handle();
    }

    // For other roles, ensure vendorId is present and injected into the request
    // This can be used by services/repositories to filter queries
    if (!user.vendorId) {
      throw new UnauthorizedException('User is not associated with any vendor');
    }

    // Inject vendorId into the request object for easy access in controllers
    request.vendorId = user.vendorId;

    return next.handle();
  }
}
