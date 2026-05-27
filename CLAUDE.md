# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repo.

## Project Overview

SC Session Tracker — a Star Citizen session tracker: users track aUEC balance changes, write captain's logs, and share adventures with friends. Auth is Discord OAuth via Supabase. **Public repo — never commit secrets; Supabase RLS is the real access control.**

## Commands

```bash
npm run dev      # Vite dev server (HMR)
npm run build    # tsc check + Vite production build
npm run lint     # ESLint (--max-warnings 0)
npm run preview  # Preview production build
```

## Tech Stack

React 18 + Vite (SWC) · TypeScript · TailwindCSS + shadcn/ui (Radix) · Zustand (client state) · React Query (server state) · Wouter (routing) · Recharts · Supabase (auth/db/storage).

## Architecture

- **Entry**: `src/main.tsx` (AuthProvider root) → `src/App.tsx` (routing + session management).
- **Key dirs**: `components/` (kebab-case files; `ui/` = shadcn base), `pages/` (friends, owner-dashboard), `contexts/` (Auth, Friend), `hooks/` (data + state), `lib/` (Supabase client, friend-system helpers), `services/` (auth, admin), `utils/`, `workers/` (`timer.worker.ts` runs the session timer off the main thread).

### Data flow
1. **Auth** — `AuthContext` holds user/profile via `authService`.
2. **Sessions/events** — `useDatabase` (CRUD).
3. **Captain logs** — `useCaptainLogs` (entries + images).
4. **Friends** — `FriendContext` + `lib/friend-system*.ts`.
5. **Owner gate** — `OwnerRoute` renders owner-only views when `user.id === VITE_OWNER_USER_ID`; admin stats/actions live in `services/admin.ts` + `useAdminStats`. Gating is client-side only — enforce real access in RLS.

### Types
- `src/types.ts` — core app + DB-response types (`Session`, `SessionEvent`, `CaptainLog`, `Db*`). Bare `@/types` / `../types` imports resolve here.
- `src/types/friend-system.ts` — friend/profile types.
- `src/types/supabase.ts` — generated DB types.

### Database (Supabase)
Tables: `profiles`, `sessions`, `events`, `captain_logs`, `log_images`, `friend_requests`, `friends`. Migrations in `supabase/migrations/`.

## Environment Variables

Required in `.env` (see `.env.example`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OWNER_USER_ID=
```
`VITE_APP_VERSION` is optional (defaults to `dev`). `VITE_*` vars are bundled into client JS — never put secrets there.

## Conventions

- kebab-case component filenames.
- Add loading + error states to data-fetching components.
- Prepare SQL for schema changes; don't run them directly.
- Never expose other users' usernames in code or UI.
