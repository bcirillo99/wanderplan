import sys
from pathlib import Path
from sqlalchemy import text
from travel_planner.db.session import SessionLocal

def run_sql_file(path: str):
    sql = Path(path).read_text()
    statements = [s.strip() for s in sql.split(";") if s.strip()]

    with SessionLocal() as db:
        try:
            for stmt in statements:
                db.execute(text(stmt))
            db.commit()
            print(f"OK — {len(statements)} statements eseguiti da '{path}'")
        except Exception as e:
            db.rollback()
            print(f"ERRORE: {e}")
            raise

if __name__ == "__main__":
    sql_file = sys.argv[1] if len(sys.argv) > 1 else "seed.sql"
    run_sql_file(sql_file)
