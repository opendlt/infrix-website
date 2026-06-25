# Runbook 03 — Interactive Narrative: The Scrollytelling Landing Components

> **Effort 3 of 6.** Prerequisites: runbook [`01`](./01-foundation.md) (theme scaffold,
> tokens, rewritten copy) and runbook [`02`](./02-spine-visuals.md) (`<SpineDiagram>` +
> `theme/data/spine.ts`). Unblocks: runbook [`05`](./05-wasm-verifier.md) (the `verify()`
> seam). Read [`00-overview.md`](./00-overview.md) first — tokens, the spine model (§5), the
> a11y checklist (§7), the perf budget (§8), the banned-jargon list (§6), and the DoD (§9)
> are defined there and are **not** repeated here.
>
> **Goal:** Turn the static, intentional-but-flat landing from runbook 01 into the
> *narrative* the UX review demands — the magic trick shown, the spine flowing, the EVM
> contrast animating, and **the signature interactive** where a visitor drives an intent
> through all seven stages and verifies the resulting proof. This is UX-REVIEW Part 4
> §2–§6 and Part 10 **P1** (items 6–8), minus the real WASM (that is runbook 05).

---

## Outcomes (what "done" looks like)

1. Five new Vue 3 `<script setup>` SFCs live in `docs/.vitepress/theme/components/`, each with
   a full template, typed `script setup`, and scoped styles, all consuming **only** the
   canonical tokens from `00-overview.md` §4 (no new raw hex):
   - `TypedTerminal.vue` — typewriter animation of the golden-path terminal (UX §2).
   - `EvmContrast.vue` — the animated, scroll-revealed two-column differentiation block (UX §3).
   - `PersonaCards.vue` — four persona-routing cards into the docs (UX §6).
   - `SpineWalkthrough.vue` — **the signature interactive**: a keyboard-driven step-through of
     the seven stages, synced to a live `<SpineDiagram>`, ending in a (mocked) proof verify (UX §4).
   - `HomeHero.vue` — the assembled hero (runbook 01 copy + animated `<SpineDiagram>`), replacing
     the `layout: home` hero.
2. A new canned demo dataset at `theme/data/demo-bundle.ts` — deterministic, fake-but-realistic
   data mirroring the real lifecycle in [`governance-spine.md`](../../governance-spine.md) and
   [`first-intent.md`](../../tutorials/first-intent.md): intent object, four plan steps with a
   plugin selection + reason, separation-of-duties approval, execution greens, a ticking finality
   state, an evidence bundle, and an anchor hash.
3. A **single canonical scroll-reveal helper** (this runbook owns it) wired in `enhanceApp`,
   replacing the "optional snippet" placeholder from runbook 01's `utilities.css` note.
4. `index.md` switches from `layout: home` to `layout: page` and composes the new components,
   while **still containing the literal strings** `governance-first`, `submitIntent`, and
   `governance-spine` (the fence asserts them).
5. All six new components registered in `theme/index.ts`.
6. Fence green, build green, both themes legible, a11y §7 satisfied, perf §8 respected.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/03-interactive-narrative
npm ci
npm run dev                       # confirm 01 + 02 render before adding components
node --test docs-structure.test.mjs   # fence green from the start
```

Confirm the dependencies this runbook builds on are present:

```bash
ls docs/.vitepress/theme/data/spine.ts            # runbook 02 — SPINE_STAGES
ls docs/.vitepress/theme/components/SpineDiagram.vue   # runbook 02
```

If either is missing, **stop** — finish runbook 02 first. This runbook imports
`SPINE_STAGES` from `spine.ts` and mounts `<SpineDiagram>` with an `:active-id` prop; both
are runbook-02 surfaces.

### Contracts this runbook relies on (from runbook 02)

Pinned here so the code below compiles against a known shape. If runbook 02 named anything
differently, reconcile **in runbook 02** (it owns these), not by forking the types here.

```ts
// docs/.vitepress/theme/data/spine.ts   (runbook 02 — referenced, not redefined)
export interface SpineStage {
  id: 'intent' | 'plan' | 'approval' | 'execution' | 'outcome' | 'evidence' | 'anchor';
  label: string;   color: string;   blurb: string;
}
export const SPINE_STAGES: SpineStage[]; // 7 entries, canonical order
```

```vue
<!-- <SpineDiagram> (runbook 02) accepts at minimum: -->
<SpineDiagram
  :animated="boolean"     // hero loop pulse; false = static
  :active-id="SpineStage['id'] | null"   // highlights one node (walkthrough sync)
/>
```

> **If runbook 02 did not yet expose `:active-id`:** that prop is *required* by the
> walkthrough. Add it to `<SpineDiagram>` in a tiny follow-up on the 02 surface (a single
> reactive prop that toggles an `.is-active` class on the matching node). Treat it as a 02
> contract bug, not new 03 work. The fallback in §Step 5 below degrades gracefully if the
> prop is ignored, but the *intended* behaviour is the diagram lighting the current node.

---

## Step 1 — The canned demo bundle (`theme/data/demo-bundle.ts`)

This is the deterministic data the walkthrough animates over. It is **fake but realistic**:
shapes and field names mirror the real lifecycle so the demo teaches the actual model, but
nothing here calls a backend. Every hash is a stable literal (no `Math.random`) so the demo
renders identically on every load and in SSR.

Create `docs/.vitepress/theme/data/demo-bundle.ts`:

```ts
// Canned, deterministic demo data for <SpineWalkthrough>. Fake-but-realistic:
// field names mirror the real governance spine (see docs/governance-spine.md and
// docs/tutorials/first-intent.md) so the interactive teaches the true model, but
// no value here comes from a live node. Hashes are fixed literals — never random —
// so the walkthrough is stable across reloads and SSR-safe.
//
// Keyed by SpineStage.id so <SpineWalkthrough> can index each stage's payload
// directly from SPINE_STAGES order.

export interface DemoPluginSelection {
  plugin: string;
  reason: string;                    // PluginSelection.Reason (public voice)
  confidentiality: string;           // ConfidentialityImplications, glossed
  cost: string;                      // CostImplications, glossed
}

export interface DemoPlanStep {
  id: string;
  label: string;                     // plain-English step name
  stepType: string;                  // canonical PlanStepType, shown as a code chip
  selection?: DemoPluginSelection;   // only the dispatched step carries a selection
}

