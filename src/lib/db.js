import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'scrum-tracker.db');

let _db = null;

export function getDb() {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  seedIfEmpty(_db);

  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      avatar_color INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      goal TEXT DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      created_by TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      sprint_id TEXT,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      created_by TEXT,
      FOREIGN KEY (sprint_id) REFERENCES sprints(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meeting_attendees (
      meeting_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (meeting_id, user_id),
      FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meeting_notes (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      user_id TEXT,
      field_name TEXT NOT NULL,
      content TEXT DEFAULT '',
      FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      sprint_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignee_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sprint_id) REFERENCES sprints(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function seedIfEmpty(db) {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount > 0) return;

  // Settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('companyName', 'Systems Edge Solutions');
  insertSetting.run('sprintDuration', '2');
  insertSetting.run('dailyStandupTime', '09:30');

  // Admin user
  const adminId = uuidv4();
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (id, email, name, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(adminId, 'admin@systemedge.com', 'Admin User', hash, 'admin', 0);

  // Demo team
  const team = [
    { name: 'Sarah Chen', role: 'scrum_master', email: 'sarah@systemedge.com', color: 1 },
    { name: 'Marcus Johnson', role: 'member', email: 'marcus@systemedge.com', color: 2 },
    { name: 'Alex Rivera', role: 'member', email: 'alex@systemedge.com', color: 3 },
    { name: 'Priya Sharma', role: 'member', email: 'priya@systemedge.com', color: 4 },
    { name: 'Tom Wilson', role: 'member', email: 'tom@systemedge.com', color: 5 },
    { name: 'Emma Dubois', role: 'member', email: 'emma@systemedge.com', color: 6 }
  ];
  const insertUser = db.prepare(`INSERT INTO users (id, email, name, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`);
  const memberIds = [];
  for (const m of team) {
    const id = uuidv4();
    memberIds.push(id);
    insertUser.run(id, m.email, m.name, bcrypt.hashSync('password123', 10), m.role, m.color);
  }

  const allUserIds = [adminId, ...memberIds];

  // Sprint
  const sprintId = uuidv4();
  const start = new Date();
  start.setDate(start.getDate() - 5);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  db.prepare(`INSERT INTO sprints (id, name, goal, start_date, end_date, active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(sprintId, 'Sprint 12', 'Complete user dashboard redesign and API integration', start.toISOString(), end.toISOString(), 1, adminId);

  // Tasks
  const taskData = [
    { title: 'Design new dashboard layout', points: 5, status: 'done', priority: 'high' },
    { title: 'Implement user auth flow', points: 8, status: 'done', priority: 'high' },
    { title: 'Create REST API endpoints', points: 5, status: 'review', priority: 'high' },
    { title: 'Build notification system', points: 3, status: 'review', priority: 'medium' },
    { title: 'Setup CI/CD pipeline', points: 5, status: 'progress', priority: 'medium' },
    { title: 'Refactor data models', points: 3, status: 'progress', priority: 'low' },
    { title: 'Write unit tests for auth', points: 3, status: 'progress', priority: 'high' },
    { title: 'Mobile responsive layouts', points: 5, status: 'todo', priority: 'medium' },
    { title: 'Performance optimization', points: 3, status: 'todo', priority: 'low' },
    { title: 'User settings page', points: 2, status: 'todo', priority: 'low' }
  ];
  const insertTask = db.prepare(`INSERT INTO tasks (id, sprint_id, title, points, status, priority, assignee_id) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  taskData.forEach((t, i) => {
    insertTask.run(uuidv4(), sprintId, t.title, t.points, t.status, t.priority, allUserIds[i % allUserIds.length]);
  });

  // Meetings
  const insertMeeting = db.prepare(`INSERT INTO meetings (id, sprint_id, type, date, duration, created_by) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertAttendee = db.prepare(`INSERT INTO meeting_attendees (meeting_id, user_id) VALUES (?, ?)`);
  const insertNote = db.prepare(`INSERT INTO meeting_notes (id, meeting_id, user_id, field_name, content) VALUES (?, ?, ?, ?, ?)`);

  for (let d = 1; d <= 5; d++) {
    const mDate = new Date(start);
    mDate.setDate(mDate.getDate() + d);
    mDate.setHours(9, 30, 0);
    const mid = uuidv4();
    insertMeeting.run(mid, sprintId, 'standup', mDate.toISOString(), 780 + Math.floor(Math.random() * 300), memberIds[0]);
    allUserIds.forEach(uid => insertAttendee.run(mid, uid));
    for (let mi = 0; mi < 4; mi++) {
      insertNote.run(uuidv4(), mid, allUserIds[mi], 'yesterday', 'Worked on assigned tasks');
      insertNote.run(uuidv4(), mid, allUserIds[mi], 'today', 'Continue current sprint work');
      if (d === 3) insertNote.run(uuidv4(), mid, allUserIds[mi], 'blockers', 'Waiting for API spec review');
    }
  }

  // Planning meeting
  const planId = uuidv4();
  const planDate = new Date(start);
  planDate.setHours(10, 0, 0);
  insertMeeting.run(planId, sprintId, 'planning', planDate.toISOString(), 3600, memberIds[0]);
  allUserIds.forEach(uid => insertAttendee.run(planId, uid));
  insertNote.run(uuidv4(), planId, null, 'sprintGoal', 'Complete user dashboard redesign and API integration');
  insertNote.run(uuidv4(), planId, null, 'totalPoints', '42');
}
