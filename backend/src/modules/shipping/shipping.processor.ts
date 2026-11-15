import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('shipping')
export class ShippingProcessor extends WorkerHost {
  private readonly logger = new Logger(ShippingProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Shipping job ${job.name} (ID: ${job.id}) failed: ${error.message}`);
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'generate-label':
        return this.handleLabelGeneration(job.data.orderId);
      default:
        throw new Error('Unknown job name');
    }
  }

  private async handleLabelGeneration(orderId: string) {
    this.logger.log(`Processing shipping label for order ${orderId}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const labelUrl = `https://fcos-labels.s3.amazonaws.com/${orderId}.pdf`;

    await this.prisma.shipment.upsert({
      where: { orderId },
      update: {
        trackingNumber,
        labelUrl,
        courierName: 'Delhivery Mock',
        shippedAt: new Date(),
      },
      create: {
        orderId,
        trackingNumber,
        labelUrl,
        courierName: 'Delhivery Mock',
        shippedAt: new Date(),
      }
    });

    this.logger.log(`Shipment created for order ${orderId} with tracking ${trackingNumber}`);
    
    return { trackingNumber, labelUrl };
  }
}
