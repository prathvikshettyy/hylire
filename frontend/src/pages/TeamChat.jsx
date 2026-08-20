import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeamChat = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatHistoryRef = useRef(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      setProjects([]);
      setSelectedProjectId('');
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedProjectId) {
      setMessages([]);
      return;
    }
    try {
      const res = await fetch(`${apiBaseUrl}/chat/project/${selectedProjectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    fetchChatHistory();
  }, [selectedProjectId]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedProjectId) return;

    const payload = {
      projectId: selectedProjectId,
      senderId: user ? user.id : 'u-1',
      senderName: user ? user.fullName : 'John Builder',
      messageText: typedMessage
    };

    try {
      const res = await fetch(`${apiBaseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setTypedMessage('');
      }
    } catch (err) {
      console.warn('Offline mode: Sending mock message.');
      const newMsg = {
        id: `msg-${Date.now()}`,
        projectId: selectedProjectId,
        senderId: user ? user.id : 'u-1',
        senderName: user ? user.fullName : 'John Builder',
        messageText: typedMessage,
        createdAt: new Date().toISOString()
      };
      setMessages([...messages, newMsg]);
      setTypedMessage('');
    }
  };

  const getProjectName = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    return proj ? proj.name : 'Collaboration Channel';
  };

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Collaboration Desk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Project-wide team instant messenger and sharing platform</p>
        </div>

        <select 
          className="form-select"
          style={{ width: 'auto', minWidth: 240 }}
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 24 }}>
        {/* Main Chat Panel */}
        <div className="chat-container">
          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'rgba(11, 14, 23, 0.6)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getProjectName()} Chatroom</span>
          </div>

          {/* History */}
          <div className="chat-history" ref={chatHistoryRef}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', textAlign: 'center' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No messages in this project room yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = user && msg.senderId === user.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`chat-bubble ${isMe ? 'sent' : 'received'}`}
                  >
                    {!isMe && <div className="chat-sender">{msg.senderName}</div>}
                    <div>{msg.messageText}</div>
                    <div className="chat-meta">
                      <span />
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Typing Bar */}
          <form onSubmit={handleSend} className="chat-input-bar">
            <input 
              type="text" 
              className="form-input" 
              placeholder="Type your project update here..." 
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: 12 }}>
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Members & Safety Rules Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1rem' }}><Users size={16} /> Channel Members</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.85rem' }}>John Builder (Admin)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.85rem' }}>Sarah Engineer (Supervisor)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ fontSize: '0.85rem' }}>Mark Contractor</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.02)', border: '1px solid rgba(245, 158, 11, 0.12)' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', color: 'var(--color-warning)' }}><ShieldAlert size={16} /> Safety Regulations</h3>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 8 }}>
              All team members must post daily clearance updates before starting structural concreting or brickwork. Wear high-visibility vests at all active locations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;
