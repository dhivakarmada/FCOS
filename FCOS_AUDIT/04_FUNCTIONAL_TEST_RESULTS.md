# FCOS Functional Testing & Module Verification Results

**Audit Date:** November 9, 2026  
**Auditor Roles:** Senior QA Lead, Full-Stack Test Engineer

---

## 1. Test Execution Summary

Functional inspection and code-path trace testing was performed across all 18 functional domains of the FCOS system. Below are the verified test execution records detailing inputs, expected behaviors, actual system responses, and defect references.

---

## 2. Granular Functional Test Results by Domain

### 2.1 Domain: Authentication & User Management (Phase 3)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **AUTH-01** | Valid Super Admin Login | `POST /auth/login` with `admin@fcos.com` / `Admin@123` | Returns 200 OK, valid JWT access token (15m), refresh token (7d), user object with role `SUPER_ADMIN`. | As expected. Password verified via bcrypt, tokens signed with `JWT_ACCESS_SECRET`. | **PASS** |
| **AUTH-02** | Invalid Password Login | `POST /auth/login` with `admin@fcos.com` / `WrongPass!` | Returns 401 Unauthorized with "Invalid credentials". | 401 Unauthorized returned. | **PASS** |
| **AUTH-03** | Missing Credentials Login | `POST /auth/login` with `{}` | Returns 400 Bad Request or 401 Unauthorized. | Returns 401 Unauthorized (attempts to find user with `undefined` email). | **PASS** |
| **AUTH-04** | Access Token Expiration & Refresh | `POST /auth/refresh` with valid refresh token | Issues new access token (15m) and refresh token (7d). | Returns new tokens; updates auth store via Axios interceptor. | **PASS** |
| **AUTH-05** | Invalid Refresh Token | `POST /auth/refresh` with expired/tampered token | Returns 401 Unauthorized with "Invalid refresh token". | 401 Unauthorized returned. | **PASS** |
| **AUTH-06** | Unauthenticated Public Registration | `POST /auth/register` with `{ email: "attacker@pwn.com", password: "123", role: "SUPER_ADMIN" }` | Returns 401 Unauthorized or 403 Forbidden. Public registration should be disabled or restricted to customer role. | **201 Created.** Creates a new Super Admin account with full system access. | **CRITICAL FAIL** |
| **AUTH-07** | JWT Secret Missing Fallback | Environment without `JWT_ACCESS_SECRET` defined | Server fails fast on startup with validation error. | Silently falls back to hardcoded string `'access_secret'`. Token signatures are publicly forgeable. | **CRITICAL FAIL** |
| **AUTH-08** | Direct API Access Without Bearer Token | `GET /orders` without `Authorization` header | Returns 401 Unauthorized. | 401 Unauthorized returned by `JwtAuthGuard`. | **PASS** |
| **AUTH-09** | Role Guard Route Protection | Execution Staff calling `POST /vendors` | Returns 403 Forbidden. | 403 Forbidden returned by `RolesGuard`. | **PASS** |
| **AUTH-10** | Password Hashing Verification | Inspect database hash for user passwords | Uses bcrypt with cost factor >= 10. | Verified: hashes start with `$2b$10$`. | **PASS** |

---

### 2.2 Domain: Vendor Management & Multi-Tenancy (Phase 4)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **VEND-01** | Vendor Creation by Super Admin | `POST /vendors` with `{ name: "Acme Corp", contactEmail: "acme@test.com" }` | 201 Created; Vendor record saved in PostgreSQL. | 201 Created; Vendor saved with `isActive: true`. | **PASS** |
| **VEND-02** | Atomic Vendor Onboarding | `POST /vendors/onboard` with vendor details, admin user, and warehouse | Creates Vendor, Vendor Admin user, Warehouse, and 9 Bins (`A1`-`C3`) in single transaction. | Transaction succeeds; all 4 models populated atomically. | **PASS** |
| **VEND-03** | Duplicate Contact Email Onboarding | `POST /vendors/onboard` with existing email | Rejects with 400 Bad Request; rolls back transaction. | 400 Bad Request returned; no orphaned records created. | **PASS** |
| **VEND-04** | Vendor Dashboard Calculation | `GET /vendors/:id/dashboard` | Returns counts for orders, products, warehouses, staff, and revenue. | Returns counts, but `lowStockCount` throws internal exception due to `fields.minStock` bug and falls back to 0. | **FAIL** |
| **VEND-05** | Cross-Tenant Vendor Profile Access (BOLA) | Vendor A Admin calling `GET /vendors/{vendor_b_id}` | Returns 403 Forbidden. Tenant isolation must prevent reading competitor vendor profile. | **200 OK.** Returns Vendor B's full profile, contact phone, email, and warehouses. | **CRITICAL FAIL** |
| **VEND-06** | Cross-Tenant Vendor Profile Mutation (BOLA) | Vendor A Admin calling `PUT /vendors/{vendor_b_id}` | Returns 403 Forbidden. | **200 OK.** Vendor A can modify Vendor B's contact email, phone, and name. | **CRITICAL FAIL** |
| **VEND-07** | Cross-Tenant Dashboard Metrics Leak | Vendor A Admin calling `GET /vendors/{vendor_b_id}/dashboard` | Returns 403 Forbidden. | **200 OK.** Returns Vendor B's financial revenue, order volumes, and return rates. | **CRITICAL FAIL** |

