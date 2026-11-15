import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderProcessor } from './processors/order.processor';
import { InvoiceService } from './invoice.service';

import { StaffModule } from '../staff/staff.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'orders' }),
    StaffModule,
    AnalyticsModule,
  ],
  providers: [OrdersService, OrderProcessor, InvoiceService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
