import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { StaffPerformanceService } from '../staff/staff-performance.service';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
            },
            inventoryItem: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
            },
            stockLog: {
              create: jest.fn(),
              createMany: jest.fn(),
              findMany: jest.fn(),
            },
            warehouse: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            bin: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            orderItem: {
              findFirst: jest.fn(),
            },
            order: {
              findFirst: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation((cb) => cb({
              product: { findFirst: jest.fn(), update: jest.fn(), upsert: jest.fn() },
              warehouse: { findFirst: jest.fn(), create: jest.fn() },
              bin: { findFirst: jest.fn(), create: jest.fn() },
              inventoryItem: { upsert: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
              stockLog: { create: jest.fn(), createMany: jest.fn() },
            })),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            emitInventoryUpdate: jest.fn(),
            emitOrderUpdate: jest.fn(),
          },
        },
        {
          provide: StaffPerformanceService,
          useValue: {
            logActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
