# EFFICIENT

**Product Requirements Document**
**Version 1.3 · MVP (Shipped) · March 2026**

**Tech Stack:**
Frontend: Next.js (React, App Router) · Database: Supabase (PostgreSQL) · Auth: Supabase Auth
AI: OpenRouter (nvidia/nemotron-3-nano-30b-a3b:free) · Push Notifications: Web Push / PWA · Deployment: Vercel

---

## 1. Overview

Efficient is a personal task management PWA (Progressive Web App) that combines a free-form scratch pad, a structured to-do list, and an AI layer that helps users stay on top of their day. It sends proactive morning and evening check-ins via push notifications, automatically converts scratch pad entries into tasks, and logs all changes in a daily activity feed.

The app is designed to grow over time — starting as a single-user MVP and expanding to multi-user with AI-powered behaviour learning in future versions.

---

## 2. Goals & Non-Goals

### Goals (MVP)

- Give users a frictionless capture layer (scratch pad) for any thought or task
- Maintain a clean, structured to-do list with pending and completed tasks
- Automatically parse scratch pad entries into tasks using AI, with user review
- Send morning and evening check-in push notifications (times configurable per user, defaults: 8am / 8pm)
- Log all app-initiated and user-initiated changes in a day-by-day activity feed
- Support Someday and Snoozed states for undated tasks
- Build with Supabase Auth from day one to support multi-user in future
- Deploy as a PWA installable on mobile from the browser

### Non-Goals (MVP)

- AI behaviour learning / priority inference (data will be stored, feature ships later)
- Task categories or tags
- Task priority levels
- Collaboration or task sharing between users
- Native mobile app (iOS / Android)

---

## 3. User Stories

### Scratch Pad

- As a user, I can open the scratch pad and type freely — notes, thoughts, tasks — with no structure required.
- As a user, every time I edit the scratch pad, the AI automatically scans the new content and suggests tasks to add to my to-do list.
- As a user, I see a suggestion card for each AI-suggested task before it is added, and I can accept or dismiss it.
- As a user, I can edit the suggested task title and due date before accepting a suggestion.
- As a user, if the AI detects a due date in my text (e.g. 'call John on Friday'), the task is pre-filled with that date.
- As a user, tasks with a future due date do not appear in today's to-do — they appear on the correct day.
- As a user, if I dismiss suggestions and click "Suggest tasks" again, the AI re-analyzes my scratch pad content.
- As a user, the AI does not suggest or add tasks that already exist in my to-do list.

### To-Do List

- As a user, I see all my pending tasks grouped under a Pending section.
- As a user, I see all completed tasks grouped under a Completed section, visually distinct (strikethrough + muted).
- As a user, tasks with no due date are marked as Someday and appear in my list without nagging.
- As a user, I can snooze a Someday task to a specific date, after which it reappears as an active task.
- As a user, I can manually mark any task as done, edit it, delete it, or snooze it.
- As a user, I can add a due date to any task at any time.

### Check-ins (Push Notifications)

- As a user, I receive a morning push notification at my configured morning time (default 8am) every day.
- When I open the morning check-in, the app shows my pending tasks and asks: which of these are done?
- I can mark tasks complete directly in the check-in flow, and I can add new tasks from there too.
- As a user, I receive an evening push notification at my configured evening time (default 8pm) every day.
- When I open the evening check-in, the app again shows pending tasks and asks me to mark any completed.

### Daily Summary / Log

- As a user, I have a dedicated Summary tab.
- This tab shows a single day's activity at a time, defaulting to today.
- I can navigate between days using left/right arrow buttons. The date header shows "Today", "Yesterday", or a formatted date (e.g. "Mar 5, 2026").
- The right arrow is disabled when viewing today (cannot navigate into the future).
- Empty days show a "No activity on this day" message.
- Each log entry shows: timestamp, actor badge (You or Efficient), action description, and the task affected.

### Auth

- As a user, I can sign up and log in via email/password using Supabase Auth.
- As a user, I can start using the app immediately after signing up — no email confirmation required.
- All my data (tasks, scratch pad, logs) is scoped to my user account.
- The app is architected for multi-user from day one even if only one user exists in MVP.

---

## 4. Feature Specifications

### 4.1 Scratch Pad

A single free-form text area per user. Content is auto-saved on every keystroke (debounced 1s). On each save, the AI scans the scratch pad content and diffs it against the previously processed version (`last_processed_content`) to find net-new text. If the previous content is a prefix of the current content, only the new suffix is sent to the AI. It extracts candidate tasks and presents them as suggestion cards on the scratch pad page.

