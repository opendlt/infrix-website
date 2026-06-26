// Infrix custom theme: extends the VitePress default theme with the brand token
// system, base styles, and the landing/walkthrough components.
import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";
import "./styles/effects.css";

import { installReveal } from "./composables/useReveal";
import { vTilt } from "./directives/tilt";
import AmbientBackground from "./components/AmbientBackground.vue";
import ScrollProgress from "./components/ScrollProgress.vue";
import SectionDivider from "./components/SectionDivider.vue";
import SidebarToggle from "./components/SidebarToggle.vue";

// runbook 02
import SpineDiagram from "./components/SpineDiagram.vue";
// runbook 03
import HomeHero from "./components/HomeHero.vue";
import TypedTerminal from "./components/TypedTerminal.vue";
import EvmContrast from "./components/EvmContrast.vue";
import SpineWalkthrough from "./components/SpineWalkthrough.vue";
import PersonaCards from "./components/PersonaCards.vue";
// runbook 04
import Term from "./components/Term.vue";
// runbook 05
import EvidenceVerifier from "./components/EvidenceVerifier.vue";
// jazz-up pass
import StatBand from "./components/StatBand.vue";
import BentoFeatures from "./components/BentoFeatures.vue";

export default {
  extends: DefaultTheme,
  // Inject the site-wide aurora + scroll-progress bar via the layout-top slot.
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "layout-top": () => [h(AmbientBackground), h(ScrollProgress), h(SidebarToggle)],
    }),
  enhanceApp({ app, router }) {
    app.directive("tilt", vTilt);
    app.component("AmbientBackground", AmbientBackground);
    app.component("ScrollProgress", ScrollProgress);
    app.component("SectionDivider", SectionDivider);
    app.component("SidebarToggle", SidebarToggle);
    app.component("SpineDiagram", SpineDiagram);
    app.component("HomeHero", HomeHero);
    app.component("TypedTerminal", TypedTerminal);
    app.component("EvmContrast", EvmContrast);
    app.component("SpineWalkthrough", SpineWalkthrough);
    app.component("PersonaCards", PersonaCards);
    app.component("Term", Term);            // runbook 04 — glossary tooltip
    app.component("EvidenceVerifier", EvidenceVerifier);  // runbook 05 — live offline verifier
    app.component("StatBand", StatBand);          // jazz-up — animated proof metrics
    app.component("BentoFeatures", BentoFeatures); // jazz-up — pillar bento

    // Canonical scroll-reveal wiring (owned by runbook 03). No-op under SSR.
    installReveal((cb) => {
      const prev = router.onAfterRouteChange;
      router.onAfterRouteChange = (to) => { prev?.(to); cb(); };
    });
  },
} satisfies Theme;
