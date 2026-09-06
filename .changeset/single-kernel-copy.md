---
'@kernhq/module-template': patch
---

Resolve a single `@kernhq/kernel` copy

The template pulled two kernels into a consumer's tree: `@kernhq/testing@0.1.12` declared a
`@kernhq/kernel: ^0.9.0` it never imported, and `@kernhq/ui@0.14.0` depends on `^0.9.0` too. With
the module's own kernel at `^0.10.3`, both floors are raised so everything resolves one copy —
`@kernhq/testing` to `^0.1.14`, which dropped the phantom dependency, and `@kernhq/ui` to `^0.14.4`,
which depends on `^0.10.2`.

Two structurally identical declarations of `ServerModule` are not assignable to each other, so a
duplicate kernel is a type error in whatever hosts the module — and it is invisible in the umbrella
workspace, which pins one copy regardless.
