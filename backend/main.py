"""
AgentShop FastAPI Backend — Main Application Entry Point
Phase 2 & 3: FastAPI Backend Engine, Razorpay Integration & LangGraph Agent Engine
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from db.database import init_db
from backend.routes.catalog import router as catalog_router
from backend.routes.cart import router as cart_router
from backend.routes.orders import router as orders_router
from backend.routes.payments import router as payments_router
from backend.routes.merchant import router as merchant_router
from backend.routes.agent import router as agent_router

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("agentshop.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    logger.info("Initializing AgentShop database...")
    init_db()
    logger.info("Database initialized. AgentShop backend is ready.")
    yield
    logger.info("AgentShop backend shutting down.")


app = FastAPI(
    title="AgentShop — AI Growth & Agentic Commerce API",
    description="Backend API for UrbanDrop's AI-powered shopping assistant with Razorpay payment integration.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Streamlit frontend and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(catalog_router, prefix="/api", tags=["Catalog"])
app.include_router(cart_router, prefix="/api", tags=["Cart"])
app.include_router(orders_router, prefix="/api", tags=["Orders"])
app.include_router(payments_router, prefix="/api", tags=["Payments"])
app.include_router(merchant_router, prefix="/api", tags=["Merchant Config"])
app.include_router(agent_router, prefix="/api", tags=["Agent Recommendations"])


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "AgentShop API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
