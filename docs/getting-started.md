# Getting Started

<div class="ifx-trynow">

<span class="ifx-eyebrow">Try this now</span>

Describe an app in plain English, get a verifiable proof, and check it yourself —
**offline, no node, no "trust me."**

```bash
infrix new verifiable-app my-escrow "escrow that releases when two approvers sign"
infrix verify .infrixapp/my-escrow/runs/run-1/proof.infrix.json
infrix receipt verify .infrixapp/my-escrow/runs/run-1/receipt.infrix.json
```

</div>

`infrix start` leads with this golden path (`infrix start --agent` emits it as
JSON for AI agents). The rest of this guide takes you from zero to a running
devnet that accepts your first governed <Term word="intent">intent</Term>.

## Prerequisites

- The `infrix` CLI (install below) — it bundles the local devnet, so there is nothing to clone or build.
- Node 20+ (to run the SDK examples)
- Optional: Rust toolchain (to author Rust contracts)

## Install the CLI

Prebuilt, checksum-verified binaries:

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/opendlt/infrix-cli/main/install.sh | sh
```

```powershell
# Windows
iwr -useb https://raw.githubusercontent.com/opendlt/infrix-cli/main/install.ps1 | iex
```

```bash
# Node users, no global install
npx @infrix/cli version
```

Confirm it works:

```bash
infrix version
infrix doctor
```

## Run the devnet

The CLI bundles a local devnet — no clone, no build:

```bash
infrix server
```

By default the devnet runs in `--anchor-mode=testnet` and exposes:

- HTTP REST + JSON-RPC on `:8080`
- Cinema (governance observability) on `:8081`

```
Infrix devnet running at http://localhost:8080/rpc
Anchor posture: mode=testnet endpoint=https://testnet.accumulatenetwork.io/v3
Ready to accept governed intents and contract operations.
```

For unit tests or local-only experimentation, prefer `--anchor-mode=bookkeeping` so anchors stay local.

## Submit your first intent

The shortest possible path uses the TypeScript wallet SDK:

```bash
npm install @infrix/client @infrix/wallet
```

::: code-group

```typescript [TypeScript]
import { Wallet } from "@infrix/wallet";

const wallet = new Wallet({
  endpoint: "http://localhost:8080",
  identity: "acc://alice.acme",
});

const intent = await wallet.submitIntent({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

console.log("intent submitted:", intent.id);
console.log("plan:", await intent.plan());
```

```rust [Rust]
use infrix_wallet::{Wallet, IntentRequest};
use serde_json::json;

let wallet = Wallet::connect("http://localhost:8080", "acc://alice.acme").await?;

let intent = wallet
    .submit_intent(IntentRequest {
        goal: "GOVERNED_TRANSFER".into(),
        params: json!({
            "from": "acc://alice.acme",
            "to": "acc://bob.acme",
            "amount": 100
        }),
    })
    .await?;

println!("intent submitted: {}", intent.id);
println!("plan: {:?}", intent.plan().await?);
```

```typescript [AssemblyScript]
// AssemblyScript SDK — same shape, compiled to WASM.
import { Wallet, IntentRequest } from "@infrix/assemblyscript";

const wallet = new Wallet("http://localhost:8080", "acc://alice.acme");

const intent = wallet.submitIntent(<IntentRequest>{
  goal: "GOVERNED_TRANSFER",
  params: `{"from":"acc://alice.acme","to":"acc://bob.acme","amount":100}`,
});

trace("intent submitted: " + intent.id);
```

:::

A full walkthrough lives in [`/tutorials/first-intent`](/tutorials/first-intent).

## What happens under the hood

The intent flows through the [governance spine](/governance-spine):

1. **Intent** — the wallet POSTs to `/v4/intents`.
2. **Plan** — the mediator compiles the goal into an `ExecutionPlan`.
3. **Approval** — `GOVERNED_TRANSFER` requires the sender's signature; the wallet supplies it.
4. **Execution** — the settlement plugin handles the value transfer.
5. **Outcome** — a `TypeOutcomeRecord` is written.
6. **Evidence** — the bundle is portable; export via `/v4/intents/{id}/evidence`.
7. **Anchor** — under `--anchor-mode=testnet`, a digest goes to Accumulate testnet.

## Where to go next

- Read the [Governance Spine](/governance-spine) page for the conceptual model.
- The `examples/` directory in the runtime repo ships nine end-to-end demos (start with `examples/full-spine-demo`).
- The [SDK reference](/sdk/typescript-client) covers every method on every SDK.
