'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { AVATAR_COLORS, getAvatarColor, getInitials, roleLabel, roleBadge } from '@/lib/utils';
import styles from '../dashboard.module.css';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color ?? 0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const payload = { name, avatar_color: avatarColor };
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      await refreshUser();
      setCurrentPassword('');
      setNewPassword('');
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message, type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        <p className={styles.pageSubtitle}>Update your personal information, avatar, and password</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        {msg.text && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 20,
            borderRadius: 8,
            background: msg.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
            color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: 14,
            fontWeight: 600
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="card">
          {/* Avatar Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div className="avatar avatar-xl" style={{ background: getAvatarColor(avatarColor) }}>
              {getInitials(name || user.name)}
            </div>
            <div>
              <h3 style={{ fontSize: 18 }}>{user.name}</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span className="text-sm text-muted">{user.email}</span>
                <span className={`badge ${roleBadge(user.role)}`}>{roleLabel(user.role)}</span>
              </div>
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Avatar Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {AVATAR_COLORS.map((c, i) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAvatarColor(i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: avatarColor === i ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 100ms'
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '24px 0', paddingTop: 20 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Change Password (Optional)</h4>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
