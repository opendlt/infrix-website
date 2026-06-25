<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { GLOSSARY, glossaryKey } from "../data/glossary";

const props = defineProps<{
  /** Glossary key. Interchangeable aliases — use whichever reads best in markdown. */
  word?: string;
  id?: string;
}>();

const slots = defineSlots<{ default?: () => unknown }>();

// A stable id pair for aria wiring (one tooltip per <Term>).
const uid = useId();
const tipId = `ifx-term-tip-${uid}`;

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);

// Resolve the lookup key from prop or slot. Slot text wins for display; the
// prop is the explicit lookup override when slot text differs from the key.
const lookup = computed(() => {
  const explicit = props.word ?? props.id;
  if (explicit) return glossaryKey(explicit);
  const fallback = (slots.default?.() ?? [])
    .map((n: any) => (typeof n.children === "string" ? n.children : ""))
    .join("");
  return glossaryKey(fallback);
});

const entry = computed(() => GLOSSARY[lookup.value]);
const definition = computed(() => entry.value?.definition ?? "");
const known = computed(() => Boolean(entry.value));

// Display text: slot if provided, else the glossary term, else the raw key.
const hasSlot = computed(() => Boolean(slots.default));
const displayTerm = computed(() => entry.value?.term ?? lookup.value);

function show() {
  if (known.value) open.value = true;
}
function hide() {
  open.value = false;
}
function toggle() {
  if (known.value) open.value = !open.value;
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    hide();
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggle();
  }
}
</script>

<template>
  <!-- Unknown terms render as plain text with a native title fallback, never a broken tooltip. -->
  <span
    v-if="!known"
    class="ifx-term ifx-term--unknown"
  ><slot>{{ displayTerm }}</slot></span>

  <span
    v-else
    ref="trigger"
    class="ifx-term"
    tabindex="0"
    role="button"
    :aria-describedby="open ? tipId : undefined"
    :aria-expanded="open"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
    @keydown="onKeydown"
  >
    <span class="ifx-term__label"><slot>{{ displayTerm }}</slot></span>
    <span
      :id="tipId"
      class="ifx-term__tip"
      role="tooltip"
      :data-open="open ? 'true' : 'false'"
    >
      <strong class="ifx-term__tip-term">{{ displayTerm }}</strong>
      <span class="ifx-term__tip-def">{{ definition }}</span>
    </span>
  </span>
</template>

<style scoped>
.ifx-term {
  position: relative;
  font: inherit;
}
.ifx-term--unknown {
  /* No tooltip available — render as normal prose, no dotted hint. */
  cursor: default;
}
.ifx-term__label {
  border-bottom: 1px dotted var(--ifx-brand, currentColor);
  cursor: help;
  outline: none;
}
.ifx-term:focus-visible .ifx-term__label {
  outline: 2px solid var(--ifx-brand);
  outline-offset: 2px;
  border-radius: 2px;
}
.ifx-term__tip {
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  z-index: 50;
  width: max-content;
  max-width: min(320px, 80vw);
  padding: 10px 12px;
  border: 1px solid var(--ifx-border);
  border-radius: var(--ifx-r-sm);
  background: var(--ifx-surface-2, var(--ifx-surface));
  color: var(--ifx-text);
  box-shadow: 0 8px 28px -10px rgba(0, 0, 0, 0.55);
  font-size: 0.85rem;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition:
    opacity var(--ifx-dur-fast, 180ms) var(--ifx-ease, ease),
    transform var(--ifx-dur-fast, 180ms) var(--ifx-ease, ease);
}
.ifx-term__tip[data-open="true"] {
  opacity: 1;
  transform: none;
}
.ifx-term__tip-term {
  display: block;
  font-family: var(--ifx-font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--ifx-brand);
  margin-bottom: 4px;
}
.ifx-term__tip-def {
  display: block;
  color: var(--ifx-text);
}
@media (prefers-reduced-motion: reduce) {
  .ifx-term__tip {
    transition: none;
    transform: none;
  }
}
</style>
