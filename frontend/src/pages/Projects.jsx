import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, IndianRupee, Plus, Trash, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localProjects, getLocalStore } from '../utils/localStore';

const Projects = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [projects, setProjects] = useState(() => localProjects.list());
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [usersList, setUsersList] = useState(() => getLocalStore().users.filter(u => u.role === 'client'));

  // Fetch projects and users
  const fetchData = async () => {
    // 1. Instantly load from local storage
    const current = localProjects.list();
    setProjects(current);

    // 2. Sync with API if reachable
    try {
      const projRes = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projRes.ok) {
        const data = await projRes.json();
        if (data && data.length > 0) {
          setProjects(data);
        }
      }

      const userRes = await fetch(`${apiBaseUrl}/auth/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setUsersList(data.filter(u => u.role === 'client'));
      }
    } catch (err) {
      // Offline / Vercel mode: localProjects are already loaded
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;

    const payload = { name, description, budget, startDate, endDate, clientId };

    // 1. Save directly into persistent local store (persists across Vercel & restarts)
    const newProj = localProjects.create(payload);
    setProjects(localProjects.list());
    resetForm();

    // 2. Sync to backend API if active
    try {
      await fetch(`${apiBaseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Background sync silently ignored in offline / static deployment
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All sub-sites will be affected.')) return;
    
    // 1. Delete locally from persistent store
    localProjects.delete(id);
    setProjects(localProjects.list());

    // 2. Sync delete with API
    try {
      await fetch(`${apiBaseUrl}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Handled offline
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setBudget('');
    setStartDate('');
    setEndDate('');
    setClientId('');
    setShowAddForm(false);
  };

  // Determine authorization: Admin/Builder roles can modify projects
  const isAuthorized = user && (user.role === 'builder' || user.role === 'admin');

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Projects Portfolio</h1>
          <p style={{ color: 'var(--text-muted)' }}>Overview of construction projects and financials</p>
        </div>
        {isAuthorized && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
            style={{ display: 'flex', gap: 6 }}
          >
            <Plus size={16} />
            <span>{showAddForm ? 'View Projects' : 'New Project'}</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="card" style={{ maxWidth: 650, margin: '0 auto', width: '100%' }}>
          <h2 className="card-title"><Briefcase size={18} /> Initialize New Project</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Apex Commercial Tower" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea" 
                rows="3" 
                placeholder="Details about building type, zoning regulations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Total Allocated Budget (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 15000000" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Associated Client</label>
                <select 
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">Select Client</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target End Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Project</button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {projects.map((project) => (
            <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{project.name}</h3>
                  <span className={`badge ${project.status === 'completed' ? 'badge-success' : project.status === 'planning' ? 'badge-warning' : 'badge-info'}`}>
                    {project.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.45, marginBottom: 16 }}>
                  {project.description}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IndianRupee size={14} style={{ color: 'var(--secondary-color)' }} />
                    <span>Allocated Budget: <strong>₹{(project.budget || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} style={{ color: 'var(--primary-color)' }} />
                    <span>Timeline: {project.startDate || 'N/A'} to {project.endDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                {isAuthorized && (
                  <button 
                    onClick={() => handleDelete(project.id)} 
                    className="btn btn-danger" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: 4 }}
                  >
                    <Trash size={12} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
