import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getIntegrations() {
    return this.integrationsService.getIntegrations();
  }

  @Post(':id/toggle')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'TOGGLE_INTEGRATION_CONNECTION', module: 'integrations' })
  toggleIntegration(@Param('id') id: string) {
    return this.integrationsService.toggleIntegration(id);
  }

  @Post(':id/config')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CONFIGURE_INTEGRATION_API', module: 'integrations' })
  configIntegration(
    @Param('id') id: string,
    @Body() body: { apiKey: string; webhookSecret: string },
  ) {
    return this.integrationsService.configIntegration(id, body);
  }

  @Get('webhooks/logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getWebhookLogs() {
    return this.integrationsService.getWebhookLogs();
  }
}
