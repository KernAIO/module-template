import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { TENANT_TABLES } from './schema.js'

/**
 * The migration folder, applied to a database created from nothing — and then applied again.
 *
 * **Copy this file into your module and keep it.** Every first-party Kern module carries one, and
 * it guards two failures that nothing else in a module's suite can see. Neither is hypothetical;
 * both have taken a Kern service down.
 *
 * 1. **A migration that throws stops the whole host service, not just your module.** The kernel
 *    migrates every module at boot, in one process, before it binds a port — so a module whose SQL
 *    fails does not degrade its own feature, it takes the other modules in that service with it.
 *    `core` hosts five.
 * 2. **A tenant table with no policy is simply readable.** Row-level security is hand-written (see
 *    `migrations/0001_rls.sql`), so forgetting it on a new table is a silent, valid schema. The
 *    only honest audit is to ask the Postgres catalogue what actually exists, which is what the
 *    last test here does.
 *
 * A **replay** is what reaches the first failure, and it is not an unusual event: drizzle keys
 * applied migrations by content hash, so editing any file in the folder — or regenerating
 * `migrations/meta/_journal.json`, which gives every entry a `when` newer than the rows already in
 * `mod_template.__migrations` — makes drizzle apply files it has applied before. `create policy` and
 * `add constraint` have no `if not exists` at all; `create table` and `create index` do not get one
 * unless you write it.
 *
 * Four things here are deliberate, and each of them is a way this test could be vacuously green:
 *
 * 1. **A scratch database, created here.** Running against a database somebody has already migrated
 *    proves nothing, and the dev database is the worst case of all — its schema predates whatever
 *    you are about to add, so it answers questions about a shape that no longer exists.
 * 2. **Calling `migrateModule` twice would not do.** The second call reads `__migrations`, sees the
 *    work is recorded and returns without running a statement. Only replaying the SQL itself
 *    reaches the failure.
 * 3. **Every statement is executed separately and every failure collected**, rather than throwing on
 *    the first. Guarding one statement and re-running tells you only about the next one; collecting
 *    them says how much of the folder is actually unguarded.
 * 4. **The catalogue is asked what tables exist**, rather than the assertion being written against
 *    the list of tables somebody remembered. A table nobody classified is the thing that goes
 *    unsecured, and a list cannot report what is missing from it.
 *
 * Note what this test deliberately does **not** claim. A replayed `create table if not exists`
 * reports success and changes nothing — so this proves the folder is *survivable*, never that a
 * rewritten migration was *effective*. Add a migration rather than editing one that has run
 * anywhere real.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS = join(HERE, '../../migrations')
const SCHEMA = 'mod_template'

/**
 * A real Postgres, never a mock — the failures above live in the catalogue, so a fake would agree
 * with whatever the code believes. CI starts one as a service container (`.github/workflows/ci.yml`)
 * and addresses it as 127.0.0.1, because a runner resolves `localhost` to ::1 first.
 */
const BASE_URL = process.env.DATABASE_URL ?? 'postgres://kern:kern@localhost:5432/kern'
const DB_NAME = `kern_template_replay_${Date.now().toString(36)}`

let admin: pg.Client
let db: pg.Client

/**
 * The tables in `mod_template` that carry `workspace_id` and deliberately have no policy, each with
 * the reason and the code that isolates them instead.
 *
 * It is empty, and it should stay empty in most modules: a tenant table gets a policy. Adding a name
 * here is a decision somebody records, never a way to make a red test green — the entry has to name
 * the code a reader can go and look at, the way `module-tracker`'s two entries do.
 *
 * What belongs here: a table holding no tenant content whose `workspace_id` is only an id, read by
 * something that has no workspace bound by construction — a scheduled job woken by a clock, or a
 * public token that must be resolved to a workspace before an RLS-bound transaction can be opened.
 *
 * What does not: a table that was awkward to police, or one whose queries all happen to carry a
 * `where workspace_id = …` today. Hand-written `where` clauses are what RLS exists to survive.
 * If the table serves every workspace at once, the answer is a second policy admitting the `'*'`
 * sentinel — not an entry here.
 */
const UNSECURED_BY_DESIGN: Record<string, string> = {}

/** The folder in the order the kernel applies it — by filename, which is why they are numbered. */
function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

/**
 * Apply one file statement by statement, returning every failure rather than the first.
 *
 * `--> statement-breakpoint` is drizzle's separator. Splitting on it is also why nothing in this
 * folder may use a dollar-quoted body: a breakpoint inside `do $$ … end $$` cuts the function in
 * half, and the error is `unterminated dollar-quoted string`, which does not sound like what it is.
 */
