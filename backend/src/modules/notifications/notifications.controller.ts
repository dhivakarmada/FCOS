import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getTemplates() {
    return this.notificationsService.getTemplates();
  }

  @Post('templates/:id/toggle-channel')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'TOGGLE_NOTIFICATION_CHANNEL', module: 'notifications' })
  toggleChannel(
    @Param('id') id: string,
    @Body('channel') channel: 'email' | 'sms' | 'whatsapp',
  ) {
    return this.notificationsService.toggleChannel(id, channel);
  }

  @Post('send-test')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'SEND_TEST_NOTIFICATION', module: 'notifications' })
  sendTestMessage(
    @Body() body: { channel: string; recipient: string; templateName: string },
  ) {
    return this.notificationsService.sendTestMessage(body);
  }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getLogs() {
    return this.notificationsService.getLogs();
  }
}
