# Infrix Website — Brutally Honest UI/UX Review

> **Status:** Source-of-truth design critique. Captured 2026-06-25.
> **Scope:** The full `infrix-website` surface (landing + docs).
> **Companion:** Implementation runbooks live in [`./runbooks/`](./runbooks/00-overview.md).
> This file and everything under `docs/design/` is excluded from the published
> Pages build via `srcExclude` in `docs/.vitepress/config.mts`. It is planning
> material, not a public page.

---

## The one-sentence verdict

**You don't have a website. You have stock VitePress docs with the default theme, default hero, default feature cards, zero custom CSS, no brand, no diagram, no interaction — and the copy is written for someone who already understands Infrix.** It currently fails the exact test the brief set: it is *not* immediately understandable, it does *not* answer "why is this different," and there is *nothing* that would make anyone say "wow."

The good news: Infrix has a genuinely novel, demonstrable core (a governance spine that ends in a proof you can verify offline without trusting the node). That is a *visual, interactive, "wow"-able* idea being delivered as a wall of gray text. The gap between what exists and what could exist is enormous — and almost entirely on the presentation side, not the substance.

---

## Part 1 — The five fatal problems (diagnosis)

### Problem 1: The first screen is incomprehensible to the actual audience

Current hero:

> **Infrix** — Governance-first execution fabric
> *Intents, plans, approvals, evidence, anchoring, and trust — load-bearing primitives above the WASM contract layer.*

Count the undefined terms a newcomer hits in 12 words: "governance-first," "execution fabric," "load-bearing primitives," "WASM contract layer." Four. The tagline is a *list of nouns*, not a sentence that says what this does for a human. Nobody reading this learns what Infrix is, who it's for, or why they'd care. This is jargon written by people who live inside the spec, for people who don't exist yet.

### Problem 2: Internal spec references leak into public marketing

Feature card #2, verbatim on the landing page:

> *The **§15.1 selector** picks plugins based on confidentiality, cost...*

"§15.1" is an internal spec section number. It means nothing to a visitor and signals "this project talks to itself." `DisclosureContext`, `UnifiedStepParams`, `TypeOutcomeRecord`, `GetWithActor` — these leak everywhere. Internal type names are not a value proposition.

### Problem 3: There is zero differentiation messaging where it matters

The brief explicitly demands the site answer "why is this different from EVM / another smart-contract platform." **That answer appears nowhere on the landing page.** The single most important job — the thing that earns the next 30 seconds of attention — is missing. The differentiation is implicit in the docs ("there is no raw transaction path") but never stated as a *contrast* a newcomer can grasp.

### Problem 4: The single best asset is buried

