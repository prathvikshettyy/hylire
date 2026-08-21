import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, AlertCircle, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localTasks, localSites, localProjects, getLocalStore } from '../utils/localStore';

const Tasks = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [sites, setSites] = useState(() => localSites.list());
  const [projects, setProjects] = useState(() => localProjects.list());
  const [selectedSiteId, setSelectedSiteId] = useState(() => {
    const s = localSites.list();
    return s.length > 0 ? s[0].id : '';
  });
  const [tasks, setTasks] = useState(() => {
    const s = localSites.list();
    return s.length > 0 ? localTasks.list(s[0].id) : localTasks.list();
  });
  const [team, setTeam] = useState(() => getLocalStore().users.filter(u => u.role !== 'client'));
  const [loading, setLoading] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [siteId, setSiteId] = useState('');

  const fetchData = async () => {
    // 1. Instantly load local data
    const localS = localSites.list();
    const localP = localProjects.list();
    setSites(localS);
    setProjects(localP);
    if (localS.length > 0 && !selectedSiteId) {
      setSelectedSiteId(localS[0].id);
      setSiteId(localS[0].id);
    }

    // 2. Sync with API
    try {
      const [projRes, siteRes, teamRes] = await Promise.all([
        fetch(`${apiBaseUrl}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/sites`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/auth/list`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData?.length > 0) setProjects(pData);
      }
      if (siteRes.ok) {
        const sData = await siteRes.json();
        if (sData?.length > 0) setSites(sData);
      }
      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeam(tData.filter(u => u.role !== 'client'));
      }
    } catch (err) {
      // Offline / Vercel mode: local data already active
    }
  };

  const fetchTasks = async () => {
    if (!selectedSiteId) return;
    // 1. Load local tasks instantly
    const lt = localTasks.list(selectedSiteId);
    setTasks(lt);

    // 2. Sync with API
    try {
      const res = await fetch(`${apiBaseUrl}/tasks?siteId=${selectedSiteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.length > 0) setTasks(data);
      }
    } catch (err) {
      // Offline mode
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [selectedSiteId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!siteId || !name) return;

    let targetSiteId = siteId;

    // If target site is auto-generated for a project without existing sites
    if (siteId.startsWith('auto-site-')) {
      const projId = siteId.replace('auto-site-', '');
      const selectedSite = sites.find(s => s.id === siteId);
      try {
        const siteRes = await fetch(`${apiBaseUrl}/sites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            projectId: projId,
            name: selectedSite ? selectedSite.name : 'Main Construction Site',
            address: 'Primary Site Location'
          })
        });
        if (siteRes.ok) {
          const createdSite = await siteRes.json();
          targetSiteId = createdSite.id;
          setSites(sites.map(s => s.id === siteId ? createdSite : s));
        }
      } catch (e) {
        console.warn('Offline site creation fallback');
      }
    }

    const payload = { siteId: targetSiteId, name, description, assignedTo, priority, deadline, stage: 'todo', status: 'todo' };

    // 1. Save directly to local storage
    localTasks.create(payload);
    setTasks(localTasks.list(selectedSiteId));
    resetForm();

    // 2. Sync with API in background
    try {
      await fetch(`${apiBaseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Offline mode
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    const statusFlow = { 'todo': 'in-progress', 'in-progress': 'in-review', 'in-review': 'done' };
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    // 1. Update local storage directly
    localTasks.updateStage(id, nextStatus);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus, stage: nextStatus } : t));

    // 2. Sync with API
    try {
      await fetch(`${apiBaseUrl}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (err) {
      // Offline mode
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAssignedTo('');
    setPriority('medium');
    setDeadline('');
    setShowAddForm(false);
  };

  const getTeamName = (uId) => {
    const member = team.find(t => t.id === uId);
    return member ? `${member.fullName} (${member.role})` : 'Unassigned';
  };

  // Supervisors, Builders and Engineers can create tasks
  const canManage = user && (user.role === 'builder' || user.role === 'admin' || user.role === 'engineer');

  const columns = [
    { key: 'todo', label: 'To Do', badgeClass: 'badge-warning' },
    { key: 'in-progress', label: 'In Progress', badgeClass: 'badge-info' },
    { key: 'in-review', label: 'Review Stage', badgeClass: 'badge-warning' },
    { key: 'done', label: 'Completed', badgeClass: 'badge-success' }
  ];

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Task Board</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize daily operations and manage workforce checklists</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Site Selector dropdown */}
          <select 
            className="form-select"
            style={{ width: 'auto', minWidth: 200 }}
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {canManage && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn btn-primary"
              style={{ display: 'flex', gap: 6 }}
            >
              <Plus size={16} />
              <span>{showAddForm ? 'Board View' : 'Add Task'}</span>
            </button>
          )}
        </div>
      </div>

      {showAddForm ? (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h2 className="card-title"><CheckSquare size={18} /> Allocate New Site Task</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Select Target Site</label>
              <select 
                className="form-select"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Task Headline</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Foundation Pour - Stage 2" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Task Description</label>
              <textarea 
                className="form-textarea" 
                rows="3" 
                placeholder="List work requirements, materials needed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select 
                  className="form-select"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Select Assignee</option>
                  {team.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.role})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Task Deadline</label>
              <input 
                type="date" 
                className="form-input" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Deploy Task</button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <span>{col.label}</span>
                  <span className={`badge ${col.badgeClass}`} style={{ fontSize: '0.65rem' }}>{colTasks.length}</span>
                </div>
                
                {colTasks.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: 12 }}>
                    No Tasks
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div key={task.id} className="kanban-card">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span className={`badge ${task.priority === 'high' ? 'badge-error' : task.priority === 'medium' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.6rem' }}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="kanban-card-title">{task.name}</h4>
                        <p className="kanban-card-desc">{task.description}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                          <User size={12} style={{ color: 'var(--primary-color)' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getTeamName(task.assignedTo)}
                          </span>
                        </div>
                        
                        <div className="kanban-card-footer">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            <Calendar size={10} />
                            <span>{task.deadline || 'No Date'}</span>
                          </div>

                          {task.status !== 'done' && (
                            <button 
                              onClick={() => handleUpdateStatus(task.id, task.status)}
                              className="btn btn-secondary" 
                              style={{ padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                              title="Advance Status"
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
