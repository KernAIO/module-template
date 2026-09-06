-- Row-level security. Hand-written, because drizzle-kit does not generate it.
--
-- This is the last line, not the first: the API already checks membership and permission. It exists
-- for the query that skips them — a job, a report, a mistake — and for anyone who reaches the
-- database another way. A tenant table without a policy is simply readable.
--
-- **Every statement here is idempotent, and that is not decoration.** A module's migrations are the
-- first thing the kernel runs, so one that throws does not break its own module — it takes down the
-- whole host service, and `core` hosts five. `create policy` has no `if not exists`, which is why an
-- explicit `drop policy if exists` precedes it. Replayed without that line, this file answered
-- `policy "notes_ws_isolation" for table "notes" already exists` (measured on a scratch database,
-- 2026-09-06), and a replay is not hypothetical: drizzle keys applied migrations by content hash, so
-- editing any file in this folder makes every file in it run again.
--
-- `@kernhq/kernel` exports `rlsPolicySql('mod_template', 'notes')`, which emits the four statements
-- below in this order, the drop included — since `@kernhq/kernel@0.10.3` (2026-09-06). Older kernels
-- emitted the other three, so a policy copied from one needs the drop added by hand.
-- `src/server/migrations.test.ts` is what proves the folder replays either way.
--
-- Superusers bypass RLS, so a database owned by one will pass a test that proves nothing: run the
-- application as a plain role.
alter table "mod_template"."notes" enable row level security;--> statement-breakpoint
alter table "mod_template"."notes" force row level security;--> statement-breakpoint
drop policy if exists "notes_ws_isolation" on "mod_template"."notes";--> statement-breakpoint
create policy "notes_ws_isolation" on "mod_template"."notes"
  using (workspace_id::text = current_setting('app.workspace_id', true))
  with check (workspace_id::text = current_setting('app.workspace_id', true));