**Two task extraction modes:**
- **"Suggest tasks"** — AI analyzes the full scratch pad content and presents suggestion cards for review. Can be clicked multiple times; dismissed suggestions can be re-suggested. Does not update `last_processed_content`.
- **"Add tasks"** — AI analyzes only the new content (diff against `last_processed_content`) and immediately adds tasks to the to-do list. Updates `last_processed_content` after adding.

**Suggestion card contains:**
- Editable task title (click title or pencil icon to edit inline; Enter to confirm, Escape to revert)
- Editable due date via date picker (can set, change, or remove)
- Accept button (green check) → adds task to to-do with edited title/date, logs to `activity_log` and `ai_suggestions`
- Dismiss button (X) → marks suggestion as dismissed in `ai_suggestions`

**Duplicate prevention:** Before creating suggestions, the API checks all existing tasks and previously accepted suggestions for the user. Any AI-extracted task with a title matching an existing task (case-insensitive) is filtered out. This prevents duplicate tasks when clicking "Suggest tasks" or "Add tasks" multiple times.

**Status indicator:** Shows Saving... → Saved → idle as content is persisted.

### 4.2 To-Do List

Tasks are displayed in three sections on the same screen:
- **Today** — tasks due today or overdue, sorted by due date
- **Upcoming** — future-dated and undated (Someday) tasks. An info icon tooltip explains that tasks will automatically move to Today once their due date arrives.
- **Completed** — all completed tasks, sorted by `completed_at` descending (most recent first)

**Task States:**
| State | Description |
|-------|-------------|
| `pending` | Active task with a due date |
| `someday` | Active task with no due date |
| `snoozed` | Hidden until a future date/time, then reverts to pending |
| `completed` | Done. Shown in completed section |

**Task actions menu:** Each task has a three-dot menu (always visible for mobile usability) with Edit, Snooze, and Delete options.

**Snooze picker** offers quick options (Tomorrow 8am, Next Monday 8am) plus a calendar picker for custom dates. Snoozed tasks are reactivated server-side on page load when `snooze_until` has passed.

### 4.3 Push Notifications & Check-ins

The app shows a notification permission banner on first load (if not already subscribed). A service worker (`/sw.js`) handles push events and notification clicks. Notifications are scheduled server-side via a cron endpoint (`/api/cron/send-notifications`) that checks each user's configured times with a ±7 minute tolerance window.

**Morning Check-in Flow:**
- Notification title: "Good morning!"
- Notification body: "You have {n} task(s) today. Ready to plan your day?" (or "No tasks yet — start your day by adding some!")
- Tapping the notification opens the app at `/?checkin=morning`
- A modal dialog lists all pending/someday tasks with checkboxes
- User marks completed ones → they are struck off with strikethrough
- Modal includes inline task input to add new tasks
- "Done" button closes the modal and logs a `checkin_completed` activity entry

**Evening Check-in Flow:**
- Notification title: "End of day check-in"
- Notification body: "You have {n} task(s) remaining. How did it go?" (or "All caught up! Great work today.")
- Tapping the notification opens the app at `/?checkin=evening`
- Same modal as morning, but without the "Add task" input
- "Done" button closes and logs activity

**Invalid subscriptions** (410 Gone / 404) are automatically cleaned up.

### 4.4 Activity Feed

A dedicated Summary tab showing a single day's activity at a time with day-by-day navigation.

**Navigation header (centered):**
- Left arrow button | date label | right arrow button
- Date label shows "Today", "Yesterday", or formatted date (e.g. "Mar 5, 2026")
- Defaults to today on load
- Right arrow is disabled when viewing today (cannot navigate into the future)

**API:** The `/api/activity` endpoint accepts an optional `date` query parameter (format `yyyy-MM-dd`). When provided, it returns all entries for that single day (no pagination needed). The existing cursor-based pagination is preserved as a fallback when `date` is absent.

**Each log entry shows:**
- Actor badge: "You" (for `user` actor) or "Efficient" (for `ai` or `app` actor)
- Action description with task title snapshot
- Timestamp (h:mm a format)

**Action types logged:**
| Action | Description |
|--------|-------------|
| `task_created` | Task added (manually, from AI, or during check-in) |
| `task_completed` | Task marked as done |
| `task_uncompleted` | Task reopened |
| `task_deleted` | Task removed |
| `task_updated` | Task title or due date changed |
| `task_snoozed` | Task snoozed to a future date |
| `checkin_completed` | User completed a check-in flow |
| `checkin_sent` | Push notification sent by cron job |

**Empty state:** "No activity on this day" when no entries exist for the selected date.

**Error handling:** Inline error message with retry button on load failure.

---

## 5. Supabase Data Model

