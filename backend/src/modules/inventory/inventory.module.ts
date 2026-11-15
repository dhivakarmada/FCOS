import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryProcessor } from './inventory.processor';

import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'inventory' }),
    StaffModule,
  ],
  providers: [InventoryService, InventoryProcessor],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
