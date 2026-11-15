import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditLogService } from '../audit-logs/audit-logs.service';
import { StaffPerformanceService } from '../staff/staff-performance.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            product: { findUnique: jest.fn(), findFirst: jest.fn() },
            inventoryItem: { findMany: jest.fn(), update: jest.fn() },
            stockLog: { create: jest.fn() },
            staff: { findFirst: jest.fn() },
            user: { findFirst: jest.fn() },
            staffTask: { create: jest.fn(), updateMany: jest.fn() },
            shipment: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), upsert: jest.fn() },
            invoice: { findUnique: jest.fn() },
            auditLog: { findMany: jest.fn() },
            $transaction: jest.fn().mockImplementation((cb) => cb({
              order: { create: jest.fn(), update: jest.fn() },
              inventoryItem: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
              stockLog: { create: jest.fn() },
              staff: { findFirst: jest.fn() },
              user: { findFirst: jest.fn() },
              staffTask: { create: jest.fn(), updateMany: jest.fn() },
              warehouse: { findMany: jest.fn().mockResolvedValue([]) },
              $executeRaw: jest.fn().mockResolvedValue(1),
            })),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            emitOrderUpdate: jest.fn(),
            emitInventoryUpdate: jest.fn(),
            emitTaskAssigned: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: StaffPerformanceService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            invalidateVendorCache: jest.fn(),
          },
        },
        {
          provide: getQueueToken('orders'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
