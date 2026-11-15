# FCOS End-to-End Business Workflow Audit Results

**Audit Date:** November 9, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, QA Lead, Logistics Domain Auditor

---

## 1. Test Environment Topology & Setup

To execute the mandatory end-to-end business workflows, the following logical multi-tenant testing topology was mapped and analyzed against the system's database schema and execution engine:

- **Super Admin:** System-wide supervisor (`admin@fcos.com`)
- **Vendor 1:** King Apperals (`mahesh@kingapperals.com`, Vendor Admin: `mahesh@fcos.com`)
- **Vendor 2:** Demo Store (`vendor@fcos.com`, Vendor Admin: `vendor@fcos.com`)
- **Warehouse 1 (Hyd):** Warehouse HYD (`Hyderabad`, Manager: `rohith@fcos.com`)
- **Warehouse 2 (Delhi):** Main Delhi Hub (`Delhi`, Manager: `manager@fcos.com`)
- **Execution Staff:**
  - Picker: Virat Kohli (`virat@fcos.com`)
  - Packer: Samantha Ruth (`samantha@fcos.com`)
  - QC Inspector: Rakul Preet (`rakul@fcos.com`)
  - Dispatcher: Pooja Hegde (`pooja@fcos.com`)
- **Products & SKUs:**
  - Vendor 1: `SKU-SHIRT-BLK-M` (Price: ₹1,499.00), `SKU-PANTS-DEN-32` (Price: ₹2,199.00)
  - Vendor 2: `SKU-DEMO-01` (Price: ₹799.00)

---

## 2. End-to-End Workflow Evaluations

---

### WORKFLOW A: Normal End-to-End Fulfilment Lifecycle

**Documented Expected Lifecycle:**  
`Vendor Onboarding → Product Catalog → Initial Inbound Stock → Customer Order → Facility Allocation → Picking Route → Packing & Boxing → Outbound QC → Courier Dispatch → In-Transit Shipping → Customer Delivery → Analytics KPI Refresh`

| Execution Step | Action Performed | Expected Business Result | Actual System Behavior | Status |
|---|---|---|---|:---:|
| **Step 1: Inbound Stock** | Stock inbound for `SKU-SHIRT-BLK-M` in Bin `A-01-01` | Inventory set to 100 units. `StockLog` records +100 `INBOUND`. | Inventory updated to 100. StockLog created. Real-time event emitted. | **PASS** |
| **Step 2: Order Placement** | Create order for 10 units of `SKU-SHIRT-BLK-M` | Order created in `CREATED` status. Inventory decrements by 10 (remaining: 90). `PICKING` task auto-assigned to staff. | Order created. Stock decremented to 90. `StaffTask` created for Virat Kohli. | **PASS** |
| **Step 3: Facility Allocation** | Order allocated to Warehouse HYD | Order and order items bound to `warehouseId`. | **FAIL:** Order has no `warehouseId` in schema or payload. Facility allocation is omitted. | **CRITICAL FAIL** |
| **Step 4: Picking Execution** | Picker opens route, scans Bin `A-01-01` and SKU `SKU-SHIRT-BLK-M` | Bin verified. SKU verified. 10 units marked picked. | **FAIL:** Frontend calls `/inventory/scan-out` which decrements inventory **again** from 90 to 80. Double stock deduction. | **CRITICAL FAIL** |
| **Step 5: Handover to Packing** | Picker clicks "Handover to Packing Station" | Task completed. Order advances to `PACKED`. Packing task auto-assigned to Packer. | Task marked completed. Order status updated to `PACKED`. BullMQ job queued. | **PASS** |
| **Step 6: Packing Station** | Packer verifies items, prints thermal slip, seals box, clicks "Mark Packed & Complete" | Packing completed. Order placed in Outbound QC and Dispatch dock queue. | **FAIL:** `handleMarkPacked` immediately updates order status to `SHIPPED`, generating mock tracking and bypassing QC & Dispatch. | **CRITICAL FAIL** |
| **Step 7: Outbound QC** | QC Inspector inspects parcel before courier handover | Outbound QC verification performed; items checked for defects and packaging standards. | **MISSING:** Outbound QC is completely absent. QC UI is hardcoded strictly for return inspections (`RETURN_VERIFY`). | **MISSING** |
| **Step 8: Courier Dispatch** | Dispatcher loads vehicle, verifies driver manifest sheet, driver signs handover | Manifest compiled; driver signs; order advances to `SHIPPED` / `OUT_FOR_DELIVERY`. | **BROKEN:** Dispatch terminal is orphaned because order was already marked `SHIPPED` during packing. | **BROKEN** |
| **Step 9: Customer Delivery** | Courier marks delivery | Order transitions `SHIPPED → OUT_FOR_DELIVERY → DELIVERED`. Final invoice generated. | State machine allows transition to `OUT_FOR_DELIVERY` then `DELIVERED`. Invoice generated via BullMQ. | **PASS** |
| **Step 10: Analytics Refresh** | View Vendor Dashboard | Order counted in GMV; revenue incremented; cache updated. | Analytics metrics updated; Redis cache invalidated and refreshed. | **PASS** |

