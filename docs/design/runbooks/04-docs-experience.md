# Runbook 04 — Docs Experience

> **Effort 4 of 6.** Prerequisites: [`01-foundation.md`](./01-foundation.md) (theme
> scaffold, tokens, `.ifx-trynow` utility) and [`02-spine-visuals.md`](./02-spine-visuals.md)
> (`<SpineDiagram>` with its `:static` variant). Read [`00-overview.md`](./00-overview.md)
> first — tokens, file tree, the banned-jargon list, and the Definition of Done are defined
> there and are **not** repeated here.
>
> **Goal:** The landing earns attention; **the docs keep it.** This effort makes the
> reference surface *fast, searchable, and self-explaining*: offline search, an
> accessible glossary tooltip, the spine *drawn* instead of described, the golden path
> elevated to the first thing a reader sees, language tabs where SDK code differs, and the
> thin `typescript-client.md` rebuilt into a real reference page. This is UX-REVIEW
> **Part 5** in full, plus Part 10 item 9 and 12 (docs half) and Part 9 item 5 (search).
>
> When this lands, a developer who arrives on any docs page can find what they need, never
> hits a 26-line dead-end, and can hover (or **tab to**) any unfamiliar term and get a
> plain-English definition.

---

## Outcomes (what "done" looks like)

1. **VitePress local search is enabled** in `config.mts` (`themeConfig.search = { provider: 'local' }`),
   working fully offline, with Algolia DocSearch noted as a future upgrade. The fence still
   greps `config.mts` for `defineConfig`, `sidebar`, `Governance Spine` — all retained.
2. A **`<Term>` glossary tooltip** component exists at
   `docs/.vitepress/theme/components/Term.vue`: a dotted-underline term that reveals a
   plain-English definition on **hover *and* keyboard focus** (focusable, `aria-describedby`,
   `role="tooltip"` — **not** hover-only). It is backed by
   `docs/.vitepress/theme/data/glossary.ts` (a term→definition map with ~10 seed entries in
   public voice) and registered globally.
3. The **static `<SpineDiagram :static />`** (from runbook 02) sits at the top of
   `governance-spine.md`, replacing reliance on the ASCII pipeline; the ASCII line is kept as
   a fallback so the page degrades gracefully and stays meaningful without JS.
4. `getting-started.md`'s one-command **golden path** is the literal first thing on the page —
   a styled **"Try this now"** callout (reusing the global `.ifx-trynow` utility from
   runbook 01) *above* Prerequisites. The commands already on the page are restructured, not
   reinvented.
5. **VitePress `code-group` tabs** wrap the first-intent example across **TypeScript / Rust /
   AssemblyScript** wherever SDK code differs by language.
6. The thin **`sdk/typescript-client.md`** (26 lines, links in circles) is rebuilt into a
   **reference-grade** page with real method signatures, parameter shapes, and return types
   for `IntentClient`, `IntentStream`, and `ApprovalClient` — consistent with `first-intent.md`
   and the other SDK pages.
7. **Copy buttons** on code blocks are confirmed on (VitePress default), and the nav/sidebar
   remain **fence-valid**.
8. `node --test docs-structure.test.mjs` passes; `npm run build` + `npm run preview` are clean;
   the §7 a11y checklist holds for `<Term>`.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/04-docs-experience
npm ci
npm run dev    # confirm the site renders at /infrix-website/ with the runbook-01/02 work present
```

Confirm the fence is green before touching anything:

```bash
node --test docs-structure.test.mjs
```

> **Dependency check.** This runbook assumes `theme/index.ts`, `styles/utilities.css`
> (with `.ifx-trynow`), and `theme/components/SpineDiagram.vue` (with a `:static` prop) all
> exist from efforts 01 and 02. If you are picking this up out of order, the only hard blocker
> is `.ifx-trynow` (Step 4) and `<SpineDiagram>` (Step 3); search, glossary, code-group, and the
> SDK page rebuild are all independent and can land regardless.

---

## Step 1 — Enable VitePress local search

VitePress ships a built-in, **offline**, client-side search index (MiniSearch under the hood) —
no external service, no network call, no API key. Turn it on with a single `themeConfig` key.

Edit `docs/.vitepress/config.mts`. Inside `themeConfig`, add `search` (placement among the other
keys does not matter; shown here above `nav`):

```ts
  themeConfig: {
    // Offline, client-side full-text search. Ships with the static build — no
    // external service, no API key, works with the Pages deploy as-is.
    // Future upgrade: swap to Algolia DocSearch (provider: 'algolia') once the
    // site is crawlable and an index is provisioned — see note below.
    search: {
      provider: "local",
      options: {
        // Friendlier empty/placeholder copy; everything else uses sensible defaults.
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },
    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "Governance Spine", link: "/governance-spine" },
      { text: "SDKs", link: "/sdk/typescript-client" },
      { text: "Tutorials", link: "/tutorials/first-intent" },
    ],
    // ...existing sidebar / socialLinks / footer unchanged...
  },
