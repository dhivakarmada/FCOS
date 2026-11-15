import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, module: string, details?: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        details,
      },
    });
  }

  async findAll(vendorId: string) {
    // Audit logs for a vendor's users
    return this.prisma.auditLog.findMany({
      where: {
        user: {
          vendorId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllGlobal(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              vendor: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count()
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