All tables include Row Level Security (RLS) policies scoped to `auth.uid()` from day one. A trigger on `auth.users` auto-creates a `profiles` row on signup.

### profiles

> `auth.users` is auto-managed by Supabase. We extend it with a `profiles` table.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (FK) | References auth.users.id, cascade delete |
| timezone | text | Default: 'UTC'. Used for push scheduling |
| morning_notification_time | time | Default: 08:00 |
| evening_notification_time | time | Default: 20:00 |
| push_subscription | jsonb | Web Push subscription object |
| created_at | timestamptz | Auto-set |

### tasks

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key (gen_random_uuid) |
| user_id | uuid (FK) | References auth.users.id, cascade delete |
| title | text | Task name |
| status | text | pending \| someday \| snoozed \| completed |
| due_date | date | Nullable — null means someday |
| snooze_until | timestamptz | Nullable — set when status = snoozed |
| completed_at | timestamptz | Nullable — set when completed |
| source | text | manual \| ai \| scratch_pad |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

### scratch_pad

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key (gen_random_uuid) |
| user_id | uuid (FK) | One row per user (upsert on save), cascade delete |
| content | text | Full current content of the scratch pad (default: '') |
| last_processed_content | text | Content as of last AI parse — used to diff |
| updated_at | timestamptz | Auto-updated via trigger |

### activity_log

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key (gen_random_uuid) |
| user_id | uuid (FK) | References auth.users.id, cascade delete |
| actor | text | 'user', 'ai', or 'app' |
| action | text | See action types table in section 4.4 |
| task_id | uuid (FK) | References tasks.id (on delete set null) |
| task_title_snapshot | text | Snapshot of task title at time of action |
| metadata | jsonb | Extra context (e.g. check-in type, task count) |
| created_at | timestamptz | Auto-set — used for day grouping and pagination |

> **Note:** The DB constraint on `actor` currently only allows `'user'` and `'ai'`. The cron job inserts `'app'` using the service-role client which bypasses RLS. If strict validation is needed, update the check constraint to include `'app'`.

### ai_suggestions

> This table stores all AI suggestions and user responses. It actively powers the suggestion card flow and builds the dataset needed for behaviour learning later.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key (gen_random_uuid) |
| user_id | uuid (FK) | References auth.users.id, cascade delete |
| suggested_title | text | What AI suggested |
| suggested_due_date | date | What AI inferred (nullable) |
| source_text | text | Text snippet that was sent to the AI |
| user_action | text | accepted \| dismissed \| null (pending review) |
| task_id | uuid (FK) | Nullable — set if accepted and task created |
| created_at | timestamptz | Auto-set |

---

## 6. Phased Build Plan

> Each phase was a discrete Claude Code session. All 6 phases are complete.

### Phase 1 — Project Setup & Auth

- Scaffolded Next.js project with App Router
- Configured Supabase project, enabled Auth (email/password)
- Created all Supabase tables with RLS policies (migrations in `supabase/migrations/`)
- Built sign up, log in, log out pages
- Auth middleware refreshes sessions on all requests
- Auto-create profile trigger on user signup

### Phase 2 — To-Do List Core

- Built main to-do list UI (Today + Upcoming + Completed sections)
- Today section shows tasks due today or overdue; Upcoming shows future and undated tasks
- Upcoming header has an info icon with tooltip explaining tasks move to Today when due
- Wired up Supabase: fetch tasks, add task, mark complete/uncomplete, delete, edit
- Implemented Someday state (tasks with no due date)
- Implemented Snooze — quick options (Tomorrow, Next Monday) + calendar picker, reactivation on page load
- Mobile-responsive layout with bottom nav tabs

### Phase 3 — Scratch Pad & AI Parsing

- Built scratch pad UI with auto-save (debounced 1s)
- Two modes: "Suggest tasks" (full content, review before adding) and "Add tasks" (diff only, auto-add)
- "Suggest tasks" always sends full content to AI; "Add tasks" uses prefix-based diff against `last_processed_content`
- Sends content to OpenRouter API (nvidia/nemotron-3-nano-30b-a3b:free) to extract candidate tasks + dates
- Renders editable suggestion cards — users can edit title (inline) and due date (date picker) before accepting
- Server-side duplicate prevention: filters out AI suggestions matching existing task titles or accepted suggestions
- On accept: creates task in Supabase with edited title/date, logs to `activity_log` and marks `ai_suggestions` as accepted
- On dismiss: marks `ai_suggestions` as dismissed; user can re-suggest to get the same suggestions back

### Phase 4 — Push Notifications & Check-ins

