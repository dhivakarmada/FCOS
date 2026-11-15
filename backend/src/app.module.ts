import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { BarcodeModule } from './modules/barcode/barcode.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StaffModule } from './modules/staff/staff.module';
import { AuditLogModule } from './modules/audit-logs/audit-logs.module';
import { SystemModule } from './modules/system/system.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { AutomationModule } from './modules/automation/automation.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { OrderSourcesModule } from './modules/order-sources/order-sources.module';
import { DeveloperModule } from './modules/developer/developer.module';
import { ImportsModule } from './modules/imports/imports.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    RedisModule,
    PrismaModule,
    NotificationsModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    VendorsModule,
    InventoryModule,
    WarehousesModule,
    OrdersModule,
    ShippingModule,
    ReturnsModule,
    BarcodeModule,
    AnalyticsModule,
    StaffModule,
    SystemModule,
    RbacModule,
    AutomationModule,
    IntegrationsModule,
    OrderSourcesModule,
    DeveloperModule,
    ImportsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
