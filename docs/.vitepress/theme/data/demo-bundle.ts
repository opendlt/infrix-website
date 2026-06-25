// Canned, deterministic demo data for <SpineWalkthrough>. Fake-but-realistic:
// field names mirror the real governance spine (see docs/governance-spine.md and
// docs/tutorials/first-intent.md) so the interactive teaches the true model, but
// no value here comes from a live node. Hashes are fixed literals — never random —
// so the walkthrough is stable across reloads and SSR-safe.
//
// Keyed by SpineStage.id so <SpineWalkthrough> can index each stage's payload
// directly from SPINE_STAGES order.

export interface DemoPluginSelection {
  plugin: string;
  reason: string;                    // PluginSelection.Reason (public voice)
  confidentiality: string;           // ConfidentialityImplications, glossed
  cost: string;                      // CostImplications, glossed
}

export interface DemoPlanStep {
  id: string;
  label: string;                     // plain-English step name
  stepType: string;                  // canonical PlanStepType, shown as a code chip
  selection?: DemoPluginSelection;   // only the dispatched step carries a selection
}

export interface DemoApprover {
  id: string;                        // acc:// identity
  name: string;
  role: 'submitter' | 'approver';
  state: 'submitted' | 'signed' | 'blocked';
}

export type DemoFinality = 'provisional' | 'locally_final' | 'l0_anchored_final';

export interface DemoBundle {
  intent: {
    id: string;
    goal: string;                    // IntentGoalType (e.g. GOVERNED_TRANSFER)
    summary: string;                 // plain-English restatement
    params: Record<string, string | number>;
  };
  plan: {
    id: string;
    planHash: string;
    steps: DemoPlanStep[];
  };
  approval: {
    requirement: string;             // PlanApprovalReq, in plain words
    approvers: DemoApprover[];
    separationNote: string;          // why submitter ≠ approver, for the SR text
  };
  execution: {
    // step id -> the finality the run reached when that step turned green
    greenedAt: Record<string, DemoFinality>;
  };
  outcome: {
    status: string;                  // settled
    finalitySequence: DemoFinality[];// provisional -> locally_final -> l0_anchored_final
  };
  evidence: {
    // the portable receipt panel (UX §4 "Evidence")
    rows: { label: string; value: string; token: 'evidence' | 'brand' | 'verified' }[];
  };
  anchor: {
    chainHash: string;               // the digest written to Accumulate L0
    network: string;
    height: number;
  };
}

export const DEMO_BUNDLE: DemoBundle = {
  intent: {
    id: 'intent-7f3a9c',
    goal: 'GOVERNED_TRANSFER',
    summary: 'Transfer 100 tokens from Alice to Bob.',
    params: {
      from: 'acc://alice.acme',
      to: 'acc://bob.acme',
      amount: 100,
    },
  },

  plan: {
    id: 'plan-7f3a9c-01',
    planHash: '0x9b41…c0de',
    steps: [
      { id: 's1', label: 'Validate parameters', stepType: 'PlanStepValidate' },
      { id: 's2', label: 'Check policy',         stepType: 'PlanStepPolicyCheck' },
      { id: 's3', label: 'Collect approvals',    stepType: 'PlanStepApproval' },
      {
        id: 's4',
        label: 'Settle the transfer',
        stepType: 'PlanStepSettlement',
        selection: {
          plugin: 'settlement-plugin',
          // Public-voice gloss of PluginSelection.Reason — Infrix picks the right
          // execution for each step (00-overview §6 replacement vocabulary).
          reason: 'Lowest cost that still meets the confidentiality the transfer needs.',
          confidentiality: 'Keeps balances private to the two parties.',
          cost: 'Cheapest of the eligible settlement paths.',
        },
      },
    ],
  },

  approval: {
    requirement: 'One approver, who must be different from whoever submitted.',
    approvers: [
      { id: 'acc://alice.acme', name: 'Alice',  role: 'submitter', state: 'submitted' },
      { id: 'acc://carol.acme', name: 'Carol',  role: 'approver',  state: 'signed' },
    ],
    separationNote:
      'Separation of duties: Alice submitted the intent, so Alice cannot also approve it. ' +
      'A different actor — Carol — signs. The submitter is shown greyed out.',
  },

  execution: {
    greenedAt: {
      s1: 'provisional',
      s2: 'provisional',
      s3: 'provisional',
      s4: 'locally_final',
    },
  },

  outcome: {
    status: 'settled',
    finalitySequence: ['provisional', 'locally_final', 'l0_anchored_final'],
  },

  evidence: {
    // The portable receipt — "a receipt you can verify offline" (00-overview §6).
    rows: [
      { label: 'Plan hash',        value: '0x9b41…c0de', token: 'brand'    },
      { label: 'Trace digest',     value: '0x3d77…a1f0', token: 'evidence' },
      { label: 'Trust snapshot',   value: '0xb20e…7744', token: 'evidence' },
      { label: 'Approval proof',   value: 'Carol · 1 of 1', token: 'verified' },
      { label: 'Anchor reference', value: '0xfeed…b0ba', token: 'brand'    },
    ],
  },

  anchor: {
    chainHash: '0xfeed…b0ba',
    network: 'Accumulate L0',
    height: 482913,
  },
};
