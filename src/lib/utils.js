/**
 * Shared client-side utilities
 */

export const AVATAR_COLORS = [
  '#1E1B4B', '#008080', '#DC2626', '#D97706', '#059669',
  '#2563EB', '#7C3AED', '#DB2777', '#0891B2', '#65A30D',
  '#EA580C', '#4F46E5', '#0D9488', '#B91C1C', '#CA8A04'
];

export function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function formatDate(dateStr, options = {}) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', ...options });
}

export function formatDuration(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatDurationLabel(totalSeconds) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function meetingTypeInfo(type) {
  const types = {
    standup: { label: 'Daily Stand-up', icon: '⚡', badge: 'badge-primary' },
    planning: { label: 'Sprint Planning', icon: '📋', badge: 'badge-teal' },
    review: { label: 'Sprint Review', icon: '🎯', badge: 'badge-warning' },
    retro: { label: 'Retrospective', icon: '🔄', badge: 'badge-danger' }
  };
  return types[type] || types.standup;
}

export function roleLabel(role) {
  const labels = { admin: 'Admin', scrum_master: 'Scrum Master', member: 'Team Member' };
  return labels[role] || role;
}

export function roleBadge(role) {
  const badges = { admin: 'badge-danger', scrum_master: 'badge-teal', member: 'badge-info' };
  return badges[role] || 'badge-neutral';
}

export function sprintProgress(sprint) {
  if (!sprint) return 0;
  const now = new Date();
  const start = new Date(sprint.start_date);
  const end = new Date(sprint.end_date);
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function daysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

export function toInputDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

export function toInputTime(date) {
  return new Date(date).toTimeString().slice(0, 5);
}
