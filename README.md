# Fulfillment Center Operating System (FCOS)

FCOS is a production-grade, multi-tenant logistics and warehouse management system designed for high-scale operations. It handles multi-vendor catalogs, order states (Created → Packed → Shipped → Delivered), real-time inventory updates, and background jobs.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI, Zustand, TanStack Query
- **Backend**: Node.js, NestJS, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis & BullMQ (for asynchronous tasks like label generation)
- **Real-Time Communication**: WebSockets (Socket.io)
- **Authentication**: JWT with Role-Based Access Control (RBAC)

---

## 🛠 Prerequisites

Ensure you have the following installed on your host system:
- **Node.js** (v18 or higher)
- **Docker & Docker Compose**
- **Git**

---

## 📦 Option 1: Deploying via Docker (Recommended)

This runs the entire stack (Next.js, NestJS, PostgreSQL, Redis) fully containerized.

> [!IMPORTANT]
> **Database Persistence (Your data is safe!)**  
> We have configured the database to store all files directly on your host machine inside the `./postgres_data/` folder. This means any staff, vendors, warehouses, or inventory you create will be preserved forever on your disk, even when containers stop, restart, or if you restart your computer.

---

### 🚀 First-Time Initial Setup (Run Once Only)

If you are running the project for the very first time, run these three commands to set up the containers, tables, and default admin accounts:

1. **Build and start the containers**:
   ```bash
   docker compose up --build -d
   ```
2. **Push the database schema (Creates tables)**:
   ```bash
   docker compose exec backend npx prisma db push
   ```
3. **Seed initial setup data (Creates default templates and roles)**:
   ```bash
   docker compose exec backend npm run seed
   ```

---

### 📂 Daily Subsequent Starts (Preserves Your Custom Data)

When starting the project on subsequent days, **ONLY run the start command**. Do NOT run the setup or seed commands again, as they will overwrite your database.

1. **Start the application**:
   ```bash
   docker compose up -d
   ```

> [!WARNING]
> **Do NOT run `npm run seed` or `npx prisma db push` during daily starts.**  
> Running the seed command executes the cleanup script which deletes all records (staff, vendors, warehouses, inventory) to reset the database to a blank state. To keep your work, **only run `docker compose up -d`**.

---

### 🛑 Stopping the Services

To stop the running application:
```bash
docker compose down
```
*(Avoid using the `-v` or `--volumes` flag, as it is unnecessary and deletes local docker caching).*

* **View application logs:**
  ```bash
  docker compose logs -f
  ```
  *(Filter specific logs: `docker compose logs -f backend` or `docker compose logs -f frontend`)*
* **Check running services:**
  ```bash
  docker compose ps
  ```

---

## 💻 Option 2: Local Development Setup

If you wish to make changes and run the services on your local machine with hot-reloading:

### 1. Launch Shared Infrastructure (PostgreSQL & Redis)
Use Docker Compose to run only the database and caching layer:
```bash
docker compose up postgres redis -d
```

### 2. Configure and Run Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the Prisma client, run migrations, and seed:
   ```bash
   npx prisma db push
   npm run seed
   ```
4. Start the NestJS development server:
   ```bash
   npm run start:dev
   ```
   *The backend API will run on [http://localhost:4000](http://localhost:4000)*

### 3. Configure and Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The web client dashboard will run on [http://localhost:3000](http://localhost:3000)*

---

## 🔑 Default Credentials (Post-Seed)

Once the database has been seeded, use these credentials to log in:

- **Super Admin (System-Wide Control)**:
  * **Email**: `admin@fcos.com`
  * **Password**: `Admin@123`
- **Vendor Admin (Demo Store)**:
  * **Email**: `vendor@fcos.com`
  * **Password**: `Vendor@123`
- **Warehouse Manager**:
  * **Email**: `manager@fcos.com`
  * **Password**: `Manager@123`
- **Execution Staff (Picker/Packer/QC/Dispatcher)**:
  * **Email**: `staff@fcos.com`
  * **Password**: `Staff@123`

---

## 📁 Repository Structure

```
Fullfillmentcentre/
├── backend/                  # NestJS backend application
│   ├── src/                  # Application controllers, services, and modules
│   ├── prisma/               # Database schema & seeding configuration
│   └── Dockerfile            # Container configuration for backend
├── frontend/                 # Next.js web dashboard
│   ├── src/app/              # App router pages and layouts
│   ├── src/components/       # Reusable UI widgets and layout guards
│   ├── src/store/            # Zustand state stores (auth, execution, metrics)
│   └── Dockerfile            # Container configuration for frontend
└── docker-compose.yml        # Docker composition orchestration spec
```

---

## 📡 API Reference & Gateway

All backend API requests require a JWT bearer authentication header (excluding `/auth/login`).

* **Auth**: `POST /auth/login` - Returns JWT tokens & user info.
* **Inventory**: `GET /inventory/products` - Manage catalog, SKUs, and stock levels.
* **Orders**: `GET /orders` - Access client shipments, trigger status transitions.
* **Analytics**: `GET /analytics/performance` - Access order fulfillment rates & throughput.
