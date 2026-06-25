<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { SPINE_STAGES, SPINE_ARIA_SUMMARY } from '../data/spine';

const props = withDefaults(
  defineProps<{
    /** Run the looping pulse animation. Default true (hero). */
    animated?: boolean;
    /** Force the fully-revealed static variant (docs). Implies no pulse. */
    static?: boolean;
  }>(),
  { animated: true, static: false },
);

// Geometry (matches the viewBox below). Nodes are evenly spaced with a margin.
const VIEW_W = 1000;
const VIEW_H = 220;
const MARGIN_X = 70;
const NODE_Y = VIEW_H / 2;
const N = SPINE_STAGES.length;
const span = VIEW_W - MARGIN_X * 2;
const stepX = span / (N - 1);

const nodes = computed(() =>
  SPINE_STAGES.map((stage, i) => ({
    ...stage,
    x: MARGIN_X + stepX * i,
    y: NODE_Y,
    // Fraction (0–1) of the connector at which this node sits — drives reveal timing.
    t: i / (N - 1),
    index: i,
  })),
);

// One full loop of the pulse, in ms. Each node's reveal delay = t * LOOP_MS.
const LOOP_MS = 4200;

const root = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
let observer: IntersectionObserver | null = null;

// Whether the looping pulse should ever run. The static prop and reduced-motion both veto it.
// (Reduced-motion is also enforced in CSS as a hard guarantee, independent of JS.)
const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const wantsAnimation = computed(
  () => props.animated && !props.static && !prefersReduced,
);

onMounted(() => {
  if (!wantsAnimation.value || !root.value) return;

  // Pause when offscreen: only play while at least 25% of the diagram is visible.
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isPlaying.value = entry.isIntersecting;
      }
    },
    { threshold: 0.25 },
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

// CSS custom properties drive timing without inline keyframes per node.
const loopStyle = computed(() => ({ '--ifx-loop': `${LOOP_MS}ms` }) as Record<string, string>);
</script>

