# Effort 06 — Accessibility / Motion / Performance Audit Record

> Captured during runbook 06 execution. This file is under `docs/design/` and is
> **excluded from the published build** (`srcExclude`). It records what was verified
> mechanically (headless, in this environment) vs. what **requires a human with a
> browser / AT** and therefore is *not* claimed as PASS here.
>
> **Honesty rule:** rows that can only be confirmed by running axe DevTools,
> Lighthouse, a screen reader, or real browsers are marked **NEEDS-HUMAN**, not PASS.
> Everything marked PASS was verified by a command whose output is reproducible.

---

## A. Mechanically verified — PASS (reproducible in CI / headless)

| Check | Method | Result |
|---|---|---|
| **Contrast — dark theme**, all 7 semantic pairings | WCAG ratio computed from token hexes | PASS (5.91–16.37:1; all ≥ their 3:1/4.5:1 floor) |
| **Contrast — light theme**, all 7 pairings | same, after adding light-theme accent variants | PASS (5.27–18.08:1) — `verified`/`pending`/`evidence`/brand-button were FAIL on the dark canonical, fixed via `:root:not(.dark)` darkened variants |
| **No bare `outline:none`** without a `:focus-visible` replacement | grep theme styles+components | PASS — only hit is `Term.vue` `.ifx-term__label`, paired with `.ifx-term:focus-visible` ring + the new global focus-visible default |
| **Global focus-visible default** ships | grep built CSS | PASS (`:where(a,button,[tabindex]…):focus-visible` brand ring in `base.css`, present in dist) |
| **Reduced-motion coverage** on every animated component | grep `prefers-reduced-motion` across components | PASS — all components guard it except `EvmContrast.vue`, whose only motion is the global `.ifx-reveal` utility (guarded in `utilities.css`) |
| **GPU-only animation** (no width/height/top/left/margin animated) | grep transitions/keyframes | PASS — only `transform`/`opacity` animated; all `@keyframes` (`ifx-spin`, `ifx-pulse-travel`, `ifx-node-pop`, `ifx-label-in`, `ifx-blink`) use transform/opacity only |
| **Consistent easing** (`--ifx-ease`) | grep for raw cubic-bezier/ease | PASS — all use `var(--ifx-ease)`; the one "ease" hit is `var(--ifx-ease, ease)`'s fallback |
| **Offscreen pause** of the looping spine | code review (`SpineDiagram` `IntersectionObserver`, effort 02) | PASS — animation `animation-play-state: paused` until `.is-playing` toggled by observer |
| **Verifier lazy-loaded** (not in landing bundle) | dist chunk inspection (effort 05) | PASS — `portableVerifier.*`/`verifier.*` are separate async chunks; **no `.wasm` in dist** |
| **Landing JS budget** < 100KB gz | gzip sum of framework+theme+app+index chunks | PASS — **71.2 KB** gzipped |
| **Font preload matches emitted `@font-face` URL** | dist grep (effort 01) | PASS — both `/infrix-website/fonts/space-grotesk.woff2`; `font-display: swap` on all faces |
| **No-JS reveal fallback** | dist HTML grep | PASS — `<noscript><style>.ifx-reveal{opacity:1…}</style></noscript>` present (Effort-03 handoff resolved) |
| **Brand wired** (nav logo, wordmark, favicons, OG image) | dist HTML grep | PASS — logo `img` `/brand/mark.svg`, `siteTitle` infrix, svg+png+apple-touch favicons, absolute `og:image` |
| **Brand assets shipped** | dist file check | PASS — favicon.svg, favicon-32.png, apple-touch-icon.png, og/og-default.png, brand/mark.svg |
| **OG card renders correctly** (real glyphs, spine motif) | visual inspection of the rendered PNG | PASS — wordmark + headline in Space Grotesk, spine→checkmark, no tofu |
| **Hardened fence** (5 tests incl. theme-files + no-jargon) | `node --test docs-structure.test.mjs` | PASS — 5/5 |
| **No banned jargon on published pages** | fence two-tier prose/code grep | PASS — `§`/marketing phrases banned everywhere; API type names allowed only in code (where they all are) |

### Light-theme accent variants added (with computed ratios on `#FFFFFF`)

