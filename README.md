# Hylire Construction Management Portal 🏗️

A full-stack, enterprise-grade Construction Project & Site Management Platform designed for Builders, Engineers, Contractors, Workers, and Clients.

---

## 💾 Database & Persistence

The project supports dual-mode database persistence (Local JSON file engine & Supabase Cloud PostgreSQL):

- 🗄️ **SQL Schema File**: [`database/schema.sql`](database/schema.sql) or [`backend/database/schema.sql`](backend/database/schema.sql)
- 💾 **Local Persistent Database**: [`database/hylire_db.json`](database/hylire_db.json) or [`backend/database/hylire_db.json`](backend/database/hylire_db.json)
- 📖 **Database Setup Guide**: [`database/README.md`](database/README.md)

### Database Entities:
- `users`: Role-based authentication (Admin, Engineer, Contractor, Worker, Client).
- `projects`: Project portfolio, allocated budgets, client associations.
- `sites`: Active construction sites linked to projects and assigned site engineers.
- `tasks`: Daily operational task checklists and review stages.
- `materials`: Inventory materials with unit costs and total valuations.
- `brick_estimations`: Brickwork masonry, mortar ratios, and volume computations.
- `cost_estimations`: Building BOQ, stage-wise budget allocations.
- `documents`: Real uploaded blueprints, contracts, BOQs, and site inspection photos.
- `chat_messages`: Real-time project collaboration messages.

---

## 🚀 Key Modules & Features

1. **📊 Executive Dashboard**:
   - Real-time project metrics, active sites, task completion ratios, and total financial allocations.
   - Dynamic monthly expenditure SVG trend curves with interactive data node tooltips.
   - Project budget vs. actual spend comparison bar meters.

2. **🧮 Smart Civil Engineering Estimators**:
   - **Brickwork & Mortar Estimator**: Calculates wall volume, modular brick quantities, wastage allowances, wet/dry mortar volumes (1:6 standard mix), cement bags, sand in cu ft, and cost valuations.
   - **Concrete & RCC Structure Estimator**: Supports M10, M15, M20, M25 concrete mix grades with 1.54 dry compaction factor. Computes cement bags, sand, aggregate, TMT steel rebar (kg), and water requirements.
   - **Plastering Estimator**: Single & double-coat plastering (12mm, 15mm, 20mm) with labor benchmarks.
   - **Building BOQ & Cost Modeler**: Comprehensive built-up area costing with phase-wise allocations (Foundation, RCC, Masonry, Plaster, Flooring, MEP, Handover).
   - **Saved Estimates Vault**: Real-time project estimation history with one-click deletion and database archiving.

3. **📁 Document Vault (Real File Storage & Previews)**:
   - Native file picker supporting PDF blueprints, PNG/JPG photos, CAD drawings (DWG/DXF), Excel, Word, and Text documents (up to 50 MB).
   - In-app live preview modal for PDFs and images.
   - One-click real file downloads and deletion.

4. **🏢 Projects & Construction Sites Management**:
   - Create, monitor, and manage multi-site portfolios with custom budgets and client associations.

5. **✅ Task Management**:
   - Stage-based task allocation (*To Do*, *In Progress*, *Review Stage*, *Completed*) with assigned engineers and workers.

6. **💬 Team Collaboration Desk**:
   - Project-wide real-time instant chat for builders, engineers, and clients.

---

## 🛠️ Quick Start & Installation

### Prerequisites:
- Node.js (v18+)
- npm

### 1. Start Backend:
```bash
cd backend
npm install
node server.js
```
*Backend runs on `http://localhost:5000`.*

### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend web app runs on `http://localhost:5173`.*

---

## 🔐 Default Demo Logins (Password: `password123`)
- **Admin / Builder**: `admin@hylire.com`
- **Engineer**: `engineer@hylire.com`
- **Client**: `client@hylire.com`
- **Contractor**: `contractor@hylire.com`
- **Worker**: `worker@hylire.com`

---

## 📦 Tech Stack
- **Frontend**: React (Vite, JavaScript/JSX), Vanilla Custom CSS Design System, Lucide Icons
- **Backend**: Node.js, Express.js REST API
- **Database**: Supabase PostgreSQL / Local Persistent JSON DB Engine
