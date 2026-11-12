# Sidebar patterns

Reference for the `saas-sidebar-redesign` skill. These are starting points to adapt to the current code, not files to paste blindly. They follow the repo's component style (`export default { setup() }`).

## Contents
- Design tokens
- `useSidebar` composable
- `AppSidebar.vue` structure
- Sidebar CSS
- `App.vue` layout
- Dropdown re-anchoring
- i18n keys
- Icons

## Design tokens

Put in `App.vue`'s global `<style>` block. Values come from the palette already in use (`#0f172a`, `#64748b`, `#e2e8f0`, `#2563eb`), so the look stays continuous.

```css
:root {
  /* 4px-based spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;

  --color-ink: #0f172a;
  --color-text: #334155;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --color-surface: #ffffff;
  --color-bg: #f8fafc;
  --color-hover: #f1f5f9;
  --color-accent: #2563eb;
  --color-accent-soft: #eff6ff;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);

  --sidebar-width: 256px;
  --sidebar-width-collapsed: 64px;
  --mobile-bar-height: 56px;
  --ease: 180ms ease;
}
```

## `useSidebar` composable

Module-level refs so any component can read the state, matching how `useFilters` works. `localStorage` is wrapped because it can throw (private windows, blocked storage) and the sidebar must still render.

```javascript
// composables/useSidebar.js
import { ref } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch (err) {
    return false
  }
}

const isCollapsed = ref(readStored())
const isMobileOpen = ref(false)

export function useSidebar() {
  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
    try {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
    } catch (err) {
      // Storage unavailable: the choice just will not persist across reloads
    }
  }

  const openMobile = () => { isMobileOpen.value = true }
  const closeMobile = () => { isMobileOpen.value = false }

  return { isCollapsed, isMobileOpen, toggleCollapsed, openMobile, closeMobile }
}
```

Collapse state applies to desktop only. The drawer is always full width, so the template should not add the collapsed class while the drawer is shown (handle this in CSS with the media query, below).

## `AppSidebar.vue` structure

Data-driven nav so adding a page is one line. Keys are the route path (unique and stable).

```vue
<template>
  <!-- Mobile top bar: only visible at or below the breakpoint -->
  <div class="mobile-bar">
    <button class="icon-btn" :aria-label="t('nav.openMenu')" @click="openMobile">
      <!-- menu icon svg -->
    </button>
    <span class="mobile-brand">{{ t('nav.companyName') }}</span>
  </div>

  <div v-if="isMobileOpen" class="sidebar-backdrop" @click="closeMobile"></div>

  <aside
    class="sidebar"
    :class="{ collapsed: isCollapsed, 'mobile-open': isMobileOpen }"
    :aria-label="t('nav.primary')"
  >
    <div class="sidebar-brand">
      <div class="brand-mark">{{ brandInitial }}</div>
      <div class="brand-text">
        <span class="brand-name">{{ t('nav.companyName') }}</span>
        <span class="brand-sub">{{ t('nav.subtitle') }}</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div v-for="group in groups" :key="group.id" class="nav-group">
        <div class="nav-group-label">{{ t(group.labelKey) }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: $route.path === item.to }"
          :title="isCollapsed ? t(item.labelKey) : null"
          :aria-label="t(item.labelKey)"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ t(item.labelKey) }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-footer">
      <LanguageSwitcher />
      <ProfileMenu
        @show-profile-details="$emit('show-profile-details')"
        @show-tasks="$emit('show-tasks')"
      />
      <button class="collapse-btn" :aria-expanded="!isCollapsed" @click="toggleCollapsed">
        <!-- chevron svg; rotate 180deg when collapsed -->
        <span class="nav-label">{{ t(isCollapsed ? 'nav.expand' : 'nav.collapse') }}</span>
      </button>
    </div>
  </aside>
</template>
```

Script notes:
- `groups` is a plain constant: Overview (`/`), Operations (`/inventory`, `/orders`, `/demand`), Insights (`/spending`, `/reports`), each with `labelKey` and an inline SVG string in `icon`. `v-html` is safe here because the SVG strings are static constants in this file, never user data. Say so in a comment.
- Watch `$route.path` (via `useRoute()`) and call `closeMobile()` so the drawer shuts after navigation.
- Add a `keydown` listener for Escape in `onMounted` / remove in `onBeforeUnmount`.
- Declare `emits: ['show-profile-details', 'show-tasks']`.
- Keep `ProfileMenu` and `LanguageSwitcher` registered in `components`; remove them from `App.vue` once moved.

## Sidebar CSS

