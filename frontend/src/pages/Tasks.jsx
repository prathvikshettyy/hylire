import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, AlertCircle, ArrowRight, User, Building } from 'lucide-react';
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
  const [siteId, setSiteId] = useState(() => {
    const s = localSites.list();
    return s.length > 0 ? s[0].id : '';
  });

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
        if (Array.isArray(pData)) setProjects(pData);
      }
      if (siteRes.ok) {
        const sData = await siteRes.json();
        if (Array.isArray(sData)) {
          setSites(sData);
          if (sData.length > 0) {
            setSelectedSiteId(curr => {
              if (!curr || !sData.some(s => s.id === curr)) {
                setSiteId(sData[0].id);
                return sData[0].id;
              }
              return curr;
            });
          }
        }
      }
      if (teamRes.ok) {
        const tData = await teamRes.json();
        setTeam(tData.filter(u => u.role !== 'client'));
      }
    } catch (err) {
      // Offline / Vercel mode: local data already active
    }
  };

  const fetchTasks = async (overrideSiteId) => {
    const targetId = overrideSiteId || selectedSiteId;
    if (!targetId) {
      setTasks([]);
      return;
    }
    // 1. Load local tasks instantly
    const lt = localTasks.list(targetId);
    setTasks(lt);

    // 2. Sync with API
    try {
      const res = await fetch(`${apiBaseUrl}/tasks?siteId=${targetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTasks(data);
      }
    } catch (err) {
      // Offline mode
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (selectedSiteId) {
      fetchTasks(selectedSiteId);
    } else {
      setTasks([]);
    }
  }, [selectedSiteId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const effectiveSiteId = siteId || selectedSiteId || (sites.length > 0 ? sites[0].id : '');

    if (!name.trim()) {
      alert('Please enter a task headline.');
      return;
    }
    if (!effectiveSiteId) {
      alert('Please select or create a construction site first.');
      return;
    }

    const payload = {
      siteId: effectiveSiteId,
      name: name.trim(),
      description: description.trim(),
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      deadline: deadline || null,
      stage: 'todo',
      status: 'todo'
    };

    // 1. Save directly to local storage
    localTasks.create(payload);
    setSelectedSiteId(effectiveSiteId);
    setTasks(localTasks.list(effectiveSiteId));
    resetForm();

    // 2. Sync with API in background
    try {
      const res = await fetch(`${apiBaseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchTasks(effectiveSiteId);
      }
    } catch (err) {
      console.warn('Task background sync note:', err);
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
        body: JSON.stringify({ status: nextStatus, stage: nextStatus })
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Task Board</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize daily operations and manage workforce checklists</p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Site Selector dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 200 }}
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              setSiteId(e.target.value);
            }}
          >
            {sites.length === 0 ? (
              <option value="">No Sites Available</option>
            ) : (
              sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))
            )}
          </select>

          {canManage && (
            <button
              onClick={() => {
                if (!siteId && (selectedSiteId || sites.length > 0)) {
                  setSiteId(selectedSiteId || sites[0].id);
                }
                setShowAddForm(!showAddForm);
              }}
              className="btn btn-primary"
              style={{ display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <Plus size={16} />
              <span>{showAddForm ? 'Board View' : 'Add Task'}</span>
            </button>
          )}
        </div>
      </div>

      {sites.length === 0 && !showAddForm ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 520, margin: '40px auto', borderRadius: 16 }}>
          <Building size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: 8, color: 'var(--text-main)' }}>No Construction Sites Available</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20, lineHeight: 1.5 }}>
            Tasks are allocated to specific project sites. Create a project and site to start deploying workforce checklists.
          </p>
          <a href="/projects" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            Go to Projects
          </a>
        </div>
      ) : showAddForm ? (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h2 className="card-title"><CheckSquare size={18} /> Allocate New Site Task</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Select Target Site</label>
              <select
                className="form-select"
                value={siteId || selectedSiteId || (sites.length > 0 ? sites[0].id : '')}
                onChange={(e) => setSiteId(e.target.value)}
                required
              >
                {sites.length === 0 ? (
                  <option value="">No Sites Found — Create a Site first</option>
                ) : (
                  sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                )}
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
            const colTasks = tasks.filter(t => (t.status === col.key || t.stage === col.key));
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

                          {(task.status !== 'done' && task.stage !== 'done') && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, task.status || task.stage)}
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
