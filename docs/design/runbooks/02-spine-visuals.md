# Runbook 02 — Signature Visuals: The Animated Governance Spine

> **Effort 2 of 6.** Prerequisites: [`01-foundation.md`](./01-foundation.md) (theme
> scaffold + tokens must exist). Unblocks: runbooks 03, 04, 05.
> Read [`00-overview.md`](./00-overview.md) first — tokens (§4), the shared spine
> model (§5), the a11y checklist (§7), the perf budget (§8), the Definition of Done
> (§9) and git conventions (§10) are defined there and are **not repeated here**.
>
> **Goal:** Build `<SpineDiagram>` — the looping, animated rendering of the seven-stage
> governance spine. This is the one element that communicates the entire product thesis
> *pre-verbally*: a pulse of light flows the pipeline and each stage materializes as the
> pulse arrives. It ships in the hero (animated) and is wired for the docs (static). This
> is UX-REVIEW **Part 4 §1**, **Part 5 §2**, and **Part 6 motion principles**, and the
> first half of UX-REVIEW Part 10 **P1**.

---

## Outcomes (what "done" looks like)

1. `docs/.vitepress/theme/data/spine.ts` exists as the **single source of truth** for the
   seven stages (`intent → plan → approval → execution → outcome → evidence → anchor`),
   each with `id`, `label`, `color` (a `--ifx` token), and a one-line public-voice blurb —
   matching the `SpineStage` contract in `00-overview.md` §5.
2. `docs/.vitepress/theme/components/SpineDiagram.vue` exists: an SVG of seven nodes joined
   by a connector, with a light pulse that travels the connector on a loop and reveals each
   stage as it passes. Props `animated` (default `true`) and `static` (docs variant).
3. The component is **registered globally** in `theme/index.ts` `enhanceApp` (filling the
   commented slot runbook 01 left).
4. The animated diagram is **surfaced in the hero** of `index.md` via a raw-HTML block below
   the `layout: home` hero — shippable today; the full `<HomeHero>` replacement is deferred
   to runbook 03.
5. The component supports `:static` so runbook 04 can drop it at the top of
   `governance-spine.md` (04 wires the page; 02 only makes the variant exist and look right).
6. **Accessibility:** `role="img"` + an `aria-label` naming all seven stages, plus a
   visually-hidden ordered list equivalent; the decorative pulse is `aria-hidden`; full
   `prefers-reduced-motion` support (complete static spine, no pulse).
7. **Performance:** total component weight < 40KB, 60fps, animation is GPU-only
   (`transform`/`opacity`), and it pauses when offscreen via `IntersectionObserver`.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/02-spine-visuals    # off the runbook-01 branch (or main once 01 lands)
npm ci
npm run dev    # confirm the runbook-01 site renders at /infrix-website/ before changing anything
```

Confirm the fence is green from the start and that the theme scaffold from 01 is present:

```bash
node --test docs-structure.test.mjs
ls docs/.vitepress/theme/index.ts docs/.vitepress/theme/styles/tokens.css
```

> If `theme/index.ts` or the token CSS is missing, **stop** — runbook 01 is not landed and
> this effort has nothing to plug into. Do not invent tokens here; they belong to 00/01.

---

## Step 1 — Create the shared spine data (`data/spine.ts`)

This is the canonical seven-stage definition consumed by `<SpineDiagram>` now and by
`<SpineWalkthrough>` (03), the docs spine (04), and the verifier copy (05). Define it **once**.
Shape is fixed by `00-overview.md` §5; meaning is translated to public voice from
`governance-spine.md`.

Create `docs/.vitepress/theme/data/spine.ts`:

```ts
// SINGLE SOURCE OF TRUTH for the seven governance-spine stages.
// Consumed by SpineDiagram (02), SpineWalkthrough (03), the docs spine (04), and the
// verifier narrative (05). Order is load-bearing — never reorder. Colors map to the
// canonical --ifx semantic tokens (00-overview.md §4): blue = flow, amber = pending
// approval, green = verified/confirmed, violet = evidence. Anchor returns to brand blue
// because the anchor write closes the flow loop.

export interface SpineStage {
  /** Stable identifier; matches governance-spine.md and the typed pipeline objects. */
  id: 'intent' | 'plan' | 'approval' | 'execution' | 'outcome' | 'evidence' | 'anchor';
  /** Display label, Title Case. */
  label: string;
  /** A CSS color expressed as a var(--ifx-…) reference. Never a raw hex. */
  color: string;
  /** One-line, plain-English description in the public voice (no §-refs, no type names). */
  blurb: string;
}

