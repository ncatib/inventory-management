---
name: saas-sidebar-redesign
description: Redesign this Vue 3 app's shell into a modern SaaS-style interface - a vertical left navigation sidebar (collapsible to an icon rail, mobile drawer, grouped sections, profile block at the bottom) replacing the top nav bar, with consistent spacing tokens and a polished professional look. Use this skill whenever the user asks to redesign the UI, modernize the layout, move the navigation to a sidebar or left nav, replace the top bar or header nav, make the app look like a SaaS dashboard, or fix inconsistent spacing and styling across the app, even if they do not say "sidebar" or name this skill.
---

# SaaS Sidebar Redesign

Turns the Factory Inventory Management client (`client/src/`) from a top-nav layout into a SaaS-style app shell: persistent left sidebar, a clean content area, and a shared spacing and color system. The job is a **shell and styling change**. Data loading, filters, routing and i18n behavior must come out unchanged.

Read `references/sidebar-patterns.md` before writing code. It holds the component, composable and CSS patterns this skill relies on.

## Ground rules (from this repo's CLAUDE.md and the user)

- **Delegate every create or significant `.vue` edit to the `vue-expert` subagent.** This is a mandatory repo rule. Give it the full brief from this skill (target layout, tokens, pitfalls below), not a one-liner, because it does not see this file.
- Keep the repo's component style: `export default { setup() { ... } }` with the Composition API, scoped styles, and unique `v-for` keys (route path, never index).
- Slate/gray palette, status colors green/blue/yellow/red, **no emojis in the UI**. Icons are inline SVG (there is no icon library, and adding one is out of scope).
- Add a short comment wherever logic is non-obvious (collapsed-state persistence, breakpoint handling, dropdown re-anchoring). Skip comments on obvious code.
- The repo is public. Do not commit anything, and do not touch `client/.npmrc` or add `client/package-lock.json`.
- Do not change `api.js`, composables other than the new sidebar one, router paths, or any view's data logic.

## Workflow

### 1. Survey (read-only, do this yourself)

Read `client/src/App.vue`, `main.js`, `components/FilterBar.vue`, `ProfileMenu.vue`, `LanguageSwitcher.vue`, and `locales/en.js` + `ja.js` (the `nav` block). Confirm the facts below still hold, because the repo moves. If something differs, follow the code, not this list.

Known facts at the time of writing:
- `App.vue` renders `<header class="top-nav">` (70px, sticky), then `<FilterBar />`, then `<main class="main-content">`. Global (non-scoped) shared classes live in `App.vue`: `.card`, `.stat-card`, `.page-header`, `table`, `.badge`, `.loading`, `.error`.
- `FilterBar` is `position: sticky; top: 70px`. That number is the old header height.
- `ProfileMenu` and `LanguageSwitcher` open a dropdown with `position: absolute; top: calc(100% + 0.5rem); right: 0`, designed for a top-right corner.
- Modals are `position: fixed` with `z-index` 2000 (TasksModal 1000). Dropdowns are 1000.
- The "Reports" nav label is hardcoded English; every other label uses `t('nav.*')`.
- `views/Backlog.vue` is not routed. Do not add it to the sidebar.

### 2. Define the design tokens

Add CSS custom properties on `:root` in `App.vue`'s global style block (see the reference for the full set): a 4px-based spacing scale, radii, shadows, sidebar widths, and the existing slate palette promoted to named variables. Then use the tokens for the shell and for the shared classes in `App.vue` (`.main-content`, `.page-header`, `.card`, `.stat-card`, `table`, `.badge`).

Scope discipline matters here. Dashboard.vue alone is 1,271 lines. Restyling every view wholesale is risky and hard to review, so keep view-level changes to a light consistency pass (page header spacing, card gutters) unless the user explicitly asks for more.

### 3. Build the sidebar

Create `components/AppSidebar.vue` and `composables/useSidebar.js` per the reference. Required behavior:

