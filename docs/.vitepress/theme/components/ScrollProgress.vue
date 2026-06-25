<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const scaleX = ref(0);
let raf = 0;
let ticking = false;

function update() {
  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  scaleX.value = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
  ticking = false;
}
function onScroll() {
  if (!ticking) { ticking = true; raf = requestAnimationFrame(update); }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (raf) cancelAnimationFrame(raf);
});
</script>

<template>
  <div class="ifx-progress" aria-hidden="true">
    <div class="ifx-progress__bar" :style="{ transform: `scaleX(${scaleX})` }" />
  </div>
</template>

<style scoped>
.ifx-progress {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  z-index: 100;            /* above the VitePress nav */
  pointer-events: none;
}
.ifx-progress__bar {
  height: 100%;
  transform-origin: 0 50%;
  transform: scaleX(0);
  background: linear-gradient(90deg, var(--ifx-brand), var(--ifx-verified));
  box-shadow: 0 0 10px color-mix(in srgb, var(--ifx-brand) 60%, transparent);
  will-change: transform;
}
</style>