export interface DemoApprover {
  id: string;                        // acc:// identity
  name: string;
  role: 'submitter' | 'approver';
  state: 'submitted' | 'signed' | 'blocked';
}

export type DemoFinality = 'provisional' | 'locally_final' | 'l0_anchored_final';

export interface DemoBundle {
  intent: {
    id: string;
    goal: string;                    // IntentGoalType (e.g. GOVERNED_TRANSFER)
    summary: string;                 // plain-English restatement
    params: Record<string, string | number>;
  };
  plan: {
    id: string;
    planHash: string;
    steps: DemoPlanStep[];
  };
  approval: {
    requirement: string;             // PlanApprovalReq, in plain words
    approvers: DemoApprover[];
    separationNote: string;          // why submitter ≠ approver, for the SR text
  };
  execution: {
    // step id -> the finality the run reached when that step turned green
    greenedAt: Record<string, DemoFinality>;
  };
  outcome: {
    status: string;                  // settled
    finalitySequence: DemoFinality[];// provisional -> locally_final -> l0_anchored_final
  };
  evidence: {
    // the portable receipt panel (UX §4 "Evidence")
    rows: { label: string; value: string; token: 'evidence' | 'brand' | 'verified' }[];
  };
  anchor: {
    chainHash: string;               // the digest written to Accumulate L0
    network: string;
    height: number;
  };
}

export const DEMO_BUNDLE: DemoBundle = {
  intent: {
    id: 'intent-7f3a9c',
    goal: 'GOVERNED_TRANSFER',
    summary: 'Transfer 100 tokens from Alice to Bob.',
    params: {
      from: 'acc://alice.acme',
      to: 'acc://bob.acme',
      amount: 100,
    },
  },

  plan: {
    id: 'plan-7f3a9c-01',
    planHash: '0x9b41…c0de',
    steps: [
      { id: 's1', label: 'Validate parameters', stepType: 'PlanStepValidate' },
      { id: 's2', label: 'Check policy',         stepType: 'PlanStepPolicyCheck' },
      { id: 's3', label: 'Collect approvals',    stepType: 'PlanStepApproval' },
      {
        id: 's4',
        label: 'Settle the transfer',
        stepType: 'PlanStepSettlement',
        selection: {
          plugin: 'settlement-plugin',
          // Public-voice gloss of PluginSelection.Reason — Infrix picks the right
          // execution for each step (00-overview §6 replacement vocabulary).
          reason: 'Lowest cost that still meets the confidentiality the transfer needs.',
          confidentiality: 'Keeps balances private to the two parties.',
          cost: 'Cheapest of the eligible settlement paths.',
        },
      },
    ],
  },

  approval: {
    requirement: 'One approver, who must be different from whoever submitted.',
    approvers: [
      { id: 'acc://alice.acme', name: 'Alice',  role: 'submitter', state: 'submitted' },
      { id: 'acc://carol.acme', name: 'Carol',  role: 'approver',  state: 'signed' },
    ],
    separationNote:
      'Separation of duties: Alice submitted the intent, so Alice cannot also approve it. ' +
      'A different actor — Carol — signs. The submitter is shown greyed out.',
  },

  execution: {
    greenedAt: {
      s1: 'provisional',
      s2: 'provisional',
      s3: 'provisional',
      s4: 'locally_final',
    },
  },

  outcome: {
    status: 'settled',
    finalitySequence: ['provisional', 'locally_final', 'l0_anchored_final'],
  },

  evidence: {
    // The portable receipt — "a receipt you can verify offline" (00-overview §6).
    rows: [
      { label: 'Plan hash',        value: '0x9b41…c0de', token: 'brand'    },
      { label: 'Trace digest',     value: '0x3d77…a1f0', token: 'evidence' },
      { label: 'Trust snapshot',   value: '0xb20e…7744', token: 'evidence' },
      { label: 'Approval proof',   value: 'Carol · 1 of 1', token: 'verified' },
      { label: 'Anchor reference', value: '0xfeed…b0ba', token: 'brand'    },
    ],
  },

  anchor: {
    chainHash: '0xfeed…b0ba',
    network: 'Accumulate L0',
    height: 482913,
  },
};
```

> **Why these field names.** `GOVERNED_TRANSFER`, the four step types, `PluginSelection`
> with a `Reason`, separation-of-duties (submitter ≠ approver), the
> `provisional → locally_final → l0_anchored_final` finality ladder, the evidence rows
> (plan-hash, trace digest, trust snapshot, anchor ref), and the chain hash all come
> straight from `governance-spine.md` §2–§7 and `first-intent.md`. The *visible copy*,
> however, is glossed to the public voice per `00-overview.md` §6 — no `§15.1`, no
> `DisclosureContext`, no `UnifiedStepParams` reach a rendered string.

---

## Step 2 — The canonical scroll-reveal helper

Runbook 01 shipped the `.ifx-reveal` / `.ifx-reveal.is-in` CSS and *deferred* the JS hook to
"runbook 03 (owns the canonical version)". This is that version. One `IntersectionObserver`,
created in `enhanceApp`, adds `.is-in` to any `.ifx-reveal` element when it scrolls into view,
then unobserves it (one-shot reveal — never re-hides). It is a no-op under SSR (no `window`),
under `prefers-reduced-motion` (the CSS already shows everything), and when `IntersectionObserver`
is unavailable (graceful fallback: reveal immediately).

Create `docs/.vitepress/theme/composables/useReveal.ts`:

```ts
// Canonical scroll-reveal wiring (owned by runbook 03). Adds `.is-in` to every
// `.ifx-reveal` element the first time it enters the viewport, then stops watching it.
//
// Safe under SSR (guards `window`), respects prefers-reduced-motion (the CSS in
// utilities.css already renders `.ifx-reveal` fully visible in that mode, so we
// simply reveal everything immediately and skip the observer), and degrades to an
// instant reveal where IntersectionObserver is missing.
//
// Designed to be called once per route (VitePress re-renders the DOM on navigation),
// so it re-scans on `router.onAfterRouteChange`.

const REVEALED = 'is-in';

function revealAll(): void {
  document.querySelectorAll('.ifx-reveal').forEach((el) => el.classList.add(REVEALED));
}

let observer: IntersectionObserver | null = null;

