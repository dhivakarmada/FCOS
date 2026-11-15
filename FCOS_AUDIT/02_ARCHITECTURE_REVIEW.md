# FCOS Architecture Review: Documented vs Actual Implementation

**Audit Date:** November 9, 2026  
**Auditor Roles:** Senior Software Architect, Full-Stack Engineer, Security Auditor

---

## 1. Architectural Overview & Discrepancy Matrix

The project documentation (`README.md`) outlines a multi-tenant logistics and warehouse operating system built on Next.js 14, NestJS, PostgreSQL/Prisma, Redis, BullMQ, and Socket.io. Below is the exact comparison between the documented specifications and the actual discovered source code.

| Architecture Component | Documented Specification | Actual Implementation | Divergence / Architectural Risk |
|---|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | Next.js 16.2.4 (Turbopack) + React 19.2.4 | **Severe Build Risk:** Documented as stable Next 14, but running Next 16 pre-release with React 19 and Tailwind CSS v4. Turbopack panics during production build on Windows. |
| **Styling & Design System** | Tailwind CSS v3 + ShadCN | Tailwind CSS v4 (`@tailwindcss/postcss`) + ShadCN UI | Configured with modern CSS variables (`oklch`), but Tailwind v4 compiler causes fatal build exceptions with Turbopack. |
| **Backend Framework** | NestJS (Node.js) | NestJS 11.0.1 + Express | Modern NestJS 11 stack with modular structure, but lacks request DTO validation on majority of mutation endpoints. |
| **Database ORM** | PostgreSQL + Prisma ORM | PostgreSQL 15 + Prisma 6.19.3 | Schema contains 26 models, but lacks essential foreign keys (e.g. `Order` has no `warehouseId`). |
| **Multi-Tenancy Isolation** | Tenant-level row filtering & RBAC | Dormant code; broken queries | `tenantExtension` and `VendorInterceptor` exist in codebase but are **never imported or executed**. Controllers manually pass `req.user.vendorId` inconsistently. |
| **Caching Layer** | Redis caching for analytics & performance | Redis (ioredis) | Redis is hard-coupled: if Redis is unavailable, critical endpoints (`/analytics/dashboard`) crash with 500 errors. No circuit-breaker or in-memory fallback. |
| **Background Processing** | BullMQ workers for async jobs (e.g. labels) | BullMQ 5.76.5 | 5 Queues declared (`orders`, `shipping`, `notifications`, `analytics`, `inventory`), but only 2 produce jobs (`generate-invoice`, `generate-label`). The others have dormant workers. |
| **Real-time WebSockets** | Socket.io event-driven telemetry | Socket.io 4.8.3 (`NotificationsGateway`) | Connected to JWT auth and room isolation by vendor (`vendor-${id}`), but lacks warehouse-specific rooms. Staff presence resets all staff to inactive on server restart. |
| **Authentication & AuthZ** | JWT + Role-Based Access Control | JWT (passport-jwt) + hardcoded Role Enum | Unauthenticated `/auth/register` creates Super Admins. Hardcoded JWT secret fallback (`access_secret`). Dynamic RBAC policy matrix in DB is completely ignored by `RolesGuard`. |

---

## 2. Actual System Data Flow Diagram

The following sequence and architecture diagram represents the true execution flow of orders, inventory, and tasks through the system:

