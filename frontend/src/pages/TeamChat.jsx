import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localProjects, localChat, syncCollection, DEFAULT_INITIAL_STATE } from '../utils/localStore';

const TeamChat = () => {
  const { user, token, apiBaseUrl } = useAuth();
  
  // 1. Initialize projects from local storage
  const [projects, setProjects] = useState(() => {
    const list = localProjects.list();
    return list.length > 0 ? list : DEFAULT_INITIAL_STATE.projects;
  });

  // 2. Initialize selected project ID
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const list = localProjects.list();
    if (list.length > 0) return list[0].id;
    return DEFAULT_INITIAL_STATE.projects[0]?.id || '';
  });

  // 3. Initialize messages from local store for the selected project
  const [messages, setMessages] = useState(() => {
    const list = localProjects.list();
    const initId = list.length > 0 ? list[0].id : (DEFAULT_INITIAL_STATE.projects[0]?.id || '');
    return initId ? localChat.listByProject(initId) : [];
  });

  const [typedMessage, setTypedMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef(null);

  // Sync projects with API if available, but NEVER wipe local projects
  const fetchProjects = async () => {
    const local = localProjects.list();
    const currentList = local.length > 0 ? local : DEFAULT_INITIAL_STATE.projects;
    setProjects(currentList);
    if (currentList.length > 0 && !selectedProjectId) {
      setSelectedProjectId(currentList[0].id);
    }

    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          syncCollection('projects', data);
          setProjects(data);
          setSelectedProjectId(prev => prev && data.some(p => p.id === prev) ? prev : data[0].id);
        }
      }
    } catch (err) {
      // Standalone / Vercel offline mode: keep local projects
      const fallback = localProjects.list();
      const safe = fallback.length > 0 ? fallback : DEFAULT_INITIAL_STATE.projects;
      setProjects(safe);
      if (safe.length > 0 && !selectedProjectId) {
        setSelectedProjectId(safe[0].id);
      }
    }
  };

  // Sync chat messages for active project
  const fetchChatHistory = async () => {
    const activeProjId = selectedProjectId || (projects.length > 0 ? projects[0].id : null);
    if (!activeProjId) return;

    // Load from local store first so messages display immediately
    const localMsgs = localChat.listByProject(activeProjId);
    setMessages(localMsgs);

    try {
      const res = await fetch(`${apiBaseUrl}/chat/project/${activeProjId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          syncCollection('chatMessages', data);
          setMessages(localChat.listByProject(activeProjId));
        }
      }
    } catch (err) {
      // Offline fallback: keep local messages
      setMessages(localChat.listByProject(activeProjId));
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchChatHistory();
    }
  }, [selectedProjectId]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (isSending) return;

    const activeProjId = selectedProjectId || (projects.length > 0 ? projects[0].id : null);
    const textToSend = typedMessage.trim();
    if (!textToSend || !activeProjId) return;

    setIsSending(true);
    setTypedMessage(''); // Immediately clear input so fast double-clicks or Enter keys cannot re-submit

    const payload = {
      projectId: activeProjId,
      senderId: user ? user.id : 'u-1',
      senderName: user ? (user.fullName || user.email) : 'John Builder',
      role: user ? user.role : 'builder',
      messageText: textToSend,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately save to localChat with deduplication guard
    const savedMsg = localChat.create(payload);
    setMessages(localChat.listByProject(activeProjId));

    // 2. Sync to backend API if available
    try {
      await fetch(`${apiBaseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...payload, id: savedMsg?.id })
      });
    } catch (err) {
      // Offline/standalone Vercel mode: message is already safely stored in localChat!
    } finally {
      setIsSending(false);
    }
  };

  const getProjectName = () => {
    const proj = projects.find(p => p.id === selectedProjectId);
    return proj ? proj.name : (projects[0]?.name || 'Collaboration Channel');
  };

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          {projects.length > 0 ? (
            projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          ) : (
            <option value="">General Project Channel</option>
          )}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Main Chat Panel */}
        <div className="chat-container">
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--chat-input-bar-bg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{getProjectName()} Chatroom</span>
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
                    {!isMe && <div className="chat-sender">{msg.senderName} {msg.role ? `(${msg.role})` : ''}</div>}
                    <div>{msg.messageText}</div>
                    <div className="chat-meta">
                      <span />
                      <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
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
              style={{ background: 'var(--input-bg, rgba(255,255,255,0.02))' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={!typedMessage.trim() || isSending}
            >
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
