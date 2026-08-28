Problem Statement:

I'm building a project for the Razorpay AI Hackathon (Track 01: AI Growth & Agentic Commerce). The track says: "Build an agent that grows revenue for a merchant on Razorpay test-mode APIs."

A merchant called "UrbanDrop" sells clothes and shoes online. Right now, customers visit the store, buy one item, and leave. The merchant is losing revenue because:

Buyers don't discover premium versions of products they're looking at (missed upsell opportunity)
Buyers don't see related products that go well together (missed cross-sell opportunity)
Nobody creates outfit bundles that encourage buyers to buy more items at a small discount (missed bundle opportunity)
Slow-moving inventory sits in the warehouse because nobody's pushing it strategically (dead stock problem)
Buyers browse with items in cart but leave without checking out because there's no intelligent nudge (cart abandonment)

My solution is an AI-powered shopping assistant agent that sits inside the buyer's shopping experience and does 4 things:

Upselling — when a buyer views a basic product, the agent suggests a premium version. Example: buyer looks at Basic White Tee at ₹399 → agent says "The Premium White Tee is Egyptian cotton, lasts 3x longer — just ₹400 more."
Cross-selling — when a buyer has items in cart, the agent suggests complementary products. Example: buyer adds Blue Slim Jeans → agent says "These White Sneakers at ₹1,999 go perfectly with those jeans."
Smart Bundles — the agent creates complete outfit bundles with a small discount. Example: buyer has jeans in cart → agent says "Complete outfit: jeans + white tee + sneakers for ₹3,499 instead of ₹3,697. Save ₹198!"
Dead Stock Pushing — the agent identifies products with high stock and low sales, and strategically pushes them alongside popular items without revealing they're slow-moving. The merchant dashboard shows how much stuck inventory the AI moved.

The hackathon requires every money action to be explainable (every recommendation shows a reason), bounded (agent only recommends from the catalog within price limits), and gated (merchant controls which features are on/off, sets maximum discount percentages, and can approve/reject). A full audit trail logs every recommendation shown, accepted, rejected, and the resulting revenue impact. At least one failure must be handled gracefully — like when a recommended product goes out of stock mid-purchase and the agent recovers by suggesting an alternative.

The merchant sees a dashboard showing total revenue, how much extra revenue the AI generated vs organic purchases, recommendation conversion rates, dead stock recovery stats, and the full audit trail. The merchant can toggle features on/off and set limits on what the agent can do.

Tech stack used here: Python, FastAPI, SQLite, Anthropic Claude API (claude-sonnet-4-6) with tool-use, LangGraph, Streamlit for both buyer UI and merchant dashboard, Razorpay Python SDK in test mode. Product catalog uploaded as CSV with product relationships (which products are upgrades of which, which go well together).