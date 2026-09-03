create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  name text not null check (char_length(trim(name)) > 0),
  password_hash text not null,
  role text not null default 'member' check (role in ('admin', 'product_owner', 'scrum_master', 'member')),
  avatar_color integer not null default 0 check (avatar_color between 0 and 14),
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  goal text not null default '',
  start_date timestamptz not null,
  end_date timestamptz not null,
  active boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create unique index if not exists one_active_sprint on public.sprints ((active)) where active;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid references public.sprints(id) on delete set null,
  type text not null check (type in ('standup', 'planning', 'review', 'retro')),
  date timestamptz not null,
  duration integer not null default 0 check (duration >= 0),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists meetings_sprint_id_idx on public.meetings(sprint_id);
create index if not exists meetings_date_idx on public.meetings(date desc);

create table if not exists public.meeting_attendees (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (meeting_id, user_id)
);

create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  field_name text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists meeting_notes_meeting_id_idx on public.meeting_notes(meeting_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid references public.sprints(id) on delete set null,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  points integer not null default 0 check (points >= 0),
  status text not null default 'todo' check (status in ('todo', 'progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_sprint_id_idx on public.tasks(sprint_id);
create index if not exists tasks_assignee_id_idx on public.tasks(assignee_id);

create table if not exists public.settings (
  key text primary key,
  value text not null default ''
);
insert into public.settings (key, value) values
  ('companyName', 'Systems Edge Solutions'), ('sprintDuration', '2'), ('dailyStandupTime', '09:30')
on conflict (key) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

-- Only the Next.js server uses the secret key. Browser callers have no access.
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.sprints enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendees enable row level security;
alter table public.meeting_notes enable row level security;
alter table public.tasks enable row level security;
alter table public.settings enable row level security;
