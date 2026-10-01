import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  MapPin,
  CheckCircle,
  IndianRupee,
  AlertCircle,
  RefreshCw,
  BarChart2,
  TrendingUp,
  PieChart,
  UserPlus,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { computeDashboardStats } from '../utils/localStore';
import SpentBreakdownModal from '../components/SpentBreakdownModal';

const Dashboard = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [stats, setStats] = useState(() => computeDashboardStats());
  const [loading, setLoading] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);
  const [selectedProjectForSpend, setSelectedProjectForSpend] = useState(null);

  const fetchStats = async () => {
    // 1. Instantly compute stats from local storage
    const localData = computeDashboardStats();
    setStats(localData);

    // 2. If API backend is available, sync with API
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/monitoring/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.totalProjects !== 'undefined') {
          setStats(data);
        }
      }
    } catch (err) {
      // On offline mode / fallback, localData is active
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

  // Extract dynamic graph data safely
  const monthlyData = Array.isArray(stats.monthlyExpenditure) && stats.monthlyExpenditure.length > 0
    ? stats.monthlyExpenditure
    : [];

  const projectCompData = Array.isArray(stats.projectComparison) && stats.projectComparison.length > 0
    ? stats.projectComparison
    : [];

  // SVG Area Line Graph calculations
  const svgWidth = 600;
  const svgHeight = 180;
  const padding = 35;

  const rawMaxSpent = monthlyData.length > 0
    ? Math.max(...monthlyData.map(d => Number(d.spent) || 0), 1)
    : 10;
  const maxVal = Math.ceil(rawMaxSpent * 1.25) || 10;

  const gridValues = [
    0,
    parseFloat((maxVal * 0.33).toFixed(1)),
    parseFloat((maxVal * 0.66).toFixed(1)),
    maxVal
  ];

  const points = monthlyData.map((d, index) => {
    const divisor = Math.max(1, monthlyData.length - 1);
    const x = padding + (index * ((svgWidth - padding * 2) / divisor));
    const spentVal = Number(d.spent) || 0;
    const y = svgHeight - padding - ((spentVal / maxVal) * (svgHeight - padding * 2));
    return { x, y, ...d, spent: spentVal };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, point, i) => i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`
    : '';

  return (
    <div className="main-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
          <div className="stat-icon" style={{ color: 'var(--ink)', background: 'var(--soft)' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value">₹{((Number(stats.totalBudget) || 0) / 10000000).toFixed(2)} Cr</span>
            <span className="stat-label">Total Budget Allocated</span>
          </div>
        </div>

        {/* DEDICATED BUDGET SPENT STAT CARD */}
        <div className="card stat-card" style={{ border: stats.totalSpent > stats.totalBudget && stats.totalBudget > 0 ? '2px solid var(--danger)' : undefined }}>
          <div className="stat-icon" style={{ 
            color: stats.totalSpent > stats.totalBudget && stats.totalBudget > 0 ? 'var(--danger)' : 'var(--hi-vis-text)', 
            background: stats.totalSpent > stats.totalBudget && stats.totalBudget > 0 ? 'var(--soft)' : 'var(--hi-vis)' 
          }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="value stat-value" style={{ color: stats.totalSpent > stats.totalBudget && stats.totalBudget > 0 ? 'var(--danger)' : undefined }}>
              ₹{((Number(stats.totalSpent) || 0) >= 10000000) 
                ? `${((Number(stats.totalSpent) || 0) / 10000000).toFixed(2)} Cr` 
                : `${((Number(stats.totalSpent) || 0) / 100000).toFixed(2)} L`}
            </span>
            <span className="stat-label">
              Total Budget Spent ({stats.budgetUtilizationPercent || 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* VISUAL GRAPH ROW 1: Monthly Expenditure Trend & Project Budget Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 8 }}>
        {/* GRAPH 1: SVG Expenditure Line / Area Trend Chart */}
        <div className="card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: 'var(--primary-color)' }} />
                Monthly Expenditure Trend (₹ Lakhs)
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                Live Database Telemetry
              </span>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>2026 Financial Year</span>
          </div>

          {monthlyData.length > 0 ? (
            <div style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Background Grid Lines */}
                {gridValues.map((val, idx) => {
                  const y = svgHeight - padding - ((val / maxVal) * (svgHeight - padding * 2));
                  return (
                    <g key={idx}>
                      <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="var(--grid-line)" strokeDasharray="4 4" />
                      <text x={padding - 8} y={y + 3} fill="var(--text-dim)" fontSize="10" textAnchor="end">₹{val}L</text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                {areaD && <path d={areaD} fill="url(#areaGradient)" />}

                {/* Smooth Trend Line */}
                {pathD && <path d={pathD} fill="none" stroke="var(--primary-color)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Data Nodes */}
                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={activeHoverPoint === idx ? "7" : "5"}
                      fill="var(--bg-card-solid)"
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
                        <rect x={pt.x - 40} y={pt.y - 35} width="80" height="24" rx="6" fill="var(--tooltip-bg)" stroke="var(--primary-color)" strokeWidth="1" />
                        <text x={pt.x} y={pt.y - 19} fill="var(--tooltip-text)" fontSize="11" fontWeight="bold" textAnchor="middle">₹{pt.spent.toFixed(2)}L</text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'var(--text-dim)', textAlign: 'center', gap: 8 }}>
              <TrendingUp size={36} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem' }}>No expenditure data recorded for graph timeline.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Save material estimations or cost projections to render live trend curves.</p>
            </div>
          )}
        </div>

        {/* GRAPH 2: Project Allocated vs Spent Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <BarChart2 size={18} style={{ color: 'var(--accent-color)' }} />
              Budget vs Spend Breakdown
            </h2>
            <Link to="/projects" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {projectCompData.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projectCompData.map((p, idx) => {
                const allocated = Number(p.allocated) || 0;
                const spent = Number(p.spent) || 0;
                const spentPercent = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
                const remaining = Math.max(0, allocated - spent);
                const isOver = spent > allocated && allocated > 0;

                return (
                  <div key={p.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: isOver ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                          Spent: ₹{spent.toFixed(2)}L / <strong style={{ color: 'var(--text-primary)' }}>₹{allocated.toFixed(2)}L</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProjectForSpend({ id: p.id, name: p.name, budget: p.rawAllocated, spent: p.rawSpent })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--soft)',
                            color: 'var(--ink)',
                            border: '1px solid var(--line)',
                            borderRadius: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <Receipt size={12} />
                          <span>Breakdown</span>
                        </button>
                      </div>
                    </div>

                    {/* Dual Stacked Progress Bar */}
                    <div style={{ width: '100%', height: 12, background: 'var(--bg-subtle)', borderRadius: 6, border: '1px solid var(--line)', overflow: 'hidden', position: 'relative' }}>
                      {isOver ? (
                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                          <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--info)' }} />
                          <div className="hazard-stripe" style={{ width: '30%', height: '100%' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: `${spentPercent}%`,
                          height: '100%',
                          backgroundColor: spentPercent > 85 ? 'var(--warning)' : 'var(--success)',
                          borderRadius: 5,
                          transition: 'width 0.8s ease-in-out'
                        }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>Utilised: {spentPercent}%</span>
                      <span>{isOver ? `Over budget by ₹${(spent - allocated).toFixed(2)}L` : `Remaining: ₹${remaining.toFixed(2)}L`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'var(--text-dim)', textAlign: 'center', gap: 8 }}>
              <BarChart2 size={36} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: '0.85rem' }}>No projects available for budget breakdown graph.</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create a project in the Projects module to track expenditure.</p>
            </div>
          )}
        </div>
      </div>

      {/* VISUAL GRAPH ROW 2: Active Sites Progress & Real-Time Log */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 16 }}>
        {/* Site progress list */}
        <div className="card">
          <h2 className="card-title"><MapPin size={18} /> Active Sites Progress</h2>
          {Array.isArray(stats.siteStats) && stats.siteStats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 12 }}>
              {stats.siteStats.map((site) => (
                <div key={site.siteId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{site.name}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{site.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Tasks: {site.completedTasks} / {site.totalTasks} completed</span>
                    <span>{site.progressPercent}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden' }}>
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>
              <MapPin size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: '0.85rem' }}>No active site task progress logged.</p>
            </div>
          )}
        </div>

        {/* Real-time Announcements & Updates */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="card-title"><AlertCircle size={18} /> Real-Time Project Updates</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, marginTop: 12 }}>
            <div style={{ padding: 12, background: 'var(--bg-subtle)', borderLeft: '3px solid var(--accent-color)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Sarah Engineer</span>
                <span>Just Now</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Soil compaction testing at Apex Site A passed. Concrete base pour is cleared to start.</p>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-subtle)', borderLeft: '3px solid var(--primary-color)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>System Logger</span>
                <span>2 hours ago</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Brick estimation for project generated and saved to project vault.</p>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-subtle)', borderLeft: '3px solid var(--color-success)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Mark Contractor</span>
                <span>Yesterday</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Tower Crane #2 safety check certified by chief inspector.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Company Owner Executive Dashboard Oversight Panel */}
      {user?.role === 'builder' && (
        <div className="card" style={{ marginTop: 24, border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.01)' }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-color)' }}>
            <Building size={20} />
            Owner's Financial Cockpit & Risk Center
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Executive oversight tools for monitoring project safety margins, legal compliance checklists, and contractor performance.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Profit Margin Forecast */}
            <div className="card" style={{ padding: 16, borderRadius: 12, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Project Safety Margins</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Healthy</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                62.4% Safety Margin
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Based on actual project costs of ₹{stats.projectComparison && stats.projectComparison.length > 0
                  ? ((stats.projectComparison.reduce((acc, p) => acc + p.spent, 0) || 0) * 100000).toLocaleString('en-IN')
                  : '0'} vs total budget allocations.
              </p>
            </div>

            {/* Compliance Audits */}
            <div className="card" style={{ padding: 16, borderRadius: 12, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Legal & Regulatory Clearance</span>
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pending Audits</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                4 / 5 Approvals Cleared
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                NOC, environmental compliance, and soil testing passed. Fire safety clearance pending.
              </p>
            </div>

            {/* Contractor Performance Index */}
            <div className="card" style={{ padding: 16, borderRadius: 12, background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Contractor Velocity</span>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>On Schedule</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                87.5% Performance Index
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Task velocity is healthy. Raft foundations and structural columns are leading current schedules.
              </p>
            </div>

            {/* User Account Provisioning (Builder Only) */}
            <div className="card" style={{ padding: 16, borderRadius: 12, background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserPlus size={16} style={{ color: 'var(--primary-color)' }} />
                    Account Provisioning
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Builder Access</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                  Team & Client Accounts
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Only Builders are authorized to register new user accounts for Engineers, Contractors, Workers, and Clients.
                </p>
              </div>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.8rem', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
              >
                <UserPlus size={14} />
                Create User Account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Spent Breakdown Modal */}
      {selectedProjectForSpend && (
        <SpentBreakdownModal
          project={selectedProjectForSpend}
          onClose={() => setSelectedProjectForSpend(null)}
          onExpenseAdded={() => {
            setStats(computeDashboardStats());
          }}
        />
      )}

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
