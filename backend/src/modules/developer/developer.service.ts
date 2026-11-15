import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  // ── API Key Management ──
  async getApiKeys(vendorId: string) {
    let keys = await this.prisma.vendorApiKey.findFirst({
      where: { vendorId },
    });

    if (!keys) {
      keys = await this.prisma.vendorApiKey.create({
        data: {
          apiKey: `fcos_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`,
          apiSecret: `secret_${Math.random().toString(36).substring(2, 16)}${Math.random().toString(36).substring(2, 16)}`,
          webhookSecret: `whsec_${Math.random().toString(36).substring(2, 16)}`,
          vendorId,
        },
      });
    }

    return keys;
  }

  async rotateKeys(vendorId: string) {
    const existing = await this.prisma.vendorApiKey.findFirst({
      where: { vendorId },
    });

    const newKey = `fcos_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
    const newSecret = `secret_${Math.random().toString(36).substring(2, 16)}${Math.random().toString(36).substring(2, 16)}`;
    const newWhsec = `whsec_${Math.random().toString(36).substring(2, 16)}`;

    if (existing) {
      return this.prisma.vendorApiKey.update({
        where: { id: existing.id },
        data: {
          apiKey: newKey,
          apiSecret: newSecret,
          webhookSecret: newWhsec,
          isActive: true,
        },
      });
    } else {
      return this.prisma.vendorApiKey.create({
        data: {
          apiKey: newKey,
          apiSecret: newSecret,
          webhookSecret: newWhsec,
          vendorId,
        },
      });
    }
  }

  // ── Webhook Endpoint Management ──
  async getWebhookEndpoints(vendorId: string) {
    let endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });

    // Seed default endpoint for demonstration purposes if none exist
    if (endpoints.length === 0) {
      const defaultEndpoint = await this.prisma.webhookEndpoint.create({
        data: {
          url: 'https://api.kingapperals.com/webhooks/fcos-handler',
          secret: `whsec_${Math.random().toString(36).substring(2, 16)}`,
          events: ['order.created', 'order.updated', 'inventory.low'],
          vendorId,
        },
      });

      // Seed a few delivery logs
      await this.prisma.webhookDeliveryLog.createMany({
        data: [
          {
            endpointId: defaultEndpoint.id,
            event: 'order.created',
            payload: { orderId: 'ord_101', status: 'CREATED', total: 4200 },
            responseCode: 200,
            responseBody: '{"received": true}',
            status: 'SUCCESS',
            attempts: 1,
            createdAt: new Date(Date.now() - 30 * 60000), // 30m ago
          },
          {
            endpointId: defaultEndpoint.id,
            event: 'inventory.low',
            payload: { productId: 'prod_99', sku: 'SKU-SHIRT-M', stock: 3 },
            responseCode: 502,
            responseBody: 'Bad Gateway',
            status: 'FAILED',
            attempts: 3,
            createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2h ago
          }
        ]
      });

      endpoints = await this.prisma.webhookEndpoint.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return endpoints;
  }

  async createWebhookEndpoint(vendorId: string, data: { url: string; events: string[] }) {
    return this.prisma.webhookEndpoint.create({
      data: {
        url: data.url,
        secret: `whsec_${Math.random().toString(36).substring(2, 16)}`,
        events: data.events,
        vendorId,
      },
    });
  }

  async deleteWebhookEndpoint(id: string, vendorId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, vendorId },
    });

    if (!endpoint) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }

    return this.prisma.webhookEndpoint.delete({
      where: { id },
    });
  }

  async getWebhookLogs(vendorId: string) {
    return this.prisma.webhookDeliveryLog.findMany({
      where: {
        endpoint: { vendorId }
      },
      orderBy: { createdAt: 'desc' },
      include: { endpoint: true },
      take: 50,
    });
  }

  async testWebhook(id: string, vendorId: string) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id, vendorId },
    });

    if (!endpoint) {
      throw new NotFoundException(`Webhook endpoint ${id} not found`);
    }

    // Simulate webhook POST trigger to the endpoint URL
    const rand = Math.random();
    const responseCode = rand > 0.85 ? 500 : rand > 0.7 ? 404 : 200;
    const responseBody = responseCode === 200 ? '{"status":"ok"}' : 'Internal Server Error';
    const status = responseCode === 200 ? 'SUCCESS' : 'FAILED';

    const log = await this.prisma.webhookDeliveryLog.create({
      data: {
        endpointId: id,
        event: endpoint.events[Math.floor(Math.random() * endpoint.events.length)] || 'order.created',
        payload: {
          timestamp: new Date(),
          test: true,
          fcosMessageId: `msg_${Math.random().toString(36).substring(2, 12)}`,
          eventData: {
            orderId: `ord_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            status: 'CREATED',
            customer: { name: 'Test Customer', email: 'test@example.com' },
          }
        },
        responseCode,
        responseBody,
        status,
        attempts: responseCode === 200 ? 1 : 3,
      },
    });

    return log;
  }
}
