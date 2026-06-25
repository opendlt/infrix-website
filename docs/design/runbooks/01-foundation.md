# Runbook 01 — Foundation: Brand System, Theme Scaffold & Message Rewrite

> **Effort 1 of 6.** Prerequisites: none. Unblocks: all subsequent runbooks.
> Read [`00-overview.md`](./00-overview.md) first — tokens, file tree, DoD, and the
> banned-jargon list are defined there and are not repeated here.
>
> **Goal:** Make the site *look intentional* and *read in plain English*, with a real
> theme scaffold that every later component plugs into — **without building a single
> animated JS component yet.** When this lands, the site goes from "broken default" to
> "credible product." This is UX-REVIEW Part 10 **P0** in full, plus the scaffold from
> Part 9.

---

## Outcomes (what "done" looks like)

1. A custom VitePress theme exists at `docs/.vitepress/theme/` extending the default theme,
   loading brand tokens + base styles, with **dark mode as the default appearance**.
2. Self-hosted display + mono fonts are wired (Space Grotesk + Geist Mono / JetBrains Mono).
3. The landing (`index.md`) hero leads with the plain-English headline and subhead; the
   noun-list tagline is gone.
4. The three feature cards are rewritten for humans; **all banned jargon purged**.
5. A new **EVM-contrast** section answers "why is this different" — implemented in markdown +
   CSS (a Vue component is *not* required at this stage; runbook 03 upgrades it to animated).
6. The one-command **golden path** is elevated into a styled "Try this now" block near the top.
7. The fence (`docs-structure.test.mjs`) still passes; `index.md` retains its required markers.
8. `npm run build` + `npm run preview` are clean.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/01-foundation
npm ci
npm run dev    # confirm the current site renders at /infrix-website/ before changing anything
```

Confirm the fence is green from the start:

```bash
node --test docs-structure.test.mjs
```

---

## Step 1 — Create the theme scaffold

Create `docs/.vitepress/theme/index.ts`:

```ts
// Infrix custom theme: extends the VitePress default theme with the brand token
// system and base styles. Components are registered here as later runbooks add them.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Global components register here in runbooks 02–05, e.g.:
    // app.component("SpineDiagram", SpineDiagram);
  },
} satisfies Theme;
```

> VitePress auto-detects `docs/.vitepress/theme/index.ts` — no config change needed to
> activate it. `.vue`/`.ts` in the theme dir compile via VitePress's built-in Vite pipeline.

---

## Step 2 — Token + base + utility stylesheets

Create `docs/.vitepress/theme/styles/tokens.css` with the **canonical token block from
`00-overview.md` §4** (copy it verbatim), then add the light-theme overrides and the
**bridge onto VitePress's own variables** so the docs inherit the brand:

```css
/* ...(paste the :root token block from 00-overview.md §4 here)... */

/* Light theme overrides — VitePress toggles [data-theme] / .dark on <html> */
:root:not(.dark) {
  --ifx-bg:         #FAFBFD;
  --ifx-surface:    #FFFFFF;
  --ifx-surface-2:  #F2F5F9;
  --ifx-border:     #E2E8F0;
  --ifx-text:       #0B1220;
  --ifx-text-muted: #5A6B80;
  /* accents stay the same hues; they read on both themes */
}

/* Bridge: map Infrix tokens onto VitePress theme vars so docs inherit the brand. */
:root {
  --vp-c-brand-1: var(--ifx-brand);
  --vp-c-brand-2: var(--ifx-brand-strong);
  --vp-c-brand-3: var(--ifx-brand-strong);
  --vp-font-family-base: var(--ifx-font-body);
  --vp-font-family-mono: var(--ifx-font-mono);
}
.dark {
  --vp-c-bg:      var(--ifx-bg);
  --vp-c-bg-soft: var(--ifx-surface);
  --vp-c-bg-alt:  var(--ifx-surface);
  --vp-c-divider: var(--ifx-border);
}
```

Create `docs/.vitepress/theme/styles/base.css`:

```css
/* Display face on headings; tighten tracking. Body inherits VitePress base. */
h1, h2, h3, .vp-doc h1, .vp-doc h2 {
  font-family: var(--ifx-font-display);
  letter-spacing: -0.02em;
}
/* Landing-only primitives live behind .ifx-home to avoid bleeding into docs. */
.ifx-home { color: var(--ifx-text); }
.ifx-home .ifx-eyebrow {
  font-family: var(--ifx-font-mono);
  font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--ifx-brand);
}
```

Create `docs/.vitepress/theme/styles/utilities.css`:

```css
.ifx-container { max-width: var(--ifx-maxw); margin-inline: auto; padding-inline: 24px; }

/* Scroll-reveal utility (used by markdown sections now; JS adds .is-in later). */
.ifx-reveal { opacity: 0; transform: translateY(12px); transition:
  opacity var(--ifx-dur) var(--ifx-ease), transform var(--ifx-dur) var(--ifx-ease); }
