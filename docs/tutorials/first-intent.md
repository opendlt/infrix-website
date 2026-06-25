# Tutorial: Your First Intent

End-to-end walkthrough from "I just installed `@infrix/client`" to "I have a verifiable evidence bundle in hand."

## What you'll build

A small TypeScript script that:

1. Submits a `GOVERNED_TRANSFER` intent.
2. Reads the compiled plan back.
3. Approves the plan with the wallet's signing key.
4. Awaits the outcome.
5. Verifies the <Term word="evidence bundle">evidence bundle</Term> offline.

## Same submission, any SDK

The full walkthrough below is TypeScript. The same `submitIntent` call exists in every SDK —
pick the one you build in:

::: code-group

```typescript [TypeScript]
import { Wallet } from "@infrix/wallet";

const wallet = new Wallet({ endpoint: "http://localhost:8080", identity: "acc://alice.acme" });

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});
```

```rust [Rust]
use infrix_wallet::{Wallet, IntentRequest};
use serde_json::json;

let wallet = Wallet::connect("http://localhost:8080", "acc://alice.acme").await?;

let intent = wallet
    .submit_intent(IntentRequest {
        goal: "GOVERNED_TRANSFER".into(),
        params: json!({ "from": "acc://alice.acme", "to": "acc://bob.acme", "amount": 100 }),
    })
    .await?;
```

```typescript [AssemblyScript]
// AssemblyScript SDK — same shape, compiled to WASM.
import { Wallet, IntentRequest } from "@infrix/assemblyscript";

const wallet = new Wallet("http://localhost:8080", "acc://alice.acme");

const intent = wallet.submitIntent(<IntentRequest>{
  goal: "GOVERNED_TRANSFER",
  params: `{"from":"acc://alice.acme","to":"acc://bob.acme","amount":100}`,
});
```

:::

## Setup

```bash
mkdir first-intent && cd first-intent
npm init -y
npm install @infrix/client @infrix/wallet
```

In a separate shell, run a devnet:

```bash
go run ./cmd/infrix server --anchor-mode=bookkeeping
```

The `bookkeeping` mode keeps anchors local — perfect for a tutorial.

## The script

Save as `first-intent.ts`:

```typescript
import { InfrixClient } from "@infrix/client";
import { Wallet } from "@infrix/wallet";
import { verifyEvidence } from "@infrix/client/evidence";

async function main() {
  const client = new InfrixClient({ endpoint: "http://localhost:8080" });
  const wallet = new Wallet({
    endpoint: "http://localhost:8080",
    identity: "acc://alice.acme",
  });

  // 1. Submit the intent.
  const intent = await wallet.submitIntent({
    goal: "GOVERNED_TRANSFER",
    params: {
      from: "acc://alice.acme",
      to: "acc://bob.acme",
      amount: 100,
    },
  });
  console.log("intent submitted:", intent.id);

  // 2. Read the compiled plan.
  const plan = await intent.plan();
  console.log("plan steps:", plan.steps.map(s => s.stepType));
  console.log("plugin selections:", plan.pluginSelections);

  // 3. Approve.
  await wallet.approveIntent(plan.id);
  console.log("plan approved");

  // 4. Await the outcome.
  const outcome = await intent.outcome();
  console.log("outcome status:", outcome.status);

  // 5. Verify evidence offline.
  const verification = verifyEvidence(outcome.evidenceBundle);
  if (!verification.ok) {
    throw new Error("evidence verification failed: " + verification.reason);
  }
  console.log("evidence verified — chain hash:", verification.chainHash);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

## Run it

```bash
npx tsx first-intent.ts
```

Expected output:

```
intent submitted: intent-abc123
plan steps: [ 'validate', 'check-policy', 'collect-approvals', 'execute-settlement' ]
plugin selections: { ... }
plan approved
outcome status: settled
evidence verified — chain hash: 0xfeed...
```

## What just happened

You exercised every stage of the [governance spine](/governance-spine):

- **`wallet.submitIntent`** routed the goal through the canonical mediator at `/v4/intents`.
- **`intent.plan()`** read back the compiled `TypeExecutionPlan` with its embedded `PluginSelections` (Reason, ConfidentialityImplications, CostImplications).
- **`wallet.approveIntent`** posted the wallet's signature to `/v4/approvals`.
- **`intent.outcome()`** polled `/v4/intents/{id}/outcome` until the plan reached terminal state.
- **`verifyEvidence`** walked the portable evidence package without needing the devnet.

## Verify the demo with `examples/full-spine-demo`

The repo's [`examples/full-spine-demo`](https://github.com/opendlt/infrix-accumen/tree/main/examples/full-spine-demo) is the Go-side counterpart of this tutorial. It exercises the same lifecycle in-process and emits a `PortableEvidencePackage` for offline verification — handy for CI.

```bash
go test ./examples/full-spine-demo -v
```

Every `logStage` call in the demo's `main.go` corresponds to a stage in the bullet list above.

## Next

- [Multi-party trade](/tutorials/multi-party-trade) — three-party atomic settlement.
- [Cross-domain bridge](/tutorials/cross-domain-bridge) — Sepolia receipt-proof verification.
- [Approval policies cookbook](/cookbook/approval-policies) — patterns for sized approvals.
