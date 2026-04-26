---
layout: home

hero:
  name: Infrix
  text: Governance-first execution fabric
  tagline: |
    Intents, plans, approvals, evidence, anchoring, and trust —
    load-bearing primitives above the WASM contract layer.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: The Governance Spine
      link: /governance-spine
    - theme: alt
      text: View on GitHub
      link: https://github.com/opendlt/infrix-accumen

features:
  - title: Governed by default
    details: |
      Every state-changing operation flows through the canonical
      intent → plan → approval → execution → outcome → evidence
      pipeline. There is no "raw transaction" path that bypasses
      governance.
  - title: Plural execution
    details: |
      The §15.1 selector picks plugins based on confidentiality,
      cost, capability, trust, and operator preference — not a
      hard-coded family→implementation switch.
  - title: Verifiable offline
    details: |
      Every outcome ships with a portable evidence package a
      regulator or auditor can verify without running an Infrix
      node.
---

## What Infrix is

Infrix is a **governance-first** Layer 2 fabric for Accumulate.
Smart contracts run inside a pluralistic plugin registry; every
contract call is a **plan step** inside a governance-mediated
intent.

The traditional contract surface (`@call`, `@deploy`, raw storage)
remains — but it sits beneath the spine, not above it. Most users
reach for the governance API first.

## Quick example — submit your first intent

```typescript
import { InfrixClient } from "@infrix/client";
import { Wallet } from "@infrix/wallet";

const client = new InfrixClient({ endpoint: "http://localhost:8080" });
const wallet = new Wallet({ identity: "acc://alice.acme" });

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

const plan = await intent.plan();
await wallet.approveIntent(plan.id);

const outcome = await intent.outcome();
console.log("evidence:", outcome.evidenceBundle);
```

Walk-through: [`/tutorials/first-intent`](/tutorials/first-intent).
