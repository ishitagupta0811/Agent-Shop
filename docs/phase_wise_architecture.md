# AgentShop: AI Growth & Agentic Commerce Architecture Plan

**Project:** AI-Powered Shopping Assistant & Revenue Growth Agent (UrbanDrop)  
**Hackathon Track:** Razorpay AI Hackathon — Track 01: AI Growth & Agentic Commerce  
**Target Merchant:** UrbanDrop (Online Apparel & Footwear)  

---

## 1. Executive Summary & System Overview

AgentShop is an agentic commerce engine and interactive shopping assistant designed to maximize merchant revenue through intelligent, bounded, explainable, and gated recommendations. Operating directly within the buyer's shopping journey, the system executes real-time upselling, cross-selling, smart outfit bundling, dead stock liquidations, and cart abandonment recovery.

Every financial action and recommendation is governed by strict merchant-defined guardrails, supported by a real-time audit trail, integrated with Razorpay test-mode payments, and backed by a fault-tolerant fallback engine.

```
 +-----------------------------------------------------------------------------------+
 |                                   BUYER LAYER                                     |
 |  +-----------------------------------------------------------------------------+  |
 |  |                       Streamlit Buyer Shopping Web App                      |  |
 |  |  [Product Catalog]  [Product Detail]  [Cart & Checkout]  [AI Assistant Drawer] |  |
 |  +---------------------------------------+-------------------------------------+  |
 +------------------------------------------|----------------------------------------+
                                            | REST API / Event Hooks
 +------------------------------------------v----------------------------------------+
 |                                  BACKEND LAYER                                    |
 |  +-----------------------------------------------------------------------------+  |
 |  |                              FastAPI Service                                |  |
 |  |   /catalog   /cart   /agent/recommend   /orders   /payments/verify   /audit   |  |
 |  +-------------------+-----------------------------------+---------------------+  |
 +----------------------|-----------------------------------|------------------------+
                        |                                   |
 +----------------------v-------------------+    +----------v------------------------+
 |           AGENTIC INTELLIGENCE LAYER     |    |           PAYMENT LAYER           |
 |  +------------------------------------+  |    |  +-----------------------------+  |
 |  |          LangGraph Engine          |  |    |  |     Razorpay Python SDK     |  |
 |  | - Context Ingestion Node           |  |    |  |     - Order Creation        |  |
 |  | - Strategy Selector Node           |  |    |  |     - Signature Verification|  |
 |  | - Catalog & Bounded Guardrail Node |  |    |  |     - Webhook Logger        |  |
 |  | - Claude LLM Reasoning & Tool Node |  |    |  +-----------------------------+  |
 |  | - Fallback / Recovery Node         |  |    +-----------------------------------+
 |  +-------------------+----------------+                                            
 +----------------------|------------------------------------------------------------+
                        |
 +----------------------v------------------------------------------------------------+
 |                                    DATA LAYER                                     |
 |  +-----------------------------------------------------------------------------+  |
 |  |                                 SQLite DB                                   |  |
 |  |  products | inventory | relationships | carts | orders | audit_logs | config   |  |
 |  +-----------------------------------------------------------------------------+  |
 +-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack & Component Mapping

| Layer | Technology | Primary Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | Streamlit | Dual interfaces: Buyer E-Commerce Portal & Merchant Analytics/Control Dashboard. |
| **API Backend** | FastAPI + Uvicorn | RESTful API server handling cart operations, agent triggers, order creation, and payment verification. |
| **Agentic Framework** | LangGraph | Stateful workflow orchestration, tool execution, multi-strategy agent routing, and error recovery. |
| **LLM Reasoning** | Anthropic Claude API (`claude-sonnet-4-6`) | Structured tool invocation, explainable rationale generation, dynamic bundle creation. |
| **Database** | SQLite3 | Relational store for catalog, stock levels, orders, audit logs, merchant rules, and recommendation telemetry. |
| **Payments Integration** | Razorpay Python SDK (`razorpay`) | Test-mode order initiation (`orders.create`), checkout verification, and payment audit linking. |
| **Data Ingestion** | Pandas / CSV Reader | Ingestion of product catalog CSV with embedded upselling/cross-selling relationship mappings and stock velocity metadata. |

---

## 3. Database & Data Model Architecture

The SQLite database (`agentshop.db`) enforces relational integrity across six core entities:

```
 +------------------+        +--------------------------+        +----------------------+
 |     products     | 1    * |  product_relationships   | *    1 |      inventory       |
 +------------------+--------+--------------------------+--------+----------------------+
 | id (PK)          |        | id (PK)                  |        | product_id (FK, PK)  |
 | title            |        | source_product_id (FK)   |        | stock_quantity       |
 | category         |        | target_product_id (FK)   |        | units_sold           |
 | price            |        | relation_type            |        | sales_velocity_score |
 | is_premium       |        | priority_score           |        | is_dead_stock        |
 +--------+---------+        +--------------------------+--------+----------------------+
          | 1
          |
          | *                        +--------------------------+
 +--------v---------+                |        audit_logs        |
 |    order_items   |                +--------------------------+
 +------------------+                | id (PK)                  |
 | id (PK)          |                | session_id               |
 | order_id (FK)    |                | event_type               |
 | product_id (FK)  |                | strategy_used            |
 | is_ai_driven     |                | target_product_id (FK)   |
 | price_at_purchase|                | discount_applied         |
 +------------------+                | explanation_text         |
                                     | status (shown/accepted)  |
                                     | revenue_impact           |
                                     +--------------------------+
