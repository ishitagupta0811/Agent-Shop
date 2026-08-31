# AgentShop — Project Description (Resume Format)

---

## Resume-Style One-Liner (as in the reference image)

**AgentShop — AI Growth & Agentic Commerce Engine** 🛒 | *Python, FastAPI, SQLite, LangGraph, Anthropic Claude API (claude-sonnet-4-6), Streamlit, Razorpay Python SDK, Pandas*

- Built an **agentic AI shopping assistant** using LangGraph and Claude tool-use that autonomously performs real-time upselling, cross-selling, smart bundling, and dead stock liquidation to grow merchant revenue.
- Designed a **stateful LangGraph state machine** with 7 deterministic nodes (context ingestion → gated policy check → strategy selection → catalog guardrails → Claude reasoning → fallback recovery → audit logging) enforcing explainable, bounded, and merchant-gated recommendations.
- Engineered a **FastAPI REST backend** with 5 route modules (catalog, cart, orders, payments, merchant config) integrated with **Razorpay test-mode SDK** for end-to-end order creation, payment signature verification, and webhook logging.
- Architected a **normalized SQLite relational schema** across 9 tables (products, inventory, product_relationships, merchant_config, audit_logs, orders, order_items, carts, cart_items) with WAL mode, foreign key enforcement, and indexed lookups for high-performance query execution.
- Implemented a **CSV-driven catalog ingestion pipeline** using Pandas that auto-computes sales velocity scores, flags dead stock items, and builds a bidirectional product relationship graph (upsell, cross-sell, bundle mappings).
- Built dual **Streamlit interfaces** — a buyer e-commerce portal with embedded AI assistant drawer showing explainable recommendation cards, and a merchant analytics dashboard with live KPI metrics, feature gating toggles, discount sliders, and a searchable audit trail explorer.
- Implemented **fault-tolerant fallback handling** for mid-purchase out-of-stock recovery, Razorpay signature mismatches, and LLM API timeouts with automatic alternative product re-evaluation.

---

## Tech Stack Breakdown by Phase

| Phase | What Was Done | Tech Stack Used |
|:------|:-------------|:----------------|
| **Phase 1 — Data Engine & Setup** | Designed the SQLite relational schema (9 tables), built CSV catalog ingestion with velocity scoring & dead stock flagging, and populated the product relationship graph | **Python, SQLite3, Pandas, Pydantic** |
| **Phase 2 — FastAPI Backend & Payments** | Built RESTful API endpoints for catalog browsing, cart CRUD, order creation, and Razorpay test-mode payment verification with signature validation | **FastAPI, Uvicorn, Razorpay Python SDK, Pydantic** |
| **Phase 3 — LangGraph Agent & Guardrails** | Constructed the agentic intelligence engine with a 7-node stateful graph, Claude tool-use for explainable reasoning, bounded catalog guardrails, and merchant-gated policy checks | **LangGraph, LangChain-Core, Anthropic Claude API (claude-sonnet-4-6), Python** |
| **Phase 4 — Buyer Streamlit UI** | Built the buyer-facing e-commerce portal with product grid, cart management, embedded AI assistant drawer showing real-time recommendation cards with explainability badges | **Streamlit, Python** |
| **Phase 5 — Merchant Dashboard** | Built the merchant analytics dashboard with KPI metrics (total revenue, AI revenue lift, conversion rates), feature toggle controls, discount cap sliders, dead stock recovery stats, and audit trail explorer | **Streamlit, Python, SQLite3** |
| **Phase 6 — Fault Tolerance & E2E** | Implemented graceful failure handling for out-of-stock recovery, payment failures, LLM timeouts, and full integration testing with audit trail verification | **Pytest, HTTPX, Python** |

---

## Problem → How I'm Solving It (Mapping)

