import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrderSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSources(vendorId: string) {
    let sources = await this.prisma.orderSource.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'asc' },
    });

    // If no sources exist, seed default sources for a clean prototype out-of-the-box experience
    if (sources.length === 0) {
      await this.prisma.orderSource.createMany({
        data: [
          {
            name: 'Shopify Store Connector',
            type: 'SHOPIFY',
            status: 'CONNECTED',
            lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
            ordersReceived: 24,
            syncHealth: 98,
            apiHealth: 100,
            vendorId,
          },
          {
            name: 'Amazon Seller Channel',
            type: 'AMAZON',
            status: 'CONNECTED',
            lastSync: new Date(Date.now() - 4 * 3600 * 1000), // 4 hours ago
            ordersReceived: 182,
            syncHealth: 95,
            apiHealth: 92,
            vendorId,
          },
          {
            name: 'WooCommerce Connector',
            type: 'WOOCOMMERCE',
            status: 'DISCONNECTED',
            ordersReceived: 0,
            syncHealth: 100,
            apiHealth: 100,
            vendorId,
          },
          {
            name: 'SAP ERP Integration',
            type: 'ERP',
            status: 'DISCONNECTED',
            ordersReceived: 0,
            syncHealth: 100,
            apiHealth: 100,
            vendorId,
          }
        ]
      });

      sources = await this.prisma.orderSource.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return sources;
  }

  async createSource(vendorId: string, data: { name: string; type: string }) {
    return this.prisma.orderSource.create({
      data: {
        name: data.name,
        type: data.type,
        status: 'CONNECTED',
        lastSync: new Date(),
        ordersReceived: 0,
        syncHealth: 100,
        apiHealth: 100,
        vendorId,
      }
    });
  }

  async toggleSource(id: string, vendorId: string) {
    const source = await this.prisma.orderSource.findFirst({
      where: { id, vendorId },
    });

    if (!source) {
      throw new NotFoundException(`Order source ${id} not found`);
    }

    const nextStatus = source.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';

    return this.prisma.orderSource.update({
      where: { id },
      data: { 
        status: nextStatus,
        lastSync: nextStatus === 'CONNECTED' ? new Date() : null,
      },
    });
  }

  async syncSource(id: string, vendorId: string) {
    const source = await this.prisma.orderSource.findFirst({
      where: { id, vendorId },
    });

    if (!source) {
      throw new NotFoundException(`Order source ${id} not found`);
    }

    const addedOrders = Math.floor(Math.random() * 5) + 1; // Simulate importing 1-5 new orders
    const newHealth = Math.min(100, Math.max(80, source.syncHealth + Math.floor(Math.random() * 5) - 2));
    const newApiHealth = Math.min(100, Math.max(80, source.apiHealth + Math.floor(Math.random() * 5) - 2));

    return this.prisma.orderSource.update({
      where: { id },
      data: {
        lastSync: new Date(),
        ordersReceived: { increment: addedOrders },
        syncHealth: newHealth,
        apiHealth: newApiHealth,
      },
    });
  }
}
