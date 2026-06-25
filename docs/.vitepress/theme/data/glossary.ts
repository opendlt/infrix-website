// Glossary source of truth for the <Term> tooltip.
// Voice rules: plain English, no spec-section (§) refs, no internal type names,
// no banned-jargon (see 00-overview.md §6). Keep each definition to ~1–2 sentences.

export interface GlossaryEntry {
  /** Human-readable display term (what shows if <Term> has no slot text). */
  term: string;
  /** Plain-English definition shown in the tooltip. */
  definition: string;
}

// Keys are lowercased, space-collapsed lookup ids. Use the `id`/`word` prop or
// slot text; both are normalized to a key before lookup (see Term.vue).
export const GLOSSARY: Record<string, GlossaryEntry> = {
  intent: {
    term: "intent",
    definition:
      "What you want, described — in plain or typed terms. You submit an intent instead of " +
      "signing a raw transaction, and Infrix works out how to carry it out.",
  },
  plan: {
    term: "plan",
    definition:
      "The ordered set of steps Infrix compiles from your intent. It records what will run, " +
      "in what order, and which approvals each step needs before anything executes.",
  },
  "governance spine": {
    term: "governance spine",
    definition:
      "One enforced pipeline every change must travel: intent → plan → approval → execution → " +
      "outcome → evidence → anchor. There is no path that mutates state without traversing it.",
  },
  approval: {
    term: "approval",
    definition:
      "A signed go-ahead from the actors a step requires. Until the needed approvals land, the " +
      "step does not run — governance is enforced, not just described.",
  },
  "separation of duties": {
    term: "separation of duties",
    definition:
      "A safeguard where the person who requests an action cannot be the person who approves it. " +
      "Infrix enforces this in code, so a single party can't push a change through alone.",
  },
  execution: {
    term: "execution",
    definition:
      "The step where an approved plan actually runs. Infrix picks the right way to run each step — " +
      "by confidentiality, cost, trust, and capability — instead of one fixed engine.",
  },
  outcome: {
    term: "outcome",
    definition:
      "The recorded result of running the plan: what happened, its finality state, and the policy " +
      "decisions made along the way.",
  },
  "evidence bundle": {
    term: "evidence bundle",
    definition:
      "A portable receipt you can verify offline. It packages the proof of what ran so a regulator " +
      "or auditor can check it without running a node or trusting the network.",
  },
  anchor: {
    term: "anchor",
    definition:
      "A compact digest of the outcome and its evidence written to Accumulate, which moves a result " +
      "from provisional to final. The anchor is what lets anyone confirm the result later.",
  },
  finality: {
    term: "finality",
    definition:
      "How settled a result is. A result moves from provisional, to locally final, to anchored-final " +
      "as its anchor is confirmed — at which point it can no longer change.",
  },
};

/** Normalize any prop/slot value to a glossary key: trimmed, lowercased, single-spaced. */
export function glossaryKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
