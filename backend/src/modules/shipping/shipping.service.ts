import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';

// Mock courier data
const COURIERS = [
  { name: 'Delhivery', baseRate: 45, perKgRate: 12, estimatedDays: 5 },
  { name: 'BlueDart', baseRate: 55, perKgRate: 15, estimatedDays: 3 },
  { name: 'DTDC', baseRate: 35, perKgRate: 10, estimatedDays: 7 },
  { name: 'Ecom Express', baseRate: 40, perKgRate: 11, estimatedDays: 6 },
];

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectQueue('shipping') private shippingQueue: Queue,
    private prisma: PrismaService,
    private notifications: NotificationsGateway,
    private auditLog: AuditLogService,
  ) {}

  // ── Calculate Shipping Cost ──
  async calculateShipping(orderId: string, vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? { id: orderId } : { id: orderId, vendorId };
    const order = await this.prisma.order.findFirst({
      where,
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const totalWeight = order.items.reduce((sum, item) => sum + (item.product.weight || 0.5) * item.quantity, 0);
    const isMetro = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata'].includes(order.city || '');

    return COURIERS.map(courier => {
      const cost = courier.baseRate + courier.perKgRate * totalWeight;
      const discount = isMetro ? 0.1 : 0;
      const finalCost = Math.round(cost * (1 - discount));

      return {
        courierName: courier.name,
        estimatedCost: finalCost,
        estimatedDays: courier.estimatedDays,
        estimatedDelivery: new Date(Date.now() + courier.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: totalWeight.toFixed(2),
        isMetro,
      };
    });
  }

  // ── Assign Courier ──
  async assignCourier(orderId: string, courierName: string, vendorId: string, userId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? { id: orderId } : { id: orderId, vendorId };
    const order = await this.prisma.order.findFirst({ where });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const courier = COURIERS.find(c => c.name === courierName) || COURIERS[0];
    const trackingNumber = `TRK-${courier.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const shipment = await this.prisma.shipment.upsert({
      where: { orderId },
      create: {
        orderId,
        trackingNumber,
        courierName: courier.name,
        labelUrl: `https://fcos-labels.s3.amazonaws.com/${orderId}.pdf`,
        estimatedArrival: new Date(Date.now() + courier.estimatedDays * 24 * 60 * 60 * 1000),
      },
      update: { trackingNumber, courierName: courier.name },
    });

    await this.auditLog.log(userId, 'ASSIGN_COURIER', 'shipping', {
      orderId,
      courier: courier.name,
      tracking: trackingNumber,
    });

    return shipment;
  }

  // ── Generate Shipping Label (Queue) ──
  async generateShippingLabel(orderId: string, vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? { id: orderId } : { id: orderId, vendorId };
    const order = await this.prisma.order.findFirst({ where });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const job = await this.shippingQueue.add('generate-label', { orderId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return { jobId: job.id, message: 'Shipping label generation queued' };
  }

  // ── Track Shipment ──
  async trackShipment(orderId: string, vendorId: string, role?: string) {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const where = isSuperAdmin ? { id: orderId } : { id: orderId, vendorId };
    const order = await this.prisma.order.findFirst({
      where,
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found for this order');

    // Build mock tracking timeline
    const timeline: any[] = [];
    if (shipment.shippedAt) {
      timeline.push({ status: 'PICKED_UP', timestamp: shipment.shippedAt, location: 'Warehouse' });
      const shippedTime = new Date(shipment.shippedAt).getTime();

      // Simulate intermediate statuses
      timeline.push({
        status: 'IN_TRANSIT',
        timestamp: new Date(shippedTime + 6 * 60 * 60 * 1000),
        location: 'Regional Hub',
      });
      timeline.push({
        status: 'REACHED_DESTINATION_CITY',
        timestamp: new Date(shippedTime + 24 * 60 * 60 * 1000),
        location: order.city || 'Destination City',
      });
    }

    if (shipment.deliveredAt) {
      timeline.push({
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(new Date(shipment.deliveredAt).getTime() - 4 * 60 * 60 * 1000),
        location: order.city || 'Destination City',
      });
      timeline.push({
        status: 'DELIVERED',
        timestamp: shipment.deliveredAt,
        location: order.addressLine1 || 'Customer Address',
      });
    }

    return {
      trackingNumber: shipment.trackingNumber,
      courierName: shipment.courierName,
      labelUrl: shipment.labelUrl,
      currentStatus: shipment.deliveredAt ? 'DELIVERED' : shipment.shippedAt ? 'IN_TRANSIT' : 'PENDING',
      estimatedDelivery: shipment.estimatedArrival,
      timeline,
    };
  }

  // ── Get Shipment ──
  async getShipment(orderId: string) {
    return this.prisma.shipment.findUnique({ where: { orderId } });
  }
}
