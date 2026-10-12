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

Reached via `client.intents`. Submits an intent through the governed spine and reads its per-intent records. Each read answers
exactly the members its route declares; an answer that lacks one is refused, never read as empty.

```typescript
type IntentStatus =
  | "pending"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "completed"      // terminal success
  | "failed"         // terminal failure (policy / approval / execution)
  | "cancelled"
  | "expired";

/** What submit() resolves with. */
interface IntentResult {
  intentId: string;
  status: IntentStatus;
  planId?: string;
  outcomeId?: string;
  gasUsed?: number;
  evidenceId?: string;
  error?: string;
  blockHeight?: number;
}

/** GET /v4/intents/{id} */
interface IntentAnswer {
  intent: unknown;   // the intent as the object registry holds it
  status: unknown;   // its lifecycle state, an IntentStatus
}

/** The page every list route answers (GET /v4/intents, /v4/intents/pending, /v4/approvals, ...). */
interface ListAnswer {
  items: unknown;        // registry objects: { id, type, state, url, created, updated, version, createdByIntentId, audit, fields }
  pagination: unknown;   // { offset, limit, total }
}

/** GET /v4/intents/{id}/evidence */
interface IntentEvidenceAnswer {
  bundles: unknown;      // the evidence bundles linked to the intent; each one's `id` is the evidence id
  count: unknown;
  intent: unknown;
  intentId: unknown;
}

class IntentClient {
  /** POST /v4/intents — submit a governed intent. */
  submit(goal: IntentGoal | string, opts?: IntentSubmitOptions): Promise<IntentResult>;

  /** GET /v4/intents/{id} — `{ intent, status }`. */
  get(intentId: string): Promise<IntentAnswer>;

  /** GET /v4/intents — `{ items, pagination }`. The route accepts `status` and `goalType` and nothing else; any other key is refused by name. */
  list(filter?: { status?: IntentStatus; goalType?: string }): Promise<ListAnswer>;

  /** GET /v4/intents/pending — `{ items, pagination }` of what awaits the CALLING ACTOR. Takes no parameters: construct the client with the approver as `actor`; passing an identity is refused by name. */
  pending(): Promise<ListAnswer>;

  /** GET /v4/intents/{id}/plan — the compiled ExecutionPlan (see ExecutionPlan below). */
  plan(intentId: string): Promise<ExecutionPlan>;

  /** Sign-and-submit the approval for a parked stage (the signature comes from the material client.approvals.signing() publishes). */
  approve(intentId: string, planHash: string, opts: {
    approver: string; role?: string; keyPageRef: string; signature: string; signerPublicKey: string; stageId?: string;
  }): Promise<GovernedApproveResult>;

  /** GET /v4/intents/outcome — the OutcomeRecord (see below). */
  outcome(intentId: string): Promise<OutcomeRecord>;

  /** GET /v4/intents/{id}/evidence — `{ bundles, count, intent, intentId }`. The answer is NOT a bundle. */
  evidence(intentId: string): Promise<IntentEvidenceAnswer>;

  /** Cancel an intent that has not executed. */
  cancel(intentId: string, reason?: string): Promise<void>;
}
```

### Finding an intent's evidence

The evidence routes (`client.evidence.get / verify / export / anchor`) take the id of an evidence **bundle**
(`ev-<intentId>`), not the id of the intent. Ask the intent for its bundles, then use the bundle's id:

```typescript
const { bundles } = await client.intents.evidence(intentId);                  // { bundles, count, intent, intentId }
const evidenceId = (bundles as Array<{ id: string }>)[0].id;
const verified = await client.evidence.verify(evidenceId);                    // { bundleId, chainVerified }
const exported = await client.evidence.export(evidenceId, "json");            // { bundle, bundleId, bytes, exportHash, format }
const anchor = await client.evidence.anchor(evidenceId);                      // { anchorBlock, anchorDataIdx, anchorStatus, anchorTxHash, bundleId, stateRoot }
```

`evidenceIdForIntent(client, intentId)` does the lookup in one call: `undefined` while the intent has no bundle, the bundle's id
when it has one, and for several bundles the one whose id is `ev-<intentId>` (the id the node gives an intent's bundle) when
exactly one carries it — otherwise it throws, naming every id and `client.evidence.exportPortable(id)`.

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

### `OutcomeRecord` shape

```typescript
interface OutcomeRecord {
  id: string;
  planId: string;
  completedAt: string;                              // ISO-8601
  blockHeight: number;
  overallStatus: "completed" | "failed" | "compensated";
  stepOutcomes: StepOutcome[];
  totalGasUsed: number;
  totalGasPlanned: number;
  gasDrift: number;                                 // percentage
  approvalEvidence: ApprovalRef[];
  outcomeHash: string;                              // hex SHA-256
  planHashVerified: boolean;
  evidenceBundleId?: string;                        // the id to pass to client.evidence.*
}
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
