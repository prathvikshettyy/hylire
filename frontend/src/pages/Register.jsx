import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Key,
  Mail,
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalStore } from '../utils/localStore';

const Register = () => {
  const { user, register, apiBaseUrl } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('engineer');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastCreated, setLastCreated] = useState(null);
  const [loading, setLoading] = useState(false);

  // Users Directory State
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const isBuilder = user && (user.role === 'builder' || user.role === 'admin');

  // Load existing users from backend API or localStore
  const loadUsers = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/auth/list`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
        return;
      }
    } catch (e) {
      console.warn('Backend /auth/list not available, using local store users:', e);
    }
    const store = getLocalStore();
    setUsersList(store.users || []);
  };

  useEffect(() => {
    loadUsers();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !fullName || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const result = await register(email, password, fullName, role);
    setLoading(false);

    if (result.success) {
      const createdInfo = {
        fullName,
        email,
        role,
        password
      };
      setLastCreated(createdInfo);
      setSuccess(`Account for "${fullName}" (${role.toUpperCase()}) was created successfully!`);

      // Reset form fields
      setEmail('');
      setFullName('');
      setPassword('password123');
      setRole('engineer');

      // Refresh users directory
      loadUsers();
    } else {
      setError(result.error || 'Failed to create user account.');
    }
  };

  // If user is not builder or admin, block access
  if (!isBuilder) {
    return (
      <div className="main-view" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: 40, border: '1px solid var(--color-error)' }}>
          <ShieldAlert size={56} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.6rem', marginBottom: 12, color: 'var(--text-primary)' }}>
            Access Restricted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
            Only users with the <strong>Builder</strong> or <strong>Admin</strong> role are authorized to create and provision new user accounts in Hylire.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ padding: '10px 24px' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Filtered users for the directory
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case 'builder':
      case 'admin':
        return 'badge-info';
      case 'engineer':
        return 'badge-success';
      case 'contractor':
        return 'badge-warning';
      case 'worker':
        return 'badge-secondary';
      case 'client':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="main-view" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="header-title" style={{ margin: 0, fontSize: '1.9rem' }}>
              User Account Provisioning
            </h1>
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} /> Builder Authorized
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Create and provision secure platform credentials for Engineers, Contractors, Workers, and Clients.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* Left Column: Account Creation Form */}
        <div className="card" style={{ padding: 28 }}>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary-color)', marginBottom: 18 }}>
            <UserPlus size={20} />
            Create New Account
          </h2>

          {error && (
            <div style={{
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && lastCreated && (
            <div style={{
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              padding: '14px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 6, marginTop: 8 }}>
                <div><strong>Email:</strong> {lastCreated.email}</div>
                <div><strong>Role:</strong> {lastCreated.role}</div>
                <div><strong>Default Password:</strong> <code>{lastCreated.password}</code></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserIcon size={14} /> Full Name
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Michael Scott"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. michael@hylire.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">System Role Assignment</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="engineer">Engineer (Site Management & Tasks)</option>
                <option value="contractor">Contractor (Checklists & Materials)</option>
                <option value="worker">Worker (Task Execution & Progress)</option>
                <option value="client">Client (Projects & Financial Visibility)</option>
                <option value="builder">Builder (Full Executive Administration)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={14} /> Initial Password
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setPassword('Pass@' + Math.floor(1000 + Math.random() * 9000))}
                  className="btn-secondary"
                  style={{ padding: '0 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  title="Generate random password"
                >
                  Generate
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                User can change their password upon logging in.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              disabled={loading}
            >
              <UserPlus size={16} />
              {loading ? 'Creating Account...' : 'Provision User Account'}
            </button>
          </form>
        </div>

        {/* Right Column: Existing System Users Directory */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.2rem' }}>
              <Users size={18} />
              Active System Users ({filteredUsers.length})
            </h2>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: '0.8rem', height: 36 }}
              />
            </div>

            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.8rem', height: 36 }}
            >
              <option value="all">All Roles</option>
              <option value="builder">Builder</option>
              <option value="engineer">Engineer</option>
              <option value="contractor">Contractor</option>
              <option value="worker">Worker</option>
              <option value="client">Client</option>
            </select>
          </div>

          {/* Users List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No accounts match the current filter.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const initials = (u.fullName || u.email || 'U')
                  .split(' ')
                  .map(p => p[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                return (
                  <div
                    key={u.id || u.email}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 10,
                      border: '1px solid var(--border-color)',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {u.fullName || 'User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {u.email}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`badge ${getRoleBadgeClass(u.role)}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                        {u.role}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
