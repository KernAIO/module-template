import { defineClientModule } from '@kernhq/ui'
import { t, templateMessageBundles } from './i18n.js'
import { TEMPLATE_CAPABILITIES, TEMPLATE_PERMISSIONS } from './permissions.js'

/**
 * This module as the shell sees it.
 *
 * Everything the interface offers is declared here — navigation, routes, commands, widgets,
 * settings pages, sidebars, presenters — and the shell renders whatever it finds. There are no
 * route files in the app to keep in step: deleting this package removes the feature completely,
 * which is the test of whether something is a module at all.
 *
 * Two gates, answering different questions:
 *
 * - `permission` — may *this person* reach it. Somebody else in the workspace may well see it.
 * - `capability` — does *this workspace* have the feature. Nobody sees it when off, and the API
 *   behind it answers 404 rather than 403.
 *
 * Both are filters, never a disabled state: a contribution that cannot be used is not rendered.
 *
 * Labels are **getters** because a module is defined once at import time while the interface
 * language can change afterwards. Reading them on render keeps the rail in the language chosen.
 */
export const templateClientModule = defineClientModule({
  id: 'template',
  name: 'Template',
  icon: 'file-text',
  messages: templateMessageBundles,

  nav: [
    {
      id: 'template',
      get label() {
        return t('nav')
      },
      icon: 'file-text',
      href: '/template',
      order: 50,
      permission: TEMPLATE_PERMISSIONS.view,
      capability: TEMPLATE_CAPABILITIES.notes,
    },
  ],

  /**
   * Routes are declarations, not files. `:name` matches one segment and reaches the component as
   * `params.name`; specificity decides ties, literal segments first — so `/template/settings` beats
   * `/template/:id` and a note somebody titled "settings" cannot shadow a real page.
   */
  routes: [
    {
      path: '/template',
      component: () => import('./pages/NotesPage.svelte'),
      get title() {
        return t('title')
      },
      permission: TEMPLATE_PERMISSIONS.view,
      capability: TEMPLATE_CAPABILITIES.notes,
    },
  ],

  commands: [
    {
      id: 'template.open',
      get label() {
        return t('nav')
      },
      icon: 'file-text',
      permission: TEMPLATE_PERMISSIONS.view,
      run: (ctx) => ctx.navigate('/template'),
    },
  ],

  widgets: [
    {
      id: 'template.recent',
      get title() {
        return t('widget_title')
      },
      get description() {
        return t('widget_desc')
      },
      icon: 'file-text',
      permission: TEMPLATE_PERMISSIONS.view,
      sizes: ['m', 'l'],
      defaultSize: 'm',
      order: 50,
      settings: [
        {
          kind: 'number',
          key: 'limit',
          get label() {
            return t('common.setting_rows')
          },
          default: 5,
          min: 3,
          max: 20,
        },
      ],
      component: () => import('./widgets/NotesWidget.svelte'),
    },
  ],

  /**
   * An overlay is the one thing a module renders that a navigation does not destroy.
   *
   * Everything above lives inside a page: open an issue and the route, its sidebar and its widgets
   * are unmounted. An overlay is mounted once when the workspace opens and unmounted when it
   * closes, so it is where anything that must not be interrupted goes — a call in progress, an
   * upload, a countdown, a banner about work happening elsewhere. It is gated like every other
   * contribution, and it is torn down on a workspace switch and on sign-out.
   *
   * Two rules worth having before writing one. It is mounted on *every* page of the workspace, so
   * an overlay that always paints is a permanent band across the product: render nothing until
   * there is something to say. And it is handed `workspaceId` and `workspaceSlug` and no location,
   * because the route it was mounted on is not the route the person is on now — read `navigation`
   * from `@kernhq/ui` if it needs to know.
   *
   * Delete this comment if the module has nothing to keep.
   */
  // overlays: [
  //   {
  //     id: 'template.banner',
  //     component: () => import('./overlay/Banner.svelte'),
  //     permission: TEMPLATE_PERMISSIONS.view,
  //     capability: TEMPLATE_CAPABILITIES.notes,
  //   },
  // ],

  /**
   * A settings page's `id` is its URL: the shell mounts a workspace-scope page at
   * `/<ws>/settings/<moduleId>/<id>`, and one whose id equals the module id at
   * `/<ws>/settings/<moduleId>`. Declaring it is the whole wiring.
   *
   * Delete this if the module has nothing to configure.
   */
  settingsPages: [],
})

export default templateClientModule
