# EFFICIENT — MVP+1 Product Requirements Document

*Version 2.1 · MVP+1 · March 2026*

> **Builds on top of:** Efficient MVP v1.6 (shipped). All existing features, data models, and infrastructure carry forward unchanged unless explicitly noted in this document.

## 1. Overview

MVP+1 extends Efficient with 8 new features driven by early user feedback. The release focuses on three themes: smarter task capture (image upload), better task management (recurring tasks, filters, search), user control (settings, scratch pad clearing, archiving), and first-time experience (onboarding).

No changes to the existing tech stack. New AI calls use the same OpenRouter integration already in place, upgraded to a vision-capable model for image parsing.

## 2. MVP+1 Feature List

| Item | Detail | Status |
|------|--------|--------|
| **F0** | Navigation Refactor — bottom nav on mobile, left sidebar on desktop | Shipped (Phase 1) |
| **F1** | Image → Batch Task Upload — add tasks by uploading or photographing a task list | Deferred |
| **F2** | Recurring Tasks — daily, weekly, monthly tasks that auto-regenerate | Deferred (needs redesign) |
| **F3** | Filters — filter by due date in Upcoming; filter overdue in Today | Partially shipped (Phase 2) |
| **F4** | Search — real-time task search across all sections | Shipped (Phase 2) |
| **F5** | Settings Menu — notification time config + archiving preferences | Shipped (Phase 3) |
| **F6** | Clear Scratch Pad — one-tap full clear with confirmation | Shipped (Phase 2) |
| **F7** | Completed Task Archiving — auto and manual archive options | Shipped (Phase 3) |
| **F8** | Onboarding — welcome message + 2-3 tips for new users | Shipped (Phase 2) |

## 3. Feature Specifications

### F0 — Navigation Refactor — SHIPPED

The current top tab bar is replaced with a responsive navigation system: bottom nav on mobile, left sidebar on desktop. This is built first so all subsequent features are developed on the correct layout.

**Mobile (below lg breakpoint)**

- Bottom nav bar fixed to the bottom of the screen with safe-area insets
- 4 items: To-do, Scratch Pad, Summary, Settings — each with an icon and a short label
- Active tab highlighted with primary color
- Top tab bar removed entirely

**Desktop (lg breakpoint and above)**

- Left sidebar, always expanded (224px) — icons + labels always visible (no collapse)
- "Efficient" app name at the top of the sidebar
- 4 nav items: To-do, Scratch Pad, Summary, Settings
- User email + logout button pinned to the bottom of the sidebar
- Main content area fills the remaining width (offset with `lg:pl-56`)

**Implementation notes**

- Tailwind breakpoints only — `lg:` prefix to show/hide each nav variant
- No JS-based device detection
- Bottom nav hidden on lg+; left sidebar hidden below lg
- No changes to routing, data fetching, or feature logic — layout change only
- Icons used: CheckSquare, StickyNote, BarChart3, Settings, LogOut (lucide-react)

### F1 — Image → Batch Task Upload — DEFERRED

Deferred to a future release. Requires vision-capable AI model integration.

The existing 'Add a task' input is extended with an image attachment option. Users can type a task as before, or switch to image mode to upload or photograph a task list. Both entry points live in the same add-task UI — they are not separate flows.

**Entry points**

- Camera roll / file picker — standard file input, accepts `image/*` on all platforms
- Camera capture — uses `capture='environment'` on mobile to open the camera directly
- A small image icon sits alongside the existing task input field to toggle image mode

**Image parsing flow**

1. User attaches or captures an image
2. A loading state is shown ('Reading your task list...')
3. Image is sent to the AI (vision-capable model) with the extraction prompt
4. AI returns a list of extracted tasks with titles and optional due dates
5. A review screen appears showing all extracted tasks at once
6. Each task card is individually editable — title (inline) and due date (date picker)
7. User can dismiss individual tasks (X button per card)
8. 'Add all remaining' button bulk-adds all non-dismissed tasks to the to-do list
9. All added tasks are logged to activity_log with source = 'image_upload'

**Review screen behaviour**

- Shown as a modal or full-screen overlay on mobile
- Each card mirrors the scratch pad suggestion card UI for consistency
- 'Add all' is disabled if all cards have been individually dismissed
- If AI extracts zero tasks, show: 'No tasks found in this image. Try a clearer photo.'
- Duplicate prevention: same logic as scratch pad — title + due date match check

**AI model note**

The existing Nemotron model does not support vision. Image parsing requires upgrading to a vision-capable model on OpenRouter (e.g. google/gemini-flash-1.5 or meta-llama/llama-3.2-11b-vision-instruct:free). The text-based scratch pad parsing can remain on the existing model. Two model configs will exist in the codebase.

