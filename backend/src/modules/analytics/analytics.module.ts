import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SearchService } from './search.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [AnalyticsService, SearchService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, SearchService],
})
export class AnalyticsModule {}