- Service worker registers on app load, permission banner shown if not subscribed
- Push subscription saved to `profiles.push_subscription`
- Cron endpoint checks all users' configured times (±7 min tolerance, timezone-aware)
- Morning check-in modal: task list + checkboxes + add task input
- Evening check-in modal: task list + checkboxes (no add task input)
- Check-in triggered via `?checkin=morning|evening` URL parameter from notification click
- All check-in completions logged to `activity_log`
- Invalid push subscriptions (410/404) auto-cleaned

### Phase 5 — Activity Feed

- Built Summary tab with day-by-day navigation (left/right arrows + date label header)
- API supports `date` query parameter to fetch all entries for a single day
- Date label shows "Today" / "Yesterday" / formatted date; defaults to today
- Right arrow disabled on today; empty days show "No activity on this day"
- Displays actor badge (You vs Efficient), action description, task name, and timestamp
- Cursor-based pagination preserved as API fallback

### Phase 6 — Polish & PWA

- PWA metadata via Next.js `metadata` and `viewport` exports (manifest, apple-web-app, theme-color, icons)
- iOS standalone support (apple-mobile-web-app-capable)
- App-level error boundary (`error.tsx`) with "Try again" button
- Global error boundary (`global-error.tsx`) for catastrophic layout failures
- Inline error handling with retry in activity feed
- Loading skeletons for all 3 tabs
- Empty states for tasks and activity feed
- Removed unused boilerplate SVGs from `public/`
- Task three-dot menu always visible (not hover-only) for mobile usability
- Sanitized auth error messages — generic user-facing messages instead of raw Supabase errors
- Signup flow: no email confirmation, direct sign-in after account creation
- Vercel cron configured for push notification delivery

---

## 7. AI Prompt Guidelines

The app uses OpenRouter API with model `nvidia/nemotron-3-nano-30b-a3b:free`. The prompt is sent as a single user message (no system/user split).

### Scratch Pad Parsing Prompt

> You are a task extraction assistant. Extract actionable tasks from the following free-form text. For each task, provide a concise title and an optional due date (YYYY-MM-DD format) if one is mentioned or can be reasonably inferred.
>
> Today's date is {date}.
>
> Rules:
> - Only extract clear, actionable tasks
> - Keep titles concise but descriptive (under 80 characters)
> - Only include a due_date if one is explicitly mentioned or strongly implied
> - If a relative date is mentioned (e.g. "tomorrow", "next week", "Friday"), convert it to an absolute date based on today
> - Return an empty array if no actionable tasks are found
> - Do NOT include observations, ideas, or vague statements as tasks
>
> Return ONLY a valid JSON array with objects containing "title" (string) and "due_date" (string YYYY-MM-DD or null). No other text.
>
> Text to analyze:
> """
> {diff_text}
> """

### Morning Check-in Notification Text

- **Title:** "Good morning!"
- **Body (with tasks):** "You have {n} task(s) today. Ready to plan your day?"
- **Body (no tasks):** "No tasks yet — start your day by adding some!"

### Evening Check-in Notification Text

- **Title:** "End of day check-in"
- **Body (with tasks):** "You have {n} task(s) remaining. How did it go?"
- **Body (no tasks):** "All caught up! Great work today."

---

## 8. Open Questions & Future Considerations

### For Future Versions

- **AI behaviour learning:** After collecting ai_suggestions data over time, train or prompt Claude to infer the user's priorities and task patterns.
- **Upgrade AI model:** Current model is a free tier (nvidia/nemotron). Consider upgrading to Claude or a higher-quality model for better task extraction.
- **Task categories/tags:** Add a tags column to tasks table when ready.
- **Priority levels:** Add a priority column (high | medium | low) to tasks.
- **Multi-user:** Supabase Auth and RLS are already multi-user ready. Adding more users is just opening up sign-up.
- **Recurring tasks:** Add recurrence_rule (RRULE string) to tasks table.
- **Email digest:** Alternative or complement to push notifications for users who don't install the PWA.
- **Completed task limit:** Consider capping completed tasks shown (e.g. last 20) as the list grows.

### Known Issues

- **Activity log actor constraint:** The DB check constraint on `activity_log.actor` only allows `'user'` and `'ai'`, but the cron job inserts `'app'`. This works because the cron uses the service-role client (bypasses RLS/constraints), but should be formalized by updating the constraint to include `'app'`.

### Resolved Decisions

- **Push notification timezone handling:** Resolved — each user has a configurable timezone and notification times in `profiles`. The cron job runs frequently and checks if the current local time is within ±7 minutes of the user's configured times.
- **iOS Safari push limitations:** Resolved — the app sets `apple-mobile-web-app-capable` meta tag and includes iOS-specific PWA metadata for Add to Home Screen support.

---

*Efficient PRD v1.3 · Updated March 2026 · MVP shipped*
