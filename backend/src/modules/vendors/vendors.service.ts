import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma, Vendor } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }

  async findAll(filters?: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const where: any = {};
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: {
          _count: { select: { users: true, products: true, orders: true, warehouses: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { vendors, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        warehouses: true,
        _count: { select: { users: true, products: true, orders: true } },
      },
    });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async update(id: string, data: Prisma.VendorUpdateInput) {
    await this.findOne(id);
    return this.prisma.vendor.update({ where: { id }, data });
  }

  // ── Deactivate Vendor (Soft Delete) ──
  async deactivateVendor(id: string) {
    await this.findOne(id);
    return this.prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ── WORKFLOW: Onboard Vendor ──
  // Creates vendor + admin user + default/assigned warehouse in one transaction
  async onboardVendor(data: {
    vendorName: string;
    contactEmail: string;
    contactPhone: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    warehouseName?: string;
    warehouseLocation?: string;
    existingWarehouseId?: string;
  }) {
    const existingVendor = await this.prisma.vendor.findUnique({ where: { contactEmail: data.contactEmail } });
    if (existingVendor) throw new BadRequestException('Vendor contact email already exists');

    const existingUser = await this.prisma.user.findUnique({ where: { email: data.adminEmail } });
    if (existingUser) throw new BadRequestException('Admin email already exists');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create vendor
      const vendor = await tx.vendor.create({
        data: {
          name: data.vendorName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
        },
      });

      // 2. Create admin user for vendor
      const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
      const user = await tx.user.create({
        data: {
          email: data.adminEmail,
          password: hashedPassword,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          role: 'VENDOR_ADMIN',
          vendorId: vendor.id,
        },
      });

      let warehouseId = '';
      let warehouseName = '';
      let binsCount = 0;

      if (data.existingWarehouseId) {
        const wh = await tx.warehouse.findUnique({
          where: { id: data.existingWarehouseId },
          include: { _count: { select: { bins: true } } },
        });
        if (!wh) throw new NotFoundException(`Selected warehouse ${data.existingWarehouseId} not found`);
        
        if (!wh.vendorId) {
          await tx.warehouse.update({
            where: { id: wh.id },
            data: { vendorId: vendor.id },
          });
        }
        warehouseId = wh.id;
        warehouseName = wh.name;
        binsCount = wh._count.bins;
      } else if (data.warehouseName && data.warehouseLocation) {
        const warehouse = await tx.warehouse.create({
          data: {
            name: data.warehouseName,
            location: data.warehouseLocation,
            vendorId: vendor.id,
          },
        });

        const defaultBins = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
        await tx.bin.createMany({
          data: defaultBins.map(code => ({ code, warehouseId: warehouse.id })),
        });

        warehouseId = warehouse.id;
        warehouseName = warehouse.name;
        binsCount = defaultBins.length;
      } else {
        throw new BadRequestException('Either existingWarehouseId or warehouse details must be provided');
      }

      return {
        vendor: { id: vendor.id, name: vendor.name },
        admin: { id: user.id, email: user.email },
        warehouse: { id: warehouseId, name: warehouseName, bins: binsCount },
        message: `Vendor "${vendor.name}" onboarded with admin user and associated with warehouse "${warehouseName}"`,
      };
    });
  }

  // ── Get Vendor Dashboard ──
  async getVendorDashboard(vendorId: string) {
    const [
      totalOrders, totalProducts, totalWarehouses, totalStaff,
      recentOrders, pendingReturns, lowStockCount,
    ] = await Promise.all([
      this.prisma.order.count({ where: { vendorId } }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null } }),
      this.prisma.warehouse.count({ where: { vendorId, deletedAt: null } }),
      this.prisma.staff.count({ where: { vendorId } }),
      this.prisma.order.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      }),
      this.prisma.return.count({ where: { order: { vendorId }, status: 'REQUESTED' } }),
      this.prisma.inventoryItem.count({
        where: { warehouse: { vendorId }, quantity: { lte: this.prisma.inventoryItem.fields.minStock } },
      }).catch(() => 0), // fallback if field comparison not supported
    ]);

    const revenue = await this.prisma.order.aggregate({
      where: { vendorId, status: 'DELIVERED' },
      _sum: { totalAmount: true },
    });

    return {
      totalOrders,
      totalProducts,
      totalWarehouses,
      totalStaff,
      pendingReturns,
      lowStockCount,
      revenue: Number(revenue._sum.totalAmount || 0),
      recentOrders,
    };
  }

  // ── Vendor Intelligence (Super Admin) ──
  async getVendorIntelligence() {
    const vendors = await this.prisma.vendor.findMany({
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { status: true, totalAmount: true },
        },
      },
    });

    const intelligence = vendors.map(vendor => {
      const deliveredOrders = vendor.orders.filter(o => o.status === 'DELIVERED');
      const returnedOrders = vendor.orders.filter(o => o.status === 'RETURNED');
      const totalOrders = vendor._count.orders;

      const revenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      const deliverySuccessRate = totalOrders > 0 ? ((deliveredOrders.length / totalOrders) * 100).toFixed(1) : '0';
      const returnRate = totalOrders > 0 ? ((returnedOrders.length / totalOrders) * 100).toFixed(1) : '0';

      return {
        id: vendor.id,
        name: vendor.name,
        isActive: vendor.isActive,
        contactEmail: vendor.contactEmail,
        createdAt: vendor.createdAt,
        totalOrders,
        revenue,
        deliverySuccessRate: parseFloat(deliverySuccessRate),
        returnRate: parseFloat(returnRate),
      };
    });

    // Sort by revenue descending
    return intelligence.sort((a, b) => b.revenue - a.revenue);
  }
}