The strongest, most novel, most *demonstrable* thing Infrix does is in `getting-started.md`:

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
```

**Describe an app in plain English → get a verifiable proof → check it yourself without trusting the node.** That is the "wow." That is the demo. And it's hidden on a secondary page, rendered as a plain code block, with no visual, no animation, no "try it." The site leads with abstract nouns and buries the magic trick.

### Problem 5: A docs theme is being asked to do a marketing site's job

VitePress default home layout is fine for a library's docs. It is structurally incapable of delivering "beautiful and powerful + WoW." No hero animation, no scrollytelling, no interactive diagram, no persona routing, no narrative. The redesign is trying to win a design fight with one hand tied behind its back by the framework's defaults.

---

## Part 2 — The strategic reframe: split marketing from docs

The most important architectural decision: **stop treating this as one docs site.** There need to be two distinct experiences under one roof:

| Surface | Job | Audience mindset | Design language |
|---|---|---|---|
| **The landing / marketing site** (`/`) | Convince in 120 seconds. Answer what / why / why-different. Create the "wow." | "Should I care?" | Cinematic, animated, opinionated, high-contrast |
| **The docs** (`/docs/*`) | Get a developer productive fast. Reference-grade. | "How do I do X?" | Calm, dense, fast, searchable |

VitePress *can* do both: keep the docs in a branded default-ish theme, and build the landing as a **custom Vue layout** registered in `docs/.vitepress/theme/`. There is currently no `theme/` directory — creating it is the first concrete step.

---

## Part 3 — The message hierarchy (what must land, and when)

Design the landing around a strict attention budget. If a visitor leaves at each mark, what must they have absorbed?

**By 5 seconds (the hero, no scroll):**
> Infrix is a blockchain layer where you describe what you want in plain language, and you get back a **proof you can verify yourself** — without trusting the network.

**By 30 seconds (first scroll):**
> Unlike Ethereum/EVM, there is *no* "sign a raw transaction and hope" path. Every change is governed in code (approvals, policy, evidence) and produces a portable receipt an auditor can check offline.

**By 120 seconds (the interactive demo):**
> *They watched an intent flow through the seven-stage spine and verified the resulting proof live in their browser.* Now they want to run `infrix new`.

Everything below serves this hierarchy.

---

## Part 4 — The landing page, section by section (copy + specs)

Copy is paste-ready; treat it as a strong first draft, not gospel.

### Section 0 — Nav bar
- Left: Infrix wordmark (a logo is needed — see Part 7).
- Center: `Product` · `How it works` · `Docs` · `For Auditors` · `For Developers`
- Right: `GitHub ★` (live star count) · primary button **`Get Started`**
- Sticky, translucent with backdrop-blur, hairline bottom border that appears on scroll.

### Section 1 — Hero (full viewport)

**Headline (H1):**
> **Describe what you want. Get back a proof you can trust.**

**Subhead:**
> Infrix is a governance-first execution layer for Accumulate. Every action flows through one enforced pipeline — intent, plan, approval, execution, evidence — and ends in a portable receipt anyone can verify offline, without running a node or trusting the network.

**Primary CTA:** `Start in one command →`  **Secondary:** `See how it's different ↓`

**The hero visual — non-negotiable for "wow":** A live, looping, *animated rendering of the governance spine*. Seven nodes — **Intent → Plan → Approval → Execution → Outcome → Evidence → Anchor** — connected by a flowing line. A pulse of light travels the line on loop; as it hits each node, a small label/object materializes (Plan shows step chips, Approval shows signatures landing, Evidence shows a bundle assembling, Anchor shows a hash being written). It should feel *alive* — this single element communicates the entire product thesis pre-verbally.

> Spec: SVG + CSS/JS animation (or a lightweight `<canvas>`). Respect `prefers-reduced-motion` (render the static spine, no pulse). Lazy-init; pause when offscreen via `IntersectionObserver`. Target < 40KB, 60fps, no layout thrash.

### Section 2 — The 10-second "what is this" (plain-English card)

A single, centered, high-contrast terminal mock that *shows the magic trick* immediately:

```
$ infrix new verifiable-app my-escrow \
    "escrow that releases when two approvers sign"

  ✓ intent compiled       ✓ plan generated (4 steps)
  ✓ approvals enforced    ✓ evidence bundle written
  → proof.infrix.json ready

$ infrix verify proof.infrix.json
  ✓ verified offline — no node, no trust required
```

Caption: **"From a sentence to a verifiable app. No Solidity, no raw transactions, no 'trust me.'"**

Make this an actual typed-in animation (typewriter effect on scroll-into-view), not a static image. This is the moment a developer leans in.

### Section 3 — "Why this is different" (the EVM contrast — required)

A direct, honest, side-by-side. This is the section the brief demands and the current site completely lacks.

| On EVM / typical smart-contract chains | On Infrix |
|---|---|
| You sign a **raw transaction** and trust validators to do the right thing. | You submit an **intent** — what you want, in typed/plain terms. |
| Governance is *described* in docs and *hoped for* in practice. | Governance is **enforced in code**: there is no path that mutates state without traversing approval + policy. |
| To audit, you must trust the chain's RPC or re-run an indexer. | Every outcome ships a **portable evidence bundle** an auditor verifies **offline** — without a node. |
| Plugin/VM choice is hard-coded. | A selector picks execution per-step by confidentiality, cost, trust, and capability. |

Header copy: **"Not another EVM. Not another VM. A governance spine the contracts run *inside*."**
Sub: "The traditional contract surface still exists — `@call`, `@deploy`, storage. It just sits *beneath* the spine, not above it. You can't bypass governance, because there's no API to."

> Design: animate the two columns in on scroll. Left column muted/gray (the "old way"), right column in brand color with subtle glow (the "Infrix way"). Don't be smug about Ethereum — be precise. Precision reads as confidence.

### Section 4 — The signature interactive: "Watch an intent become a proof"

**The single highest-leverage thing to build.** A scrollytelling / step-through of the governance spine, user-driven:

1. User picks (or types) a goal: `Transfer 100 tokens from Alice to Bob`.
2. **Stage cards animate in sequence** as the user scrolls or clicks "next":
   - **Intent** — show the typed object forming.
   - **Plan** — show the 4 steps appear as chips; show the plugin selection with its *reason* ("chose settlement-plugin: lowest cost, meets confidentiality").
   - **Approval** — show separation-of-duties: the submitter's avatar greys out, a *different* approver signs. (This visually teaches a concept the docs bury in prose.)
   - **Execution** — steps light up green one by one.
   - **Outcome** — finality state ticks `provisional → locally_final → l0_anchored_final`.
   - **Evidence** — a "bundle" panel fills with trace digests, trust snapshot, plan-hash, anchor ref.
   - **Anchor** — a hash writes to "Accumulate L0."
3. **The payoff — verify it live:** a `Verify this proof` button that actually runs the offline verifier **compiled to WASM in the browser** against the generated bundle, and prints `✓ verified — chain hash 0xfeed…`. If one technical flex ships, ship this: *the verifier runs client-side, proving the offline-verifiability claim instead of asserting it.*

> Even a *mocked* version (deterministic canned data, fake-but-real-looking hashes) is worth building first. The real WASM verifier is the P1/P2 upgrade. This component alone justifies the whole redesign.

### Section 5 — Three pillars (replace current feature cards)

Keep three, but rewrite for humans and give each an icon + micro-animation:

1. **Governed by default** — "No raw-transaction backdoor. Every state change traverses intent → plan → approval → evidence. Governance you can't forget to turn on."
2. **Proof you can take with you** — "Outcomes ship a portable evidence bundle. A regulator or auditor verifies it offline — no node, no trust in us."
3. **Right execution, every step** — "A per-step selector chooses how each action runs — by confidentiality, cost, trust, and capability — instead of one hard-coded VM."

(Kill "§15.1," "WASM contract layer," "pluralistic plugin registry" from public copy.)

### Section 6 — Persona routing ("Choose your path")

Infrix has at least four very different visitors. Give them explicit doors so nobody has to read content meant for someone else:

- **I'm a developer** → `infrix new` quickstart + SDK picker (TS / Rust / AssemblyScript).
- **I'm an auditor / regulator** → the offline-verification story + evidence bundle anatomy.
- **I'm an operator / runs infra** → devnet, anchor modes, trust profiles.
- **I'm evaluating (technical decision-maker)** → the architecture / governance-spine deep dive.

> Four cards, each routing into the right docs entry. This is the cheapest, highest-impact IA improvement after the hero.

### Section 7 — Social proof / credibility strip
GitHub stars, "MIT licensed," "built on Accumulate," link to the spec/repo, security posture. If there are early users or quotes, here. If not, lead with the proof-verifiability claim as the trust anchor.

### Section 8 — Final CTA + footer
> **Ready? One command gets you a verifiable app.** `infrix new verifiable-app …`
Footer: docs, SDKs, GitHub, security advisories, license. Brand it — the current default footer is fine but unstyled.

---

## Part 5 — Docs UX upgrades (the other half of the site)

The landing earns attention; the docs keep it. Current docs problems and fixes:

1. **Jargon with no escape hatch.** Add a persistent **glossary** with hover-definitions. Every first use of `intent`, `plan`, `spine`, `evidence bundle`, `anchor`, `DisclosureContext` should be a dotted-underline term with a tooltip. Build a `<Term>` Vue component usable in markdown.
2. **The spine is described seven times in prose but never drawn.** Put the *same* spine diagram (static-friendly version) at the top of `governance-spine.md`. One diagram replaces 500 words.
3. **Code affordances.** Verify copy buttons are on. Add tabs for TS/Rust/AS where examples differ (VitePress `code-group`).
4. **Getting Started buries the lede.** The one-command golden path is correct — make it the literal first thing, in a styled "Try this now" callout, before prerequisites.
5. **Dead-end pages.** `sdk/typescript-client.md` is 26 lines and links in circles. Either flesh out with real method signatures/return types or merge. Thin reference pages erode trust faster than missing ones.
6. **Search.** Enable VitePress local search (`themeConfig.search.provider: 'local'`) at minimum; Algolia DocSearch if possible. A novel product *lives or dies* on searchability.

---

## Part 6 — Visual & brand system (the "beautiful" half)

There is currently **no brand** — default VitePress styling, Inter, system spacing.

### Concept: "Verifiable light"
The product is about proof, light passing cleanly through a pipeline, things being *checkable*. Lean into a precise, technical, slightly luminous aesthetic — "instrument panel," not "crypto-bro gradient soup."

**Color tokens (dark-first; ship both themes):**
```
--bg            #0A0E14   (near-black, cool)
--surface       #121823
--border        #1F2A3A
--text          #E6EDF3
--text-muted    #8B98A9
--brand         #4F8CFF   (signal blue — "verified/flowing")
--brand-strong  #2E6BFF
--accent        #58E6B0   (confirmation green — only for "verified ✓" states)
--warn          #F5A623   (approvals/pending)
--evidence      #B57EDC   (evidence/proof — a distinct violet)
```
Use color *semantically*: blue = flow, green = verified, violet = evidence, amber = pending approval. The animated spine then literally color-codes the concept as it runs. That is design doing teaching work.

**Typography:**
- Display/headlines: a characterful but technical grotesk — **Space Grotesk**, **General Sans**, or **Geist**. Not default Inter for headlines; that reads as "I didn't choose."
- Body: Inter or Geist Sans.
- Code/mono: **Geist Mono** or **JetBrains Mono** — lean into mono as a *brand* element (the product is a CLI + proofs; mono is on-thesis).
- Tight, confident headline tracking; generous line-height in body.

**Motion principles:**
- Purposeful, never decorative. Every animation either shows *flow* (the pulse along the spine) or *confirmation* (a ✓ landing).
- Scroll-triggered reveals (`IntersectionObserver`), staggered.
- Honor `prefers-reduced-motion` everywhere — degrade to static, never to broken.
- Easing: custom cubic-bezier, ~200–400ms; nothing bouncy/playful — this is infrastructure, it should feel *precise*.

**Logo/wordmark:** A mark built from the spine motif (seven nodes / a line that resolves into a checkmark) ties the identity together. Wordmark in the display face, lowercase `infrix` with a single accent node on the `i`.

---

## Part 7 — Accessibility (the "novel = hard" challenge, met head-on)

A novel product is hard to make frictionless. Here is how the redesign avoids trading "wow" for "usable":

- **Every animation has a static, meaningful fallback.** The spine renders fully without motion; the interactive demo works as a click-through with no reliance on scroll-jacking.
- **No scroll-hijacking.** Scrollytelling *augments* normal scroll, never traps it. Keyboard users get explicit `Next/Prev` controls on the interactive.
- **Color is never the only signal.** The semantic colors are *reinforced* with icons/labels (✓, text), so the spine reads for color-blind users.
- **Contrast:** all body text ≥ 4.5:1, large text ≥ 3:1. The dark palette is tuned for it; verify with a checker.
- **Full keyboard path** through the interactive demo and persona cards; visible focus rings (not suppressed).
- **Semantic HTML + ARIA** on custom Vue components; the spine diagram needs an `aria-label` describing the seven stages and a visually-hidden text equivalent.
- **Glossary/tooltips** must be keyboard- and screen-reader-accessible (focusable, `aria-describedby`), not hover-only.

---

## Part 8 — Performance budget

A heavy hero kills first impressions if it is slow. Hard budgets:
- LCP < 2.0s, hero interactive < 100KB JS gzipped, no CLS from the animation.
- Self-host fonts (Inter woff2 is already bundled — keep it, add the display face), `font-display: swap`.
- Lazy-load the WASM verifier (only needed when the user clicks "Verify"); show a spinner.
- Animations on `transform`/`opacity` only (GPU), never animating layout properties.
- Static-export everything (VitePress already does); the interactive hydrates as an island.

---

## Part 9 — Build/tech spec (so a dev team can execute)

1. **Create `docs/.vitepress/theme/`** — `index.ts` extending the default theme, registering global components and custom CSS (`custom.css` with the tokens above).
2. **Custom home layout:** register a `Layout` override or build a dedicated marketing page via custom components rendered from `index.md` (`layout: home` with slot overrides, or a registered custom layout name).
3. **Components to build (Vue 3 `<script setup>`):**
   - `<SpineDiagram :animated>` — the hero/landing animated spine (and a `:static` variant for docs).
   - `<SpineWalkthrough>` — the Section-4 interactive (state machine over the 7 stages; props for the demo goal).
   - `<EvidenceVerifier>` — wraps the WASM verifier; mock-first, real-second.
   - `<EvmContrast>` — the two-column differentiation block.
   - `<PersonaCards>` — Section 6 routing.
   - `<Term>` — glossary tooltip for docs.
   - `<TypedTerminal>` — the typewriter terminal mock (Section 2).
4. **WASM verifier:** compile the existing Go/Rust offline verifier (`evidence.VerifyPortablePackage`) to WASM; expose `verify(bundleJSON) → {ok, chainHash, reason}` JS binding. This is the technical centerpiece and worth real engineering time.
5. **Update `config.mts`:** enable local search, add the marketing nav, set `appearance` (dark default), wire OG/social meta + a custom OG image (the spine).
6. **Keep `docs-structure.test.mjs` fence** but extend it: assert the new components/pages exist and that no public-facing page contains banned internal tokens (`§`, `DisclosureContext`, `UnifiedStepParams`, etc.) — automate the "no jargon leak" rule.

---

## Part 10 — Prioritized roadmap

**P0 — Stops the bleeding (do first):**
1. Rewrite the hero (headline/subhead/CTA) to plain English — kill the noun-list tagline.
2. Add the **EVM-contrast section** (the required differentiation answer).
3. Rewrite the three feature cards; purge all internal spec jargon (`§15.1`, type names).
4. Elevate the one-command golden path into a styled "try this now" hero-adjacent block.
5. Apply brand tokens + display font + dark theme. Even with no new components, *looking intentional* is 60% of "wow."

**P1 — The "wow":**
6. Build the **animated `<SpineDiagram>`** hero visual.
7. Build the **`<SpineWalkthrough>`** interactive with mocked data.
8. Build `<TypedTerminal>` and `<PersonaCards>`.
9. Enable search; add the docs spine diagram + `<Term>` glossary.

**P2 — The flex + polish:**
10. Ship the **real WASM `<EvidenceVerifier>`** — verify a live proof in-browser.
11. Logo/wordmark system; custom OG images; motion polish; full a11y audit.
12. Flesh out the thin SDK pages; add code-group tabs.

---

## The bottom line

The substance is there and it is genuinely differentiated — *a governance pipeline you can't bypass, ending in a proof you can verify without trusting anyone.* That story wants to be **shown, animated, and made interactive**, and right now it is being told in gray paragraphs on a default theme. The single most important move is to **lead with the magic trick** (describe → proof → verify-it-yourself), **draw the spine instead of describing it**, and **state the EVM contrast out loud**. Do P0 and the site goes from "broken" to "credible." Do P1–P2 and it gets the "wow."
