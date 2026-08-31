import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BuyerStorefront from './pages/BuyerStorefront';
import MerchantPage from './pages/MerchantPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BuyerStorefront />} />
      <Route path="/merchant" element={<MerchantPage />} />
    </Routes>
  );
}
