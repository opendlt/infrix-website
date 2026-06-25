// Infrix custom theme: extends the VitePress default theme with the brand token
// system, base styles, and the landing/walkthrough components.
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

import { installReveal } from "./composables/useReveal";

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

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    app.component("SpineDiagram", SpineDiagram);
    app.component("HomeHero", HomeHero);
    app.component("TypedTerminal", TypedTerminal);
    app.component("EvmContrast", EvmContrast);
    app.component("SpineWalkthrough", SpineWalkthrough);
    app.component("PersonaCards", PersonaCards);
    app.component("Term", Term);            // runbook 04 — glossary tooltip
    app.component("EvidenceVerifier", EvidenceVerifier);  // runbook 05 — live offline verifier

    // Canonical scroll-reveal wiring (owned by runbook 03). No-op under SSR.
    installReveal((cb) => {
      const prev = router.onAfterRouteChange;
      router.onAfterRouteChange = (to) => { prev?.(to); cb(); };
    });
  },
} satisfies Theme;