function scan(): void {
  if (typeof window === 'undefined') return;

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof IntersectionObserver === 'undefined') {
    revealAll();
    return;
  }

  observer ??= new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add(REVEALED);
          obs.unobserve(entry.target);   // one-shot
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );

  document.querySelectorAll('.ifx-reveal:not(.is-in)').forEach((el) => observer!.observe(el));
}

/** Wire the reveal observer; call from enhanceApp. Re-scans after each route change. */
export function installReveal(onAfterRouteChange: (cb: () => void) => void): void {
  if (typeof window === 'undefined') return;
  const run = () => requestAnimationFrame(scan);   // wait for the new DOM to paint
  run();
  onAfterRouteChange(() => run());
}
```

Wire it in `theme/index.ts` (Step 7 registers components in the same file).

---

## Step 3 — `TypedTerminal.vue`

The golden-path terminal (UX §2), typed in on scroll-into-view. **Accessibility is the
hard part and the design is deliberate:** the full text is always present in the DOM as real,
selectable, screen-reader-readable content. The typewriter is a *purely visual overlay*
marked `aria-hidden="true"`; the live region is `aria-live="off"` so assistive tech never
narrates character-by-character. Under `prefers-reduced-motion`, the overlay is skipped
entirely and the full text shows instantly.

Create `docs/.vitepress/theme/components/TypedTerminal.vue`:

```vue
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
```

> **A11y rationale.** The `<pre class="ifx-term-sr">` carries the complete text for screen
> readers and clipboard; the animated `<div>` is `aria-hidden`. The `min-height` on the body
> reserves the full block so the page never reflows as characters appear (perf §8: zero CLS).
> Reduced-motion shows everything at once and drops the caret animation.

---

## Step 4 — `EvmContrast.vue`

Upgrades runbook 01's static markdown contrast grid into an animated component. It reuses the
**`.ifx-contrast` tokens already in `utilities.css`** (do not re-style the grid — only add the
stagger). Content is driven by a `rows` prop of `{ old, infrix }` pairs so the copy stays
authored, not hard-coded. Each row reveals on scroll with a staggered delay; the "old way"
column is muted, the Infrix column carries the brand glow (both already in `utilities.css`).

Create `docs/.vitepress/theme/components/EvmContrast.vue`:

```vue
<script setup lang="ts">
interface ContrastRow {
  old: string;       // the EVM / typical-chain behaviour
  infrix: string;    // the Infrix behaviour
}

withDefaults(
  defineProps<{
    heading?: string;
    sub?: string;
    oldTitle?: string;
    infrixTitle?: string;
    rows?: ContrastRow[];
  }>(),
  {
    heading: 'Not another EVM. Not another VM. A governance spine the contracts run inside.',
    sub:
      'The traditional contract surface still exists — @call, @deploy, storage. It just sits ' +
      'beneath the spine, not above it. You can’t bypass governance, because there’s no API to.',
    oldTitle: 'On EVM / typical chains',
    infrixTitle: 'On Infrix',
    rows: () => [
      {
        old: 'You sign a raw transaction and trust validators to do the right thing.',
        infrix: 'You submit an intent — what you want, in plain or typed terms.',
      },
      {
        old: 'Governance is described in docs and hoped for in practice.',
        infrix: 'Governance is enforced in code: no path mutates state without approval + policy.',
      },
      {
        old: 'To audit, you trust the chain’s RPC or re-run an indexer.',
        infrix: 'Every outcome ships a portable evidence bundle you verify offline.',
      },
      {
        old: 'Plugin / VM choice is hard-coded.',
        infrix: 'Infrix picks the right execution per step — confidentiality, cost, trust, capability.',
      },
    ],
  },
);
</script>

