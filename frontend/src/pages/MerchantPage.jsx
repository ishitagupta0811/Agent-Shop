import React from 'react';
import Navbar from '../components/Navbar';
import MerchantDashboard from '../components/merchant/MerchantDashboard';

export default function MerchantPage() {
  return (
    <div>
      <Navbar isMerchant={true} />
      <main>
        <MerchantDashboard />
      </main>
    </div>
  );
}
