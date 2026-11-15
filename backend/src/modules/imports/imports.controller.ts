import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('orders')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'IMPORT_BULK_ORDERS', module: 'imports' })
  validateAndImport(
    @Req() req: any,
    @Body() body: { records: any[]; mappings: any }
  ) {
    return this.importsService.validateAndImport(req.user.vendorId, req.user.id, body);
  }
}
