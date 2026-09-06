import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq } from 'drizzle-orm'
import {
  MODULE_ID,
  templateCapabilities,
  templateContract,
  templateEvents,
  templatePermissions,
} from '../contract.js'
import { defineModule, defineServerModule, implement_, packageVersion } from './_impl.js'
import { notes, schema } from './schema.js'

export const templateModule = defineServerModule({
  definition: defineModule({
    id: MODULE_ID,
    name: 'Template',
    version: packageVersion(import.meta.url),
    description: 'Example module',
    icon: 'puzzle',
    permissions: templatePermissions,
    capabilities: templateCapabilities,
    events: templateEvents,
  }),
  /** Attached so the developer panel can check the router against what was promised. */
  contract: templateContract,
  schema,
  migrationsFolder: join(dirname(fileURLToPath(import.meta.url)), '../../migrations'),
  router: implement_,

  /**
   * What this module puts in a workspace created with "Fill it with example content" ticked.
   *
   * The kernel subscribes this for you; you never write the subscription. Three rules, and the
   * first one is the one that bites: **check that the workspace is empty and return early if it is
   * not.** Delivery is at-least-once, so the seeder can be asked twice for one workspace, and
   * dropping a second set of rows into somebody's data is worse than seeding nothing. Write through
   * your own tables or services, never into another module's schema, and anchor dates to `ctx.now`
   * so the content still reads as recent a year from now.
   *
   * `ctx.actor` is a service principal carrying the workspace owner's `userId`: it passes your
   * permission checks, and what it writes is authored by the person who asked.
   */
  demo: {
    seed: async ({ kernel, workspaceId, actorId, now }) => {
      return kernel.database.withWorkspace(
        workspaceId,
        async (tx) => {
          /*
           * The guard, and the one thing about it that is easy to get wrong: `workspace_id` is in
           * the predicate rather than left to row-level security. The transaction is bound to the
           * workspace, so RLS scopes this on a correctly-configured instance — and on one whose
           * owner can bypass a policy it does not, so the guard sees another workspace's rows and
           * reports this one as used. It then does nothing, quietly, for ever.
           */
          const [existing] = await tx
            .select({ id: notes.id })
            .from(notes)
            .where(eq(notes.workspaceId, workspaceId))
            .limit(1)
          if (existing) return { skipped: true }
          const rows = [
            { title: 'A note', body: 'Made when this workspace was created with example content.' },
            { title: 'Another note', body: 'Delete these two whenever you like — they are ordinary rows.' },
          ]
          await tx
            .insert(notes)
            .values(rows.map((r) => ({ workspaceId, title: r.title, body: r.body, createdAt: now })))
          return { created: { notes: rows.length } }
        },
        { userId: actorId },
      )
    },
  },

  /**
   * What this module reacts to. The pattern may be an exact name, `module.*`, or `*`; handlers are
   * durable consumers in production, so one that throws is retried rather than lost.
   */
  subscriptions: {
    'core.workspace.created': async (event, kernel) => {
      kernel.log.info({ module: MODULE_ID, event: event.name }, 'a workspace was created')
    },
  },
})
export default templateModule
