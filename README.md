# Infrix Documentation Site

Vitepress-based documentation site for Infrix.

## Layout

```
website/
  package.json              ← vitepress dependency declaration
  docs/
    .vitepress/config.ts    ← site config (nav, sidebar, theme)
    index.md                ← landing page
    getting-started.md      ← zero-to-first-intent tutorial
    governance-spine.md     ← conceptual page
    sdk/                    ← per-SDK reference (TypeScript / Wallet / Rust / AS)
    tutorials/              ← runnable walk-throughs
    cookbook/               ← pattern libraries
```

## Develop locally

```bash
cd website
npm install
npm run dev    # http://localhost:5173/
```

## Build for production

```bash
npm run build  # output: docs/.vitepress/dist
npm run preview
```

## Deploy

GitHub Pages serves from `gh-pages` branch. CI rebuilds on every
push to main and force-pushes the rendered site to `gh-pages`.

## Why vitepress

- Smaller footprint than Docusaurus (~10MB node_modules vs ~200MB)
- mdx + sidebar config + algolia search built-in
- Markdown-first authoring; component overrides only when needed
