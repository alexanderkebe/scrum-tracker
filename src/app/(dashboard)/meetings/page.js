'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { formatDate, formatDurationLabel, meetingTypeInfo } from '@/lib/utils';
import styles from '../dashboard.module.css';

export default function MeetingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/meetings').then(r => r.json()).then(d => setMeetings(d.meetings || []));
  }, []);

  const filtered = meetings.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (search) {
      const info = meetingTypeInfo(m.type);
      const q = search.toLowerCase();
      return info.label.toLowerCase().includes(q) || formatDate(m.date).toLowerCase().includes(q);
    }
    return true;
  });

  const canCreate = user?.role === 'admin' || user?.role === 'scrum_master' || user?.role === 'product_owner';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.pageTitle}>Meetings</h1>
          <p className={styles.pageSubtitle}>{filtered.length} meetings recorded</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => router.push('/meetings/new')}>+ New Meeting</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'standup', label: '⚡ Stand-ups' },
            { id: 'planning', label: '📋 Planning' },
            { id: 'review', label: '🎯 Reviews' },
            { id: 'retro', label: '🔄 Retros' }
          ].map(t => (
            <button key={t.id} className={`tab ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>{t.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', width: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input type="text" className="form-input" style={{ paddingLeft: 40 }} placeholder="Search meetings..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No meetings found</div>
          <div className="empty-state-desc">{filter !== 'all' || search ? 'Try adjusting your filters.' : 'Start your first Scrum meeting.'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => {
            const info = meetingTypeInfo(m.type);
            return (
              <div key={m.id} className={styles.meetingItem} onClick={() => router.push(`/meetings/${m.id}`)}>
                <div className={styles.meetingIcon} style={{ background: 'var(--teal-muted)' }}>{info.icon}</div>
                <div className={styles.meetingInfo}>
                  <div className={styles.meetingName}>{info.label}</div>
                  <div className={styles.meetingMeta}>{formatDate(m.date)} · {m.attendees?.length || 0} attendees</div>
                </div>
                <span className={`badge ${info.badge}`}>{info.label.split(' ')[0]}</span>
                <div className={styles.meetingTime}>{formatDurationLabel(m.duration)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
