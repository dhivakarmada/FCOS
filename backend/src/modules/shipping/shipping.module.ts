import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ShippingService } from './shipping.service';
import { ShippingController } from './shipping.controller';
import { ShippingProcessor } from './shipping.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'shipping' }),
  ],
  providers: [ShippingService, ShippingProcessor],
  controllers: [ShippingController],
  exports: [ShippingService],
})
export class ShippingModule {}
