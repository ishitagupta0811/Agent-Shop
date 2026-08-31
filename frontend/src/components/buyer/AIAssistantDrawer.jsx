import React from 'react';
import { Sparkles, ArrowRight, Check, X } from 'lucide-react';

export default function AIAssistantDrawer({ recommendation, currentProduct, onAccept, onReject }) {
  if (!recommendation) return null;

  const strategy = recommendation.strategy || 'AI_RECOMMENDED';
  const targetProd = recommendation.target_product || {};
  const explanation = recommendation.explanation || '';
  const recId = recommendation.recommendation_id;

  const isUpsell = strategy === 'UPSELL';
  const currProd = currentProduct;

  return (
    <div className="ai-drawer">
      <div className="ai-drawer-header">
        <div className="ai-badge-label">
          <Sparkles size={14} /> ✨ {strategy.replace('_', ' ')}
        </div>
        <button 
          onClick={() => onReject(recId)}
          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {isUpsell && currProd ? (
        <div className="upsell-comparison">
          <div className="upsell-item">
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Current Item</span>
            <img src={currProd.image_url || 'https://via.placeholder.com/80'} alt="" className="upsell-img" />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{currProd.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>₹{currProd.price}</div>
          </div>

          <div className="upsell-arrow">
            <ArrowRight size={20} />
            <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 800 }}>
              +₹{(targetProd.price - currProd.price).toFixed(0)}
            </span>
          </div>

          <div className="upsell-item">
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Upgrade Choice</span>
            <img src={targetProd.image_url || 'https://via.placeholder.com/80'} alt="" className="upsell-img" />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{targetProd.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>₹{targetProd.price}</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '0.75rem 0' }}>
          <img 
            src={targetProd.image_url || 'https://via.placeholder.com/100'} 
            alt="" 
            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} 
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{targetProd.name}</div>
            {recommendation.savings_amount > 0 ? (
              <div>
                <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: '0.8rem', marginRight: '6px' }}>
                  ₹{recommendation.original_price}
                </span>
                <span style={{ color: '#10B981', fontWeight: 800 }}>
                  ₹{recommendation.final_price}
                </span>
                <div style={{ fontSize: '0.75rem', color: '#10B981' }}>
                  Save ₹{recommendation.savings_amount}
                </div>
              </div>
            ) : (
              <div style={{ color: '#38BDF8', fontWeight: 800 }}>₹{targetProd.price}</div>
            )}
          </div>
        </div>
      )}

      <div className="ai-quote-box">"{explanation}"</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
        <button 
          className="btn btn-success"
          onClick={() => onAccept(recId)}
        >
          <Check size={16} /> Accept Deal
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => onReject(recId)}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
