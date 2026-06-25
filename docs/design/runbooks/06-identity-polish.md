# Runbook 06 — Identity & Polish: Logo, OG Images, A11y Audit, Motion & Perf Hardening

> **Effort 6 of 6 — the final one.** Prerequisites: **runbooks 01–05 all landed.**
> This is the only effort that deliberately *touches "done" surfaces* — it adds the
> brand mark, social images, runs a whole-site accessibility/motion/performance audit,
> and hardens the fence. Read [`00-overview.md`](./00-overview.md) first — tokens, file
> tree, the §6 banned-jargon list, the §7 a11y checklist, the §8 perf budget, and the §9
> Definition of Done are defined there and are **not** repeated here.
>
> **Goal:** Give the site an identity (logo/wordmark/favicon/OG), prove it is accessible
> and fast across every surface built in 01–05, polish all motion to GPU-only/consistent
> easing, and lock the whole thing down with new fence assertions so jargon can never leak
> and no canonical theme file can silently vanish. When this lands, the 6-effort plan is
> complete and the site is shippable to go-live.

This runbook implements UX-REVIEW **Part 6** (logo/wordmark, motion principles),
**Part 7** (accessibility), **Part 8** (performance), and **Part 9 §6** (fence
extension). It assumes the surfaces from earlier efforts already exist:

| Surface | Built in | Audited here |
|---|---|---|
| Theme scaffold, tokens, fonts, `index.md` hero/contrast/golden-path | 01 | a11y, motion, perf |
| `<SpineDiagram>` (animated + static) | 02 | a11y label, reduced-motion, 60fps, offscreen pause |
| `<SpineWalkthrough>`, `<TypedTerminal>`, `<EvmContrast>`, `<PersonaCards>`, `<HomeHero>` | 03 | keyboard, focus, reduced-motion, contrast |
| Local search, `<Term>` glossary, docs static spine, code-group tabs | 04 | tooltip a11y, search keyboard path |
| `<EvidenceVerifier>` (WASM) | 05 | lazy-load, focus, status announcements |

---

## Outcomes (what "done" looks like)

1. A **logo + wordmark system** exists under `docs/.vitepress/theme/assets/logo/`: a
   standalone **mark** (spine→checkmark motif) and a **horizontal lockup** (mark + lowercase
   `infrix` wordmark with the accent node on the `i`), both as theme-able SVG. The mark is
   wired into `themeConfig.logo` and shows in the nav; a **favicon** (SVG + PNG fallback) is
   wired via `config.mts` `head`.
2. A reusable **1200×630 OG/social image** featuring the spine + headline is committed at
   `docs/public/og/og-default.png`, and `og:image` / `twitter:image` are wired with **absolute
   URLs** in `config.mts` `head`. (Optional build-time generation is documented but not the
   recommended path.)
3. A **full accessibility audit pass** across the whole site is executed and recorded in a
   pass/fail table: axe + Lighthouse runs, a keyboard-only walkthrough of every interactive,
   contrast verification of every semantic color on both themes, focus-ring audit,
   `prefers-reduced-motion` verification of every animation, and a screen-reader pass on the
   spine. Every row passes (or has a tracked remediation).
4. **Motion polish:** every animation is confirmed GPU-only (`transform`/`opacity`), uses
   `--ifx-ease`, pauses offscreen, and holds 60fps with zero CLS.
5. **Performance final pass:** bundle size measured against 00-overview **§8**, font preload
   verified, WASM confirmed lazy, LCP measured < 2.0s; regressions noted + fixed.
6. **The fence is hardened** (`docs-structure.test.mjs`): new assertions verify the canonical
   theme files/components exist, **and a new test greps every *published* page for the
   banned-jargon list and fails if any token appears**. Existing assertions are kept intact.
7. A **cross-browser/responsive QA matrix** is green and a **release / go-live checklist** is
   completed.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/06-identity-polish
npm ci

# Everything 01–05 must already be green before polishing it:
node --test docs-structure.test.mjs
npm run build
npm run dev    # confirm hero, spine, walkthrough, verifier, search all render at /infrix-website/
```

Confirm the prerequisite surfaces exist on disk before auditing them:

```bash
ls docs/.vitepress/theme/index.ts \
   docs/.vitepress/theme/styles/tokens.css \
   docs/.vitepress/theme/components/SpineDiagram.vue \
   docs/.vitepress/theme/components/SpineWalkthrough.vue \
   docs/.vitepress/theme/components/EvidenceVerifier.vue \
   docs/.vitepress/theme/components/Term.vue
```

> If any are missing, the corresponding earlier runbook is not actually landed — stop and
> finish it first. This effort hardens what exists; it does not build the components.

---

## Step 1 — Logo & wordmark system

### 1.1 Design rationale

The mark is the **spine motif from `<SpineDiagram>`**: seven nodes on a flowing line that
resolves into a **checkmark** — "a pipeline that ends in a proof." This makes the identity and
the hero visual the *same idea*, drawn twice. The wordmark is lowercase **`infrix`** in the
display face (**Space Grotesk**, already self-hosted from runbook 01) with a single **accent
node** replacing/topping the dot of the `i` — the same node that pulses in the spine.

Color discipline (00-overview §4): the line/nodes use `--ifx-brand` (flow blue), the resolving
checkmark uses `--ifx-verified` (confirmation green). Where the mark must invert with the theme
(nav, footer), use `currentColor` so it inherits text color; where it must stay on-brand
(favicon, OG), bake the token hexes in.

### 1.2 Produce the assets

Create the directory and four files:

```
docs/.vitepress/theme/assets/logo/
  mark.svg              ← standalone mark, brand+verified hexes (favicon source / OG)
  mark-currentcolor.svg ← standalone mark, currentColor (nav/footer, theme-inheriting)
  lockup.svg            ← horizontal: mark + "infrix" wordmark, currentColor + accent node
  README.md             ← provenance + regen notes
