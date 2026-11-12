import { ref } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

// localStorage can throw (private windows, blocked site data), so the sidebar
// must fall back to the expanded default instead of failing to render.
const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch (err) {
    return false
  }
}

// Module-level refs so any component shares one sidebar state, like useFilters.
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

  const openMobile = () => {
    isMobileOpen.value = true
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile
  }
}
