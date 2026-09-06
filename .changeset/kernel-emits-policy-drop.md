---
'@kernhq/module-template': patch
---

Require `@kernhq/kernel` ^0.10.3, whose `rlsPolicySql` emits the policy drop

`rlsPolicySql` omitted the `drop policy if exists` before its `create policy` until
`@kernhq/kernel@0.10.3`, so an author following the documented path got a policy that could not be
applied twice. The kernel is fixed; this raises the floor so a fresh checkout of the template
resolves a kernel where the helper and `migrations/0001_rls.sql` actually agree.

The floor is what makes it true rather than the range alone: `degit` copies `pnpm-lock.yaml`, and
pnpm does not re-resolve a version that still satisfies its range — so `^0.10.0` kept installing
0.10.0. The migration comment and README step 5 now say the helper emits all four statements, dated
to the kernel version that made it so.