```

> **Why local, not Algolia, now?** Local search needs zero infrastructure and works the moment
> the static site is built — it is the right P1 choice. **Algolia DocSearch** (apply at
> `docsearch.algolia.com`, then `provider: 'algolia'` with `appId` / `apiKey` / `indexName`) is
> the future upgrade once the site has stable public URLs and enough content to warrant a hosted,
> typo-tolerant, analytics-backed index. Leave the comment above as the breadcrumb for that swap.

**Fence note (do not skip):** the fence reads `config.mts` and asserts it still contains the
literal strings `defineConfig`, `sidebar`, and `Governance Spine`. The edit above only *adds*
a `search` key — `defineConfig` (the import + call), `sidebar` (the existing array), and the
`Governance Spine` nav label are all untouched. Re-run after editing:

```bash
node --test docs-structure.test.mjs
```

---

## Step 2 — Build the `<Term>` glossary tooltip

A docs reader hitting an unfamiliar word (`intent`, `evidence bundle`, `anchor`) should get a
plain-English definition **in place** — on hover for mouse users and **on focus** for keyboard
and screen-reader users. The component is a small, dependency-free SFC.

### 2a — The glossary data

Create `docs/.vitepress/theme/data/glossary.ts`. Definitions are written in the **public voice**
(00-overview §6): no `§` references, no internal type names, no "load-bearing primitives." Each
entry glosses the term the way the landing copy does.

```ts
// Glossary source of truth for the <Term> tooltip.
// Voice rules: plain English, no spec-section (§) refs, no internal type names,
// no banned-jargon (see 00-overview.md §6). Keep each definition to ~1–2 sentences.

export interface GlossaryEntry {
  /** Human-readable display term (what shows if <Term> has no slot text). */
  term: string;
  /** Plain-English definition shown in the tooltip. */
  definition: string;
}

// Keys are lowercased, space-collapsed lookup ids. Use the `id`/`word` prop or
// slot text; both are normalized to a key before lookup (see Term.vue).
export const GLOSSARY: Record<string, GlossaryEntry> = {
  intent: {
    term: "intent",
    definition:
      "What you want, described — in plain or typed terms. You submit an intent instead of " +
      "signing a raw transaction, and Infrix works out how to carry it out.",
  },
  plan: {
    term: "plan",
    definition:
      "The ordered set of steps Infrix compiles from your intent. It records what will run, " +
      "in what order, and which approvals each step needs before anything executes.",
  },
  "governance spine": {
    term: "governance spine",
    definition:
      "One enforced pipeline every change must travel: intent → plan → approval → execution → " +
      "outcome → evidence → anchor. There is no path that mutates state without traversing it.",
  },
  approval: {
    term: "approval",
    definition:
      "A signed go-ahead from the actors a step requires. Until the needed approvals land, the " +
      "step does not run — governance is enforced, not just described.",
  },
  "separation of duties": {
    term: "separation of duties",
    definition:
      "A safeguard where the person who requests an action cannot be the person who approves it. " +
      "Infrix enforces this in code, so a single party can't push a change through alone.",
  },
  execution: {
    term: "execution",
    definition:
      "The step where an approved plan actually runs. Infrix picks the right way to run each step — " +
      "by confidentiality, cost, trust, and capability — instead of one fixed engine.",
  },
  outcome: {
    term: "outcome",
    definition:
      "The recorded result of running the plan: what happened, its finality state, and the policy " +
      "decisions made along the way.",
  },
  "evidence bundle": {
    term: "evidence bundle",
    definition:
      "A portable receipt you can verify offline. It packages the proof of what ran so a regulator " +
      "or auditor can check it without running a node or trusting the network.",
  },
  anchor: {
    term: "anchor",
    definition:
      "A compact digest of the outcome and its evidence written to Accumulate, which moves a result " +
      "from provisional to final. The anchor is what lets anyone confirm the result later.",
  },
  finality: {
    term: "finality",
    definition:
      "How settled a result is. A result moves from provisional, to locally final, to anchored-final " +
      "as its anchor is confirmed — at which point it can no longer change.",
  },
};