```

### Key Schema Entities:
- **`products`**: Core product metadata, base price, category, tags.
- **`product_relationships`**: Explicit relationship graph mapping `source_product_id` to `target_product_id` with `relation_type` (`UPSELL`, `CROSS_SELL`, `BUNDLE_MATCH`).
- **`inventory`**: Tracks stock count, historical velocity, and `is_dead_stock` flags for liquidation pushing.
- **`merchant_config`**: Gated feature flags (`upsell_enabled`, `cross_sell_enabled`, `bundle_enabled`, `dead_stock_enabled`), `max_discount_percentage`, and `require_approval`.
- **`audit_logs`**: Full audit trail storing `recommendation_id`, `session_id`, `strategy`, `reasoning`, `status` (`SHOWN`, `ACCEPTED`, `REJECTED`, `EXPIRED`), and `revenue_generated`.
- **`orders` & `order_items`**: Order records tagged with Razorpay payment details (`razorpay_order_id`, `razorpay_payment_id`) and boolean flags indicating whether revenue was AI-generated vs. organic.

---

## 4. Agent Architecture & LangGraph State Machine

The Agentic Commerce engine uses a deterministic, stateful graph created via LangGraph to satisfy the hackathon requirements: Explainable, Bounded, Gated, and Fault-Tolerant.

```
                           +------------------------+
                           |     Start Session      |
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           | Context Ingestion Node |
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           |  Gated Policy Check    |<---+ (Merchant Feature Disabled)
                           +-----------+------------+    |
                                       |                 |
                                       v                 |
                           +------------------------+    |
                           | Strategy Selector Node +----+
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           | Catalog & Inventory    |
                           |    Guardrail Node      |
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           |  Claude Tool Reasoning |
                           |  & Explanation Node    |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   | (Stock Change / Exception)           | (Normal Flow)
                   v                                       v
        +----------------------+                +----------------------+
        | Fallback & Recovery  |                |   Formulate Final    |
        |        Node          |                | Recommendation Payload|
        +----------+-----------+                +----------+-----------+
                   |                                       |
                   +-------------------+-------------------+
                                       |
                                       v
                           +------------------------+
                           |  Audit Trail Logger    |
                           +------------------------+
```

### LangGraph Workflow Nodes:
1. **Context Ingestion Node**: Reads buyer session state (current viewed item, cart contents, total cart value) and loads current merchant rules from DB.
2. **Gated Policy Check Node**: Evaluates feature flags. If the triggered strategy (e.g. `UPSELL`) is disabled by the merchant, routing terminates gracefully without showing intrusive UI prompts.
3. **Strategy Selector Node**: Evaluates priorities based on context:
   - *View Product*: Evaluate Upsell candidate first, fallback to Dead Stock push.
   - *Cart Item Added*: Evaluate Cross-Sell candidate & Outfit Bundle opportunities.
   - *Cart Idle / Abandonment Trigger*: Evaluate Smart Bundle with small discount.
4. **Catalog & Inventory Guardrail Node (Bounded)**: Queries DB to ensure candidates are strictly within catalog boundaries, in stock (`stock_quantity > 0`), and price points fit within merchant discount caps (`max_discount_percentage`).
5. **Claude Reasoning & Tool Execution Node (Explainable)**: Calls Claude API with custom tools (`calculate_bundle_discount`, `format_upsell_pitch`) to output structured JSON with product IDs, price delta, discount amount, and human-readable explanation.
6. **Fallback & Recovery Node**: If a candidate item experiences a race condition or stock depletion, this node automatically intercepts the error, queries secondary catalog options, and reformulates an alternative proposal without crashing the user interface.
7. **Audit Trail Logger Node**: Synchronously inserts a record into `audit_logs` before returning the response payload to the FastAPI layer.

---

## 5. Phase-Wise Implementation Roadmap

The development of **AgentShop** is structured into 6 sequential phases to ensure modular execution, testability, and continuous verification.

```
  Phase 1           Phase 2           Phase 3           Phase 4           Phase 5           Phase 6
