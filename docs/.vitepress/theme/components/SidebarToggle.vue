<script setup lang="ts">
// Collapsible docs sidebar control (desktop). The sidebar is OPEN by default;
// this tab + behaviours let it auto-hide:
//   • scroll the page           → close
//   • click/touch outside it     → close
//   • hover (or focus) the tab   → open
//   • click the tab              → toggle
//   • navigate to another page   → re-open (back to the default)
// Closing adds `ifx-sidebar-collapsed` to <html>; the slide + content reflow are
// in effects.css. Desktop only — on mobile the sidebar is VitePress's Menu drawer.
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vitepress';

const open = ref(true);            // open by default
const hasSidebar = ref(false);

function sync() {
  document.documentElement.classList.toggle('ifx-sidebar-collapsed', !open.value && hasSidebar.value);
}
function expand() { if (!open.value) { open.value = true; sync(); } }
function collapse() { if (open.value) { open.value = false; sync(); } }
function toggle() { open.value ? collapse() : expand(); }

function detect() { hasSidebar.value = !!document.querySelector('.VPSidebar'); sync(); }

const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 960;
// Navigation resets the scroll position, which fires a 'scroll' event; ignore
// scroll-close for a moment after each navigation so that reset doesn't re-close
// the just-reopened sidebar.
let suppressScroll = false;
function onScroll() { if (!suppressScroll && isDesktop() && open.value) collapse(); }
function onPointerDown(e: PointerEvent) {
  if (!isDesktop() || !open.value) return;
  const t = e.target as Element | null;
  if (t && (t.closest('.VPSidebar') || t.closest('.ifx-sb-toggle'))) return;
  collapse();
}

const router = useRouter();

onMounted(() => {
  requestAnimationFrame(detect);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('pointerdown', onPointerDown, true);
  // Reset to the default (open) on every navigation. Chain the router hook (the
  // reveal helper uses the same mechanism) so we don't clobber existing handlers.
  const prev = router.onAfterRouteChange;
  router.onAfterRouteChange = (to) => {
    prev?.(to);
    open.value = true;
    sync();
    suppressScroll = true;
    setTimeout(() => { suppressScroll = false; }, 700);
    requestAnimationFrame(detect);
  };
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  document.removeEventListener('pointerdown', onPointerDown, true);
});
</script>

<template>
  <button
    v-show="hasSidebar"
    class="ifx-sb-toggle"
    :class="{ 'is-open': open }"
    type="button"
    :aria-expanded="open"
    aria-label="Show or hide the navigation sidebar"
    @mouseenter="expand"
    @focus="expand"
    @click="toggle"
  >
    <span class="ifx-sb-toggle__chev" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.ifx-sb-toggle {
  position: fixed;
  top: calc(var(--vp-nav-height, 64px) + 50%);
  left: 0;
  transform: translateY(-50%);
  z-index: 61;                 /* above the sidebar (--vp-z-index-sidebar: 60) */
  width: 26px; height: 54px;
  display: grid; place-items: center;
  border: 1px solid var(--ifx-glass-border);
  border-left: none;
  border-radius: 0 10px 10px 0;
  background: color-mix(in srgb, var(--ifx-surface) 80%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--ifx-text-muted);
  cursor: pointer;
  box-shadow: 6px 0 22px -12px color-mix(in srgb, var(--ifx-brand) 55%, transparent);
  transition: left var(--ifx-dur-slow) var(--ifx-ease),
    color var(--ifx-dur-fast) var(--ifx-ease),
    border-color var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-sb-toggle:hover { color: var(--ifx-brand); border-color: color-mix(in srgb, var(--ifx-brand) 55%, transparent); }
.ifx-sb-toggle:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.ifx-sb-toggle__chev { display: grid; place-items: center; transition: transform var(--ifx-dur) var(--ifx-ease); }
/* Closed: tab at screen edge, chevron points right (›) to invite opening. */
.ifx-sb-toggle:not(.is-open) .ifx-sb-toggle__chev { transform: rotate(180deg); }
/* Open (default): tab rides the sidebar's right edge as a close handle. */
.ifx-sb-toggle.is-open { left: calc(var(--vp-sidebar-width, 272px) - 1px); }

@media (max-width: 959px) { .ifx-sb-toggle { display: none; } }
@media (prefers-reduced-motion: reduce) {
  .ifx-sb-toggle, .ifx-sb-toggle__chev { transition: none; }
}
</style>
