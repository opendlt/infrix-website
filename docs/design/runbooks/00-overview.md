# Infrix Website Redesign — Implementation Overview & Shared Conventions

> **Read this first.** Every runbook (`01`–`06`) assumes the conventions defined
> here: the file tree, the canonical design tokens, the component contracts, the
> banned-jargon list, and the definition-of-done. Do not redefine tokens or
> component APIs inside a runbook — reference this file.
>
> Companion critique: [`../UX-REVIEW.md`](../UX-REVIEW.md).

---

## 1. How the work is broken up

The full plan (UX-REVIEW Parts 1–10) is decomposed into **six sequential efforts**,
each a self-contained, shippable runbook. We tackle **one at a time, to completion**,
before starting the next. Each builds on the previous; the order is load-bearing.

| # | Runbook | Delivers | UX-REVIEW coverage | Depends on |
|---|---|---|---|---|
| 01 | [Foundation: brand system + theme scaffold + message rewrite](./01-foundation.md) | Custom theme dir, design tokens, fonts, dark mode, rewritten hero/pillars/EVM-contrast copy, elevated golden path. **Ships value with zero new JS components.** | Parts 2, 3, 6, 8, 9 (scaffold); Part 10 P0 | — |
| 02 | [Signature visuals: the animated Spine](./02-spine-visuals.md) | `<SpineDiagram>` (animated hero + static docs variant), the brand-defining "wow" element. | Part 4 §1, Part 5 §2, Part 6 motion | 01 |
| 03 | [Interactive narrative components](./03-interactive-narrative.md) | `<SpineWalkthrough>`, `<TypedTerminal>`, `<EvmContrast>`, `<PersonaCards>` — the scrollytelling demo + supporting blocks. | Part 4 §2–§6 | 01, 02 |
| 04 | [Docs experience](./04-docs-experience.md) | Local search, `<Term>` glossary, static spine in docs, code-group tabs, golden-path callout, fleshed-out thin pages. | Part 5 | 01, 02 |
| 05 | [Live WASM evidence verifier](./05-wasm-verifier.md) | `<EvidenceVerifier>` running the real offline verifier client-side — the technical flex. | Part 4 §2 payoff, Part 9 §4 | 02, 03 |
| 06 | [Identity & polish](./06-identity-polish.md) | Logo/wordmark, custom OG images, full a11y audit, motion polish, fence hardening. | Parts 6 (logo), 7, 8 | all |

**Sequencing rationale:** 01 makes everything *look* intentional and unblocks all
component work (tokens, theme dir). 02 builds the one element that defines the brand.
03 assembles the landing narrative. 04 can proceed in parallel with 03 once 02 exists.
05 is the highest-effort/highest-risk flex and depends on a working walkthrough to slot
into. 06 is final polish and is the only effort that should touch "done" surfaces.

---

## 2. Canonical file tree (target end-state)

```
docs/
  .vitepress/
    config.mts                  ← extended (search, nav, head/OG, appearance)
    theme/
      index.ts                  ← extends DefaultTheme; registers components + CSS
      styles/
        tokens.css              ← design tokens (THE single source — §4 below)
        base.css                ← element resets, typography, layout primitives
        utilities.css           ← reveal/motion utilities, .container, spacing
      components/
        SpineDiagram.vue        ← runbook 02
        SpineWalkthrough.vue    ← runbook 03
        TypedTerminal.vue       ← runbook 03
        EvmContrast.vue         ← runbook 03
        PersonaCards.vue        ← runbook 03
        EvidenceVerifier.vue    ← runbook 05
        Term.vue                ← runbook 04
        HomeHero.vue            ← runbook 03 (assembles hero)
      data/
        spine.ts                ← shared stage definitions (§5 below)
        glossary.ts             ← term → definition map (runbook 04)
        demo-bundle.ts          ← canned evidence bundle for the walkthrough
      assets/
        fonts/                  ← self-hosted display + mono woff2
        wasm/                   ← verifier.wasm + wasm_exec.js (runbook 05)
        logo/                   ← wordmark + mark SVGs (runbook 06)
  public/
    og/                         ← generated OG images (runbook 06)
  index.md                      ← marketing landing (custom layout)
  design/                       ← THIS planning material (srcExclude'd, never shipped)
docs-structure.test.mjs         ← fence, extended per runbook
```

**Rule:** anything under `docs/design/` is excluded from the build (`srcExclude: ["design/**"]`
already set in `config.mts`). Never link a public page to it.

---

## 3. Tooling & environment baseline

- **Node 20+**, npm (lockfile committed; `npm ci` reproduces).
- VitePress `^1.3.0` (already a devDependency). Vue 3 SFCs work out of the box — **no extra
  build config needed** for `.vue` components in the theme dir.
