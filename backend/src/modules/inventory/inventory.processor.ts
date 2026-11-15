import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InventoryService } from './inventory.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Processor('inventory')
export class InventoryProcessor extends WorkerHost {
  constructor(
    private inventoryService: InventoryService,
    private notificationsGateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-low-stock':
        return this.checkLowStock(job.data.vendorId);
      default:
        return;
    }
  }

  private async checkLowStock(vendorId: string) {
    const lowStockItems = await this.inventoryService.getLowStockItems(vendorId);
    
    if (lowStockItems.length > 0) {
      this.notificationsGateway.notifyVendor(vendorId, 'low-stock-alert', {
        count: lowStockItems.length,
        items: lowStockItems.map(i => ({ sku: i.product.sku, qty: i.quantity }))
      });
    }
    
    return lowStockItems.length;
  }
}
