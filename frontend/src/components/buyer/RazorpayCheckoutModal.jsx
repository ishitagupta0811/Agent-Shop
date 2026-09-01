import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

const RazorpayLogo = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(2, 132, 199, 0.3))' }}>
      <path d="M16.5 3L6 21H11.5L15 14H21L16.5 3Z" fill="#0284C7" />
      <path d="M12 3L3 19H8.5L11.5 13H17.5L12 3Z" fill="#38BDF8" opacity="0.85" />
    </svg>
    <span style={{ fontSize: '1.35rem', fontWeight: 900, fontStyle: 'italic', color: '#0C2340', letterSpacing: '-0.5px' }}>
      Razorpay
    </span>
  </div>
);

export default function RazorpayCheckoutModal({ order, onClose, onVerifyPayment }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!order) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const mockPaymentId = 'pay_test_' + Math.random().toString(36).substring(2, 10);
      const mockSignature = 'test_mode_valid_signature';
      
      const res = await onVerifyPayment(order.razorpay_order_id, mockPaymentId, mockSignature);
      if (res && (res.status === 'verified' || res.status === 'already_verified')) {
        setPaymentSuccess(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content storefront-payment-modal" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '460px', 
          width: '90vw',
          borderRadius: '20px', 
          padding: '2rem', 
          background: '#FFFFFF',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          border: '1px solid #F1E5DE',
          position: 'relative'
        }}
      >
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <CheckCircle2 size={42} style={{ color: '#10B981' }} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', marginBottom: '0.4rem' }}>
              Payment Verified!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your order has been placed successfully.
            </p>

            <div style={{ 
              backgroundColor: '#FAF6F2', 
              padding: '1.25rem', 
              borderRadius: '14px', 
              textAlign: 'left', 
              fontSize: '0.88rem', 
              marginBottom: '1.5rem',
              border: '1px solid #F1E5DE'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#475569' }}>
                <span>Order Reference:</span>
                <strong style={{ color: '#0F172A' }}>#{order.order_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#475569' }}>
                <span>Merchant:</span>
                <strong style={{ color: '#0F172A' }}>UrbanDrop Store</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#0F172A', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                <span>Amount Paid:</span>
                <span style={{ color: '#FF3E6C' }}>₹{order.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button className="btn btn-coral-large" style={{ width: '100%', padding: '0.85rem' }} onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            {/* Header: Pay with Razorpay */}
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>Pay with</span> <RazorpayLogo />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                UrbanDrop Official Checkout
              </div>
            </div>

            {/* Price Box */}
            <div style={{ 
              backgroundColor: '#FAF6F2', 
              padding: '1.25rem 1.5rem', 
              borderRadius: '16px', 
              border: '1px solid #F1E5DE', 
              marginBottom: '1.25rem',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  AMOUNT PAYABLE
                </div>
                <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                  ✓ Includes taxes & delivery
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>
                ₹{order.final_amount.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Security & Test Mode Banner */}
            <div style={{ 
              fontSize: '0.78rem', 
              color: '#64748B', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              background: '#F8FAFC',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}>
              <Lock size={14} style={{ color: '#0284C7' }} />
              <span>Razorpay Test Mode Enabled — Safe & Secure 256-bit SSL</span>
            </div>

            {/* Primary Action Button */}
            <button
              className="btn btn-coral-large"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', letterSpacing: '0.3px', justifyContent: 'center' }}
              onClick={handleSimulatePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Payment...' : `Pay ₹${order.final_amount.toLocaleString('en-IN')} with Razorpay`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
