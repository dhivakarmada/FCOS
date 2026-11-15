import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('automation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getRules() {
    return this.automationService.getRules();
  }

  @Post('rules')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_AUTOMATION_RULE', module: 'automation' })
  createRule(
    @Body() body: { name: string; trigger: string; condition: string; action: string },
  ) {
    return this.automationService.createRule(body);
  }

  @Post('rules/:id/toggle')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'TOGGLE_AUTOMATION_RULE', module: 'automation' })
  toggleRule(@Param('id') id: string) {
    return this.automationService.toggleRule(id);
  }

  @Post('rules/:id/dry-run')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'DRY_RUN_AUTOMATION_RULE', module: 'automation' })
  dryRun(@Param('id') id: string) {
    return this.automationService.dryRun(id);
  }

  @Delete('rules/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'DELETE_AUTOMATION_RULE', module: 'automation' })
  deleteRule(@Param('id') id: string) {
    return this.automationService.deleteRule(id);
  }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getLogs() {
    return this.automationService.getLogs();
  }
}