+---------+       +---------+       +---------+       +---------+       +---------+       +---------+
| Data    |  ==>  | FastAPI |  ==>  | Lang    |  ==>  | Buyer   |  ==>  | Merchant|  ==>  | End-to  |
| Engine  |       | Core    |       | Graph   |       | Stream- |       | Dash-   |       | End &   |
| & Setup |       | Service |       | Agent   |       | lit UI  |       | board   |       | Audit   |
+---------+       +---------+       +---------+       +---------+       +---------+       +---------+
```

### Phase 1: Core Foundation & Data Engine Setup
**Goal:** Establish project infrastructure, SQLite relational schemas, catalog CSV ingestion script, and initial dataset for "UrbanDrop".

#### Key Deliverables:
- **Project Directory Layout**:
  - `config/` (environment variables, settings)
  - `data/` (`catalog.csv`, `schema.sql`, `seed_data.py`)
  - `db/` (SQLite connector and ORM models)
  - `services/` (business logic modules)
  - `agent/` (LangGraph state machine and tools)
  - `apps/` (`buyer_app.py`, `merchant_dashboard.py`)
  - `docs/` (documentation and architecture)
- **Catalog Ingestion & Schema Builder (`data/seed_data.py`)**:
  - Parse `catalog.csv` containing products (e.g. Basic White Tee ₹399, Premium Egyptian Cotton White Tee ₹799, Blue Slim Jeans ₹1,699, White Sneakers ₹1,999).
  - Populate relationship matrix (Upsell, Cross-sell, Bundles).
  - Compute initial `sales_velocity_score` and flag items with high stock & low sales as `is_dead_stock=True`.
- **Database Layer (`db/database.py`)**:
  - SQLite initialization with WAL mode for rapid concurrency.
  - CRUD repository modules for products, inventory, merchant settings, and audit logs.

#### Verification Criteria:
- Running `python data/seed_data.py` populates `agentshop.db` cleanly with products, stock counts, relationships, and default merchant settings.

---

### Phase 2: FastAPI Backend Engine & Razorpay Payment Integration
**Goal:** Build standard RESTful API endpoints for shopping cart operations, catalog queries, Razorpay test mode payment creation, and verification.

#### Modules & Components:
- `backend/main.py`: FastAPI server setup with CORS middleware.
- `backend/routes/catalog.py`: Endpoints for fetching catalog, product detail, and category filters.
- `backend/routes/cart.py`: Cart item management (Add, Update, Remove, Clear).
- `backend/routes/orders.py`: Order building and Razorpay order creation (`razorpay_client.order.create`).
- `backend/routes/payments.py`: Payment signature verification (`razorpay.utility.verify_payment_signature`).

#### Primary API Endpoints:
- `GET /api/products` — List all products with stock and metadata.
- `POST /api/cart/add` — Add product to active session cart.
- `POST /api/orders/create` — Create order entity & initialize Razorpay order payload.
- `POST /api/payments/verify` — Verify Razorpay payment signature & commit order status.

#### Verification Criteria:
- Test Razorpay order creation in test mode using valid test API keys (`key_id`, `key_secret`), ensuring order IDs (`order_...`) are returned and verified cleanly.

---

### Phase 3: LangGraph Agentic Engine & Guardrails Implementation
**Goal:** Construct the agent intelligence framework with Anthropic Claude tool-use, multi-strategy reasoning, and safety guardrails.

#### Modules & Components:
- `agent/state.py`: Definition of `AgentState` TypedDict (Session ID, Cart, Current Product, Strategy, Recommendations, Error State).
- `agent/graph.py`: LangGraph workflow construction (`StateGraph`), state routing logic, and edge definitions.
- `agent/tools.py`: Tool declarations (`get_upsell_candidate`, `get_cross_sell_candidate`, `create_smart_bundle`, `fetch_dead_stock_item`).
- `agent/guardrails.py`: Enforcement of price limits, discount caps, stock checks, and merchant toggle status.

#### Key Recommendation Strategies:
- **Upsell**: Evaluates viewed item -> finds matching item where `relation_type='UPSELL'` & `price > viewed_item.price` -> calculates price delta -> generates explanation.
- **Cross-Sell**: Evaluates cart items -> queries `product_relationships` for complementary items -> checks stock -> generates suggestion.
- **Smart Bundle**: Combines 2-3 complementary products -> applies small merchant-bounded discount (e.g. 5-15%) -> formats bundle savings.
- **Dead Stock Push**: Identifies items flagged `is_dead_stock=True` -> pairs them intelligently with high-demand items -> presents them seamlessly.
- **Cart Abandonment Recovery**: Detects cart inactivity -> offers limited-time smart bundle discount to trigger checkout.

#### API Endpoint:
- `POST /api/agent/recommend` — Trigger agent evaluation for given buyer action and session context.

#### Verification Criteria:
- Unit test agent routes with simulated cart states. Verify structured JSON output contains `product_ids`, `strategy`, `price_delta`, `discount_applied`, `explanation`, and `audit_log_id`.

---

### Phase 4: Buyer E-Commerce Experience (React Web App)
**Goal:** Build a visually stunning, highly responsive React (Vite) web application for online buyers with an embedded AI assistant.

#### UI Components & Features (`frontend/ (React Buyer App)`):
- **Header & Category Filter Bar**: Modern typography, UrbanDrop brand header, cart badge counter.
- **Product Grid View**: Clean product cards displaying images, price, stock status, and "View Details" / "Add to Cart" buttons.
- **Interactive AI Shopping Assistant Sidebar / Floating Drawer**:
  - Displays real-time agent recommendation cards.
  - Shows explainability badge ("Why AI recommends this: ...").
  - One-click "Accept Upgrade" or "Add Bundle to Cart" action buttons.
- **Cart & Checkout Modal**:
  - Detailed cart summary with breakdowns of standard vs. AI-recommended bundle items.
  - Integrated Razorpay Test Mode Payment Trigger.

#### Verification Criteria:
- End-to-end interactive browsing in Streamlit: Clicking "Basic White Tee" immediately renders the AI Upsell prompt for "Premium Egyptian Cotton White Tee" with full explanation and price difference.

---

### Phase 5: Merchant Analytics Dashboard & Feature Controls (React Portal)
**Goal:** Build the React Merchant Portal for real-time monitoring of AI-generated revenue, feature gating, discount controls, dead stock movement, and audit logs.

#### UI Views & Features (`frontend/src/components/merchant/ (React Merchant Dashboard)`):
- **Executive KPI Header**:
  - Total Store Revenue (₹)
  - Extra AI-Driven Revenue (₹) & % Revenue Lift
  - Recommendation Conversion Rate (%)
  - Dead Stock Recovered (Items / Value)
- **Feature Control Panel (Gating & Guardrails)**:
  - Toggle switches: `Enable Upselling`, `Enable Cross-Selling`, `Enable Smart Bundles`, `Enable Dead Stock Pushing`.
  - Interactive Slider: `Max Discount Cap` (5% - 25%).
  - Radio selector: `Agent Mode` (`Autonomous` vs `Merchant Approval Required`).
- **Dead Stock Liquidation Hub**:
  - Table of inventory velocity scores.
  - Breakdown of how many slow-moving units were successfully moved by the AI agent.
- **Audit Trail Explorer**:
  - Live searchable table showing all agent recommendations.
  - Columns: `Timestamp`, `Session ID`, `Strategy`, `Target Product`, `Original Price`, `Discount Offered`, `AI Explanation`, `Status` (Shown / Accepted / Rejected), `Revenue Impact`.

#### Verification Criteria:
- Disabling "Smart Bundles" in the merchant dashboard instantly blocks the agent from offering bundle discounts in the buyer app on subsequent sessions.

---

### Phase 6: Fault-Tolerance, Edge Case Recovery & End-to-End Verification
**Goal:** Implement robust exception handling, out-of-stock recovery logic, full system integration testing, and performance validation.

#### Failure Scenarios to Handle:
- **Mid-Purchase Out-of-Stock**: Recommended bundle product goes out of stock right before checkout -> Agent intercepts stock error -> Replaces missing item with next best complementary item or adjusts bundle price automatically.
- **Razorpay Signature Mismatch**: Handles payment cancellations or failed test transactions with proper rollback and log updates.
- **LLM API Rate-Limit / Timeout**: Fallback to deterministic SQLite database lookup for recommendations if Anthropic API encounters latency.

#### Verification & Audit Matrix:
- Verify that 100% of accepted recommendations update the `audit_logs` table with non-zero `revenue_impact` and update order items with `is_ai_driven=True`.

---

## 6. End-to-End Execution Flow (Data & Event Sequence)

```
[Buyer Actions]               [FastAPI / LangGraph]             [SQLite / Razorpay]
      |                                 |                                 |
      |--- 1. View Basic Tee (₹399) --->|                                 |
      |                                 |--- 2. Fetch Merchant Config --->|
      |                                 |--- 3. Query Upsell Candidate -->|
      |                                 |--- 4. Claude Explain Tool ----->|
      |<-- 5. Return Upsell Payload ----|                                 |
      |    ("Upgrade for ₹400 more")    |                                 |
      |                                 |--- 6. Log Audit (SHOWN) ------->|
      |                                 |                                 |
      |--- 7. Accepts Upsell ----------->|                                 |
      |                                 |--- 8. Update Cart ------------->|
      |                                 |--- 9. Log Audit (ACCEPTED) ---->|
      |                                 |                                 |
      |--- 10. Proceed to Checkout ---->|                                 |
      |                                 |--- 11. Create Razorpay Order -->|
      |<-- 12. Razorpay Order ID -------|                                 |
      |                                 |                                 |
      |--- 13. Submit Test Payment ---->|                                 |
      |                                 |--- 14. Verify Signature ------->|
      |                                 |--- 15. Commit Order (AI=True) ->|
      |<-- 16. Confirmation Page -------|                                 |
