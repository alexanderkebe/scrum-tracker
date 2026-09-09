'use client';
import AppLoader from '@/components/AppLoader';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate, formatDurationLabel, meetingTypeInfo, getAvatarColor, getInitials } from '@/lib/utils';
import styles from '../../dashboard.module.css';

export default function MeetingDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    fetch(`/api/meetings/${id}`).then(r => r.json()).then(d => setMeeting(d.meeting));
  }, [id]);

  if (!meeting) return <AppLoader label="Loading meeting…" />;

  const info = meetingTypeInfo(meeting.type);

  // Group notes by field
  const notesByField = {};
  const notesByUser = {};
  (meeting.notes || []).forEach(n => {
    if (n.user_id) {
      if (!notesByUser[n.user_id]) notesByUser[n.user_id] = { name: n.user_name, notes: {} };
      notesByUser[n.user_id].notes[n.field_name] = n.content;
    } else {
      notesByField[n.field_name] = n.content;
    }
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className="btn btn-ghost" onClick={() => router.push('/meetings')} style={{ marginBottom: 12 }}>← Back to Meetings</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 32 }}>{info.icon}</span>
          <div>
            <h1 className={styles.pageTitle}>{info.label}</h1>
            <p className={styles.pageSubtitle}>{formatDate(meeting.date, { weekday: 'long' })} · {formatDurationLabel(meeting.duration)}</p>
          </div>
        </div>
      </div>

      {/* Attendees */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h4 className="card-title" style={{ marginBottom: 16 }}>Attendees ({meeting.attendees?.length || 0})</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(meeting.attendees || []).map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg-input)', borderRadius: 999, border: '1px solid var(--border-subtle)' }}>
              <div className="avatar avatar-sm" style={{ background: getAvatarColor(a.avatar_color || 0) }}>{getInitials(a.name)}</div>
              <span className="text-sm">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h4 className="card-title" style={{ marginBottom: 16 }}>Meeting Notes</h4>

        {meeting.type === 'standup' && Object.keys(notesByUser).length > 0 && (
          Object.entries(notesByUser).map(([uid, userData]) => (
            <div key={uid} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>{userData.name}</strong>
              {userData.notes.yesterday && <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}><strong>Yesterday:</strong> {userData.notes.yesterday}</div>}
              {userData.notes.today && <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8, marginBottom: 6, fontSize: 14, color: 'var(--text-secondary)' }}><strong>Today:</strong> {userData.notes.today}</div>}
              {userData.notes.blockers && <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 8, borderLeft: '3px solid var(--danger)', fontSize: 14, color: 'var(--text-secondary)' }}><strong>🚫 Blocker:</strong> {userData.notes.blockers}</div>}
            </div>
          ))
        )}

        {meeting.type === 'planning' && (
          <>
            {notesByField.sprintGoal && <div style={{ marginBottom: 16 }}><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>🎯 Sprint Goal</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.sprintGoal}</div></div>}
            {notesByField.selectedItems && <div style={{ marginBottom: 16 }}><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>📋 Selected Items</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.selectedItems}</div></div>}
            {notesByField.totalPoints && <div><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>📊 Story Points</h4><span className="badge badge-teal" style={{ fontSize: 18, padding: '8px 16px' }}>{notesByField.totalPoints} points</span></div>}
          </>
        )}

        {meeting.type === 'review' && (
          <>
            {notesByField.demoNotes && <div style={{ marginBottom: 16 }}><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>🎬 Demo Notes</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.demoNotes}</div></div>}
            {notesByField.feedback && <div><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>💬 Stakeholder Feedback</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.feedback}</div></div>}
          </>
        )}

        {meeting.type === 'retro' && (
          <>
            {notesByField.wentWell && <div style={{ marginBottom: 16 }}><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>😊 What Went Well</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, borderLeft: '3px solid var(--success)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.wentWell}</div></div>}
            {notesByField.didntGoWell && <div style={{ marginBottom: 16 }}><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>😕 What Didn&apos;t Go Well</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, borderLeft: '3px solid var(--danger)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.didntGoWell}</div></div>}
            {notesByField.actionItems && <div><h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 14 }}>🎯 Action Items</h4><div style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 8, borderLeft: '3px solid var(--teal)', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{notesByField.actionItems}</div></div>}
          </>
        )}

        {(meeting.notes || []).length === 0 && <p className="text-muted">No notes recorded for this meeting.</p>}
      </div>
    </div>
  );
}
