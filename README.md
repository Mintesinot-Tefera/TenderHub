# TenderHub — Tender Bidding Platform

A full-stack tender bidding platform where organizations publish tenders and bidders submit competitive proposals.

## Tech Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Backend  | Node.js · TypeScript · Express · PostgreSQL        |
| Frontend | React · TypeScript · Vite · Tailwind CSS · Router  |
| Auth     | JWT (Bearer tokens) · bcrypt                       |
| Arch     | Clean Architecture (Domain / Application / Infra / Presentation) |

## Features

- **User roles** — Admin, Organization, Bidder with role-based route guards
- **Tender browsing** — Card grid with category/status filters, full-text search, pagination
- **Bid submission** — Bidders submit proposals with amount & delivery time (one bid per tender)
- **Business rules** — Cannot bid on closed/expired tenders, cannot bid on own tenders, cannot self-register as admin
- **Modern responsive UI** — Mobile-first design, sticky search bar, skeleton loaders

---

## Backend Architecture (Clean Architecture)

```
backend/src/
├── domain/                  # Enterprise business rules (no dependencies)
│   ├── entities/            # User, Tender, Bid, Category
│   ├── repositories/        # Repository interfaces (ports)
│   └── errors/              # Domain errors
├── application/             # Application business rules
│   ├── use-cases/           # RegisterUser, LoginUser, ListTenders, SubmitBid...
│   ├── dtos/                # Input/output contracts
│   └── services/            # Service interfaces (IPasswordHasher, ITokenService)
├── infrastructure/          # Frameworks & drivers (adapters)
│   ├── database/            # PostgreSQL pool, schema, migrations, seed
│   ├── repositories/        # Pg* repository implementations
│   └── auth/                # Bcrypt hasher, JWT service
├── presentation/            # HTTP layer
│   ├── controllers/         # Request → use case → response
│   ├── routes/              # Route definitions
│   ├── middlewares/         # Auth, error handler, async wrapper
│   └── validators/          # Zod schemas
├── container.ts             # Composition root (DI wiring)
├── app.ts                   # Express app
└── server.ts                # Entry point
```

**Dependency rule:** `domain` ← `application` ← `infrastructure` / `presentation`
The domain layer has zero external dependencies. Use cases depend only on interfaces.

---

## Getting Started

### Option A — Docker (recommended)

**Prerequisites:** Docker & Docker Compose

```bash
docker compose up --build
```

That's it. The stack starts in dependency order:

| Service  | URL                       | Notes                                          |
| -------- | ------------------------- | ---------------------------------------------- |
| Frontend | http://localhost:5173     | React SPA served by nginx                      |
| Backend  | http://localhost:5000     | Migrations run automatically on start          |
| Postgres | internal only (`db:5432`) | Data persists in named volume `pgdata`         |

**Seed sample data** (optional — wipes existing data):

```bash
docker compose exec backend node dist/infrastructure/database/seed.js
```

**Other useful commands:**

```bash
docker compose logs -f backend    # tail backend logs
docker compose down               # stop all services
docker compose down -v            # stop + wipe db/uploads volumes
```

### Option B — Local development

**Prerequisites:** Node.js 20+, Docker (for Postgres only)

```bash
# 1. Database
docker run -d --name tender-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tender_platform \
  -p 5432:5432 postgres:16-alpine

# 2. Backend
cd backend
cp .env.example .env     # adjust DATABASE_URL / JWT_SECRET
npm install
npm run db:migrate       # create tables
npm run db:seed          # load sample data
npm run dev              # → http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev              # → http://localhost:5173
```

### Running Tests

```bash
cd backend && npm test     # Jest — use cases, controllers, middlewares
cd frontend && npm test    # Vitest — components, hooks, API layer
```

---

## Test Accounts

All seeded accounts use password `password123`

| Role         | Email               |
| ------------ | ------------------- |
| Admin        | admin@tender.com    |
| Organization | org1@tender.com     |
| Bidder       | bidder@tender.com   |

---

## API Endpoints

| Method | Path                    | Auth      | Description                    |
| ------ | ----------------------- | --------- | ------------------------------ |
| POST   | `/api/auth/register`    | —         | Create account (Bidder/Org)    |
| POST   | `/api/auth/login`       | —         | Login → JWT                    |
| GET    | `/api/auth/me`          | Bearer    | Current user                   |
| PATCH  | `/api/auth/profile`     | Bearer    | Update name, company, phone (+251), avatar URL |
| GET    | `/api/categories`       | —         | List categories                |
| GET    | `/api/tenders`          | —         | List tenders (`?search=&categoryId=&status=&page=&limit=`) |
| GET    | `/api/tenders/:id`      | —         | Tender details                 |
| POST   | `/api/tenders/:id/bids` | Bidder    | Submit bid (one per tender)    |
| GET    | `/api/bids/my`          | Bidder    | My bids (with tender info)     |
| PATCH  | `/api/bids/:id`         | Bidder    | Edit own bid (if editable)     |
| DELETE | `/api/bids/:id`         | Bidder    | Withdraw own bid               |

### Bid Lifecycle Rules

- **Duplicate prevention** — one active bid per `(tender, bidder)` pair
- **Editable statuses** — `SUBMITTED`, `UNDER_REVIEW` only; tender must still be open
- **Withdraw** — soft-delete (status → `WITHDRAWN`); can re-apply while tender is open (reuses same row)
- **Ownership** — users can only edit/withdraw their own bids (403 otherwise)
