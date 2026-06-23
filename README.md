# Infrix Documentation Site

VitePress-based documentation site for [Infrix](https://github.com/opendlt/infrix-accumen)
— the governance-first execution fabric for Accumulate.

## Layout

```
infrix-website/
  package.json              ← vitepress dependency declaration
  package-lock.json         ← committed; `npm ci` reproduces the build
  docs-structure.test.mjs   ← fence: every nav/sidebar page must exist + governance framing
  docs/
    .vitepress/config.mts   ← site config (nav, sidebar, theme, Pages base)
    index.md                ← landing page
    getting-started.md      ← zero-to-first-intent tutorial
    governance-spine.md     ← conceptual page
    sdk/                    ← per-SDK reference (TypeScript client / wallet / Rust / AssemblyScript)
    tutorials/              ← first-intent, multi-party-trade, cross-domain-bridge
    cookbook/               ← approval-policies, trust-profiles, offline-verification
  .github/workflows/pages.yml  ← build + deploy to GitHub Pages
```

## Develop locally

```bash
npm install
npm run dev      # http://localhost:5173/infrix-website/
```

## Build for production

```bash
npm run build    # output: docs/.vitepress/dist
npm run preview
```

## Test (docs-structure fence)

```bash
node --test docs-structure.test.mjs
```

## Deploy

Pushes to `main` trigger `.github/workflows/pages.yml`, which runs the fence,
builds the static site, and deploys it to **GitHub Pages** via the official
Pages actions. Enable it once under **Settings → Pages → Source: GitHub Actions**.

The site is served at `https://opendlt.github.io/infrix-website/`, so
`docs/.vitepress/config.mts` sets `base: "/infrix-website/"`. For a custom domain
or org-root site, set `base` back to `"/"`.

## Security

The VitePress dev-server dependency chain carries accepted advisories that do not
affect the static production build — see [SECURITY-ADVISORIES.md](./SECURITY-ADVISORIES.md).

## Why VitePress

- Smaller footprint than Docusaurus
- Markdown-first authoring; sidebar/nav config; component overrides only when needed
