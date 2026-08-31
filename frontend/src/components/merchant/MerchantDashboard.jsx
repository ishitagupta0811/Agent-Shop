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
      setLogs(lRes.audit_logs || []);
    } catch (err) {
      console.error('Failed to load merchant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSaveConfig = async (newConfig) => {
    try {
      await api.updateMerchantConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94A3B8' }}>Loading Merchant Portal Analytics...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Merchant Growth & Control Hub</h1>
      <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Monitor real-time AI revenue lift, configure merchant guardrail ceilings, and audit agent actions.
      </p>

      <KPICards metrics={metrics} />
      <GuardrailsPanel config={config} onSaveConfig={handleSaveConfig} />
      <AuditLogExplorer logs={logs} />
    </div>
  );
}
