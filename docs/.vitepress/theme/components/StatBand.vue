<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface Stat {
  value: number;
  suffix?: string;
  label: string;
  token?: 'brand' | 'verified' | 'evidence' | 'pending';
}

const props = withDefaults(
  defineProps<{ stats?: Stat[] }>(),
  {
    stats: () => [
      { value: 7, label: 'enforced stages, intent → anchor', token: 'brand' },
      { value: 10, label: 'cryptographic checks per proof', token: 'verified' },
      { value: 0, label: 'raw-transaction backdoors', token: 'evidence' },
      { value: 0, label: 'trusted nodes to verify a proof', token: 'pending' },
    ],
  },
);

const root = ref<HTMLElement | null>(null);
const shown = ref<number[]>(props.stats.map(() => 0));
let observer: IntersectionObserver | null = null;
let raf = 0;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function animate() {
  if (reduced()) {
    shown.value = props.stats.map((s) => s.value);
    return;
  }
  const start = performance.now();
  const dur = 1100;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    shown.value = props.stats.map((s) => Math.round(s.value * eased));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') { animate(); return; }
  observer = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) if (e.isIntersecting) { animate(); obs.disconnect(); }
    },
    { threshold: 0.4 },
  );
  if (root.value) observer.observe(root.value);
});
onBeforeUnmount(() => { observer?.disconnect(); if (raf) cancelAnimationFrame(raf); });
</script>

<template>
  <section ref="root" class="ifx-stats ifx-container" aria-label="Infrix by the numbers">
    <div
      v-for="(s, i) in stats"
      :key="i"
      class="ifx-stat ifx-reveal-up"
      :style="{ '--i': i }"
    >
      <div class="ifx-stat__num" :class="'tok-' + (s.token ?? 'brand')">
        {{ shown[i] }}<span v-if="s.suffix" class="ifx-stat__suffix">{{ s.suffix }}</span>
      </div>
      <div class="ifx-stat__label">{{ s.label }}</div>
    </div>
  </section>
</template>

<style scoped>
.ifx-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin: 40px auto 24px;
}
@media (max-width: 760px) { .ifx-stats { grid-template-columns: 1fr 1fr; gap: 14px; } }
.ifx-stat {
  padding: 22px 20px;
  border-radius: var(--ifx-r-md);
  background: color-mix(in srgb, var(--ifx-surface) 55%, transparent);
  border: 1px solid var(--ifx-glass-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.ifx-stat__num {
  font-family: var(--ifx-font-display);
  font-size: clamp(2.2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}
.ifx-stat__num.tok-brand { color: var(--ifx-brand); }
.ifx-stat__num.tok-verified { color: var(--ifx-verified); }
.ifx-stat__num.tok-evidence { color: var(--ifx-evidence); }
.ifx-stat__num.tok-pending { color: var(--ifx-pending); }
.ifx-stat__suffix { font-size: 0.55em; margin-left: 2px; }
.ifx-stat__label {
  margin-top: 10px;
  color: var(--ifx-text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}
</style>
