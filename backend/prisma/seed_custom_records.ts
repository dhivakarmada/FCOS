import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding custom database records...');

  // 1. Create or Find Vendor: King Apperals
  let vendor = await prisma.vendor.findFirst({
    where: { name: 'King Apperals' }
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: 'King Apperals',
        contactEmail: 'mahesh@kingapperals.com',
        contactPhone: '+91 90000 12345',
        isActive: true,
      },
    });
    console.log(`Created Vendor: ${vendor.name}`);
  } else {
    console.log(`Vendor already exists: ${vendor.name}`);
  }

  // 2. Create or Find Warehouse: Warehouse HYD
  let warehouse = await prisma.warehouse.findFirst({
    where: { name: 'Warehouse HYD', vendorId: vendor.id }
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'Warehouse HYD',
        location: 'Hyderabad',
        vendorId: vendor.id,
      },
    });
    console.log(`Created Warehouse: ${warehouse.name}`);
  } else {
    console.log(`Warehouse already exists: ${warehouse.name}`);
  }

  // Create default bin A-01-01 in Warehouse HYD if it doesn't exist
  let bin = await prisma.bin.findFirst({
    where: { code: 'A-01-01', warehouseId: warehouse.id }
  });

  if (!bin) {
    bin = await prisma.bin.create({
      data: {
        code: 'A-01-01',
        warehouseId: warehouse.id,
      },
    });
    console.log(`Created Bin: ${bin.code} in ${warehouse.name}`);
  }

  // 3. Vendor Admin: Mahesh Babu
  const passwordHash = await bcrypt.hash('Vendor@123', 10);
  let mahesh = await prisma.user.findUnique({
    where: { email: 'mahesh@fcos.com' }
  });

  if (!mahesh) {
    mahesh = await prisma.user.create({
      data: {
        email: 'mahesh@fcos.com',
        password: passwordHash,
        firstName: 'Mahesh',
        lastName: 'Babu',
        role: UserRole.VENDOR_ADMIN,
        vendorId: vendor.id,
      },
    });
    console.log(`Created Vendor Admin: Mahesh Babu (mahesh@fcos.com)`);
  } else {
    console.log(`Vendor Admin already exists: Mahesh Babu (mahesh@fcos.com)`);
  }

  // 4. Warehouse Manager: Rohith Sharma
  const managerHash = await bcrypt.hash('Manager@123', 10);
  let rohith = await prisma.user.findUnique({
    where: { email: 'rohith@fcos.com' }
  });

  if (!rohith) {
    rohith = await prisma.user.create({
      data: {
        email: 'rohith@fcos.com',
        password: managerHash,
        firstName: 'Rohith',
        lastName: 'Sharma',
        role: UserRole.WAREHOUSE_MANAGER,
        vendorId: vendor.id,
      },
    });
    console.log(`Created Manager User: Rohith Sharma (rohith@fcos.com)`);
  } else {
    console.log(`Manager User already exists: Rohith Sharma (rohith@fcos.com)`);
  }

  // Create Staff entry for Rohith Sharma if not exists
  let rohithStaff = await prisma.staff.findFirst({
    where: { userId: rohith.id }
  });

  if (!rohithStaff) {
    rohithStaff = await prisma.staff.create({
      data: {
        userId: rohith.id,
        vendorId: vendor.id,
        warehouseId: warehouse.id,
        firstName: 'Rohith',
        lastName: 'Sharma',
        designation: 'Warehouse Manager',
        isActive: true,
      },
    });
    console.log(`Created Staff Record for Rohith Sharma`);
  }

  // Common password for staff
  const staffHash = await bcrypt.hash('Staff@123', 10);

  // Helper to create staff user and record
  async function ensureStaff(email: string, firstName: string, lastName: string, designation: string) {
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: staffHash,
          firstName,
          lastName,
          role: UserRole.STAFF,
          vendorId: vendor!.id,
        },
      });
      console.log(`Created Staff User: ${firstName} ${lastName} (${email})`);
    } else {
      console.log(`Staff User already exists: ${firstName} ${lastName} (${email})`);
    }

    let staffRecord = await prisma.staff.findFirst({
      where: { userId: user.id }
    });

    if (!staffRecord) {
      staffRecord = await prisma.staff.create({
        data: {
          userId: user.id,
          vendorId: vendor!.id,
          warehouseId: warehouse!.id,
          firstName,
          lastName,
          designation,
          isActive: true,
        },
      });
      console.log(`Created Staff Record for ${firstName} ${lastName}`);
    }
  }

  // 5. Staff: Virat Kohli (Picker)
  await ensureStaff('virat@fcos.com', 'Virat', 'Kohli', 'Picker');

  // 6. Staff: Samantha (Packer)
  await ensureStaff('samantha@fcos.com', 'Samantha', 'Ruth', 'Packer');

  // 7. Staff: Rakul Preet (QC)
  await ensureStaff('rakul@fcos.com', 'Rakul', 'Preet', 'QC');

  // 8. Staff: Pooja Hegde (Dispatcher)
  await ensureStaff('pooja@fcos.com', 'Pooja', 'Hegde', 'Dispatcher');

  console.log('Custom records seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
