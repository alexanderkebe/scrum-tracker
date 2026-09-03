'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { formatDate, formatDurationLabel, meetingTypeInfo, sprintProgress, daysRemaining, getAvatarColor, getInitials, roleLabel, roleBadge } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [team, setTeam] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = () => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/meetings').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json())
    ]).then(([analytics, meetingsRes, usersRes, tasksRes]) => {
      setData(analytics);
      setMeetings(meetingsRes.meetings || []);
      setTeam(usersRes.users || []);
      
      const allTasks = tasksRes.tasks || [];
      if (user) {
        setUserTasks(allTasks.filter(t => t.assignee_id === user.id));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const updateTaskStatus = async (taskId, newStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadDashboardData();
  };

  if (loading || !data || !user) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--teal-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12 }}>⚡</div>
          <p className="text-muted">Loading agile command center...</p>
        </div>
      </div>
    );
  }

  const sprint = data.sprint;
  const progress = sprint ? sprintProgress(sprint) : 0;
  const days = sprint ? daysRemaining(sprint.end_date) : 0;
  const canManage = user.role === 'admin' || user.role === 'scrum_master';

  // Calculate team average attendance
  const avgAttendance = data.team.attendance?.length > 0
    ? Math.round(data.team.attendance.reduce((sum, a) => sum + (a.pct || 0), 0) / data.team.attendance.length)
    : 100;

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal)' }}>
              Systems Edge Solutions • Agile Command Center
            </span>
          </div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Welcome, <strong>{user.name}</strong> ({roleLabel(user.role)}) — Sprint operations are active
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {canManage && (
            <button className="btn btn-secondary" onClick={() => router.push('/board')}>
              📊 Sprint Board
            </button>
          )}
          {canManage && (
            <button className="btn btn-primary" onClick={() => router.push('/meetings/new?type=standup')}>
              ⚡ Start Stand-up
            </button>
          )}
        </div>
      </div>

      {/* Ceremony Alert Banner */}
      <div className={styles.ceremonyAlert}>
        <div className={styles.ceremonyAlertInfo}>
          <div className={styles.ceremonyAlertIcon}>⚡</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Daily Scrum Stand-up</span>
              <span className="badge badge-teal">Today @ {data.dailyStandupTime || '09:30 AM'}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Sync yesterday&apos;s progress, today&apos;s commitments, and active blockers with the team.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/meetings/new?type=standup')}>
            Launch Stand-up Session
          </button>
        </div>
      </div>

      {/* Sprint Hero Card */}
      {sprint && (
        <div className="card" style={{ marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--primary), var(--teal))' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>{sprint.name}</h3>
                <span className="badge badge-success">Active Sprint</span>
              </div>
              <p className="text-secondary" style={{ marginTop: 6, fontSize: 14 }}>
                <strong>Goal:</strong> {sprint.goal || 'Complete sprint deliverables and milestones'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--teal)', lineHeight: 1 }}>{days}</div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>Days Remaining</div>
              </div>
              <div style={{ width: 1, height: 42, background: 'var(--border-subtle)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                  {data.tasks.donePoints} <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>/ {data.tasks.totalPoints}</span>
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>Story Points Burnt</div>
              </div>
              <div style={{ width: 1, height: 42, background: 'var(--border-subtle)' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>
                  {data.tasks.total > 0 ? Math.round(((data.tasks.byStatus.done || 0) / data.tasks.total) * 100) : 0}%
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>Delivery Rate</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="text-sm text-muted">
                Timeline: {formatDate(sprint.start_date)} — {formatDate(sprint.end_date)}
              </span>
              <span className="text-sm font-semibold text-teal">{progress}% Time Elapsed</span>
            </div>
            <div className="progress-bar" style={{ height: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--teal-muted)', color: 'var(--teal)' }}>🎯</div>
          <div className="stat-card-value">{data.tasks.donePoints} / {data.tasks.totalPoints}</div>
          <div className="stat-card-label">Sprint Velocity (pts)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(30,27,75,0.08)', color: 'var(--primary)' }}>⚡</div>
          <div className="stat-card-value">{data.meetings.total}</div>
          <div className="stat-card-label">Ceremonies Recorded</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>👥</div>
          <div className="stat-card-value">{avgAttendance}%</div>
          <div className="stat-card-label">Avg Ceremony Attendance</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>🚫</div>
          <div className="stat-card-value">{data.blockers}</div>
          <div className="stat-card-label">Unresolved Blockers</div>
        </div>
      </div>

      {/* Content Columns */}
      <div className={styles.contentGrid}>
        {/* Left Column: My Tasks + Recent Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* My Assigned Tasks Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">My Sprint Tasks ({userTasks.length})</h4>
                <p className="card-subtitle">Your active work items in this sprint</p>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => router.push('/board')}>
                Open Board →
              </button>
            </div>

            {userTasks.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p className="text-sm">No tasks currently assigned to you.</p>
                <button className="btn btn-sm btn-secondary" style={{ marginTop: 10 }} onClick={() => router.push('/board')}>
                  Pick a task from backlog
                </button>
              </div>
            ) : (
              <div>
                {userTasks.map(t => (
                  <div key={t.id} className={styles.dashboardTaskRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--success)'
                      }}></span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                        <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>
                          {t.priority} Priority · {t.points} Story Points
                        </div>
                      </div>
                    </div>
                    <div>
                      <select
                        className="form-select"
                        style={{ height: 28, fontSize: 11, padding: '2px 20px 2px 8px', width: 'auto', background: 'var(--bg-input)' }}
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Ceremonies Stream */}
          <div className="card">
            <div className="card-header">
              <div>
                <h4 className="card-title">Ceremony Log</h4>
                <p className="card-subtitle">Recent Scrum ceremonies with detailed minutes</p>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => router.push('/meetings')}>
                All Meetings →
              </button>
            </div>

            {meetings.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-state-title">No ceremonies recorded yet</div>
              </div>
            ) : (
              <div>
                {meetings.slice(0, 4).map(m => {
                  const info = meetingTypeInfo(m.type);
                  return (
                    <div key={m.id} className={styles.meetingItem} onClick={() => router.push(`/meetings/${m.id}`)}>
                      <div className={styles.meetingIcon} style={{ background: 'var(--teal-muted)' }}>
                        {info.icon}
                      </div>
                      <div className={styles.meetingInfo}>
                        <div className={styles.meetingName}>{info.label}</div>
                        <div className={styles.meetingMeta}>
                          {formatDate(m.date)} · {m.attendees?.length || 0} attendees
                        </div>
                      </div>
                      <div className={styles.meetingTime}>
                        {formatDurationLabel(m.duration)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Blockers + Quick Launcher + Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Active Blockers Widget */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 className="card-title">Active Blockers</h4>
                <span className="badge badge-danger">{data.blockers}</span>
              </div>
              <span className="text-xs text-muted">Impediment backlog</span>
            </div>

            {data.recentBlockers && data.recentBlockers.length > 0 ? (
              <div>
                {data.recentBlockers.map((b, i) => (
                  <div key={i} className={styles.blockerItem}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(b.avatar_color || i), width: 24, height: 24, fontSize: 10 }}>
                      {getInitials(b.reported_by)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.blockerText}>&ldquo;{b.blocker}&rdquo;</div>
                      <div className={styles.blockerReporter}>
                        Reported by <strong>{b.reported_by}</strong> · {formatDate(b.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--success)' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>✨</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>No active blockers!</div>
                <div className="text-xs text-muted">All team members are moving forward.</div>
              </div>
            )}
          </div>

          {/* Quick Action Launcher */}
          {canManage && (
            <div className="card">
              <div className="card-header">
                <h4 className="card-title">Quick Actions</h4>
                <span className="text-xs text-muted">Ceremonies</span>
              </div>
              <div className={styles.quickActions}>
                <button className={styles.quickBtn} onClick={() => router.push('/meetings/new?type=standup')}>
                  ⚡ Daily Stand-up
                </button>
                <button className={styles.quickBtn} onClick={() => router.push('/meetings/new?type=planning')}>
                  📋 Sprint Planning
                </button>
                <button className={styles.quickBtn} onClick={() => router.push('/meetings/new?type=review')}>
                  🎯 Sprint Review
                </button>
                <button className={styles.quickBtn} onClick={() => router.push('/meetings/new?type=retro')}>
                  🔄 Retrospective
                </button>
              </div>
            </div>
          )}

          {/* Team Workload Glance */}
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Team Roster ({team.length})</h4>
              {user.role === 'admin' && (
                <button className="btn btn-sm btn-ghost" onClick={() => router.push('/team')}>
                  Manage
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {team.slice(0, 5).map((m, i) => (
                <div key={m.id} className={styles.teamItem}>
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.avatar_color ?? i) }}>
                    {getInitials(m.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-sm font-semibold truncate">{m.name}</div>
                    <div className="text-xs text-muted truncate">{m.email}</div>
                  </div>
                  <span className={`badge ${roleBadge(m.role)}`}>{roleLabel(m.role)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
