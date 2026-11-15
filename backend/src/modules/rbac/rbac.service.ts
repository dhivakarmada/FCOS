import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RbacService {
  private readonly coreRoles = ['SUPER_ADMIN', 'VENDOR_ADMIN', 'WAREHOUSE_MANAGER', 'STAFF'];

  constructor(private readonly prisma: PrismaService) {}

  async getRoles() {
    const roles = await this.prisma.rolePermission.findMany({
      orderBy: { createdAt: 'asc' },
    });
    
    // Transform array to direct map if needed, but returning full objects is easier for frontend
    return roles;
  }

  async createRole(roleName: string) {
    const formatted = roleName.trim().toUpperCase().replace(/\s+/g, '_');
    
    if (this.coreRoles.includes(formatted)) {
      throw new BadRequestException('Cannot override core system roles');
    }

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleName: formatted },
    });

    if (existing) {
      throw new BadRequestException(`Role ${formatted} already exists`);
    }

    // Standard read-only permissions as default
    const defaultPermissions = {
      'orders.read': true,
      'inventory.read': true,
    };

    return this.prisma.rolePermission.create({
      data: {
        roleName: formatted,
        isCustom: true,
        permissions: defaultPermissions,
      },
    });
  }

  async deleteRole(roleName: string) {
    const formatted = roleName.toUpperCase();
    if (this.coreRoles.includes(formatted)) {
      throw new BadRequestException('Cannot delete core system roles');
    }

    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleName: formatted },
    });

    if (!existing) {
      throw new NotFoundException(`Role ${formatted} not found`);
    }

    return this.prisma.rolePermission.delete({
      where: { roleName: formatted },
    });
  }

  async savePolicies(policies: Record<string, Record<string, boolean>>) {
    const transactions = Object.entries(policies).map(([roleName, permissionMap]) => {
      const formatted = roleName.toUpperCase();
      return this.prisma.rolePermission.upsert({
        where: { roleName: formatted },
        update: { permissions: permissionMap },
        create: {
          roleName: formatted,
          permissions: permissionMap,
          isCustom: !this.coreRoles.includes(formatted),
        },
      });
    });

    await this.prisma.$transaction(transactions);
    return { success: true };
  }
}
