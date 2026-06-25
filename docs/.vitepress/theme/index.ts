// Infrix custom theme: extends the VitePress default theme with the brand token
// system and base styles. Components are registered here as later runbooks add
// them (see docs/design/runbooks/).
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";

import SpineDiagram from "./components/SpineDiagram.vue";   // runbook 02

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Global components register here in runbooks 02–05.
    app.component("SpineDiagram", SpineDiagram);            // runbook 02
  },
} satisfies Theme;
