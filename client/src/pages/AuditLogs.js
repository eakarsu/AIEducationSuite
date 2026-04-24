import React, { useState, useEffect } from 'react';
import { FiList, FiArrowLeft } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const loadLogs = React.useCallback(async () => {
    try {
      const data = await api.auditLogs.getAll({ page, limit: 20 });
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (err) { setError(err.message || 'Failed to load audit logs. Admin access required.'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading audit logs...</p></div>;

  if (selected) {
    return (
      <div className="feature-page">
        <div className="page-header"><div className="container">
          <button className="btn btn-secondary" onClick={() => setSelected(null)}><FiArrowLeft /> Back</button>
        </div></div>
        <div className="container page-container">
          <div className="detail-view">
            <div className="detail-header">
              <div><h1 className="detail-title">{selected.action}</h1>
                <div className="detail-meta">
                  <span className="badge badge-info">{selected.entity_type}</span>
                  <span>{new Date(selected.created_at).toLocaleString()}</span>
                  <span>IP: {selected.ip_address}</span>
                </div></div>
            </div>
            <div className="detail-content">
              <div className="detail-section"><h3>Details</h3>
                <p>User: {selected.user_name || selected.user_email || 'Unknown'}</p>
                <p>Entity ID: {selected.entity_id || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiList /> Audit Logs</h1><p>System activity log (admin only)</p></div></div>
      <div className="container page-container">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="toolbar"><div className="toolbar-left"><span className="text-muted">{pagination?.total || 0} total entries</span></div></div>
        <div className="data-list">
          {logs.map(log => (
            <div key={log.id} className="data-list-item" onClick={() => setSelected(log)}>
              <div className="data-list-item-content">
                <div className="data-list-item-title">{log.action}</div>
                <div className="data-list-item-meta">
                  <span className="badge badge-info" style={{marginRight:'0.5rem'}}>{log.entity_type}</span>
                  {log.user_name || log.user_email || 'System'} - {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',marginTop:'2rem'}}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{padding:'0.5rem 1rem'}}>Page {page} of {pagination.totalPages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogs;
