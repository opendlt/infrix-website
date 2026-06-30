# Why Infrix — the same deal, two ways

Adjectives don't convince anyone. So here is **one ordinary task** — a token
escrow that releases when the buyer approves — built the usual way and the Infrix
way, with the difference you can actually run.

## The task

> Buyer deposits. Seller marks delivered. Buyer approves release. Funds release
> to the seller. (`examples/compare/escrow.json`.)

## Side by side

| | On Ethereum / a typical chain | On Infrix |
|---|---|---|
| **How you act** | Sign a raw transaction; trust validators to execute it correctly | Submit a *governed intent* — what you want, in typed terms |
| **What enforces the rules** | Whatever the contract author wrote; nothing structurally stops an unguarded path | Policy + approval are enforced by the runtime: **no path mutates state without them** |
| **Why you believe the result** | "Valid because the chain's node says so" | A **portable proof** you re-verify yourself — offline, against a server you don't trust |
| **How you audit** | Trust the RPC/explorer, or re-run an indexer over opaque calldata | Decode one evidence bundle: intent → plan → approval → outcome → evidence → anchor |
| **Who has to be honest** | The node you query | **No one** — the verdict is math you re-run |

The escrow logic is the same. What changes is **who you have to trust for the
result** — and on Infrix, the answer is *nobody*.

## See it, then verify it yourself

1. **Run it:** [the live playground](https://play.infrix.opendlt.org) runs exactly this escrow as a governed flow and shows every stage building.
2. **Verify it — against nobody's word:**

```sh
npm i @infrix/verify
```
```js
import { verifyPortablePackage } from '@infrix/verify';
import { createRequire } from 'node:module';
const proof = createRequire(import.meta.url)('@infrix/verify/portable-fixture.valid.json');
const r = await verifyPortablePackage(proof);
console.log(r.passed ? '✅ verified offline — no node trusted' : '❌ failed');
```

3. **Try to break it:** the playground's **Tamper Lab** lets you forge a field and watch verification reject it at the exact broken link. Failing to beat tamper-evidence is the fastest way to trust it.

## What Infrix does *not* claim (so you can trust what it does)

- **No TEE claim.** Confidentiality is policy + ZK / selective disclosure, not "trust our enclave."
- **Honest assurance levels.** Anonymous/offline verification caps at **L3**; **L4** means the anchor is confirmed against the live Accumulate ledger — never the Infrix node's word.
- **Testnet, not mainnet.** The public devnet anchors to the Accumulate **Kermit testnet** — real anchors, no real funds.

Candor is the point: you don't have to take any of this on faith. **Run it. Verify it. Try to forge it.**

→ [Start building](/getting-started) · [Try the playground](https://play.infrix.opendlt.org)
