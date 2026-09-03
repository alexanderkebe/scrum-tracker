'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getAvatarColor, getInitials } from '@/lib/utils';
import styles from '../dashboard.module.css';

const COLUMNS = [
  { id: 'todo', label: 'To Do', dot: '#94A3B8' },
  { id: 'progress', label: 'In Progress', dot: '#2563EB' },
  { id: 'review', label: 'In Review', dot: '#D97706' },
  { id: 'done', label: 'Done', dot: '#059669' }
];

export default function BoardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [filterAssignee, setFilterAssignee] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', points: 3, priority: 'medium', status: 'todo', assignee_id: '' });

  const loadData = () => {
    Promise.all([
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/users').then(r => r.json())
    ]).then(([t, u]) => {
      setTasks(t.tasks || []);
      setTeam(u.users || []);
    });
  };

  useEffect(() => { loadData(); }, []);

  const filtered = filterAssignee ? tasks.filter(t => t.assignee_id === filterAssignee) : tasks;

  const onDragStart = (e, taskId) => { setDraggedId(taskId); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,128,128,0.15)'; };
  const onDragLeave = (e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; };
  const onDrop = async (e, newStatus) => {
    e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '';
    if (!draggedId) return;
    await fetch(`/api/tasks/${draggedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setDraggedId(null);
    loadData();
  };

  const openAdd = () => { setEditTask(null); setForm({ title: '', description: '', points: 3, priority: 'medium', status: 'todo', assignee_id: '' }); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setForm({ title: task.title, description: task.description || '', points: task.points, priority: task.priority, status: task.status, assignee_id: task.assignee_id || '' }); setShowModal(true); };

  const saveTask = async (e) => {
    e.preventDefault();
    if (editTask) {
      await fetch(`/api/tasks/${editTask.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false); loadData();
  };

  const deleteTask = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setShowModal(false); loadData();
  };

  const canManage = user?.role === 'admin' || user?.role === 'scrum_master' || user?.role === 'product_owner';

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className={styles.pageTitle}>Sprint Board</h1>
          <p className={styles.pageSubtitle}>{filtered.length} tasks</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={openAdd}>+ Add Task</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <span className="text-sm text-muted">Filter:</span>
        <button className={`chip ${!filterAssignee ? 'selected' : ''}`} onClick={() => setFilterAssignee(null)}>All</button>
        {team.map(m => (
          <button key={m.id} className={`chip ${filterAssignee === m.id ? 'selected' : ''}`} onClick={() => setFilterAssignee(m.id)}>
            <span className="avatar avatar-sm" style={{ background: getAvatarColor(m.avatar_color), width: 18, height: 18, fontSize: 9 }}>{getInitials(m.name)}</span>
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          const pts = colTasks.reduce((s, t) => s + (t.points || 0), 0);
          return (
            <div key={col.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 16, minHeight: 300, transition: 'all 150ms' }}
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={e => onDrop(e, col.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }}></span>
                  {col.label}
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{colTasks.length}</span>
                </div>
                <span className="text-xs text-muted">{pts} pts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 50 }}>
                {colTasks.map(task => {
                  const assignee = task.assignee_id ? team.find(m => m.id === task.assignee_id) : null;
                  return (
                    <div key={task.id} draggable={canManage || task.assignee_id === user?.id} style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '10px 14px', cursor: canManage || task.assignee_id === user?.id ? 'grab' : 'default', transition: 'all 150ms', userSelect: 'none' }}
                      onDragStart={e => onDragStart(e, task.id)} onClick={() => canManage && openEdit(task)}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>{task.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--success)' }}></span>
                          <span className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {task.points > 0 && <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal-muted)', color: 'var(--teal)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{task.points}</span>}
                          {assignee && <div className="avatar avatar-sm" style={{ background: getAvatarColor(assignee.avatar_color || 0), width: 24, height: 24, fontSize: 10 }} title={assignee.name}>{getInitials(assignee.name)}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{editTask ? 'Edit Task' : 'Add Task'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form id="task-form" onSubmit={saveTask}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Points</label>
                    <select className="form-select" value={form.points} onChange={e => setForm({ ...form, points: parseInt(e.target.value) })}>
                      {[1, 2, 3, 5, 8, 13].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {['low', 'medium', 'high'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                      <option value="">Unassigned</option>
                      {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              {editTask && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={() => deleteTask(editTask.id)}>Delete</button>}
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => document.getElementById('task-form').requestSubmit()}>{editTask ? 'Save' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
