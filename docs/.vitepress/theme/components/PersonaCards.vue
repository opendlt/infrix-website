<script setup lang="ts">
import { withBase } from 'vitepress';

interface Persona {
  who: string;
  pitch: string;
  href: string;
  cta: string;
  icon: string;     // single glyph; decorative (aria-hidden)
}

withDefaults(
  defineProps<{ heading?: string; personas?: Persona[] }>(),
  {
    heading: 'Choose your path',
    personas: () => [
      {
        who: 'I’m a developer',
        pitch: 'Go from one command to a verifiable app — pick TypeScript, Rust, or AssemblyScript.',
        href: '/getting-started',
        cta: 'Start building',
        icon: '⌘',
      },
      {
        who: 'I’m an auditor or regulator',
        pitch: 'See how an outcome ships a portable receipt you can verify offline, no node required.',
        href: '/cookbook/offline-verification',
        cta: 'Verify a proof',
        icon: '✓',
      },
      {
        who: 'I run infrastructure',
        pitch: 'Devnet, anchor modes, and trust profiles for operating an Infrix deployment.',
        href: '/cookbook/trust-profiles',
        cta: 'Operate Infrix',
        icon: '⚙',
      },
      {
        who: 'I’m evaluating',
        pitch: 'The governance spine — one enforced pipeline — and why nothing bypasses it.',
        href: '/governance-spine',
        cta: 'Read the model',
        icon: '◇',
      },
    ],
  },
);
</script>

<template>
  <section class="ifx-personas ifx-container">
    <h2 class="ifx-reveal">{{ heading }}</h2>
    <div class="grid">
      <a
        v-for="(p, i) in personas"
        :key="p.who"
        class="card ifx-reveal"
        :href="withBase(p.href)"
        :style="{ transitionDelay: 60 * i + 'ms' }"
      >
        <span class="icon" aria-hidden="true">{{ p.icon }}</span>
        <span class="who">{{ p.who }}</span>
        <span class="pitch">{{ p.pitch }}</span>
        <span class="cta">{{ p.cta }} →</span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.ifx-personas { margin: 88px auto; }
.ifx-personas h2 { font-family: var(--ifx-font-display); letter-spacing: -0.02em; margin-bottom: 24px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 920px) { .grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 520px) { .grid { grid-template-columns: 1fr; } }
.card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 22px; border-radius: var(--ifx-r-md);
  border: 1px solid var(--ifx-border); background: var(--ifx-surface);
  text-decoration: none; color: var(--ifx-text);
  transition: transform var(--ifx-dur-fast) var(--ifx-ease),
              border-color var(--ifx-dur-fast) var(--ifx-ease),
              box-shadow var(--ifx-dur-fast) var(--ifx-ease);
}
.card:hover, .card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--ifx-brand) 50%, transparent);
  box-shadow: 0 14px 40px -20px color-mix(in srgb, var(--ifx-brand) 45%, transparent);
}
.card:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.card .icon {
  display: inline-grid; place-items: center; width: 38px; height: 38px;
  border-radius: var(--ifx-r-sm); font-size: 1.1rem;
  background: color-mix(in srgb, var(--ifx-brand) 14%, var(--ifx-surface-2));
  color: var(--ifx-brand);
}
.card .who { font-family: var(--ifx-font-display); font-weight: 600; }
.card .pitch { color: var(--ifx-text-muted); font-size: 0.92rem; line-height: 1.5; }
.card .cta { margin-top: auto; color: var(--ifx-brand); font-weight: 600; font-size: 0.9rem; }
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover, .card:focus-visible { transform: none; }
}
</style>
