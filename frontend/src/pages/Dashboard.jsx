import React, { useEffect, useState } from 'react';
import { 
  Building, 
  MapPin, 
  CheckCircle, 
  IndianRupee, 
  AlertCircle, 
  RefreshCw,
  BarChart2,
  TrendingUp,
  PieChart
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
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Expenditure Graph Data (Months Jan - Aug in Lakhs)
  const monthlyExpenditure = [
    { month: 'Jan', spent: 18, budget: 25 },
    { month: 'Feb', spent: 32, budget: 35 },
    { month: 'Mar', spent: 45, budget: 50 },
    { month: 'Apr', spent: 38, budget: 45 },
    { month: 'May', spent: 62, budget: 65 },
    { month: 'Jun', spent: 54, budget: 60 },
    { month: 'Jul', spent: 78, budget: 85 },
    { month: 'Aug', spent: 95, budget: 100 }
  ];

  // Project Budget vs Actual Expenditure comparison data
  const projectComparison = [
    { name: 'Apex Commercial Tower', allocated: 150, spent: 92, unit: 'Lakhs' },
    { name: 'Riverview Residential', allocated: 85, spent: 48, unit: 'Lakhs' },
    { name: 'Green Valley Estate', allocated: 120, spent: 35, unit: 'Lakhs' }
  ];

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
      console.warn('Unable to reach backend API for dashboard stats. Displaying cached state.');
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

  // SVG Area Line Graph calculations
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = 30;
  const maxVal = 110;
  const points = monthlyExpenditure.map((d, index) => {
    const x = padding + (index * ((svgWidth - padding * 2) / (monthlyExpenditure.length - 1)));
    const y = svgHeight - padding - ((d.spent / maxVal) * (svgHeight - padding * 2));
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, i) => 
    i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`, ''
  );

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title" style={{ fontSize: '2rem' }}>Construction Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time analytics, cost trends, and site operations</p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary" style={{ display: 'flex', gap: 6 }}>
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* Grid Key Metrics */}
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

      {/* VISUAL GRAPH ROW 1: Monthly Expenditure Trend & Project Budget Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 8 }}>
        {/* GRAPH 1: SVG Expenditure Line / Area Trend Chart */}
        <div className="card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--primary-color)' }} /> 
                Monthly Expenditure Trend (₹ Lakhs)
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                ↑ +18.4% allocation velocity vs Q1 baseline
              </span>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>2026 Financial Year</span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background Grid Lines */}
              {[0, 30, 60, 90].map((val, idx) => {
                const y = svgHeight - padding - ((val / maxVal) * (svgHeight - padding * 2));
                return (
                  <g key={idx}>
                    <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <text x={padding - 8} y={y + 3} fill="var(--text-dim)" fontSize="10" textAnchor="end">₹{val}L</text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={areaD} fill="url(#areaGradient)" />

              {/* Smooth Trend Line */}
              <path d={pathD} fill="none" stroke="var(--primary-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {/* Data Nodes */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={activeHoverPoint === idx ? "7" : "5"} 
                    fill="var(--bg-card)" 
                    stroke="var(--primary-color)" 
                    strokeWidth="3"
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={() => setActiveHoverPoint(idx)}
                    onMouseLeave={() => setActiveHoverPoint(null)}
                  />
                  <text x={pt.x} y={svgHeight - 8} fill="var(--text-muted)" fontSize="11" textAnchor="middle">{pt.month}</text>

                  {/* Tooltip on Hover */}
                  {activeHoverPoint === idx && (
                    <g>
                      <rect x={pt.x - 35} y={pt.y - 35} width="70" height="24" rx="6" fill="#1e1b4b" stroke="var(--primary-color)" strokeWidth="1" />
                      <text x={pt.x} y={pt.y - 19} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">₹{pt.spent}L</text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* GRAPH 2: Project Allocated vs Spent Bar Chart */}
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} style={{ color: 'var(--accent-color)' }} />
            Budget vs Spend Breakdown
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projectComparison.map((p, idx) => {
              const spentPercent = Math.min(100, Math.round((p.spent / p.allocated) * 100));
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                      ₹{p.spent}L / <strong style={{ color: 'var(--text-primary)' }}>₹{p.allocated}L</strong>
                    </span>
                  </div>

                  {/* Dual Stacked Progress Bar */}
                  <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${spentPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-color), var(--secondary-color))',
                      borderRadius: 5,
                      transition: 'width 0.8s ease-in-out'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    <span>Utilized: {spentPercent}%</span>
                    <span>Remaining: ₹{p.allocated - p.spent}L</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VISUAL GRAPH ROW 2: Active Sites Progress & Real-Time Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
        {/* Site progress list */}
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
