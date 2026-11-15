import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // We register the queues we want to monitor here
    BullModule.registerQueue({ name: 'orders' }),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