<template>
  <section class="ifx-contrast-block ifx-container">
    <header class="ifx-contrast-head ifx-reveal">
      <h2>{{ heading }}</h2>
      <p class="sub">{{ sub }}</p>
    </header>

    <!-- Reuse the .ifx-contrast grid from utilities.css; this component only adds
         per-row scroll-reveal + stagger. Two real columns, headed once. -->
    <div class="ifx-contrast">
      <div class="old">
        <p class="col-title">{{ oldTitle }}</p>
        <ul>
          <li
            v-for="(row, i) in rows"
            :key="'o' + i"
            class="ifx-reveal"
            :style="{ transitionDelay: 70 * i + 'ms' }"
          >{{ row.old }}</li>
        </ul>
      </div>
      <div class="infrix">
        <p class="col-title">{{ infrixTitle }}</p>
        <ul>
          <li
            v-for="(row, i) in rows"
            :key="'i' + i"
            class="ifx-reveal"
            :style="{ transitionDelay: 70 * i + 'ms' }"
          >{{ row.infrix }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ifx-contrast-block { margin: 72px auto; }
.ifx-contrast-head { max-width: 760px; margin-bottom: 28px; }
.ifx-contrast-head h2 { font-family: var(--ifx-font-display); letter-spacing: -0.02em; }
.ifx-contrast-head .sub { color: var(--ifx-text-muted); }
/* Only layout inside the columns is local; the grid + glow + mute come from
   utilities.css (.ifx-contrast / .old / .infrix). */
.ifx-contrast .col-title {
  font-family: var(--ifx-font-mono); font-size: 0.78rem; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--ifx-text-muted); margin: 0 0 12px;
}
.ifx-contrast .infrix .col-title { color: var(--ifx-brand); }
.ifx-contrast ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.ifx-contrast li { line-height: 1.55; }
.ifx-contrast .infrix li::before {
  content: '✓'; color: var(--ifx-verified); margin-right: 8px; font-weight: 600;
}
.ifx-contrast .old li::before {
  content: '·'; color: var(--ifx-text-muted); margin-right: 8px;
}
</style>
```

> **Token reuse.** The grid columns, the `.old` mute (`opacity: 0.72`), and the `.infrix`
> brand glow are defined once in `utilities.css` (runbook 01) and inherited here — this
> component adds nothing but the headed columns, the icon prefixes (color is never the *only*
> signal — §7), and the staggered reveal. The icon ✓ / · pairing means the contrast reads
> for color-blind users.

---

## Step 5 — `SpineWalkthrough.vue` (the signature interactive)

The centrepiece (UX §4). A **user-driven** step-through of the seven stages — **no
scroll-hijacking** (§7). State is a simple index over `SPINE_STAGES`; `Next`/`Prev` buttons
and Left/Right arrow keys move it; the active stage drives a live `<SpineDiagram :active-id>`
so the diagram lights the current node. The final stage exposes a **`Verify this proof`**
button that calls a local `verify()` function — **currently mocked**, with a clearly marked
seam for runbook 05.

Create `docs/.vitepress/theme/components/SpineWalkthrough.vue`:

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { SPINE_STAGES } from '../data/spine';
import { DEMO_BUNDLE } from '../data/demo-bundle';
import type { DemoBundle, DemoFinality } from '../data/demo-bundle';

const bundle: DemoBundle = DEMO_BUNDLE;
const stages = SPINE_STAGES;

const index = ref(0);
const stage = computed(() => stages[index.value]);
const atStart = computed(() => index.value === 0);
const atEnd = computed(() => index.value === stages.length - 1);

function next() { if (!atEnd.value) index.value++; }
function prev() { if (!atStart.value) index.value--; }
function goTo(i: number) { index.value = i; }

// ---- Keyboard: Left/Right move stages while focus is inside the widget. ----
const root = ref<HTMLElement | null>(null);
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') { next(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { prev(); e.preventDefault(); }
}

// ---- Finality ticker: provisional → locally_final → l0_anchored_final on the outcome stage. ----
const finalityStep = ref(0);
let finalityTimer: ReturnType<typeof setInterval> | null = null;
const currentFinality = computed<DemoFinality>(
  () => bundle.outcome.finalitySequence[finalityStep.value],
);
function runFinalityTicker() {
  stopFinalityTicker();
  finalityStep.value = 0;
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { finalityStep.value = bundle.outcome.finalitySequence.length - 1; return; }
  finalityTimer = setInterval(() => {
    if (finalityStep.value < bundle.outcome.finalitySequence.length - 1) finalityStep.value++;
    else stopFinalityTicker();
  }, 900);
}
function stopFinalityTicker() {
  if (finalityTimer) { clearInterval(finalityTimer); finalityTimer = null; }
}

// Kick the ticker whenever we land on the outcome stage.
import { watch } from 'vue';
watch(stage, (s) => {
  if (s.id === 'outcome') runFinalityTicker();
  else stopFinalityTicker();
});

onMounted(() => root.value?.addEventListener('keydown', onKey));
onBeforeUnmount(() => { root.value?.removeEventListener('keydown', onKey); stopFinalityTicker(); });

// ---------------------------------------------------------------------------
// INTEGRATION SEAM — runbook 05 (WASM verifier) replaces this mock.
// ---------------------------------------------------------------------------
// TODO(runbook 05): swap this canned result for the real offline verifier
// (evidence.VerifyPortablePackage compiled to WASM). The async signature and the
// { ok, chainHash, reason } shape are intentionally identical to the real binding
// described in 00-overview file tree (assets/wasm) and UX-REVIEW Part 9 §4, so the
// real verifier drops in with no template change. Until then this returns the
// canned anchor hash from the demo bundle after a short faux-work delay.
interface VerifyResult { ok: boolean; chainHash: string; reason?: string; }

const verifyState = ref<'idle' | 'running' | 'done' | 'error'>('idle');
const verifyResult = ref<VerifyResult | null>(null);

async function verify(_bundleJSON: string): Promise<VerifyResult> {
  // MOCK. Deterministic ✓ against the demo bundle's anchor hash.
  await new Promise((r) => setTimeout(r, 650));
  return { ok: true, chainHash: bundle.anchor.chainHash };
}

async function onVerify() {
  verifyState.value = 'running';
  verifyResult.value = null;
  try {
    verifyResult.value = await verify(JSON.stringify(bundle));
    verifyState.value = verifyResult.value.ok ? 'done' : 'error';
  } catch (err) {
    verifyResult.value = { ok: false, chainHash: '', reason: String(err) };
    verifyState.value = 'error';
  }
}

// Approver display state → CSS class (submitter greyed, approver signs green).
function approverClass(state: string) {
  return { submitted: 'is-submitter', signed: 'is-signed', blocked: 'is-blocked' }[state] ?? '';
}
</script>

<template>
  <section
    ref="root"
    class="ifx-walk ifx-container ifx-reveal"
    aria-roledescription="step-through demo"
    aria-label="Watch an intent become a proof, one governance stage at a time"
  >
    <header class="ifx-walk-head">
      <h2>Watch an intent become a proof</h2>
      <p class="sub">Step through the governance spine — one enforced pipeline — and verify the receipt yourself.</p>
    </header>

    <!-- The live diagram, lit at the current stage. Decorative duplication of the
         tablist state, so aria-hidden. -->
    <div class="ifx-walk-diagram" aria-hidden="true">
      <SpineDiagram :animated="false" :active-id="stage.id" />
    </div>

    <!-- Stage selector as a real tablist: keyboard + SR navigable, color-coded by
         stage token with a text label (color is never the sole signal). -->
    <div class="ifx-walk-tabs" role="tablist" aria-label="Governance stages">
      <button
        v-for="(s, i) in stages"
        :key="s.id"
        role="tab"
        :id="'walk-tab-' + s.id"
        :aria-selected="i === index"
        :aria-controls="'walk-panel'"
        :tabindex="i === index ? 0 : -1"
        class="ifx-walk-tab"
        :class="{ 'is-active': i === index, 'is-done': i < index }"
        :style="{ '--stage-color': s.color }"
        @click="goTo(i)"
      >
        <span class="num">{{ i + 1 }}</span>
        <span class="label">{{ s.label }}</span>
      </button>
    </div>

    <!-- One panel; its content swaps with the active stage. -->
    <div
      id="walk-panel"
      class="ifx-walk-panel"
      role="tabpanel"
      :aria-labelledby="'walk-tab-' + stage.id"
      tabindex="0"
    >
      <p class="stage-blurb" :style="{ '--stage-color': stage.color }">
        <span class="stage-dot" /> {{ stage.blurb }}
      </p>

      <!-- ===== INTENT ===== -->
      <div v-if="stage.id === 'intent'" class="stage-body">
        <p class="restate">{{ bundle.intent.summary }}</p>
        <pre class="kv"><code>{{ bundle.intent.goal }} {
  from:   {{ bundle.intent.params.from }}
  to:     {{ bundle.intent.params.to }}
  amount: {{ bundle.intent.params.amount }}
}</code></pre>
        <p class="meta">intent <code>{{ bundle.intent.id }}</code></p>
      </div>

      <!-- ===== PLAN ===== -->
      <div v-else-if="stage.id === 'plan'" class="stage-body">
        <ol class="steps">
          <li v-for="s in bundle.plan.steps" :key="s.id">
            <span class="step-label">{{ s.label }}</span>
            <code class="step-type">{{ s.stepType }}</code>
            <div v-if="s.selection" class="selection">
              <p><strong>{{ s.selection.plugin }}</strong> — {{ s.selection.reason }}</p>
              <ul>
                <li>{{ s.selection.confidentiality }}</li>
                <li>{{ s.selection.cost }}</li>
              </ul>
            </div>
          </li>
        </ol>
        <p class="meta">plan <code>{{ bundle.plan.id }}</code> · hash <code>{{ bundle.plan.planHash }}</code></p>
      </div>

      <!-- ===== APPROVAL (separation of duties) ===== -->
      <div v-else-if="stage.id === 'approval'" class="stage-body">
        <p class="restate">{{ bundle.approval.requirement }}</p>
        <div class="approvers">
          <div
            v-for="a in bundle.approval.approvers"
            :key="a.id"
            class="approver"
            :class="approverClass(a.state)"
          >
            <span class="avatar" aria-hidden="true">{{ a.name.charAt(0) }}</span>
            <span class="who">{{ a.name }}</span>
            <span class="role">{{ a.role }}</span>
            <span class="badge">
              {{ a.state === 'signed' ? '✓ signed' : a.state === 'submitted' ? 'submitted (can’t approve)' : 'blocked' }}
            </span>
          </div>
        </div>
        <p class="meta sr-note">{{ bundle.approval.separationNote }}</p>
      </div>

      <!-- ===== EXECUTION ===== -->
      <div v-else-if="stage.id === 'execution'" class="stage-body">
        <ul class="exec">
          <li v-for="s in bundle.plan.steps" :key="s.id" class="exec-step">
            <span class="check">✓</span>
            <span class="step-label">{{ s.label }}</span>
            <code class="fin">{{ bundle.execution.greenedAt[s.id] }}</code>
          </li>
        </ul>
      </div>

      <!-- ===== OUTCOME (finality ticker) ===== -->
      <div v-else-if="stage.id === 'outcome'" class="stage-body">
        <p class="restate">Status: <strong>{{ bundle.outcome.status }}</strong></p>
        <ol class="finality">
          <li
            v-for="(f, i) in bundle.outcome.finalitySequence"
            :key="f"
            :class="{ reached: i <= finalityStep, current: i === finalityStep }"
          >
            <span class="check">{{ i <= finalityStep ? '✓' : '○' }}</span> {{ f }}
          </li>
        </ol>
      </div>

      <!-- ===== EVIDENCE (portable receipt) ===== -->
      <div v-else-if="stage.id === 'evidence'" class="stage-body">
        <p class="restate">A portable receipt you can verify offline.</p>
        <dl class="bundle">
          <div v-for="r in bundle.evidence.rows" :key="r.label" class="bundle-row" :class="'tok-' + r.token">
            <dt>{{ r.label }}</dt>
            <dd><code>{{ r.value }}</code></dd>
          </div>
        </dl>
      </div>

      <!-- ===== ANCHOR + VERIFY payoff ===== -->
      <div v-else-if="stage.id === 'anchor'" class="stage-body">
        <p class="restate">
          A digest is written to <strong>{{ bundle.anchor.network }}</strong> at height
          <code>{{ bundle.anchor.height }}</code>.
        </p>
        <pre class="kv anchor"><code>{{ bundle.anchor.chainHash }}</code></pre>

        <button class="ifx-verify-btn" :disabled="verifyState === 'running'" @click="onVerify">
          <span v-if="verifyState === 'running'" class="spin" aria-hidden="true" />
          {{ verifyState === 'running' ? 'Verifying…' : 'Verify this proof' }}
        </button>

        <p
          v-if="verifyState === 'done' && verifyResult"
          class="verify-result ok"
          role="status"
        >
          ✓ verified offline — chain hash <code>{{ verifyResult.chainHash }}</code>
        </p>
        <p
          v-else-if="verifyState === 'error' && verifyResult"
          class="verify-result err"
          role="status"
        >
          ✗ verification failed — {{ verifyResult.reason }}
        </p>
        <p class="meta demo-note">Demo data. The live, in-browser verifier ships in a later release.</p>
      </div>
    </div>

    <!-- Explicit Prev/Next — the ONLY drivers (no scroll-jacking). -->
    <div class="ifx-walk-nav">
      <button class="nav-btn" :disabled="atStart" @click="prev">← Prev</button>
      <span class="nav-pos" aria-live="polite">Stage {{ index + 1 }} of {{ stages.length }} — {{ stage.label }}</span>
      <button class="nav-btn primary" :disabled="atEnd" @click="next">Next →</button>
    </div>
  </section>
</template>

<style scoped>
.ifx-walk { margin: 88px auto; }
.ifx-walk-head { max-width: 720px; margin-bottom: 24px; }
.ifx-walk-head h2 { font-family: var(--ifx-font-display); letter-spacing: -0.02em; }
.ifx-walk-head .sub { color: var(--ifx-text-muted); }
.ifx-walk-diagram { margin: 12px 0 24px; }

/* Tablist */
.ifx-walk-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.ifx-walk-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: var(--ifx-r-sm);
  border: 1px solid var(--ifx-border); background: var(--ifx-surface);
  color: var(--ifx-text-muted); font-size: 0.86rem; cursor: pointer;
  transition: color var(--ifx-dur-fast) var(--ifx-ease), border-color var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-walk-tab .num {
  display: inline-grid; place-items: center; width: 20px; height: 20px;
  border-radius: 50%; font-size: 0.74rem; background: var(--ifx-surface-2);
}
.ifx-walk-tab.is-done { color: var(--ifx-text); }
.ifx-walk-tab.is-active {
  color: var(--ifx-text); border-color: var(--stage-color);
  box-shadow: 0 0 0 1px var(--stage-color);
}
.ifx-walk-tab.is-active .num { background: var(--stage-color); color: var(--ifx-bg); }
.ifx-walk-tab:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }

/* Panel */
.ifx-walk-panel {
  border: 1px solid var(--ifx-border); border-radius: var(--ifx-r-md);
  background: var(--ifx-surface); padding: 24px; min-height: 280px;
}
.ifx-walk-panel:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.stage-blurb { display: flex; align-items: center; gap: 10px; font-weight: 600; margin-top: 0; }
.stage-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--stage-color); flex: none; }
.restate { color: var(--ifx-text); }
.meta { color: var(--ifx-text-muted); font-size: 0.84rem; }
.meta code, .kv code, .step-type, .fin { font-family: var(--ifx-font-mono); }
.kv {
  background: var(--ifx-bg); border: 1px solid var(--ifx-border);
  border-radius: var(--ifx-r-sm); padding: 14px 16px; overflow-x: auto;
  font-family: var(--ifx-font-mono); font-size: 0.86rem;
}
.kv.anchor code { color: var(--ifx-brand); }

/* Plan */
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.steps > li { border-left: 2px solid var(--ifx-border); padding-left: 14px; }
.step-label { font-weight: 600; margin-right: 8px; }
.step-type {
  font-size: 0.78rem; color: var(--ifx-evidence);
  background: color-mix(in srgb, var(--ifx-evidence) 12%, transparent);
  padding: 1px 6px; border-radius: 4px;
}
.selection {
  margin-top: 8px; padding: 12px; border-radius: var(--ifx-r-sm);
  background: color-mix(in srgb, var(--ifx-brand) 8%, var(--ifx-surface-2));
  border: 1px solid color-mix(in srgb, var(--ifx-brand) 28%, transparent);
}
.selection ul { margin: 6px 0 0; padding-left: 18px; color: var(--ifx-text-muted); }

/* Approval — separation of duties */
.approvers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0; }
@media (max-width: 560px) { .approvers { grid-template-columns: 1fr; } }
.approver {
  display: grid; grid-template-columns: auto 1fr; grid-auto-rows: min-content; gap: 2px 12px;
  align-items: center; padding: 14px; border-radius: var(--ifx-r-sm);
  border: 1px solid var(--ifx-border); background: var(--ifx-surface-2);
}
.approver .avatar {
  grid-row: span 2; width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center; font-weight: 700; color: var(--ifx-bg);
  background: var(--ifx-text-muted);
}
.approver .who { font-weight: 600; }
.approver .role { font-size: 0.78rem; color: var(--ifx-text-muted); text-transform: capitalize; }
.approver .badge { grid-column: 1 / -1; margin-top: 6px; font-size: 0.8rem; }
.approver.is-submitter { opacity: 0.55; }            /* submitter greyed out */
.approver.is-signed .avatar { background: var(--ifx-verified); }
.approver.is-signed .badge { color: var(--ifx-verified); }
.sr-note { margin-top: 12px; }

/* Execution */
.exec { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.exec-step { display: flex; align-items: center; gap: 10px; }
.exec-step .check { color: var(--ifx-verified); font-weight: 700; }
.exec-step .fin { font-size: 0.78rem; color: var(--ifx-text-muted); margin-left: auto; }

/* Outcome finality ticker */
.finality { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 10px; }
.finality li { color: var(--ifx-text-muted); transition: color var(--ifx-dur) var(--ifx-ease); }
.finality li .check { color: var(--ifx-border); }
.finality li.reached { color: var(--ifx-text); }
.finality li.reached .check { color: var(--ifx-verified); }
.finality li.current { color: var(--ifx-verified); font-weight: 600; }

/* Evidence bundle */
.bundle { display: grid; gap: 8px; margin: 12px 0 0; }
.bundle-row {
  display: flex; justify-content: space-between; gap: 12px;
  padding: 10px 14px; border-radius: var(--ifx-r-sm);
  background: var(--ifx-surface-2); border-left: 3px solid var(--ifx-border);
}
.bundle-row dt { color: var(--ifx-text-muted); margin: 0; }
.bundle-row dd { margin: 0; }
.bundle-row dd code { font-family: var(--ifx-font-mono); }
.bundle-row.tok-evidence { border-left-color: var(--ifx-evidence); }
.bundle-row.tok-brand    { border-left-color: var(--ifx-brand); }
.bundle-row.tok-verified { border-left-color: var(--ifx-verified); }

/* Verify payoff */
.ifx-verify-btn {
  margin-top: 18px; display: inline-flex; align-items: center; gap: 10px;
  padding: 12px 22px; border-radius: var(--ifx-r-sm); cursor: pointer;
  font-weight: 600; color: var(--ifx-bg); background: var(--ifx-verified);
  border: 1px solid transparent;
}
.ifx-verify-btn:disabled { opacity: 0.7; cursor: progress; }
.ifx-verify-btn:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.spin {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--ifx-bg) 40%, transparent);
  border-top-color: var(--ifx-bg); animation: ifx-spin 0.7s linear infinite;
}
.verify-result { margin-top: 14px; font-weight: 600; }
.verify-result.ok { color: var(--ifx-verified); }
.verify-result.err { color: var(--ifx-pending); }
.verify-result code { font-family: var(--ifx-font-mono); font-weight: 400; }
.demo-note { margin-top: 8px; }

/* Nav */
.ifx-walk-nav { display: flex; align-items: center; gap: 16px; margin-top: 22px; }
.nav-btn {
  padding: 10px 18px; border-radius: var(--ifx-r-sm); cursor: pointer;
  border: 1px solid var(--ifx-border); background: var(--ifx-surface); color: var(--ifx-text);
}
.nav-btn.primary { border-color: var(--ifx-brand); color: var(--ifx-brand); }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nav-btn:focus-visible { outline: 2px solid var(--ifx-brand); outline-offset: 2px; }
.nav-pos { color: var(--ifx-text-muted); font-size: 0.86rem; margin-left: auto; }

@keyframes ifx-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .spin { animation: none; }
  .finality li { transition: none; }
}
</style>
```