```

---

## 7. Deliverables & File Directory Layout

Below is the complete target file structure for the repository:

```
agentshop/
│
├── config/
│   ├── __init__.py
│   └── settings.py              # Environment variables, Razorpay keys, Claude API keys
│
├── data/
│   ├── catalog.csv              # Initial UrbanDrop product catalog CSV
│   ├── schema.sql               # Relational SQLite schema definition
│   └── seed_data.py             # CSV ingestion & database seeder script
│
├── db/
│   ├── __init__.py
│   ├── database.py              # SQLite connection manager
│   ├── models.py                # Pydantic data models & DB schemas
│   └── repositories.py          # Data access routines for products, audit logs, config
│
├── backend/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point
│   └── routes/
│       ├── catalog.py           # Catalog REST endpoints
│       ├── cart.py              # Cart management endpoints
│       ├── agent.py             # Agent trigger & recommendation endpoint
│       ├── orders.py            # Order creation & checkout
│       └── payments.py          # Razorpay webhook and payment verification
│
├── agent/
│   ├── __init__.py
│   ├── state.py                 # LangGraph state representation
│   ├── graph.py                 # LangGraph state machine & node graph setup
│   ├── tools.py                 # Candidate lookup & discount calculation tools
│   └── guardrails.py            # Bounded & Gated policy checkers
│
├── apps/
│   ├── buyer_app.py             # Streamlit E-Commerce Buyer Interface
│   └── merchant_dashboard.py    # Streamlit Merchant Analytics & Control Dashboard
│
├── tests/
│   ├── test_catalog.py          # Unit tests for catalog ingestion
│   ├── test_agent.py            # Unit tests for agent recommendation routing
│   └── test_payments.py         # Mock tests for Razorpay payment flows
│
├── docs/
│   ├── problemStatement.md      # Original hackathon problem statement
│   └── architecture.md         # Comprehensive phase-wise architecture doc
│
├── .env.example                 # Environment variable templates
├── requirements.txt             # Project Python dependencies
└── README.md                    # Setup & execution instructions
```

---

## 8. Summary of Hackathon Constraint Compliance

| Hackathon Requirement | Architectural Solution |
| :--- | :--- |
| **Explainable** | Claude API tool-use generates human-readable explanations ("Egyptian cotton lasts 3x longer") returned alongside recommendation payloads and saved in audit logs. |
| **Bounded** | LangGraph Inventory & Catalog Guardrail Node ensures candidates exist in `products`, are in stock (`stock_quantity > 0`), and price points fit within merchant discount caps. |
| **Gated** | `merchant_config` DB table stores live feature flags and max discount caps. The Agent bypasses disabled strategies instantly. |
| **Audit Trail** | Every recommendation event logs `recommendation_id`, `session_id`, `strategy`, `explanation`, `status` (`Shown`/`Accepted`/`Rejected`), and `revenue_impact` in SQLite `audit_logs`. |
| **Graceful Failure** | The Fallback Node intercepts out-of-stock events mid-checkout, re-evaluating secondary options to prevent broken buyer sessions. |
| **Merchant Dashboard** | Streamlit Merchant Dashboard visualizes AI vs Organic revenue lift, conversion metrics, dead stock recovery, live audit trail, and feature toggling. |
