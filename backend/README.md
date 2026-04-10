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
| `Day` | A single day within a trip | Trip |
| `Activity` | Something to do on a specific day | Day |
| `Flight` | A flight leg | Trip |
| `Transport` | Any non-flight transfer (train, bus, car, ...) | Trip |
| `Accommodation` | A place to stay (hotel, airbnb, lodge, ...) | Trip |
| `PackingItem` | An item on the packing list | Trip |
| `Expense` | A cost entry (estimated or actual) | Trip |

Relations: `Trip` 1:N `Day`, `Day` 1:N `Activity`, `Trip` 1:N everything else.

`Transport` and `Accommodation` include an `extra_details` JSONB column for type-specific fields (e.g. train number, Airbnb code).

All bookable entities (`Flight`, `Transport`, `Accommodation`, `Activity`) share a common `Status` enum: `draft → to_book → booked → cancelled / completed`.

## Getting Started

### Prerequisites

- Python 3.13
- [uv](https://github.com/astral-sh/uv)
- Docker Desktop

### Setup

1. Clone the repository and move into the backend folder:
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

4. Start the database:
```bash
docker compose up -d db
```

5. Run database migrations:
```bash
uv run alembic upgrade head
```

6. Start the development server:
```bash
uv run fastapi dev src/travel_planner/main.py
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

# TODO:
- l'entita giorno non ha senso o quantomeno ha senso nel momento in cui si vogliono soltanto mettere note per quel giorno. Secodno me deve essere levata. Forse ha più senso creare una vista per giorno delle attività dei trasporti etc quando accedo al sotto menu.
- Aggiungere menu iniziale quando si accede al viaggio con dei ripiloghi come- costo stimato (magare utilizzare quelle funznioni accessorie che avevamo creato)- cose da fare - panoramica breve attività per giorno come documento word
- attività per viaggio e non solo per giorno (cosi penso che a frontend vedrà anche attività)
- aggiungere magari una vista che raccoglie tutto e ordina per ora e giorni in una voce sumary
- aggiungere note per scrivere quello che si pensa
- Non funziona bene Expense nel senso che vorrei vedere: totale stimato ma anche quello sicur
- poter modificare viaggio anche quando si clicca sul viaggio

- Non è attualmente modificare gli item dai loro sotto menu. Non va bene.


- Versione 1.1 permettere di poter scaricare documento word stile viaggio Perù mio.
