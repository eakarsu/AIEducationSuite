import React, { useEffect, useMemo, useState } from 'react';

const titleCase = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

function RecordValue({ value }) {
  if (value === null || value === undefined || value === '') return <span style={styles.muted}>Not provided</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (Array.isArray(value)) {
    return <ul style={{ margin: 0, paddingLeft: 18 }}>{value.map((item, i) => <li key={i}><RecordValue value={item} /></li>)}</ul>;
  }
  if (typeof value === 'object') {
    return (
      <dl style={{ margin: 0 }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,40%) 1fr', gap: 8 }}>
            <dt style={{ color: '#64748b' }}>{titleCase(k)}</dt>
            <dd style={{ margin: 0 }}><RecordValue value={v} /></dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{String(value)}</span>;
}

/**
 * Details dialog for a record table row with Edit / Delete (confirmed) / Cancel.
 * Modelled on ai-340b-contract-pharmacy-audit-recovery RecordDialog.jsx.
 */
export default function RecordDialog({ title = 'Record details', item, columns, fields, onClose, onEdit, onDelete, busy = false, children }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  const rows = useMemo(() => {
    if (fields) return fields;
    if (columns && columns.length) return columns.map((c) => ({ key: c.key, label: c.label || titleCase(c.key) }));
    return item ? Object.keys(item).map((key) => ({ key, label: titleCase(key) })) : [];
  }, [columns, fields, item]);

  if (!item) return null;

  return (
    <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }} style={styles.backdrop}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={styles.dialog}>
        <header style={styles.header}>
          <div>
            <span style={styles.eyebrow}>Record details</span>
            <h3 style={styles.title}>{title}</h3>
          </div>
          <button type="button" style={styles.close} aria-label="Cancel" disabled={busy} onClick={onClose}>×</button>
        </header>
        <div style={styles.body}>
          <dl style={styles.grid}>
            {rows.map((field) => (
              <div key={field.key} style={styles.row}>
                <dt style={styles.key}>{field.label}</dt>
                <dd style={styles.val}><RecordValue value={item[field.key]} /></dd>
              </div>
            ))}
          </dl>
          {children}
        </div>
        <footer style={styles.footer}>
          {confirmDelete ? (
            <div style={styles.confirm}>
              <strong style={{ color: '#b91c1c' }}>Delete this record?</strong>
              <button type="button" style={styles.deleteSolid} disabled={busy} onClick={() => onDelete?.(item)}>Delete record</button>
              <button type="button" style={styles.secondary} disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel deletion</button>
            </div>
          ) : (
            <div style={styles.actions}>
              {onEdit && <button type="button" style={styles.edit} disabled={busy} onClick={() => onEdit(item)}>Edit</button>}
              {onDelete && <button type="button" style={styles.delete} disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</button>}
              <button type="button" style={styles.secondary} disabled={busy} onClick={onClose}>Cancel</button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 },
  dialog: { background: '#fff', color: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px rgba(2, 6, 23, 0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748b' },
  title: { margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0f172a' },
  close: { background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, width: 32, height: 32, color: '#64748b', cursor: 'pointer', fontSize: 16 },
  body: { padding: 20, overflowY: 'auto' },
  grid: { margin: 0, display: 'grid', gap: 10 },
  row: { display: 'grid', gridTemplateColumns: 'minmax(140px, 32%) 1fr', gap: 14, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 },
  key: { margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' },
  val: { margin: 0, fontSize: 14, color: '#1e293b' },
  muted: { color: '#94a3b8' },
  footer: { padding: '14px 20px', borderTop: '1px solid #e2e8f0' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' },
  confirm: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' },
  edit: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '9px 16px', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer' },
  delete: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '9px 16px', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' },
  deleteSolid: { background: '#dc2626', border: '1px solid #dc2626', borderRadius: 10, padding: '9px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  secondary: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 16px', color: '#334155', fontWeight: 700, cursor: 'pointer' },
};
