import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'aggregate-vendor-metrics':
        return this.aggregateVendorMetrics(job.data.vendorId);
      default:
        return;
    }
  }

  private async aggregateVendorMetrics(vendorId: string) {
    const stats = await this.analyticsService.getVendorStats(vendorId);
    // Here we could store this in a cache or a separate Metrics table
    // For now, we'll just log it
    return stats;
  }
}