export const SPINE_STAGES: SpineStage[] = [
  {
    id: 'intent',
    label: 'Intent',
    color: 'var(--ifx-brand)',
    blurb: 'What you want, described — in plain or typed terms.',
  },
  {
    id: 'plan',
    label: 'Plan',
    color: 'var(--ifx-brand)',
    blurb: 'Infrix compiles your intent into an ordered set of steps.',
  },
  {
    id: 'approval',
    label: 'Approval',
    color: 'var(--ifx-pending)',
    blurb: 'The right approvers sign off before anything runs — enforced, not optional.',
  },
  {
    id: 'execution',
    label: 'Execution',
    color: 'var(--ifx-verified)',
    blurb: 'Each step runs through the best-fit execution for that step.',
  },
  {
    id: 'outcome',
    label: 'Outcome',
    color: 'var(--ifx-verified)',
    blurb: 'Results are gathered into one record as finality settles.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    color: 'var(--ifx-evidence)',
    blurb: 'A portable receipt is assembled — verifiable offline, no node required.',
  },
  {
    id: 'anchor',
    label: 'Anchor',
    color: 'var(--ifx-brand)',
    blurb: 'A digest is anchored to Accumulate, sealing the outcome as final.',
  },
];

/** Single-sentence summary used for the diagram's aria-label. */
export const SPINE_ARIA_SUMMARY =
  'The Infrix governance spine: every action flows through seven enforced stages — ' +
  SPINE_STAGES.map((s) => s.label).join(', ') +
  '.';
```

> **Discipline check (00-overview §4):** `color` values are token references only. Approval is
> amber (`--ifx-pending`), execution/outcome are verified-green (`--ifx-verified`), evidence is
> violet (`--ifx-evidence`), and intent/plan/anchor are flow-blue (`--ifx-brand`). The diagram's
> color-coding *teaches* the semantics — do not deviate.

---

## Step 2 — Build `SpineDiagram.vue`

Create `docs/.vitepress/theme/components/SpineDiagram.vue`. This is the full, working SFC —
template, `<script setup>`, and scoped styles. No pseudocode.

**Design of the animation (read before the code):**

- The SVG is a fixed 1000×220 `viewBox` with seven evenly-spaced nodes on a horizontal
  connector. It scales fluidly via `width:100%`; the `viewBox` keeps geometry deterministic.
- The **pulse** is a small glowing circle that animates its `cx` along the connector via a CSS
  keyframe (`transform: translateX(...)` on a wrapping `<g>` — we animate `transform`, not the
  geometry attribute, to stay GPU-composited). It loops forever.
- Each **node reveal** is driven by a CSS `animation-delay` keyed to when the pulse passes that
  node, so the label + mini-object fade/scale in as the light arrives. The reveal animation runs
  once per loop via `animation-iteration-count: infinite` synchronized to the pulse period.
- **Pause offscreen:** an `IntersectionObserver` toggles a `.is-playing` class on the root; all
  animations are `animation-play-state: paused` until that class is present, so nothing burns CPU
  off-screen.
- **Reduced motion / static:** when `prefers-reduced-motion: reduce` *or* the `static` prop is
  set, we never add `.is-playing`, the pulse is `aria-hidden` and `display:none`, and every node
  renders fully revealed (opacity 1, no transform). The CSS fallback alone guarantees a complete,
  meaningful static spine even before JS runs.

```vue
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
```

> **Why CSS keyframes over `requestAnimationFrame`?** The pulse and reveals are pure
> `transform`/`opacity` loops with no per-frame JS state — CSS keeps them on the compositor
> thread (GPU), satisfies the 60fps/no-CLS budget for free, and `animation-play-state` gives us
> a zero-cost pause. The only JS is the `IntersectionObserver` toggling one class. This keeps the
> component well under the 40KB budget (no animation library, no canvas).

> **Geometry note:** `860px` in `ifx-pulse-travel` is the rail length in user units
> (`(VIEW_W - 2*MARGIN_X) = 1000 - 140 = 860`). If you change `VIEW_W` or `MARGIN_X`, update this
> keyframe to match, or the pulse will under/overshoot the last node.

---

## Step 3 — Register the component globally (`theme/index.ts`)

Runbook 01 left a commented slot in `enhanceApp`. Fill it. Edit
`docs/.vitepress/theme/index.ts`:

```ts
// Infrix custom theme: extends the VitePress default theme with the brand token
// system and base styles. Components are registered here as later runbooks add them.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

