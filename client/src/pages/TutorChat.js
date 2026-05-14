import React, { useState, useEffect, useRef } from 'react';

/**
 * Multi-turn AI tutor chat with conversation persistence.
 * Backend: POST /api/ai/tutor-chat — uses last 6 messages as context.
 */
export default function TutorChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [subject, setSubject] = useState('General');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      const r = await fetch('/api/ai/tutor-chat', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
  };

  const loadConversation = async (convId) => {
    try {
      const r = await fetch(`/api/ai/tutor-chat/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        setMessages(data.messages || []);
        setConversationId(convId);
      }
    } catch (e) { setError(e.message); }
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const r = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg.content, conversation_id: conversationId, subject })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Chat failed');
      setConversationId(data.conversation_id);
      setMessages((m) => [...m, { role: 'assistant', content: data.response }]);
      loadConversations();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const startNew = () => { setMessages([]); setConversationId(null); };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', padding: 16, gap: 16 }}>
      <div style={{ width: 260, overflowY: 'auto', borderRight: '1px solid #e5e7eb', paddingRight: 12 }}>
        <button onClick={startNew} style={{ width: '100%', padding: 8, marginBottom: 12, background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6 }}>+ New Chat</button>
        <h3 style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Past conversations</h3>
        {conversations.map((c) => (
          <div
            key={c.conversation_id}
            onClick={() => loadConversation(c.conversation_id)}
            style={{
              padding: 8, borderRadius: 4, cursor: 'pointer', marginBottom: 4,
              background: c.conversation_id === conversationId ? '#dbeafe' : 'transparent',
              fontSize: 13
            }}
          >
            <div style={{ fontWeight: 500 }}>{c.subject || 'General'}</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>{c.message_count} msgs &middot; {new Date(c.last_message_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>AI Tutor Chat</h2>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ padding: 6, marginLeft: 'auto' }}>
            <option>General</option>
            <option>Math</option>
            <option>Science</option>
            <option>Writing</option>
            <option>History</option>
            <option>Language</option>
            <option>Music</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
          {messages.length === 0 && (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
              Ask anything to get started. Your tutor remembers the conversation.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              margin: '8px 0', padding: 12, borderRadius: 8,
              background: m.role === 'user' ? '#dbeafe' : '#fff',
              border: '1px solid ' + (m.role === 'user' ? '#bfdbfe' : '#e5e7eb')
            }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{m.role.toUpperCase()}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ color: '#6b7280', fontStyle: 'italic' }}>Tutor is typing...</div>}
          <div ref={bottomRef} />
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 8, borderRadius: 4, marginBottom: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask a question (Enter to send)"
            rows={2}
            style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', borderRadius: 6, resize: 'none' }}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'wait' : 'pointer' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
