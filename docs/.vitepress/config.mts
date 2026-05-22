// G-21 phase 4 — Infrix documentation site (vitepress).
//
// The site lives under website/ and serves the governance-first
// onboarding surface: a conceptual page explaining the spine,
// per-SDK reference, runnable tutorials, and a cookbook for
// approval policies / trust profiles / offline verification.
//
// Build:   npm --prefix website run build
// Serve:   npm --prefix website run dev

import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Infrix",
  description:
    "Governance-first execution fabric for Accumulate. Intents, plans, " +
    "approvals, evidence, anchoring, and trust — load-bearing primitives " +
    "above the WASM contract layer.",
  lang: "en-US",
  base: "/",
  cleanUrls: true,
  themeConfig: {
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