.ifx-reveal.is-in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .ifx-reveal { opacity: 1; transform: none; transition: none; }
}

/* EVM-contrast grid (used by Step 5). */
.ifx-contrast { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
@media (max-width: 720px) { .ifx-contrast { grid-template-columns: 1fr; } }
.ifx-contrast > div { border: 1px solid var(--ifx-border); border-radius: var(--ifx-r-md);
  padding: 20px; background: var(--ifx-surface); }
.ifx-contrast .old   { opacity: 0.72; }
.ifx-contrast .infrix { border-color: color-mix(in srgb, var(--ifx-brand) 50%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ifx-brand) 30%, transparent),
              0 8px 40px -12px color-mix(in srgb, var(--ifx-brand) 35%, transparent); }

/* "Try this now" golden-path callout. */
.ifx-trynow { border: 1px solid color-mix(in srgb, var(--ifx-verified) 40%, transparent);
  border-radius: var(--ifx-r-md); background:
  color-mix(in srgb, var(--ifx-verified) 8%, var(--ifx-surface));
  padding: 20px 24px; margin: 24px 0; }
.ifx-trynow .ifx-eyebrow { color: var(--ifx-verified); }
```

> **Note:** the `.ifx-reveal` JS hook (adding `.is-in` on scroll) is optional in this effort;
> the CSS fallback shows everything when reduced-motion is set, so sections are never hidden.
> A tiny `IntersectionObserver` snippet can be added in `enhanceApp` later (runbook 03 owns
> the canonical version). For effort 01, ship the static look.

---

## Step 3 — Self-host fonts

1. Download woff2 for **Space Grotesk** (display) and **Geist Mono** *or* **JetBrains Mono**
   (mono) into `docs/.vitepress/theme/assets/fonts/`. Inter is already bundled by VitePress;
   keep using it for body.
2. Add `@font-face` blocks to `base.css` (or a dedicated `fonts.css` imported first), e.g.:

```css
@font-face {
  font-family: "Space Grotesk"; font-style: normal; font-weight: 400 700;
  font-display: swap; src: url("../assets/fonts/space-grotesk.woff2") format("woff2");
}
@font-face {
  font-family: "Geist Mono"; font-style: normal; font-weight: 400 600;
  font-display: swap; src: url("../assets/fonts/geist-mono.woff2") format("woff2");
}
```

3. Preload the display face in `config.mts` `head` (Step 6) for LCP.

> **Licensing:** Space Grotesk (OFL), JetBrains Mono (OFL), Geist (OFL) are all open-source
> and redistributable. Keep the license files alongside the woff2s in `assets/fonts/`.

---

## Step 4 — Set dark default + nav + head in `config.mts`

Edit `docs/.vitepress/config.mts` (the fence requires `defineConfig`, `sidebar`,
`Governance Spine` to remain — they do). Add:

```ts
export default defineConfig({
  // ...existing title/description/lang/base/cleanUrls/srcExclude...
  appearance: "dark",                       // dark-first; user can still toggle
  head: [
    ["link", { rel: "preload", as: "font", type: "font/woff2", crossorigin: "",
               href: "/infrix-website/assets/fonts/space-grotesk.woff2" }],
    ["meta", { property: "og:title", content: "Infrix — describe what you want, get a proof you can trust" }],
    ["meta", { property: "og:description", content:
      "A governance-first execution layer for Accumulate. Every action ends in a portable receipt anyone can verify offline." }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],
  themeConfig: {
    // ...existing nav/sidebar/socialLinks/footer...
    // (search is added in runbook 04; OG image in runbook 06)
  },
});
```

> The preload `href` must include the `base` (`/infrix-website/`). If a custom domain is
> adopted later and `base` returns to `/`, update these paths.

---

## Step 5 — Rewrite `index.md` (the landing)

Replace the current `index.md` with the version below. It uses the default `layout: home`
frontmatter for the hero + features (so VitePress still renders a polished hero with zero
custom JS), then adds the markdown body sections. **Constraints that must hold:**

- The strings `governance-first`, `submitIntent`, and `governance-spine` must appear somewhere
  in the file (fence requirement — they do below).
- No banned jargon (00-overview §6).

````markdown
---
layout: home

hero:
  name: Infrix
  text: Describe what you want. Get back a proof you can trust.
  tagline: |
    A governance-first execution layer for Accumulate. Every action flows through one
    enforced pipeline — intent, plan, approval, execution, evidence — and ends in a
    portable receipt anyone can verify offline, without running a node or trusting the network.
  actions:
    - theme: brand
      text: Start in one command
      link: /getting-started
    - theme: alt
      text: See how it's different
      link: /governance-spine
    - theme: alt
      text: View on GitHub
      link: https://github.com/opendlt/infrix-accumen

features:
  - title: Governed by default
    details: |
      No raw-transaction backdoor. Every state change traverses
      intent → plan → approval → evidence. Governance you can't forget to turn on.
  - title: Proof you can take with you
    details: |
      Outcomes ship a portable evidence bundle. A regulator or auditor verifies it
      offline — no node, and no trust in us required.
  - title: Right execution, every step
    details: |
      Infrix picks how each action runs — by confidentiality, cost, trust, and
      capability — instead of locking you to one hard-coded virtual machine.
---

<div class="ifx-home">

## From a sentence to a verifiable app

<div class="ifx-trynow">

<span class="ifx-eyebrow">Try this now</span>

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
```

You described an app in plain English, Infrix compiled and governed it, and you verified the
proof yourself — **offline, no node, no "trust me."**

</div>

## Not another EVM. Not another VM.

A governance spine the contracts run *inside*. The traditional contract surface still
exists — `@call`, `@deploy`, storage — it just sits *beneath* the spine, not above it.
You can't bypass governance, because there's no API to.

<div class="ifx-contrast">
<div class="old">

**On EVM / typical chains**

- You sign a **raw transaction** and trust validators to do the right thing.
- Governance is *described* in docs and *hoped for* in practice.
- To audit, you trust the chain's RPC or re-run an indexer.
- Plugin / VM choice is hard-coded.

</div>
<div class="infrix">

**On Infrix**

- You submit an **intent** — what you want, in plain or typed terms.
- Governance is **enforced in code**: no path mutates state without approval + policy.
- Every outcome ships a **portable evidence bundle** you verify **offline**.
- Infrix picks the right execution per step — confidentiality, cost, trust, capability.

</div>
</div>

## How it works — the governance spine

Every state-changing operation flows through one canonical pipeline:

```
intent → plan → approval → execution → outcome → evidence → anchor
```

The shortest possible client call submits a `submitIntent` and walks the same spine:

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

</div>
````

> **Why keep `layout: home`?** It gives a polished, responsive hero + feature grid for free,
> inheriting the brand via the token bridge — zero JS, ships today. Runbook 03 replaces the
> hero with the animated `<HomeHero>` + `<SpineDiagram>` and upgrades the EVM-contrast markdown
> into the animated `<EvmContrast>` component. The copy written here carries forward verbatim.

---

## Step 6 — Verify the fence still passes

The fence asserts `index.md` contains `governance-first`, `submitIntent`, `governance-spine`.
The rewrite above includes `governance-first` (hero text), `submitIntent` (code), and the
`/governance-spine` link. Confirm:

```bash
node --test docs-structure.test.mjs
```

If a future copy edit removes one of those literals, either restore it or update the fence in
the *same* commit — never leave the fence red.

---

## Step 7 — Build, preview, eyeball

```bash
npm run build
npm run preview
```

Manual QA matrix:

- [ ] Dark theme is the default on first load; toggle to light works and is legible.
- [ ] Hero headline reads in plain English; no "execution fabric" / "load-bearing primitives".
- [ ] Feature cards contain **zero** banned jargon (`§`, type names).
- [ ] EVM-contrast section renders two columns (desktop) / stacks (mobile ≤ 720px); the
      Infrix column has the brand glow, the old column is muted.
- [ ] "Try this now" callout is visually distinct (verified-green tint) and near the top.
- [ ] Display font is applied to headings; mono font to code.
- [ ] Lighthouse / DevTools: LCP < 2.0s, no CLS, no console errors.

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in `00-overview.md` §9, specifically:

- Theme scaffold (`theme/index.ts` + 3 stylesheets) is in place and loaded.
- Tokens from §4 are the only color source; no stray hex in the new CSS except the documented
  light-theme overrides.
- Fonts self-hosted, preloaded, `font-display: swap`.
- `index.md` rewritten: plain-English hero, human feature cards, EVM-contrast section, elevated
  golden path; banned-jargon list absent; fence markers present.
- `appearance: "dark"` set; OG meta added.
- Fence green, build green, both themes legible, a11y §7 satisfied (contrast verified on the
  contrast grid and callout in both themes).

---

## Out of scope for this effort (so we don't gold-plate)

- The animated `<SpineDiagram>` (runbook 02).
- Any Vue component (`<EvmContrast>`, `<TypedTerminal>`, etc.) — those are runbook 03.
- Local search, glossary, docs diagrams (runbook 04).
- WASM verifier (runbook 05).
- Logo, OG image generation, full a11y audit, jargon-fence test (runbook 06).

Resist building these now. Effort 01's job is the brand foundation + message — shippable on
its own — and a clean scaffold the next runbooks extend.

---

## Handoff notes for runbook 02

- Token names are stable; 02 consumes `--ifx-brand` (pulse), `--ifx-verified`,
  `--ifx-evidence`, `--ifx-pending` for the per-stage colors.
- Register `<SpineDiagram>` in `theme/index.ts` `enhanceApp` (the commented line is the slot).
- The spine stage order/colors will live in `theme/data/spine.ts` — 02 creates it.