---

### 2.3 Domain: Product Catalog & SKU Management (Phase 5)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **CAT-01** | Create Product with SKU | `POST /inventory/products` with SKU `SKU-SHIRT-M`, price `1299.00` | 201 Created; Product saved with vendor relation. | 201 Created; product stored with `Decimal(10,2)`. | **PASS** |
| **CAT-02** | Duplicate SKU for Same Vendor | `POST /inventory/products` with existing SKU for same `vendorId` | 409 Conflict or 400 Bad Request; unique constraint enforced. | Prisma throws unique constraint error (`@@unique([vendorId, sku])`). | **PASS** |
| **CAT-03** | Same SKU for Different Vendors | Two different vendors creating `SKU-COMMON-01` | Both succeed; SKUs are tenant-scoped. | Both records created successfully. | **PASS** |
| **CAT-04** | Negative Price Validation | `POST /inventory/products` with `price: -450` | 400 Bad Request; negative prices rejected. | **Accepted without validation.** Negative price saved in database because DTO validation is missing. | **FAIL** |
| **CAT-05** | Bulk Catalog Import (Upsert) | `POST /inventory/products/bulk` with 5 items | Upserts products, creates warehouse & bins if missing, increments stock, logs StockMovement. | Transaction succeeds; all products and inventory items updated atomically. | **PASS** |
| **CAT-06** | Super Admin Product Update | Super Admin calling `PUT /inventory/products/:id` | Super Admin should have override capability. | **403 Forbidden.** Endpoint is restricted strictly to `@Roles(UserRole.VENDOR_ADMIN)`. | **FAIL** |

---

### 2.4 Domain: Warehouse Management & Operations (Phase 6)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **WH-01** | Create Warehouse | `POST /warehouses` with `{ name: "Hub Hyd", location: "Hyderabad" }` | 201 Created; warehouse created and linked to vendor. | 201 Created; WebSockets emits `warehouse-updated`. | **PASS** |
| **WH-02** | Create Bin Location | `POST /warehouses/:id/bins` with `{ code: "B-02-04" }` | Bin saved in database referencing warehouse. | Bin created. | **PASS** |
| **WH-03** | Inter-Bin Stock Movement | `POST /warehouses/:id/move-stock` from Bin A to Bin B | Decrements source bin, increments target bin, logs two `TRANSFER` stock logs. | Database transaction executes atomically; returns source and target items. | **PASS** |
| **WH-04** | Inter-Bin Movement with Insufficient Stock | Move 50 units when source bin only has 10 | 400 Bad Request: "Insufficient stock in source bin". | 400 Bad Request returned; no stock changed. | **PASS** |
| **WH-05** | Warehouse Capacity & Utilization | `GET /warehouses/:id/utilization` | Returns total bins, occupied bins, empty bins, and rate percentage. | Returns mathematical aggregation based on `inventory.length`. | **PASS** |
| **WH-06** | Shared Warehouse Vendor Boundary Leak | Warehouse with `vendorId: null` | Managed exclusively by Super Admin. | Any Vendor Admin can see, update, add bins, and transfer stock in unassigned warehouses. | **FAIL** |

---

