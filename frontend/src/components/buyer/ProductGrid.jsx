import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, onViewDetails, onQuickAdd, wishlistIds = [], onToggleWishlist }) {
  if (!products || products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
        No products found in this category.
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onViewDetails}
          onQuickAdd={onQuickAdd}
          isWishlisted={wishlistIds.includes(product.id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}
