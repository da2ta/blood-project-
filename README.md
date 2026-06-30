# HemoExchange AI

**Connecting Hospitals. Saving Lives.**

A secure, enterprise-grade SaaS platform for inter-hospital blood inventory management and emergency blood exchange.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript + Prisma ORM |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |

## Project Structure

```
hemoexchange-ai/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── docs/            # Documentation
└── README.md
```

## Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project (free tier works for development)

## Local Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd blood-project
```

### 2. Server Setup

```bash
cd server
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The server runs on `http://localhost:3001`.

### 3. Client Setup

```bash
cd client
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

The client runs on `http://localhost:5173`.

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL direct connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (never expose) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `PORT` | Server port (default: 3001) |
| `NODE_ENV` | `development` or `production` |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (safe — guarded by RLS) |
| `VITE_API_URL` | Express backend URL |

## Available Scripts

### Server
- `npm run dev` — Start dev server with hot reload
- `npm run build` — Compile TypeScript
- `npm start` — Run compiled JavaScript
- `npx prisma studio` — Open Prisma database GUI
- `npx prisma migrate dev` — Run database migrations

### Client
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## License

Proprietary — All rights reserved.
