import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>

        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle2 size={64} style={{ color: '#10B981', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginBottom: '0.5rem' }}>
              Payment Successful!
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your order has been verified & placed in test mode.
            </p>

            <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>Order ID: <strong>#{order.order_id}</strong></div>
              <div>Razorpay Order ID: <code>{order.razorpay_order_id}</code></div>
              <div>Amount Paid: <strong>₹{order.final_amount}</strong></div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={24} style={{ color: '#38BDF8' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Razorpay Test Payment Gateway</h2>
            </div>

            <div style={{ backgroundColor: '#1E293B', padding: '1rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94A3B8' }}>Merchant:</span>
                <span style={{ fontWeight: 700 }}>UrbanDrop Store</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94A3B8' }}>Razorpay Order ID:</span>
                <code style={{ color: '#38BDF8' }}>{order.razorpay_order_id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #334155' }}>
                <span>Amount Payable:</span>
                <span style={{ color: '#10B981' }}>₹{order.final_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} style={{ color: '#F59E0B' }} />
              Razorpay Test Mode Enabled — No real money will be charged.
            </div>

            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
              onClick={handleSimulatePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Verifying Signature...' : '✅ Complete Test Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
