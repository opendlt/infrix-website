# Infrix logo assets

Mark motif = the governance spine resolving into a checkmark (matches `<SpineDiagram>`).

- `mark.svg`              brand-colored mark; source for favicon + OG (export to PNG).
- `mark-currentcolor.svg` theme-inheriting mark; used as `themeConfig.logo` (nav).
- `lockup.svg`            horizontal lockup, live Space Grotesk wordmark + accent node.
- `og-default.svg`        1200×630 social card source (spine + wordmark + headline).

Colors are the canonical tokens (00-overview §4): line `--ifx-brand` `#4F8CFF`,
verified terminus `--ifx-verified` `#58E6B0`. Regenerate PNGs via the recipe in
`runbooks/06-identity-polish.md` §2.4 (the committed script is `scripts/render-assets.mjs`).
Do not invent new hexes.

## Rendered (committed) artifacts these produce

- `docs/public/brand/mark.svg`        — nav logo (copy of `mark-currentcolor.svg`)
- `docs/public/favicon.svg`           — copy of `mark.svg`
- `docs/public/favicon-32.png`        — 32×32 raster favicon
- `docs/public/apple-touch-icon.png`  — 180×180 iOS icon
- `docs/public/og/og-default.png`     — 1200×630 social card

The SVGs here are the editable source; the PNGs under `docs/public/` are the shipped
rasters. The wordmark/headline text in `lockup.svg` / `og-default.svg` is rendered with
Space Grotesk; `scripts/render-assets.mjs` feeds that font to the rasterizer so the PNGs
match the site.
