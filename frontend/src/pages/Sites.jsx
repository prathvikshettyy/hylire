import React, { useState, useEffect } from 'react';
import { MapPin, HardHat, Plus, Clipboard, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localSites, localProjects, getLocalStore } from '../utils/localStore';

const Sites = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [sites, setSites] = useState(() => localSites.list());
  const [projects, setProjects] = useState(() => localProjects.list());
  const [engineers, setEngineers] = useState(() => getLocalStore().users.filter(u => u.role === 'engineer' || u.role === 'contractor'));
  const [loading, setLoading] = useState(false);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [engineerId, setEngineerId] = useState('');

  const fetchData = async () => {
    // 1. Instantly load local data
    setSites(localSites.list());
    setProjects(localProjects.list());

    // 2. Sync with API if active
    try {
      const projRes = await fetch(`${apiBaseUrl}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projRes.ok) {
        const data = await projRes.json();
        if (Array.isArray(data)) setProjects(data);
      }

      const siteRes = await fetch(`${apiBaseUrl}/sites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (siteRes.ok) {
        const data = await siteRes.json();
        if (Array.isArray(data)) setSites(data);
      }

      const userRes = await fetch(`${apiBaseUrl}/auth/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setEngineers(data.filter(u => u.role === 'engineer' || u.role === 'contractor'));
      }
    } catch (err) {
      // Offline / Vercel mode: local data already active
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projectId || !name) return;

    const payload = { projectId, name, address, engineerId };

    // 1. Save directly to local store
    localSites.create(payload);
    setSites(localSites.list());
    resetForm();

    // 2. Sync to API if active
    try {
      await fetch(`${apiBaseUrl}/sites`, {
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

  const handleStatusChange = async (id, newStatus) => {
    // 1. Update local store
    localSites.updateStatus(id, newStatus);
    setSites(localSites.list());

    // 2. Sync with API
    try {
      await fetch(`${apiBaseUrl}/sites/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      // Offline mode
    }
  };

  const resetForm = () => {
    setProjectId('');
    setName('');
    setAddress('');
    setEngineerId('');
    setShowAddForm(false);
  };

  const getProjectName = (pId) => {
    const proj = projects.find(p => p.id === pId);
    return proj ? proj.name : 'Unknown Project';
  };

  const getEngineerName = (eId) => {
    const eng = engineers.find(e => e.id === eId);
    return eng ? eng.fullName : 'Unassigned';
  };

  const isAuthorized = user && (user.role === 'builder' || user.role === 'admin');

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Construction Sites</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor safety, workforce and operational status per site</p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary"
            style={{ display: 'flex', gap: 6 }}
          >
            <Plus size={16} />
            <span>{showAddForm ? 'View Sites' : 'Add Site'}</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
          <h2 className="card-title"><HardHat size={18} /> Add Construction Site</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Associated Project</label>
              <select
                className="form-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Site Identifier/Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Block A Foundation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Site Address / Coordinates</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Plot 12, Industrial zone"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Site Supervisor/Engineer</label>
              <select
                className="form-select"
                value={engineerId}
                onChange={(e) => setEngineerId(e.target.value)}
              >
                <option value="">Select Engineer</option>
                {engineers.map(e => (
                  <option key={e.id} value={e.id}>{e.fullName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Deploy Site</button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {sites.map((site) => (
            <div key={site.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-color)', fontWeight: 700 }}>
                    {getProjectName(site.projectId)}
                  </span>
                  <span className={`badge ${site.status === 'completed' ? 'badge-success' : site.status === 'paused' ? 'badge-warning' : 'badge-info'}`}>
                    {site.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 8 }}>{site.name}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} style={{ color: 'var(--accent-color)' }} />
                    <span>{site.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserCheck size={14} style={{ color: 'var(--secondary-color)' }} />
                    <span>Supervisor: <strong>{getEngineerName(site.engineerId)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status toggles for Builders/Admins */}
              {isAuthorized && (
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 14, justifyContent: 'flex-end' }}>
                  {site.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange(site.id, 'active')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                    >
                      Activate
                    </button>
                  )}
                  {site.status !== 'paused' && site.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(site.id, 'paused')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                    >
                      Pause
                    </button>
                  )}
                  {site.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(site.id, 'completed')}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sites;
