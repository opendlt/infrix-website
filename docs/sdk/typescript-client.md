# TypeScript Client SDK

`@infrix/client` is the low-level TypeScript binding for the **v4 REST + WebSocket** surface
that production Infrix runtimes serve. It speaks the wire protocol directly: you submit a
governed <Term word="intent">intent</Term>, read back the compiled <Term word="plan">plan</Term>,
stream lifecycle events, and submit signed <Term word="approval">approvals</Term>. For the
higher-level wallet flow (key management, signing, sponsored calls) use
[`@infrix/wallet`](./typescript-wallet.md), which is built on this client.

## Install

```bash
npm install @infrix/client
```

## Quick start

```typescript
import { InfrixClient } from "@infrix/client";

const client = new InfrixClient({ endpoint: "http://localhost:8080" });

const intent = await client.intents.submit({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
  actor: "acc://alice.acme",
});

const plan = await client.intents.plan(intent.id);
const outcome = await client.intents.awaitOutcome(intent.id);
```

> The client does **not** sign. It carries an already-signed approval envelope to the server;
> producing that envelope is the wallet's job. Use `@infrix/wallet` if you want signing handled
> for you.

## `InfrixClient`

The entry point. Construct it once and reuse it; it holds the endpoint and the disclosure
context stamped onto every request.

```typescript
interface InfrixClientOptions {
  /** Base URL of the runtime, e.g. "http://localhost:8080". No trailing slash required. */
  endpoint: string;
  /** Optional default disclosure context applied to every request (overridable per call). */
  disclosure?: DisclosureContext;
  /** Optional fetch override (custom agent, auth proxy, test double). */
  fetch?: typeof fetch;
}

interface DisclosureContext {
  actor: string;            // "acc://alice.acme"
  purpose?: string;         // e.g. "settlement", "audit"
  workflowInstanceId?: string;
}

class InfrixClient {
  constructor(options: InfrixClientOptions);
  readonly intents: IntentClient;
  readonly approvals: ApprovalClient;
  /** Open a live event stream (see IntentStream). */
  stream(filter?: StreamFilter): IntentStream;
}
```

Every request stamps `Actor`, `Purpose`, and `WorkflowInstanceID` headers from the disclosure
context so the runtime's disclosure layer can evaluate what each caller is allowed to see.

## `IntentClient` — submit & read intents

Reached via `client.intents`. Wraps `POST /v4/intents` and the per-intent read endpoints.

```typescript
interface SubmitIntentRequest {
  /** Canonical goal type, e.g. "GOVERNED_TRANSFER", "CONTRACT_CALL", "DEPLOY". */
  goal: string;
  /** Goal-specific typed parameters. Shape depends on `goal`. */
  params: Record<string, unknown>;
  /** Submitting actor. Defaults to the client's disclosure actor if omitted. */
  actor?: string;
  /** Optional idempotency key; a repeat submit with the same key returns the first intent. */
  idempotencyKey?: string;
}

interface Intent {
  id: string;                 // "intent-abc123"
  goal: string;
  status: IntentStatus;       // see below
  submittedAt: string;        // ISO-8601
}

type IntentStatus =
  | "submitted"     // accepted, plan compiling
  | "planned"       // plan ready, awaiting approvals
  | "approved"      // all required approvals in
  | "executing"
  | "settled"       // terminal success
  | "rejected"      // terminal failure (policy / approval / execution)
  ;

class IntentClient {
  /** POST /v4/intents — submit a governed intent. Resolves once accepted (status "submitted"). */
  submit(req: SubmitIntentRequest): Promise<Intent>;

  /** GET /v4/intents/{id} — current intent record. */
  get(id: string): Promise<Intent>;

  /** GET /v4/intents/{id}/plan — the compiled ExecutionPlan (see ExecutionPlan below). */
  plan(id: string): Promise<ExecutionPlan>;

  /** GET /v4/intents/{id}/outcome — resolves once the intent reaches a terminal state.
   *  Polls (or long-polls) until settled/rejected; rejects on terminal failure. */
  awaitOutcome(id: string): Promise<Outcome>;

  /** GET /v4/intents/{id}/evidence — the portable evidence bundle for offline verification. */
  evidence(id: string): Promise<EvidenceBundle>;
}
```

### `ExecutionPlan` shape

```typescript
interface ExecutionPlan {
  id: string;               // plan id; approvals bind to this (re-compile invalidates them)
  intentId: string;
  steps: PlanStep[];
  approvalsRequired: ApprovalRequirement[];
}

interface PlanStep {
  stepType: string;         // "validate" | "check-policy" | "collect-approvals" | "execute-settlement" | ...
  /** Which plugin was chosen for this step and why — confidentiality/cost/trust rationale. */
  selection?: {
    plugin: string;
    reason: string;
    confidentialityImplications?: string;
    costImplications?: string;
  };
}

interface ApprovalRequirement {
  stepType: string;
  /** Actors whose signatures satisfy this requirement. */
  approvers: string[];
  /** Number of distinct approvers required (threshold). */
  threshold: number;
}
```

