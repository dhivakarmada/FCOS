import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class StaffPerformanceService {
  private readonly logger = new Logger(StaffPerformanceService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
  ) {}

  /**
   * Log a staff activity event (scan, confirm, error)
   */
  async logActivity(data: {
    staffId: string;
    actionType: 'PICK_SCAN' | 'PACK_CONFIRM' | 'DISPATCH_SCAN' | 'ERROR_SCAN';
    taskId?: string;
    orderId?: string;
    sku?: string;
    quantity?: number;
    isSuccess?: boolean;
    errorMessage?: string;
  }) {
    const log = await this.prisma.staffActivityLog.create({
      data: {
        staffId: data.staffId,
        actionType: data.actionType,
        taskId: data.taskId,
        orderId: data.orderId,
        sku: data.sku,
        quantity: data.quantity,
        isSuccess: data.isSuccess ?? true,
        errorMessage: data.errorMessage,
      },
    });

    // Side effect: Update staff performance real-time broadcast
    const staff = await this.prisma.staff.findUnique({ where: { userId: data.staffId } });
    if (staff) {
      const stats = await this.getStaffStats(data.staffId);
      this.notifications.emitStaffStatsUpdate(staff.vendorId, {
        staffId: data.staffId,
        stats,
      });
    }

    return log;
  }

  /**
   * Get comprehensive stats for a specific staff member
   */
  async getStaffStats(userId: string) {
    const [tasks, activityLogs] = await Promise.all([
      this.prisma.staffTask.findMany({
        where: { staffId: userId, status: 'COMPLETED' },
      }),
      this.prisma.staffActivityLog.findMany({
        where: { staffId: userId },
      }),
    ]);

    const tasksCompleted = tasks.length;
    const successfulScans = activityLogs.filter(log => log.isSuccess && log.actionType.includes('SCAN')).length;
    const totalScans = activityLogs.filter(log => log.actionType.includes('SCAN')).length;
    
    // Avg Completion Time
    let totalMinutes = 0;
    let timedTasks = 0;
    tasks.forEach(task => {
      if (task.startedAt && task.completedAt) {
        totalMinutes += (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 60000;
        timedTasks++;
      }
    });
    const avgTime = timedTasks > 0 ? totalMinutes / timedTasks : 0;

    // Accuracy
    const accuracyRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 100;
    const errorCount = activityLogs.filter(log => !log.isSuccess).length;

    // Productivity Score calculation
    // (tasksCompleted * 10) + (accuracyRate) - (avgTime * 2)
    const productivityScore = Math.max(0, (tasksCompleted * 10) + (accuracyRate) - (avgTime * 2));

    return {
      tasksCompleted,
      successfulScans,
      totalScans,
      accuracyRate: accuracyRate.toFixed(1),
      errorCount,
      avgCompletionMinutes: avgTime.toFixed(1),
      productivityScore: productivityScore.toFixed(1),
    };
  }

  /**
   * Get leaderboard for a vendor
   */
  async getLeaderboard(vendorId?: string) {
    const where = vendorId ? { vendorId } : {};
    const staffMembers = await this.prisma.staff.findMany({
      where,
    });

    const leaderboard = await Promise.all(
      staffMembers.map(async (s) => {
        if (!s.userId) return null;
        const stats = await this.getStaffStats(s.userId);
        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          ...stats,
        };
      })
    );

    return leaderboard
      .filter(Boolean)
      .sort((a: any, b: any) => parseFloat(b.productivityScore) - parseFloat(a.productivityScore));
  }
}
