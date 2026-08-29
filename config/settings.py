import os
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = DATA_DIR / "agentshop.db"
    CATALOG_CSV_PATH: Path = DATA_DIR / "catalog.csv"
    SCHEMA_SQL_PATH: Path = DATA_DIR / "schema.sql"

    # Environment & API Server
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Razorpay Credentials (Test Mode)
    RAZORPAY_KEY_ID: str = "rzp_test_placeholder"
    RAZORPAY_KEY_SECRET: str = "secret_placeholder"

    # Anthropic Claude API Key
    ANTHROPIC_API_KEY: str = "sk-ant-placeholder"

    # Merchant Default Guardrails
    DEFAULT_MAX_DISCOUNT_PERCENTAGE: float = 15.0
    DEFAULT_REQUIRE_APPROVAL: bool = False

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
