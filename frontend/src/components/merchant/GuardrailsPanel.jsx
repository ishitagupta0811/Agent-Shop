import React from 'react';
import { Sliders, ShieldAlert } from 'lucide-react';

export default function GuardrailsPanel({ config, onSaveConfig }) {
  if (!config) return null;

  const [formConfig, setFormConfig] = React.useState(config);

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
    <div style={{ backgroundColor: '#1E293B', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Sliders size={20} style={{ color: '#6366F1' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Merchant Guardrails & Gating Controls</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox"
            checked={formConfig.upsell_enabled || false}
            onChange={() => handleToggle('upsell_enabled')}
            style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
          />
          Enable Upselling
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox"
            checked={formConfig.cross_sell_enabled || false}
            onChange={() => handleToggle('cross_sell_enabled')}
            style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
          />
          Enable Cross-Selling
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox"
            checked={formConfig.bundles_enabled || false}
            onChange={() => handleToggle('bundles_enabled')}
            style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
          />
          Enable Smart Bundles
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox"
            checked={formConfig.dead_stock_push_enabled || false}
            onChange={() => handleToggle('dead_stock_push_enabled')}
            style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
          />
          Enable Dead Stock Push
        </label>
      </div>

      <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: '#94A3B8' }}>Max Discount Ceiling Cap:</span>
          <span style={{ color: '#10B981', fontWeight: 800 }}>{formConfig.max_discount_percentage}%</span>
        </div>
        <input 
          type="range"
          min="5"
          max="30"
          step="1"
          value={formConfig.max_discount_percentage || 15}
          onChange={(e) => handleSlider(e.target.value)}
          style={{ width: '100%', accentColor: '#10B981' }}
        />
      </div>
    </div>
  );
}
