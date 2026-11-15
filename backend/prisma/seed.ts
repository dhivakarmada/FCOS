import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database state...');

  // Check if the database has already been seeded to avoid deleting user data
  const superAdmin = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN }
  });

  if (superAdmin) {
    console.log('Database is already seeded with a Super Admin. Skipping cleanup and seed commands to protect your custom data!');
    return;
  }

  console.log('Seeding database...');

  // ── CLEANUP: Delete all existing data in correct order ──
  console.log('Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.staffActivityLog.deleteMany();
  await prisma.staffTask.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.return.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bin.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  
  await prisma.notificationLog.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.automationExecutionLog.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.integrationWebhookLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.rolePermission.deleteMany();
  console.log('Cleanup complete.');

  // 1. Create Super Admin (System wide)
  const adminHash = await bcrypt.hash('Admin@123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@fcos.com',
      password: adminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  // 2. Create one Core Demo Vendor
  const demoVendor = await prisma.vendor.create({
    data: {
      name: 'FCOS Demo Vendor',
      contactEmail: 'vendor@fcos.com',
      contactPhone: '+91 99999 88888',
      isActive: true,
    },
  });

  // Create default warehouse and bin for demo vendor
  const defaultWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Delhi Hub',
      location: 'Delhi',
      vendorId: demoVendor.id,
    }
  });

  await prisma.bin.create({
    data: {
      code: 'A-01-01',
      warehouseId: defaultWarehouse.id,
    }
  });

  // 3. Create Vendor Admin
  const vendorHash = await bcrypt.hash('Vendor@123', 10);
  await prisma.user.create({
    data: {
      email: 'vendor@fcos.com',
      password: vendorHash,
      firstName: 'Vendor',
      lastName: 'Admin',
      role: UserRole.VENDOR_ADMIN,
      vendorId: demoVendor.id,
    },
  });

  // 4. Create Warehouse Manager
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@fcos.com',
      password: managerHash,
      firstName: 'Warehouse',
      lastName: 'Manager',
      role: UserRole.WAREHOUSE_MANAGER,
      vendorId: demoVendor.id,
    },
  });

  // 5. Create Staff
  const staffHash = await bcrypt.hash('Staff@123', 10);
  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@fcos.com',
      password: staffHash,
      firstName: 'Execution',
      lastName: 'Staff',
      role: UserRole.STAFF,
      vendorId: demoVendor.id,
    },
  });

  // 6. Create Staff records (used for performance mapping)
  await prisma.staff.create({
    data: {
      userId: managerUser.id,
      vendorId: demoVendor.id,
      firstName: 'Warehouse',
      lastName: 'Manager',
    }
  });

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      vendorId: demoVendor.id,
      firstName: 'Execution',
      lastName: 'Staff',
    }
  });

  // Seed Notification Templates
  console.log('Seeding notification templates...');
  await prisma.notificationTemplate.createMany({
    data: [
      { id: "T-01", name: "Low Stock Alert", event: "inventory.low_stock", email: true, sms: false, whatsapp: true },
      { id: "T-02", name: "Order Shipped Notification", event: "order.shipped", email: true, sms: true, whatsapp: true },
      { id: "T-03", name: "SLA Breach Escalation", event: "sla.breach", email: true, sms: true, whatsapp: false },
      { id: "T-04", name: "Vendor Payment Overdue", event: "billing.payment_overdue", email: true, sms: false, whatsapp: false },
      { id: "T-05", name: "Return Received Confirmation", event: "return.received", email: true, sms: false, whatsapp: true }
    ]
  });

  // Seed Integrations
  console.log('Seeding integrations...');
  await prisma.integration.createMany({
    data: [
      { id: "shopify", name: "Shopify API", category: "ecommerce", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://admin.shopify.com/store/fcos-hub" },
      { id: "woocommerce", name: "WooCommerce", category: "ecommerce", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://woo.fcos-hub.in" },
      { id: "delhivery", name: "Delhivery Express", category: "shipping", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://track.delhivery.com/api/v1" },
      { id: "shiprocket", name: "Shiprocket Core", category: "shipping", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://api.shiprocket.in/v1" },
      { id: "bluedart", name: "BlueDart Waybill", category: "shipping", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://api.bluedart.com/v2" },
      { id: "razorpay", name: "Razorpay Checkout", category: "payments", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://api.razorpay.com/v1" },
      { id: "stripe", name: "Stripe Subscriptions", category: "payments", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://api.stripe.com/v3" },
      { id: "twilio", name: "Twilio SMS API", category: "communication", status: "DISCONNECTED", lastSync: "Never", apiEndpoint: "https://api.twilio.com/2010-04-01" },
    ]
  });

  // Seed Automation Rules
  console.log('Seeding automation rules...');
  await prisma.automationRule.createMany({
    data: [
      { id: "AR-101", name: "High Priority Packer Routing", trigger: "Order Created", condition: "priority == 'HIGH'", action: "assign_fastest_packer", active: true },
      { id: "AR-102", name: "Low Stock Slack Alert", trigger: "Inventory Update", condition: "quantity < minStock", action: "send_low_stock_notification", active: true },
      { id: "AR-103", name: "Auto Reroute On Delay", trigger: "SLA Threshold Breached", condition: "timeInPicking > 30m", action: "reassign_picker_escalated", active: false },
      { id: "AR-104", name: "Return QC Quarantine Movement", trigger: "Return QC Completed", condition: "qcResult == 'DAMAGED'", action: "move_to_bin_quarantine", active: true },
    ]
  });

  // Seed RBAC Role Permissions Matrix
  console.log('Seeding RBAC role permissions...');
  await prisma.rolePermission.createMany({
    data: [
      {
        roleName: "SUPER_ADMIN",
        isCustom: false,
        permissions: {
          "orders.read": true, "orders.create": true, "orders.update": true, "orders.override": true, "orders.split": true,
          "inventory.read": true, "inventory.adjust": true, "inventory.transfer": true, "inventory.sync": true,
          "staff.read": true, "staff.assign": true, "staff.monitor": true, "staff.schedule": true,
          "billing.read": true, "billing.manage": true, "billing.export": true,
          "system.monitor": true, "system.settings": true, "system.logs": true,
        }
      },
      {
        roleName: "VENDOR_ADMIN",
        isCustom: false,
        permissions: {
          "orders.read": true, "orders.create": true, "orders.update": true, "orders.override": false, "orders.split": false,
          "inventory.read": true, "inventory.adjust": false, "inventory.transfer": false, "inventory.sync": true,
          "staff.read": true, "staff.assign": false, "staff.monitor": false, "staff.schedule": false,
          "billing.read": true, "billing.manage": false, "billing.export": true,
          "system.monitor": false, "system.settings": false, "system.logs": false,
        }
      },
      {
        roleName: "WAREHOUSE_MANAGER",
        isCustom: false,
        permissions: {
          "orders.read": true, "orders.create": false, "orders.update": true, "orders.override": true, "orders.split": true,
          "inventory.read": true, "inventory.adjust": true, "inventory.transfer": true, "inventory.sync": true,
          "staff.read": true, "staff.assign": true, "staff.monitor": true, "staff.schedule": true,
          "billing.read": false, "billing.manage": false, "billing.export": false,
          "system.monitor": true, "system.settings": false, "system.logs": false,
        }
      },
      {
        roleName: "STAFF",
        isCustom: false,
        permissions: {
          "orders.read": true, "orders.create": false, "orders.update": true, "orders.override": false, "orders.split": false,
          "inventory.read": true, "inventory.adjust": false, "inventory.transfer": false, "inventory.sync": false,
          "staff.read": false, "staff.assign": false, "staff.monitor": false, "staff.schedule": false,
          "billing.read": false, "billing.manage": false, "billing.export": false,
          "system.monitor": false, "system.settings": false, "system.logs": false,
        }
      }
    ]
  });

  console.log('Cleanup and seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
