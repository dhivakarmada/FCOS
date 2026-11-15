import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async toggleChannel(id: string, channel: 'email' | 'sms' | 'whatsapp') {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Notification template ${id} not found`);
    }

    const updatedData: any = {};
    if (channel === 'email') updatedData.email = !template.email;
    if (channel === 'sms') updatedData.sms = !template.sms;
    if (channel === 'whatsapp') updatedData.whatsapp = !template.whatsapp;

    return this.prisma.notificationTemplate.update({
      where: { id },
      data: updatedData,
    });
  }

  async sendTestMessage(body: { channel: string; recipient: string; templateName: string }) {
    // Simulated delivery. We insert a log into the database
    const log = await this.prisma.notificationLog.create({
      data: {
        template: body.templateName,
        channel: body.channel.toUpperCase(),
        recipient: body.recipient,
        status: 'DELIVERED', // Simulate a successful delivery
      },
    });

    return {
      success: true,
      log,
    };
  }

  async getLogs() {
    return this.prisma.notificationLog.findMany({
      orderBy: { time: 'desc' },
    });
  }
}