**Workflow A Outcome:** **CRITICAL FAIL**  
**Root Causes:** Double inventory deduction on picking scan; complete bypass of Outbound QC; packing station auto-advances order directly to `SHIPPED`; order lacks warehouse binding.

---

### WORKFLOW B: Inventory Shortage & Overselling

**Business Scenario:** Initial stock of `SKU-PANTS-DEN-32` is 2 units. A customer places an order for 10 units.

- **Action:** `POST /orders` with `{ productId: "pants_id", quantity: 10 }`.
- **Expected Result:** System rejects order with `400 Bad Request: Insufficient stock available (requested: 10, available: 2)`. Transaction aborts. Inventory remains at 2 units.
- **Actual Result:**
  - System deducts the available 2 units (stock becomes 0).
  - Code encounters `remainingQty = 8`, prints `this.logger.warn("Insufficient stock for product pants_id — short by 8")`, and **completes the transaction successfully**.
  - Order `ORD-XXXX` is created in `CREATED` status with 10 units ordered.
- **Database Changes:** `Order` and `OrderItem` created. `InventoryItem.quantity` set to 0. Shortage of 8 units is untracked and unflagged.
- **Status:** **CRITICAL FAIL**  
- **Evidence:** `backend/src/modules/orders/orders.service.ts` lines 100-103:
  ```typescript
  if (remainingQty > 0) {
    this.logger.warn(`Insufficient stock for product ${item.productId} — short by ${remainingQty}`);
  }
  ```

---

### WORKFLOW C: Concurrent Orders for Last Available Stock

**Business Scenario:** Initial stock of `SKU-LIMITED-EDITION` is 1 unit. Two users simultaneously submit orders for 1 unit each at `T = 0ms`.

- **Action:** Two simultaneous asynchronous requests to `POST /orders`.
- **Expected Result:** Order 1 succeeds (stock decrements from 1 to 0). Order 2 fails with 400 Insufficient Stock. Zero overselling occurs.
- **Actual Result:**
  - In `orders.service.ts`, `tx.inventoryItem.findMany` executes a standard read without row locking (`FOR UPDATE` / `SELECT FOR UPDATE`).
  - Both transactions read `quantity = 1` before either update commits.
  - Both transactions execute `decrement: 1`.
  - Transaction 1 updates quantity to 0.
  - Transaction 2 updates quantity to -1 or encounters race conditions.
  - If both create orders, 2 units are sold when only 1 existed.
- **Database Changes:** Stock balance drops below 0 or database raises constraint violation depending on timing.
- **Status:** **FAIL** (Race condition / Concurrency Vulnerability)
- **Evidence:** Absence of pessimistic locking or optimistic version concurrency tokens in `OrdersService.create`.

---

### WORKFLOW D: Multiple Vendors & Tenant Isolation

**Business Scenario:** Vendor 1 (King Apperals) and Vendor 2 (Demo Store) operate simultaneously. Vendor 1 attempts to access Vendor 2's resources.

| Sub-Test | Action Performed | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **D.1: Products** | Vendor 1 calls `GET /inventory/products` | Returns only King Apperals products | Filtered by `req.user.vendorId`. Returns only Vendor 1 products. | **PASS** |
| **D.2: Orders** | Vendor 1 calls `GET /orders` | Returns only King Apperals orders | Filtered by `req.user.vendorId`. Returns only Vendor 1 orders. | **PASS** |
| **D.3: Profile BOLA** | Vendor 1 Admin calls `GET /vendors/{vendor_2_id}` | 403 Forbidden | **200 OK.** Returns Vendor 2's complete corporate details. | **CRITICAL FAIL** |
| **D.4: Profile Mutate** | Vendor 1 Admin calls `PUT /vendors/{vendor_2_id}` | 403 Forbidden | **200 OK.** Vendor 1 overwrites Vendor 2's contact information. | **CRITICAL FAIL** |
| **D.5: Cross Stock Edit**| Vendor 1 Staff calls `POST /inventory/stock/update` for Vendor 2 product | 403 Forbidden | **201 Created.** Modifies Vendor 2 inventory without tenant validation. | **CRITICAL FAIL** |
| **D.6: Stock Hijack** | Vendor 1 calls `POST /inventory/stock/transfer` moving stock from Vendor 2 warehouse | 403 Forbidden | **201 Created.** Transfers stock across tenant boundaries. | **CRITICAL FAIL** |

**Workflow D Outcome:** **CRITICAL FAIL**  
**Root Causes:** Complete lack of object-level authorization (BOLA/IDOR) on vendor, inventory adjustment, and stock transfer endpoints.

---

### WORKFLOW E: Multiple Warehouses & Operational Separation

**Business Scenario:** Process orders originating from Warehouse 1 (Hyderabad) vs Warehouse 2 (Delhi).

