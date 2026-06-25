---
layout: home

hero:
  name: Infrix
  text: Describe what you want. Get back a proof you can trust.
  tagline: |
    A governance-first execution layer for Accumulate. Every action flows through one
    enforced pipeline — intent, plan, approval, execution, evidence — and ends in a
    portable receipt anyone can verify offline, without running a node or trusting the network.
  actions:
    - theme: brand
      text: Start in one command
      link: /getting-started
    - theme: alt
      text: See how it's different
      link: /governance-spine
    - theme: alt
      text: View on GitHub
      link: https://github.com/opendlt/infrix-accumen

features:
  - title: Governed by default
    details: |
      No raw-transaction backdoor. Every state change traverses
      intent → plan → approval → evidence. Governance you can't forget to turn on.
  - title: Proof you can take with you
    details: |
      Outcomes ship a portable evidence bundle. A regulator or auditor verifies it
      offline — no node, and no trust in us required.
  - title: Right execution, every step
    details: |
      Infrix picks how each action runs — by confidentiality, cost, trust, and
      capability — instead of locking you to one hard-coded virtual machine.
---

<div class="ifx-home">

## From a sentence to a verifiable app

<div class="ifx-trynow">

<span class="ifx-eyebrow">Try this now</span>

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
```

You described an app in plain English, Infrix compiled and governed it, and you verified the
proof yourself — **offline, no node, no "trust me."**

</div>

## Not another EVM. Not another VM.

A governance spine the contracts run *inside*. The traditional contract surface still
exists — `@call`, `@deploy`, storage — it just sits *beneath* the spine, not above it.
You can't bypass governance, because there's no API to.

<div class="ifx-contrast">
<div class="old">

**On EVM / typical chains**

- You sign a **raw transaction** and trust validators to do the right thing.
- Governance is *described* in docs and *hoped for* in practice.
- To audit, you trust the chain's RPC or re-run an indexer.
- Plugin / VM choice is hard-coded.

</div>
<div class="infrix">

**On Infrix**

- You submit an **intent** — what you want, in plain or typed terms.
- Governance is **enforced in code**: no path mutates state without approval + policy.
- Every outcome ships a **portable evidence bundle** you verify **offline**.
- Infrix picks the right execution per step — confidentiality, cost, trust, capability.

</div>
</div>

## How it works — the governance spine

Every state-changing operation flows through one canonical pipeline:

```
intent → plan → approval → execution → outcome → evidence → anchor
```

The shortest possible client call submits a `submitIntent` and walks the same spine:

```typescript
import { Wallet } from "@infrix/wallet";

const wallet = new Wallet({ endpoint: "http://localhost:8080", identity: "acc://alice.acme" });

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

const plan = await intent.plan();
await wallet.approveIntent(plan.id);

const outcome = await intent.outcome();
console.log("evidence:", outcome.evidenceBundle);
```

Read the full model on [the governance spine](/governance-spine), or follow the
[first-intent tutorial](/tutorials/first-intent).

</div>
