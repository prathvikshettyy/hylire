import React, { useEffect, useState } from 'react';
import { 
  Building, 
  MapPin, 
  CheckCircle, 
  IndianRupee, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { token, apiBaseUrl } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 2,
    activeSites: 3,
    totalTasks: 4,
    completedTasks: 1,
    totalBudget: 23500000,
    siteStats: [
      { siteId: "s-1", name: "Apex Site A - Foundation", status: "active", totalTasks: 2, completedTasks: 1, progressPercent: 50 },
      { siteId: "s-2", name: "Apex Site B - Structural Core", status: "active", totalTasks: 1, completedTasks: 0, progressPercent: 0 },
      { siteId: "s-3", name: "Riverview Block A", status: "active", totalTasks: 1, completedTasks: 0, progressPercent: 0 }
    ]
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/monitoring/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Unable to reach backend API for dashboard stats. Displaying cached dashboard state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const taskPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Construction Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time overview of sites, tasks, and budgets</p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary" style={{ display: 'flex', gap: 6 }}>
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Grid Stats */}
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary-color)', background: 'var(--primary-glow)' }}>
            <Building size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value">{stats.totalProjects}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-color)', background: 'var(--accent-glow)' }}>
            <MapPin size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value">{stats.activeSites}</span>
            <span className="stat-label">Active Sites</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value">{taskPercentage}%</span>
            <span className="stat-label">Tasks Done ({stats.completedTasks}/{stats.totalTasks})</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ color: 'var(--secondary-color)', background: 'rgba(236,72,153,0.1)' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value">₹{(stats.totalBudget / 10000000).toFixed(2)} Cr</span>
            <span className="stat-label">Total Budget Allocation</span>
          </div>
        </div>
      </div>

      {/* Main progress graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        {/* Site list status */}
        <div className="card">
          <h2 className="card-title"><MapPin size={18} /> Active Sites Progress</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
            {stats.siteStats.map((site) => (
              <div key={site.siteId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{site.name}</span>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{site.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Tasks: {site.completedTasks} / {site.totalTasks} completed</span>
                  <span>{site.progressPercent}%</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${site.progressPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))',
                    borderRadius: 3
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Announcements & Updates */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title"><AlertCircle size={18} /> Real-Time Project Updates</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, marginTop: 12 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent-color)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Sarah Engineer</span>
                <span>Just Now</span>
              </div>
              <p style={{ fontSize: '0.85rem' }}>Soil compaction testing at Apex Site A passed. Concrete base pour is cleared to start.</p>
            </div>

            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--primary-color)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>System Logger</span>
                <span>2 hours ago</span>
              </div>
              <p style={{ fontSize: '0.85rem' }}>Brick estimation for Riverview project generated: 55,000 units saved to project vault.</p>
            </div>

            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--color-success)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Mark Contractor</span>
                <span>Yesterday</span>
              </div>
              <p style={{ fontSize: '0.85rem' }}>Safety gates and boundaries are completely installed at Riverview residential site.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inject custom spin animation keyframes */}
      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
