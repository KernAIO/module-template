---
'@kernhq/module-template': minor
---

Show how a module fills a workspace created with example content.

`demo: { seed }` is the extension point; the kernel subscribes it for you. The example is deliberately
two rows and a guard, because the guard is the part a module author has to get right: delivery is
at-least-once, so a seeder can be asked twice for one workspace, and the check is "is this workspace
empty?" rather than a marker somebody has to maintain.
