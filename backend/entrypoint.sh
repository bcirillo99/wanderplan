#!/usr/bin/env bash
set -euo pipefail

# Apply pending migrations before serving. Migrations are idempotent so this is
# safe to run on every container start.
uv run alembic upgrade head

exec uv run uvicorn travel_planner.main:app --host 0.0.0.0 --port 8000
