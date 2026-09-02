import React, { useState, useEffect } from 'react';
import KPICards from './KPICards';
import GuardrailsPanel from './GuardrailsPanel';
import AuditLogExplorer from './AuditLogExplorer';
import { api } from '../../api';

export default function MerchantDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [mRes, cRes, lRes] = await Promise.all([
        api.getMerchantMetrics(),
        api.getMerchantConfig(),
        api.getAuditLogs(50),
      ]);
      setMetrics(mRes);
      setConfig(cRes);
      setLogs(lRes.logs || lRes.audit_logs || []);
    } catch (err) {
      console.error('Failed to load merchant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto poll every 1.5s for real-time live metrics sync
    const interval = setInterval(loadDashboardData, 1500);

    // Listen on BroadcastChannel for instant cross-tab buyer activity
    let channel;
    try {
      channel = new BroadcastChannel('agentshop_sync');
      channel.onmessage = () => {
        loadDashboardData();
      };
    } catch (e) {
      // BroadcastChannel fallback
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, []);

  const handleSaveConfig = async (newConfig) => {
    try {
      await api.updateMerchantConfig(newConfig);
      setConfig(newConfig);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94A3B8' }}>Loading Merchant Portal Analytics...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Merchant Growth & Control Hub</h1>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          ● LIVE SYNC ACTIVE
        </span>
      </div>
      <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Monitor real-time AI revenue lift, configure merchant guardrail ceilings, and audit agent actions.
      </p>

      <KPICards metrics={metrics} />
      <GuardrailsPanel config={config} onSaveConfig={handleSaveConfig} />
      <AuditLogExplorer logs={logs} />
    </div>
  );
}
