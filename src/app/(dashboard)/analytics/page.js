'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAvatarColor, getInitials, formatDurationLabel } from '@/lib/utils';
import styles from '../dashboard.module.css';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const exportReport = () => {
    if (!data || !data.sprint) return;
    const { sprint, tasks, meetings, blockers, team } = data;
    let content = `SYSTEMS EDGE SOLUTIONS - SPRINT ANALYTICS REPORT\n`;
    content += `=================================================\n`;
    content += `Sprint: ${sprint.name}\n`;
    content += `Goal: ${sprint.goal || 'N/A'}\n`;
    content += `Start Date: ${sprint.start_date}\n`;
    content += `End Date: ${sprint.end_date}\n\n`;
    content += `METRICS\n`;
    content += `-------------------------------------------------\n`;
    content += `Total Tasks: ${tasks.total}\n`;
    content += `Points Completed: ${tasks.donePoints} / ${tasks.totalPoints}\n`;
    content += `Total Meetings: ${meetings.total}\n`;
    content += `Active Blockers: ${blockers}\n\n`;
    content += `TEAM ATTENDANCE\n`;
    content += `-------------------------------------------------\n`;
    team.attendance.forEach(a => {
      content += `${a.name}: ${a.attended}/${a.total} meetings (${a.pct}%)\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sprint-report-${sprint.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className={styles.page}><p className="text-muted">Loading analytics...</p></div>;
  if (!data || !data.sprint) {
    return (
      <div className={styles.page}>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No Active Sprint</div>
          <div className="empty-state-desc">Create or activate a sprint to view manager analytics.</div>
        </div>
      </div>
    );
  }

  const { sprint, tasks, meetings, blockers, team } = data;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.pageTitle}>Manager Analytics</h1>
          <p className={styles.pageSubtitle}>Sprint performance and team insights for {sprint.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={exportReport}>
          📥 Export Text Report
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--teal-muted)', color: 'var(--teal)' }}>🎯</div>
          <div className="stat-card-value">{tasks.donePoints} / {tasks.totalPoints}</div>
          <div className="stat-card-label">Points Velocity</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>✅</div>
          <div className="stat-card-value">{tasks.byStatus.done || 0}</div>
          <div className="stat-card-label">Tasks Finished</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(30,27,75,0.08)', color: 'var(--primary)' }}>⚡</div>
          <div className="stat-card-value">{meetings.total}</div>
          <div className="stat-card-label">Ceremonies Held</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>🚫</div>
          <div className="stat-card-value">{blockers}</div>
          <div className="stat-card-label">Blockers Recorded</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Task Status Distribution */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Task Status Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'To Do', count: tasks.byStatus.todo || 0, color: '#94A3B8' },
              { label: 'In Progress', count: tasks.byStatus.progress || 0, color: '#2563EB' },
              { label: 'In Review', count: tasks.byStatus.review || 0, color: '#D97706' },
              { label: 'Done', count: tasks.byStatus.done || 0, color: '#059669' }
            ].map(s => {
              const pct = tasks.total > 0 ? Math.round((s.count / tasks.total) * 100) : 0;
              return (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{s.label} ({s.count})</span>
                    <span className="text-muted">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 999 }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meeting Distribution */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Ceremonies by Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Stand-ups', count: meetings.byType.standup || 0, icon: '⚡' },
              { label: 'Planning', count: meetings.byType.planning || 0, icon: '📋' },
              { label: 'Reviews', count: meetings.byType.review || 0, icon: '🎯' },
              { label: 'Retros', count: meetings.byType.retro || 0, icon: '🔄' },
            ].map(m => (
              <div key={m.label} style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{m.count}</div>
                <div className="text-xs text-muted">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Attendance Heatmap/Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>Team Ceremony Attendance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {team.attendance.map((member, i) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="avatar avatar-sm" style={{ background: getAvatarColor(member.avatar_color ?? i) }}>
                {getInitials(member.name)}
              </div>
              <div style={{ width: 140, fontWeight: 600, fontSize: 14 }}>{member.name}</div>
              <div style={{ flex: 1 }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${member.pct}%` }}></div>
                </div>
              </div>
              <div style={{ width: 90, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                {member.attended} / {member.total} ({member.pct}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
