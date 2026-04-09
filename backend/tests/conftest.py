"""
Test configuration and shared fixtures.
in-memory SQLite database was used to avoid requiring a running PostgreSQL instance.
UUID and JSONB PostgreSQL types are remapped to CHAR(32) and TEXT for SQLite compatibility.
Foreign keys are explicitly enabled via PRAGMA so CASCADE deletes work as expected.
"""
import os

# Must be set BEFORE any travel_planner import so that pydantic-settings
# can build Settings() without a real DATABASE_URL in the environment.
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from travel_planner.main import app
from travel_planner.db.session import get_db
from travel_planner.db.base import Base
import travel_planner.db.models  # noqa: F401 – registers all ORM models with Base


# SQLite compatibility: override DDL for PostgreSQL-specific column types

@compiles(PG_UUID, "sqlite")
def _compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(32)"


@compiles(JSONB, "sqlite")
def _compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool, #StaticPool forces all connections to reuse the same underlying sqlite3 connection
    )

    # Enable FK enforcement so CASCADE deletes work as in PostgreSQL.
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()

    yield session

    session.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def client(db):
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()