'use client';
import AppLoader from '@/components/AppLoader';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getAvatarColor, getInitials, formatDuration, meetingTypeInfo, toInputDate, toInputTime } from '@/lib/utils';
import styles from '../../dashboard.module.css';

function NewMeetingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'standup';

  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(toInputDate(new Date()));
  const [time, setTime] = useState(toInputTime(new Date()));
  const [team, setTeam] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);

  // Timer
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => {
      const users = d.users || [];
      setTeam(users);
      setAttendees(users.map(u => u.id));
    });
  }, []);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSec(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const toggleAttendee = (id) => {
    setAttendees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const updateNote = (field, value, userId = null) => {
    const key = userId ? `${userId}_${field}` : field;
    setNotes(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Build notes array
    const notesList = [];
    if (type === 'standup') {
      team.forEach(m => {
        ['yesterday', 'today', 'blockers'].forEach(field => {
          const val = notes[`${m.id}_${field}`];
          if (val) notesList.push({ user_id: m.id, field_name: field, content: val });
        });
      });
    } else if (type === 'planning') {
      ['sprintGoal', 'selectedItems', 'totalPoints'].forEach(f => {
        if (notes[f]) notesList.push({ field_name: f, content: notes[f] });
      });
    } else if (type === 'review') {
      ['demoNotes', 'feedback'].forEach(f => {
        if (notes[f]) notesList.push({ field_name: f, content: notes[f] });
      });
    } else if (type === 'retro') {
      ['wentWell', 'didntGoWell', 'actionItems'].forEach(f => {
        if (notes[f]) notesList.push({ field_name: f, content: notes[f] });
      });
    }

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, date: new Date(`${date}T${time}`).toISOString(),
          duration: timerSec || 900, attendees, notes: notesList
        })
      });
      if (res.ok) router.push('/meetings');
    } finally {
      setSaving(false);
    }
  };

  const info = meetingTypeInfo(type);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button className="btn btn-ghost" onClick={() => router.push('/meetings')} style={{ marginBottom: 12 }}>← Back to Meetings</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{info.icon}</span>
          <h1 className={styles.pageTitle}>New {info.label}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit}>
          {/* Type Selector */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 className="card-title" style={{ marginBottom: 16 }}>Meeting Type</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              {['standup', 'planning', 'review', 'retro'].map(t => {
                const tinfo = meetingTypeInfo(t);
                return (
                  <button key={t} type="button" className={`chip ${type === t ? 'selected' : ''}`} onClick={() => setType(t)}>
                    {tinfo.icon} {tinfo.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date/Time */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 className="card-title" style={{ marginBottom: 16 }}>📅 Date & Time</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 className="card-title" style={{ marginBottom: 16 }}>👥 Attendees</h4>
            <div className="chip-select">
              {team.map(m => (
                <button key={m.id} type="button" className={`chip ${attendees.includes(m.id) ? 'selected' : ''}`} onClick={() => toggleAttendee(m.id)}>
                  <span className="avatar avatar-sm" style={{ background: getAvatarColor(m.avatar_color), width: 18, height: 18, fontSize: 9 }}>{getInitials(m.name)}</span>
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific Notes */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h4 className="card-title" style={{ marginBottom: 16 }}>📝 Notes</h4>

            {type === 'standup' && team.filter(m => attendees.includes(m.id)).map(m => (
              <div key={m.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(m.avatar_color) }}>{getInitials(m.name)}</div>
                  <strong>{m.name}</strong>
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>✅ Yesterday</label>
                  <textarea className="form-textarea" rows={2} placeholder="What did they do yesterday?" onChange={e => updateNote('yesterday', e.target.value, m.id)} />
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>🎯 Today</label>
                  <textarea className="form-textarea" rows={2} placeholder="What are they doing today?" onChange={e => updateNote('today', e.target.value, m.id)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>🚫 Blockers</label>
                  <textarea className="form-textarea" rows={1} placeholder="Any blockers?" onChange={e => updateNote('blockers', e.target.value, m.id)} />
                </div>
              </div>
            ))}

            {type === 'planning' && (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Sprint Goal</label>
                  <textarea className="form-textarea" rows={2} placeholder="Main goal for this sprint" onChange={e => updateNote('sprintGoal', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Selected Backlog Items</label>
                  <textarea className="form-textarea" rows={4} placeholder="Items selected (one per line)" onChange={e => updateNote('selectedItems', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Points</label>
                  <input type="number" className="form-input" placeholder="e.g. 34" onChange={e => updateNote('totalPoints', e.target.value)} />
                </div>
              </>
            )}

            {type === 'review' && (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Demo Notes</label>
                  <textarea className="form-textarea" rows={4} placeholder="What was demonstrated?" onChange={e => updateNote('demoNotes', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stakeholder Feedback</label>
                  <textarea className="form-textarea" rows={3} placeholder="Feedback received" onChange={e => updateNote('feedback', e.target.value)} />
                </div>
              </>
            )}

            {type === 'retro' && (
              <>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">😊 What Went Well</label>
                  <textarea className="form-textarea" rows={3} placeholder="Things that worked" onChange={e => updateNote('wentWell', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">😕 What Didn&apos;t Go Well</label>
                  <textarea className="form-textarea" rows={3} placeholder="Areas to improve" onChange={e => updateNote('didntGoWell', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">🎯 Action Items</label>
                  <textarea className="form-textarea" rows={3} placeholder="Concrete next steps" onChange={e => updateNote('actionItems', e.target.value)} />
                </div>
              </>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={saving}>
            {saving ? <AppLoader inline label="Saving…" /> : 'Save Meeting'}
          </button>
        </form>

        {/* Timer */}
        <div>
          <div className="card" style={{ textAlign: 'center', position: 'sticky', top: 32 }}>
            <h4 className="card-title" style={{ marginBottom: 24 }}>⏱️ Meeting Timer</h4>
            <div className={`timer-display ${timerRunning ? 'running' : timerSec > 0 ? 'paused' : ''}`}>
              {formatDuration(timerSec)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button type="button" className={`btn ${timerRunning ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setTimerRunning(r => !r)}>
                {timerRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setTimerRunning(false); setTimerSec(0); }}>↺ Reset</button>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: 16 }}>Duration auto-saved with the meeting</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <NewMeetingContent />
    </Suspense>
  );
}