/** Normalize any prop/slot value to a glossary key: trimmed, lowercased, single-spaced. */
export function glossaryKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
```

> Ten seed entries: `intent`, `plan`, `governance spine`, `approval`, `separation of duties`,
> `execution`, `outcome`, `evidence bundle`, `anchor`, `finality`. Add more over time; keep the
> voice. These deliberately mirror the seven spine stages plus the two cross-cutting concepts a
> newcomer trips on (separation of duties, finality).

### 2b — The component

Create `docs/.vitepress/theme/components/Term.vue`. Requirements, all met below:

- Dotted-underline trigger that is **focusable** (`tabindex="0"`).
- Tooltip with `role="tooltip"`, wired via `aria-describedby` so screen readers announce the
  definition when the trigger is focused.
- Shows on **hover, focus, and keyboard** (Enter/Space toggle, Escape dismiss) — **never
  hover-only**.
- Accepts the term via `word` / `id` prop **or** via slot text; resolves the definition from
  `glossary.ts`; degrades to a plain `<abbr>`-style title if the term is unknown.
- Honors `prefers-reduced-motion` (no fade), respects both themes (uses tokens only).

```vue
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
```

> **`useId()`** is built into Vue 3.5+ (bundled with VitePress `^1.3`) and is SSR-safe — it
> produces matching ids on server and client, so the `aria-describedby`/`id` pairing never
> mismatches during hydration. If the project pins an older Vue, replace it with a module-level
> incrementing counter guarded for SSR.

### 2c — Register globally

Edit `docs/.vitepress/theme/index.ts` to register `<Term>` (the `enhanceApp` slot from
runbook 01):

```ts
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Term from "./components/Term.vue";
// ...other component imports (SpineDiagram, etc.) from earlier runbooks...

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Term", Term);
    // app.component("SpineDiagram", SpineDiagram);  // runbook 02
    // ...other global components...
  },
} satisfies Theme;
```

### 2d — Use it in markdown

Vue components work inline in any `.md` page. Two equivalent call styles:

```md
An **<Term word="intent">intent</Term>** is what you want, described — Infrix works out how
to carry it out. The compiled <Term id="plan" /> lists the steps and the approvals each needs.
```

- `<Term word="intent">intent</Term>` — slot text is the visible word; `word` is the lookup.
- `<Term id="plan" />` — no slot; the component displays the glossary term itself.

Seed these into `governance-spine.md` on the **first use** of each spine term (Step 3 below
wires the obvious ones), and into `getting-started.md` where `intent` / `evidence bundle` /
`anchor` first appear. Do not over-mark — first use per page is enough.

---

## Step 3 — Drop the static spine into `governance-spine.md`

Replace reliance on the ASCII pipeline at the top of `governance-spine.md` with the rendered
`<SpineDiagram :static />` from runbook 02, and **keep the ASCII as a fallback** directly
beneath it (so the page is meaningful with JS disabled and the diagram has a text equivalent).

Current top of `governance-spine.md`:

```md
# The Governance Spine

Every state-changing operation in Infrix flows through one canonical pipeline:

```
intent → plan → approval → execution → outcome → evidence → anchor
```

This is the **governance spine**. ...
```

Replace it with:

```md
# The Governance Spine

Every state-changing operation in Infrix flows through one canonical pipeline — one enforced
path from what you want to a proof anyone can check:

<SpineDiagram :static />

<!-- Plain-text fallback: the diagram above is the same seven stages, drawn. -->
```
intent → plan → approval → execution → outcome → evidence → anchor
```

This is the <Term word="governance spine">governance spine</Term>. Each stage has a typed
object, a policy hook, and an evidence contribution. There is no path that mutates state
without traversing it.
```

> **Contract reminder (from 00-overview §2/§5 and runbook 02):** `<SpineDiagram :static />`
> renders the seven stages from `theme/data/spine.ts` as a non-animated SVG with `role="img"`
> + an `aria-label` describing the seven stages — so the diagram itself is accessible. The
> ASCII line below is belt-and-suspenders: a copy-pasteable, screen-reader-trivial fallback
> that also keeps the page readable in any context where the component fails to mount. **Do not
> delete the ASCII** — it is the static fallback the a11y checklist (§7) and reduced-motion
> story rely on.

Also mark the first use of the remaining spine terms on this page with `<Term>` (one per term):
e.g. wrap the first `approval`, `evidence bundle`, `anchor`, and `finality` mentions in the
prose. Leave the deep-reference type names (`OutcomeRecord`, `EvidenceBundle`) as-is — those are
allowed in deep reference docs when defined inline (00-overview §6).

---

## Step 4 — Elevate the golden path in `getting-started.md`

The one-command golden path is currently the page's opening paragraph + code block, which is
correct content but undifferentiated. Promote it into a **"Try this now"** callout reusing the
global `.ifx-trynow` utility (defined in runbook 01's `utilities.css`) and make it the literal
first thing on the page, **above Prerequisites**. The commands already exist — restructure only.

Replace the current top of `getting-started.md`:

```md
# Getting Started