> **Why a tablist, not scrollytelling.** UX §4 says "user-driven … `Next/Prev`, NOT
> scroll-hijacking" and §7 forbids scroll-jacking. Modelling the stage selector as a WAI-ARIA
> tablist gives correct roles, keyboard navigation, and SR semantics for free; the
> `aria-live="polite"` position line announces stage changes. The diagram is `aria-hidden`
> because it duplicates the tablist state visually. Color per stage is always paired with the
> numbered label and text (§7). The finality ticker is the only timed motion and it
> collapses to its final state under reduced-motion.

---

## Step 6 — `PersonaCards.vue`

Four routing cards (UX §6) into existing docs entries. Real `<a>` links (keyboard-native,
no JS routing tricks), each with an icon, a one-line pitch, and a destination that exists in
the fence's `requiredPages`.

Create `docs/.vitepress/theme/components/PersonaCards.vue`:

```vue
<script setup lang="ts">
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
        :href="p.href"
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
```

> Every `href` points at a page in the fence's `requiredPages` list — no dead links. Cards
> are anchors, so Tab/Enter work with zero extra script and the focus ring is honoured.

---

## Step 7 — `HomeHero.vue` and component registration

`HomeHero.vue` assembles the hero from **runbook 01's verbatim copy** (headline, subhead,
the three CTAs) and mounts the **animated** `<SpineDiagram>` beside it, replacing the
`layout: home` hero.