### F2 — Recurring Tasks — DEFERRED (needs redesign)

Deferred to a future release. An initial implementation was attempted and reverted due to complexity around instance auto-generation. Key lessons learned:

- Auto-generation on page load causes duplicates from concurrent requests (dev server hot-reload, multiple tabs)
- Any generation logic must be idempotent — check for existing instances before inserting (deduplicate by chain + due_date)
- Task completion and instance generation must be fully separate concerns
- Recurring chains must survive archival and deletion of individual instances
- Safety caps are essential on any loops that generate tasks
- A cron job or dedicated API endpoint is more reliable than running mutations in a server component render

These lessons should inform the redesign. The original spec below is preserved for reference but will need revision.

**Supported intervals (MVP+1)**

- Daily — regenerates every day
- Weekly — regenerates on the same day of the week
- Monthly — regenerates on the same date each month

**Creating a recurring task**

- In the manual add-task flow, a 'Repeat' toggle appears below the due date picker
- Toggling it on shows a dropdown: Daily / Weekly / Monthly
- Due date is required when setting a recurrence — prompt user if not set

**Missed recurrence behaviour**

- When a recurring task is past due and not completed, the app detects this on page load
- A prompt appears: 'You missed [task name] due on [date]. Did you complete it, or skip it?'
- Complete — marks the instance as done, generates the next occurrence
- Skip — discards the missed instance, generates the next occurrence from today
- If multiple recurring tasks were missed, prompt for each one sequentially

**Data model changes**

| Column | Type | Notes |
|--------|------|-------|
| `recurrence_interval` | text | null \| 'daily' \| 'weekly' \| 'monthly' |
| `recurrence_parent_id` | uuid (FK) | References the original task — null for the first instance |

When a recurring task completes or is skipped, a new tasks row is inserted with the next due date and `recurrence_parent_id` pointing to the original task. The original task is marked completed as normal.

### F3 — Filters — PARTIALLY SHIPPED

Lightweight filtering within the existing Today and Upcoming sections of the to-do list. Filters do not add new tabs or navigation — they appear as pill selectors within each section header.

**Today section filters — SHIPPED**

- All (default) — shows everything due today + overdue
- Overdue — shows only tasks past their due date (not due today)
- Due Today — shows only tasks due exactly today

**Upcoming section filters — PARTIALLY SHIPPED**

- All (default) — shows all future-dated and Someday tasks
- Someday — shows only undated tasks
- ~~Date filter — a date picker lets users select a specific date; only tasks due on that date are shown~~ **NOT SHIPPED — deferred**

**Behaviour**

- Active filter is highlighted as a selected pill (primary/10 background)
- Filters reset to 'All' on page reload — they are not persisted
- Empty filter results show: 'No tasks match this filter'

### F4 — Search — SHIPPED

A search input in the to-do list tab that filters tasks in real time across all three sections (Today, Upcoming, Completed) as the user types.

**Behaviour**

- Search bar sits above the task sections, collapsed by default behind a search icon
- Tapping the icon expands the input with autofocus
- Matching is case-insensitive and partial — 'den' matches 'dentist appointment'
- All three sections update simultaneously as the user types
- Section headers remain visible even if a section has no matching tasks (shows empty state within that section)
- Clearing the search input or tapping X restores the full list
- Search is client-side only — no API calls, no persistence

### F5 — Settings Menu — SHIPPED

A new Settings tab housing user preferences. Ships with two preference groups: notification times and archiving. Built to be easily extensible for future preferences.

**Notification time preferences**

- Morning check-in time — custom TimeSelect component with hour (0-23) and minute (00, 15, 30, 45) dropdowns
- Evening check-in time — same component
- Changes save on button click to `profiles.morning_notification_time` and `profiles.evening_notification_time`
- Confirmation message "Saved!" appears after save

**Archiving preferences**

> **Note:** The UI uses "clear" terminology instead of "archive" for user-friendliness, but the underlying mechanism is archiving (setting `archived_at` timestamp, not deleting).

- Auto-clear dropdown — off by default. Options: Disabled, After 7 days, After 14 days, After 30 days
- Manual clear button — "Clear all completed tasks" with a confirmation dialog
- Confirmation dialog text: "Clear completed tasks? This will permanently remove all completed tasks from your list. Cleared tasks cannot be viewed or restored."
- Result message shows count: "Cleared X completed task(s)."
- Both options can coexist — auto-archive runs on page load; manual is always available

**What shipped differently from the original spec:**

- Uses "clear" terminology instead of "archive" throughout the UI
- Auto-archive options are 7, 14, 30 days (60-day option from original spec was not included)
- Timezone note below time pickers was not included

**Settings page structure (extensible)**

