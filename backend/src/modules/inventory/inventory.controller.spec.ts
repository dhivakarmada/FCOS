import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            createProduct: jest.fn(),
            bulkCreateProducts: jest.fn(),
            findAllProducts: jest.fn(),
            findProductBySku: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
            getInventoryHistory: jest.fn(),
            updateStock: jest.fn(),
            transferStock: jest.fn(),
            scanIn: jest.fn(),
            scanOut: jest.fn(),
            getLowStockItems: jest.fn(),
            getPredictions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
