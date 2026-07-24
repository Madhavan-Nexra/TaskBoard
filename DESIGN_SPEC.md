# TaskBuddy Design Spec (for the frontend build)

Synthesized from reference mockups the user provided (a few competing variants of the same app — this spec picks the richest consistent version and merges the best parts). Build with Tailwind CSS utility classes; no external UI kit needed. Use the `Inter` font (system-ui fallback) throughout. Support light and dark mode via Tailwind's `class` dark mode strategy, toggled from Settings and persisted in `localStorage` + synced to `/api/settings`.

## Global layout

Top navbar, sticky, white bg (`dark:bg-slate-900`), bottom border `slate-200`/`slate-800`:
- Left: "TaskBuddy" logo — bold blue-600 wordmark (small checklist icon optional), links to Task Board.
- Center-left: nav links `Task Board`, `History`, `Settings` — active link is blue-600 + underline, inactive is slate-600.
- Right side, in order: a search input (`Quick find...` placeholder, magnifier icon, rounded-full, slate-100 bg) — only needs to be functional on Task Board/History; a bell icon with a small red notification dot; a solid blue-600 rounded-full "+ Add Task" button (navigates to the Add Task form); a circular user avatar (just a colored circle with the user's initial — no real image upload needed) that opens a small dropdown with "Sign out".

Page background: `bg-slate-50` (`dark:bg-slate-950`). Content max width ~1280px, centered, padded.

Cards: white (`dark:bg-slate-900`), `rounded-xl`, `border border-slate-200 dark:border-slate-800`, subtle `shadow-sm`, padding `p-5`/`p-6`.

## Page: Task Board (`/` and `/board`)

1. **Hero banner** — full width rounded-2xl card, soft blue gradient background (`from-indigo-50 to-blue-50`, dark: `from-slate-900 to-slate-800`). Left: heading "Welcome back, your tasks are ready" (2xl/3xl bold), subtext "Drag your missions from To-Do to Doing to Done and keep moving forward. Use TaskBuddy as your personal mission board for study, work, and future projects." Right: a simple decorative illustration — since we can't ship custom art, use a friendly inline SVG or emoji-based placeholder (a rounded square with a checklist/laptop icon) — keep it simple, don't overengineer.

2. **Stat cards row** — 5 equal-width cards: `Total Tasks`, `To-Do`, `Doing`, `Done`, `Overdue`. Each shows a small uppercase slate-500 label and a large bold number (blue-600 for To-Do/Total, amber/orange-600 for Doing, emerald-600 for Done, red-600 for Overdue). Data from `GET /stats/board`.

3. **Two toggle switches** above the columns: "Show only high priority" and "Hide completed" — simple Tailwind toggle switches, filter the board client-side.

4. **Kanban board** — 3 columns side by side (`grid grid-cols-1 md:grid-cols-3 gap-6`): **To-Do** (slate dot), **Doing** (blue dot, subtle red/pink tinted column background like the reference), **Done** (dark dot). Column header shows title + a pill badge with the count.
   - Each column is HTML5-draggable (`draggable` + `onDragStart`/`onDrop`) so a task card can be dragged to another column, calling `PATCH /tasks/{id}/status` on drop. Keep this simple — no external DnD library needed.
   - **Task card**: left colored border (4px) matching priority (red/orange=high, blue=medium, slate=low). Top row: priority pill (uppercase, tiny, tinted bg matching priority color) and a category pill (tinted per the category color mapping in API_CONTRACT.md) + a "⋮⋮" drag handle / kebab menu (menu: Edit, Delete, Mark complete). Bold title. Optional 1-2 line description in slate-500. If `status === "doing"` and `progress` is set, show a thin progress bar (blue fill) and small "Xh left" style text if `due_at` is set (compute remaining time). Bottom row: due date (calendar icon + formatted date, red text if overdue) and priority/assignee-style small avatar circle (use the user's initial since there's no multi-assignee data). Done-column cards show the title with `line-through text-slate-400` and a checkmark icon.
   - Clicking a card (not the drag handle) opens the Add/Edit Task page pre-filled for that task.

5. **Recent Activity** — full width card below the board, list of rows from `GET /activity/recent`, each with a small colored dot/icon by action type (created=blue plus icon, completed=green check, moved=blue arrow, deleted=slate trash), bold "You" + verb + *task title* in blue, and a relative timestamp on the right ("10 mins ago") — compute relative time client-side from `created_at`.

Also implement a lightweight overdue/today grouped list view as an alternate is NOT required — the Kanban view above is the single Task Board implementation. Keep scope to this one layout.

## Page: Add / Edit Task (`/tasks/new`, `/tasks/:id/edit`) — "Mission Planning"

Two-column layout (`grid grid-cols-1 lg:grid-cols-3 gap-6`), left column spans 2/3:

**Left: "Task Basics" card**
- Heading "Mission Planning" + subtext "Define your goals and structure your focus for the day."
- "Task Basics" card: `Mission Title` text input, `Description` textarea.
- `Priority` — 3-button segmented control: Low / Medium / High, selected = solid blue-600, others outlined.
- `Status` — 3-button segmented control: To-Do / Doing / Done.
- `Schedule` — a `datetime-local` input (label "Schedule").
- `Category` — pill buttons: Learning, Work, AI, Rocket, Personal (each with a small icon), selected = solid blue-600.
- Bottom: `Cancel` (outline button, navigates back) and `Save Mission` (solid blue-600, disk icon) which POSTs (create) or PUTs (edit) then navigates to the board.

**Right: "Mission Preview" card** — live preview of the task card exactly as it will render on the board (updates as the form changes), a small info box "This task will appear in: **<Status label>**", and a dashed-border "Pro tip" box with a short static contextual tip about categories. Include a "Discard Draft" text link under the preview that clears the form.

Keep the inspirational photo/illustration footer card optional/omit if time-constrained — do not spend effort sourcing real images; a simple gradient placeholder with a short caption ("Stay focused, stay buddy.") is enough if included at all.

## Page: History (`/history`)

- Heading "History" + subtext "All tasks you have completed."
- Filter bar card: range tabs `Today | This week | Last 30 days | All time` (active = solid blue-600 pill), a row of category filter pills (`All`, `Learning`, `Work`, `AI`, `Rocket`, `Personal` — active = light blue tinted), and a search input on the right ("Search completed tasks...").
- Main column (left, ~2/3 width): tasks grouped by completed date with a date header (e.g. "October 24, 2026") and a right-aligned relative label ("TODAY"/"YESTERDAY"). Each row: blue checkmark icon, title with strikethrough, category pill + "Completed <time>" + "Due <date>" in slate-500, and a "Reopen" outline button on the right that calls `POST /tasks/{id}/reopen` and removes it from the list (optimistic update).
- "Load older tasks" link/button at the bottom that increases the page size / date range fetched.
- Right sidebar (~1/3 width) "Stats" card: `Completed this week` (big number + "+N from last week" delta in blue), `Completed this month` (big number + a tiny 4-bar sparkline using `completed_last_8_weeks`), `Total Completed` (big number + a small medal/trophy icon), and a circular progress ring showing `Daily Goal` percent (SVG stroke-dasharray ring, blue over slate-200 track), with a small italic motivational quote caption underneath (static text is fine, e.g. "Success is the sum of small efforts, repeated day in and day out.").

## Page: Settings (`/settings`)

- Left: heading "Shape TaskBuddy to match your journey." + subtext "Adjust theme, notifications, and preferences so your board feels just right for you." Right: a simple illustration placeholder (again, keep simple/inline, don't overengineer).
- **Appearance card**: "Display Mode" row with a Light/Dark segmented toggle (sun/moon icons) that actually flips the app's Tailwind dark mode class immediately and persists via `PUT /settings {theme}`. A small "Theme Preview" swatch row (4 static color chips) is decorative — fine to include simply or omit, do not over-invest here.
- **Notifications card**: "Enable reminders" toggle switch, "Highlight overdue tasks" checkbox/toggle, "Sound on" toggle. Each change immediately PUTs to `/api/settings` (debounce not required, small app).
- Also include a "Daily goal" numeric input (tasks/day) feeding the History page's goal ring — put it in the Notifications/Preferences card since there's no dedicated section in the mockups.

## Auth pages `/login`, `/signup`

Not shown in the mockups — build simple, consistent centered cards: TaskBuddy logo, email + password fields, primary blue-600 submit button, and a link to the other page ("Don't have an account? Sign up"). Show inline error text from Supabase on failure. After signup, Supabase may require email confirmation depending on project settings — show a "Check your email to confirm your account" message if `data.session` is null after `signUp`.

## Interaction notes

- All list/board data fetches go through `src/lib/api.ts`, a thin fetch wrapper that adds the `Authorization` header from the current Supabase session and the JSON body/headers, and throws on non-2xx with the parsed `{detail}` message. On a 401 response, sign the user out and redirect to `/login`.
- Optimistic UI is a nice-to-have (e.g. drag-and-drop moves the card immediately, rolls back on error) but correctness over polish — a refetch-after-mutation approach is perfectly fine given the scope.
- Priority colors: high = red/orange-600, medium = blue-600, low = slate-500. Category colors: learning = amber-600, work = blue-600/slate, ai = violet-600, rocket = orange-600, personal = teal-600. Keep a single shared mapping (e.g. `src/lib/badges.ts`) used by task cards, the board, the history list, and the task form pills — don't duplicate the color logic per component.
