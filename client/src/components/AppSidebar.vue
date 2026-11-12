<template>
  <!-- Mobile top bar: only visible at or below the 900px breakpoint -->
  <div class="mobile-bar">
    <button
      type="button"
      class="icon-btn"
      :aria-label="t('nav.openMenu')"
      :aria-expanded="isMobileOpen"
      aria-controls="app-sidebar"
      @click="openMobile"
    >
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 5h14M3 10h14M3 15h14" />
      </svg>
    </button>
    <span class="mobile-brand">{{ t('nav.companyName') }}</span>
  </div>

  <div v-if="isMobileOpen" class="sidebar-backdrop" @click="closeMobile"></div>

  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ collapsed: isCollapsed, 'mobile-open': isMobileOpen }"
    :aria-label="t('nav.primary')"
  >
    <div class="sidebar-brand">
      <div class="brand-mark" aria-hidden="true">{{ brandInitial }}</div>
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
          :aria-current="$route.path === item.to ? 'page' : null"
          :title="isCollapsed ? t(item.labelKey) : null"
          :aria-label="isCollapsed ? t(item.labelKey) : null"
        >
          <!-- v-html is safe: icon strings are static constants defined in this file -->
          <span class="nav-icon" aria-hidden="true" v-html="item.icon"></span>
          <span class="nav-label">{{ t(item.labelKey) }}</span>
        </router-link>
      </div>
    </nav>

    <!-- No overflow here: the dropdowns inside must not be clipped -->
    <div class="sidebar-footer">
      <LanguageSwitcher />
      <ProfileMenu
        @show-profile-details="$emit('show-profile-details')"
        @show-tasks="$emit('show-tasks')"
      />
      <button
        type="button"
        class="collapse-btn"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? t('nav.expand') : t('nav.collapse')"
        :title="isCollapsed ? t('nav.expand') : null"
        @click="toggleCollapsed"
      >
        <svg class="collapse-icon" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 5l-5 5 5 5" />
        </svg>
        <span class="nav-label">{{ isCollapsed ? t('nav.expand') : t('nav.collapse') }}</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useSidebar } from '../composables/useSidebar'
import LanguageSwitcher from './LanguageSwitcher.vue'
import ProfileMenu from './ProfileMenu.vue'

const svg = (paths) =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

// Static nav definition; item.to doubles as the unique v-for key
const groups = [
  {
    id: 'overview',
    labelKey: 'nav.groupOverview',
    items: [
      { to: '/', labelKey: 'nav.overview', icon: svg('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>') }
    ]
  },
  {
    id: 'operations',
    labelKey: 'nav.groupOperations',
    items: [
      { to: '/inventory', labelKey: 'nav.inventory', icon: svg('<path d="M10 2.5l7 3.5v8l-7 3.5-7-3.5V6z"/><path d="M3 6l7 3.5L17 6M10 9.5V17.5"/>') },
      { to: '/orders', labelKey: 'nav.orders', icon: svg('<rect x="4" y="3" width="12" height="14" rx="1.5"/><path d="M7 7.5h6M7 10.5h6M7 13.5h3.5"/>') },
      { to: '/demand', labelKey: 'nav.demandForecast', icon: svg('<path d="M3 15l4.5-4.5 3 3L17 6.5"/><path d="M12.5 6.5H17V11"/>') }
    ]
  },
  {
    id: 'insights',
    labelKey: 'nav.groupInsights',
    items: [
      { to: '/spending', labelKey: 'nav.finance', icon: svg('<rect x="2.5" y="5" width="15" height="11" rx="2"/><path d="M2.5 8.5h15"/><circle cx="13.5" cy="12" r="1"/>') },
      { to: '/reports', labelKey: 'nav.reports', icon: svg('<path d="M5 2.5h6.5L16 7v10a.5.5 0 01-.5.5h-10.5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z"/><path d="M11 2.5V7h5M7.5 11h5M7.5 14h5"/>') }
    ]
  }
]

