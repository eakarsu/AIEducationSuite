import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { api } from '../utils/api';

function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCount = async () => {
    try {
      const data = await api.notifications.getUnreadCount();
      setCount(data.count);
    } catch (e) { /* ok */ }
  };

  return (
    <button
      onClick={() => navigate('/notifications')}
      style={{
        position: 'relative', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
        cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius)', transition: 'var(--transition)',
        display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', fontSize: '0.875rem'
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'white'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
    >
      <FiBell size={18} />
      <span>Notifications</span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: '0', right: '0', background: 'var(--danger)', color: 'white',
          borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 'bold', minWidth: '18px',
          height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
