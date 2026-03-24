# Efficient

Personal task management PWA. Features: task CRUD with due dates, snoozeing, and archival; recurring tasks with daily/weekly/monthly/yearly schedules; AI scratch pad that extracts tasks from free-form text; push notifications (morning/evening check-ins); activity log and summary view.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database / Auth**: Supabase (PostgreSQL + cookie-based auth via `@supabase/ssr`)
- **UI**: `@base-ui/react` primitives, shadcn base-nova style (`components.json`), `class-variance-authority`
- **Styling**: Tailwind CSS v4 (CSS-based config in `globals.css`, no `tailwind.config` file)
- **Analytics / Flags**: PostHog (`posthog-js` client, `posthog-node` server)
- **AI**: `@google/generative-ai` (scratch pad parsing via `/api/parse-scratch-pad`)
- **Utilities**: `date-fns`, `lucide-react`, `sonner` (toasts), `react-day-picker`, `web-push`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, ThemeProvider, PostHogProvider, Toaster
│   ├── globals.css             # Tailwind v4 config + CSS variables (dark/light)
│   ├── (app)/                  # Authenticated route group
│   │   ├── page.tsx            # Home — today's tasks
│   │   ├── layout.tsx          # Auth guard, nav, push manager, timezone sync
│   │   ├── components/         # App-specific components (task-item, task-list, modals, etc.)
│   │   ├── scratch-pad/        # AI scratch pad page
│   │   ├── settings/           # Settings page + settings/recurring/ subpage
│   │   ├── summary/            # Activity feed page
│   │   └── task-lists/         # Upcoming / someday / completed views
│   ├── (auth)/                 # Unauthenticated route group (login, signup)
│   └── api/                    # API routes (see Routes below)
├── components/ui/              # Reusable primitives: Button, Input, Dialog, Card, etc.
├── lib/
│   ├── actions/                # Server actions: tasks.ts, recurring-tasks.ts, scratch-pad.ts, feedback.ts, profile.ts
│   ├── supabase/               # client.ts (browser), server.ts (server), middleware.ts
│   ├── types.ts                # Shared types and interfaces
│   ├── recurring.ts            # Recurring schedule logic (shouldGenerateToday, getNextDueDate, etc.)
│   ├── use-feature-flag.ts     # PostHog feature flag hook
│   ├── posthog-server.ts       # Server-side PostHog client
│   └── utils.ts                # cn() helper (clsx + tailwind-merge)
supabase/migrations/            # 8 SQL migration files (001–008)
```

## Database Schema

**profiles** — extends `auth.users`
`id (uuid PK → auth.users)`, `timezone`, `morning_notification_time`, `evening_notification_time`, `push_subscription (jsonb)`, `onboarding_completed`, `clear_scratch_pad_on_accept`

**tasks** — core task table
`id (uuid PK)`, `user_id`, `title`, `status` (pending | someday | snoozed | completed | skipped), `due_date`, `snooze_until`, `completed_at`, `archived_at`, `source` (manual | ai | scratch_pad), `recurring_task_id (FK → recurring_tasks)`, `created_at`, `updated_at`
Unique dedup index: `(recurring_task_id, due_date) WHERE recurring_task_id IS NOT NULL`

**recurring_tasks** — schedule definitions
`id (uuid PK)`, `user_id`, `title`, `frequency` (daily | weekly | monthly | yearly), `interval`, `days_of_week (int[])`, `day_of_month`, `start_date`, `end_date`, `max_occurrences`, `archived_at`

**scratch_pad** — one row per user
`id`, `user_id`, `content`, `last_processed_content`, `updated_at`

**activity_log** — audit trail
`id`, `user_id`, `actor` (user | ai | app), `action`, `task_id (FK)`, `task_title_snapshot`, `metadata (jsonb)`, `created_at`

**ai_suggestions** — parsed scratch pad suggestions
`id`, `user_id`, `suggested_title`, `suggested_due_date`, `source_text`, `user_action` (accepted | dismissed | null), `task_id`

All tables have RLS enabled — policies scope to `auth.uid() = user_id`.

## Architecture Patterns

### Server Actions (`src/lib/actions/`)
- Return `ActionResult<T>` = `{ success: true, data: T } | { success: false, error: string }`
- Auth check first (`supabase.auth.getUser()`), then mutation, then fire-and-forget `logActivity()`, then `revalidatePath("/")`
- Never throw — always return error results for the client to handle

### Optimistic Updates (`task-context.tsx`)
- `TaskProvider` wraps app in React Context with `useOptimistic(initialTasks, taskReducer)`
- Reducer handles: add, toggle, delete, update, snooze, skip, archive
- Each handler: dispatch optimistic → call server action → toast on error

### Supabase Auth
- Cookie-based sessions via `@supabase/ssr`
- `server.ts`: `createServerClient` using `cookies()` — for server components and server actions
- `client.ts`: `createBrowserClient` — for client components
- `middleware.ts`: refresh token on every request via `supabase.auth.getUser()`
- Auth callback: `/auth/callback` handles OAuth redirects

### Feature Flags
- `useFeatureFlag(flag)` hook wraps PostHog — defaults to `true` when PostHog isn't loaded (dev-friendly)
- Currently used: `recurring-tasks` (100% rollout)

### Theming
- Dark-first design: `:root` = dark, `.light` class = light mode
- CSS variables in `globals.css` (e.g., `--bg-base`, `--accent`, `--text-primary`)
- Use CSS variables, not Tailwind `dark:` prefix

### Soft Archival
- Tasks are archived (`archived_at` timestamp), not hard-deleted
- Recurring rules are also soft-archived; archiving skips all future pending instances

## Routes

| Path | Type | Description |
|---|---|---|
| `/` | Page | Today's tasks (home) |
| `/task-lists` | Page | Upcoming, someday, completed views |
| `/scratch-pad` | Page | AI-powered scratch pad |
| `/summary` | Page | Activity feed |
| `/settings` | Page | User preferences |
| `/settings/recurring` | Page | Manage recurring task rules |
| `/login`, `/signup` | Pages | Auth pages |
| `/api/parse-scratch-pad` | POST | AI extraction from scratch pad text |
| `/api/tasks/pending` | GET | Pending tasks for notifications |
| `/api/activity` | GET | Activity log entries |
| `/api/notifications/subscribe` | POST | Web push subscription |
| `/api/cron/send-notifications` | GET | Cron endpoint for push notifications |
| `/auth/callback` | GET | Supabase OAuth callback |

## UI Conventions

- **Fonts**: DM Sans (body, `font-sans`), Instrument Serif (display headings, `font-display`), JetBrains Mono (code, `font-mono`)
- **Sizing**: Button and Input both default to `h-8` — use default size, not `sm`
- **Native `<select>`**: No Select component exists — use native `<select>` with `font-sans` class
- **Colors**: CSS variables — accent `#E8C547` (dark) / `#C9A227` (light), destructive `#E54D4D`
- **Components** (`src/components/ui/`): Badge, Button, Calendar, Card, Checkbox, Dialog, DropdownMenu, Input, Label, Popover, Separator, Textarea, Tooltip
- **Toasts**: `sonner` — `toast.success()` / `toast.error()`, positioned bottom-center
- **Icons**: `lucide-react`
- **Utility**: `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)

## Key Types (`src/lib/types.ts`)

```ts
type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };
type TaskStatus = "pending" | "someday" | "snoozed" | "completed" | "skipped";
type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
interface Task { id, user_id, title, status, due_date, snooze_until, completed_at, archived_at, source, recurring_task_id, ... }
interface RecurringTask { id, user_id, title, frequency, interval, days_of_week, day_of_month, start_date, end_date, max_occurrences, archived_at }
interface AiSuggestion { id, suggested_title, suggested_due_date, source_text, user_action, task_id }
interface ActivityEntry { id, user_id, actor, action, task_id, task_title_snapshot, metadata }
```

## Recurring Tasks Subsystem

Most complex feature. Key files: `src/lib/recurring.ts`, `src/lib/actions/recurring-tasks.ts`.

- **Schedule logic** (`recurring.ts`): `shouldGenerateToday(rule, date)` checks if a date matches the rule's frequency/interval/days. `getNextDueDate(rule, afterDate)` finds the next occurrence (capped at 366 iterations).
- **Instance generation** (`generateRecurringInstances()`): called on page load, iterates all active rules, auto-skips stale past-due instances, inserts today's instance if schedule matches. Idempotent via unique dedup index `(recurring_task_id, due_date)` — duplicate inserts are silently ignored.
- **Archiving a rule**: soft-archives the rule + marks all future pending instances as "skipped"
- **Feature flag**: `recurring-tasks` (currently 100% rollout)
- **Management UI**: `/settings/recurring` page with `recurring-gate.tsx` (flag check) and `recurring-management-list.tsx`
