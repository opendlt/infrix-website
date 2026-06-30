<script setup lang="ts">
import { withBase } from 'vitepress';

withDefaults(
  defineProps<{
    name?: string;
    text?: string;
    grad?: string;
    tagline?: string;
  }>(),
  {
    name: 'Infrix',
    text: 'Describe what you want.',
    grad: 'Get back a proof you can trust.',
    tagline:
      'A governance-first execution layer for Accumulate. Every action ends in a proof ' +
      'you can verify yourself — no node, no trust required.',
  },
);
</script>

<template>
  <header class="ifx-hero">
    <div class="ifx-hero__glow" aria-hidden="true" />

    <div class="ifx-hero__inner ifx-container">
      <div class="ifx-hero__copy">
        <a class="ifx-pill" href="https://play.infrix.opendlt.org" target="_blank" rel="noopener">
          <span class="ifx-pill__dot" aria-hidden="true" />
          Live playground — run a governed flow & verify the proof in your browser
        </a>

        <h1 class="ifx-hero__title">
          {{ text }}<br />
          <span class="ifx-grad-text">{{ grad }}</span>
        </h1>

        <p class="ifx-hero__sub">{{ tagline }}</p>

        <div class="ifx-hero__cta">
          <a class="ifx-btn ifx-btn--primary" href="https://play.infrix.opendlt.org" target="_blank" rel="noopener">
            Try the live playground <span aria-hidden="true">▸</span>
          </a>
          <a class="ifx-btn ifx-btn--ghost" :href="withBase('/getting-started')">
            Start in one command <span aria-hidden="true">↓</span>
          </a>
          <a class="ifx-btn ifx-btn--ghost" :href="withBase('/why-infrix')">
            Why Infrix vs Ethereum? <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div class="ifx-hero__visual">
        <div class="ifx-hero__spine ifx-glass ifx-grad-border">
          <p class="ifx-hero__spine-label">THE GOVERNANCE SPINE</p>
          <SpineDiagram :animated="true" :active-id="null" />
          <p class="ifx-hero__spine-cap">intent in · proof out · no step skippable</p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ifx-hero {
  position: relative;
  padding: 64px 0 40px;
  overflow: hidden;
}
/* Intensified local aurora behind the hero. */
.ifx-hero__glow {
  position: absolute;
  inset: -20% -10% auto -10%;
  height: 120%;
  background:
    radial-gradient(40% 50% at 22% 30%,
      color-mix(in srgb, var(--ifx-brand) 32%, transparent) 0%, transparent 70%),
    radial-gradient(40% 50% at 80% 25%,
      color-mix(in srgb, var(--ifx-evidence) 26%, transparent) 0%, transparent 72%);
  filter: blur(8px);
  pointer-events: none;
}
.ifx-hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 56px;
  align-items: center;
  min-height: 72vh;
}
@media (max-width: 900px) {
  .ifx-hero__inner { grid-template-columns: 1fr; gap: 36px; min-height: 0; }
}

/* ---- Copy column ---- */
.ifx-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 14px 7px 11px;
  border-radius: 999px;
  font-family: var(--ifx-font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  color: var(--ifx-text);
  text-decoration: none;
  background: color-mix(in srgb, var(--ifx-surface) 70%, transparent);
  border: 1px solid var(--ifx-glass-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color var(--ifx-dur-fast) var(--ifx-ease),
    transform var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-pill:hover { border-color: color-mix(in srgb, var(--ifx-verified) 55%, transparent); transform: translateY(-1px); }
.ifx-pill__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--ifx-verified);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--ifx-verified) 70%, transparent);
  animation: ifx-pulse-dot 2.4s var(--ifx-ease) infinite;
}
@keyframes ifx-pulse-dot {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ifx-verified) 60%, transparent); }
  70% { box-shadow: 0 0 0 8px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.ifx-hero__title {
  font-family: var(--ifx-font-display);
  font-size: clamp(2.4rem, 5.6vw, 4.1rem);
  line-height: 1.02;
  letter-spacing: -0.035em;
  margin: 20px 0 18px;
  font-weight: 700;
}
.ifx-hero__sub {
  color: var(--ifx-text-muted);
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 40ch;
}
.ifx-hero__cta { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 30px; }

.ifx-btn {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 13px 22px;
  border-radius: var(--ifx-r-sm);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: transform var(--ifx-dur-fast) var(--ifx-ease),
    box-shadow var(--ifx-dur-fast) var(--ifx-ease),
    border-color var(--ifx-dur-fast) var(--ifx-ease),
    background var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-btn span { transition: transform var(--ifx-dur-fast) var(--ifx-ease); }
.ifx-btn--primary {
  color: var(--ifx-bg);
  background: var(--ifx-brand);
  box-shadow: var(--ifx-glow-brand);
}
.ifx-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px -4px color-mix(in srgb, var(--ifx-brand) 65%, transparent); }
.ifx-btn--primary:hover span { transform: translateX(3px); }
.ifx-btn--ghost {
  color: var(--ifx-text);
  background: color-mix(in srgb, var(--ifx-surface) 60%, transparent);
  border-color: var(--ifx-glass-border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.ifx-btn--ghost:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--ifx-brand) 50%, transparent); }
.ifx-btn--ghost:hover span { transform: translateY(2px); }
.ifx-btn:focus-visible { outline: 2px solid var(--ifx-verified); outline-offset: 3px; }

/* ---- Visual column: glass-framed glowing spine ---- */
.ifx-hero__spine {
  border-radius: var(--ifx-r-lg);
  padding: 26px 22px 18px;
  box-shadow: 0 30px 80px -40px color-mix(in srgb, var(--ifx-brand) 50%, transparent);
}
.ifx-hero__spine-label {
  margin: 0 0 6px;
  font-family: var(--ifx-font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  color: var(--ifx-text-muted);
  text-align: center;
}
.ifx-hero__spine-cap {
  margin: 8px 0 0;
  text-align: center;
  font-family: var(--ifx-font-mono);
  font-size: 0.74rem;
  color: var(--ifx-text-muted);
}
/* Make the spine nodes + pulse glow inside the hero. */
.ifx-hero__spine :deep(.ifx-spine__core) { filter: drop-shadow(0 0 5px var(--node-color)); }
.ifx-hero__spine :deep(.ifx-spine__pulse-core),
.ifx-hero__spine :deep(.ifx-spine__pulse-halo) { filter: drop-shadow(0 0 8px var(--ifx-brand)); }

/* ---- Staggered entrance (above the fold → on load, not scroll) ---- */
.ifx-pill { animation: ifx-rise var(--ifx-dur-slow) var(--ifx-ease) both; animation-delay: 60ms; }
.ifx-hero__title { animation: ifx-rise var(--ifx-dur-slow) var(--ifx-ease) both; animation-delay: 140ms; }
.ifx-hero__sub { animation: ifx-rise var(--ifx-dur-slow) var(--ifx-ease) both; animation-delay: 220ms; }
.ifx-hero__cta { animation: ifx-rise var(--ifx-dur-slow) var(--ifx-ease) both; animation-delay: 300ms; }
.ifx-hero__visual { animation: ifx-rise-scale var(--ifx-dur-slow) var(--ifx-ease) both; animation-delay: 240ms; }
@keyframes ifx-rise {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: none; }
}
@keyframes ifx-rise-scale {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ifx-pill__dot { animation: none; }
  .ifx-btn, .ifx-btn span, .ifx-pill { transition: none; }
  .ifx-pill, .ifx-hero__title, .ifx-hero__sub, .ifx-hero__cta, .ifx-hero__visual {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
}
</style>
