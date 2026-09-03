'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import styles from '../dashboard.module.css';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ companyName: '', sprintDuration: '2', dailyStandupTime: '09:30' });
  const [sprint, setSprint] = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.settings) setSettings(d.settings);
    });

    fetch('/api/analytics').then(r => r.json()).then(d => {
      if (d.sprint) {
        setSprint({
          name: d.sprint.name,
          goal: d.sprint.goal || '',
          start_date: d.sprint.start_date.split('T')[0],
          end_date: d.sprint.end_date.split('T')[0]
        });
      }
    });
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setMsg('Settings updated successfully!');
    setTimeout(() => setMsg(''), 3000);
  };

  if (user?.role !== 'admin') {
    return <div className={styles.page}><p className="text-danger">Admin access required.</p></div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Workspace Settings</h1>
        <p className={styles.pageSubtitle}>Configure organization defaults and sprint ceremonies</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        {msg && (
          <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 8, background: 'var(--success-light)', color: 'var(--success)', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        <form onSubmit={saveSettings} className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title" style={{ marginBottom: 20 }}>Organization</h3>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={settings.companyName || ''}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              required
            />
          </div>

          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Sprint Duration (Weeks)</label>
              <select
                className="form-select"
                value={settings.sprintDuration || '2'}
                onChange={e => setSettings({ ...settings, sprintDuration: e.target.value })}
              >
                <option value="1">1 Week</option>
                <option value="2">2 Weeks</option>
                <option value="3">3 Weeks</option>
                <option value="4">4 Weeks</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Stand-up Time</label>
              <input
                type="time"
                className="form-input"
                value={settings.dailyStandupTime || '09:30'}
                onChange={e => setSettings({ ...settings, dailyStandupTime: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Workspace Settings
          </button>
        </form>
      </div>
    </div>
  );
}
