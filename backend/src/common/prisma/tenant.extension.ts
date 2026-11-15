import { PrismaClient } from '@prisma/client';

export const tenantExtension = (prisma: any, vendorId?: string) => {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // If vendorId is provided, and the model has a vendorId field, apply filtering
          const modelsWithVendorId = ['Warehouse', 'Product', 'Order', 'InventoryItem', 'Staff', 'StaffTask'];
          
          if (vendorId && modelsWithVendorId.includes(model)) {
            if (['findMany', 'findUnique', 'findFirst', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
              args.where = { ...args.where, vendorId };
            }
            if (['create', 'createMany'].includes(operation)) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({ ...item, vendorId }));
              } else {
                args.data = { ...args.data, vendorId };
              }
            }
          }
          return query(args);
        },
      },
    },
  });
};
