import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Zap, ShoppingBag, Flame, Layers, Info } from 'lucide-react';

export default function GuardrailsPanel({ config, onSaveConfig }) {
  if (!config) return null;

  const [formConfig, setFormConfig] = useState(config);

  useEffect(() => {
    setFormConfig(config);
  }, [config]);

  const handleToggle = (key) => {
    const updated = { ...formConfig, [key]: !formConfig[key] };
    setFormConfig(updated);
    onSaveConfig(updated);
  };

  const handleSlider = (val) => {
    const updated = { ...formConfig, max_discount_percentage: parseFloat(val) };
    setFormConfig(updated);
    onSaveConfig(updated);
  };

  return (
    <div className="merchant-guardrails-card">
      <div className="guardrails-header-row">
        <div className="guardrails-title-group">
          <div className="guardrails-icon-wrap">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="guardrails-title">Merchant Guardrails & Gating Controls</h3>
            <p className="guardrails-subtitle">Toggle automated AI strategies and enforce strict profit ceiling limits</p>
          </div>
        </div>
        <span className="security-status-badge">
          <Shield size={14} /> Guardrails Active
        </span>
      </div>

      {/* 4 Strategy Toggle Cards */}
      <div className="guardrail-toggles-grid">
        {/* Upsell */}
        <div className={`toggle-card ${formConfig.upsell_enabled ? 'active' : ''}`} onClick={() => handleToggle('upsell_enabled')}>
          <div className="toggle-card-header">
            <div className="toggle-card-icon purple">
              <Zap size={18} />
            </div>
            <label className="switch" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={formConfig.upsell_enabled || false}
                onChange={() => handleToggle('upsell_enabled')}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-card-title">Enable Upselling</div>
          <div className="toggle-card-desc">Suggests higher-margin premium product upgrades to buyers</div>
        </div>

        {/* Cross-Sell */}
        <div className={`toggle-card ${formConfig.cross_sell_enabled ? 'active' : ''}`} onClick={() => handleToggle('cross_sell_enabled')}>
          <div className="toggle-card-header">
            <div className="toggle-card-icon cyan">
              <ShoppingBag size={18} />
            </div>
            <label className="switch" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={formConfig.cross_sell_enabled || false}
                onChange={() => handleToggle('cross_sell_enabled')}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-card-title">Enable Cross-Selling</div>
          <div className="toggle-card-desc">Curates complementary styling pairs and outfit matches</div>
        </div>

        {/* Smart Bundles */}
        <div className={`toggle-card ${formConfig.bundles_enabled ? 'active' : ''}`} onClick={() => handleToggle('bundles_enabled')}>
          <div className="toggle-card-header">
            <div className="toggle-card-icon emerald">
              <Layers size={18} />
            </div>
            <label className="switch" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={formConfig.bundles_enabled || false}
                onChange={() => handleToggle('bundles_enabled')}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-card-title">Enable Smart Bundles</div>
          <div className="toggle-card-desc">Offers automated complete outfit bundle savings to buyers</div>
        </div>

        {/* Dead Stock Push */}
        <div className={`toggle-card ${formConfig.dead_stock_push_enabled ? 'active' : ''}`} onClick={() => handleToggle('dead_stock_push_enabled')}>
          <div className="toggle-card-header">
            <div className="toggle-card-icon amber">
              <Flame size={18} />
            </div>
            <label className="switch" onClick={(e) => e.stopPropagation()}>
              <input 
                type="checkbox" 
                checked={formConfig.dead_stock_push_enabled || false}
                onChange={() => handleToggle('dead_stock_push_enabled')}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-card-title">Enable Dead Stock Push</div>
          <div className="toggle-card-desc">Prioritizes clearing slow-moving inventory with subtle discounts</div>
        </div>
      </div>

      {/* Max Discount Ceiling Range Slider */}
      <div className="discount-slider-section">
        <div className="slider-header-row">
          <span className="slider-label">Max Discount Ceiling Cap:</span>
          <span className="slider-value-badge">{formConfig.max_discount_percentage || 15}% MAX DISCOUNT</span>
        </div>

        <input 
          type="range"
          min="5"
          max="30"
          step="1"
          value={formConfig.max_discount_percentage || 15}
          onChange={(e) => handleSlider(e.target.value)}
          className="custom-range-slider"
        />

        <div className="slider-info-note">
          <Info size={14} style={{ flexShrink: 0, color: '#0EA5E9' }} />
          <span>DropGenius AI will strictly cap all automatic customer discounts under <strong>{formConfig.max_discount_percentage}%</strong> to preserve merchant profit margins.</span>
        </div>
      </div>
    </div>
  );
}
