# WanderPlan

A full-stack trip planning app. Organise flights, accommodations, transports, activities, packing lists, budget tracking, and notes — all in one place.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19 + TypeScript + Vite + React Router     |
| Backend   | FastAPI + SQLAlchemy v2 + Alembic               |
| Database  | PostgreSQL 16                                   |
| Packaging | uv (Python), npm (Node)                         |

---

## Project Structure

```
wanderplan/
├── backend/
│   ├── src/travel_planner/
│   │   ├── db/            # SQLAlchemy models + migrations
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # Business logic layer
│   │   └── config.py      # Settings (DATABASE_URL from .env)
│   ├── tests/             # Pytest test suite
│   ├── alembic/           # Database migration scripts
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API client functions
│   │   ├── components/
│   │   │   ├── forms/     # Individual form components + formOptions.ts
│   │   │   └── tabs/      # Tab components + TabShared + tabUtils
│   │   ├── hooks/         # useTripData — data fetching + mutations
│   │   ├── pages/         # TripDetailPage, TripDayPage, HomePage
│   │   └── types/         # TypeScript interfaces
│   └── package.json
└── docker-compose.yml     # PostgreSQL service
```

---

## Setup

### Prerequisites

- Python 3.13+
- Node 20+
- Docker (for PostgreSQL) or a local PostgreSQL instance

### 1. Start the database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend

# Install dependencies
uv sync

# Create .env with database URL
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wanderplan" > .env

# Run migrations
uv run alembic upgrade head

# Start dev server (port 8000)
uv run fastapi dev src/travel_planner/main.py
```

### 3. Frontend

```bash
cd frontend

npm install
npm run dev   # starts on http://localhost:5173
```

---

## API Overview

Base URL: `http://localhost:8000`

| Resource        | Base path                              |
|-----------------|----------------------------------------|
| Trips           | `/trips`                               |
| Activities      | `/trips/{trip_id}/activities`          |
| Flights         | `/trips/{trip_id}/flights`             |
| Accommodations  | `/trips/{trip_id}/accommodations`      |
| Transports      | `/trips/{trip_id}/transports`          |
| Extras          | `/trips/{trip_id}/extras`              |
| Packing items   | `/trips/{trip_id}/packing-items`       |
| Notes           | `/trips/{trip_id}/notes`               |
| Budget stats    | `/trips/{trip_id}/stats`               |
| Daily summary   | `/trips/{trip_id}/days/{date}/summary` |

All collections support `GET` (list), `POST` (create), and individual items support `GET`, `PATCH`, `DELETE`.

Interactive docs: `http://localhost:8000/docs`

---

## Database Migrations

```bash
cd backend

# Generate migration after model changes
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1
```

---

## Tests

```bash
cd backend
uv run pytest
```

Tests use an in-memory SQLite database — no running PostgreSQL needed.

---

## Features

- **Trips** — create and manage trips with dates, destination, cover image
- **Days** — auto-generated from trip date range, with per-day timeline view
- **Activities** — scheduled activities with time, location, cost, status
- **Flights** — origin/destination, departure/arrival times, airline, booking ref
- **Accommodations** — check-in/out dates, cost per night, booking status
- **Transports** — ground/rail/sea transfers between locations
- **Extras** — miscellaneous costs (visas, insurance, etc.)
- **Packing list** — categorised checklist with progress bar
- **Budget** — aggregated cost breakdown across all categories
- **Notes** — freeform trip notes with timestamps
