import csv
import logging
from pathlib import Path
from config.settings import settings
from db.database import init_db
from db.repositories import ProductRepository, InventoryRepository, RelationshipRepository, MerchantConfigRepository

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("agentshop.seed")

def seed_catalog() -> None:
    """
    Parses catalog.csv, initializes SQLite database schema, inserts products,
    calculates inventory velocity & dead stock flags, and builds the relationship graph.
    """
    # 1. Initialize DB tables
    init_db()
    
    # 2. Ensure default merchant config is populated & reset for seed
    MerchantConfigRepository.update_config({
        "upsell_enabled": True,
        "cross_sell_enabled": True,
        "bundle_enabled": True,
        "dead_stock_enabled": True,
        "max_discount_percentage": 15.0,
        "require_approval": False
    })

    csv_path = settings.CATALOG_CSV_PATH
    if not csv_path.exists():
        logger.error(f"Catalog CSV file not found at {csv_path}")
        return

    logger.info(f"Ingesting catalog data from {csv_path}...")

    products_data = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get("name"):
                continue
            products_data.append(row)

    # Step 1: Insert all products & inventory records
    product_name_to_id = {}

    for item in products_data:
        name = item["name"].strip()
        description = item.get("description", "").strip()
        price = float(item["price"])
        category = item["category"].strip()
        margin = float(item.get("margin_percent", 40.0))
        is_premium = item.get("is_premium", "").lower() in ("true", "1", "yes")

        image_url = item.get("image_url", "").strip()

        # Insert product into SQLite
        product_id = ProductRepository.insert_product(
            name=name,
            description=description,
            price=price,
            category=category,
            margin_percent=margin,
            is_premium=is_premium,
            image_url=image_url
        )
        product_name_to_id[name] = product_id

        # Calculate Stock & Dead Stock Velocity
        stock = int(item.get("stock", 0))
        units_sold = int(item.get("units_sold", 0))
        total_units = stock + units_sold
        velocity_score = round(units_sold / total_units, 4) if total_units > 0 else 0.0
        
        # Dead stock criteria: high inventory (> 50) and low recent sales (< 20)
        is_dead_stock = (stock >= 50 and units_sold <= 20)

        InventoryRepository.upsert_inventory(
            product_id=product_id,
            stock_quantity=stock,
            units_sold=units_sold,
            velocity_score=velocity_score,
            is_dead_stock=is_dead_stock
        )
        logger.info(f"Ingested product: {name} (ID: {product_id}, Stock: {stock}, Velocity: {velocity_score}, DeadStock: {is_dead_stock})")

    # Step 2: Build Relationship Graph (Upsell & Cross-Sell)
    upsell_count = 0
    cross_sell_count = 0

    for item in products_data:
        current_name = item["name"].strip()
        current_id = product_name_to_id.get(current_name)
        if not current_id:
            continue

        # Upsell Relationship: item["upsell_for"] contains basic item name this item upgrades
        upsell_for_name = item.get("upsell_for", "").strip()
        if upsell_for_name and upsell_for_name in product_name_to_id:
            base_product_id = product_name_to_id[upsell_for_name]
            # base_product_id -> current_id is UPSELL
            RelationshipRepository.add_relationship(
                source_id=base_product_id,
                target_id=current_id,
                relation_type="UPSELL",
                priority_score=1.5
            )
            upsell_count += 1
            logger.info(f"Upsell Mapping: '{upsell_for_name}' -> Upgrade to '{current_name}'")

        # Cross-Sell Relationships: item["cross_sell_with"] contains semicolon-separated items
        cross_sell_str = item.get("cross_sell_with", "").strip()
        if cross_sell_str:
            targets = [t.strip() for t in cross_sell_str.split(";") if t.strip()]
            for target_name in targets:
                if target_name in product_name_to_id:
                    target_id = product_name_to_id[target_name]
                    # current_id -> target_id is CROSS_SELL
                    RelationshipRepository.add_relationship(
                        source_id=current_id,
                        target_id=target_id,
                        relation_type="CROSS_SELL",
                        priority_score=1.0
                    )
                    # Bi-directional cross sell
                    RelationshipRepository.add_relationship(
                        source_id=target_id,
                        target_id=current_id,
                        relation_type="CROSS_SELL",
                        priority_score=1.0
                    )
                    cross_sell_count += 1
                    logger.info(f"Cross-Sell Mapping: '{current_name}' <-> '{target_name}'")

    logger.info(f"Seeding completed successfully! Ingested {len(product_name_to_id)} products, {upsell_count} upsell links, {cross_sell_count} cross-sell links.")

if __name__ == "__main__":
    seed_catalog()