```mermaid
flowchart TD
    subgraph Client["Client Tier (Next.js 16 / React 19)"]
        UI_Login["Login & Auth (/login)"]
        UI_Admin["Super Admin Dashboard (/dashboard/super-admin)"]
        UI_Vendor["Vendor Portal (/dashboard/vendor/*)"]
        UI_Warehouse["Manager Desk (/dashboard/warehouse/*)"]
        UI_Staff["Execution Terminal (/dashboard/execution/*)"]
        Zustand["Zustand Auth/Ops Stores"]
        TanStack["TanStack React Query Cache"]
        SocketClient["Socket.io Client Listener"]
    end

    subgraph Gateway["API Gateway & Middleware Tier (NestJS 11)"]
        Helmet["Helmet Security Headers"]
        CORS["CORS (Wildcard *)"]
        ValPipe["ValidationPipe (whitelist: true)"]
        GlobalFilter["GlobalExceptionFilter"]
        AuditInterceptor["AuditLogInterceptor"]
        JwtGuard["JwtAuthGuard (Passport JWT)"]
        RolesGuard["RolesGuard (Hardcoded Enum Check)"]
        DormantInterceptor["VendorInterceptor (DORMANT - NEVER CALLED)"]
    end

    subgraph BackendServices["Backend Domain Modules"]
        AuthMod["AuthModule (AuthService)"]
        UserMod["UsersModule (UsersService)"]
        VendorMod["VendorsModule (VendorsService)"]
        OrderMod["OrdersModule (OrdersService)"]
        InvMod["InventoryModule (InventoryService)"]
        WhMod["WarehousesModule (WarehousesService)"]
        StaffMod["StaffModule (StaffService)"]
        ShipMod["ShippingModule (ShippingService)"]
        RetMod["ReturnsModule (ReturnsService)"]
        DevMod["DeveloperModule (DeveloperService)"]
        AnalyticsMod["AnalyticsModule (AnalyticsService)"]
        SocketGateway["NotificationsGateway (WebSocketServer)"]
    end

    subgraph QueueRedis["Async Queue & Cache Tier (Redis 7 & BullMQ)"]
        RedisCache["Redis (Cache: analytics_v2:*)"]
        Q_Orders["BullMQ: orders queue (generate-invoice)"]
        Q_Shipping["BullMQ: shipping queue (generate-label)"]
        Q_Dormant["Dormant Queues: notifications, analytics, inventory"]
    end

    subgraph DatabaseTier["Persistence Tier (PostgreSQL 15 & Prisma 6)"]
        PrismaService["PrismaService (PrismaClient)"]
        DormantExtension["tenantExtension (DORMANT - NEVER CALLED)"]
        DB_Users["User, Staff, RolePermission"]
        DB_Vendors["Vendor, VendorApiKey, OrderSource"]
        DB_Catalog["Product, Bin, Warehouse"]
        DB_Inventory["InventoryItem, StockLog"]
        DB_Orders["Order, OrderItem, Invoice, Shipment, Return, StaffTask"]
        DB_Audit["AuditLog, NotificationLog, WebhookDeliveryLog"]
    end

    Client -->|Bearer JWT HTTP Requests| Gateway
    Client <-->|WebSockets (ws://)| SocketGateway
    Gateway --> BackendServices
    BackendServices --> PrismaService
    BackendServices --> RedisCache
    BackendServices --> Q_Orders
    BackendServices --> Q_Shipping
    PrismaService --> DatabaseTier
    Q_Orders --> OrderMod
    Q_Shipping --> ShipMod
    BackendServices -->|Emit Events| SocketGateway
```

---

## 3. Deep Dive into Tier Implementations

### 3.1 Frontend Architecture (`frontend/src/`)
- **Routing Engine:** Next.js App Router structure under `src/app/`.
  - `/login`: Public auth portal.
  - `/dashboard`: Primary portal routing.
  - `/dashboard/super-admin/*`: Platform oversight (13 sub-pages).
  - `/dashboard/vendor/*`: Vendor admin tools (14 sub-pages).
  - `/dashboard/warehouse/*`: Facility management (17 sub-pages).
  - `/dashboard/execution/*`: Warehouse staff operational stations (16 sub-pages).
- **State Management:**
  - `auth-store.ts`: Persisted in `localStorage` under `fcos-auth-storage`. Stores JWT tokens, user metadata, and hydration status.
  - `execution-store.ts`, `live-ops-store.ts`, `analytics-store.ts`, `shipping-store.ts`: Local Zustand stores for transient UI states.
  - TanStack Query (`@tanstack/react-query` v5.100.9): Manages server-state synchronization with 30-second stale times and window refocus refetches.
