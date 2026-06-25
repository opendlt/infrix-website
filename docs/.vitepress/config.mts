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
  base: "/infrix-website/",
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
  ],
  themeConfig: {
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
    sidebar: [
      {
        text: "Start Here",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "The Governance Spine", link: "/governance-spine" },
        ],
      },
      {
        text: "SDKs",
        items: [
          { text: "TypeScript Client", link: "/sdk/typescript-client" },
          { text: "TypeScript Wallet", link: "/sdk/typescript-wallet" },
          { text: "Rust", link: "/sdk/rust" },
          { text: "AssemblyScript", link: "/sdk/assemblyscript" },
        ],
      },
      {
        text: "Tutorials",
        items: [
          { text: "First Intent", link: "/tutorials/first-intent" },
          { text: "Multi-Party Trade", link: "/tutorials/multi-party-trade" },
          { text: "Cross-Domain Bridge", link: "/tutorials/cross-domain-bridge" },
        ],
      },
      {
        text: "Cookbook",
        items: [
          { text: "Approval Policies", link: "/cookbook/approval-policies" },
          { text: "Trust Profiles", link: "/cookbook/trust-profiles" },
          { text: "Offline Verification", link: "/cookbook/offline-verification" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/opendlt/infrix-accumen" },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "© 2024 The Infrix Authors",
    },
  },
});