| Problem Identified | My Solution | How It Works Technically |
|:-------------------|:-----------|:------------------------|
| **Missed Upsell Opportunity** — Buyers don't discover premium versions | AI agent performs real-time upselling when buyer views a basic product | LangGraph queries `product_relationships` table for `relation_type='UPSELL'`, finds the premium variant, calculates price delta, and Claude generates a human-readable pitch (e.g., *"Egyptian cotton, lasts 3x longer — just ₹400 more"*) |
| **Missed Cross-Sell Opportunity** — Buyers don't see complementary products | AI agent suggests related items when buyer adds to cart | Bidirectional `CROSS_SELL` relationships in SQLite are queried per cart item; Claude formats complementary suggestions with reasoning |
| **Missed Bundle Opportunity** — No outfit bundles to increase AOV | AI agent creates smart outfit bundles with merchant-bounded discounts | Agent combines 2-3 complementary products from the relationship graph, applies a discount capped by `merchant_config.max_discount_percentage`, and shows total savings |
| **Dead Stock Problem** — Slow-moving inventory sits unsold | AI agent strategically pushes dead stock alongside popular items | `inventory` table flags items with `is_dead_stock=True` (high stock ≥50, low sales ≤20); agent pairs them with high-demand items without revealing they're slow-moving |
| **Cart Abandonment** — Buyers leave without checking out | AI agent detects cart inactivity and offers a limited-time bundle discount | Cart `updated_at` timestamp is monitored; agent triggers a bundle discount nudge to incentivize checkout |
| **Explainability** — Every recommendation must show a reason | Claude tool-use generates human-readable explanations saved in audit logs | Every recommendation payload includes `explanation_text` stored in `audit_logs` with the strategy used and revenue impact |
| **Bounded** — Agent must only recommend from catalog within limits | Catalog & Inventory Guardrail Node in LangGraph enforces stock and price checks | Guardrail node validates `stock_quantity > 0`, product exists in catalog, and discount fits within `max_discount_percentage` before any recommendation |
| **Gated** — Merchant controls which features are on/off | `merchant_config` table stores live feature flags; Gated Policy Check Node enforces them | Agent checks `upsell_enabled`, `cross_sell_enabled`, `bundle_enabled`, `dead_stock_enabled` flags before executing any strategy |
| **Audit Trail** — Full log of every recommendation and its outcome | Every agent action is logged in `audit_logs` with status tracking | `audit_logs` table records `session_id`, `strategy_used`, `explanation_text`, `status` (SHOWN/ACCEPTED/REJECTED), and `revenue_impact` for every recommendation |
| **Graceful Failure** — Handle at least one failure scenario | Fallback & Recovery Node intercepts stock depletion mid-purchase | If a recommended product goes OOS during checkout, the agent queries secondary catalog options and suggests an alternative without crashing the UI |

---

## Complete Tech Stack Summary

| Technology | Role in Project |
|:-----------|:---------------|
| **Python** | Core programming language for backend, agent, data processing, and UI |
| **FastAPI** | RESTful API server handling catalog, cart, orders, payments, and merchant config endpoints |
| **Uvicorn** | ASGI server running the FastAPI application |
| **SQLite3** | Relational database storing products, inventory, relationships, orders, audit logs, and merchant config (WAL mode) |
| **LangGraph** | Stateful workflow orchestration engine for the 7-node agentic commerce state machine |
| **LangChain-Core** | Foundation layer for LLM tool definitions and structured output parsing |
| **Anthropic Claude API** | LLM reasoning engine (claude-sonnet-4-6) with tool-use for explainable recommendation generation |
| **Razorpay Python SDK** | Test-mode payment integration — order creation, checkout verification, and signature validation |
| **Streamlit** | Dual-purpose UI framework — buyer e-commerce shopping app and merchant analytics dashboard |
| **Pandas** | CSV catalog ingestion and data transformation for velocity scoring and dead stock computation |
| **Pydantic / Pydantic-Settings** | Data validation, serialization, and environment configuration management |
| **Pytest / HTTPX** | Unit and integration testing framework for backend routes and agent workflows |
