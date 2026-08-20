import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, AlertCircle, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Tasks = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sites, setSites] = useState([]);
  const [team, setTeam] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [siteId, setSiteId] = useState('');

  const [projects, setProjects] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch projects & sites concurrently
      const [projRes, siteRes, teamRes] = await Promise.all([
        fetch(`${apiBaseUrl}/projects`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/sites`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBaseUrl}/auth/list`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let fetchedProjects = [];
      let fetchedSites = [];

      if (projRes.ok) {
        fetchedProjects = await projRes.json();
        setProjects(fetchedProjects);
      }

      if (siteRes.ok) {
        fetchedSites = await siteRes.json();
      }

      // Combine sites and ensure every project has at least one site representation
      const allSites = [...fetchedSites];
      fetchedProjects.forEach(p => {
        const hasSite = fetchedSites.some(s => s.projectId === p.id);
        if (!hasSite) {
          allSites.push({
            id: `auto-site-${p.id}`,
            projectId: p.id,
            name: `${p.name} - Main Site`,
            address: 'Primary Site',
            isAuto: true
          });
        }
      });

      setSites(allSites);
      if (allSites.length > 0) {
        setSelectedSiteId(allSites[0].id);
        setSiteId(allSites[0].id);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeam(data.filter(u => u.role !== 'client'));
      }
    } catch (err) {
      console.warn('API down or offline mode. Starting with clean tasks list.');
      setProjects([]);
      setSites([]);
      setTasks([]);
      setTeam([
        { id: "u-2", fullName: "Sarah Engineer", role: "engineer" },
        { id: "u-4", fullName: "Mark Contractor", role: "contractor" },
        { id: "u-5", fullName: "David Worker", role: "worker" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!selectedSiteId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/tasks?siteId=${selectedSiteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      // Offline fallback tasks matching selectedSiteId
      const allMockTasks = [
        { id: "t-1", siteId: "s-1", name: "Soil Excavation & Grading", description: "Grade the foundation area and clear soil.", assignedTo: "u-5", status: "done", priority: "high", deadline: "2026-08-10" },
        { id: "t-2", siteId: "s-1", name: "Concrete Pouring - Level 1", description: "Pour concrete slab for the main tower base.", assignedTo: "u-2", status: "in-progress", priority: "high", deadline: "2026-08-20" },
        { id: "t-3", siteId: "s-2", name: "Rebar Installation & Welding", description: "Assemble steel support framework.", assignedTo: "u-4", status: "todo", priority: "medium", deadline: "2026-08-30" },
        { id: "t-4", siteId: "s-3", name: "Site Clearance & Boundary Setup", description: "Erect safety barricades and deploy cabin.", assignedTo: "u-5", status: "todo", priority: "low", deadline: "2026-09-01" }
      ];
      setTasks(allMockTasks.filter(t => t.siteId === selectedSiteId));
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

    const payload = { siteId: targetSiteId, name, description, assignedTo, priority, deadline };

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
        const newTask = await res.json();
        if (targetSiteId === selectedSiteId || siteId === selectedSiteId) {
          setTasks([...tasks, newTask]);
        }
        resetForm();
      }
    } catch (err) {
      console.warn('Offline mode: creating mock task.');
      const newTask = {
        id: `t-${Date.now()}`,
        siteId: targetSiteId,
        name,
        description,
        assignedTo: assignedTo || 'u-5',
        status: 'todo',
        priority,
        deadline: deadline || new Date().toISOString().split('T')[0]
      };
      if (targetSiteId === selectedSiteId || siteId === selectedSiteId) {
        setTasks([...tasks, newTask]);
      }
      resetForm();
    }
  };

  const handleUpdateStatus = async (id, currentStatus) => {
    const statusFlow = { 'todo': 'in-progress', 'in-progress': 'in-review', 'in-review': 'done' };
    const nextStatus = statusFlow[currentStatus];
    if (!nextStatus) return;

    try {
      const res = await fetch(`${apiBaseUrl}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
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
