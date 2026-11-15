import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ImportsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndImport(vendorId: string, userId: string, data: { records: any[]; mappings: any }) {
    if (!data.records || !Array.isArray(data.records)) {
      throw new BadRequestException('Invalid format. Missing records array.');
    }

    const { mappings } = data;
    const importedOrders: any[] = [];
    const duplicates: any[] = [];
    const errors: any[] = [];

    // Fetch vendor's products to map SKU to productId
    const products = await this.prisma.product.findMany({
      where: { vendorId },
    });

    for (const record of data.records) {
      try {
        // Apply field mappings to normalize
        const orderNumber = record[mappings.orderNumber || 'orderNumber'] || `IMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const customerName = record[mappings.customerName || 'customerName'];
        const customerEmail = record[mappings.customerEmail || 'customerEmail'] || 'customer@imported.com';
        const addressLine1 = record[mappings.addressLine1 || 'addressLine1'];
        const city = record[mappings.city || 'city'] || 'Hyderabad';
        const state = record[mappings.state || 'state'] || 'TS';
        const zipCode = String(record[mappings.zipCode || 'zipCode'] || '500001');
        const sku = record[mappings.sku || 'sku'];
        const quantity = parseInt(record[mappings.quantity || 'quantity'], 10) || 1;

        if (!customerName || !addressLine1 || !sku) {
          errors.push({
            record,
            reason: 'Missing required fields: customerName, addressLine1, or sku.'
          });
          continue;
        }

        // Find the product by SKU
        const product = products.find(p => p.sku === sku);
        if (!product) {
          errors.push({
            record,
            reason: `Product with SKU ${sku} not registered in your FCOS catalog.`
          });
          continue;
        }

        // Check for duplicates in the DB
        const existing = await this.prisma.order.findUnique({
          where: { orderNumber },
        });

        if (existing) {
          duplicates.push({ orderNumber, customerName });
          continue;
        }

        // Calculate pricing
        const price = Number(product.price);
        const totalAmount = price * quantity;
        const gstAmount = totalAmount * 0.18;

        // Normalization & creation in transaction block
        const order = await this.prisma.$transaction(async (tx) => {
          return tx.order.create({
            data: {
              orderNumber,
              customerName,
              customerEmail,
              addressLine1,
              city,
              state,
              zipCode,
              totalAmount,
              gstAmount,
              vendor: { connect: { id: vendorId } },
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity,
                    price,
                  }
                ]
              }
            }
          });
        });

        importedOrders.push(order);
      } catch (err: any) {
        errors.push({
          record,
          reason: err.message || 'Parsing error'
        });
      }
    }

    return {
      success: true,
      importedCount: importedOrders.length,
      duplicateCount: duplicates.length,
      errorCount: errors.length,
      duplicates,
      errors,
    };
  }
}