- Dev: `npm run dev` → `http://localhost:5173/infrix-website/`.
- Build: `npm run build` → `docs/.vitepress/dist`. Preview: `npm run preview`.
- Fence: `node --test docs-structure.test.mjs` (must pass before every commit; CI runs it).
- **Add no heavyweight dependencies without justification.** Prefer native CSS/SVG/Web APIs
  (`IntersectionObserver`, CSS animations, `requestAnimationFrame`) over animation libraries.
  If a library is unavoidable (e.g. `@vueuse/core` for scroll utilities), note it in the
  runbook's "Dependencies added" section and keep it tree-shakeable.

---

## 4. Canonical design tokens (single source of truth)

These land in `docs/.vitepress/theme/styles/tokens.css` in **runbook 01**. Every other
runbook consumes them via `var(--…)` and **must not invent new raw hex values**. New
semantic tokens may be *added* here (with a note), never duplicated inline.

```css
:root {
  /* ---- Core palette (dark-first; see [data-theme] overrides for light) ---- */
  --ifx-bg:            #0A0E14;  /* near-black, cool                       */
  --ifx-surface:       #121823;  /* cards, raised panels                   */
  --ifx-surface-2:     #1A2230;  /* nested / hover surfaces                */
  --ifx-border:        #1F2A3A;  /* hairlines                              */
  --ifx-text:          #E6EDF3;  /* primary text                          */
  --ifx-text-muted:    #8B98A9;  /* secondary text                        */

  /* ---- Semantic accents (meaning is fixed; do not reuse off-meaning) ---- */
  --ifx-brand:         #4F8CFF;  /* FLOW: links, primary, the spine pulse  */
  --ifx-brand-strong:  #2E6BFF;  /* hover/active of brand                  */
  --ifx-verified:      #58E6B0;  /* CONFIRMATION: only "verified ✓" states */
  --ifx-pending:       #F5A623;  /* APPROVALS / pending                    */
  --ifx-evidence:      #B57EDC;  /* EVIDENCE / proof artifacts             */

  /* ---- Type ---- */
  --ifx-font-display:  "Space Grotesk", system-ui, sans-serif; /* headlines */
  --ifx-font-body:     "Inter", system-ui, sans-serif;
  --ifx-font-mono:     "Geist Mono", "JetBrains Mono", ui-monospace, monospace;

  /* ---- Motion ---- */
  --ifx-ease:          cubic-bezier(0.22, 1, 0.36, 1); /* precise, no bounce */
  --ifx-dur-fast:      180ms;
  --ifx-dur:           280ms;
  --ifx-dur-slow:      420ms;

  /* ---- Space / radius (8px base) ---- */
  --ifx-r-sm: 6px;  --ifx-r-md: 12px;  --ifx-r-lg: 20px;
  --ifx-maxw: 1180px;
}
```

**Semantic-color discipline:** blue = flow, green = verified, violet = evidence, amber =
pending approval. The spine and walkthrough rely on this mapping to *teach* — never use
`--ifx-verified` green for a non-verified element, etc.

**VitePress brand-var bridge (runbook 01):** map the above onto VitePress's own theme vars
(`--vp-c-brand-1`, `--vp-c-brand-2`, `--vp-c-bg`, etc.) in `tokens.css` so the docs theme
inherits the brand without per-page overrides.

---

## 5. Shared spine model (single source of truth)

The seven stages appear in the hero diagram, the docs diagram, and the walkthrough.
Define them **once** in `docs/.vitepress/theme/data/spine.ts` (created in runbook 02,
consumed by 03/04/05). Canonical shape:

```ts
export interface SpineStage {
  id: 'intent' | 'plan' | 'approval' | 'execution' | 'outcome' | 'evidence' | 'anchor';
  label: string;          // "Intent"
  color: string;          // var(--ifx-…) token name as a CSS string
  blurb: string;          // one-line plain-English description (public voice)
}
export const SPINE_STAGES: SpineStage[] = [/* 7 entries, ordered */];
```

Canonical order and meaning (from `governance-spine.md`, translated to public voice):
`intent → plan → approval → execution → outcome → evidence → anchor`.

---

## 6. Banned-jargon list (public-surface copy)

These tokens must **never** appear on any *published* page (landing, docs body copy meant
for newcomers, nav, meta). They may appear in deep reference docs only when defined inline.
Runbook 06 adds a fence test that greps published pages for them.

```
§           (section-number references, e.g. "§15.1")
DisclosureContext   UnifiedStepParams   TypeOutcomeRecord   GetWithActor
"load-bearing primitives"   "execution fabric"   "pluralistic plugin registry"
"WASM contract layer"  (as a standalone value-prop phrase)
```

Replacement vocabulary (the public voice):
- "governance spine" → keep, but always introduce with the plain gloss "one enforced pipeline."
- "intent" → fine; gloss on first use as "what you want, described."
- "evidence bundle" → fine; gloss as "a portable receipt you can verify offline."
- "selector / §15.1" → "Infrix picks the right execution for each step."

**Exception:** `index.md` must retain the literal strings `governance-first`, `submitIntent`,
and `governance-spine` somewhere in the file — the existing fence (`docs-structure.test.mjs`)
asserts their presence. Keep them (e.g. in the code example and a link); just don't lead with
the impenetrable noun-list tagline.