- **Action:** Vendor 1 creates products stocked in both Warehouse 1 and Warehouse 2. Customer places order.
- **Expected Result:** Customer or vendor selects fulfillment warehouse. Inventory is reserved specifically in that facility. Picking tasks are assigned strictly to staff stationed at that facility.
- **Actual Result:**
  - `Order` model contains no `warehouseId`.
  - When fulfilling the order, `OrdersService.create` executes:
    ```typescript
    const inventoryItems = await tx.inventoryItem.findMany({
      where: { productId: item.productId },
      orderBy: { quantity: 'desc' },
    });
    ```
  - It deducts stock from whichever facility has the highest stock level globally, ignoring logistics proximity and warehouse assignment.
  - Staff task assignment checks only `vendorId`, assigning tasks to any staff member regardless of which physical facility they are stationed in.
- **Status:** **CRITICAL FAIL** (Missing Multi-Warehouse Routing Architecture)

---

### WORKFLOW F: Quality Control (QC) Failure & Rejection

**Business Scenario:** Customer receives order, requests a return. Return is verified at QC station and rejected due to customer abuse/damage.

- **Action:** Order in `DELIVERED` status. `POST /returns` creates return request in `REQUESTED` status. Task created for QC Inspector. QC Inspector inspects parcel and clicks "Reject Return".
- **Expected Result:** Return status set to `REJECTED`. Order status reverts to `DELIVERED`. No stock is restocked into inventory. Audit log recorded.
- **Actual Result:**
  - `POST /returns/:id/reject` executes.
  - `Return.status` set to `REJECTED`.
  - `Order.status` reverted to `DELIVERED`.
  - No inventory is restocked.
  - Real-time notification emitted.
- **Database Changes:** `Return` updated, `Order` updated, `AuditLog` recorded.
- **Status:** **PASS** (Return QC rejection executes properly)

---

### WORKFLOW G: Order Cancellation & Inventory Restoration

**Business Scenario 1:** Normal order cancellation. Order placed for 5 units with 50 in stock (stock becomes 45). Order is cancelled before packing.
- **Result:** Order status set to `CANCELLED`. Inventory incremented by 5 (back to 50). `StockLog` created. Pending tasks cancelled. **Status: PASS.**

**Business Scenario 2:** Shortage order cancellation. Initial stock is 2 units. Order placed for 10 units (stock decrements by 2 to 0; shortage is 8 units). Order is subsequently cancelled.
- **Expected Result:** System restores the 2 units actually deducted (stock returns to 2).
- **Actual Result:** `OrdersService.cancelOrder` executes:
  ```typescript
  for (const item of order.items) {
    const inventoryItem = await tx.inventoryItem.findFirst({ where: { productId: item.productId } });
    if (inventoryItem) {
      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: { increment: item.quantity } }, // increments by 10!
      });
    }
  }
  ```
  - Inventory item quantity increases from 0 to **10**.
  - **8 phantom units are created in the database out of thin air.**
- **Status:** **CRITICAL FAIL** (Phantom Stock Generation Defect)

---

### WORKFLOW H: Background Job Failure & Recovery

**Business Scenario:** BullMQ worker fails during async invoice or label generation (e.g. storage timeout).

- **Action:** Simulate transient exception during `generate-invoice` or `generate-label`.
- **Expected Result:** Job is retried according to backoff policy (exponential backoff, 3 attempts). If all attempts fail, job moves to `failed` queue. Super Admin can view failed count and trigger manual retry via `/system/queues/retry`.
- **Actual Result:**
  - BullMQ retry parameters (`attempts: 3, backoff: { type: 'exponential', delay: 1000 }`) are configured in `orders.service.ts` and `shipping.service.ts`.
  - `SystemService.getQueues` accurately queries `ordersQueue.getJobCounts()` and reports total failed jobs.
  - `POST /system/queues/retry` iterates through failed jobs and invokes `job.retry()`.
- **Status:** **PASS** (Queue resilience and recovery mechanisms operate correctly)

---

### WORKFLOW I: Unauthorized Access & Privilege Escalation

**Business Scenario:** Staff member attempts administrative operations. Unauthenticated client attempts privileged endpoints.

| Sub-Test | Action Performed | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **I.1: Unauth Super Admin** | Anonymous user calls `POST /auth/register` with `role: "SUPER_ADMIN"` | 401 Unauthorized | **201 Created.** Creates Super Admin account. | **CRITICAL FAIL** |
| **I.2: Staff creates Vendor**| Staff user calls `POST /vendors` | 403 Forbidden | 403 Forbidden returned by `RolesGuard`. | **PASS** |
| **I.3: Staff deletes User** | Staff user calls `DELETE /users/:id` | 403 Forbidden | 403 Forbidden returned by `RolesGuard`. | **PASS** |
| **I.4: Cross-Task Update** | Staff A calls `PATCH /staff/tasks/{staff_b_task_id}/status` | 403 Forbidden | **200 OK.** Any staff member can complete any other staff member's task. | **CRITICAL FAIL** |
| **I.5: Cross-Vendor Stock** | Vendor 1 calls `POST /inventory/stock/update` for Vendor 2 product | 403 Forbidden | **201 Created.** Modifies competing vendor's inventory. | **CRITICAL FAIL** |

**Workflow I Outcome:** **CRITICAL FAIL**  
**Root Causes:** Unauthenticated registration vulnerability, missing ownership validation on staff tasks and inventory mutations.

