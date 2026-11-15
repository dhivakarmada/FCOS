import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private activeUserSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async onModuleInit() {
    this.logger.log('Resetting all staff members to inactive status...');
    try {
      await this.prisma.staff.updateMany({
        data: { isActive: false },
      });
      this.logger.log('All staff members reset to inactive status.');
    } catch (e) {
      this.logger.error('Failed to reset staff status on bootstrap:', e);
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      });
      client.data.user = payload;
      const userId = payload.sub;
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      
      if (payload.role === 'SUPER_ADMIN') {
        client.join('super_admin_room');
      }
      if (payload.vendorId) {
        client.join(`vendor-${payload.vendorId}`);
      }

      // Track connection count and update isActive in DB
      let sockets = this.activeUserSockets.get(userId);
      if (!sockets) {
        sockets = new Set();
        this.activeUserSockets.set(userId, sockets);
      }
      sockets.add(client.id);

      if (sockets.size === 1) {
        const staff = await this.prisma.staff.findUnique({ where: { userId } });
        if (staff) {
          await this.prisma.staff.update({
            where: { userId },
            data: { isActive: true },
          });
          this.logger.log(`Staff ${staff.firstName} ${staff.lastName} is now ACTIVE`);
          this.notifyAll('staff-status-changed', { userId, isActive: true });
        }
      }
    } catch (e) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = client.data.user?.sub;
    if (userId) {
      const sockets = this.activeUserSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.activeUserSockets.delete(userId);
          const staff = await this.prisma.staff.findUnique({ where: { userId } });
          if (staff) {
            await this.prisma.staff.update({
              where: { userId },
              data: { isActive: false },
            });
            this.logger.log(`Staff ${staff.firstName} ${staff.lastName} is now INACTIVE`);
            this.notifyAll('staff-status-changed', { userId, isActive: false });
          }
        }
      }
    }
  }

  // ── Typed Event Emitters ──

  notifyVendor(vendorId: string, event: string, payload: any) {
    this.server.to(`vendor-${vendorId}`).emit(event, payload);
    // Broadcast all events to the super admin live feed
    this.server.to('super_admin_room').emit('live-feed', { vendorId, event, payload, timestamp: new Date() });
  }

  notifyAll(event: string, payload: any) {
    this.server.emit(event, payload);
    this.server.to('super_admin_room').emit('live-feed', { event, payload, timestamp: new Date() });
  }

  notifySuperAdmin(event: string, payload: any) {
    this.server.to('super_admin_room').emit(event, payload);
  }

  emitOrderUpdate(vendorId: string, data: { orderId: string; orderNumber: string; status: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'order-status-updated', data);
  }

  emitInventoryUpdate(vendorId: string, data: { productId: string; sku: string; quantity: number; warehouseId: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'inventory-updated', data);
  }

  emitWarehouseUpdate(vendorId: string, data: { warehouseId: string; action: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'warehouse-updated', data);
  }

  emitReturnUpdate(vendorId: string, data: { returnId: string; orderId: string; status: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'return-updated', data);
  }

  emitInvoiceGenerated(vendorId: string, data: { orderId: string; invoiceUrl: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'invoice-generated', data);
  }

  emitLowStockAlert(vendorId: string, data: { count: number; items: any[]; [key: string]: any }) {
    this.notifyVendor(vendorId, 'low-stock-alert', data);
  }

  emitTaskAssigned(vendorId: string, data: { taskId: string; staffId: string; taskType: string; [key: string]: any }) {
    this.notifyVendor(vendorId, 'task-assigned', data);
  }

  emitStaffStatsUpdate(vendorId: string, data: { staffId: string; stats: any }) {
    this.notifyVendor(vendorId, 'staff-performance-updated', data);
  }
}
