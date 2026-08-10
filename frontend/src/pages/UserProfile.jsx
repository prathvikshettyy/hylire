import React from 'react';
import { User, Shield, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Describe role specific clearance permissions in Hylire
  const getRoleCapabilities = (role) => {
    switch (role) {
      case 'builder':
      case 'admin':
        return [
          'Full control over Projects, Budgets, and Construction Sites.',
          'Upload, download, and manage system legal contracts/drawings.',
          'Approve brick estimators and cost projections.',
          'Define project roles and assign engineers/contractors.'
        ];
      case 'engineer':
        return [
          'Manage tasks and worker allocations at assigned construction sites.',
          'Perform smart brick calculations and upload material requirement sheets.',
          'Share daily progress reports and photos in document vault.',
          'Collaborate with Builder and Client in real-time chat.'
        ];
      case 'contractor':
        return [
          'Assign construction tasks and workers to checklist panels.',
          'Monitor material inventory levels and order cement/sand/steel aggregates.',
          'Update task board stages from To Do to Complete.',
          'Share contractor agreements and bills in Document vault.'
        ];
      case 'worker':
        return [
          'View assigned daily construction task checklist.',
          'Mark tasks as In-Progress or In-Review upon physical completion.',
          'View active supervisor details and coordinates.'
        ];
      case 'client':
        return [
          'View real-time construction project timeline and completed tasks.',
          'Examine cost estimations, materials summary, and budget status reports.',
          'Download blueprints and finalized contracts.',
          'Message project supervisors directly.'
        ];
      default:
        return ['Standard platform reader access.'];
    }
  };

  return (
    <div className="main-view" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 className="header-title" style={{ fontSize: '2rem' }}>User Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure details and verify security clearances</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* User Card info */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800
          }}>
            {user.fullName[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{user.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 6 }}>{user.email}</p>
            <span className="badge badge-info" style={{ display: 'inline-flex', gap: 6, padding: '6px 12px' }}>
              <Shield size={12} />
              <span>Role: {user.role}</span>
            </span>
          </div>
        </div>

        {/* Permissions details */}
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
            <Lock size={18} /> System Clearances & Permissions
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Your account is assigned the <strong>{user.role}</strong> credential set. Below are your cleared activities within the Hylire portal:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {getRoleCapabilities(user.role).map((cap, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle size={16} style={{ color: 'var(--color-success)', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.45 }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
