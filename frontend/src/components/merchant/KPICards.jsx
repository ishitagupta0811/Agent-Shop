import React from 'react';
import { DollarSign, TrendingUp, Percent, PackageCheck } from 'lucide-react';

export default function KPICards({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="kpi-grid">
      <div className="kpi-card" style={{ borderLeft: '4px solid #38BDF8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="kpi-title">Total Store Revenue</div>
          <DollarSign size={20} style={{ color: '#38BDF8' }} />
        </div>
        <div className="kpi-value">₹{(metrics.total_revenue || 0).toLocaleString('en-IN')}</div>
      </div>

      <div className="kpi-card" style={{ borderLeft: '4px solid #10B981' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="kpi-title">AI Extra Revenue Lift</div>
          <TrendingUp size={20} style={{ color: '#10B981' }} />
        </div>
        <div className="kpi-value" style={{ color: '#10B981' }}>
          +₹{(metrics.extra_ai_revenue || 0).toLocaleString('en-IN')}
          <span style={{ fontSize: '0.85rem', marginLeft: '6px', fontWeight: 600 }}>
            ({metrics.ai_revenue_lift_percent || 0}%)
          </span>
        </div>
      </div>

      <div className="kpi-card" style={{ borderLeft: '4px solid #6366F1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="kpi-title">Agent Conversion Rate</div>
          <Percent size={20} style={{ color: '#6366F1' }} />
        </div>
        <div className="kpi-value">{metrics.conversion_rate_percent || 0}%</div>
      </div>

      <div className="kpi-card" style={{ borderLeft: '4px solid #F59E0B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="kpi-title">Dead Stock Cleared</div>
          <PackageCheck size={20} style={{ color: '#F59E0B' }} />
        </div>
        <div className="kpi-value">{metrics.dead_stock_units_moved || 0} Units</div>
      </div>
    </div>
  );
}