Create `docs/.vitepress/theme/components/HomeHero.vue`:

```vue
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
```

Now register all six components and wire the reveal helper. Update
`docs/.vitepress/theme/index.ts` (extends the runbook-01 file; the commented slot is where
runbook 02 already added `SpineDiagram`):

```ts
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

import { installReveal } from "./composables/useReveal";

// runbook 02
import SpineDiagram from "./components/SpineDiagram.vue";
// runbook 03
import HomeHero from "./components/HomeHero.vue";
import TypedTerminal from "./components/TypedTerminal.vue";
import EvmContrast from "./components/EvmContrast.vue";
import SpineWalkthrough from "./components/SpineWalkthrough.vue";
import PersonaCards from "./components/PersonaCards.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component("SpineDiagram", SpineDiagram);
    app.component("HomeHero", HomeHero);
    app.component("TypedTerminal", TypedTerminal);
    app.component("EvmContrast", EvmContrast);
    app.component("SpineWalkthrough", SpineWalkthrough);
    app.component("PersonaCards", PersonaCards);

    // Canonical scroll-reveal wiring (owned by this runbook). No-op under SSR.
    installReveal((cb) => {
      const prev = router.onAfterRouteChange;
      router.onAfterRouteChange = (to) => { prev?.(to); cb(); };
    });
  },
} satisfies Theme;
```