async function apply(file: string): Promise<Array<{ statement: string; error: string }>> {
  const sql = readFileSync(join(MIGRATIONS, file), 'utf8')
  const failures: Array<{ statement: string; error: string }> = []
  for (const raw of sql.split('--> statement-breakpoint')) {
    const statement = raw.trim()
    if (!statement || statement.split('\n').every((l) => l.trim().startsWith('--'))) continue
    try {
      await db.query(statement)
    } catch (err) {
      failures.push({
        statement: statement.slice(0, 120).replace(/\s+/g, ' '),
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return failures
}

beforeAll(async () => {
  admin = new pg.Client({ connectionString: BASE_URL })
  await admin.connect()
  await admin.query(`create database "${DB_NAME}"`)
  const url = new URL(BASE_URL)
  url.pathname = `/${DB_NAME}`
  db = new pg.Client({ connectionString: url.toString() })
  await db.connect()
}, 120_000)

afterAll(async () => {
  await db?.end().catch(() => undefined)
  await admin?.query(`drop database if exists "${DB_NAME}" with (force)`).catch(() => undefined)
  await admin?.end().catch(() => undefined)
}, 60_000)

describe('the migration folder', () => {
  it('applies to a database created from nothing', async () => {
    for (const file of migrationFiles()) {
      expect(
        await apply(file),
        `${file}: a migration that has only ever run against your dev database has not been tested`,
      ).toEqual([])
    }
  })

  it('applies a second time, because a replay must not take down the host service', async () => {
    for (const file of migrationFiles()) {
      expect(
        await apply(file),
        `${file}: a module migration that throws takes down every module in the host service`,
      ).toEqual([])
    }
  })

  it('leaves exactly one of every policy after the replay', async () => {
    const { rows } = await db.query<{ tablename: string; policyname: string }>(
      `select tablename, policyname from pg_policies where schemaname = $1`,
      [SCHEMA],
    )
    // Pairs, not a count per table: "one policy per table" is the wrong invariant — a table may
    // legitimately carry several — and a duplicate pair is exactly what a replay produces.
    const seen = rows.map((r) => `${r.tablename}.${r.policyname}`)
    expect([...new Set(seen)].sort(), 'a duplicate pair is what a replay produces').toEqual(seen.sort())
    for (const table of TENANT_TABLES)
      expect(seen, `${SCHEMA}.${table} has its policy`).toContain(`${table}.${table}_ws_isolation`)
  })

  /**
   * The question the assertion above cannot ask.
   *
   * It looks at the policies that exist, so a table with **no** policy at all is never looked at and
   * passes by being invisible. That is not a hypothetical gap: twelve unsecured tenant tables across
   * the first-party Kern modules went uncounted while every module's migration test was green
   * (measured on a database created from nothing, 2026-09-06).
   *
   * So this asks the catalogue the other way round, and in three directions:
   *
   * - every table in `mod_template` carrying a `workspace_id` column has RLS **enabled**, **forced**
   *   and at least one policy — unless it is named in `UNSECURED_BY_DESIGN` with the code that
   *   isolates it instead. Force matters on its own: without it the table's owner, which is the
   *   service's role, bypasses every policy on it;
   * - an entry in `UNSECURED_BY_DESIGN` that has since been given a policy must be deleted, so the
   *   list decays rather than telling the next reader a secured table is unprotected;
   * - a tenant table in neither `TENANT_TABLES` nor `UNSECURED_BY_DESIGN` fails, so adding one is a
   *   decision somebody records rather than an omission nobody sees.
   *
   * Restricting to tables that carry `workspace_id` is what makes this possible without tripping
   * over drizzle's own `__migrations`, which has no such column.
   *
   * `relkind in ('r','p')` on purpose: a partitioned parent is filed as `'p'`, so an `'r'`-only
   * query looks straight past it and reports nothing while it does so. A catalogue filter is an
   * assertion about what exists — the rows it excludes are invisible in its output, which makes an
   * audit that under-selects look exactly like an audit that found nothing wrong.
   */
  it('secures every table that carries a workspace column, or names it as an exception', async () => {
    const { rows } = await db.query<{
      relname: string
      enabled: boolean
      forced: boolean
      policies: number
      partition: boolean
    }>(
      `select c.relname,
              c.relrowsecurity as enabled,
              c.relforcerowsecurity as forced,
              (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies,
              c.relispartition as partition
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = $1
          and c.relkind in ('r', 'p')
          and exists (select 1 from pg_attribute a
                       where a.attrelid = c.oid and a.attname = 'workspace_id' and not a.attisdropped)
        order by c.relname`,
      [SCHEMA],
    )
    // Without this the whole assertion passes on an empty result — a schema that failed to build
    // looks identical to a schema in which everything is secured.
    expect(rows.length, 'no tenant table found at all — the schema did not build').toBeGreaterThan(0)

    const unsecured = rows.filter((r) => !r.enabled || !r.forced || r.policies === 0).map((r) => r.relname)
    expect(
      unsecured.filter((t) => !(t in UNSECURED_BY_DESIGN)),
      'carries workspace_id, has no forced policy, and is not declared an exception',
    ).toEqual([])

    expect(
      Object.keys(UNSECURED_BY_DESIGN).filter((t) => !unsecured.includes(t)),
      'declared an exception and now secured — delete the entry',
    ).toEqual([])

    // Partitions are excluded: `TENANT_TABLES` names the parent, not the months.
    const classified = new Set<string>([...TENANT_TABLES, ...Object.keys(UNSECURED_BY_DESIGN)])
    expect(
      rows.filter((r) => !r.partition && !classified.has(r.relname)).map((r) => r.relname),
      'carries workspace_id but is in neither TENANT_TABLES nor UNSECURED_BY_DESIGN',
    ).toEqual([])
  })
})