The fastest path to a verified proof is one command — describe an app, get a
verifiable proof, and check it yourself without trusting the node:

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
infrix receipt verify .infrixapp/my-escrow/runs/run-1/receipt.infrix.json
```

`infrix start` leads with this golden path (`infrix start --agent` emits it as
JSON for AI agents). The rest of this guide takes you from zero to a running
devnet that accepts your first governed intent.

## Prerequisites
```

with:

```md
# Getting Started

<div class="ifx-trynow">

<span class="ifx-eyebrow">Try this now</span>

Describe an app in plain English, get a verifiable proof, and check it yourself —
**offline, no node, no "trust me."**

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
infrix receipt verify .infrixapp/my-escrow/runs/run-1/receipt.infrix.json
```

</div>

`infrix start` leads with this golden path (`infrix start --agent` emits it as
JSON for AI agents). The rest of this guide takes you from zero to a running
devnet that accepts your first governed <Term word="intent">intent</Term>.

## Prerequisites
```

> The `.ifx-trynow` class gives the verified-green tint + border, and `.ifx-eyebrow` inside it
> renders the green "Try this now" eyebrow (both defined in runbook 01's stylesheets). No new
> CSS is needed here — this is pure reuse of the global utilities, which is exactly the point of
> establishing them in effort 01.

---

## Step 5 — Code-group tabs for cross-language SDK examples

Where the *same* example exists in TypeScript, Rust, and AssemblyScript, VitePress's
`::: code-group` fence renders tabs instead of three stacked blocks. Use it for the first-intent
submission — the canonical "submit a `GOVERNED_TRANSFER` intent" snippet — so a reader picks
their language once.

Add this to `getting-started.md` (in the **Submit your first intent** section, replacing the
single TypeScript block there) and mirror it on `tutorials/first-intent.md`:

````md
::: code-group

```typescript [TypeScript]
import { Wallet } from "@infrix/wallet";

const wallet = new Wallet({
  endpoint: "http://localhost:8080",
  identity: "acc://alice.acme",
});

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

console.log("intent submitted:", intent.id);
console.log("plan:", await intent.plan());
```

```rust [Rust]
use infrix_wallet::{Wallet, IntentRequest};

let wallet = Wallet::connect("http://localhost:8080", "acc://alice.acme").await?;

let intent = wallet
    .submit_intent(IntentRequest {
        goal: "GOVERNED_TRANSFER".into(),
        params: json!({
            "from": "acc://alice.acme",
            "to": "acc://bob.acme",
            "amount": 100
        }),
    })
    .await?;

println!("intent submitted: {}", intent.id);
println!("plan: {:?}", intent.plan().await?);
```

```typescript [AssemblyScript]
// AssemblyScript SDK — same shape, compiled to WASM.
import { Wallet, IntentRequest } from "@infrix/assemblyscript";

const wallet = new Wallet("http://localhost:8080", "acc://alice.acme");

const intent = wallet.submitIntent(<IntentRequest>{
  goal: "GOVERNED_TRANSFER",
  params: `{"from":"acc://alice.acme","to":"acc://bob.acme","amount":100}`,
});

