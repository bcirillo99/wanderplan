# WanderPlan

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)

**Your travel organizer. 100% AI-free. *(For now...)*.**

For people who love planning trips themselves — flights, accommodations, activities, transport, packing, budget, notes — all in one place, built around your itinerary.

No subscriptions. No AI suggestions. No "let us book that for you." Just your trip, organized exactly the way you want it.

> Yes, AI can plan your trip in seconds. But half the fun is doing it yourself — obsessing over the itinerary, finding the hidden restaurant, building the perfect day. WanderPlan is for people who feel the same way.

---

## What you can do

- **Plan your itinerary day by day** — activities with time, location, cost, and status on a per-day timeline
- **Interactive map** — pin activities and accommodations on a map; color-coded by day, filterable, with an overview mini-map in the summary tab
- **Track flights** — origin/destination, departure/arrival times, airline, booking ref; search real flights via Google Flights
- **Manage accommodations** — check-in/out dates, nightly cost, booking status
- **Log ground transport** — transfers between locations (trains, buses, ferries, car rentals)
- **Track every cost** — extras like visas, insurance, SIM cards; full budget breakdown across all categories
- **Packing list** — categorized checklist with progress bar
- **Keep notes** — freeform trip notes with timestamps
- **Export** — download your full trip summary as `.pdf` or `.docx`
- **Cover photos** — automatic destination photos via Unsplash

> WanderPlan doesn't suggest anything — it just keeps track of what *you* decide.

## What's not there yet

- **No accounts / multi-user** — single user, local setup only; no sharing or collaboration
- **No mobile app** — web only (mobile-friendly layout, but no native app)
- **No real booking** — WanderPlan tracks what you've planned/booked elsewhere; it doesn't book anything
- **No notifications or reminders**

## Roadmap

These are directions the project is moving toward, gradually.

- **Auth + hosted version** — accounts and a public deployment, so self-hosting isn't required
- **Collaboration** — share a trip with travel companions
- **AI companion** *(the "for now" part)* — slowly introducing opt-in assistance: starting small (e.g. flag scheduling conflicts, answer questions about your own itinerary), without taking over the planning experience

---

## Screenshots

### Homepage
![Homepage](https://github.com/user-attachments/assets/0356bce7-2e9b-401a-b84c-22be1b0d9a72)

### Flights
![Flights](https://github.com/user-attachments/assets/63ba9243-e59a-4306-90a5-8862db86338b)

### Trip Detail
<p align="center">
  <img src="https://github.com/user-attachments/assets/f4c34bd9-caed-4ec6-88bc-c6dfeaf37bf1" width="48%" />
  <img src="https://github.com/user-attachments/assets/219797cc-89fb-4f62-a5a8-14a24ded6742" width="48%" />
</p>

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 19 + TypeScript + Vite + React Router     |
| Backend   | FastAPI + SQLAlchemy v2 + Alembic               |
| Database  | PostgreSQL 16                                   |
| Packaging | uv (Python), npm (Node)                         |

---

## Setup

### Prerequisites

- [Python 3.13+](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- [Node 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/products/docker-desktop/) — for the PostgreSQL database

### Running the app

```bash
git clone https://github.com/bcirillo99/wanderplan.git
cd wanderplan
```

WanderPlan has three parts that all need to run at the same time. Open **three terminal tabs**.

**Tab 1 — Database**

```bash
docker compose up -d
```

**Tab 2 — Backend**

```bash
cd backend

uv sync

echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wanderplan" > .env

uv run alembic upgrade head

uv run fastapi dev src/travel_planner/main.py
# running on http://localhost:8000
```

**Tab 3 — Frontend**

```bash
cd frontend

npm install

# Optional: Unsplash key for destination photos
cp .env.example .env   # then open .env and add your key

npm run dev
# running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173).

---

## External APIs & Libraries

| Name | Used for | Key required |
|------|----------|--------------|
| [Unsplash API](https://unsplash.com/developers) | Destination cover photos | Yes — `VITE_UNSPLASH_ACCESS_KEY` in `frontend/.env` (free tier: 50 req/hour) |
| [airportsdata](https://github.com/mborsetti/airportsdata) | Offline IATA airport search | No |
| [fli](https://github.com/punitarani/fli) | Google Flights scraping | No |
| [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) | Interactive maps | No |
| [Nominatim](https://nominatim.org/) (OpenStreetMap) | Location geocoding in map picker | No |
| [CARTO Voyager tiles](https://carto.com/basemaps/) | Map tile layer | No |

Unsplash is optional — cards fall back to gradient placeholders without a key.

---

## Credits

Frontend built with [Claude Code](https://claude.ai/code) by Anthropic.
