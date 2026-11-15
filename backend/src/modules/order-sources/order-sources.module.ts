import { Module } from '@nestjs/common';
import { OrderSourcesController } from './order-sources.controller';
import { OrderSourcesService } from './order-sources.service';

@Module({
  controllers: [OrderSourcesController],
  providers: [OrderSourcesService],
  exports: [OrderSourcesService],
})
export class OrderSourcesModule {}
