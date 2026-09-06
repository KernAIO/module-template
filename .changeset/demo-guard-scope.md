---
'@kernhq/module-template': patch
---

Scope the example seeder's guard to the workspace, and import `eq`.

The guard left `workspace_id` to row-level security, which is exactly the mistake the template
should not be teaching: the transaction is bound to the workspace, so RLS scopes it on a
correctly-configured instance and silently does not on one whose owner can bypass a policy. Every
first-party seeder had the same defect and every workspace after the first was created empty.