trace("intent submitted: " + intent.id);
```

:::
````

> The bracketed label (`[TypeScript]`) sets the tab title; the language id before it drives
> highlighting. Keep the **TypeScript** tab first (it is the documented primary SDK). Only use
> `code-group` where the code genuinely **differs by language** — do not wrap single-language
> CLI/`bash` blocks in it. The Rust/AssemblyScript snippets above are illustrative of the SDK
> surface; reconcile the exact signatures against `sdk/rust.md` / `sdk/assemblyscript.md` when
> those pages are fleshed out (noted in Handoff).

---

## Step 6 — Flesh out `sdk/typescript-client.md`

The current page is 26 lines and links in circles (UX-REVIEW Part 5 §5: "thin reference pages
erode trust faster than missing ones"). Rebuild it into a **reference-grade** page: real
constructor options, method signatures, parameter shapes, and return types for `IntentClient`,
`IntentStream`, and `ApprovalClient` — consistent with `first-intent.md` (which uses
`InfrixClient`, `wallet.submitIntent`, `intent.plan()`, `intent.outcome()`, `verifyEvidence`)
and the REST endpoints in `getting-started.md` (`POST /v4/intents`, `/v4/ws`, `/v4/approvals`,
`/v4/intents/{id}/outcome`, `/v4/intents/{id}/evidence`).

Replace the entire contents of `docs/sdk/typescript-client.md` with:

````md
# TypeScript Client SDK

`@infrix/client` is the low-level TypeScript binding for the **v4 REST + WebSocket** surface
that production Infrix runtimes serve. It speaks the wire protocol directly: you submit a
governed <Term word="intent">intent</Term>, read back the compiled <Term word="plan">plan</Term>,
stream lifecycle events, and submit signed <Term word="approval">approvals</Term>. For the
higher-level wallet flow (key management, signing, sponsored calls) use
[`@infrix/wallet`](./typescript-wallet.md), which is built on this client.

## Install

```bash
npm install @infrix/client
```

## Quick start

```typescript
import { InfrixClient } from "@infrix/client";

const client = new InfrixClient({ endpoint: "http://localhost:8080" });

const intent = await client.intents.submit({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
  actor: "acc://alice.acme",
});

const plan = await client.intents.plan(intent.id);
const outcome = await client.intents.awaitOutcome(intent.id);
```

> The client does **not** sign. It carries an already-signed approval envelope to the server;
> producing that envelope is the wallet's job. Use `@infrix/wallet` if you want signing handled
> for you.

## `InfrixClient`

The entry point. Construct it once and reuse it; it holds the endpoint and the disclosure
context stamped onto every request.

```typescript
interface InfrixClientOptions {
  /** Base URL of the runtime, e.g. "http://localhost:8080". No trailing slash required. */
  endpoint: string;
  /** Optional default disclosure context applied to every request (overridable per call). */
  disclosure?: DisclosureContext;
  /** Optional fetch override (custom agent, auth proxy, test double). */
  fetch?: typeof fetch;
}

interface DisclosureContext {
  actor: string;            // "acc://alice.acme"
  purpose?: string;         // e.g. "settlement", "audit"
  workflowInstanceId?: string;
}

class InfrixClient {
  constructor(options: InfrixClientOptions);
  readonly intents: IntentClient;
  readonly approvals: ApprovalClient;
  /** Open a live event stream (see IntentStream). */
  stream(filter?: StreamFilter): IntentStream;
}
```

Every request stamps `Actor`, `Purpose`, and `WorkflowInstanceID` headers from the disclosure
context so the runtime's disclosure layer can evaluate what each caller is allowed to see.

## `IntentClient` — submit & read intents

Reached via `client.intents`. Wraps `POST /v4/intents` and the per-intent read endpoints.

```typescript
interface SubmitIntentRequest {
  /** Canonical goal type, e.g. "GOVERNED_TRANSFER", "CONTRACT_CALL", "DEPLOY". */
  goal: string;
  /** Goal-specific typed parameters. Shape depends on `goal`. */
  params: Record<string, unknown>;
  /** Submitting actor. Defaults to the client's disclosure actor if omitted. */
  actor?: string;
  /** Optional idempotency key; a repeat submit with the same key returns the first intent. */
  idempotencyKey?: string;
}

interface Intent {
  id: string;                 // "intent-abc123"
  goal: string;
  status: IntentStatus;       // see below
  submittedAt: string;        // ISO-8601
}

type IntentStatus =
  | "submitted"     // accepted, plan compiling
  | "planned"       // plan ready, awaiting approvals
  | "approved"      // all required approvals in
  | "executing"
  | "settled"       // terminal success
  | "rejected"      // terminal failure (policy / approval / execution)
  ;

class IntentClient {
  /** POST /v4/intents — submit a governed intent. Resolves once accepted (status "submitted"). */
  submit(req: SubmitIntentRequest): Promise<Intent>;

  /** GET /v4/intents/{id} — current intent record. */
  get(id: string): Promise<Intent>;

  /** GET /v4/intents/{id}/plan — the compiled ExecutionPlan (see ExecutionPlan below). */
  plan(id: string): Promise<ExecutionPlan>;