---

## 7. Accessibility checklist (applies to every component)

Every runbook's Definition of Done includes this block. No component is "done" until all pass:

- [ ] Works fully with `prefers-reduced-motion: reduce` — static, meaningful, never broken.
- [ ] No scroll-hijacking; any scroll-driven sequence also has keyboard `Next/Prev` controls.
- [ ] Full keyboard operability; visible focus ring (never `outline: none` without a replacement).
- [ ] Color is never the sole signal — pair with icon/text/`aria-label`.
- [ ] Text contrast ≥ 4.5:1 (body) / ≥ 3:1 (large); verify against `--ifx-bg`/`--ifx-surface`.
- [ ] Custom interactive components expose correct roles/ARIA; decorative SVG is `aria-hidden`,
      meaningful SVG has `role="img"` + `aria-label` + a visually-hidden text equivalent.
- [ ] Respects light + dark themes.

---

## 8. Performance budget (enforced per effort)

- LCP < 2.0s on a mid-tier laptop / throttled "Fast 3G".
- Landing route incremental JS < 100KB gzipped; WASM lazy-loaded on demand only.
- Zero CLS from animations; animate **only** `transform`/`opacity`.
- Self-hosted fonts, `font-display: swap`, preloaded display face.
- Offscreen animations paused via `IntersectionObserver`.
- Run `npm run build` and eyeball the bundle report each effort; note regressions.

---

## 9. Definition of Done (template — every runbook ends with this)

A runbook is complete only when:

1. **Functional:** every acceptance criterion in the runbook is met and manually verified in
   `npm run dev` (both themes, mobile + desktop widths).
2. **Fence green:** `node --test docs-structure.test.mjs` passes (plus any new assertions the
   runbook adds).
3. **Build green:** `npm run build` succeeds with no new warnings; `npm run preview` renders.
4. **A11y:** §7 checklist passes for all touched components.
5. **Perf:** §8 budget respected; regressions noted and justified.
6. **No jargon leak:** §6 list absent from touched public pages.
7. **Committed** on a feature branch with a clear message; PR description links the runbook
   and lists what was verified.

---

## 10. Git & process conventions

- Branch per effort: `redesign/01-foundation`, `redesign/02-spine-visuals`, etc., off `main`
  (current working branch is `tier0-schema-extraction`; confirm the intended base before
  branching).
- Keep the `docs-structure.test.mjs` fence passing at every commit — it gates the Pages deploy.
- Do not commit `node_modules/` or `docs/.vitepress/dist/` (already gitignored).
- Commit messages end with the project's `Co-Authored-By` trailer.
- One effort = one PR. Land it before starting the next; re-check this overview for any
  convention updates the previous effort introduced.

---

## 11. Progress ledger

Keep this table current as efforts land (check the box, add the PR link):

| Effort | Status | PR | Notes |
|---|---|---|---|
| 01 Foundation | ☑ complete (branch `redesign/01-foundation`) | _pending_ | Theme scaffold + tokens + self-hosted fonts (preload verified against emitted URL) + dark default + rewritten landing (plain-English hero, human pillars, EVM-contrast, elevated golden path) + jargon purged from index.md & meta description. Fence + build green. |
| 02 Spine visuals | ☑ complete (branch `redesign/02-spine-visuals`) | _pending_ | `data/spine.ts` (single source of 7 stages) + `SpineDiagram.vue` (GPU-only CSS pulse, IntersectionObserver pause, full reduced-motion/static fallback, SSR-rendered SVG + sr-only list, role=img aria-label). Surfaced in the hero band. **Deviation:** dropped the runbook's `<ClientOnly>` wrapper — it suppressed SSR and broke the runbook's own "static spine present pre-hydration" DoD; component is SSR-safe so direct render is correct. ~10.6KB page chunk (under 40KB). Fence + build green. |
| 03 Interactive narrative | ☑ complete (branch `redesign/03-interactive-narrative`) | _pending_ | 5 components (`HomeHero`, `TypedTerminal`, `EvmContrast`, `SpineWalkthrough`, `PersonaCards`) + `demo-bundle.ts` + `useReveal.ts`; `index.md` → `layout:page` composing them (3 fence markers preserved). **02 contract fix:** added `:active-id` prop to `SpineDiagram` (walkthrough node-sync). **Deviations:** prop-less `<HomeHero/>` single-line tag (robust markdown parsing; defaults = runbook-01 copy); `withBase()` on persona links (raw hrefs would 404 under base path); consolidated mid-script `watch` import to top. All 6 components SSR-render; landing JS 63.7KB gz (<100KB). Fence + build green. **For 06 a11y audit:** `.ifx-reveal` content is opacity:0 pre-JS — fine for SR (in a11y tree) + reduced-motion (forced visible), but purely no-JS sighted users see blank below hero; consider a `<noscript>` reveal. |
| 04 Docs experience | ☐ not started | | |
| 05 WASM verifier | ☐ not started | | |
| 06 Identity & polish | ☐ not started | | |
