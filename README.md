# 🏥 MediCare — Clinic Appointment System

> A modern, full-stack clinic management platform for patients and admin staff. Book appointments, process payments, manage doctors, and run the clinic — all from one place.

![Stack](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-blue?style=flat-square)
![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square)
![Stack](https://img.shields.io/badge/Database-SQLite3-orange?style=flat-square)
![Stack](https://img.shields.io/badge/Payments-Stripe-purple?style=flat-square)

---

## ✨ Features

| Area | Highlights |
|------|-----------|
| **Patients** | Sign-up, secure login (JWT), book appointments, pay full or partial via Stripe |
| **Admin** | Manage doctors, patients, schedules, consultation fees, and clinic settings |
| **Payments** | Stripe-powered checkout with partial deposit & balance payment support |
| **Security** | scrypt password hashing, JWT auth, Helmet headers, CORS lockdown, rate limiting |
| **UI/UX** | Light/dark mode, responsive mobile layout, Toast notifications, subtle animations |

---

## 🖥️ Prerequisites

Make sure the following are installed on your machine before you start:

| Tool | Version | Link |
|------|---------|-------|
| Node.js | v18 or newer | https://nodejs.org |
| npm | comes with Node | — |
| Git | any recent version | https://git-scm.com |

You will also need a [Stripe account](https://stripe.com) (free) to obtain API keys for the payment flow.

---

## 🚀 Fresh Setup — Step by Step

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/aPPONIMENT_SYSTEM.git
cd aPPONIMENT_SYSTEM
```

---

### 2. Configure environment variables

The project uses two separate `.env` files — one for the frontend and one for the backend. Template files are already committed; you just need to fill in the real values.

#### 2a. Backend (`server/.env`)

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in every value:

```env
PORT=3000

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-strong-random-secret-here

DB_PATH=./clinic.db
FRONTEND_URL=http://localhost:5173

# From https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_REPLACE_ME

# From https://dashboard.stripe.com/test/webhooks
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
```

#### 2b. Frontend (root `.env`)

Create a `.env` file in the project root:

```bash
# On Mac/Linux
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

Add your Stripe **publishable** key (safe to use on the frontend):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME
```

> **Where to find Stripe keys:** Log in to [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys).  
> Use **Test mode** keys (prefixed `sk_test_` and `pk_test_`) during development.

---

### 3. Install dependencies

```bash
# Frontend dependencies (from project root)
npm install

# Backend dependencies
cd server
npm install
cd ..
```

---

### 4. Start the development servers

A single command starts both the React frontend and the Express API concurrently:

```bash
npm run all
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3000 |

The SQLite database (`server/clinic.db`) is created automatically on first run with all tables and default settings initialised.

---

### 5. Set up the Stripe webhook (for payment confirmations)

Stripe needs to notify your backend when a payment succeeds. During development, use the Stripe CLI to forward webhook events to your local server:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to http://localhost:3000/api/payments/webhook
```

Copy the **webhook signing secret** printed in the terminal and paste it into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 🔑 Default Admin Credentials

On first run, an admin account is seeded automatically:

| Field | Value |
|-------|-------|
| Login type | Staff / Admin |
| Password | `admin` |

> **Change this immediately** after your first login via the Admin Panel → Change Password.

---

## 🏗️ Project Structure

```
aPPONIMENT_SYSTEM/
├── src/                    # React frontend (Vite)
│   ├── components/         # Shared UI components (Sidebar, Toast, ErrorBoundary…)
│   ├── context/            # AppContext — global state + authFetch + JWT management
│   ├── hooks/              # useApi — reusable fetch hook with AbortController
│   └── pages/              # Route-level pages (Dashboard, Appointments, Payment…)
├── server/                 # Node.js + Express backend
│   ├── index.js            # All API routes, middleware (Helmet, CORS, JWT, Morgan)
│   ├── db.js               # SQLite schema init + migrations + indexes
│   ├── .env                # Secret config — NOT committed to git
│   └── .env.example        # Safe template — committed to git ✅
├── .gitignore              # Excludes .env, *.db, node_modules, dist, logs…
└── README.md               # You are here
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router v7, Vite 7 |
| Styling | Vanilla CSS with design tokens, dark mode, subtle animations |
| Backend | Node.js, Express 4, Morgan (logging) |
| Database | SQLite3 with indexed schema and atomic transactions |
| Auth | JWT (jsonwebtoken), scrypt password hashing |
| Payments | Stripe (PaymentIntents, webhooks, INR currency) |
| Security | Helmet, express-rate-limit, CORS lockdown, parameterised queries |

---

## 🔒 Security Notes

- All `.env` files are excluded from git via `.gitignore`
- The SQLite database (`clinic.db`) is also excluded — it contains real patient data
- Passwords are hashed with **scrypt** (never stored in plain text)
- All mutation routes require a valid **JWT Bearer token**
- Admin-only routes additionally require `role: admin` in the token payload
- Rate limiting is applied to payment endpoints
- CORS is locked to `FRONTEND_URL` only

---

## 🚢 Production Deployment

For any environment beyond a single developer's machine, run the backend with **PM2** for automatic restart on crash, log rotation, and process monitoring:

```bash
npm install -g pm2
pm2 start server/index.js --name medicare-api --env production
pm2 startup   # auto-start on server reboot
pm2 save
```

Set `NODE_ENV=production` in your server environment so Morgan uses the `combined` log format and error messages are sanitised before reaching the client.

---

*Body is just an arrangement of bones held together by flesh and blood,what makes it alive is the soul* 🩺✨
