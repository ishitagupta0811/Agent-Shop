import React, { useState } from 'react';
import { Search, FileText } from 'lucide-react';

export default function AuditLogExplorer({ logs }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!logs) return null;

  const filteredLogs = logs.filter(log => 
    (log.session_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.strategy_used || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} style={{ color: '#38BDF8' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Agent Audit Log Explorer</h3>
        </div>

        <div style={{ position: 'relative' }}>
          <input 
            type="text"
            placeholder="Search by session, strategy, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 1rem 0.5rem 2.2rem',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              width: '280px',
            }}
          />
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Session ID</th>
              <th>Strategy</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '2rem' }}>
                  No audit log records found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{log.timestamp ? log.timestamp.substring(11, 19) : 'N/A'}</td>
                  <td><code>{log.session_id}</code></td>
                  <td><span className="badge badge-category">{log.strategy_used}</span></td>
                  <td style={{ color: '#10B981', fontWeight: 700 }}>{log.discount_offered}%</td>
                  <td>
                    <span 
                      className={`badge ${
                        log.status === 'ACCEPTED' ? 'badge-premium' : 
                        log.status === 'REJECTED' ? 'badge-deadstock' : 'badge-category'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: log.revenue_impact > 0 ? '#10B981' : '#94A3B8' }}>
                    +₹{log.revenue_impact}
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
