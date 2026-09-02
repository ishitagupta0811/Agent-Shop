"""
Merchant Config & Metrics API Routes — Guardrail settings and analytics dashboard data.
All database operations use existing repositories from db/repositories.py.
"""

from fastapi import APIRouter
from db.repositories import MerchantConfigRepository, AuditLogRepository
from db.models import MerchantConfigUpdate

router = APIRouter()


@router.get("/merchant/config")
def get_merchant_config():
    """Get the current merchant guardrail configuration."""
    return MerchantConfigRepository.get_config()


@router.put("/merchant/config")
def update_merchant_config(body: MerchantConfigUpdate):
    """Update merchant guardrail configuration (partial update)."""
    update_data = body.model_dump(exclude_none=True)
    return MerchantConfigRepository.update_config(update_data)


@router.get("/merchant/metrics")
def get_metrics():
    """Get revenue metrics, AI-driven revenue lift, and recommendation conversion rates."""
    return AuditLogRepository.get_metrics_summary()


@router.get("/merchant/audit-logs")
def get_audit_logs(limit: int = 100):
    """Get recent audit trail entries."""
    logs = AuditLogRepository.get_all_logs(limit=limit)
    return {"logs": logs, "audit_logs": logs, "count": len(logs)}
