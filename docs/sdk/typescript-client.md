# TypeScript Client SDK

`@infrix/client` exposes the v4 REST + WebSocket surface that production Infrix runtimes serve.

## Install

```bash
npm install @infrix/client
```

## What it covers

- `IntentClient` — submit governed intents through `POST /v4/intents`
- `IntentStream` — subscribe to `/v4/ws` lifecycle, narrative, and outcome streams
- `ApprovalClient` — list pending approvals and submit signed approval envelopes
- Disclosure-context headers stamped on every request so the server-side disclosure layer can evaluate `Actor` + `Purpose` + `WorkflowInstanceID`

## Wallet variant

`@infrix/wallet` wraps the client with the canonical sponsored-call flow, key-derivation helpers, and the Cinema-recorded session protocol. See [TypeScript Wallet](./typescript-wallet.md).

## Related

- [TypeScript Wallet](./typescript-wallet.md)
- [Getting Started](../getting-started.md)
- [Governance Spine](../governance-spine.md)