> `<SpineWalkthrough>` references `<SpineDiagram>` in its template; because both are
> registered globally here, no per-component import of the diagram is needed inside the SFC.

---

## Step 8 — Recompose `index.md`

Switch the landing from `layout: home` to **`layout: page`** (a blank canvas — no
VitePress hero/feature scaffolding) and compose the components in narrative order. The
markdown body is wrapped in `.ifx-home` so the runbook-01 landing primitives apply.

**The fence still requires the literals `governance-first`, `submitIntent`, and
`governance-spine` in this file.** They are preserved three ways below: `governance-first`
in the hero `tagline` prop *and* a footer note, `submitIntent` in a retained code example,
and `governance-spine` as the `<SpineWalkthrough>`/`See how it's different` link target.

Replace `docs/index.md` with:

````markdown
---
layout: page
title: Infrix — describe what you want, get a proof you can trust
---

<div class="ifx-home">

<HomeHero
  text="Describe what you want. Get back a proof you can trust."
  tagline="A governance-first execution layer for Accumulate. Every action flows through one enforced pipeline — intent, plan, approval, execution, evidence — and ends in a portable receipt anyone can verify offline, without running a node or trusting the network."
/>

<TypedTerminal />

<EvmContrast />

<SpineWalkthrough />

## How it works — the governance spine

Every state-changing operation flows through one canonical pipeline:

```
intent → plan → approval → execution → outcome → evidence → anchor
```

The shortest client call submits a `submitIntent` and walks the same spine:

```typescript
import { Wallet } from "@infrix/wallet";

const wallet = new Wallet({ endpoint: "http://localhost:8080", identity: "acc://alice.acme" });

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

const plan = await intent.plan();
await wallet.approveIntent(plan.id);

const outcome = await intent.outcome();
console.log("evidence:", outcome.evidenceBundle);
```

Read the full model on [the governance spine](/governance-spine), or follow the
[first-intent tutorial](/tutorials/first-intent).

<PersonaCards />

<p class="ifx-fence-note">
  Infrix is governance-first: there is no raw-transaction path, and every outcome is a
  portable receipt. See <a href="/governance-spine">the governance-spine model</a>.
</p>

</div>
````

> **Why `layout: page` (not a custom layout name).** `layout: page` gives a full-width,
> chrome-light canvas with the nav still present, and lets the markdown body host the
> components directly — no `Layout` slot override needed. (A registered custom layout is an
> option, but `page` is the lowest-surface change that satisfies the brief.) The three CTAs,
> the EVM-contrast copy, and the spine code example are carried forward **verbatim** from
> runbook 01, so no new public copy is introduced and the banned-jargon list (§6) stays
> clear — `governance-first` and `governance-spine` appear only with their plain glosses.