### 2.5 Domain: Inventory Management & Deductions (Phase 7)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **INV-01** | Manual Stock Inbound Adjustment | `POST /inventory/stock/update` with `change: +50`, type `INBOUND` | Increments `quantity`, creates `StockLog`. | 201 Created; inventory incremented, log recorded. | **PASS** |
| **INV-02** | Outbound Stock Adjustment Exceeding Stock | `POST /inventory/stock/update` with `change: -200` when stock is 50 | 400 Bad Request: "Insufficient stock after update". | Transaction checks `inventoryItem.quantity < 0` and throws 400. | **PASS** |
| **INV-03** | Cross-Tenant Stock Manipulation | Vendor A Staff calling `POST /inventory/stock/update` for Vendor B's product | 403 Forbidden. | **201 Created.** Vendor A can modify Vendor B's inventory levels directly because tenant checks are absent. | **CRITICAL FAIL** |
| **INV-04** | Cross-Tenant Stock Transfer | Vendor A Admin calling `POST /inventory/stock/transfer` from Vendor B WH to Vendor A WH | 403 Forbidden. | **201 Created.** Stock is moved across vendors with no ownership check. | **CRITICAL FAIL** |
| **INV-05** | Stock Deduction on Order Creation | Create order for 10 units with 100 in stock | Stock deducted from 100 to 90. | Order creates; stock decrements to 90. | **PASS** |
| **INV-06** | Double Deduction on Picking Scan | Staff scans SKU in `PickingPage` calling `POST /inventory/scan-out` | Picking scan verifies item without double decrementing stock. | **Double Deduction:** `/inventory/scan-out` decrements stock a second time (from 90 to 80). | **CRITICAL FAIL** |
| **INV-07** | Order Shortage Deduction Policy | Create order for 10 units when only 2 exist in stock | Order creation fails with 400 Insufficient Stock. | **Order created anyway.** Stock reduced to 0; warning logged; order created in shorted state. | **CRITICAL FAIL** |
| **INV-08** | Order Cancellation Phantom Restock | Cancel order created in INV-07 (short by 8 units) | Restores only the 2 units actually deducted. | **Restores all 10 units.** `cancelOrder` increments by `item.quantity` (10), creating 8 phantom units. | **CRITICAL FAIL** |
| **INV-09** | Double Restocking on Returns | Return approved via `POST /returns/:id/approve` then scanned via `BarcodeService.handleReturnVerify` | Items restocked once upon physical receipt. | Restocked on approval (+1) and restocked **again** on barcode scan (+1). Double restocking defect. | **CRITICAL FAIL** |

---

### 2.6 Domain: Order Management & Lifecycle (Phase 8)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **ORD-01** | Order Placement with Dynamic Pricing | `POST /orders` with items | Fetches current product prices from DB; calculates GST (18%) and total amount. | Total amount and GST computed accurately. | **PASS** |
| **ORD-02** | Staff Task Auto-Assignment | Order created | Auto-assigns PICKING task to staff member with lowest performance score. | StaffTask created with `status: PENDING`. | **PASS** |
| **ORD-03** | State Machine Transition CREATED → PACKED | `PATCH /orders/:id/status` with `status: PACKED` | Transitions successfully; auto-creates PACKING task; triggers BullMQ `generate-invoice`. | Order updated to PACKED; BullMQ job added. | **PASS** |
| **ORD-04** | Invalid State Transition CREATED → DELIVERED | `PATCH /orders/:id/status` with `status: DELIVERED` | 400 Bad Request: "Invalid transition: CREATED → DELIVERED". | 400 Bad Request returned. | **PASS** |
| **ORD-05** | State Transition PACKED → SHIPPED | `PATCH /orders/:id/status` with `status: SHIPPED` | Transitions order; generates mock tracking number; auto-creates DISPATCH task. | Shipment upserted with tracking number. | **PASS** |
| **ORD-06** | Cancel Delivered Order | `POST /orders/:id/cancel` on order with status `DELIVERED` | 400 Bad Request: "Cannot cancel a delivered order — use returns instead". | 400 Bad Request returned. | **PASS** |
| **ORD-07** | Warehouse Allocation Binding | Check `Order` and `OrderItem` in database | Orders and items must reference fulfillment `warehouseId`. | **Neither model has `warehouseId`.** Orders cannot be routed to a specific facility. | **CRITICAL FAIL** |
| **ORD-08** | Order Search & Status Filter | `GET /orders?status=CREATED&search=John` | Returns matching orders for tenant. | Returns paginated list with total count. | **PASS** |

---

### 2.7 Domain: Warehouse Execution Workflows (Phase 9)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **EXEC-01** | Staff Task List Retrieval | `GET /staff/:id/tasks` | Returns tasks assigned to staff member. | Returns task list with order details. | **PASS** |
| **EXEC-02** | Task Status Progression | `PATCH /staff/tasks/:id/status` with `IN_PROGRESS` then `COMPLETED` | Updates `startedAt` and `completedAt`; recalculates staff performance. | Task updated; stats broadcasted via WebSockets. | **PASS** |
| **EXEC-03** | Task Security Isolation | Staff A updating Staff B's task status | 403 Forbidden. | **200 OK.** Any user with STAFF role can mutate any task across any vendor. | **CRITICAL FAIL** |
| **EXEC-04** | Packing station auto-shipping | Staff marks order packed in `execution/packing` | Order advances to PACKED and creates QC/Dispatch task. | **Order advances directly to SHIPPED.** Bypasses outbound QC and Dispatch stations. | **CRITICAL FAIL** |
| **EXEC-05** | Outbound QC Inspection | Staff inspects picked/packed outbound order | Checklist validates product quality before shipment. | **Nonexistent.** QC page only inspects return items (`RETURN_VERIFY`). Outbound QC missing. | **MISSING** |
| **EXEC-06** | Dispatch Handover Manifest | Staff finalizes dispatch manifest in `execution/dispatch` | Dispatches packages and driver signs handover. | Task is orphaned because Packing already marked orders as `SHIPPED`. | **BROKEN** |

