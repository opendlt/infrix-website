// SINGLE SOURCE OF TRUTH for the seven governance-spine stages.
// Consumed by SpineDiagram (02), SpineWalkthrough (03), the docs spine (04), and the
// verifier narrative (05). Order is load-bearing — never reorder. Colors map to the
// canonical --ifx semantic tokens (00-overview.md §4): blue = flow, amber = pending
// approval, green = verified/confirmed, violet = evidence. Anchor returns to brand blue
// because the anchor write closes the flow loop.

export interface SpineStage {
  /** Stable identifier; matches governance-spine.md and the typed pipeline objects. */
  id: 'intent' | 'plan' | 'approval' | 'execution' | 'outcome' | 'evidence' | 'anchor';
  /** Display label, Title Case. */
  label: string;
  /** A CSS color expressed as a var(--ifx-…) reference. Never a raw hex. */
  color: string;
  /** One-line, plain-English description in the public voice (no §-refs, no type names). */
  blurb: string;
}

export const SPINE_STAGES: SpineStage[] = [
  {
    id: 'intent',
    label: 'Intent',
    color: 'var(--ifx-brand)',
    blurb: 'What you want, described — in plain or typed terms.',
  },
  {
    id: 'plan',
    label: 'Plan',
    color: 'var(--ifx-brand)',
    blurb: 'Infrix compiles your intent into an ordered set of steps.',
  },
  {
    id: 'approval',
    label: 'Approval',
    color: 'var(--ifx-pending)',
    blurb: 'The right approvers sign off before anything runs — enforced, not optional.',
  },
  {
    id: 'execution',
    label: 'Execution',
    color: 'var(--ifx-verified)',
    blurb: 'Each step runs through the best-fit execution for that step.',
  },
  {
    id: 'outcome',
    label: 'Outcome',
    color: 'var(--ifx-verified)',
    blurb: 'Results are gathered into one record as finality settles.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    color: 'var(--ifx-evidence)',
    blurb: 'A portable receipt is assembled — verifiable offline, no node required.',
  },
  {
    id: 'anchor',
    label: 'Anchor',
    color: 'var(--ifx-brand)',
    blurb: 'A digest is anchored to Accumulate, sealing the outcome as final.',
  },
];

/** Single-sentence summary used for the diagram's aria-label. */
export const SPINE_ARIA_SUMMARY =
  'The Infrix governance spine: every action flows through seven enforced stages — ' +
  SPINE_STAGES.map((s) => s.label).join(', ') +
  '.';