```
Notifications
  Morning check-in time
  Evening check-in time

Tasks
  Clear completed tasks (auto + manual)

[Future preference groups go here]
```

### F6 — Clear Scratch Pad — SHIPPED

A single 'Clear' button on the scratch pad that wipes all content instantly after confirmation.

**Behaviour**

- Button sits in the scratch pad toolbar alongside the existing 'Suggest tasks' and 'Add tasks' buttons (uses Trash2 icon)
- Tapping it opens a confirmation dialog: "Clear your scratch pad? This will remove all text and suggestions. This can't be undone."
- Confirming clears the content field, updates both `content` and `last_processed_content` to empty string in Supabase, and clears the suggestions array
- Dismissing the dialog does nothing
- Disabled when content is already empty or a save is in progress

**What shipped differently from the original spec:**

- Activity logging for `scratchpad_cleared` was not implemented — the clear action is not logged to activity_log

### F7 — Completed Task Archiving — SHIPPED

Archived tasks are removed from the main to-do list view but remain in the database for future reference. MVP+1 does not include an 'archived tasks' view — that can come in a later release.

**Data model changes**

| Column | Table | Type | Notes |
|--------|-------|------|-------|
| `archived_at` | tasks | timestamptz | Nullable — set when task is archived |
| `auto_archive_days` | profiles | integer | Nullable — number of days before auto-archive |

**Auto-archive**