<template>
  <div
    ref="root"
    class="ifx-spine"
    :class="{ 'is-playing': isPlaying, 'is-static': static || !animated }"
    :style="loopStyle"
    role="img"
    :aria-label="SPINE_ARIA_SUMMARY"
  >
    <!-- Visually-hidden, screen-reader ordered-list equivalent of the diagram. -->
    <ol class="ifx-sr-only">
      <li v-for="stage in nodes" :key="stage.id">
        {{ stage.label }} — {{ stage.blurb }}
      </li>
    </ol>

    <svg
      class="ifx-spine__svg"
      :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <!-- Static connector baseline. -->
      <line
        class="ifx-spine__rail"
        :x1="MARGIN_X"
        :y1="NODE_Y"
        :x2="VIEW_W - MARGIN_X"
        :y2="NODE_Y"
      />

      <!-- Decorative travelling pulse. Animated via transform on the <g> (GPU). -->
      <g class="ifx-spine__pulse" aria-hidden="true">
        <circle :cx="MARGIN_X" :cy="NODE_Y" r="9" class="ifx-spine__pulse-core" />
        <circle :cx="MARGIN_X" :cy="NODE_Y" r="18" class="ifx-spine__pulse-halo" />
      </g>

      <!-- Nodes: ring + filled core + label + a tiny per-stage glyph. -->
      <g
        v-for="stage in nodes"
        :key="stage.id"
        class="ifx-spine__node"
        :class="`stage-${stage.id}`"
        :style="{
          '--node-color': stage.color,
          '--node-delay': `${(stage.t * LOOP_MS).toFixed(0)}ms`,
        }"
      >
        <circle :cx="stage.x" :cy="stage.y" r="22" class="ifx-spine__ring" />
        <circle :cx="stage.x" :cy="stage.y" r="7" class="ifx-spine__core" />

        <!-- Mini-object: a small glyph that pops as the pulse arrives. -->
        <text
          class="ifx-spine__glyph"
          :x="stage.x"
          :y="stage.y + 2.5"
          text-anchor="middle"
        >{{ stage.index + 1 }}</text>

        <text
          class="ifx-spine__label"
          :x="stage.x"
          :y="stage.y + 52"
          text-anchor="middle"
        >{{ stage.label }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.ifx-spine {
  width: 100%;
  max-width: var(--ifx-maxw);
  margin-inline: auto;
}
.ifx-spine__svg {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

/* Visually-hidden text equivalent — present for screen readers, off-canvas for sighted users. */
.ifx-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---- Rail ---- */
.ifx-spine__rail {
  stroke: var(--ifx-border);
  stroke-width: 2;
  stroke-linecap: round;
}

/* ---- Nodes ---- */
.ifx-spine__ring {
  fill: var(--ifx-surface);
  stroke: var(--node-color);
  stroke-width: 2;
}
.ifx-spine__core {
  fill: var(--node-color);
}
.ifx-spine__glyph {
  fill: var(--ifx-bg);
  font-family: var(--ifx-font-mono);
  font-size: 11px;
  font-weight: 600;
}
.ifx-spine__label {
  fill: var(--ifx-text);
  font-family: var(--ifx-font-display);
  font-size: 20px;
  letter-spacing: -0.01em;
}

/* ---- The travelling pulse ---- */
.ifx-spine__pulse-core {
  fill: var(--ifx-brand);
}
.ifx-spine__pulse-halo {
  fill: var(--ifx-brand);
  opacity: 0.25;
}
.ifx-spine__pulse {
  /* Travel from the first node to the last along the rail. The rail spans
     MARGIN_X .. (VIEW_W - MARGIN_X) = 70 .. 930, i.e. 860 user units. */
  transform: translateX(0);
  opacity: 0;
  will-change: transform, opacity;
  animation: ifx-pulse-travel var(--ifx-loop) linear infinite;
  animation-play-state: paused;
}
@keyframes ifx-pulse-travel {
  0%   { transform: translateX(0);     opacity: 0; }
  6%   { opacity: 1; }
  94%  { opacity: 1; }
  100% { transform: translateX(860px); opacity: 0; }
}

/* ---- Per-node reveal, synchronized to the pulse arrival via --node-delay ---- */
.ifx-spine__ring,
.ifx-spine__core,
.ifx-spine__glyph,
.ifx-spine__label {
  /* Animated state below; in the default (no .is-playing) case these stay fully
     revealed so the static spine is complete and meaningful before/without JS. */
  transform-box: fill-box;
  transform-origin: center;
}

/* Only when actively playing do we dim-then-reveal in sync with the pulse. */
.ifx-spine.is-playing:not(.is-static) .ifx-spine__pulse {
  animation-play-state: running;
}
.ifx-spine.is-playing:not(.is-static) .ifx-spine__node .ifx-spine__core,
.ifx-spine.is-playing:not(.is-static) .ifx-spine__node .ifx-spine__glyph {
  animation: ifx-node-pop var(--ifx-loop) var(--ifx-ease) infinite;
  animation-delay: var(--node-delay);
}
.ifx-spine.is-playing:not(.is-static) .ifx-spine__node .ifx-spine__label {
  animation: ifx-label-in var(--ifx-loop) var(--ifx-ease) infinite;
  animation-delay: var(--node-delay);
}

@keyframes ifx-node-pop {
  0%   { transform: scale(0.6); opacity: 0.45; }
  4%   { transform: scale(1.25); opacity: 1; }
  12%  { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes ifx-label-in {
  0%   { transform: translateY(4px); opacity: 0.35; }
  6%   { transform: translateY(0);   opacity: 1; }
  100% { transform: translateY(0);   opacity: 1; }
}

/* ---- Static / reduced-motion guarantees ---- */
/* The static variant hides the pulse and shows everything fully revealed. */
.ifx-spine.is-static .ifx-spine__pulse {
  display: none;
}

/* Hard reduced-motion override: no pulse, no reveal animation, complete static spine.
   This is independent of JS and wins regardless of props. */
@media (prefers-reduced-motion: reduce) {
  .ifx-spine__pulse {
    display: none;
  }
  .ifx-spine__ring,
  .ifx-spine__core,
  .ifx-spine__glyph,
  .ifx-spine__label {
    animation: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
</style>
