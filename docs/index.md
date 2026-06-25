---
layout: page
title: Infrix — describe what you want, get a proof you can trust
---

<div class="ifx-home">

<HomeHero />

<StatBand />

<TypedTerminal />

<BentoFeatures />

<SectionDivider />

<EvmContrast />

<SpineWalkthrough />

<SectionDivider />

<div class="ifx-container ifx-prose">

## For developers — one call, the whole spine

Submit a `submitIntent` and Infrix walks all seven stages for you:

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

[Read the governance-spine model →](/governance-spine) &nbsp;·&nbsp; [First-intent tutorial →](/tutorials/first-intent)

</div>

<PersonaCards />

<p class="ifx-fence-note">
  Infrix is governance-first: there is no raw-transaction path, and every outcome is a
  portable receipt you can verify offline. Read the governance-spine model to see why
  nothing bypasses it.
</p>

</div>