- Runs on each page load if `auto_archive_days` is set in the user's profile
- Queries for completed tasks where `completed_at < now() - interval` (user's setting)
- Sets `archived_at = now()` on matching tasks
- Archived tasks are excluded from all to-do list queries (`WHERE archived_at IS NULL`)
- Runs silently (no UI notification)

**Manual archive**

- "Clear all completed tasks" button in Settings
- Confirmation dialog shown before action
- On confirm: sets `archived_at = now()` on all completed tasks for the user
- Returns count for UI feedback
- Logged to activity_log with action = 'tasks_archived', metadata includes count

### F8 — Onboarding — SHIPPED

A lightweight first-time experience shown once to new users immediately after signup. Minimal — a welcome message and 2-3 tips. No multi-step wizard, no forced actions.

**Trigger**

- Shown once, on first app load after account creation
- Tracked via `profiles.onboarding_completed` (boolean, default false)
- Once dismissed, `onboarding_completed = true` and the modal never shows again
- Checked in the app layout — modal only renders when `onboarding_completed = false`

**Content (as shipped)**

> **Welcome to Efficient!**
>
> Here's how to get started:
>
> 1. **Add tasks** — type a task and pick a due date to get organized.
> 2. **Use the Scratch Pad** — dump your notes and let AI extract tasks for you.
> 3. **Stay on track** — enable notifications for morning and evening check-ins.
>
> **Get started** (dismiss button)

**Data model change**

| Column | Type | Notes |
|--------|------|-------|
| `onboarding_completed` | boolean | Default false. Set to true on dismiss. |

## 4. Data Model Changes Summary

All changes are additive — no existing columns or tables are modified.

**Shipped:**

| Item | Detail | Migration |
|------|--------|-----------|
| **profiles** | Add: `onboarding_completed` (boolean, default false) | `003_onboarding.sql` |
| **tasks** | Add: `archived_at` (timestamptz) | `004_archiving.sql` |
| **profiles** | Add: `auto_archive_days` (integer) | `004_archiving.sql` |
| **activity_log** | New action type: `tasks_archived` | — |

**Deferred (not in database):**

| Item | Detail | Reason |
|------|--------|--------|
| **tasks** | `recurrence_interval` (text), `recurrence_parent_id` (uuid FK) | F2 deferred — needs redesign |
| **activity_log** | Action types: `image_upload`, `scratchpad_cleared`, `recurrence_skipped` | F1 and F2 deferred; F6 logging not implemented |

## 5. Phased Build Plan

8 features across 6 phases. Each phase is a self-contained Claude Code session. Deploy to Vercel at the end of each phase before starting the next.

### Phase 1 — Navigation Refactor — SHIPPED

- Move tabs from top to bottom nav bar on mobile — 4 items: To-do, Scratch Pad, Summary, Settings
- Build left sidebar nav for desktop (lg breakpoint and above) — icons + labels always visible
- Left sidebar: To-do, Scratch Pad, Summary, Settings nav items
- Left sidebar: user email + logout button pinned to the bottom
- Use Tailwind breakpoints only — no JS-based device detection
- Bottom nav hidden on lg+; left sidebar hidden below lg
- Verify all 4 tabs navigate correctly on both mobile and desktop
- Deploy and test on iPhone (PWA) and desktop browser before proceeding

### Phase 2 — Quick Wins: Search, Filters, Clear Scratch Pad, Onboarding — SHIPPED

- F4: Add search bar to to-do list — client-side filtering across all sections
- F3: Add filter pills to Today and Upcoming section headers
  - Today filters (All, Overdue, Due Today): shipped
  - Upcoming filters: only All and Someday shipped; date picker filter deferred
- F6: Add Clear button to scratch pad toolbar with confirmation dialog
  - Activity logging for `scratchpad_cleared` not implemented
- F8: Add onboarding modal triggered on first login — add `onboarding_completed` to profiles
- Run Supabase migration for `profiles.onboarding_completed` (`003_onboarding.sql`)
- Deploy and test all 4 features end-to-end

### Phase 3 — Settings Menu + Archiving — SHIPPED

- F5: Build Settings tab/page with notification time pickers and archiving preferences
- Wire notification time pickers to `profiles.morning_notification_time` and `profiles.evening_notification_time` (already in DB)
  - Uses custom TimeSelect component with hour/minute dropdowns
  - Timezone note not included
- F7: Add `archived_at` column to tasks and `auto_archive_days` to profiles via migration (`004_archiving.sql`)
- Implement auto-archive on page load (check user setting, run query)
- Implement manual clear button in Settings (UI says "clear" instead of "archive")
  - Auto-archive options: 7, 14, 30 days (60-day option not included)
- Update all task queries to add `WHERE archived_at IS NULL`
- Log archive events to activity_log
- Deploy and test

### Phase 4 — Recurring Tasks — DEFERRED

Attempted and reverted. Needs redesign before re-attempting. See F2 spec and lessons learned above.

- Add `recurrence_interval` and `recurrence_parent_id` columns to tasks via migration
- Add 'Repeat' toggle + interval dropdown to manual add-task flow (requires due date)
- On task completion: if `recurrence_interval` is set, insert next task instance with correct due date
- On page load: detect missed recurring tasks (past due, not completed)
- Show missed recurrence prompt sequentially for each missed task
- Handle Complete and Skip responses — generate next occurrence in both cases
- Log recurrence events to activity_log
- Deploy and test with daily, weekly, and monthly tasks

### Phase 5 — Image → Batch Task Upload — DEFERRED

- Add vision-capable model config to OpenRouter integration (alongside existing text model)
- Extend add-task UI with image icon toggle — camera roll + camera capture
- Build image upload handler: convert to base64, send to vision model with extraction prompt
- Build review screen / modal: all extracted tasks shown at once, individually editable
- Implement bulk 'Add all' and individual dismiss per card
- Duplicate prevention: reuse existing scratch pad logic
- Log accepted tasks to activity_log with source = 'image_upload'
- Deploy and test with handwritten lists, app screenshots, and printed lists

### Phase 6 — Polish & Regression Testing — DEFERRED

- Mobile responsiveness pass on all new UI (Settings, image review modal, onboarding modal)
- Empty states and loading skeletons for new features
- Fix activity log DB constraint: update actor check constraint to include 'app'
- Regression test all MVP features still work correctly with new DB columns
- Test recurring tasks across timezone edge cases
- Test image upload on real iPhone (camera capture + camera roll)
- Final Vercel deploy and smoke test

## 6. AI Prompt — Image Task Extraction

New prompt for the vision model. Sent as a user message with the image attached as base64.

> You are a task extraction assistant. Look at this image — it may be a handwritten task list, a screenshot of a to-do app, a note, or any other task-related content. Extract all actionable tasks you can see. For each task, provide a concise title and an optional due date (YYYY-MM-DD) if one is visible or clearly implied. Today's date is {date}. Rules: Only extract clear, actionable tasks. Keep titles concise (under 80 characters). Only include a due_date if one is visible or strongly implied. Convert relative dates to absolute dates based on today. Return ONLY a valid JSON array: [{ title: string, due_date: string | null }]. No other text. If no tasks are found, return an empty array [].

## 7. Open Questions & Deferred to MVP+2

- AI behaviour learning / memory — data is being collected via ai_suggestions, feature deferred
- Archived tasks view — archive is write-only in MVP+1; a browsable archive screen comes later
- Recurring tasks from scratch pad — AI detection of recurring intent deferred to MVP+2
- Recurring task auto-generation strategy — page-load mutations proved unreliable; consider cron job or dedicated API endpoint
- Upcoming date picker filter — deferred from Phase 2
- Task categories / tags — deferred
- Priority levels — deferred
- Email digest as push notification fallback — deferred
- Multi-user / open sign-up — Supabase Auth already supports it; just needs a decision to open up

---

*Efficient MVP+1 PRD v2.1 · March 2026 · For use with Cursor + Claude Code*
