'use client';
import AppLoader from '@/components/AppLoader';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAvatarColor, getInitials, roleLabel, roleBadge } from '@/lib/utils';
import styles from '../dashboard.module.css';

export default function TeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [role, setRole] = useState('member');

  const loadTeam = () => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        setTeam(d.users || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole })
    });
    setEditingUser(null);
    loadTeam();
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    loadTeam();
  };

  if (loading) return <AppLoader label="Loading team…" />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Team Roster</h1>
        <p className={styles.pageSubtitle}>Manage your team members and roles at Systems Edge Solutions</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {team.map((m, i) => (
          <div key={m.id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
            <div className="avatar avatar-xl" style={{ background: getAvatarColor(m.avatar_color ?? i), margin: '0 auto 16px' }}>
              {getInitials(m.name)}
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>{m.name}</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>{m.email}</p>
            
            <div style={{ marginBottom: 16 }}>
              <span className={`badge ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span>
            </div>

            {user?.role === 'admin' && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <select
                  className="form-select"
                  style={{ height: 32, fontSize: 12, padding: '2px 24px 2px 8px', width: 'auto' }}
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                >
                  <option value="member">Team Member</option>
                  <option value="scrum_master">Scrum Master</option>
                  <option value="product_owner">Product Owner</option>
                  <option value="admin">Admin / Manager</option>
                </select>
                {user.id !== m.id && (
                  <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(m.id)} title="Remove user">
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
