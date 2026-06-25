---
layout: page
title: Infrix — describe what you want, get a proof you can trust
---

<div class="ifx-home">

<HomeHero />

<TypedTerminal />

<EvmContrast />

<SpineWalkthrough />

<div class="ifx-container ifx-prose">

## How it works — the governance spine

Every state-changing operation flows through one canonical pipeline:

```
intent → plan → approval → execution → outcome → evidence → anchor
```

The shortest client call submits a `submitIntent` and walks the same spine:

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

<PersonaCards />

<p class="ifx-fence-note">
  Infrix is governance-first: there is no raw-transaction path, and every outcome is a
  portable receipt you can verify offline. Read the governance-spine model to see why
  nothing bypasses it.
</p>

</div>
