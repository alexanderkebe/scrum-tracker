# Systems Edge Solutions — Scrum Meeting Tracker

An enterprise-grade, full-stack Scrum Meeting Tracker web application tailored for **Systems Edge Solutions**. Features role-based permissions, ceremony tracking with live timers, manager analytics, kanban sprint boards, and user profile customization.

---

## ⚡ Key Features

- **🏢 Enterprise Branding**: Styled directly after [Systems Edge Solutions](https://www.systemedgesolutions.com/) using the deep navy (`#1E1B4B`), teal (`#008080`), and slate palette with official company logo assets.
- **🛡️ Full Authentication & Authorization**: Session-based HTTP-only cookies with `bcryptjs` password hashing and role-based permissions:
  - **Admin / Manager**: Workspace configuration, user roster management, ceremony creation, and manager analytics.
  - **Scrum Master**: Sprint planning, ceremony minutes, impediment logging, and task assignment.
  - **Team Member**: Personal task tracking, self-service profile management, and ceremony attendance.
- **⏱️ Ceremony Tracker with Live Timer**:
  - Daily Stand-ups with three questions (Yesterday, Today, Blockers).
  - Sprint Planning (Goal, Selected Backlog Items, Points Commitment).
  - Sprint Review (Demo notes, Stakeholder Feedback).
  - Retrospectives (What went well, What didn't, Action items).
  - Live stopwatch with auto-saved duration.
- **📊 Interactive Agile Command Center**:
  - Daily Stand-up alert banner with direct 1-click ceremony launch.
  - Active sprint progress bar and days remaining countdown.
  - Story point burndown & velocity meter.
  - Active blockers impediment backlog.
  - My Sprint Tasks interactive status widget.
- **📋 Kanban Sprint Board**:
  - 4-column drag-and-drop board (To Do, In Progress, In Review, Done).
  - Priority flags (High, Medium, Low) and story point badges.
  - Assignee filter chips.
- **📈 Manager Analytics**:
  - Sprint velocity calculation.
  - Task status breakdown and ceremony distribution.
  - Team attendance rate calculation.
  - One-click downloadable text report.
- **👤 User Profile Management**:
  - Update full name.
  - Interactive 15-color avatar palette picker.
  - Secure password changes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions / API Routes)
- **Database**: [Supabase](https://supabase.com/) Postgres, managed through versioned SQL migrations
- **Authentication**: HTTP-only secure cookie session management with `bcryptjs`
- **Styling**: Vanilla CSS Modules with custom design tokens

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+ installed

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alexanderkebe/scrum-tracker.git
   cd scrum-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase and Vercel setup

The app requires Supabase for durable production data. SQLite files do not persist safely in Vercel serverless functions.

1. Create a Supabase project, then run [`supabase/migrations/20260903000000_create_scrum_tracker.sql`](supabase/migrations/20260903000000_create_scrum_tracker.sql) in its SQL Editor (or run `supabase db push` after linking the project with the Supabase CLI).
2. Copy `.env.example` to `.env.local` and fill in the project URL, secret key, and your `INITIAL_ADMIN_EMAIL`.
3. Add the same three variables to Vercel for **Production**, then redeploy. Do not expose `SUPABASE_SECRET_KEY` in client code.
4. Register the `INITIAL_ADMIN_EMAIL` account first. It becomes the workspace admin; every other new account starts as a Team Member.

The project uses the Supabase secret key only from server-side route handlers. Row Level Security is enabled on every table, so the browser cannot call the database directly.

---

## 🔑 Pre-Seeded Demo Accounts

Set `INITIAL_ADMIN_EMAIL` before registering. The first account registered with that exact email becomes the workspace admin. This replaces the insecure public demo accounts previously seeded into production.

---

## 📜 License

Private and proprietary to Systems Edge Solutions.