- **Real-Time Client Hook (`use-socket.ts`):** Connects to `http://localhost:4000` via `socket.io-client`. Transmits JWT token in handshake authentication. Listens for `order-status-updated`, `inventory-updated`, `live-feed`, and invalidates relevant React Query cache keys.

### 3.2 Backend Architecture (`backend/src/`)
- **Entrypoint (`main.ts`):** Boots NestJS on port 4000 (or `process.env.PORT`). Applies `helmet()`, global `ValidationPipe` with non-whitelisted property rejection, `GlobalExceptionFilter`, and registers Swagger OpenAPI documentation at `/api/docs`.
- **Global Interceptors & Decorators:**
  - `AuditLogInterceptor`: Automatically intercepts endpoints annotated with `@AuditLog(...)` and persists user, action, module, and request parameters into the `AuditLog` table.
  - `RolesGuard`: Reflector-based guard that reads `@Roles(...)` metadata. Evaluates only whether `user.role` matches one of the required `UserRole` enums.
- **The "Dormant Code" Phenomenon:**
  - `tenant.extension.ts`: Contains a Prisma client extension designed to inject `vendorId` into all queries. It contains hardcoded references to models that do not possess a `vendorId` field (`InventoryItem`, `StaffTask`). It is **never registered with PrismaService**.
  - `vendor.interceptor.ts`: Designed to extract `vendorId` from authenticated requests and attach it to `request.vendorId`. It is **never imported or registered** in any module or controller.

### 3.3 Database & ORM Tier (`backend/prisma/`)
- **Schema (`schema.prisma`):** Contains 26 models.
- **Data Models:**
  - Multitenancy relies primarily on `vendorId` foreign keys on `Warehouse`, `Product`, `Order`, `Staff`, `OrderSource`, `WebhookEndpoint`, and `VendorApiKey`.
  - **Fatal Relational Gap:** An `Order` belongs to a `Vendor`, but does **not** belong to a `Warehouse`. A customer orders items from a vendor, but the database schema provides no mechanism to associate the order or its individual items with a specific fulfillment warehouse.
  - **Nullable Unique Constraint Issue:** `InventoryItem` has `@@unique([productId, warehouseId, binId])`. In PostgreSQL, unique constraints with nullable columns (`binId String?`) do not prevent duplicate entries where `binId IS NULL`, allowing multiple inventory rows for the same product in the same warehouse.

### 3.4 Caching & Async Processing (`Redis & BullMQ`)
- **Redis (`redis.module.ts`):** Single global connection via `ioredis`. Keys prefixed with `analytics_v2:`.
- **BullMQ Workers:**
  - `OrderProcessor` (`orders` queue): Listens for `generate-invoice` and writes PDF records to `Invoice`.
  - `ShippingProcessor` (`shipping` queue): Listens for `generate-label` and generates simulated tracking numbers.
  - `AnalyticsProcessor` & `InventoryProcessor`: Listen for jobs that are **never enqueued anywhere in the application**.

---

## 4. Architectural Vulnerabilities and Technical Debt

1. **Lack of Request DTOs:** Over 70% of controller methods accept `@Body() body: any` or `@Body() data: any`. While `ValidationPipe` is globally enabled, without explicit class DTOs annotated with `class-validator`, **no validation occurs**.
2. **In-Memory Hardcoded Features (UI Theater):** A large volume of enterprise functionality displayed in the frontend navigation (Billing Tariffs, Helpdesk Tickets, AI Insights, Shift Rotations) exists entirely within transient React component state and has zero backend or database architecture behind it.
3. **Decoupled Roles vs Permissions:** An elaborate `RolePermission` database table stores granular permissions (`orders.override`, `inventory.adjust`, `billing.manage`), but the backend authorization layer (`RolesGuard`) completely ignores this table and only checks hardcoded static roles.