```

**`mark.svg`** — standalone, baked brand colors (square 64×64 viewBox, for favicon/OG export):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"
     aria-label="Infrix mark: a governance spine resolving into a checkmark">
  <title>Infrix</title>
  <!-- flowing spine line: six nodes left→right, then it lifts into a checkmark -->
  <g fill="none" stroke="#4F8CFF" stroke-width="3"
     stroke-linecap="round" stroke-linejoin="round">
    <!-- the spine: a gentle line carrying the pulse -->
    <path d="M8 36 H30" />
    <!-- the resolve: line lifts into a check -->
    <path d="M30 36 L40 46 L56 18" stroke="#58E6B0" />
  </g>
  <!-- the seven nodes; the last is the verified terminus (green) -->
  <g fill="#4F8CFF">
    <circle cx="8"  cy="36" r="3.5"/>
    <circle cx="15" cy="36" r="3"/>
    <circle cx="22" cy="36" r="3"/>
    <circle cx="30" cy="36" r="4"/>
    <circle cx="40" cy="46" r="3"/>
  </g>
  <g fill="#58E6B0">
    <circle cx="56" cy="18" r="4.5"/>
  </g>
</svg>
```

**`mark-currentcolor.svg`** — same geometry, theme-inheriting (nav/footer). The line is
`currentColor`; only the verified terminus keeps the green accent so the "ends in a proof"
meaning survives:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img"
     aria-label="Infrix">
  <title>Infrix</title>
  <g fill="none" stroke="currentColor" stroke-width="3"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 36 H30" />
    <path d="M30 36 L40 46 L56 18" />
  </g>
  <g fill="currentColor">
    <circle cx="8"  cy="36" r="3.5"/>
    <circle cx="15" cy="36" r="3"/>
    <circle cx="22" cy="36" r="3"/>
    <circle cx="30" cy="36" r="4"/>
    <circle cx="40" cy="46" r="3"/>
  </g>
  <!-- verified terminus keeps the brand-verified accent in both themes -->
  <circle cx="56" cy="18" r="4.5" fill="var(--ifx-verified, #58E6B0)"/>
</svg>
```

> **Note on CSS vars in SVG:** `var()` works when the SVG is inlined in the DOM (the VitePress
> nav inlines `themeConfig.logo` as an `<img>` only — `<img>` does **not** evaluate page CSS
> vars). So for the **nav logo** use `mark-currentcolor.svg` with a hard fallback hex on the
> terminus (as above) — the `var()` simply degrades to `#58E6B0` inside an `<img>`, which is
> the intended brand green. The `currentColor` strokes also won't pick up text color inside an
> `<img>`; if exact theme-matching in the nav is required, register the mark as a small Vue
> component and use it via a slot instead. For go-live, the `<img>` + green terminus reads
> correctly on both themes and is the simplest wiring — prefer it.

**`lockup.svg`** — horizontal lockup (mark + wordmark). The wordmark is **drawn as text** in
Space Grotesk so it renders identically without depending on font load; the accent node sits on
the `i`. Use a `260×64` viewBox:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64" role="img"
     aria-label="Infrix">
  <title>Infrix</title>
  <!-- mark (reuses the standalone geometry, scaled into the left 64px) -->
  <g fill="none" stroke="currentColor" stroke-width="3"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 36 H30"/>
    <path d="M30 36 L40 46 L56 18"/>
  </g>
  <g fill="currentColor">
    <circle cx="8" cy="36" r="3.5"/><circle cx="15" cy="36" r="3"/>
    <circle cx="22" cy="36" r="3"/><circle cx="30" cy="36" r="4"/>
    <circle cx="40" cy="46" r="3"/>
  </g>
  <circle cx="56" cy="18" r="4.5" fill="#58E6B0"/>
  <!-- wordmark: lowercase "infrix" in the display face -->
  <text x="80" y="44" fill="currentColor"
        font-family="'Space Grotesk', system-ui, sans-serif"
        font-size="36" font-weight="600" letter-spacing="-1">infrix</text>
  <!-- accent node on the i (sits above the first stem of "infrix") -->
  <circle cx="88" cy="16" r="4" fill="#4F8CFF"/>