### `Outcome` shape

```typescript
interface Outcome {
  intentId: string;
  status: IntentStatus;             // "settled" | "rejected"
  finality: FinalityState;
  evidenceBundle: EvidenceBundle;   // the portable receipt
  gasUsed?: number;
}

type FinalityState = "provisional" | "locally_final" | "l0_anchored_final";
```

## `IntentStream` — live lifecycle events

Reached via `client.stream(...)`. Wraps the `/v4/ws` WebSocket and emits each spine transition
as it happens — handy for UIs that visualize the pipeline instead of polling.

```typescript
interface StreamFilter {
  /** Restrict to one intent; omit to receive all the actor is permitted to see. */
  intentId?: string;
  /** Event channels to subscribe to. Defaults to ["lifecycle"]. */
  channels?: Array<"lifecycle" | "narrative" | "outcome">;
}

interface IntentEvent {
  intentId: string;
  /** The spine stage this event reports. */
  stage: "intent" | "plan" | "approval" | "execution" | "outcome" | "evidence" | "anchor";
  status: IntentStatus;
  finality?: FinalityState;
  at: string;               // ISO-8601
  detail?: Record<string, unknown>;
}

class IntentStream {
  /** Subscribe to events. Returns an unsubscribe function. */
  on(handler: (event: IntentEvent) => void): () => void;
  /** Async-iterator form: `for await (const ev of stream) { ... }`. */
  [Symbol.asyncIterator](): AsyncIterator<IntentEvent>;
  /** Close the underlying socket. */
  close(): void;
}
```

```typescript
const stream = client.stream({ intentId: intent.id, channels: ["lifecycle", "outcome"] });
const off = stream.on((ev) => {
  console.log(`${ev.stage}: ${ev.status}`);
  if (ev.stage === "anchor") off();   // done once anchored
});
```

## `ApprovalClient` — list & submit approvals

Reached via `client.approvals`. Wraps `GET /v4/approvals` and `POST /v4/approvals`. The client
**carries** a signed approval envelope; it does not produce the signature (that is the wallet).

```typescript
interface PendingApproval {
  intentId: string;
  planId: string;           // approval binds to this plan hash; re-compile invalidates it
  stepType: string;
  requiredApprovers: string[];
  threshold: number;
  /** Actors who have already approved. */
  receivedFrom: string[];
}

interface ApprovalEnvelope {
  intentId: string;
  planId: string;
  approver: string;         // "acc://carol.acme" — must differ from submitter (separation of duties)
  signature: string;        // produced by @infrix/wallet
}

interface ApprovalResult {
  intentId: string;
  planId: string;
  /** True once the threshold is met and the step is unblocked. */
  satisfied: boolean;
  receivedFrom: string[];
}

class ApprovalClient {
  /** GET /v4/approvals — approvals awaiting the given actor (or all visible if omitted). */
  pending(actor?: string): Promise<PendingApproval[]>;

  /** POST /v4/approvals — submit one signed approval envelope. */
  submit(envelope: ApprovalEnvelope): Promise<ApprovalResult>;
}
```

> **<Term word="separation of duties">Separation of duties</Term> is enforced server-side.**
> Submitting an `ApprovalEnvelope` whose `approver` equals the intent's submitter is rejected —
> the actor that requests a change cannot be the actor that approves it. See
> [Approval Policies](../cookbook/approval-policies.md).

## End-to-end with the client only

```typescript
import { InfrixClient } from "@infrix/client";

const client = new InfrixClient({
  endpoint: "http://localhost:8080",
  disclosure: { actor: "acc://alice.acme", purpose: "settlement" },
});

const intent = await client.intents.submit({
  goal: "GOVERNED_TRANSFER",
  params: { from: "acc://alice.acme", to: "acc://bob.acme", amount: 100 },
});

const plan = await client.intents.plan(intent.id);
// ...a *different* actor (acc://carol.acme) signs via @infrix/wallet, then:
await client.approvals.submit(signedEnvelope);

const outcome = await client.intents.awaitOutcome(intent.id);
console.log("finality:", outcome.finality);            // "l0_anchored_final"
console.log("evidence:", outcome.evidenceBundle);      // portable — verify offline
```

To verify the bundle offline, see [Offline Verification](../cookbook/offline-verification.md)
and the `verifyEvidence` helper used in the [first-intent tutorial](../tutorials/first-intent.md).

## Related

- [TypeScript Wallet](./typescript-wallet.md) — adds signing, key management, sponsored calls.
- [First Intent tutorial](../tutorials/first-intent.md) — this surface, end to end.
- [The Governance Spine](../governance-spine.md) — the model these methods walk.
- [Offline Verification](../cookbook/offline-verification.md) — verifying the evidence bundle.
