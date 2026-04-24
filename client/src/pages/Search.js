import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { api } from '../utils/api';
import './FeaturePage.css';

function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = async (q) => {
    setQuery(q);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!q.trim()) { setResults(null); return; }
    setSearchTimeout(setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.search(q);
        setResults(data.results);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }, 300));
  };

  const navigateToResult = (type, id) => {
    const paths = { essay: '/essays', music: '/music', quiz: '/quizzes', reading: '/reading', learning: '/learning' };
    navigate(paths[type] || '/dashboard');
  };

  const totalResults = results ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0) : 0;

  return (
    <div className="feature-page">
      <div className="page-header"><div className="container"><h1><FiSearch /> Search</h1><p>Find anything across your learning content</p></div></div>
      <div className="container page-container">
        <div style={{marginBottom:'2rem'}}>
          <input className="form-input" style={{fontSize:'1.125rem',padding:'1rem'}} placeholder="Search essays, quizzes, lessons, and more..."
            value={query} onChange={e => handleSearch(e.target.value)} autoFocus />
        </div>
        {loading && <div className="loading-container" style={{minHeight:'100px'}}><div className="spinner"></div></div>}
        {results && !loading && (
          <>
            <p className="text-muted" style={{marginBottom:'1rem'}}>{totalResults} results found</p>
            {Object.entries(results).map(([type, items]) => items.length > 0 && (
              <div key={type} style={{marginBottom:'1.5rem'}}>
                <h3 style={{textTransform:'capitalize',marginBottom:'0.75rem'}}>{type} ({items.length})</h3>
                <div className="data-list">
                  {items.map(item => (
                    <div key={item.id} className="data-list-item" onClick={() => navigateToResult(item.type || type, item.id)}>
                      <div className="data-list-item-content">
                        <div className="data-list-item-title">{item.title}</div>
                        <div className="data-list-item-meta">{new Date(item.created_at).toLocaleDateString()}{item.grade && ` • Grade: ${item.grade}`}{item.subject && ` • ${item.subject}`}{item.instrument && ` • ${item.instrument}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {totalResults === 0 && <div className="empty-state"><div className="empty-state-icon">🔍</div><h3>No results found</h3><p>Try different keywords</p></div>}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
