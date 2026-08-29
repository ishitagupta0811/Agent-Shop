"""
Catalog API Routes — Product listing, detail, category filtering, and relationship queries.
All database operations use existing repositories from db/repositories.py.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from db.repositories import ProductRepository, InventoryRepository, RelationshipRepository

router = APIRouter()


@router.get("/products")
def list_products(category: Optional[str] = Query(None, description="Filter by product category")):
    """List all products with inventory metadata. Optionally filter by category."""
    products = ProductRepository.get_all_products()
    if category:
        products = [p for p in products if p["category"].lower() == category.lower()]
    return {"products": products, "count": len(products)}


@router.get("/products/{product_id}")
def get_product(product_id: int):
    """Get a single product by ID with inventory data, upsell, and cross-sell relationships."""
    product = ProductRepository.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")

    # Enrich with relationship data
    upsell = RelationshipRepository.get_upsell(product_id)
    cross_sells = RelationshipRepository.get_cross_sells(product_id)

    product["upsell"] = upsell
    product["cross_sells"] = cross_sells
    return product


@router.get("/products/search/{name}")
def search_product_by_name(name: str):
    """Search for a product by name (case-insensitive)."""
    product = ProductRepository.get_product_by_name(name)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{name}' not found")
    return product


@router.get("/categories")
def list_categories():
    """List all unique product categories."""
    products = ProductRepository.get_all_products()
    categories = sorted(set(p["category"] for p in products))
    return {"categories": categories}


@router.get("/dead-stock")
def list_dead_stock():
    """List all dead stock items (high inventory, low velocity)."""
    items = InventoryRepository.get_dead_stock_items()
    return {"dead_stock_items": items, "count": len(items)}
