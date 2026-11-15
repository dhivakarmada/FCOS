import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    @InjectQueue('orders') private ordersQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async getHealth() {
    let dbStatus = 'down';
    let redisStatus = 'down';
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (e) {
      this.logger.error('DB Health check failed', e);
    }

    try {
      const ping = await this.redis.ping();
      if (ping === 'PONG') redisStatus = 'up';
    } catch (e) {
      this.logger.error('Redis Health check failed', e);
    }

    return {
      status: dbStatus === 'up' && redisStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus },
        redis: { status: redisStatus },
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      }
    };
  }

  async getQueues() {
    const ordersCounts = await this.ordersQueue.getJobCounts();
    const notifCounts = await this.notificationsQueue.getJobCounts();

    return {
      orders: ordersCounts,
      notifications: notifCounts,
      totalPending: ordersCounts.waiting + notifCounts.waiting,
      totalFailed: ordersCounts.failed + notifCounts.failed,
    };
  }

  async retryFailedJobs() {
    const [ordersFailed, notifFailed] = await Promise.all([
      this.ordersQueue.getFailed(),
      this.notificationsQueue.getFailed()
    ]);

    let count = 0;
    for (const job of ordersFailed) {
      await job.retry();
      count++;
    }
    for (const job of notifFailed) {
      await job.retry();
      count++;
    }

    return { message: `Retried ${count} failed jobs`, count };
  }

  async getGlobalKPIs() {
    // Aggregates across ALL vendors for the Super Admin
    const [
      totalVendors,
      totalOrders,
      totalRevenue,
      totalReturns,
    ] = await Promise.all([
      this.prisma.vendor.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'DELIVERED' } }),
      this.prisma.return.count(),
    ]);

    return {
      totalVendors,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      deliverySuccessRate: totalOrders > 0 ? (((totalOrders - totalReturns) / totalOrders) * 100).toFixed(1) : '0',
      returnRate: totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0',
    };
  }
}