  /** GET /v4/intents/{id}/outcome — resolves once the intent reaches a terminal state.
   *  Polls (or long-polls) until settled/rejected; rejects on terminal failure. */
  awaitOutcome(id: string): Promise<Outcome>;

  /** GET /v4/intents/{id}/evidence — the portable evidence bundle for offline verification. */
  evidence(id: string): Promise<EvidenceBundle>;
}
```

### `ExecutionPlan` shape

```typescript
interface ExecutionPlan {
  id: string;               // plan id; approvals bind to this (re-compile invalidates them)
  intentId: string;
  steps: PlanStep[];
  approvalsRequired: ApprovalRequirement[];
}

interface PlanStep {
  stepType: string;         // "validate" | "check-policy" | "collect-approvals" | "execute-settlement" | ...
  /** Which plugin was chosen for this step and why — confidentiality/cost/trust rationale. */
  selection?: {
    plugin: string;
    reason: string;
    confidentialityImplications?: string;
    costImplications?: string;
  };
}

interface ApprovalRequirement {
  stepType: string;
  /** Actors whose signatures satisfy this requirement. */
  approvers: string[];
  /** Number of distinct approvers required (threshold). */
  threshold: number;
}
```

### `Outcome` shape

```typescript
interface Outcome {
  intentId: string;
  status: IntentStatus;             // "settled" | "rejected"
  finality: FinalityState;
  evidenceBundle: EvidenceBundle;   // the portable receipt
  gasUsed?: number;
}

type FinalityState = "provisional" | "locally_final" | "l0_anchored_final";
```

## `IntentStream` — live lifecycle events

Reached via `client.stream(...)`. Wraps the `/v4/ws` WebSocket and emits each spine transition
as it happens — handy for UIs that visualize the pipeline instead of polling.

```typescript
interface StreamFilter {
  /** Restrict to one intent; omit to receive all the actor is permitted to see. */
  intentId?: string;
  /** Event channels to subscribe to. Defaults to ["lifecycle"]. */
  channels?: Array<"lifecycle" | "narrative" | "outcome">;
}

interface IntentEvent {
  intentId: string;
  /** The spine stage this event reports. */
  stage: "intent" | "plan" | "approval" | "execution" | "outcome" | "evidence" | "anchor";
  status: IntentStatus;
  finality?: FinalityState;
  at: string;               // ISO-8601
  detail?: Record<string, unknown>;
}

class IntentStream {
  /** Subscribe to events. Returns an unsubscribe function. */
  on(handler: (event: IntentEvent) => void): () => void;
  /** Async-iterator form: `for await (const ev of stream) { ... }`. */
  [Symbol.asyncIterator](): AsyncIterator<IntentEvent>;
  /** Close the underlying socket. */
  close(): void;
}
```

```typescript
const stream = client.stream({ intentId: intent.id, channels: ["lifecycle", "outcome"] });
const off = stream.on((ev) => {
  console.log(`${ev.stage}: ${ev.status}`);
  if (ev.stage === "anchor") off();   // done once anchored
});
```

## `ApprovalClient` — list & submit approvals

Reached via `client.approvals`. Wraps `GET /v4/approvals` and `POST /v4/approvals`. The client
**carries** a signed approval envelope; it does not produce the signature (that is the wallet).

```typescript
interface PendingApproval {
  intentId: string;
  planId: string;           // approval binds to this plan hash; re-compile invalidates it
  stepType: string;
  requiredApprovers: string[];
  threshold: number;
  /** Actors who have already approved. */
  receivedFrom: string[];
}

interface ApprovalEnvelope {
  intentId: string;
  planId: string;
  approver: string;         // "acc://carol.acme" — must differ from submitter (separation of duties)
  signature: string;        // produced by @infrix/wallet
}

interface ApprovalResult {
  intentId: string;
  planId: string;
  /** True once the threshold is met and the step is unblocked. */
  satisfied: boolean;
  receivedFrom: string[];
}

class ApprovalClient {
  /** GET /v4/approvals — approvals awaiting the given actor (or all visible if omitted). */
  pending(actor?: string): Promise<PendingApproval[]>;

  /** POST /v4/approvals — submit one signed approval envelope. */
  submit(envelope: ApprovalEnvelope): Promise<ApprovalResult>;
}
```

> **Separation of duties is enforced server-side.** Submitting an `ApprovalEnvelope` whose
> `approver` equals the intent's submitter is rejected — the actor that requests a change cannot
> be the actor that approves it. See [Approval Policies](../cookbook/approval-policies.md).

## End-to-end with the client only

```typescript
import { InfrixClient } from "@infrix/client";

