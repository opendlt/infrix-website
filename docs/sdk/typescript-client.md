# TypeScript Client SDK

The TypeScript client SDK lives at `sdk/typescript/` in the repo. It exposes the v4 REST + WebSocket surface that production runtimes serve.

## Install

```bash
npm install @infrix/sdk
```

## Build from source

```bash
cd sdk/typescript
npm install
npm run build
npm test
```

## What it covers

- `IntentClient` — submit governed intents through `POST /v4/intents`
- `IntentStream` — subscribe to `/v4/ws` lifecycle, narrative, and outcome streams
- `ApprovalClient` — list pending approvals and submit signed approval envelopes
- Disclosure-context headers stamped on every request so the server-side disclosure layer can evaluate `Actor` + `Purpose` + `WorkflowInstanceID`

## Wallet variant

The wallet SDK (`sdk/typescript-wallet/`) wraps the client with the canonical sponsored-call flow, key derivation helpers, and the Cinema-recorded session protocol. See the `kermit-ws-viewer` example for an end-to-end browser-side demonstration.

## Related

- [Getting Started](../getting-started.md)
- [Governance Spine](../governance-spine.md)