export default {
  name: 'AppSidebar',
  components: { LanguageSwitcher, ProfileMenu },
  emits: ['show-profile-details', 'show-tasks'],
  setup() {
    const { t } = useI18n()
    const route = useRoute()
    const { isCollapsed, isMobileOpen, toggleCollapsed, openMobile, closeMobile } = useSidebar()

    const brandInitial = computed(() => (t('nav.companyName') || '').trim().charAt(0).toUpperCase())

    // Close the drawer after navigating so it never covers the new page
    watch(() => route.path, closeMobile)

    const onKeydown = (event) => {
      if (event.key === 'Escape' && isMobileOpen.value) closeMobile()
    }
    onMounted(() => document.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

    return {
      t,
      groups,
      brandInitial,
      isCollapsed,
      isMobileOpen,
      toggleCollapsed,
      openMobile,
      closeMobile
    }
  }
}
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh; /* dvh keeps the footer clear of mobile browser toolbars */
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: 100; /* below dropdowns and modals, which live above 1000 */
  transition: width var(--ease);
  /* No overflow here: it would clip the footer dropdowns */
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  min-height: 72px;
}

.brand-mark {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.015em;
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.brand-name,
.brand-sub,
.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Only the nav list scrolls */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3);
}

.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.nav-group + .nav-group {
  margin-top: var(--space-5);
}

.nav-group-label {
  padding: 0 var(--space-3) var(--space-2);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  margin-bottom: 2px;
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  transition: background var(--ease), color var(--ease);
}

.nav-item:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}

.nav-item.active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-flex;
}

.collapse-btn,
.icon-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-muted);
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--ease), color var(--ease);
}

.collapse-btn:hover,
.icon-btn:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}

.collapse-icon {
  flex-shrink: 0;
  transition: transform var(--ease);
}

.sidebar.collapsed .collapse-icon {
  transform: rotate(180deg);
}

.nav-item:focus-visible,
.collapse-btn:focus-visible,
.icon-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Footer controls fill the sidebar width */
.sidebar-footer :deep(.language-switcher .language-button),
.sidebar-footer :deep(.profile-menu .profile-button) {
  width: 100%;
  border-radius: var(--radius-md);
}

.sidebar-footer :deep(.language-label),
.sidebar-footer :deep(.profile-name) {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer :deep(.language-button:focus-visible),
.sidebar-footer :deep(.profile-button:focus-visible) {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Dropdowns were designed for a top-right corner. From the footer they open
   upward, aligned to the sidebar's left edge, so they stay on screen. */
.sidebar-footer :deep(.dropdown-menu) {
  top: auto;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: auto;
  min-width: 220px;
}

/* Mobile bar and backdrop exist only on small screens */
.mobile-bar,
.sidebar-backdrop {
  display: none;
}

.mobile-brand {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-ink);
}

/* Icon rail applies on desktop only; the mobile drawer always shows labels */
@media (min-width: 901px) {
  .sidebar.collapsed {
    width: var(--sidebar-width-collapsed);
  }

  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .brand-text,
  .sidebar.collapsed .nav-group-label,
  .sidebar.collapsed .sidebar-footer :deep(.language-label),
  .sidebar.collapsed .sidebar-footer :deep(.profile-name),
  .sidebar.collapsed .sidebar-footer :deep(.chevron) {
    display: none;
  }

  .sidebar.collapsed .sidebar-brand {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  .sidebar.collapsed .nav-item,
  .sidebar.collapsed .collapse-btn {
    justify-content: center;
    padding: var(--space-3);
  }

  .sidebar.collapsed .sidebar-nav {
    padding-left: var(--space-2);
    padding-right: var(--space-2);
  }

  .sidebar.collapsed .sidebar-footer {
    padding-left: var(--space-2);
    padding-right: var(--space-2);
  }

  .sidebar.collapsed .sidebar-footer :deep(.language-button),
  .sidebar.collapsed .sidebar-footer :deep(.profile-button) {
    justify-content: center;
    padding: var(--space-2);
  }

  /* The rail is only 64px wide, so dropdowns open to the right instead */
  .sidebar.collapsed .sidebar-footer :deep(.dropdown-menu) {
    bottom: 0;
    left: calc(100% + var(--space-3));
  }
}

@media (max-width: 900px) {
  /* Collapsing is a desktop-only preference; it is meaningless in the drawer */
  .collapse-btn {
    display: none;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    position: sticky;
    top: 0;
    z-index: 90;
    height: var(--mobile-bar-height);
    padding: 0 var(--space-4);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--sidebar-width);
    max-width: 85vw;
    transform: translateX(-100%);
    /* delay hiding until the slide-out finishes */
    transition: transform var(--ease), visibility 0s linear 180ms;
    z-index: 900;
    visibility: hidden; /* keeps off-canvas links out of the tab order */
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    visibility: visible;
    transition: transform var(--ease), visibility 0s;
    box-shadow: var(--shadow-md);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: 800;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-item,
  .collapse-icon {
    transition: none;
  }
}
</style>
