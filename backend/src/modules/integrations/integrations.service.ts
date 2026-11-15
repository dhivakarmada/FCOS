import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getIntegrations() {
    return this.prisma.integration.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async toggleIntegration(id: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    const nextStatus = integration.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    const lastSync = nextStatus === 'CONNECTED' ? 'Just now' : 'Never';

    // Side effect: Log a webhook dispatch if connecting
    if (nextStatus === 'CONNECTED') {
      await this.prisma.integrationWebhookLog.create({
        data: {
          source: integration.name,
          event: 'system.handshake',
          code: 200,
          status: 'SUCCESS',
        },
      });
    }

    return this.prisma.integration.update({
      where: { id },
      data: {
        status: nextStatus,
        lastSync,
      },
    });
  }

  async configIntegration(id: string, data: { apiKey: string; webhookSecret: string }) {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${id} not found`);
    }

    return this.prisma.integration.update({
      where: { id },
      data: {
        apiKey: data.apiKey,
        webhookSecret: data.webhookSecret,
      },
    });
  }

  async getWebhookLogs() {
    return this.prisma.integrationWebhookLog.findMany({
      orderBy: { time: 'desc' },
    });
  }
}
