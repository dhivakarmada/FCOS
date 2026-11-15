import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import Redis from 'ioredis';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  // ── Dashboard Metrics (Main KPIs) ──
  async getDashboardMetrics(vendorId?: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    if (!vendorId && !isSuperAdmin) {
      return {
        totalOrders: 0, ordersToday: 0, totalRevenue: 0, monthlyRevenue: 0,
        pendingShipments: 0, activeReturns: 0, lowStockCount: 0, ordersByStatus: {}
      };
    }
    const cacheKey = `analytics_v2:dashboard:${isSuperAdmin ? 'global' : vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const where = isSuperAdmin ? {} : { vendorId };
    const whereOrderReturn = isSuperAdmin ? {} : { order: { vendorId } };
    const whereWarehouse = isSuperAdmin ? {} : { warehouse: { vendorId } };

    const [
      totalOrders, ordersToday, ordersByStatus,
      revenueTotal, revenueMonth,
      pendingShipments, activeReturns, lowStockCount,
      totalStockData
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, createdAt: { gte: startOfDay(today), lte: endOfDay(today) } } }),
      this.prisma.order.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.order.aggregate({ where: { ...where, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
      this.prisma.order.aggregate({ where: { ...where, status: 'DELIVERED', createdAt: { gte: thirtyDaysAgo } }, _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { ...where, status: { in: ['CREATED', 'PACKED', 'PICKING', 'PICKED'] } } }),
      this.prisma.return.count({ where: { ...whereOrderReturn, status: { in: ['REQUESTED', 'APPROVED'] } } }),
      this.prisma.inventoryItem.count({ where: { ...whereWarehouse, quantity: { lte: 5 } } }),
      this.prisma.inventoryItem.aggregate({ where: whereWarehouse, _sum: { quantity: true } }),
    ]);

    const statusBreakdown = Object.fromEntries(ordersByStatus.map(s => [s.status, s._count]));

    const result = {
      totalOrders,
      ordersToday,
      totalRevenue: Number(revenueTotal._sum.totalAmount || 0),
      monthlyRevenue: Number(revenueMonth._sum.totalAmount || 0),
      pendingShipments,
      activeReturns,
      totalStock: Number(totalStockData._sum.quantity || 0),
      lowStockCount,
      ordersByStatus: statusBreakdown,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min cache
    return result;
  }

  // ── Delivery Stats ──
  async getDeliveryStats(vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const cacheKey = `analytics_v2:delivery:${isSuperAdmin ? 'global' : vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const statusIn: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.RETURNED];
    const where: Prisma.OrderWhereInput = isSuperAdmin 
      ? { status: { in: statusIn } } 
      : { vendorId, status: { in: statusIn } };
    const countWhere: Prisma.OrderWhereInput = isSuperAdmin ? {} : { vendorId };

    const orders = await this.prisma.order.findMany({
      where,
      include: { shipment: true },
    });

    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const totalDelivered = deliveredOrders.length;

    // Calculate average delivery time
    let totalDeliveryHours = 0;
    let deliveryTimeCount = 0;
    for (const order of deliveredOrders) {
      if (order.shipment?.shippedAt && order.shipment?.deliveredAt) {
        const hours = (new Date(order.shipment.deliveredAt).getTime() - new Date(order.shipment.shippedAt).getTime()) / (1000 * 60 * 60);
        totalDeliveryHours += hours;
        deliveryTimeCount++;
      }
    }

    const totalOrders = await this.prisma.order.count({ where: countWhere });
    const onTimeDeliveries = deliveredOrders.filter(o => {
      if (!o.shipment?.deliveredAt || !o.shipment?.estimatedArrival) return false;
      return new Date(o.shipment.deliveredAt) <= new Date(o.shipment.estimatedArrival);
    }).length;

    const result = {
      totalDelivered,
      totalOrders,
      deliverySuccessRate: totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(1) : '0',
      onTimeDeliveryRate: totalDelivered > 0 ? ((onTimeDeliveries / totalDelivered) * 100).toFixed(1) : '0',
      avgDeliveryHours: deliveryTimeCount > 0 ? (totalDeliveryHours / deliveryTimeCount).toFixed(1) : '0',
      avgDeliveryDays: deliveryTimeCount > 0 ? (totalDeliveryHours / deliveryTimeCount / 24).toFixed(1) : '0',
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    return result;
  }

  // ── Return Stats ──
  async getReturnStats(vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const cacheKey = `analytics_v2:returns:${isSuperAdmin ? 'global' : vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const whereOrder = isSuperAdmin ? {} : { vendorId };
    const whereReturn = isSuperAdmin ? {} : { order: { vendorId } };

    const [totalOrders, totalReturns, refundedAggregate, returnsByStatus, topReasonsRaw] = await Promise.all([
      this.prisma.order.count({ where: whereOrder }),
      this.prisma.return.count({ where: whereReturn }),
      this.prisma.return.aggregate({ where: { ...whereReturn, status: 'REFUNDED' }, _sum: { refundAmount: true } }),
      this.prisma.return.groupBy({ by: ['status'], where: whereReturn, _count: true }),
      this.prisma.return.groupBy({ by: ['reason'], where: whereReturn, _count: true, orderBy: { _count: { reason: 'desc' } }, take: 5 }),
    ]);

    const refundedAmount = Number(refundedAggregate._sum.refundAmount || 0);
    const topReasons = topReasonsRaw.map(r => ({ reason: r.reason || 'Unknown', count: r._count }));

    const result = {
      totalReturns,
      returnRate: totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0',
      refundedAmount,
      returnsByStatus: Object.fromEntries(returnsByStatus.map(s => [s.status, s._count])),
      topReasons,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    return result;
  }

  // ── Revenue Stats ──
  async getRevenueStats(vendorId: string, period: 'daily' | 'weekly' | 'monthly' = 'daily', role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    if (!vendorId && !isSuperAdmin) {
      return {
        period, totalRevenue: 0, totalGst: 0, totalOrders: 0, avgOrderValue: '0', breakdown: []
      };
    }
    const cacheKey = `analytics_v2:revenue:${isSuperAdmin ? 'global' : vendorId}:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const daysBack = period === 'daily' ? 30 : period === 'weekly' ? 90 : 365;
    const since = subDays(new Date(), daysBack);
    const where: Prisma.OrderWhereInput = isSuperAdmin 
      ? { status: OrderStatus.DELIVERED, createdAt: { gte: since } } 
      : { vendorId, status: OrderStatus.DELIVERED, createdAt: { gte: since } };

    const orders = await this.prisma.order.findMany({
      where,
      select: { totalAmount: true, gstAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by period
    const grouped: Record<string, { revenue: number; gst: number; count: number }> = {};
    for (const order of orders) {
      const date = new Date(order.createdAt);
      let key: string;
      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { revenue: 0, gst: 0, count: 0 };
      grouped[key].revenue += Number(order.totalAmount);
      grouped[key].gst += Number(order.gstAmount);
      grouped[key].count++;
    }

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalGst = orders.reduce((sum, o) => sum + Number(o.gstAmount), 0);

    const result = {
      period,
      totalRevenue,
      totalGst,
      totalOrders: orders.length,
      avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0',
      breakdown: Object.entries(grouped).map(([date, data]) => ({ date, ...data })),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    return result;
  }

  // ── Stock Predictions (existing, retained) ──
  async getStockPredictions(vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const cacheKey = `analytics_v2:stock:${isSuperAdmin ? 'global' : vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where = isSuperAdmin ? {} : { vendorId };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        inventory: true,
        orderItems: {
          where: { order: { createdAt: { gte: subDays(new Date(), 30) } } },
        },
      },
    });

    const result = products.map(product => {
      const totalInventory = product.inventory.reduce((sum, item) => sum + item.quantity, 0);
      const totalSoldLast30Days = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      const avgDailySales = totalSoldLast30Days / 30;
      const daysRemaining = avgDailySales > 0 ? Math.floor(totalInventory / avgDailySales) : Infinity;
      const suggestRestock = daysRemaining < 7 ? (avgDailySales * 14) - totalInventory : 0;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        currentStock: totalInventory,
        avgDailySales: avgDailySales.toFixed(2),
        daysRemaining,
        suggestedRestockQuantity: Math.max(0, Math.ceil(suggestRestock)),
      };
    });

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    return result;
  }

  // ── Vendor Performance (database aggregated) ──
  async getVendorPerformance(vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const cacheKey = `analytics_v2:perf:${isSuperAdmin ? 'global' : vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: Prisma.OrderWhereInput = isSuperAdmin ? {} : { vendorId };

    const [totalOrders, deliveredOrders, returnedOrders, revenueAggregate] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { ...where, OR: [{ status: 'RETURNED' }, { returns: { some: {} } }] } }),
      this.prisma.order.aggregate({ where: { ...where, status: 'DELIVERED' }, _sum: { totalAmount: true } }),
    ]);

    const result = {
      totalOrders,
      deliverySuccessRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : '0',
      rtoRate: totalOrders > 0 ? ((returnedOrders / totalOrders) * 100).toFixed(2) : '0',
      revenue: Number(revenueAggregate._sum.totalAmount || 0),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 1800);
    return result;
  }

  async getVendorStats(vendorId: string, role?: string) {
    return this.getDashboardMetrics(vendorId, role);
  }

  async invalidateVendorCache(vendorId: string) {
    const keys = await this.redis.keys(`analytics_v2:*:${vendorId}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
