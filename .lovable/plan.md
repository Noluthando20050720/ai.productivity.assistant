- AI Workplace Productivity Assistant

A session-only SaaS-style productivity app with three AI tools and a dashboard. No auth, no database, no persistence — refresh clears everything.

## Stack & Backend

- TanStack Start (existing template).
- Lovable AI Gateway (`google/gemini-3-flash-preview`) via a shared server provider helper.
- Streaming chat via `src/routes/api/chat.ts` + `useChat` (AI SDK UI).
- One-shot generation (email, schedule) via `createServerFn` in `src/lib/ai.functions.ts`.
- No Lovable Cloud, no tables, no localStorage. All state lives in React component state for the session.

## Design System

- Dark teal-blue SaaS palette defined as oklch tokens in `src/styles.css` (background near-white with deep teal `--primary`, teal accent, soft shadows, rounded-2xl cards).
- Typography: Inter-alternative pairing loaded via `<link>` in `__root.tsx` (e.g. Plus Jakarta Sans for headings, Inter for body) — registered in `@theme`.
- Shared UI: shadcn cards, buttons, inputs, textareas, selects, tabs, sidebar.
- Global AI disclaimer banner in the app shell footer: "AI-generated content may be inaccurate. Always review before use."

## Routes

```
src/routes/
  __root.tsx           # updated head metadata (real title/description), fonts, providers
  index.tsx            # Dashboard home (quick action cards + overview)
  email.tsx            # Smart Email Generator
  planner.tsx          # AI Task Planner / Scheduler
  chat.tsx             # AI Workplace Chat Assistant
  api/chat.ts          # streaming chat endpoint
```

Sidebar layout applied in `__root.tsx` via `SidebarProvider` wrapping `<Outlet />`, with a header containing `SidebarTrigger` on mobile. Sidebar items: Dashboard, Email, Planner, Chat.

## Feature 1 — Smart Email Generator (`/email`)

- Form inputs: Subject, Purpose/prompt (textarea), Tone (Formal / Friendly / Persuasive select), Additional instructions (optional).
- Submit calls `generateEmail` server function → returns `{ subject, body }`.
- Output shown in editable textareas (subject + body).
- Buttons: **Copy** (clipboard, toast confirmation), **Regenerate** (re-runs with same inputs), **Clear**.
- Loading state disables submit and shows shimmer.

## Feature 2 — AI Task Planner (`/planner`)

- Form inputs: Schedule type (Daily / Weekly tabs), Working hours (start + end time), Task list (dynamic add/remove rows with task name + priority High/Med/Low), Additional notes.
- Submit calls `generateSchedule` server function → returns a structured schedule (array of time blocks with task, duration, priority, break flag).
- Rendered as an editable table/list: user can edit task text and times inline.
- Buttons: **Copy** (plain-text export), **Regenerate**, **Clear**.
- Prompt instructs the model to prioritize High tasks earlier, include realistic short breaks and a lunch break, and fit within working hours.

## Feature 3 — Workplace Chat Assistant (`/chat`)

- Full-height chat surface built with AI Elements (`conversation`, `message`, `prompt-input`, `shimmer`).
- `useChat` + `DefaultChatTransport({ api: "/api/chat" })`, messages held in memory only.
- Empty state shows suggested prompt chips: "Write a professional email", "Plan my day", "Prioritise my tasks", "Help me prepare for a meeting", "Brainstorm ideas" — clicking one sends it.
- Assistant messages rendered as markdown via `MessageResponse`.
- "New conversation" button clears in-memory messages.
- No thread list, no persistence (matches user's "no saved history" requirement).

## Dashboard (`/`)

- Hero header with app name and short description.
- Three large quick-action cards linking to Email, Planner, Chat — each with icon, title, one-line description, and CTA button.
- Small "How it works" strip: session-only, no signup, review before using.
- Disclaimer card at bottom.

## Server Functions & Endpoints

`src/lib/ai-gateway.server.ts` — shared Lovable AI Gateway provider (per `ai-sdk-lovable-gateway` guidance).

`src/lib/ai.functions.ts`:

- `generateEmail({ subject, purpose, tone, instructions })` — uses `generateText` with `Output.object` for `{ subject, body }` (kept minimal, no schema bounds).
- `generateSchedule({ scheduleType, workingHours, tasks, notes })` — uses `generateText` with `Output.object` for `{ blocks: [{ time, title, priority, isBreak }] }` guarded by the `NoObjectGeneratedError` fallback.

`src/routes/api/chat.ts` — streams responses with a workplace-productivity system prompt.

Ensure `LOVABLE_API_KEY` exists (create via `ai_gateway--create` if missing).

## Responsive Layout

- Sidebar collapses to icon rail on tablet, off-canvas with trigger on mobile.
- Dashboard cards: 3-col desktop → 2-col tablet → 1-col mobile.
- Forms use single-column stacked layout on mobile; two-column grid for short fields on desktop.
- Chat fills viewport height minus header; composer sticks to bottom.

## Explicit Exclusions

No auth, profiles, database, saved history/templates, meeting summarisation, or any persistence — matching the brief.

## Verification

- Typecheck/build passes.
- Manually exercise each of the three tools in preview (send a test prompt to each) and confirm streaming + copy + regenerate work.