| Token | Dark (canonical) | Light variant | Light ratio | Was |
|---|---|---|---|---|
| `--ifx-brand` | `#4F8CFF` | `#2057E0` | 5.79:1 (and white-on-brand 5.79:1) | 3.11:1 button label FAIL |
| `--ifx-brand-strong` | `#2E6BFF` | `#1D4FCC` | (hover, deeper) | — |
| `--ifx-verified` | `#58E6B0` | `#0E7A52` | 5.35:1 | 1.57:1 FAIL |
| `--ifx-pending` | `#F5A623` | `#A35200` | 5.58:1 | 2.03:1 FAIL |
| `--ifx-evidence` | `#B57EDC` | `#7E4FB8` | 5.68:1 | 3.01:1 marginal |

---

## B. §3.6 surface table — mechanical columns filled; SR/axe = NEEDS-HUMAN

Legend: **P** = mechanically verified pass · **H** = needs human/browser/AT.

| # | Surface | Contrast | Focus ring | Reduced-motion | Keyboard (code-level) | axe | Screen reader |
|---|---|---|---|---|---|---|---|
| 1 | Landing hero (`HomeHero`) | P | P | P | P (real `<a>` CTAs, focus ring) | H | H |
| 2 | `SpineDiagram` (animated) | P | n/a (decorative, `aria-hidden` in hero) | P | P (no tab trap) | H | H (sr-only list authored) |
| 3 | `SpineDiagram` (docs static) | P | n/a | P | n/a | H | H (`role=img`+aria-label authored) |
| 4 | `SpineWalkthrough` | P | P | P | P (tablist, Next/Prev, arrows, aria-live; no scroll-jack) | H | H |
| 5 | `TypedTerminal` | P | n/a | P | P (full text in DOM) | H | H |
| 6 | `EvmContrast` | P | n/a | P (global reveal) | n/a | H | H (✓/· icons, not color-only) |
| 7 | `PersonaCards` | P | P | P | P (real `<a>`, withBase) | H | H |
| 8 | `EvidenceVerifier` | P | P | P | P (native button, aria-busy, role=status) | H | H |
| 9 | `Term` tooltips | P | P | P | P (tabindex 0, focus+hover+Esc, aria-describedby) | H | H |
| 10 | Local search | P | P (VitePress) | n/a | P (VitePress built-in) | H | H |
| 11 | Code-group tabs | P | P (VitePress) | n/a | P (VitePress built-in) | H | H |
| 12 | Nav + logo + footer | P | P | n/a | P | H | H |
| 13 | Docs body (governance-spine) | P | P | P | P | H | H |

---

## C. NEEDS-HUMAN — cannot be run in this headless environment (NOT claimed PASS)

These are required by runbook 06 but require a real browser / assistive tech / network.
They are **open** until a human runs them; the code was built to satisfy them and the
mechanical proxies above all pass, but the runbook's go-live checklist owns final sign-off.

1. **axe DevTools** scan on `/`, `/governance-spine`, `/getting-started`, an SDK page, both
   themes — target zero serious/critical.
2. **Lighthouse** a11y score (target 100, ≥95) and Performance (≥90), mobile+desktop, against
   `npm run preview`.
3. **LCP < 2.0s** and **CLS ≈ 0** live measurement (Performance panel / Lighthouse). Mechanical
   proxies: text LCP element, preloaded display font, transform/opacity-only animation.
4. **60fps** of the spine pulse + reveals under the Performance panel; confirm rAF work stops
   when the spine scrolls offscreen.
5. **Screen-reader pass** (NVDA / VoiceOver): spine `aria-label` reads the seven stages; each
   walkthrough stage advance is announced; the verify result is announced.
6. **Keyboard-only walkthrough** end-to-end with a real browser (visible focus at every stop).
7. **Cross-browser / responsive matrix** (Chrome/Firefox/Safari/Edge + iOS/Android; 360–1440px).
8. **OG card validators** — X Card Validator, LinkedIn Post Inspector, Facebook Sharing
   Debugger — after the site is deployed (absolute URLs must resolve to the live origin).

> The absolute OG/favicon URLs bake in `https://opendlt.github.io/infrix-website/`. If a
> custom domain is adopted, update every absolute URL in `config.mts` `head` in the go-live
> commit (base-path caveat, runbook 06 §1.4/§2.3).