import SpineDiagram from "./components/SpineDiagram.vue";   // runbook 02

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Global components register here in runbooks 02–05.
    app.component("SpineDiagram", SpineDiagram);            // runbook 02
  },
} satisfies Theme;
```

> Registering globally means `<SpineDiagram />` is usable directly in any markdown file
> (`index.md`, `governance-spine.md`) with no per-page import. VitePress's MDC pipeline renders
> registered Vue components inline.

---

## Step 4 — Surface the animated diagram in the hero (`index.md`)

Runbook 01 deliberately kept `layout: home` (polished hero + feature grid for free). The full
`<HomeHero>` replacement is **runbook 03's** job. For now, surface the spine **shippably** by
dropping the component into a raw block immediately after the home hero — inside the existing
`<div class="ifx-home">` wrapper, as the first content the visitor scrolls to.

Edit `index.md`. Find the opening of the home body that runbook 01 created:

```markdown
<div class="ifx-home">

## From a sentence to a verifiable app
```

Insert a spine block **above** that heading, so it sits directly under the home hero:

```markdown
<div class="ifx-home">

<section class="ifx-spine-hero" aria-labelledby="ifx-spine-hero-h">

<p class="ifx-eyebrow">One enforced pipeline</p>

<h2 id="ifx-spine-hero-h">Every action flows through the governance spine</h2>

<ClientOnly>
  <SpineDiagram :animated="true" />
</ClientOnly>

<p class="ifx-spine-hero__cap">
  Intent in, a proof you can verify out — and no way to skip a step.
</p>

</section>

