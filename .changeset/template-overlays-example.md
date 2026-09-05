---
'@kernhq/module-template': patch
---

The client module documents `overlays`, the contribution a navigation does not destroy.

Everything else the template declares — the route, the sidebar, the widget — lives inside a page,
so opening something else unmounts it. `@kernhq/kernel@0.10.2` adds `overlays` for the cases where
that is wrong: something in progress, an upload, a countdown. The example is commented out, because
a module with nothing to keep should ship no overlay rather than an empty one, and it names the two
rules that are easy to get wrong — an overlay is mounted on every page of the workspace, so it must
draw nothing until it has something to say, and it is handed no location, because the route it was
mounted on is not the route the person is on now.
