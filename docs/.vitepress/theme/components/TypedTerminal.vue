<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';

interface TerminalLine {
  /** 'prompt' renders a `$ ` lead; 'output' is indented result text; 'ok' prefixes a ✓. */
  kind: 'prompt' | 'output' | 'ok' | 'arrow';
  text: string;
}

const props = withDefaults(
  defineProps<{
    /** The command/output lines, in order. Defaults to the golden-path script. */
    lines?: TerminalLine[];
    /** ms per character for the typewriter. */
    speed?: number;
    /** Accessible caption beneath the terminal. */
    caption?: string;
  }>(),
  {
    speed: 18,
    caption:
      'From a sentence to a verifiable app. No Solidity, no raw transactions, no “trust me.”',
    lines: () => [
      { kind: 'prompt', text: 'infrix new verifiable-app my-escrow \\' },
      { kind: 'output', text: '    "escrow that releases when two approvers sign"' },
      { kind: 'ok',     text: 'intent compiled       ✓ plan generated (4 steps)' },
      { kind: 'ok',     text: 'approvals enforced    ✓ evidence bundle written' },
      { kind: 'arrow',  text: 'proof.infrix.json ready' },
      { kind: 'prompt', text: 'infrix verify proof.infrix.json' },
      { kind: 'ok',     text: 'verified offline — no node, no trust required' },
    ],
  },
);

const root = ref<HTMLElement | null>(null);
const started = ref(false);
const typedCount = ref(0);            // how many characters of the flattened text are revealed
let observer: IntersectionObserver | null = null;
let raf = 0;

// Flatten lines into a single character budget so the typewriter advances line by line.
const flat = computed(() => {
  let total = 0;
  return props.lines.map((line) => {
    const start = total;
    total += line.text.length + 1;    // +1 for the line break
    return { ...line, start, end: total };
  });
});
const totalChars = computed(() => flat.value.reduce((n, l) => n + l.text.length + 1, 0));

/** Visible slice of a line during the typewriter pass. */
function visible(line: { text: string; start: number }): string {
  const shown = typedCount.value - line.start;
  if (shown <= 0) return '';
  return line.text.slice(0, shown);
}
function lineDone(line: { end: number }): boolean {
  return typedCount.value >= line.end;
}

function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function runTypewriter() {
  if (started.value) return;
  started.value = true;

  if (prefersReduced()) {
    typedCount.value = totalChars.value;   // show everything instantly
    return;
  }

  let last = performance.now();
  const step = (now: number) => {
    const dt = now - last;
    if (dt >= props.speed) {
      typedCount.value = Math.min(totalChars.value, typedCount.value + Math.round(dt / props.speed));
      last = now;
    }
    if (typedCount.value < totalChars.value) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    runTypewriter();
    return;
  }
  observer = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          runTypewriter();
          obs.disconnect();
        }
      }
    },
    { threshold: 0.4 },
  );
  if (root.value) observer.observe(root.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (raf) cancelAnimationFrame(raf);
});

// The complete, accessible text — always in the DOM for SR + copy/select.
const plainText = computed(() => props.lines.map((l) => l.text).join('\n'));
</script>

<template>
  <figure ref="root" class="ifx-term ifx-reveal" role="group" :aria-label="'Terminal demo: ' + caption">
    <!-- Accessible source of truth: the full command + output, always present.
         Screen readers and copy/paste use THIS, not the animated overlay. -->
    <pre class="ifx-term-sr">{{ plainText }}</pre>

    <!-- Visual, animated overlay. aria-hidden + aria-live=off so AT ignores it
         and never narrates per-character. -->
    <div class="ifx-term-visual" aria-hidden="true" aria-live="off">
      <div class="ifx-term-chrome">
        <span class="dot" /><span class="dot" /><span class="dot" />
      </div>
      <pre class="ifx-term-body"><template v-for="(line, i) in flat" :key="i"><span
        class="ifx-term-line" :class="'k-' + line.kind"
      ><span v-if="line.kind === 'prompt'" class="lead">$ </span><span
        v-else-if="line.kind === 'ok'" class="lead ok">✓ </span><span
        v-else-if="line.kind === 'arrow'" class="lead arrow">→ </span>{{ visible(line)
      }}<span v-if="!lineDone(line) && typedCount > line.start" class="caret" /></span>
</template></pre>
    </div>

    <figcaption class="ifx-term-cap">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.ifx-term {
  max-width: 760px;
  margin: 32px auto;
  border: 1px solid var(--ifx-border);
  border-radius: var(--ifx-r-md);
  background: var(--ifx-surface);
  box-shadow: 0 18px 60px -30px color-mix(in srgb, var(--ifx-brand) 40%, transparent);
  overflow: hidden;
}
/* Visually hidden but readable by SR + selectable for copy. */
.ifx-term-sr {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  clip: rect(0 0 0 0); clip-path: inset(50%);
  overflow: hidden; white-space: nowrap;
}
.ifx-term-chrome { display: flex; gap: 7px; padding: 12px 16px; border-bottom: 1px solid var(--ifx-border); }
.ifx-term-chrome .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--ifx-surface-2); }
.ifx-term-body {
  margin: 0; padding: 18px 20px 22px;
  font-family: var(--ifx-font-mono);
  font-size: 0.92rem; line-height: 1.7;
  color: var(--ifx-text); white-space: pre-wrap; word-break: break-word;
  min-height: 11.9em;            /* reserve space → zero CLS as lines type in */
}
.ifx-term-line { display: block; }
.ifx-term-line .lead { color: var(--ifx-text-muted); }
.ifx-term-line .lead.ok { color: var(--ifx-verified); }
.ifx-term-line .lead.arrow { color: var(--ifx-brand); }
.ifx-term-line.k-output { color: var(--ifx-text-muted); }
.caret {
  display: inline-block; width: 0.6ch; height: 1.1em;
  margin-left: 1px; vertical-align: text-bottom;
  background: var(--ifx-brand); animation: ifx-blink 1s steps(1) infinite;
}
.ifx-term-cap {
  padding: 14px 20px 18px; margin: 0;
  font-size: 0.9rem; color: var(--ifx-text-muted);
  border-top: 1px solid var(--ifx-border);
}
@keyframes ifx-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .caret { animation: none; display: none; }
}
</style>