</svg>
```

> The accent-node `cx`/`cy` is tuned to the rendered Space Grotesk glyph — open the SVG in the
> browser and nudge `cx` (~86–90) / `cy` (~14–18) until the node tops the `i` stem cleanly.
> Because the wordmark is a live `<text>`, this lockup is for inline/DOM use (footer, README,
> OG composition). For a guaranteed-pixel-stable lockup (no font dependency), convert the
> `<text>` to outlines once tuned (Inkscape: *Path → Object to Path*) and commit a
> `lockup-outlined.svg` variant.

**`README.md`** in the logo dir — record provenance:

```markdown
# Infrix logo assets
Mark motif = the governance spine resolving into a checkmark (matches `<SpineDiagram>`).
- `mark.svg`              brand-colored mark; source for favicon + OG (export to PNG).
- `mark-currentcolor.svg` theme-inheriting mark; used as themeConfig.logo (nav).
- `lockup.svg`            horizontal lockup, live Space Grotesk wordmark + accent node.
Colors are the canonical tokens (00-overview §4): line --ifx-brand #4F8CFF,
verified terminus --ifx-verified #58E6B0. Regenerate PNGs via the recipe in
runbook 06 §2.4. Do not invent new hexes.
```

### 1.3 Wire the logo into VitePress

In `docs/.vitepress/config.mts`, add `logo` to `themeConfig`. VitePress resolves
`themeConfig.logo` relative to `srcDir`/`public`, so place a copy the build can serve. The
cleanest path: copy the nav mark into `docs/public/` (public assets are served at the site
root + `base`), then reference it:

```bash
mkdir -p docs/public/brand
cp docs/.vitepress/theme/assets/logo/mark-currentcolor.svg docs/public/brand/mark.svg
```

```ts
// docs/.vitepress/config.mts — inside themeConfig
themeConfig: {
  logo: "/brand/mark.svg",            // resolved as {base}/brand/mark.svg in the nav
  siteTitle: "infrix",                 // lowercase wordmark next to the mark in the nav
  // ...existing nav / sidebar / socialLinks / footer ...
},
```

> `logo` is a public-path string (VitePress prepends `base` automatically — do **not** hardcode
> `/infrix-website/` here, unlike `head` font preloads which are raw strings). Setting
> `siteTitle` to lowercase `infrix` gives the wordmark beside the mark without needing the SVG
> lockup in the nav.

### 1.4 Favicon (SVG + PNG fallback)

Generate the PNG fallback from `mark.svg` (recipe in §2.4) and place both in `docs/public/`:

```
docs/public/favicon.svg          (copy of mark.svg — brand-colored, scales crisply)
docs/public/favicon-32.png       (32×32 raster fallback for older browsers)
docs/public/apple-touch-icon.png (180×180, for iOS home-screen)
```

Wire them in `config.mts` `head` (raw paths — **must** include `base`):

```ts
head: [
  // ...existing font preload + OG/twitter meta from runbook 01...
  ["link", { rel: "icon", type: "image/svg+xml", href: "/infrix-website/favicon.svg" }],
  ["link", { rel: "icon", type: "image/png", sizes: "32x32",
             href: "/infrix-website/favicon-32.png" }],
  ["link", { rel: "apple-touch-icon", sizes: "180x180",
             href: "/infrix-website/apple-touch-icon.png" }],
],
```

> **Base-path caveat (applies to every raw `head` URL):** `head` entries are *not* base-prefixed
> by VitePress — they ship verbatim. They include `/infrix-website/` because that is the current
> `base`. If a custom domain is adopted and `base` returns to `/`, update every favicon/OG href
> here in the same commit (and update the fence note in Step 6 if you assert on these strings).

---

## Step 2 — Custom OG / social image

### 2.1 Approach decision

Two ways to get a `1200×630` social card:

- **(a) Committed static PNG** — author one SVG, export to PNG once, commit it under
  `docs/public/og/`. Zero build complexity, zero runtime cost, deterministic. **Recommended.**
- **(b) Build-time generation** — render per-page cards at build time (e.g. a small
  `buildEnd` hook + `satori`/`resvg` or a headless browser). Powerful for many pages, but adds
  dependencies, build time, and a failure surface. **Not recommended** for a site this size —
  one strong default card is enough.

Ship **(a)**. Document (b) below for completeness but do not implement it.

### 2.2 The OG SVG (source for the PNG)

Create `docs/.vitepress/theme/assets/logo/og-default.svg` (1200×630). It reuses the spine motif
large, the lockup, and the hero headline. Colors are baked (OG images are static rasters — no
theme):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0A0E14"/>
  <!-- subtle surface panel -->
  <rect x="0" y="0" width="1200" height="630" fill="#0A0E14"/>
  <!-- the spine, drawn large across the card -->
  <g fill="none" stroke="#4F8CFF" stroke-width="6"
     stroke-linecap="round" stroke-linejoin="round">
    <path d="M120 470 H520"/>
    <path d="M520 470 L600 540 L1080 200" stroke="#58E6B0"/>
  </g>
  <g fill="#4F8CFF">
    <circle cx="120" cy="470" r="9"/><circle cx="220" cy="470" r="8"/>
    <circle cx="320" cy="470" r="8"/><circle cx="420" cy="470" r="8"/>
    <circle cx="520" cy="470" r="10"/><circle cx="600" cy="540" r="8"/>
  </g>
  <circle cx="1080" cy="200" r="12" fill="#58E6B0"/>
  <!-- wordmark -->
  <text x="120" y="150" fill="#E6EDF3"
        font-family="'Space Grotesk', system-ui, sans-serif"
        font-size="64" font-weight="700" letter-spacing="-2">infrix</text>
  <circle cx="133" cy="92" r="7" fill="#4F8CFF"/>
  <!-- headline -->
  <text x="120" y="250" fill="#E6EDF3"
        font-family="'Space Grotesk', system-ui, sans-serif"
        font-size="52" font-weight="600" letter-spacing="-1">Describe what you want.</text>
  <text x="120" y="318" fill="#E6EDF3"
        font-family="'Space Grotesk', system-ui, sans-serif"
        font-size="52" font-weight="600" letter-spacing="-1">Get back a proof you can trust.</text>
  <!-- subhead -->
  <text x="120" y="380" fill="#8B98A9"
        font-family="Inter, system-ui, sans-serif" font-size="26">
    A governance-first execution layer for Accumulate — verify every outcome offline.
  </text>
</svg>
```

> Keep the headline text identical to the hero H1 (00-overview / runbook 01 copy) and the
> banned-jargon list clear — this string is also published-adjacent (it is the social preview).

### 2.3 Wire the OG meta