## From a sentence to a verifiable app
```

Add the section's layout styles to `docs/.vitepress/theme/styles/utilities.css` (these are
*new semantic utilities*, allowed by 00-overview §4 since they add no raw color):

```css
/* Spine hero band (runbook 02). */
.ifx-spine-hero { margin: 8px 0 40px; text-align: center; }
.ifx-spine-hero h2 { margin-bottom: 28px; }
.ifx-spine-hero__cap {
  margin-top: 20px; color: var(--ifx-text-muted);
  font-family: var(--ifx-font-mono); font-size: 0.9rem;
}
```

> **Why `<ClientOnly>`?** The diagram's `IntersectionObserver`/`matchMedia` are browser-only.
> `<ClientOnly>` skips it during SSR/static-export and hydrates it on the client — preventing a
> hydration mismatch. The CSS-only static fallback still means a reduced-motion user (or anyone
> before hydration) sees a complete spine; `<ClientOnly>` only defers the *interactive* layer.

> **Fence:** this edit adds content to `index.md` but removes none of the required markers
> (`governance-first`, `submitIntent`, `governance-spine` remain in the runbook-01 body). Re-run
> the fence after editing (Step 6).

---

## Step 5 — Make the static docs variant render correctly

Runbook **04** wires the static spine into the top of `governance-spine.md`. This effort only
needs to guarantee the `:static` variant exists and looks right. It already does, via the
`static` prop and `.is-static` styling in Step 2. Verify it manually by temporarily dropping
this at the very top of `governance-spine.md` (you may leave it for 04, or revert — 04 owns the
final placement and surrounding copy):

```markdown
<SpineDiagram :static="true" />
```

Expected: the full seven-node spine renders, color-coded, every label visible, **no pulse, no
looping** — a clean, print-friendly diagram. This is the "one diagram replaces 500 words"
deliverable from UX-REVIEW Part 5 §2.

> Keep the static variant's *visual* identical to the animated one's resting state, so the brand
> reads consistently between landing and docs.

---

## Step 6 — Build, fence, eyeball

```bash
node --test docs-structure.test.mjs    # markers still present in index.md
npm run build                          # must succeed, no new warnings
npm run preview                        # renders at /infrix-website/
```

Eyeball the bundle report (`00-overview` §8): the new JS for `SpineDiagram` (script + scoped CSS,
no deps) should add only a few KB — well under the 40KB component budget. Note the delta in the
PR description.

---

## QA matrix

Verify each in `npm run dev` (and re-confirm in `npm run preview`):

| Scenario | Expected |
|---|---|
| **Dark theme (default), hero** | Pulse travels left→right on a loop; each node pops and its label fades in as the pulse arrives; colors match semantics (intent/plan/anchor blue, approval amber, execution/outcome green, evidence violet). |
| **Light theme, hero** | Same animation; rail/labels/cores legible on light surfaces; node glyph (the index numeral) contrasts on the colored core. |
| **`prefers-reduced-motion: reduce`** (OS or DevTools rendering emulation) | No pulse at all; all seven nodes + labels fully shown, static; no looping; nothing hidden or broken. |
| **`<SpineDiagram :static="true" />`** | Full static spine, no pulse, no loop, all labels visible — identical resting visual to the animated variant. |
| **Scroll diagram offscreen, then back** | Animation pauses while offscreen (verify via DevTools Performance — no paint churn) and resumes on re-entry. |
| **Mobile width (≤ 480px)** | SVG scales to container width via `viewBox`; labels remain readable (no overlap/clipping); no horizontal scroll. |
| **Tablet / desktop widths** | Diagram centers, capped at `--ifx-maxw`; spacing even. |
| **Screen reader (VoiceOver/NVDA)** | Announces the `role="img"` `aria-label` summary, then the visually-hidden ordered list of all seven stages with blurbs; the pulse and SVG are not announced (`aria-hidden`). |
| **Keyboard** | Nothing interactive to trap; no focusable SVG internals (`focusable="false"`); page tab order unaffected. |
| **Before JS hydration / `<ClientOnly>` fallback** | Static spine present and complete (CSS-only); no layout shift when the interactive layer hydrates. |

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in `00-overview.md` §9, specifically:

- `data/spine.ts` exists and matches the §5 `SpineStage` contract; it is the **only** place the
  seven stages/colors are defined; colors are `--ifx` token references, no raw hex.
- `SpineDiagram.vue` ships with `animated` (default `true`) and `static` props, registered
  globally in `theme/index.ts`, and is surfaced in the `index.md` hero band.
- **A11y (§7):** `role="img"` + descriptive `aria-label`; visually-hidden ordered-list
  equivalent; decorative pulse `aria-hidden`; full `prefers-reduced-motion` static fallback;
  color is reinforced by labels/glyphs (never the sole signal); works in light + dark.
- **Perf (§8):** component < 40KB, animation is `transform`/`opacity` only (GPU), zero CLS,
  paused offscreen via `IntersectionObserver`; no animation library added; bundle delta noted.
- Fence green, build green, both themes legible, `npm run preview` renders.
- No banned jargon (§6) introduced in the touched public surfaces (`index.md`, `spine.ts`
  blurbs, component copy) — blurbs are plain-English, no `§`-refs or internal type names.

---

## Out of scope for this effort (so we don't gold-plate)

- The `<HomeHero>` component / full hero replacement (runbook 03).
- `<SpineWalkthrough>` — the scroll/click step-through with per-stage active state, plugin-reason
  chips, separation-of-duties, finality ticks (runbook 03).
- Wiring the static spine into `governance-spine.md` *with surrounding copy* and the page's final
  layout (runbook 04).
- `<TypedTerminal>`, `<EvmContrast>`, `<PersonaCards>` (runbook 03).
- The live WASM `<EvidenceVerifier>` (runbook 05).
- Per-stage rich "mini-objects" (step chips, landing signatures, assembling bundle, hash write) —
  this effort ships the *index-numeral* glyph as the materializing object; the richer per-stage
  objects belong to the walkthrough (runbook 03), which has room to render them.
- Logo/wordmark built from the spine motif, custom OG image of the spine (runbook 06).

Resist building these now. Effort 02's job is the one brand-defining animated diagram — shippable
in the hero and reusable static in docs — plus the shared `spine.ts` everything else builds on.

---

## Handoff notes for runbook 03

- **`spine.ts` is the contract.** `<SpineWalkthrough>` imports `SPINE_STAGES` (and may import
  `SPINE_ARIA_SUMMARY`) from `../data/spine` — do **not** redefine the stages there. If the
  walkthrough needs extra per-stage data (e.g. a richer narrative object or icon), *extend* the
  `SpineStage` interface in `spine.ts` with optional fields and document the addition; never fork
  the list.
- **Per-stage active state.** The walkthrough drives a single "active stage index" (0–6) instead
  of an infinite pulse loop. The reveal styling here is a good visual reference, but the
  walkthrough's active node should derive its highlight from that index (a bound class), with
  keyboard `Next/Prev` controls (00-overview §7 — no scroll-hijacking). Consider factoring the
  node-render markup so both components share it, but only if it stays simple; duplication is
  acceptable if extraction adds indirection.
- **Color semantics are fixed** by `spine.ts` — the walkthrough reuses the same per-stage
  `color` tokens so the two visuals teach the same color language.
- **Component registration** pattern is established (Step 3): add `app.component("SpineWalkthrough",
  …)` to the same `enhanceApp` block.
- The `index.md` spine band added here is the natural anchor point: runbook 03's `<HomeHero>`
  absorbs this `<section class="ifx-spine-hero">` block (and the `.ifx-spine-hero` utilities can
  move into the hero component's scope at that time).
