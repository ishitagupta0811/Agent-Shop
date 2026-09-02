import React, { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, Clock, Zap, ShoppingBag, Layers, Flame } from 'lucide-react';

export default function AuditLogExplorer({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!logs) return null;

  const realLogs = logs.filter(log => 
    !log.session_id.startsWith('backend_') && 
    !log.session_id.startsWith('test_')
  );

  const filteredLogs = realLogs.filter(log => 
    (log.session_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.strategy_used || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStrategyBadge = (strat) => {
    switch (strat) {
      case 'UPSELL':
        return <span className="strat-badge strat-upsell"><Zap size={12} /> UPSELL</span>;
      case 'CROSS_SELL':
        return <span className="strat-badge strat-cross"><ShoppingBag size={12} /> CROSS-SELL</span>;
      case 'SMART_BUNDLE':
        return <span className="strat-badge strat-bundle"><Layers size={12} /> SMART BUNDLE</span>;
      case 'DEAD_STOCK_PUSH':
        return <span className="strat-badge strat-deadstock"><Flame size={12} /> DEAD STOCK</span>;
      case 'WISHLIST_CONVERSION':
        return <span className="strat-badge" style={{ background: '#FFF1F2', color: '#E11D48', borderColor: '#FFE4E6' }}><Heart size={12} /> WISHLIST</span>;
      default:
        return <span className="strat-badge strat-default">{strat || 'AI AGENT'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <span className="status-badge status-accepted"><CheckCircle size={12} /> Accepted</span>;
      case 'REJECTED':
        return <span className="status-badge status-rejected"><XCircle size={12} /> Declined</span>;
      case 'EXPIRED':
        return <span className="status-badge status-expired"><Clock size={12} /> Expired</span>;
      default:
        return <span className="status-badge status-default">{status || 'TRIGGERED'}</span>;
    }
  };

  return (
    <div className="merchant-audit-card">
      <div className="audit-header-row">
        <div className="audit-title-group">
          <div className="audit-icon-wrap">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="audit-title">AI Agent Audit Log Explorer</h3>
            <p className="audit-subtitle">Transparent real-time ledger of every decision made by DropGenius AI</p>
          </div>
        </div>

        <div className="audit-search-wrap">
          <Search size={16} className="audit-search-icon" />
          <input 
            type="text"
            placeholder="Search by session, strategy, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="audit-search-input"
          />
        </div>
      </div>

      <div className="audit-table-wrap">
        <table className="merchant-audit-table">
          <thead>
            <tr>
              <th>LOG ID</th>
              <th>TIMESTAMP</th>
              <th>SESSION ID</th>
              <th>AI STRATEGY</th>
              <th>DISCOUNT OFFERED</th>
              <th>STATUS</th>
              <th>REVENUE IMPACT</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-audit-cell">
                  <div className="empty-audit-box">
                    <FileText size={40} style={{ color: '#CBD5E1', marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>No Audit Logs Found</div>
                    <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Audit records appear automatically as buyers interact with DropGenius AI recommendations.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td className="log-id-cell">#{log.id}</td>
                  <td className="time-cell">
                    {log.timestamp ? log.timestamp.substring(11, 19) : 'Just now'}
                  </td>
                  <td>
                    <span className="session-code" title={log.session_id}>
                      👤 {log.session_id && log.session_id.startsWith('session_') 
                        ? 'Buyer #' + log.session_id.replace('session_', '') 
                        : log.session_id}
                    </span>
                  </td>
                  <td>{getStrategyBadge(log.strategy_used)}</td>
                  <td className="discount-cell">{log.discount_applied ?? log.discount_offered ?? 0}%</td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td className={`impact-cell ${log.revenue_impact > 0 ? 'positive' : 'neutral'}`}>
                    {log.revenue_impact > 0 ? `+₹${log.revenue_impact.toLocaleString('en-IN')}` : '₹0'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
