import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, vendorId: string, role?: string) {
    if (!query || query.trim().length < 2) {
      return { orders: [], products: [], vendors: [], warehouses: [] };
    }

    const isSuperAdmin = role === 'SUPER_ADMIN';
    const whereOrder = isSuperAdmin ? {} : { vendorId };
    const whereProduct = isSuperAdmin ? { deletedAt: null } : { vendorId, deletedAt: null };
    const whereWarehouse = isSuperAdmin ? { deletedAt: null } : { vendorId, deletedAt: null };

    const [orders, products, vendors, warehouses] = await Promise.all([
      // Search orders
      this.prisma.order.findMany({
        where: {
          ...whereOrder,
          OR: [
            { orderNumber: { contains: query, mode: 'insensitive' } },
            { customerName: { contains: query, mode: 'insensitive' } },
            { customerEmail: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),

      // Search products
      this.prisma.product.findMany({
        where: {
          ...whereProduct,
          OR: [
            { sku: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          sku: true,
          name: true,
          price: true,
        },
        take: 5,
      }),

      // Search vendors (SUPER_ADMIN only, but return anyway — access control is at controller level)
      this.prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { contactEmail: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          isActive: true,
        },
        take: 5,
      }),

      // Search warehouses
      this.prisma.warehouse.findMany({
        where: {
          ...whereWarehouse,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          location: true,
        },
        take: 5,
      }),
    ]);

    return {
      orders,
      products,
      vendors,
      warehouses,
      totalResults: orders.length + products.length + vendors.length + warehouses.length,
    };
  }
}
