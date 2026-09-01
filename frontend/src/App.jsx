import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BuyerStorefront from './pages/BuyerStorefront';
import MerchantPage from './pages/MerchantPage';
import ShoppingBagPage from './pages/ShoppingBagPage';
import WishlistPage from './pages/WishlistPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BuyerStorefront />} />
      <Route path="/bag" element={<ShoppingBagPage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/merchant" element={<MerchantPage />} />
    </Routes>
  );
}
