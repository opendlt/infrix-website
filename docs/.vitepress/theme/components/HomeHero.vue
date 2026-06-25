<script setup lang="ts">
import { withBase } from 'vitepress';

withDefaults(
  defineProps<{
    name?: string;
    text?: string;
    tagline?: string;
  }>(),
  {
    name: 'Infrix',
    text: 'Describe what you want. Get back a proof you can trust.',
    tagline:
      'A governance-first execution layer for Accumulate. Every action flows through one ' +
      'enforced pipeline — intent, plan, approval, execution, evidence — and ends in a ' +
      'portable receipt anyone can verify offline, without running a node or trusting the network.',
  },
);
</script>

<template>
  <header class="ifx-hero ifx-container">
    <div class="ifx-hero-copy">
      <p class="ifx-eyebrow">{{ name }}</p>
      <h1>{{ text }}</h1>
      <p class="ifx-hero-sub">{{ tagline }}</p>
      <div class="ifx-hero-cta">
        <a class="btn brand" :href="withBase('/getting-started')">Start in one command →</a>
        <a class="btn alt" :href="withBase('/governance-spine')">See how it’s different ↓</a>
        <a class="btn alt" href="https://github.com/opendlt/infrix-accumen">View on GitHub</a>
      </div>
    </div>
    <div class="ifx-hero-visual">
      <!-- The brand-defining animated spine (runbook 02). Decorative here: the H1 +
           subhead already carry the meaning; <SpineDiagram> exposes its own SR text. -->
      <SpineDiagram :animated="true" :active-id="null" />
    </div>
  </header>
</template>

<style scoped>
.ifx-hero {
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center;
  padding: 72px 24px 56px; min-height: 78vh;
}
@media (max-width: 880px) {
  .ifx-hero { grid-template-columns: 1fr; gap: 32px; padding-top: 48px; min-height: 0; }
}
.ifx-hero-copy h1 {
  font-family: var(--ifx-font-display); font-size: clamp(2.1rem, 5vw, 3.4rem);
  line-height: 1.05; letter-spacing: -0.03em; margin: 12px 0 18px;
}
.ifx-hero-sub { color: var(--ifx-text-muted); font-size: 1.08rem; line-height: 1.6; max-width: 38ch; }
.ifx-hero-cta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.btn {
  padding: 12px 20px; border-radius: var(--ifx-r-sm); font-weight: 600;
  text-decoration: none; border: 1px solid var(--ifx-border); transition:
    transform var(--ifx-dur-fast) var(--ifx-ease), border-color var(--ifx-dur-fast) var(--ifx-ease);
}
.btn.brand { background: var(--ifx-brand); color: var(--ifx-bg); border-color: var(--ifx-brand); }
.btn.brand:hover { background: var(--ifx-brand-strong); }
.btn.alt { color: var(--ifx-text); background: var(--ifx-surface); }
.btn.alt:hover { border-color: var(--ifx-brand); }
.btn:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
</style>
