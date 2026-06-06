<div align="center">

# 🏗️ VendorBridge

### Procurement & Vendor Management ERP

**A full-stack ERP platform that digitizes and streamlines end-to-end procurement operations**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-cyan?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Features & Role-Based Dashboards](#-features--role-based-dashboards)
- [Procurement Workflow](#-procurement-workflow)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)


---

## 🚀 About the Project

VendorBridge is a **Procurement & Vendor Management ERP** built for the hackathon. It replaces manual procurement workflows with a structured, digital, role-based system.

Organizations can:
- Register and manage vendors with GST details and category tracking
- Create RFQs (Request for Quotations) with line items and file attachments
- Invite vendors to respond to RFQs with competitive quotations
- Compare quotations side-by-side and select the best vendor
- Route selections through a structured managerial approval workflow
- Auto-generate numbered Purchase Orders and Invoices from approvals
- Download invoices as PDF, print them, or email directly to vendors
- Track every procurement activity through audit logs and analytics

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework with SSR and file-based routing |
| **TypeScript** | Type safety across the entire frontend |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible component library built on Radix UI |
| **Zustand** | Lightweight global state management (auth, session) |
| **TanStack React Query** | Server state management, caching, background refetching |
| **React Hook Form + Zod** | Form handling with schema-based validation |
| **Axios** | HTTP client with request/response interceptors |
| **Recharts** | Charts and analytics visualizations |
| **Lucide React** | Icon library |
| **Sonner** | Toast notification system |
| **date-fns** | Date formatting and manipulation |
| **next-themes** | Dark / light mode support |
| **js-cookie** | Auth token management in browser cookies |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | HTTP server and REST API routing |
| **@supabase/supabase-js** | Official Supabase client for PostgreSQL queries |
| **JSON Web Token (JWT)** | Stateless authentication tokens |
| **bcryptjs** | Password hashing before database storage |
| **Nodemailer** | Email sending for invoices and RFQ invitations |
| **Multer** | File upload handling (RFQ attachments) |
| **pdfkit** | Server-side PDF generation for invoices |
| **Zod** | Request body validation and schema enforcement |
| **cors** | Cross-origin request handling |
| **helmet** | Secure HTTP response headers |
| **morgan** | HTTP request logging |
| **express-rate-limit** | API rate limiting to prevent abuse |
| **dotenv** | Environment variable loading |
| **date-fns** | Date formatting utilities |
| **uuid** | Unique ID generation |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Primary relational database |
| **Supabase Storage** | File storage for RFQ attachments |
| **Supabase RLS** | Row Level Security for data isolation |
| **Vercel** | Frontend deployment |
| **Railway / Render** | Backend deployment |

---

## 📁 Project Structure

```
vendorbridge/
├── vendorbridge-frontend/          # Next.js Application
└── vendorbridge-backend/           # Node.js + Express API
```

### Backend Structure
```
vendorbridge-backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # Supabase connection + startup test
│   │   ├── email.js                # Nodemailer transporter config
│   │   └── constants.js            # App-wide constants
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification middleware
│   │   ├── rbac.js                 # Role-based access control
│   │   ├── validate.js             # Zod request validation
│   │   ├── errorHandler.js         # Global error handler
│   │   └── upload.js               # Multer file upload config
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── vendor.routes.js
│   │   ├── rfq.routes.js
│   │   ├── quotation.routes.js
│   │   ├── approval.routes.js
│   │   ├── purchaseOrder.routes.js
│   │   ├── invoice.routes.js
│   │   ├── analytics.routes.js
│   │   └── notification.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── vendor.controller.js
│   │   ├── rfq.controller.js
│   │   ├── quotation.controller.js
│   │   ├── approval.controller.js
│   │   ├── purchaseOrder.controller.js
│   │   ├── invoice.controller.js
│   │   ├── analytics.controller.js
│   │   └── notification.controller.js
│   ├── services/
│   │   ├── email.service.js        # Invoice emails, RFQ invitations
│   │   ├── pdf.service.js          # Invoice PDF generation
│   │   ├── log.service.js          # Activity log writer
│   │   └── notification.service.js # User notification sender
│   ├── schemas/
│   │   ├── auth.schema.js
│   │   ├── rfq.schema.js
│   │   ├── quotation.schema.js
│   │   └── vendor.schema.js
│   ├── utils/
│   │   ├── generatePONumber.js     # PO-2025-0001 format
│   │   ├── generateInvoiceNumber.js
│   │   ├── calculateTax.js
│   │   └── apiResponse.js          # Standard { success, message, data } format
│   └── app.js                      # Express app setup
├── server.js                       # Entry point
├── .env                            # Environment variables (never commit)
└── package.json
```

### Frontend Structure
```
vendorbridge-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Shared sidebar + navbar shell
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx            # Admin dashboard
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── vendors/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   ├── officer/
│   │   │   │   ├── page.tsx            # Officer dashboard
│   │   │   │   ├── rfqs/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── create/page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── quotations/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [rfqId]/compare/page.tsx
│   │   │   │   ├── purchase-orders/page.tsx
│   │   │   │   └── invoices/page.tsx
│   │   │   ├── vendor/
│   │   │   │   ├── page.tsx            # Vendor dashboard
│   │   │   │   ├── rfqs/page.tsx
│   │   │   │   ├── quotations/
│   │   │   │   │   └── [id]/submit/page.tsx
│   │   │   │   └── purchase-orders/page.tsx
│   │   │   └── manager/
│   │   │       ├── page.tsx            # Manager dashboard
│   │   │       ├── approvals/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── reports/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── RoleSidebar.tsx         # Role-specific nav links
│   │   ├── dashboard/
│   │   │   ├── KPICard.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── rfq/
│   │   │   ├── RFQForm.tsx
│   │   │   ├── RFQCard.tsx
│   │   │   └── RFQItemsTable.tsx
│   │   ├── quotation/
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── QuotationCard.tsx
│   │   ├── invoice/
│   │   │   ├── InvoiceTemplate.tsx     # Printable HTML invoice
│   │   │   └── InvoiceActions.tsx      # Download / Email / Print buttons
│   │   └── shared/
│   │       ├── StatusBadge.tsx
│   │       ├── DataTable.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── Notifications.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts               # Axios instance with auth interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── vendor.api.ts
│   │   │   ├── rfq.api.ts
│   │   │   ├── quotation.api.ts
│   │   │   ├── approval.api.ts
│   │   │   ├── purchaseOrder.api.ts
│   │   │   ├── invoice.api.ts
│   │   │   └── analytics.api.ts
│   │   └── utils/
│   │       ├── formatCurrency.ts       # ₹1,25,000 Indian format
│   │       ├── formatDate.ts
│   │       └── cn.ts                   # Tailwind class merger
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRFQs.ts
│   │   ├── useQuotations.ts
│   │   └── useNotifications.ts
│   ├── store/
│   │   ├── authStore.ts                # Zustand: user, token, role
│   │   └── notificationStore.ts
│   ├── types/
│   │   └── index.ts                    # All TypeScript interfaces
│   └── middleware.ts                   # Next.js route protection by role
├── .env.local                          # Environment variables (never commit)
└── package.json
```

---

## 🎭 Features & Role-Based Dashboards

VendorBridge has **4 completely separate dashboards**, each tailored to a specific role.

### 👑 Admin Dashboard
> Full system oversight and user/vendor management

- **KPIs:** Total Users · Total Vendors · Total RFQs This Month · Total Spend (₹)
- User management — create, assign roles, activate/deactivate
- Vendor registry — full CRUD with GST details, category, status tracking
- System analytics chart — monthly procurement volume
- Vendor performance table — ranked by rating, POs awarded, on-time delivery
- Real-time activity log feed across all users

### 📋 Procurement Officer Dashboard
> Day-to-day procurement workflow management

- **KPIs:** Active RFQs · Pending Quotations · Awaiting Approval Submission · POs This Month
- Create RFQs with dynamic line items, vendor assignment, and file attachments
- View incoming quotations and launch side-by-side comparison
- Submit selected quotations for managerial approval
- Generate Purchase Orders and Invoices from approved quotations
- Download, print, or email invoices directly

### 🏪 Vendor Dashboard
> Submit quotations and track procurement status

- **KPIs:** Open RFQ Invitations · Quotations Submitted · POs Received · Pending Invoices
- View RFQs assigned to your account with deadlines
- Submit and edit quotations (price per item, delivery timeline, notes)
- Track quotation status — submitted / selected / rejected
- View Purchase Orders issued to you
- Download and track invoices

### ✅ Manager / Approver Dashboard
> Review and approve procurement decisions

- **KPIs:** Pending Approvals · Approved This Month · Rejected This Month · Avg Approval Time
- Pending approvals queue sorted by submission date
- Full quotation comparison context before approving
- Approve or reject with mandatory remarks
- Approval history timeline with full audit trail
- Monthly approval trend chart (approved vs rejected)

---

## 🔄 Procurement Workflow

```
1. Admin registers vendors in the system
         ↓
2. Procurement Officer creates an RFQ
   (title, line items, deadline, attached docs)
         ↓
3. Assigned vendors receive invitations
   and submit their quotations (price, delivery days, notes)
         ↓
4. Officer compares all quotations side-by-side
   and selects the winning vendor
         ↓
5. Officer submits the selection for managerial approval
         ↓
6. Manager reviews and APPROVES or REJECTS with remarks
   ├── Rejected → Officer notified, can re-select or renegotiate
   └── Approved ↓
7. Purchase Order auto-generated with unique PO number
   Vendor notified of PO issuance
         ↓
8. Invoice generated from PO
   (with GST calculation, due date, line items)
         ↓
9. Invoice → Download PDF / Print / Email to vendor
         ↓
10. All steps tracked in Activity Logs & Analytics
```

---

## 📡 API Endpoints

**Base URL:** `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <JWT_TOKEN>`

---

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register new user with role |
| `POST` | `/auth/login` | Public | Login → returns JWT + user info |
| `POST` | `/auth/logout` | Auth | Logout / invalidate session |
| `POST` | `/auth/forgot-password` | Public | Send password reset email |
| `POST` | `/auth/reset-password` | Public | Reset password via token |
| `GET` | `/auth/me` | Auth | Get current logged-in user |
| `PATCH` | `/auth/me` | Auth | Update own profile / password |

---

### 👥 User Management — `/api/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/users` | Admin | List all users (filter by role, status) |
| `POST` | `/users` | Admin | Create user and assign role |
| `GET` | `/users/:id` | Admin | Get single user detail |
| `PUT` | `/users/:id` | Admin | Update user info or role |
| `PATCH` | `/users/:id/status` | Admin | Activate / deactivate user |
| `DELETE` | `/users/:id` | Admin | Delete user |

---

### 🏢 Vendor Management — `/api/vendors`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/vendors` | Admin, Officer, Manager | List vendors with search & filters |
| `POST` | `/vendors` | Admin | Register new vendor |
| `GET` | `/vendors/:id` | Admin, Officer | Vendor detail + stats |
| `PUT` | `/vendors/:id` | Admin | Update vendor info |
| `PATCH` | `/vendors/:id/status` | Admin | active / inactive / blocked |
| `GET` | `/vendors/:id/history` | Admin, Officer | Past RFQs and POs |
| `GET` | `/vendors/:id/quotations` | Admin, Officer | All quotations by vendor |

---

### 📄 RFQ Management — `/api/rfqs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/rfqs` | Officer, Manager, Admin | List all RFQs |
| `POST` | `/rfqs` | Officer | Create new RFQ with items |
| `GET` | `/rfqs/:id` | Officer, Manager, Admin | RFQ detail |
| `PUT` | `/rfqs/:id` | Officer | Update RFQ (draft/open only) |
| `DELETE` | `/rfqs/:id` | Officer, Admin | Cancel / delete RFQ |
| `POST` | `/rfqs/:id/vendors` | Officer | Assign vendors → send invites |
| `DELETE` | `/rfqs/:id/vendors/:vendorId` | Officer | Remove vendor from RFQ |
| `PATCH` | `/rfqs/:id/publish` | Officer | Publish draft (status: open) |
| `PATCH` | `/rfqs/:id/close` | Officer | Close for submissions |
| `GET` | `/rfqs/:id/quotations` | Officer, Manager | All quotations for RFQ |
| `GET` | `/rfqs/:id/compare` | Officer | Side-by-side comparison data |
| `POST` | `/rfqs/:id/attachments` | Officer | Upload file attachments |
| `DELETE` | `/rfqs/:id/attachments/:attachId` | Officer | Delete attachment |
| `GET` | `/rfqs/vendor/assigned` | Vendor | RFQs assigned to logged-in vendor |

---

### 💬 Quotations — `/api/quotations`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/quotations` | Officer (all), Vendor (own) | List quotations |
| `POST` | `/quotations` | Vendor | Submit new quotation |
| `GET` | `/quotations/:id` | Officer, Vendor (own), Manager | Quotation detail |
| `PUT` | `/quotations/:id` | Vendor | Edit quotation (before deadline) |
| `PATCH` | `/quotations/:id/select` | Officer | Mark as selected winner |
| `PATCH` | `/quotations/:id/reject` | Officer | Mark as rejected |

---

### ✅ Approval Workflow — `/api/approvals`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/approvals` | Manager (pending), Officer (submitted) | List approvals |
| `POST` | `/approvals` | Officer | Submit quotation for approval |
| `GET` | `/approvals/:id` | Officer, Manager, Admin | Approval detail + timeline |
| `PATCH` | `/approvals/:id/approve` | Manager | Approve with remarks |
| `PATCH` | `/approvals/:id/reject` | Manager | Reject with mandatory remarks |
| `GET` | `/approvals/pending` | Manager | Pending approvals count + list |
| `GET` | `/approvals/history` | Admin, Manager | Full audit trail |

---

### 📦 Purchase Orders — `/api/purchase-orders`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/purchase-orders` | Officer, Manager, Admin, Vendor (own) | List POs |
| `POST` | `/purchase-orders` | Officer | Generate PO from approved quotation |
| `GET` | `/purchase-orders/:id` | Officer, Manager, Vendor (own) | PO detail |
| `PATCH` | `/purchase-orders/:id/status` | Officer | Update PO status |
| `GET` | `/purchase-orders/vendor/mine` | Vendor | POs for logged-in vendor |

---

### 🧾 Invoices — `/api/invoices`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/invoices` | Officer, Manager, Admin | List all invoices |
| `POST` | `/invoices` | Officer | Generate invoice from PO |
| `GET` | `/invoices/:id` | Officer, Manager, Vendor (own) | Invoice detail |
| `GET` | `/invoices/:id/pdf` | Officer, Manager | Stream PDF download |
| `POST` | `/invoices/:id/send` | Officer | Email invoice to vendor |
| `PATCH` | `/invoices/:id/status` | Officer, Admin | Mark paid / void |
| `GET` | `/invoices/vendor/mine` | Vendor | Invoices for logged-in vendor |

---

### 📊 Analytics & Reports — `/api/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/analytics/dashboard` | All (role-filtered) | KPI cards data |
| `GET` | `/analytics/spending` | Admin, Manager, Officer | Monthly spending breakdown |
| `GET` | `/analytics/vendors` | Admin, Manager | Vendor performance metrics |
| `GET` | `/analytics/rfqs` | Admin, Officer | RFQ stats (open / closed / awarded) |
| `GET` | `/analytics/approvals` | Admin, Manager | Approval turnaround times |
| `GET` | `/analytics/export` | Admin | Export full report as CSV |

---

### 🔔 Notifications & Logs — `/api/notifications` + `/api/logs`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/notifications` | Auth (own) | Get notifications for current user |
| `PATCH` | `/notifications/:id/read` | Auth | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Auth | Mark all as read |
| `DELETE` | `/notifications/:id` | Auth | Delete notification |
| `GET` | `/logs` | Admin, Manager | Activity logs (paginated) |
| `GET` | `/logs?entity_type=rfq&entity_id=uuid` | Admin | Logs for specific entity |

---

## 🔐 Environment Variables

### Backend — `vendorbridge-backend/.env`

```env
# ─── Server ────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Supabase ──────────────────────────────────────────────────────────────
# Get from: supabase.com → your project → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ─── PostgreSQL Direct Connection ──────────────────────────────────────────
# Get from: supabase.com → Settings → Database → Connection string → URI
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# ─── JWT ───────────────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# ─── Email (Nodemailer) ────────────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password-16-chars
EMAIL_FROM=VendorBridge <your-gmail@gmail.com>

# ─── Frontend URL (CORS) ───────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ─── File Upload ───────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads/

# ─── Supabase Storage ──────────────────────────────────────────────────────
SUPABASE_STORAGE_BUCKET=rfq-attachments
```

### Frontend — `vendorbridge-frontend/.env.local`

```env
# ─── Backend API ───────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# ─── App Info ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=VendorBridge
NEXT_PUBLIC_APP_VERSION=1.0.0

# ─── Supabase (frontend uses ANON key ONLY — never service role) ───────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **Security Rules:**
> - Never commit `.env` or `.env.local` to GitHub — both are in `.gitignore`
> - `SUPABASE_SERVICE_ROLE_KEY` goes **only in the backend** — it bypasses RLS
> - `NEXT_PUBLIC_` prefix exposes variables to the browser — only put non-sensitive values here
> - Generate `JWT_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works)
- A Gmail account with App Password enabled (for email features)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/vendorbridge.git
cd vendorbridge
```

### 2. Backend setup

```bash
cd vendorbridge-backend

# Install dependencies
npm install

# Copy the env template and fill in your values
cp .env.example .env
# → Edit .env with your Supabase credentials, JWT secret, and email config

# Start the development server
npm run dev
# → Running on http://localhost:5000
```

### 3. Frontend setup

```bash
cd vendorbridge-frontend

# Install dependencies
npm install

# Copy the env template and fill in your values
cp .env.example .env.local
# → Edit .env.local with your API URL and Supabase anon key

# Initialize shadcn/ui (first time only)
npx shadcn@latest init

# Start the development server
npm run dev
# → Running on http://localhost:3000
```

### 4. Database setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run the migration SQL from `vendorbridge-backend/database/migrations.sql`
3. Create the storage bucket: **Storage** → **New bucket** → name: `rfq-attachments` → Private
4. Run the seed SQL to create the default admin user

### 5. Default admin credentials

```
Email:    admin@vendorbridge.com
Password: Admin@123
```

> Change this immediately after your first login.

### 6. Verify everything is working

```
Backend health check:  http://localhost:5000/health
Frontend:              http://localhost:3000  (redirects to /login)
```

---

## 🗄️ Database Schema

### Tables Overview

| Table | Description |
|---|---|
| `users` | All users with role (admin / officer / vendor / manager) |
| `vendors` | Vendor registry with GST, contact, category, status |
| `rfqs` | Request for Quotations with status lifecycle |
| `rfq_items` | Line items for each RFQ (product, quantity, unit) |
| `rfq_attachments` | File attachments linked to RFQs |
| `rfq_vendors` | Join table — which vendors are assigned to which RFQ |
| `quotations` | Vendor quotation submissions with pricing |
| `quotation_items` | Per-item pricing linked to RFQ items |
| `approvals` | Approval requests with status, remarks, timeline |
| `purchase_orders` | Auto-generated POs from approved quotations |
| `invoices` | Invoices generated from POs with tax calculations |
| `activity_logs` | Full audit trail of every action |
| `notifications` | Per-user notification records |
| `sequences` | Counter table for PO / RFQ / Invoice number generation |

### Key Relationships

```
rfqs ──────────────── rfq_items          (1 RFQ has many items)
rfqs ──────────────── rfq_vendors        (many-to-many with vendors)
rfqs ──────────────── quotations         (1 RFQ receives many quotations)
quotations ─────────── quotation_items   (1 quotation has many item prices)
quotations ─────────── approvals         (selected quotation goes to approval)
approvals ──────────── purchase_orders   (approved → PO generated)
purchase_orders ─────── invoices         (PO → Invoice generated)
users ──────────────── activity_logs     (every action logged)
users ──────────────── notifications     (per-user notifications)
```

---

## 🏆 Hackathon

Built for the **VendorBridge Procurement & Vendor Management ERP** hackathon challenge.

**Key technical highlights demonstrated:**
- Role-based JWT authentication with route protection on both frontend and backend
- Row Level Security (RLS) in Supabase for data isolation between roles
- Automated PDF invoice generation (pdfkit) and email delivery (Nodemailer)
- Full approval workflow with state machine transitions
- Real-time notifications on procurement status changes
- Side-by-side quotation comparison with lowest-price highlighting
- Exportable analytics and full audit logs
- AI-powered procurement assistant (Claude API integration)

---

<div align="center">

**VendorBridge** — Built with ❤️ for the Hackathon

</div>