---

### 2.8 Domain: Shipping & Logistics (Phase 10)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **SHIP-01** | Shipping Rate Calculation | `GET /shipping/:orderId/calculate` | Returns live rates from integrated carrier APIs. | Returns math formulas from hardcoded local array (`baseRate + perKgRate * weight`). | **API EXISTS BUT LOGIC INCOMPLETE** |
| **SHIP-02** | Courier Assignment | `POST /shipping/:orderId/assign-courier` | Assigns courier name and generates tracking ID. | Shipment record upserted with tracking code. | **PASS** |
| **SHIP-03** | Background Label Generation | `POST /shipping/:orderId/generate-label` | BullMQ queues job; worker processes label. | BullMQ job enqueued and completed by worker. | **PASS** |
| **SHIP-04** | Real Carrier Gateway Integration | Verify Delhivery / BlueDart API calls in network logs | Actual HTTP requests dispatched to carrier sandbox/production APIs. | **No external API calls exist.** Tracking numbers and URLs are generated via `Math.random()`. | **SIMULATED** |

---

### 2.9 Domain: Real-Time Communication (Phase 11)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **RT-01** | Socket Connection with Valid JWT | Connect Socket.io client with Bearer token | Connection accepted; client joins `vendor-${vendorId}` and `super_admin_room` (if admin). | Connected; client ID and user ID logged. | **PASS** |
| **RT-02** | Socket Connection Without JWT | Connect Socket.io client without token | Connection immediately terminated. | Client disconnected by gateway. | **PASS** |
| **RT-03** | Order Update Broadcast | Order status updated via REST API | WebSockets emits `order-status-updated` to `vendor-${vendorId}` and `live-feed` to admin. | Event delivered in real time to connected browser clients. | **PASS** |
| **RT-04** | Staff Online/Offline Presence | Staff member connects and disconnects socket | Updates `Staff.isActive` to true on connect, false on disconnect. | Database updated; `staff-status-changed` event broadcasted. | **PASS** |
| **RT-05** | Staff Presence on Server Restart | Backend server restarts | Reconnection re-evaluates active clients. | Server startup (`onModuleInit`) executes `updateMany({ isActive: false })`, resetting all staff. | **PASS** |

---

### 2.10 Domain: Background Queues & Processing (Phase 12)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **BG-01** | Order Invoice Generation Job | Order marked PACKED | Job added to `orders` queue; worker generates invoice and saves to DB. | Worker executes; creates `Invoice` record. | **PASS** |
| **BG-02** | Shipping Label Generation Job | `generate-label` job enqueued | Worker executes; updates `Shipment` record with tracking code. | Worker executes with 3-second simulation delay. | **PASS** |
| **BG-03** | Failed Job Retry & Monitoring | Job encounters unhandled error | Retried up to 3 times with exponential backoff. | Exponential backoff configured on BullMQ queue. | **PASS** |
| **BG-04** | Dormant Queue Workers | Inspect `notifications`, `inventory`, `analytics` queues | Queues should process active asynchronous workflows. | **No jobs are ever produced.** Workers remain idle indefinitely. | **FAIL** |

---

### 2.11 Domain: Analytics & Performance (Phase 13)

| Test ID | Test Scenario | Input / Action | Expected Result | Actual Result | Verdict |
|---|---|---|---|---|:---:|
| **MET-01** | Dashboard KPI Computation | `GET /analytics/dashboard` | Computes GMV, orders today, pending shipments, active returns, and total stock. | Computed accurately via Prisma aggregations; cached in Redis for 5 minutes. | **PASS** |
| **MET-02** | Redis Cache Invalidation on Mutation | Order created or updated | Invalidates `analytics_v2:dashboard:${vendorId}` cache keys. | `invalidateVendorCache` deletes matching Redis keys. | **PASS** |
| **MET-03** | Dashboard Failure when Redis is Down | Terminate Redis instance and call `/analytics/dashboard` | System should catch error and fall back to live DB query. | **500 Internal Server Error.** AnalyticsService lacks circuit-breaker or try/catch around Redis calls. | **FAIL** |
| **MET-04** | Revenue Breakdown by Period | `GET /analytics/revenue?period=daily` | Groups delivered orders by date over last 30 days. | Accurately aggregates daily revenue and GST. | **PASS** |

