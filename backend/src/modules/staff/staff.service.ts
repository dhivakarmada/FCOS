import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { TaskStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { StaffPerformanceService } from './staff-performance.service';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private auditLog: AuditLogService,
    private performance: StaffPerformanceService,
  ) {}

  // ── Create Staff ──
  async createStaff(data: {
    userId?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    vendorId?: string | null;
    warehouseId?: string;
    firstName: string;
    lastName: string;
    designation?: string;
    phone?: string;
  }) {
    let resolvedVendorId = data.vendorId || null;

    if (!resolvedVendorId && data.warehouseId) {
      const wh = await this.prisma.warehouse.findUnique({
        where: { id: data.warehouseId },
      });
      if (wh?.vendorId) {
        resolvedVendorId = wh.vendorId;
      }
    }

    let userId = data.userId;

    if (!userId && data.email && data.password) {
      // Create user first
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || UserRole.STAFF,
          vendorId: resolvedVendorId,
        },
      });
      userId = user.id;
    }

    if (!userId) {
      throw new BadRequestException('Either userId or email/password must be provided');
    }

    const existing = await this.prisma.staff.findUnique({
      where: { userId },
    });
    if (existing) throw new BadRequestException('Staff record already exists for this user');

    return this.prisma.staff.create({
      data: {
        userId,
        vendorId: resolvedVendorId,
        warehouseId: data.warehouseId || null,
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation || null,
        phone: data.phone || null,
      },
    });
  }

  // ── Assign Task ──
  async assignTask(staffId: string, orderId: string, taskType: string, vendorId: string, userId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, vendorId },
    });
    if (!staff) throw new NotFoundException(`Staff ${staffId} not found`);

    // Check if staff already has an active task of this type for this order
    const existing = await this.prisma.staffTask.findFirst({
      where: { staffId: staff.userId, orderId, taskType, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });
    if (existing) throw new BadRequestException(`Staff already has an active ${taskType} task for this order`);

    const task = await this.prisma.staffTask.create({
      data: {
        staffId: staff.userId,
        orderId,
        taskType,
        status: TaskStatus.PENDING,
      },
    });

    this.notifications.emitTaskAssigned(vendorId, {
      taskId: task.id,
      staffId,
      taskType,
    });

    await this.auditLog.log(userId, 'ASSIGN_TASK', 'staff', { taskId: task.id, staffId, taskType, orderId });

    return task;
  }

  // ── Complete Task ──
  async updateTaskStatus(taskId: string, status: TaskStatus, userId: string) {
    const task = await this.prisma.staffTask.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    const data: any = { status };
    if (status === TaskStatus.IN_PROGRESS && !task.startedAt) {
      data.startedAt = new Date();
    }
    if (status === TaskStatus.COMPLETED) {
      data.completedAt = new Date();

      // Trigger stats update and broadcast
      const stats = await this.performance.getStaffStats(task.staffId);
      const staff = await this.prisma.staff.findUnique({ where: { userId: task.staffId } });
      if (staff) {
        this.notifications.emitStaffStatsUpdate(staff.vendorId, {
          staffId: task.staffId,
          stats,
        });
      }
    }

    return this.prisma.staffTask.update({
      where: { id: taskId },
      data,
    });
  }

  // ── Get Staff Tasks ──
  async getStaffTasks(identifier: string, vendorId: string, status?: string, role?: string) {
    // Try to find by Staff ID first, then by User ID
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const whereStaff = isSuperAdmin 
      ? { OR: [{ id: identifier }, { userId: identifier }] }
      : { OR: [{ id: identifier, vendorId }, { userId: identifier, vendorId }] };
      
    const staff = await this.prisma.staff.findFirst({
      where: whereStaff,
    });

    if (!staff || !staff.userId) throw new NotFoundException(`Staff ${identifier} not found`);

    const where: any = { staffId: staff.userId };
    if (status) where.status = status;

    return this.prisma.staffTask.findMany({
      where,
      include: {
        order: { select: { orderNumber: true, customerName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Get Staff Performance ──
  async getStaffPerformance(vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? {} : { vendorId };
    const staffMembers = await this.prisma.staff.findMany({
      where,
      orderBy: { performance: 'desc' },
    });

    const results = [];
    for (const s of staffMembers) {
      if (!s.userId) continue;

      const [completedTasks, totalTaskCount] = await Promise.all([
        this.prisma.staffTask.findMany({
          where: { staffId: s.userId, status: TaskStatus.COMPLETED },
        }),
        this.prisma.staffTask.count({ where: { staffId: s.userId } }),
      ]);

      let avgCompletionMinutes = 0;
      let tasksWithTime = 0;

      for (const task of completedTasks) {
        if (task.startedAt && task.completedAt) {
          avgCompletionMinutes += (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 60000;
          tasksWithTime++;
        }
      }

      results.push({
        id: s.id,
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        warehouseId: s.warehouseId,
        performanceScore: s.performance,
        totalTasks: totalTaskCount,
        completedTasks: completedTasks.length,
        avgCompletionMinutes: tasksWithTime > 0 ? (avgCompletionMinutes / tasksWithTime).toFixed(1) : 'N/A',
        tasksPerDay: completedTasks.length > 0 ? (completedTasks.length / 30).toFixed(1) : '0',
      });
    }

    return results;
  }

  // ── List All Staff ──
  async findAll(vendorId: string, role?: string) {
    const where = role === 'SUPER_ADMIN' ? {} : { vendorId };
    return this.prisma.staff.findMany({
      where,
      include: {
        warehouse: { select: { name: true } },
      },
    });
  }

  async getAllTasks(vendorId: string, role?: string, taskType?: string, status?: TaskStatus) {
    const where: any = {};
    
    if (role !== 'SUPER_ADMIN' && vendorId) {
      where.order = { vendorId };
    }
    
    if (taskType) {
      where.taskType = taskType;
    }
    
    if (status) {
      where.status = status;
    }

    return this.prisma.staffTask.findMany({
      where,
      include: {
        order: {
          include: {
            shipment: true
          }
        },
        staff: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignWarehouse(staffId: string, warehouseId: string, vendorId: string, role?: string) {
    const staff = await this.prisma.staff.findFirst({
      where: role === 'SUPER_ADMIN' ? { id: staffId } : { id: staffId, vendorId },
    });
    if (!staff) throw new NotFoundException(`Staff record ${staffId} not found`);

    return this.prisma.staff.update({
      where: { id: staffId },
      data: { warehouseId: warehouseId === 'UNASSIGNED' || !warehouseId ? null : warehouseId },
    });
  }

  async updateStaff(id: string, data: {
    firstName?: string;
    lastName?: string;
    designation?: string;
    phone?: string;
    warehouseId?: string | null;
  }) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff record ${id} not found`);

    if (staff.userId && (data.firstName || data.lastName)) {
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      });
    }

    return this.prisma.staff.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        designation: data.designation,
        phone: data.phone,
        warehouseId: data.warehouseId === 'UNASSIGNED' ? null : data.warehouseId,
      },
    });
  }

  async remove(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException(`Staff record ${id} not found`);

    if (staff.userId) {
      await this.prisma.user.update({
        where: { id: staff.userId },
        data: { deletedAt: new Date() },
      });
    }

    return this.prisma.staff.delete({
      where: { id },
    });
  }
}