OG/Twitter image URLs **must be absolute** (scrapers don't resolve relative paths). Add to
`config.mts` `head`, extending the OG block runbook 01 started:

```ts
head: [
  // ...favicon links from §1.4 ...
  // OG title/description already added in runbook 01; add the image (absolute URL):
  ["meta", { property: "og:image",
             content: "https://opendlt.github.io/infrix-website/og/og-default.png" }],
  ["meta", { property: "og:image:width",  content: "1200" }],
  ["meta", { property: "og:image:height", content: "630" }],
  ["meta", { property: "og:url",
             content: "https://opendlt.github.io/infrix-website/" }],
  ["meta", { property: "og:type", content: "website" }],
  ["meta", { name: "twitter:image",
             content: "https://opendlt.github.io/infrix-website/og/og-default.png" }],
  // twitter:card "summary_large_image" was added in runbook 01 — keep it.
],
```

> **Domain caveat:** the absolute origin (`https://opendlt.github.io` + `base`) is baked into
> these strings because OG requires it. If the site moves to a custom domain, these are the
> exact strings to change. Validate after deploy with the X/Twitter Card Validator,
> LinkedIn Post Inspector, and Facebook Sharing Debugger (each caches — re-scrape after change).

### 2.4 SVG → PNG export recipe

Export the OG SVG and the favicon PNGs. Two reliable, dependency-light options:

```bash
# Option A — resvg-js CLI (deterministic, headless, recommended; bundles the fonts you point at)
npx --yes @resvg/resvg-js-cli \
  docs/.vitepress/theme/assets/logo/og-default.svg \
  docs/public/og/og-default.png --width 1200 --height 630

# Option B — rsvg-convert (librsvg; available via most package managers / `brew install librsvg`)
rsvg-convert -w 1200 -h 630 \
  docs/.vitepress/theme/assets/logo/og-default.svg \
  -o docs/public/og/og-default.png

# Favicons from the brand mark:
npx --yes @resvg/resvg-js-cli docs/.vitepress/theme/assets/logo/mark.svg \
  docs/public/favicon-32.png --width 32 --height 32
npx --yes @resvg/resvg-js-cli docs/.vitepress/theme/assets/logo/mark.svg \
  docs/public/apple-touch-icon.png --width 180 --height 180
cp docs/.vitepress/theme/assets/logo/mark.svg docs/public/favicon.svg
```

> **Font note for export:** the OG SVG uses Space Grotesk / Inter in `<text>`. Headless
> rasterizers only render those faces if the font is installed/loadable at export time. If the
> exported PNG shows fallback glyphs, either install the woff2/ttf locally before exporting, or
> convert the `<text>` to outlines first (Inkscape *Object to Path*) and export the outlined
> SVG. Commit the resulting **PNG** (the rendered artifact) — that's what ships; the SVG stays
> as editable source in `theme/assets/logo/`.

```bash
mkdir -p docs/public/og   # ensure the committed PNG has a home
```

### 2.5 (Optional, documented-only) build-time generation

If per-page cards are ever wanted: in `config.mts`, a `transformPageData`/`buildEnd` hook can
compose a card per page with `satori` (HTML/JSX → SVG) + `@resvg/resvg-js` (SVG → PNG), writing
to `dist/og/<page>.png` and injecting a per-page `og:image` via `transformHead`. **Do not build
this now** — it adds two deps and a build-time render pass for marginal benefit on a ~13-page
site. Recorded here only so a future maintainer knows the path exists.

---

## Step 3 — Full accessibility audit pass

Execute this across **every surface**: the landing (`index.md` hero, contrast, golden-path,
persona cards), all components from 02–05, and the docs. Record results in the pass/fail table
(§3.6). No row may ship as **FAIL** without a tracked remediation.

### 3.1 Automated scan (axe + Lighthouse)

```bash
npm run build && npm run preview   # serves the production build at the preview port
```

- **axe DevTools** (browser extension): run on `/` (both themes), `/governance-spine`,
  `/getting-started`, one SDK page, and a page using `<Term>`. Target: **zero critical/serious**
  violations. Triage "moderate"/"minor".
- **Lighthouse** (DevTools → Lighthouse, "Accessibility" + "Performance" categories,
  mobile + desktop): record the **a11y score** (target **100**, never < 95) and the perf
  metrics (used again in Step 5). Run against the *preview* build, not dev.
- Optional CI-able pass: `npx --yes @axe-core/cli http://localhost:4173/infrix-website/`
  (point at the `preview` URL).

### 3.2 Keyboard-only walkthrough

Unplug the mouse. Tab through each interactive; every one must be reachable, operable, and
escape-able, with a visible focus ring at each stop:

| Component | Keyboard requirement |
|---|---|
| **Hero** (`<HomeHero>`) | Both CTAs reachable in DOM order; `Enter`/`Space` activate; focus ring visible. |
| **`<SpineDiagram>`** (animated) | Decorative animation must not be a tab trap; if interactive nodes exist they're `Tab`-reachable with labels, else the whole SVG is `aria-hidden` and a text summary precedes it. |
| **`<SpineWalkthrough>`** | **No scroll-jacking.** Explicit `Next`/`Prev` buttons are focusable + `Enter`-activated; stage state is announced (`aria-live="polite"`); `Home`/`End` optional. |
| **`<PersonaCards>`** | Each card is a real link/button, `Tab`-reachable, `Enter` navigates; focus ring visible on the card. |
| **`<EvidenceVerifier>`** | "Verify" button focusable; while WASM loads, a `role="status"` spinner announces "verifying…"; result (`✓ verified` / reason) is announced via `aria-live`. |
| **`<Term>` tooltips** | Focusable (`tabindex="0"`), tooltip shown on focus **and** hover, dismissible with `Esc`, linked via `aria-describedby`; not hover-only. |
| **Search** (runbook 04) | `/` or button opens it; arrow-keys navigate results; `Esc` closes; focus returns to trigger. |
| **Code-group tabs** (runbook 04) | Tabs are `role="tab"` in a `tablist`; arrow-keys move between, `Enter`/`Space` select. |

### 3.3 Contrast verification (every semantic color, both themes)

Verify each token pairing with a contrast checker (axe reports these, or use the DevTools
color-picker contrast readout). The semantic accents must stay legible on both `--ifx-bg` and
`--ifx-surface` in **dark and light**:

| Foreground token | On background | Min ratio | Use site |
|---|---|---|---|
| `--ifx-text` | `--ifx-bg` | 4.5:1 | body copy |
| `--ifx-text-muted` | `--ifx-bg` | 4.5:1 | subheads, captions |
| `--ifx-brand` | `--ifx-bg` | 3:1 (large/UI) | links, primary button text/icon |
| `--ifx-verified` | `--ifx-surface` | 3:1 | "verified ✓" states |
| `--ifx-pending` | `--ifx-surface` | 3:1 | approval/pending chips |
| `--ifx-evidence` | `--ifx-surface` | 3:1 | evidence panel accents |
| button label | `--ifx-brand` fill | 4.5:1 | CTA text on brand button |

> If a pairing fails (amber `--ifx-pending` on light surface is the usual offender), **do not
> change the canonical token** — add a darkened *light-theme-only* variant in `tokens.css`
> under `:root:not(.dark)` (as 01 already does for surfaces) and use it for text/icons. Note the
> addition per 00-overview §4 ("new semantic tokens may be added, never duplicated inline").

### 3.4 Focus-ring audit

- Grep the theme CSS for suppressed outlines and confirm each has a replacement:

  ```bash
  grep -rn "outline: *none\|outline:0" docs/.vitepress/theme/styles \
        docs/.vitepress/theme/components
  ```

  Every hit must be paired with a visible `:focus-visible` style (ring via
  `box-shadow`/`outline` in `--ifx-brand`). 00-overview §7 forbids bare `outline: none`.
- Confirm a global focus-visible default exists (add to `base.css` if missing):

  ```css
  :where(a, button, [tabindex], summary, input, select):focus-visible {
    outline: 2px solid var(--ifx-brand);
    outline-offset: 2px;
    border-radius: var(--ifx-r-sm);
  }
  ```

### 3.5 `prefers-reduced-motion` verification (every animation)

In DevTools, emulate **`prefers-reduced-motion: reduce`** (Rendering panel) and reload. Every
animated surface must degrade to a **static, meaningful** state — never blank, never broken:

| Animation | Reduced-motion expectation |
|---|---|
| Spine pulse (`<SpineDiagram>` animated) | Static fully-drawn spine, all nodes/check visible, no traveling pulse. |
| Scroll-reveal `.ifx-reveal` | Everything visible immediately (01 already ships this fallback). |
| `<SpineWalkthrough>` stage transitions | Instant stage swaps, no slide/fade; `Next`/`Prev` still work. |
| `<TypedTerminal>` typewriter | Full text shown at once (no per-char typing). |
| `<EvmContrast>` column reveal | Both columns visible, no entrance animation. |
| Verifier spinner | A static "verifying…" label is acceptable; result still announced. |

Confirm each component's CSS has a `@media (prefers-reduced-motion: reduce)` block (or guards
its JS animation with `matchMedia('(prefers-reduced-motion: reduce)')`):

