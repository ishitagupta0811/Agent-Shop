import sqlite3
import logging
from contextlib import contextmanager
from typing import Generator
from config.settings import settings

logger = logging.getLogger("agentshop.db")

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """
    Context manager providing a SQLite database connection.
    Enforces Foreign Keys and WAL Mode for high performance.
    """
    # Ensure data directory exists
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(settings.DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error: {str(e)}")
        raise e
    finally:
        conn.close()

def init_db() -> None:
    """
    Initializes database schema using data/schema.sql.
    """
    if not settings.SCHEMA_SQL_PATH.exists():
        raise FileNotFoundError(f"Schema file not found at: {settings.SCHEMA_SQL_PATH}")

    logger.info(f"Initializing database schema at {settings.DB_PATH} using {settings.SCHEMA_SQL_PATH}...")
    with open(settings.SCHEMA_SQL_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with get_db_connection() as conn:
        conn.executescript(schema_sql)
    logger.info("Database schema initialized successfully.")
