<script setup lang="ts">
// The three pillars as a bento of glass cards with iconography + hover glow.
// Short copy — graphics carry the meaning, not paragraphs.
interface Pillar {
  icon: 'shield' | 'receipt' | 'selector';
  title: string;
  body: string;
  token: 'brand' | 'verified' | 'evidence';
}
const pillars: Pillar[] = [
  {
    icon: 'shield',
    title: 'Governed by default',
    body: 'No raw-transaction backdoor. Every change traverses approval and policy — governance you can’t forget to turn on.',
    token: 'brand',
  },
  {
    icon: 'receipt',
    title: 'Proof you can take with you',
    body: 'Every outcome ships a portable receipt. A regulator verifies it offline — no node, no trust in us.',
    token: 'verified',
  },
  {
    icon: 'selector',
    title: 'Right execution, every step',
    body: 'Infrix picks how each step runs — by confidentiality, cost, trust, and capability — not one hard-coded VM.',
    token: 'evidence',
  },
];
</script>

<template>
  <section class="ifx-bento ifx-container" aria-label="What makes Infrix different">
    <div
      v-for="(p, i) in pillars"
      :key="p.title"
      class="ifx-bento__cell ifx-reveal-up"
      :style="{ '--i': i }"
    >
    <article
      v-tilt
      class="ifx-bento__card ifx-grad-border ifx-tilt"
      :class="'tok-' + p.token"
    >
      <span class="ifx-bento__icon" aria-hidden="true">
        <!-- shield -->
        <svg v-if="p.icon === 'shield'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <!-- receipt / proof -->
        <svg v-else-if="p.icon === 'receipt'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
          <path d="M9 8h6M9 12h6" />
          <path d="M9.5 15.5l1.5 1.5 3-3" />
        </svg>
        <!-- selector / branch -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="12" r="2.4" />
          <path d="M8.4 6H13a2.6 2.6 0 0 1 2.6 2.6V10M8.4 18H13a2.6 2.6 0 0 0 2.6-2.6V14" />
        </svg>
      </span>
      <h3 class="ifx-bento__title">{{ p.title }}</h3>
      <p class="ifx-bento__body">{{ p.body }}</p>
    </article>
    </div>
  </section>
</template>

<style scoped>
.ifx-bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 56px auto;
}
@media (max-width: 880px) { .ifx-bento { grid-template-columns: 1fr; } }
.ifx-bento__cell { height: 100%; }
.ifx-bento__card {
  position: relative;
  height: 100%;
  padding: 28px 26px;
  border-radius: var(--ifx-r-lg);
  background: color-mix(in srgb, var(--ifx-surface) 58%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
}
/* Accent glow that blooms on hover, colored per pillar. */
.ifx-bento__card::after {
  content: "";
  position: absolute;
  inset: auto -30% -60% -30%;
  height: 70%;
  background: radial-gradient(closest-side, var(--accent) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--ifx-dur) var(--ifx-ease);
  pointer-events: none;
}
.ifx-bento__card.tok-brand { --accent: color-mix(in srgb, var(--ifx-brand) 28%, transparent); }
.ifx-bento__card.tok-verified { --accent: color-mix(in srgb, var(--ifx-verified) 26%, transparent); }
.ifx-bento__card.tok-evidence { --accent: color-mix(in srgb, var(--ifx-evidence) 26%, transparent); }
.ifx-bento__card:hover {
  box-shadow: 0 28px 64px -34px color-mix(in srgb, var(--ifx-brand) 55%, transparent);
}
.ifx-bento__card:hover::after { opacity: 1; }

.ifx-bento__icon {
  display: inline-grid;
  place-items: center;
  width: 46px; height: 46px;
  border-radius: var(--ifx-r-md);
  margin-bottom: 16px;
  background: color-mix(in srgb, var(--ifx-surface-2) 70%, transparent);
  border: 1px solid var(--ifx-glass-border);
}
.ifx-bento__icon svg { width: 24px; height: 24px; }
.tok-brand .ifx-bento__icon { color: var(--ifx-brand); }
.tok-verified .ifx-bento__icon { color: var(--ifx-verified); }
.tok-evidence .ifx-bento__icon { color: var(--ifx-evidence); }
.ifx-bento__title {
  font-family: var(--ifx-font-display);
  font-size: 1.22rem;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.ifx-bento__body { color: var(--ifx-text-muted); line-height: 1.55; margin: 0; font-size: 0.95rem; }

@media (prefers-reduced-motion: reduce) {
  .ifx-bento__card, .ifx-bento__card::after { transition: none; }
  .ifx-bento__card:hover { transform: none; }
}
</style>