Add the small note style to `utilities.css` (a documented addition, per §4's "new semantic
tokens may be added with a note"):

```css
/* index.md footer note — keeps the `governance-first` fence marker visible + on-message. */
.ifx-fence-note {
  max-width: var(--ifx-maxw); margin: 24px auto 64px; padding-inline: 24px;
  color: var(--ifx-text-muted); font-size: 0.9rem;
}
```

---

## Step 9 — Verify the fence and build

```bash
node --test docs-structure.test.mjs
```

The landing-page test (`landing page keeps the governance-first framing`) greps `index.md`
for all three of `governance-first`, `submitIntent`, `governance-spine`:

- `governance-first` — in the `tagline` prop **and** the `.ifx-fence-note`.
- `submitIntent` — in the retained TypeScript example.
- `governance-spine` — in the `.ifx-fence-note` link and the `See how it's different` /
  "governance spine" link targets.

The page-existence test is unaffected (no pages removed). The config test is unaffected
(`config.mts` untouched in this runbook — search/OG come later). Then:

```bash
npm run build
npm run preview
```

> If a future copy edit drops one of the three markers, restore it or update the fence in the
> **same commit** — never leave the fence red (00-overview §10).

---

## QA matrix (manual, in `npm run dev` and `npm run preview`)

Run every row in **both themes** unless noted.

| Check | Pass criteria |
|---|---|
| Dark theme default | First load is dark; toggle to light keeps every component legible (contrast §7). |
| `TypedTerminal` — scroll | Typewriter starts only when scrolled into view; finishes; caret blinks then stops. |
| `TypedTerminal` — reduced-motion | With `prefers-reduced-motion: reduce`, full text shows instantly, no caret. |
| `TypedTerminal` — SR/keyboard | Screen reader reads the full command+output once (not per-char); text is selectable/copyable. |
| `EvmContrast` | Two columns on desktop, stacked ≤ 720px; old column muted, Infrix column glows; ✓ / · icons present (color not sole signal). |
| `EvmContrast` — reveal | Rows stagger in on scroll; with reduced-motion all rows are visible immediately. |
| `SpineWalkthrough` — keyboard | Tab reaches tabs/panel/Prev/Next; Left/Right arrows change stage; visible focus ring everywhere. |
| `SpineWalkthrough` — diagram sync | `<SpineDiagram>` highlights the node for the active stage as it changes. |
| `SpineWalkthrough` — approval | Submitter (Alice) is greyed; a different approver (Carol) shows ✓ signed; SR reads the separation note. |
| `SpineWalkthrough` — finality | On the Outcome stage, finality ticks `provisional → locally_final → l0_anchored_final` (instant under reduced-motion). |
| `SpineWalkthrough` — verify | `Verify this proof` shows a spinner, then `✓ verified offline — chain hash 0xfeed…b0ba`; `role="status"` announces it. |
| `SpineWalkthrough` — no scroll-jack | Page scroll is never trapped; stage only advances via Prev/Next/arrows/tab clicks. |
| `PersonaCards` | Four cards (4-up desktop → 2-up → 1-up); Tab/Enter follow each `<a>`; all four links resolve (no 404). |
| `HomeHero` | Headline/subhead/3 CTAs render; animated spine beside copy on desktop, stacked on mobile. |
| Mobile (≤ 520px) | Hero stacks, tabs wrap, approvers/personas single-column, terminal scrolls horizontally without overflow. |
| Fence | `node --test docs-structure.test.mjs` green; the three markers present in `index.md`. |
| Build | `npm run build` clean (no new warnings); `npm run preview` renders all components. |
| Perf | DevTools: LCP < 2.0s; no CLS as terminal types / reveals fire; animations are transform/opacity only. |
| Console | No errors/warnings in either theme on the landing route. |

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in `00-overview.md` §9, specifically:

- All six components exist in `theme/components/`, are registered in `theme/index.ts`, and
  consume **only** the §4 tokens (the one documented `.ifx-fence-note` addition aside).
- `theme/data/demo-bundle.ts` exists with deterministic data mirroring the real lifecycle;
  no `Math.random`, SSR-safe.
- The canonical scroll-reveal helper (`composables/useReveal.ts`) is wired in `enhanceApp`,
  superseding runbook 01's deferred snippet.
- **A11y (§7):** every component works under `prefers-reduced-motion`; the walkthrough is
  keyboard-driven with no scroll-jacking and explicit Prev/Next; focus rings are visible
  everywhere; color is always paired with text/icon; the terminal's full text is in the DOM
  for SR and copy; `role="status"`/`aria-live="polite"` announce the verify result and stage
  changes; the hero spine and walkthrough diagram are `aria-hidden` (their meaning is carried
  by adjacent text / the tablist).
- **Perf (§8):** incremental landing JS stays < 100KB gzipped (no animation library added);
  the terminal reserves height for zero CLS; all motion is transform/opacity; no WASM loads
  on this route (the verify is mocked).
- **No jargon leak (§6):** every rendered string uses the public voice — no `§`,
  `DisclosureContext`, `UnifiedStepParams`, `TypeOutcomeRecord`, `GetWithActor`, "execution
  fabric", or "load-bearing primitives". (`PlanStepSettlement` etc. appear only as
  intentional code chips inside the demo, not as prose value-props.)
- **Fence green / build green** (Step 9); both themes legible; `index.md` retains the three
  required markers.
- Committed on `redesign/03-interactive-narrative`; PR links this runbook and lists the QA
  matrix results.

---

## Out of scope for this effort (so we don't gold-plate)

- **The real WASM verifier.** `verify()` in `SpineWalkthrough.vue` returns canned data behind
  a marked seam — **runbook 05** swaps in `evidence.VerifyPortablePackage` compiled to WASM.
  Do not lazy-load any `.wasm` here.
- **Local search, the `<Term>` glossary, the static docs spine diagram, code-group tabs, and
  fleshing out thin SDK pages** — all **runbook 04**.
- **Logo/wordmark, custom OG images, the full a11y audit, and the jargon-fence test** —
  **runbook 06**. (This runbook keeps copy clean by hand; the *automated* §6 grep ships in 06.)
- Reworking `config.mts` (nav/search/OG) — left to runbooks 04/06.

Resist building these now. Effort 03's job is the assembled, interactive landing narrative.

---

## Handoff notes for runbooks 04 and 05

**For runbook 05 (WASM verifier):**
- The integration seam is the `verify()` function in `SpineWalkthrough.vue`, flagged with
  `TODO(runbook 05)`. Its signature `async verify(bundleJSON: string): Promise<{ ok, chainHash, reason? }>`
  and the `onVerify()` state machine (`idle → running → done|error`) are deliberately the
  final shape — replacing the mock body with the real WASM binding (lazy-loaded on click,
  spinner already wired, `role="status"` result already announced) should require **no
  template change**.
- The bundle passed to `verify()` is `JSON.stringify(DEMO_BUNDLE)`. Runbook 05 will likely
  serialise to the real `PortableEvidencePackage` shape; keep `demo-bundle.ts` as the
  fallback/demo input so the component still works before the user clicks (and offline).
- Perf budget: WASM must lazy-load **only** on the verify click (§8) — the seam is already
  structured for that (no import at module top).

**For runbook 04 (docs experience):**
- `theme/data/spine.ts` (`SPINE_STAGES`) is now consumed by both `<SpineDiagram>` and
  `<SpineWalkthrough>`; runbook 04's static docs spine should reuse the same data — do not
  fork stage definitions.
- The `.ifx-reveal` / `useReveal` helper is global now; any reveal-on-scroll content in docs
  pages can opt in by adding the `.ifx-reveal` class — no extra wiring.
- The demo bundle's evidence rows (plan-hash, trace digest, trust snapshot, approval proof,
  anchor ref) are a good source of truth for the "evidence bundle anatomy" content runbook 04
  may add to `cookbook/offline-verification.md`.
