---
'@kernhq/module-template': patch
---

Make `0001_rls.sql` replayable, and ship the migration test that proves it

`create policy` has no `if not exists`, so applying the migration folder a second time answered
`policy "notes_ws_isolation" for table "notes" already exists`. A module's migrations are the first
thing the kernel runs, so that is a host service that never binds its port — not a broken feature.
The policy is now preceded by `drop policy if exists`, as it is in every first-party module.

`src/server/migrations.test.ts` is new and ships in the tarball. It applies the folder to a database
created from nothing, applies it again, and asks the Postgres catalogue which tables carrying
`workspace_id` are actually secured — so a tenant table added without a policy fails by name rather
than being silently readable. It needs a `DATABASE_URL` it can create databases from; CI already
starts one.
