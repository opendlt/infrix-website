<script setup lang="ts">
// Fixed aurora layer rendered behind all content (injected globally via the
// Layout override). Pure CSS animation (see effects.css) — this component is just
// the markup. Decorative, so aria-hidden.
</script>

<template>
  <div class="ifx-ambient" aria-hidden="true">
    <div class="ifx-ambient__blob b1" />
    <div class="ifx-ambient__blob b2" />
    <div class="ifx-ambient__blob b3" />
    <div class="ifx-ambient__grid" />
    <div class="ifx-ambient__veil" />
  </div>
</template>
