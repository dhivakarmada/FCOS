import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  async findAll(@Request() req) {
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return this.usersService.findAll();
    }
    return this.usersService.findAll(req.user.vendorId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'CREATE_USER', module: 'users' })
  async create(@Body() data: any) {
    return this.usersService.create(data);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'UPDATE_USER', module: 'users' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @AuditLog({ action: 'DEACTIVATE_USER', module: 'users' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('me')
  async getMe(@Request() req) {
    return this.usersService.findById(req.user.id);
  }
}
