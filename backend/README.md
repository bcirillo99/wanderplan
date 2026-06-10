# Wanderplan — Backend

FastAPI backend for the Wanderplan travel planning application.

## Tech Stack

- **Python 3.13**
- **FastAPI** — REST API framework
- **SQLAlchemy v2** — ORM with typed models (src layout, installed as editable package)
- **Alembic** — database migrations and versioning
- **PostgreSQL 16** — relational database (runs via Docker)
- **Pydantic v2 + pydantic-settings** — data validation and environment configuration
- **uv** — dependency and virtual environment management

## Project Structure

```
backend/
├── src/
│   └── travel_planner/
│       ├── config.py           # environment variables (DATABASE_URL)
│       ├── main.py             # FastAPI entrypoint
│       ├── db/
│       │   ├── base.py         # SQLAlchemy DeclarativeBase
│       │   ├── session.py      # engine, SessionLocal, get_db()
│       │   ├── enums.py        # shared enums (Status, AccommodationType, ...)
│       │   └── models/
│       ├── schemas/            # Pydantic schemas (API input/output)
│       ├── routers/            # FastAPI route handlers
│       └── services/           # business logic
├── alembic/
│   ├── versions/               # auto-generated migration files
│   └── env.py                  # Alembic configuration
├── tests/
├── pyproject.toml
├── .env                        # local environment variables (not committed)
└── Dockerfile
```

## Data Model

The database is built around a `Trip` as the top-level entity. Everything else belongs to a trip.

| Entity | Description | Parent |
|---|---|---|
| `Trip` | A travel plan with dates and destination | — |
| `Activity` | Something to do on a specific date (no `Day` table; the date lives on the activity) | Trip |
| `Flight` | A flight leg | Trip |
| `Transport` | Any non-flight transfer (train, bus, car, ...) | Trip |
| `Accommodation` | A place to stay (hotel, airbnb, lodge, ...) | Trip |
| `PackingItem` | An item on the packing list | Trip |
| `Extra` | An additional cost entry (was `Expense`) | Trip |
| `Note` | A freeform note attached to the trip | Trip |

All children link directly to `Trip` via `trip_id` with `ON DELETE CASCADE`.

`Transport` and `Accommodation` include an `extra_details` JSONB column for type-specific fields (e.g. train number, Airbnb code).

All bookable entities (`Flight`, `Transport`, `Accommodation`, `Activity`) share a common `Status` enum: `draft → to_book → booked → cancelled / completed`.

### Trip date changes cascade

Shrinking a trip's `start_date`/`end_date` will delete related items that fall outside the new range (activities, flights, transports, accommodations). To prevent silent data loss, `PATCH /trips/{id}` returns **409 Conflict** with a deletion preview unless the caller passes `?confirm=true`. The frontend surfaces this as a confirmation modal.

## Getting Started

### Prerequisites

- Python 3.13
- [uv](https://github.com/astral-sh/uv)
- Docker Desktop

### Setup

You have two options. For the full-stack containerized setup (one command), see the [root README](../README.md). This guide covers backend-only dev mode (hot reload).

1. Move into the backend folder:
```bash
cd wanderplan/backend
```

2. Install dependencies and the package in editable mode:
```bash
uv sync
uv pip install -e .
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Start the database (root compose runs only the `db` service):
```bash
docker compose -f ../docker-compose.yml up -d db
```

5. Run database migrations:
```bash
uv run alembic upgrade head
```

6. Start the development server:
```bash
uv run fastapi dev src/travel_planner/main.py
```

### Containerized mode

The backend ships with a `Dockerfile` and `entrypoint.sh`. The entrypoint runs `alembic upgrade head` on every container start (migrations are idempotent), then launches uvicorn on `:8000`. Migrations don't need to be applied manually in this mode.

Build and run as part of the full stack:
```bash
docker compose up -d --build           # from repo root
```

Build only this service:
```bash
docker compose build backend           # from repo root
```

### Database Migrations

Migrations are managed with Alembic. Every change to a SQLAlchemy model must be followed by a new migration.

Generate a migration after modifying a model:
```bash
uv run alembic revision --autogenerate -m "describe your change"
```

Apply pending migrations:
```bash
uv run alembic upgrade head
```

Roll back the last migration:
```bash
uv run alembic downgrade -1
```

### How the DB connection works

PostgreSQL runs inside a Docker container and exposes port `5432` on your local machine. The backend connects to it via `DATABASE_URL` in `.env`:

```
postgresql://postgres:postgres@localhost:5432/wanderplan
```

Data is stored in a named Docker volume (`postgres_data`) and persists across container restarts. It is only lost if the volume is explicitly deleted.

## Development Tools

Run linting:
```bash
uv run ruff check .
```

Run type checking:
```bash
uv run mypy src/
```

Run tests:
```bash
uv run pytest
```

Tests use an in-memory SQLite database — no running PostgreSQL needed.

## API Overview

Base URL: `http://localhost:8000` — interactive docs at `/docs`.

| Resource        | Base path                              |
|-----------------|----------------------------------------|
| Trips           | `/trips`                               |
| Activities      | `/trips/{trip_id}/activities`          |
| Flights         | `/trips/{trip_id}/flights`             |
| Accommodations  | `/trips/{trip_id}/accommodations`      |
| Transports      | `/trips/{trip_id}/transports`          |
| Extras          | `/trips/{trip_id}/extras`              |
| Packing items   | `/trips/{trip_id}/packing_items`       |
| Notes           | `/trips/{trip_id}/notes`               |
| Budget stats    | `/trips/{trip_id}/stats`               |
| Daily summary   | `/trips/{trip_id}/days/{date}/summary` |

All collections: `GET` (list), `POST` (create). Individual items: `GET`, `PATCH`, `DELETE`.