```css
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;               /* dvh avoids the footer hiding under mobile browser toolbars */
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 100;                 /* below dropdowns (1000) and modals (1000-2000) */
  transition: width var(--ease);
}
.sidebar.collapsed { width: var(--sidebar-width-collapsed); }

.sidebar-brand { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-5) var(--space-4); }
.brand-mark {
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-ink); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.875rem;
}

/* Only the nav scrolls. The footer must stay overflow-visible or its dropdowns get clipped. */
.sidebar-nav { flex: 1; overflow-y: auto; padding: var(--space-2) var(--space-3); }
.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  display: flex; flex-direction: column; gap: var(--space-2);
}

.nav-group + .nav-group { margin-top: var(--space-5); }
.nav-group-label {
  padding: 0 var(--space-3) var(--space-2);
  font-size: 0.6875rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--color-muted);
}

.nav-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-size: 0.9375rem; font-weight: 500; text-decoration: none;
  transition: background var(--ease), color var(--ease);
}
.nav-item:hover { background: var(--color-hover); color: var(--color-ink); }
.nav-item.active { background: var(--color-accent-soft); color: var(--color-accent); }
.nav-item:focus-visible,
.collapse-btn:focus-visible,
.icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

.nav-icon { width: 20px; height: 20px; flex-shrink: 0; display: inline-flex; }
.nav-label, .brand-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Icon rail: hide text, center icons */
.sidebar.collapsed .nav-label,
.sidebar.collapsed .brand-text,
.sidebar.collapsed .nav-group-label { display: none; }
.sidebar.collapsed .nav-item { justify-content: center; padding: var(--space-3); }
.sidebar.collapsed .sidebar-brand { justify-content: center; padding-left: 0; padding-right: 0; }

/* Mobile: off-canvas drawer + slim top bar */
.mobile-bar, .sidebar-backdrop { display: none; }

@media (max-width: 900px) {
  .mobile-bar {
    display: flex; align-items: center; gap: var(--space-3);
    position: sticky; top: 0; z-index: 90;
    height: var(--mobile-bar-height);
    padding: 0 var(--space-4);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }
  .sidebar {
    position: fixed; left: 0; top: 0;
    width: var(--sidebar-width);       /* drawer ignores the collapsed width */
    transform: translateX(-100%);
    transition: transform var(--ease);
    z-index: 900;
  }
  .sidebar.mobile-open { transform: translateX(0); box-shadow: var(--shadow-md); }
  /* Undo icon-rail styling so the drawer always shows labels */
  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .brand-text,
  .sidebar.collapsed .nav-group-label { display: revert; }
  .sidebar-backdrop {
    display: block; position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.4); z-index: 800;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar, .nav-item { transition: none; }
}
```

Because the mobile bar is a sibling of the sidebar, it needs to sit inside the content column (or be given `order`) so it stacks above the page on small screens. Render it from `App.vue`'s column wrapper if the layout calls for it.

## `App.vue` layout

```vue
<div class="app">
  <AppSidebar
    @show-profile-details="showProfileDetails = true"
    @show-tasks="showTasks = true"
  />
  <div class="app-body">
    <FilterBar />
    <main class="main-content"><router-view /></main>
  </div>
  <!-- ProfileDetailsModal and TasksModal unchanged -->
</div>
```

```css
.app { display: flex; min-height: 100vh; }
/* min-width: 0 lets wide tables and charts scroll inside their own container
   instead of stretching this flex child and the whole page. */
.app-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.main-content { flex: 1; width: 100%; max-width: 1600px; margin: 0 auto; padding: var(--space-6) var(--space-8); }

@media (max-width: 900px) {
  .app { flex-direction: column; }
  .main-content { padding: var(--space-4); }
}
```

In `FilterBar.vue` change `top: 70px` to `top: 0` (and `top: var(--mobile-bar-height)` inside the 900px media query). Remember this file edit also goes through `vue-expert`.

## Dropdown re-anchoring

The two components anchor their dropdown below and to the right of the trigger. In the sidebar footer, scoped styles in `AppSidebar.vue` can override that with `:deep()`, leaving the components untouched:

```css
/* Full sidebar: open upward, aligned to the left edge of the footer */
.sidebar-footer :deep(.dropdown-menu) {
  top: auto;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: auto;
  min-width: 220px;
}
/* Icon rail is only 64px wide, so open to the side instead */
.sidebar.collapsed .sidebar-footer :deep(.dropdown-menu) {
  bottom: 0;
  left: calc(100% + var(--space-2));
}
```

If a dropdown still clips, look for an ancestor with `overflow` set. The footer and `.sidebar` root must not have one.

## i18n keys

Add to the `nav` block in **both** `locales/en.js` and `locales/ja.js`:

```javascript
// en
groupOverview: 'Overview',
groupOperations: 'Operations',
groupInsights: 'Insights',
reports: 'Reports',
primary: 'Primary navigation',
openMenu: 'Open menu',
collapse: 'Collapse',
expand: 'Expand',
```

Provide proper Japanese translations in `ja.js`; do not leave English strings there. Reuse existing keys (`nav.overview`, `nav.inventory`, `nav.orders`, `nav.demandForecast`, `nav.finance`) for the items.

## Icons

Inline SVG strings, 20x20, `stroke="currentColor"`, `fill="none"`, `stroke-width="1.75"`, rounded caps and joins, so they inherit the nav item color and stay crisp. One simple glyph per route: grid (Overview), box (Inventory), clipboard list (Orders), trending line (Demand Forecast), wallet or coins (Finance), document (Reports). No emojis and no icon font.
