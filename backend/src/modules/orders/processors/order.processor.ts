import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { OrderStatus } from '@prisma/client';

@Processor('orders')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.name} (ID: ${job.id}) failed with error: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.name} (ID: ${job.id}) completed successfully.`);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing order job: ${job.name} for Order ID: ${job.data.orderId}`);

    switch (job.name) {
      case 'process-status-update':
        return this.handleStatusUpdate(job.data);
      case 'generate-invoice':
        return this.handleInvoiceGeneration(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleStatusUpdate(data: { orderId: string; status: OrderStatus }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { vendor: true },
    });

    if (!order) return;

    // Send real-time notification to the vendor
    this.notificationsGateway.notifyVendor(
      order.vendorId,
      'order-status-updated',
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: data.status,
      },
    );

    // If order is PACKED, trigger invoice generation
    if (data.status === OrderStatus.PACKED) {
      // In a real system, we'd add another job to the queue
      // For this simulation, we'll just log it
      this.logger.log(`Order ${order.orderNumber} packed. Triggering invoice generation...`);
    }

    return { success: true };
  }

  private async handleInvoiceGeneration(data: { orderId: string }) {
    // Simulate PDF generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) return;

    const invoiceUrl = `https://fcos-storage.s3.amazonaws.com/invoices/INV-${order.orderNumber}.pdf`;

    await this.prisma.invoice.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        invoiceUrl,
        totalAmount: order.totalAmount,
        gstNumber: '27AAAAA0000A1Z5', // Mock GST
      },
      update: {
        invoiceUrl,
      },
    });

    this.notificationsGateway.notifyVendor(
      order.vendorId,
      'invoice-generated',
      {
        orderId: order.id,
        invoiceUrl,
      },
    );

    return { invoiceUrl };
  }
}
