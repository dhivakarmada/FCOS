import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_RBAC_ROLE', module: 'rbac' })
  createRole(@Body('roleName') roleName: string) {
    return this.rbacService.createRole(roleName);
  }

  @Post('policies/save')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'SAVE_RBAC_POLICIES', module: 'rbac' })
  savePolicies(@Body('policies') policies: Record<string, Record<string, boolean>>) {
    return this.rbacService.savePolicies(policies);
  }

  @Delete('roles/:roleName')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'DELETE_RBAC_ROLE', module: 'rbac' })
  deleteRole(@Param('roleName') roleName: string) {
    return this.rbacService.deleteRole(roleName);
  }
}
