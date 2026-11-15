import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('developer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get('keys')
  @Roles(UserRole.VENDOR_ADMIN)
  getApiKeys(@Req() req: any) {
    return this.developerService.getApiKeys(req.user.vendorId);
  }

  @Post('keys/rotate')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'ROTATE_API_KEYS', module: 'developer' })
  rotateKeys(@Req() req: any) {
    return this.developerService.rotateKeys(req.user.vendorId);
  }

  @Get('webhooks')
  @Roles(UserRole.VENDOR_ADMIN)
  getWebhookEndpoints(@Req() req: any) {
    return this.developerService.getWebhookEndpoints(req.user.vendorId);
  }

  @Post('webhooks')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'CREATE_WEBHOOK_ENDPOINT', module: 'developer' })
  createWebhookEndpoint(@Req() req: any, @Body() body: { url: string; events: string[] }) {
    return this.developerService.createWebhookEndpoint(req.user.vendorId, body);
  }

  @Delete('webhooks/:id')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'DELETE_WEBHOOK_ENDPOINT', module: 'developer' })
  deleteWebhookEndpoint(@Req() req: any, @Param('id') id: string) {
    return this.developerService.deleteWebhookEndpoint(id, req.user.vendorId);
  }

  @Get('webhooks/logs')
  @Roles(UserRole.VENDOR_ADMIN)
  getWebhookLogs(@Req() req: any) {
    return this.developerService.getWebhookLogs(req.user.vendorId);
  }

  @Post('webhooks/:id/test')
  @Roles(UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'TEST_WEBHOOK_ENDPOINT', module: 'developer' })
  testWebhook(@Req() req: any, @Param('id') id: string) {
    return this.developerService.testWebhook(id, req.user.vendorId);
  }
}
