<script setup lang="ts">
// Decorative animated divider: a gradient hairline that draws outward from a
// glowing central node when it scrolls into view. Pure decoration → aria-hidden.
</script>

<template>
  <div class="ifx-divider ifx-reveal" aria-hidden="true">
    <span class="ifx-divider__line l" />
    <span class="ifx-divider__node" />
    <span class="ifx-divider__line r" />
  </div>
</template>

<style scoped>
.ifx-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: var(--ifx-maxw);
  margin: 8px auto;
  padding-inline: 24px;
}
.ifx-divider__line {
  height: 1px;
  flex: 1;
  transform: scaleX(0);
  transition: transform var(--ifx-dur-slow) var(--ifx-ease);
}
.ifx-divider__line.l {
  transform-origin: right center;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--ifx-brand) 55%, transparent));
}
.ifx-divider__line.r {
  transform-origin: left center;
  background: linear-gradient(90deg, color-mix(in srgb, var(--ifx-verified) 55%, transparent), transparent);
}
.ifx-divider.is-in .ifx-divider__line { transform: scaleX(1); }
.ifx-divider__node {
  width: 7px; height: 7px; border-radius: 50%; flex: none;
  background: var(--ifx-brand);
  box-shadow: 0 0 12px color-mix(in srgb, var(--ifx-brand) 70%, transparent);
  animation: ifx-node-breathe 3s var(--ifx-ease) infinite;
}
@keyframes ifx-node-breathe {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
@media (prefers-reduced-motion: reduce) {
  .ifx-divider__line { transition: none; transform: scaleX(1); }
  .ifx-divider__node { animation: none; }
}
</style>
