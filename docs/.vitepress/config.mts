// Infrix documentation site (vitepress).
//
// Serves the governance-first onboarding surface: a conceptual page
// explaining the spine, per-SDK reference, runnable tutorials, and a
// cookbook for approval policies / trust profiles / offline verification.
//
// Build:   npm run build
// Serve:   npm run dev
//
// `base` targets GitHub Pages project hosting at
// https://opendlt.github.io/infrix-website/. For a custom domain or an
// org-root site, set base back to "/".

import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Infrix",
  description:
    "A governance-first execution layer for Accumulate. Describe what you want, " +
    "and get back a portable receipt anyone can verify offline — no node, no " +
    "trust in the network required.",
  lang: "en-US",
  base: "/",
  cleanUrls: true,
  // Dark-first; visitors can still toggle to light.
  appearance: "dark",
  // Internal planning material (UX review + implementation runbooks) lives under
  // docs/design/ so it is version-controlled next to the site, but it must never
  // ship to the public Pages build.
  srcExclude: ["design/**"],
  head: [
    // Preload the display face for LCP. Served from docs/public/fonts/ at a
    // stable, un-hashed URL. Path includes `base`; if `base` changes
    // (custom domain → "/"), update this href too.
    [
      "link",
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        crossorigin: "",
        href: "/infrix-website/fonts/space-grotesk.woff2",
      },
    ],
    [
      "meta",
      {
        property: "og:title",
        content: "Infrix — describe what you want, get a proof you can trust",
      },
    ],
    [
      "meta",
      {
        property: "og:description",
        content:
          "A governance-first execution layer for Accumulate. Every action ends in " +
          "a portable receipt anyone can verify offline.",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    // Social card image — scrapers require ABSOLUTE URLs (origin + base baked in).
    // If a custom domain is adopted, update these absolute URLs in the same commit.
    [
      "meta",
      {
        property: "og:image",
        content: "https://opendlt.github.io/infrix-website/og/og-default.png",
      },
    ],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { property: "og:url", content: "https://opendlt.github.io/infrix-website/" }],
    ["meta", { property: "og:type", content: "website" }],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://opendlt.github.io/infrix-website/og/og-default.png",
      },
    ],
    // Favicons. Raw head URLs are NOT base-prefixed by VitePress — they include
    // `base` verbatim; update if `base` changes.
    ["link", { rel: "icon", type: "image/svg+xml", href: "/infrix-website/favicon.svg" }],
    [
      "link",
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/infrix-website/favicon-32.png" },
    ],
    [
      "link",
      { rel: "apple-touch-icon", sizes: "180x180", href: "/infrix-website/apple-touch-icon.png" },
    ],
    // No-JS fallback: scroll-reveal content is opacity:0 until the IntersectionObserver
    // adds .is-in (runbook 03). With JS disabled that observer never runs, so reveal
    // everything immediately. (Reduced-motion users are already covered by CSS.)
    [
      "noscript",
      {},
      "<style>.ifx-reveal{opacity:1 !important;transform:none !important}</style>",
    ],
  ],
  themeConfig: {
    // Brand: the spine→checkmark mark in the nav, lowercase wordmark beside it.
    // `logo` is a public path — VitePress prepends `base` automatically (do NOT
    // hardcode /infrix-website/ here, unlike the raw `head` URLs above).
    logo: "/brand/mark.svg",
    siteTitle: "infrix",
    // Offline, client-side full-text search (MiniSearch). Ships with the static
    // build — no external service, no API key, works with the Pages deploy as-is.
    // Future upgrade: Algolia DocSearch (provider: "algolia") once the site is
    // crawlable and an index is provisioned.
    search: {
      provider: "local",
      options: {
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
    // `collapsed: false` makes each group collapsible (expanded by default) with
    // VitePress's built-in animated caret + height transition (polished further in
    // effects.css). "Start Here" stays open; the longer groups can fold away.
    sidebar: [
      {
        text: "Start Here",
        collapsed: false,
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "The Governance Spine", link: "/governance-spine" },
        ],
      },
      {
        text: "SDKs",
        collapsed: false,
        items: [
          { text: "TypeScript Client", link: "/sdk/typescript-client" },
          { text: "TypeScript Wallet", link: "/sdk/typescript-wallet" },
          { text: "Rust", link: "/sdk/rust" },
          { text: "AssemblyScript", link: "/sdk/assemblyscript" },
        ],
      },
      {
        text: "Tutorials",
        collapsed: false,
        items: [
          { text: "First Intent", link: "/tutorials/first-intent" },
          { text: "Multi-Party Trade", link: "/tutorials/multi-party-trade" },
          { text: "Cross-Domain Bridge", link: "/tutorials/cross-domain-bridge" },
        ],
      },
      {
        text: "Cookbook",
        collapsed: false,
        items: [
          { text: "Approval Policies", link: "/cookbook/approval-policies" },
          { text: "Trust Profiles", link: "/cookbook/trust-profiles" },
          { text: "Offline Verification", link: "/cookbook/offline-verification" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/opendlt" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "© 2024 The Infrix Authors",
    },
  },
});
