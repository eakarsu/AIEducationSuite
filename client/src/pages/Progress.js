import React, { useState, useEffect } from 'react';
import { FiActivity, FiTrendingUp } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Progress() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [entriesData, statsData] = await Promise.all([api.progress.getAll(), api.progress.getStats()]);
        setEntries(entriesData);
        setStats(statsData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const getTypeColor = (type) => {
    const colors = { essay: '#667eea', music: '#f093fb', quiz: '#4facfe', reading: '#11998e', learning: '#ff416c' };
    return colors[type] || '#667eea';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading progress...</p></div>;

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiActivity /> Progress Tracking</h1><p>Track your learning journey</p></div></div>
      <div className="container page-container">
        {stats && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1rem',marginBottom:'2rem'}}>
            <div className="detail-view" style={{padding:'1.5rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',fontWeight:'bold',color:'var(--primary)'}}>{stats.totalActivities}</div>
              <div className="text-muted">Total Activities</div>
            </div>
            {stats.byType?.map(t => (
              <div key={t.feature_type} className="detail-view" style={{padding:'1.5rem',textAlign:'center'}}>
                <div style={{fontSize:'2rem',fontWeight:'bold',color:getTypeColor(t.feature_type)}}>{t.count}</div>
                <div className="text-muted" style={{textTransform:'capitalize'}}>{t.feature_type}</div>
              </div>
            ))}
          </div>
        )}
        {stats?.avgScores?.length > 0 && (
          <div className="detail-view" style={{marginBottom:'2rem'}}>
            <div className="detail-content">
              <h3><FiTrendingUp /> Average Scores</h3>
              <div style={{display:'grid',gap:'0.75rem',marginTop:'1rem'}}>
                {stats.avgScores.map(s => (
                  <div key={s.feature_type} style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                    <span style={{width:'100px',textTransform:'capitalize',fontWeight:'500'}}>{s.feature_type}</span>
                    <div className="progress-bar" style={{flex:1}}><div className="progress-bar-fill" style={{width:`${s.avg_score}%`}}></div></div>
                    <span style={{fontWeight:'bold',color:getTypeColor(s.feature_type)}}>{s.avg_score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="detail-view">
          <div className="detail-content">
            <h3>Recent Activity</h3>
            {entries.length === 0 ? <p className="text-muted">No activity yet</p> : (
              <div className="data-list" style={{marginTop:'1rem'}}>
                {entries.map(e => (
                  <div key={e.id} className="data-list-item" style={{cursor:'default'}}>
                    <div className="data-list-item-content">
                      <div className="data-list-item-title" style={{textTransform:'capitalize'}}>{e.action} - {e.feature_type}</div>
                      <div className="data-list-item-meta">{new Date(e.created_at).toLocaleString()}{e.score && ` • Score: ${e.score}`}</div>
                    </div>
                    {e.score && <span className="badge badge-primary">Score: {e.score}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Progress;
