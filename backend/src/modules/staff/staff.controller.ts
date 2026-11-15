import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, TaskStatus } from '@prisma/client';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  @AuditLog({ action: 'CREATE_STAFF', module: 'staff' })
  createStaff(@Request() req, @Body() data: any) {
    const vendorId = req.user.role === UserRole.SUPER_ADMIN ? (data.vendorId || req.user.vendorId) : req.user.vendorId;
    return this.staffService.createStaff({ ...data, vendorId });
  }

  @Get()
  findAll(@Request() req) {
    return this.staffService.findAll(req.user.vendorId, req.user.role);
  }

  @Get('tasks/all')
  getAllTasks(
    @Request() req,
    @Query('taskType') taskType?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.staffService.getAllTasks(req.user.vendorId, req.user.role, taskType, status);
  }

  @Patch(':id/warehouse')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'ASSIGN_STAFF_WAREHOUSE', module: 'staff' })
  assignWarehouse(
    @Request() req,
    @Param('id') id: string,
    @Body('warehouseId') warehouseId: string,
  ) {
    return this.staffService.assignWarehouse(id, warehouseId, req.user.vendorId, req.user.role);
  }

  @Post(':id/assign-task')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  @AuditLog({ action: 'ASSIGN_TASK', module: 'staff' })
  assignTask(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { orderId: string; taskType: string },
  ) {
    return this.staffService.assignTask(id, body.orderId, body.taskType, req.user.vendorId, req.user.id);
  }

  @Patch('tasks/:taskId/status')
  @Roles(UserRole.WAREHOUSE_MANAGER, UserRole.STAFF)
  updateTaskStatus(
    @Request() req,
    @Param('taskId') taskId: string,
    @Body('status') status: TaskStatus,
  ) {
    return this.staffService.updateTaskStatus(taskId, status, req.user.id);
  }

  @Get(':id/tasks')
  getStaffTasks(
    @Request() req,
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.staffService.getStaffTasks(id, req.user.vendorId, status, req.user.role);
  }

  @Get('performance/all')
  @Roles(UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPER_ADMIN)
  getPerformance(@Request() req) {
    return this.staffService.getStaffPerformance(req.user.vendorId, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN, UserRole.WAREHOUSE_MANAGER)
  @AuditLog({ action: 'UPDATE_STAFF', module: 'staff' })
  updateStaff(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.staffService.updateStaff(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.VENDOR_ADMIN)
  @AuditLog({ action: 'DELETE_STAFF', module: 'staff' })
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}