const client = new InfrixClient({
  endpoint: "http://localhost:8080",
  disclosure: { actor: "acc://alice.acme", purpose: "settlement" },
});

const intent = await client.intents.submit({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

const plan = await client.intents.plan(intent.id);
// ...a *different* actor (acc://carol.acme) signs via @infrix/wallet, then:
await client.approvals.submit(signedEnvelope);

const outcome = await client.intents.awaitOutcome(intent.id);
console.log("finality:", outcome.finality);            // "l0_anchored_final"
console.log("evidence:", outcome.evidenceBundle);      // portable — verify offline
```

To verify the bundle offline, see [Offline Verification](../cookbook/offline-verification.md)
and the `verifyEvidence` helper used in the [first-intent tutorial](../tutorials/first-intent.md).

## Related

- [TypeScript Wallet](./typescript-wallet.md) — adds signing, key management, sponsored calls.
- [First Intent tutorial](../tutorials/first-intent.md) — this surface, end to end.
- [The Governance Spine](../governance-spine.md) — the model these methods walk.
- [Offline Verification](../cookbook/offline-verification.md) — verifying the evidence bundle.
````

> **Consistency guardrails:** `InfrixClient`, `submitIntent`/`submit`, `plan(id)`,
> `awaitOutcome`, `evidenceBundle`, `verifyEvidence`, the `IntentStatus`/`FinalityState`
> vocabularies, and the `/v4/*` endpoints all match `first-intent.md` and `getting-started.md`.
> If any of those canonical names change later, update them in lockstep across these pages —
> the SDK page is now the reference others point at.

---

## Step 7 — Confirm copy buttons & fence-valid nav/sidebar

- **Copy buttons** are on by default in VitePress for every fenced code block — no config needed.
  Verify in `npm run dev`: hover any code block, the copy button appears top-right and copies the
  raw text. If a future theme override hides it, ensure no CSS sets `.vp-copy` /
  `[class*="copy"]` to `display: none`. (The `code-group` blocks from Step 5 inherit it.)
- **Nav/sidebar unchanged:** this runbook adds **no new pages** and renames nothing, so the
  fence's `requiredPages` list and the nav/sidebar targets are untouched. The only `config.mts`
  change is the additive `search` key (Step 1), which preserves `defineConfig` / `sidebar` /
  `Governance Spine`.

```bash
node --test docs-structure.test.mjs
```

---

## QA matrix (manual, in `npm run dev` then `npm run preview`)

Run both themes (toggle dark/light) and both widths (desktop + mobile ≤ 720px).

- [ ] **Search works offline.** Press the search hotkey (or click the search box); typing
      "evidence", "anchor", "approval" returns the right pages. Disconnect the network and
      repeat — results are identical (the index is bundled, no network call).
- [ ] **Glossary on hover.** Hovering a dotted term shows its definition; moving away hides it.
- [ ] **Glossary on keyboard.** `Tab` lands on the term (visible focus ring); the definition
      shows on focus; `Enter`/`Space` toggles; `Escape` dismisses; `Tab` away hides it.
      **Not hover-only.**
- [ ] **Glossary screen reader.** With a screen reader, focusing the term announces the
      definition (via `aria-describedby` → `role="tooltip"`). Unknown terms read as plain text,
      no broken tooltip.
- [ ] **Static spine.** `governance-spine.md` shows the drawn `<SpineDiagram :static />` at the
      top; the ASCII pipeline remains directly beneath as the fallback; the diagram has an
      `aria-label` describing the seven stages.
- [ ] **Try-this-now callout.** `getting-started.md` opens with the green-tinted "Try this now"
      block (above Prerequisites); the three golden-path commands are intact and copyable.
- [ ] **Code-group tabs.** The first-intent example renders TS / Rust / AssemblyScript tabs;
      switching tabs swaps the code; the TypeScript tab is first/default.
- [ ] **Copy buttons.** Present and working on every code block, including inside `code-group`.
- [ ] **SDK page is reference-grade.** `sdk/typescript-client.md` shows real signatures for
      `IntentClient` / `IntentStream` / `ApprovalClient` with params + return types; no circular
      "see also" dead-end; cross-links resolve.
- [ ] **Both themes legible.** Tooltip, callout, diagram, and tabs read correctly in dark *and*
      light; contrast ≥ 4.5:1 for tooltip/callout body text.
- [ ] **No jargon leak.** New reader-facing copy (glossary definitions, callout text, term
      glosses) contains none of the 00-overview §6 banned tokens.
- [ ] **Fence green:** `node --test docs-structure.test.mjs` passes.
- [ ] **Build green:** `npm run build` succeeds with no new warnings; `npm run preview` renders
      search, glossary, diagram, callout, and tabs.

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in [`00-overview.md` §9](./00-overview.md), specifically:

- **§9.1 Functional:** local search, `<Term>` glossary, static spine in `governance-spine.md`,
  elevated golden-path callout, code-group tabs, and the rebuilt `typescript-client.md` are all
  present and manually verified in both themes and at both widths.
- **§9.2 Fence green:** `defineConfig` / `sidebar` / `Governance Spine` retained in `config.mts`;
  no required page dropped; fence passes.
- **§9.3 Build green:** `npm run build` clean; `npm run preview` renders the new surfaces.
- **§7 A11y (the load-bearing one for this effort):** `<Term>` is fully keyboard-operable with a
  visible focus ring, exposes `role="tooltip"` + `aria-describedby`, is **not hover-only**, and
  honors `prefers-reduced-motion`; the static spine carries a text equivalent (the ASCII
  fallback + the diagram's `aria-label`). Color is never the sole signal — the tooltip and
  callout pair color with text.
- **§6 No jargon leak:** glossary definitions and all new reader-facing copy use the public voice;
  banned tokens (`§`, internal type names, "load-bearing primitives," "execution fabric") are
  absent from the new copy.
- **§8 Perf:** the only added JS is the tiny `<Term>` component and VitePress's built-in local
  search index (lazy-loaded on first search invocation by VitePress itself). No animation libs,
  no layout-animating CSS. Note the search-index size in the build report; it is bundled but
  loaded on demand.

---

## Out of scope for this effort (so we don't gold-plate)

- **Marketing-page components** — `<SpineWalkthrough>`, `<TypedTerminal>`, `<EvmContrast>`,
  `<PersonaCards>`, `<HomeHero>` — are **runbook 03**. This effort touches docs pages only.
- **The live WASM `<EvidenceVerifier>`** is **runbook 05**. Here, "verify offline" stays prose +
  the existing `verifyEvidence` reference; do not wire WASM in.
- **Logo/wordmark, custom OG images, full a11y audit, motion polish, and the jargon-fence
  test** are **runbook 06**. (This effort *honors* the banned-jargon list in its copy but does
  not add the automated grep test that enforces it site-wide.)
- **Algolia DocSearch** — local search is the deliverable; Algolia is noted as a future upgrade
  only (Step 1), not built here.
- **Building the animated `<SpineDiagram>`** — this effort *consumes* its `:static` variant from
  runbook 02; it does not author or modify the component.

Resist building these now. Effort 04's job is the **reader experience** on the docs surface —
search, glossary, the drawn spine, the elevated golden path, language tabs, and one rebuilt thin
page — shippable on its own.

---

## Handoff notes

**For runbook 05 (WASM verifier):**
- The rebuilt `typescript-client.md` documents `client.intents.evidence(id) → EvidenceBundle`
  and `Outcome.evidenceBundle`. The WASM `<EvidenceVerifier>` should accept exactly that
  `EvidenceBundle` shape so the docs and the live demo agree.
- The "verify offline" links (cookbook + first-intent's `verifyEvidence`) are the natural place
  to embed the live verifier once it exists — swap the prose reference for the component there.

**For runbook 06 (identity & polish):**
- The §6 jargon-fence test should grep the **new** reader-facing copy too — glossary definitions
  in `glossary.ts`, the callout text, and the `<Term>` glosses are all already clean; the test
  will keep them that way.
- The `<Term>` tooltip's focus ring uses `--ifx-brand`; fold it into the global focus-ring audit.

**Glossary growth:**
- Add entries to `glossary.ts` as new docs land (`disclosure context`, `plugin selection`,
  `sponsored call`, `trust profile`). Keep the public voice and the ~1–2 sentence limit. Mark
  only the **first** use of a term per page with `<Term>`.

**SDK siblings (follow-up, same pattern as Step 6):**
- `sdk/rust.md` and `sdk/assemblyscript.md` still link in circles and deserve the same
  reference-grade treatment (real signatures, return types) — mirror the structure of the
  rebuilt `typescript-client.md`. Reconcile the Rust/AssemblyScript snippets in Step 5's
  `code-group` against those pages once written. `typescript-wallet.md` is already reasonably
  fleshed but should align its method names with the rebuilt client page.
```