```bash
grep -rL "prefers-reduced-motion" docs/.vitepress/theme/components/*.vue
# ^ lists components that DON'T mention it — each listed file must justify why (truly no motion)
```

### 3.6 Screen-reader pass + pass/fail template

Run **NVDA** (Windows) or **VoiceOver** (macOS) and confirm the spine and walkthrough are
comprehensible without sight:

- `<SpineDiagram>`: the meaningful variant exposes `role="img"` + an `aria-label` that *names
  the seven stages in order* ("Governance spine: intent, plan, approval, execution, outcome,
  evidence, anchor"), plus a visually-hidden `<p>` text equivalent. The decorative animated
  hero variant is `aria-hidden="true"` so the screen reader isn't spammed by the pulse.
- `<SpineWalkthrough>`: each stage advance is announced via `aria-live="polite"`; the current
  stage and its plain-English blurb (from `spine.ts`) are read.
- `<EvidenceVerifier>`: the verify result ("verified offline — chain hash …" / failure reason)
  is announced, not just colored.

**Record the audit in this table (template — fill PASS/FAIL + notes):**

| # | Surface / check | axe | Keyboard | Contrast | Focus ring | Reduced-motion | Screen reader | Result |
|---|---|---|---|---|---|---|---|---|
| 1 | Landing hero (`<HomeHero>`) | | | | | | | |
| 2 | `<SpineDiagram>` (animated) | | | | | | | |
| 3 | `<SpineDiagram>` (docs static) | | | | | | | |
| 4 | `<SpineWalkthrough>` | | | | | | | |
| 5 | `<TypedTerminal>` | | | | | | | |
| 6 | `<EvmContrast>` | | | | | | | |
| 7 | `<PersonaCards>` | | | | | | | |
| 8 | `<EvidenceVerifier>` | | | | | | | |
| 9 | `<Term>` tooltips | | | | | | | |
| 10 | Local search | | | | | | | |
| 11 | Code-group tabs | | | | | | | |
| 12 | Nav + logo + footer | | | | | | | |
| 13 | Docs body (governance-spine.md) | | | | | | | |

**Remediation guidance (common failures → fix):**

- *Missing/wrong ARIA on a custom component* → add `role` + `aria-label`/`aria-describedby`; for
  the spine add the visually-hidden text equivalent.
- *Hover-only tooltip* → make `<Term>` focusable (`tabindex="0"`) and trigger on `focus`,
  dismiss on `Esc`, link with `aria-describedby`.
- *Suppressed focus ring* → replace `outline: none` with the `:focus-visible` ring (§3.4).
- *Low-contrast accent on light theme* → add a light-theme text-safe token variant (§3.3).
- *Animation has no static fallback* → add the `@media (prefers-reduced-motion: reduce)` block
  (§3.5) and gate any JS-driven animation behind `matchMedia`.
- *Scroll-jacked walkthrough* → ensure native scroll is never trapped and `Next`/`Prev` controls
  drive the state machine independently of scroll.

---

## Step 4 — Motion polish

Audit every animation against the motion principles in UX-REVIEW Part 6 / 00-overview §8:

1. **GPU-only properties.** Animate **only** `transform` and `opacity` — never `width`,
   `height`, `top`, `left`, `margin`, `box-shadow` (use `transform`/`opacity` proxies). Grep:

   ```bash
   grep -rn "transition:\|animation:\|@keyframes" \
     docs/.vitepress/theme/styles docs/.vitepress/theme/components
   ```

   Inspect each hit; flag any that transitions a layout/paint property. Re-express as transform
   (e.g. scale instead of width) or remove from the transition.

2. **Consistent easing.** Every transition/animation uses `var(--ifx-ease)` (and a duration
   token `--ifx-dur*`). No raw `ease`, `ease-in-out`, or ad-hoc cubic-beziers:

   ```bash
   grep -rn "cubic-bezier\|ease-in-out\|ease-out\| ease;\| linear;" \
     docs/.vitepress/theme | grep -v "var(--ifx-ease)"
   # ^ any remaining hit (except --ifx-ease's own definition in tokens.css) → convert it
   ```

3. **Offscreen pausing.** The animated `<SpineDiagram>` (and any looping animation) pauses when
   offscreen via `IntersectionObserver` (02 owns the canonical implementation). Verify: scroll
   the spine out of view and confirm in the Performance panel that its rAF/animation work stops.

4. **60fps + zero CLS.** With the Performance panel recording, load `/` and scroll through the
   whole page: the spine pulse and reveals should hold ~60fps (no long red frames), and the
   **Layout Shift** track must be flat (CLS contribution from animation = 0; animating only
   transform/opacity guarantees this). Record the CLS figure for the table in Step 7.

---

## Step 5 — Performance final pass

Measure against 00-overview **§8** and note/fix regressions.

1. **Bundle size vs budget.** Build and inspect the report:

   ```bash
   npm run build   # eyeball the per-chunk output sizes VitePress prints
   ```

   Budget: **landing-route incremental JS < 100KB gzipped**. The walkthrough/verifier islands
   should be code-split so they don't inflate the initial landing payload. If the landing chunk
   exceeds budget, defer the heavy island (dynamic import / `defineAsyncComponent`) so it loads
   on interaction/scroll, not at first paint.

2. **Font preload verification.** Confirm the Space Grotesk preload from runbook 01 is present
   and *used* (no DevTools "preloaded but not used within a few seconds" warning). The preload
   `href` includes `base` (`/infrix-website/assets/fonts/space-grotesk.woff2`). All faces use
   `font-display: swap`.

3. **WASM lazy-load confirmation.** Open the Network panel, load `/`, and confirm **`verifier.wasm`
   and `wasm_exec.js` are NOT requested on initial load** — they fetch only when the user clicks
   "Verify this proof" in `<EvidenceVerifier>` (runbook 05). A spinner shows during fetch/init.

4. **LCP measurement.** Lighthouse (mobile, throttled "Fast 3G" / mid-tier CPU): **LCP < 2.0s.**
   The LCP element is the hero headline (text) — ensure it isn't blocked by the display-font load
   (swap + preload handle this). Record the figure.

5. **Regressions.** Compare against the last effort's numbers. Note any regression and its fix in
   the PR (e.g. "verifier island was eagerly imported into the landing chunk → switched to
   `defineAsyncComponent`, landing JS back to N KB").

---

## Step 6 — Harden the fence (`docs-structure.test.mjs`)

Extend the existing fence with the assertions from UX-REVIEW **Part 9 §6**. **Keep the three
existing tests unchanged** (required-pages, vitepress-config markers, index.md governance-first
markers). Add: (a) canonical theme files/components exist, and (b) a new test that greps every
**published** page for the banned-jargon list and fails on any hit.

Add the following to the **top** of the file (after the existing `docs` constant), then append
the two new tests. The full edited file:

```js
// Relocated docs-site fence (was pkg/intent/g21_docs_site_fence_test.go in the
// infrix-accumen monorepo). Locks the site scaffold so a refactor can't silently
// drop a canonical page, detach from vitepress, lose the governance-first
// framing, drop a brand/theme file, or leak internal jargon onto a public page.
//
//   node --test docs-structure.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const docs = join(root, 'docs');

// Every page reachable from the vitepress nav/sidebar MUST exist on disk.
const requiredPages = [
  'index.md',
  'getting-started.md',
  'governance-spine.md',
  'sdk/typescript-client.md',
  'sdk/typescript-wallet.md',
  'sdk/rust.md',
  'sdk/assemblyscript.md',
  'tutorials/first-intent.md',
  'tutorials/multi-party-trade.md',
  'tutorials/cross-domain-bridge.md',
  'cookbook/approval-policies.md',
  'cookbook/trust-profiles.md',
  'cookbook/offline-verification.md',
];

test('every nav/sidebar-linked page exists (no silent 404s)', () => {
  for (const p of requiredPages) {
    assert.ok(existsSync(join(docs, p)), `missing docs page: ${p}`);
  }
});

test('vitepress config is present and well-formed', () => {
  const cfg = join(docs, '.vitepress', 'config.mts');
  assert.ok(existsSync(cfg), 'missing docs/.vitepress/config.mts');
  const src = readFileSync(cfg, 'utf8');
  for (const marker of ['defineConfig', 'sidebar', 'Governance Spine']) {
    assert.ok(src.includes(marker), `vitepress config missing ${marker}`);
  }
});

test('landing page keeps the governance-first framing', () => {
  const src = readFileSync(join(docs, 'index.md'), 'utf8');
  for (const marker of ['governance-first', 'submitIntent', 'governance-spine']) {
    assert.ok(src.includes(marker), `index.md missing governance-first marker: ${marker}`);
  }
});

// ---- Runbook 06 additions ------------------------------------------------

// (a) The canonical brand/theme scaffold + components (00-overview §2 file tree,
//     built across runbooks 01–06) must exist — a refactor can't silently drop them.
const requiredThemeFiles = [
  '.vitepress/theme/index.ts',
  '.vitepress/theme/styles/tokens.css',
  '.vitepress/theme/styles/base.css',
  '.vitepress/theme/styles/utilities.css',
  '.vitepress/theme/components/SpineDiagram.vue',
  '.vitepress/theme/components/SpineWalkthrough.vue',
  '.vitepress/theme/components/TypedTerminal.vue',
  '.vitepress/theme/components/EvmContrast.vue',
  '.vitepress/theme/components/PersonaCards.vue',
  '.vitepress/theme/components/EvidenceVerifier.vue',
  '.vitepress/theme/components/Term.vue',
  '.vitepress/theme/assets/logo/mark.svg',
  '.vitepress/theme/assets/logo/lockup.svg',
  'public/og/og-default.png',
  'public/favicon.svg',
];

test('canonical theme/brand files exist (scaffold not silently dropped)', () => {
  for (const f of requiredThemeFiles) {
    assert.ok(existsSync(join(docs, f)), `missing theme/brand file: ${f}`);
  }
});

// (b) No internal jargon may leak onto a PUBLISHED page. Walk every docs/**/*.md
//     EXCEPT docs/design/** (planning material, srcExclude'd, never shipped), and
//     fail if any banned token from 00-overview §6 appears.
const BANNED = [
  '§',
  'DisclosureContext',
  'UnifiedStepParams',
  'TypeOutcomeRecord',
  'GetWithActor',
  'load-bearing primitives',
  'execution fabric',
  'pluralistic plugin registry',
];

// index.md is REQUIRED by the existing fence to contain `submitIntent`,
// `governance-first`, `governance-spine` — none of those are banned tokens, so
// no exception is needed here. The banned list is intentionally disjoint from
// those markers.

function publishedMarkdown(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(docs, full);
    // Skip the planning tree (srcExclude'd) and the vitepress build dir.
    if (rel.split(sep)[0] === 'design') continue;
    if (rel.split(sep).includes('.vitepress')) continue;
    const st = statSync(full);
    if (st.isDirectory()) out.push(...publishedMarkdown(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

test('no banned internal jargon leaks onto any published page', () => {
  const pages = publishedMarkdown(docs);
  assert.ok(pages.length >= requiredPages.length,
    `expected to scan at least ${requiredPages.length} published pages, found ${pages.length}`);
  const offenders = [];
  for (const file of pages) {
    const src = readFileSync(file, 'utf8');
    for (const token of BANNED) {
      if (src.includes(token)) {
        offenders.push(`${relative(docs, file)} :: contains banned token "${token}"`);
      }
    }
  }
  assert.equal(offenders.length, 0,
    `banned jargon leaked onto published pages:\n  ${offenders.join('\n  ')}`);
});
```

> **Notes on the new tests:**
> - The jargon walker **excludes `docs/design/**`** (this runbook, UX-REVIEW, the overview all
>   contain the banned tokens by necessity — they define the list) and **`.vitepress/`**. It
>   scans `index.md`, `getting-started.md`, `governance-spine.md`, and every `sdk/`, `tutorials/`,
>   `cookbook/` page — exactly the published surface.
> - The banned list is the verbatim 00-overview §6 set. The `§` glyph catches every `§N.N`
>   section reference. `"WASM contract layer"` from §6 is a *contextual* ban (only as a
>   standalone value-prop) so it is **not** auto-grepped here — a blunt `includes` would produce
>   false positives in legitimate deep-reference prose; it stays a review-time check.
> - The existing `index.md` markers (`submitIntent`, `governance-first`, `governance-spine`) are
>   disjoint from the banned list, so the two tests never conflict.
> - Run it: `node --test docs-structure.test.mjs` — must be green before commit. If it flags a
>   real leak, **fix the copy** (replace per 00-overview §6 vocabulary), don't weaken the test.

After editing, run the fence and confirm all five tests pass:

```bash
node --test docs-structure.test.mjs
```

---

## Step 7 — Cross-browser / responsive QA matrix

Run the production preview (`npm run build && npm run preview`) and walk the matrix on each
target. Both themes, mobile + desktop widths.

| Surface | Chrome | Firefox | Safari | Edge | Mobile Safari (iOS) | Chrome Android |
|---|---|---|---|---|---|---|
| Hero + animated spine renders, pulse smooth | | | | | | |
| Reduced-motion → static spine | | | | | | |
| Walkthrough Next/Prev + announcements | | | | | | |
| TypedTerminal types / static fallback | | | | | | |
| EvmContrast two-col ↔ stacked (≤720px) | | | | | | |
| PersonaCards route correctly | | | | | | |
| EvidenceVerifier loads WASM + verifies | | | | | | |
| Term tooltips (focus + hover + Esc) | | | | | | |
| Local search opens / navigates / closes | | | | | | |
| Nav logo + favicon render; lockup crisp | | | | | | |
| OG preview correct (card validators) | n/a | n/a | n/a | n/a | n/a | n/a |
| Dark ⇄ light toggle, no flash/contrast loss | | | | | | |

Responsive breakpoints to spot-check: 360px, 414px, 720px (the contrast-grid stack point),
1024px, 1180px (`--ifx-maxw`), 1440px+. Confirm no horizontal scroll, no overlap, logo/nav
collapse correctly.

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in `00-overview.md` §9, specifically:

- **Identity:** mark + lockup SVGs exist under `theme/assets/logo/`; nav shows the logo
  (`themeConfig.logo`) + lowercase `siteTitle`; favicon (SVG + PNG + apple-touch) wired in `head`.
- **Social:** committed `docs/public/og/og-default.png` (1200×630); `og:image`/`twitter:image`
  wired with **absolute** URLs; card validates in the X/LinkedIn/Facebook inspectors.
- **A11y (00-overview §7):** the §3.6 pass/fail table is complete and every row passes (or has a
  tracked remediation); axe shows zero serious/critical issues; Lighthouse a11y ≥ 95 (target 100);
  every animation has a reduced-motion fallback; the spine exposes a correct `aria-label` + hidden
  text equivalent; `<Term>` is keyboard/SR-accessible; no bare `outline: none`.
- **Motion:** all animation is `transform`/`opacity` only, uses `var(--ifx-ease)`, pauses
  offscreen; 60fps; zero CLS.
- **Perf (00-overview §8):** landing incremental JS < 100KB gz; fonts preloaded + `swap`; WASM
  confirmed lazy; LCP < 2.0s; regressions noted + fixed.
- **Fence (00-overview §9, hardened):** `node --test docs-structure.test.mjs` passes **five**
  tests — the three original plus the new theme-files-exist and no-jargon-leak assertions; the
  existing assertions remain intact.
- **Build green:** `npm run build` clean (no new warnings); `npm run preview` renders; both
  themes legible across the §7 cross-browser matrix.
- **No jargon leak (00-overview §6):** automated + verified on every touched public page.

---

## Release / go-live checklist

Final gate before flipping the site live. Tick every box.

- [ ] `node --test docs-structure.test.mjs` — all **5** tests green (incl. new jargon + theme-file gates).
- [ ] `npm run build` clean; `npm run preview` renders both themes with no console errors.
- [ ] Lighthouse: Performance ≥ 90, **A11y ≥ 95 (target 100)**, Best-Practices/SEO ≥ 90, mobile + desktop.
- [ ] LCP < 2.0s; CLS ≈ 0; landing JS < 100KB gz; WASM confirmed not loaded until "Verify".
- [ ] §3.6 a11y pass/fail table complete — all PASS or tracked remediation.
- [ ] Cross-browser/responsive matrix (Step 7) green on Chrome/Firefox/Safari/Edge + iOS/Android.
- [ ] Logo renders in nav (both themes); favicon shows in tab + bookmark + iOS home-screen.
- [ ] OG card validated: X Card Validator, LinkedIn Post Inspector, Facebook Sharing Debugger
      (re-scraped after deploy; absolute URLs resolve; image is the 1200×630 card).
- [ ] All `head` favicon/OG URLs include the correct `base`/origin; **base-path caveat reviewed**
      (if a custom domain is planned, every absolute URL is updated in the go-live commit).
- [ ] No banned jargon on any published page (fence enforces; spot-check the hero + feature cards).
- [ ] `index.md` retains its required markers (`governance-first`, `submitIntent`, `governance-spine`).
- [ ] 404/redirect sanity: every nav/sidebar link resolves (fence covers existence; click-test once).
- [ ] Pages deploy workflow green on the merge; live URL serves the new theme + logo + OG.
- [ ] Progress ledger (00-overview §11) updated: Effort 06 checked, PR linked.
- [ ] PR description links this runbook and lists every verification above.

---

## Out of scope for this effort (so we don't gold-plate)

- Per-page build-time OG generation (documented in §2.5, intentionally not built).
- Inventing new components or copy — this effort polishes and hardens what 01–05 shipped.
- New design tokens beyond the documented light-theme-safe accent variants needed to pass
  contrast (§3.3), each added in `tokens.css` with a note per 00-overview §4.
- A registered Vue logo component for pixel-perfect theme-matched nav strokes — the `<img>` +
  green-terminus mark reads correctly on both themes and is the chosen, simpler wiring (§1.3).

---

## Closing note — the 6-effort plan is complete

With this effort landed, the full plan from `00-overview.md` is delivered end to end:

| Effort | Delivered |
|---|---|
| 01 Foundation | Brand tokens, theme scaffold, fonts, dark default, plain-English message. |
| 02 Spine visuals | The animated `<SpineDiagram>` — the brand-defining "wow." |
| 03 Interactive narrative | Walkthrough, typed terminal, EVM contrast, persona cards. |
| 04 Docs experience | Search, glossary, static docs spine, code-group tabs, fleshed pages. |
| 05 WASM verifier | `<EvidenceVerifier>` proving the offline-verifiability claim live in-browser. |
| **06 Identity & polish** | **Logo/wordmark, OG, full a11y + motion + perf audit, hardened fence.** |

The site now does what the brief and UX-REVIEW demanded: it is immediately understandable, it
states the EVM contrast out loud, it *shows* the magic trick (describe → proof → verify-it-
yourself) with a live in-browser verifier, it has a real identity, and it is accessible and fast
on every surface — locked down by a fence that fails on a silent 404, a dropped brand file, or a
single leaked piece of internal jargon. Update the 00-overview §11 ledger, land the PR, and ship.