| Behavior | Detail |
|---|---|
| Layout | Brand block at top, scrollable grouped nav in the middle, footer with language switcher and profile menu pinned to the bottom |
| Groups | Overview / Operations (Inventory, Orders, Demand Forecast) / Insights (Finance, Reports). Group labels are i18n keys |
| Active state | Highlight the current route using the existing `$route.path` approach or `router-link-exact-active`. Set `aria-current="page"` |
| Collapse | Toggle between full width and a 64px icon rail. Labels and group headings hide, icons stay, each item gets a `title` and `aria-label` so the rail is usable. Persist the choice in `localStorage` inside try/catch, because storage can throw in private windows |
| Mobile drawer | At or below the breakpoint the sidebar is off-canvas. A slim top bar with a menu button opens it over a backdrop. It closes on route change, on backdrop click and on Escape |
| Footer controls | Move `LanguageSwitcher` and `ProfileMenu` here and keep their events (`show-profile-details`, `show-tasks`) wired through to `App.vue` unchanged |

### 4. Rewire `App.vue`

- `.app` becomes a horizontal flex container: `<AppSidebar />` then a column wrapper holding `<FilterBar />` and `<main>`.
- The column wrapper needs `min-width: 0`. Without it, wide tables and SVG charts stretch the flex child and push the whole page sideways instead of scrolling inside `.table-container`.
- Remove the old `.top-nav`, `.nav-container`, `.logo`, `.nav-tabs` rules once nothing references them. Grep before deleting.
- Keep the task logic and modal wiring in `setup()` exactly as it is.

### 5. Fix the things that silently break

These are the regressions this redesign is most likely to cause. Check each one explicitly.

1. **FilterBar offset.** Change `top: 70px` to `top: 0` on desktop. On mobile, set it to the mobile top bar height. If you skip this, the filter bar sticks 70px below the top and leaves a gap with content scrolling through it.
2. **Dropdown direction.** A dropdown that opens downward from the sidebar footer runs off the bottom of the screen. Re-anchor it from the sidebar with `:deep(.dropdown-menu)` so it opens upward (full sidebar) or to the right (icon rail, where there is only 64px of width). Do not edit the two components just for this. Also keep `overflow: hidden` off the sidebar root and off the footer, or the dropdown gets clipped. Only the nav list scrolls.
3. **Z-index order.** Sidebar and drawer must sit below modals (1000-2000). Use sidebar 100, backdrop 800, drawer 900. If a modal appears behind the sidebar, this is why.
4. **i18n.** Add `nav.reports` plus the group labels and collapse/expand labels to **both** `en.js` and `ja.js`, and replace the hardcoded "Reports". Japanese labels are usually longer or shorter than English, so check that the full-width sidebar does not truncate them (use `text-overflow: ellipsis` as a fallback).
5. **Sticky table header.** `Spending.vue` has a sticky `thead` inside its own scroll container. It should keep working as is. Verify rather than assume.
6. **100vh on mobile.** Use `100dvh` with a `100vh` fallback for the sidebar height, or the footer hides under the mobile browser toolbar.

### 6. Polish pass

Consistency is the point of the "polished" requirement, so apply it deliberately rather than per-component:

- One page rhythm: content padding from tokens, `.page-header` title and subtitle spacing identical on every view, cards separated by the same gap.
- One elevation language: 1px slate border plus at most a subtle shadow. Hover states change border color, not layout.
- Focus rings on every interactive element (`:focus-visible`), because removing the old nav also removes its default outlines.
- Transitions of 150-200ms on width, background and transform only. Honor `prefers-reduced-motion`.

### 7. Verify

Verification is part of the job; a layout change that was never looked at is not done.

1. `cd client && npm run build` must pass.
2. Use the Playwright MCP tools (`mcp__playwright__*`, as the repo requires) against `http://localhost:3000`. If the dev servers are not running, start them per the root CLAUDE.md first. If the Playwright server is unavailable, say so plainly and fall back to the build check plus a written manual checklist for the user. Do not claim visual verification you did not do.
3. Check at three sizes: desktop (~1440px) expanded, desktop collapsed, and mobile (~390px) with the drawer open and closed. On each: navigate every route, confirm the active highlight, change a filter and confirm data reloads, open the profile menu, language switcher and Tasks modal, and confirm nothing renders behind the sidebar.
4. Switch language to Japanese and re-check the sidebar.
5. Report what was verified and what was not. Surface any pre-existing problems you noticed but did not fix (for example, API task endpoints that 404) without folding them into this change.

## What good looks like

A user opens the app and sees a left sidebar with the brand at the top, grouped navigation with a clearly highlighted current page, and their profile at the bottom. The content area has a consistent gutter and header on every page. Collapsing the sidebar gives an icon rail with the content reflowing smoothly. On a phone the sidebar disappears behind a menu button. Every existing feature behaves exactly as before.
