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
3. Add all four variables from `.env.example` to Vercel for **Production**, then redeploy. Do not expose `SUPABASE_SECRET_KEY` in client code.
4. Register the `INITIAL_ADMIN_EMAIL` account first. It becomes the workspace admin; every other new account starts as a Team Member.

The project uses the Supabase secret key only from server-side route handlers. Row Level Security is enabled on every table, so the browser cannot call the database directly.

### Enable Google sign-up and sign-in

The **Continue with Google** buttons on `/login` and `/register` use the same flow: a new Google user gets a Team Member account, and a returning user signs into their existing account. A verified Google email matching an existing email account links to that account and preserves its role and work.

1. Apply [`supabase/migrations/20260904000000_add_google_auth_identity.sql`](supabase/migrations/20260904000000_add_google_auth_identity.sql) in the Supabase SQL Editor. This adds the unique `auth_user_id` column without changing existing users.
2. In [Google Auth Platform](https://console.cloud.google.com/auth/clients), configure the consent screen and create an OAuth client of type **Web application**. Use the `openid`, email, and profile scopes. While the app is in Testing, add the Google accounts you want to test under Audience → Test users.
3. Add the app's origin (for example, `http://localhost:3000` and your production origin) under **Authorized JavaScript origins**. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` under **Authorized redirect URIs**. Copy the exact Supabase callback from its Google provider settings.
4. In Supabase → Authentication → Sign In / Providers → **Google**, enable Google and save the Google Client ID and Client Secret. Keep the secret in Supabase; never put it in a `NEXT_PUBLIC_` variable or commit it.
5. In Supabase → Authentication → URL Configuration, set **Site URL** to the production app URL. Add `http://localhost:3000/auth/callback` and `https://<your-production-domain>/auth/callback` to **Redirect URLs**. Add the exact callback URL for any other development port or preview domain you use.
6. Ensure the four variables in `.env.example` are set locally and in your deployment, then restart or redeploy the app.

The Google Cloud redirect points to **Supabase `/auth/v1/callback`**; the Supabase redirect allow list points to **this app `/auth/callback`**. These are different URLs. See the [Supabase Google setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

For this deployment, use `https://scrum-tracker-mauve.vercel.app` as the Supabase Site URL and a Google authorized JavaScript origin. Allow `https://scrum-tracker-mauve.vercel.app/auth/callback` in Supabase alongside `http://localhost:3000/auth/callback`. The Google authorized redirect URI is `https://oemyolebtzxpvhtfaxxi.supabase.co/auth/v1/callback`.

The app uses PKCE with a ten-minute HTTP-only verifier cookie. The callback exchanges the code on the server and issues the existing `scrum_session` cookie. Start and finish sign-in in the same browser. Cancellation and expired codes offer a return to sign-in; disabled providers and missing migrations display an actionable error before redirecting.

Verify with a fresh Google account from `/register`, then sign out and sign back in from `/login`. Confirm that the same account and role remain, and test cancellation at Google. End-to-end verification requires the provider setup and an interactive Google account.

---

## 🔑 Pre-Seeded Demo Accounts

Set `INITIAL_ADMIN_EMAIL` before registering. The first account registered with that exact email becomes the workspace admin. This replaces the insecure public demo accounts previously seeded into production.

---

## 📜 License

Private and proprietary to Systems Edge Solutions.
