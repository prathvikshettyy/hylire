import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  IndianRupee, 
  Plus, 
  Trash, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PieChart, 
  DollarSign, 
  Receipt, 
  X,
  TrendingUp,
  Layers,
  HardHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localProjects, getLocalStore } from '../utils/localStore';
import SpentBreakdownModal from '../components/SpentBreakdownModal';

const Projects = () => {
  const { user, token, apiBaseUrl } = useAuth();
  const [projects, setProjects] = useState(() => localProjects.list());
  const [loading, setLoading] = useState(false);
  
  // Form states for New Project
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [usersList, setUsersList] = useState(() => getLocalStore().users.filter(u => u.role === 'client'));

  // Spent Breakdown Modal State
  const [selectedProjectForSpend, setSelectedProjectForSpend] = useState(null);

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
        if (Array.isArray(data)) {
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
      // Offline mode
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;

    const payload = { name, description, budget, startDate, endDate, clientId };

    const newProj = localProjects.create(payload);
    setProjects(localProjects.list());
    resetForm();

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
      // Offline mode
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All sub-sites will be affected.')) return;
    
    localProjects.delete(id);
    setProjects(localProjects.list());

    try {
      await fetch(`${apiBaseUrl}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      // Offline mode
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

  const isAuthorized = user && (user.role === 'builder' || user.role === 'admin');

  return (
    <div className="main-view">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            margin: '0 0 6px 0'
          }}>
            Projects Portfolio
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: 0 }}>
            Capital allocation, budget spent tracking, and timelines
          </p>
        </div>

        {isAuthorized && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn btn-primary"
            style={{
              minHeight: 48,
              padding: '0 20px',
              fontSize: 16,
              fontWeight: 700,
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center'
            }}
          >
            <Plus size={20} />
            <span>{showAddForm ? 'View Projects' : 'New Project'}</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        <div style={{
          backgroundColor: 'var(--panel)',
          border: '2px solid var(--line)',
          borderRadius: 6,
          maxWidth: 640,
          margin: '0 auto',
          width: '100%',
          padding: 24
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '0 0 20px 0'
          }}>
            <Briefcase size={22} /> Initialize New Project
          </h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Project Name
              </label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Apex Commercial Tower" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{
                  width: '100%',
                  height: 48,
                  fontSize: 16,
                  padding: '0 14px',
                  backgroundColor: 'var(--panel)',
                  color: 'var(--ink)',
                  border: '2px solid var(--line)',
                  borderRadius: 6
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Description
              </label>
              <textarea 
                rows="3" 
                placeholder="Details about building type, zoning regulations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '12px 14px',
                  backgroundColor: 'var(--panel)',
                  color: 'var(--ink)',
                  border: '2px solid var(--line)',
                  borderRadius: 6,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                  Total Allocated Budget (₹)
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 15000000" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)} 
                  style={{
                    width: '100%',
                    height: 48,
                    fontSize: 16,
                    padding: '0 14px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '2px solid var(--line)',
                    borderRadius: 6
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                  Associated Client
                </label>
                <select 
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    fontSize: 16,
                    padding: '0 14px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '2px solid var(--line)',
                    borderRadius: 6
                  }}
                >
                  <option value="">Select client</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                  Start Date
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{
                    width: '100%',
                    height: 48,
                    fontSize: 16,
                    padding: '0 14px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '2px solid var(--line)',
                    borderRadius: 6
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                  Target End Date
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{
                    width: '100%',
                    height: 48,
                    fontSize: 16,
                    padding: '0 14px',
                    backgroundColor: 'var(--panel)',
                    color: 'var(--ink)',
                    border: '2px solid var(--line)',
                    borderRadius: 6
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{
                  flex: 1,
                  minHeight: 48,
                  fontSize: 16,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Create Project
              </button>
              <button 
                type="button" 
                onClick={resetForm} 
                className="btn btn-secondary"
                style={{
                  minHeight: 48,
                  padding: '0 24px',
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {projects.map((project) => {
            const isCompleted = project.status === 'completed';
            const isPlanning = project.status === 'planning';
            const statusColor = isCompleted ? 'var(--success)' : isPlanning ? 'var(--warning)' : 'var(--info)';
            const StatusIcon = isCompleted ? CheckCircle2 : isPlanning ? Clock : AlertTriangle;

            // Compute dynamic budget spent details for this project
            const details = localProjects.getSpentDetails(project.id);
            const isOverBudget = details.spent > details.allocated && details.allocated > 0;
            const progressPercent = details.percent;

            return (
              <div 
                key={project.id} 
                style={{
                  backgroundColor: 'var(--panel)',
                  border: '2px solid var(--line)',
                  borderRadius: 6,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--ink)',
                      margin: 0
                    }}>
                      {project.name}
                    </h3>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: `2px solid ${statusColor}`,
                      color: statusColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <StatusIcon size={14} />
                      {project.status || 'active'}
                    </span>
                  </div>

                  {project.description && (
                    <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.45, marginBottom: 16 }}>
                      {project.description}
                    </p>
                  )}
                  
                  {/* DEDICATED BUDGET SPENT SECTION */}
                  <div style={{
                    backgroundColor: 'var(--soft)',
                    border: '2px solid var(--line)',
                    borderRadius: 6,
                    padding: 14,
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--ink)'
                      }}>
                        Budget & Expenditure
                      </span>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: `2px solid ${isOverBudget ? 'var(--danger)' : 'var(--line)'}`,
                        color: isOverBudget ? 'var(--danger)' : 'var(--ink)',
                        backgroundColor: 'var(--panel)'
                      }}>
                        {isOverBudget ? `Over by ₹${(details.spent - details.allocated).toLocaleString('en-IN')}` : `${progressPercent}% utilised`}
                      </span>
                    </div>

                    {/* Progress Bar with Overspend Hazard Stripe */}
                    <div style={{
                      width: '100%',
                      height: 12,
                      backgroundColor: 'var(--panel)',
                      borderRadius: 6,
                      border: '2px solid var(--line)',
                      overflow: 'hidden',
                      position: 'relative',
                      marginBottom: 10
                    }}>
                      {isOverBudget ? (
                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                          <div style={{ width: '70%', height: '100%', backgroundColor: 'var(--info)' }} />
                          <div className="hazard-stripe" style={{ width: '30%', height: '100%' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: `${Math.min(100, progressPercent)}%`,
                          height: '100%',
                          backgroundColor: progressPercent > 85 ? 'var(--warning)' : 'var(--success)',
                          transition: 'width 0.4s ease'
                        }} />
                      )}
                    </div>

                    {/* 3 Metric Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                      <div style={{ backgroundColor: 'var(--panel)', padding: '6px 4px', borderRadius: 4, border: '1px solid var(--line)' }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', fontWeight: 600 }}>Allocated</span>
                        <strong style={{ fontSize: 14, color: 'var(--ink)' }}>₹{(details.allocated / 100000).toFixed(1)}L</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--panel)', padding: '6px 4px', borderRadius: 4, border: `1px solid ${isOverBudget ? 'var(--danger)' : 'var(--line)'}` }}>
                        <span style={{ fontSize: 12, color: isOverBudget ? 'var(--danger)' : 'var(--muted)', display: 'block', fontWeight: 600 }}>Spent</span>
                        <strong style={{ fontSize: 14, color: isOverBudget ? 'var(--danger)' : 'var(--ink)' }}>₹{(details.spent / 100000).toFixed(1)}L</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--panel)', padding: '6px 4px', borderRadius: 4, border: '1px solid var(--line)' }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', fontWeight: 600 }}>Remaining</span>
                        <strong style={{ fontSize: 14, color: 'var(--ink)' }}>₹{(details.remaining / 100000).toFixed(1)}L</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={15} style={{ color: 'var(--ink)', flexShrink: 0 }} />
                      <span>Timeline: {project.startDate || 'N/A'} to {project.endDate || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px solid var(--line)',
                  paddingTop: 14,
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  <button 
                    type="button"
                    onClick={() => setSelectedProjectForSpend(project)}
                    className="btn btn-secondary"
                    style={{
                      minHeight: 48,
                      padding: '0 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Receipt size={16} />
                    <span>View spent breakdown</span>
                  </button>

                  {isAuthorized && (
                    <button 
                      onClick={() => handleDelete(project.id)} 
                      style={{
                        minHeight: 48,
                        padding: '0 16px',
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'var(--soft)',
                        color: 'var(--danger)',
                        border: '2px solid var(--danger)',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash size={16} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED BUDGET SPENT & EXPENSE RECORDING MODAL */}
      {selectedProjectForSpend && (
        <SpentBreakdownModal 
          project={selectedProjectForSpend}
          onClose={() => setSelectedProjectForSpend(null)}
          onExpenseAdded={() => setProjects(localProjects.list())}
        />
      )}
    </div>
  );
};

export default Projects;
