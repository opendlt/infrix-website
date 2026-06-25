// Renders the committed brand rasters (favicons + OG card) from the SVG sources
// in docs/.vitepress/theme/assets/logo/. Run once when the brand SVGs change; the
// PNG outputs under docs/public/ are the shipped, committed artifacts (the build
// itself needs no rasterizer).
//
//   IFX_OG_FONTS=/path/to/fonts node scripts/render-assets.mjs
//
// The fonts dir must contain SpaceGrotesk.ttf and Inter.ttf (the OG card + wordmark
// render in Space Grotesk; the subhead in Inter). Get them from the Google Fonts
// repo (ofl/spacegrotesk, ofl/inter) — the same faces the site self-hosts. The
// favicons are pure shapes and need no fonts.
//
// Toolchain: @resvg/resvg-js (devDependency). PNGs are deterministic for a given
// SVG + font input.

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logo = join(root, "docs/.vitepress/theme/assets/logo");
const pub = join(root, "docs/public");

const fontsDir = process.env.IFX_OG_FONTS;
if (!fontsDir) {
  console.error("Set IFX_OG_FONTS to a dir containing SpaceGrotesk.ttf and Inter.ttf.");
  process.exit(1);
}
const fontBuffers = [
  readFileSync(join(fontsDir, "SpaceGrotesk.ttf")),
  readFileSync(join(fontsDir, "Inter.ttf")),
];

mkdirSync(join(pub, "og"), { recursive: true });
mkdirSync(join(pub, "brand"), { recursive: true });

function render(svgPath, outPath, width, withFonts) {
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: withFonts
      ? { fontBuffers, loadSystemFonts: false, defaultFontFamily: "Space Grotesk" }
      : { loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  writeFileSync(outPath, png);
  console.log(`  ${outPath.replace(root, ".")}  (${png.length} bytes)`);
}

console.log("rendering brand rasters:");
// OG social card (needs fonts for the headline/wordmark/subhead).
render(join(logo, "og-default.svg"), join(pub, "og/og-default.png"), 1200, true);
// Favicons from the brand mark (pure shapes, no fonts).
render(join(logo, "mark.svg"), join(pub, "favicon-32.png"), 32, false);
render(join(logo, "mark.svg"), join(pub, "apple-touch-icon.png"), 180, false);

// Plain copies (SVG favicon + nav logo).
copyFileSync(join(logo, "mark.svg"), join(pub, "favicon.svg"));
copyFileSync(join(logo, "mark-currentcolor.svg"), join(pub, "brand/mark.svg"));
console.log("  copied favicon.svg + brand/mark.svg");
console.log("done.");
