# The Governance Spine

Every state-changing operation in Infrix flows through one canonical pipeline — one enforced
path from what you want to a proof anyone can check:

<SpineDiagram :static="true" />

<!-- Plain-text fallback: the diagram above is the same seven stages, drawn. -->

```
intent → plan → approval → execution → outcome → evidence → anchor
```

This is the <Term word="governance spine">governance spine</Term>. Each stage has a typed
object, a policy hook, and an evidence contribution. There is no path that mutates state
without traversing it.

## Stage by stage

### 1. Intent
A user (or operator) submits an `Intent` describing a *desired outcome*: "transfer 100 tokens from A to B", "deploy this contract", "register this plugin", etc. Intents are typed (canonical `IntentGoalType` enum) and carry custom params.

The mediator parses the intent, validates the typed parameters, and compiles it to an `ExecutionPlan`.

### 2. Plan
An `ExecutionPlan` is a deterministic sequence of steps. Each step has:

- A canonical `PlanStepType` (`PlanStepContractCall`, `PlanStepSettlement`, `PlanStepAnchor`, ...).
- Typed parameters (`UnifiedStepParams`).
- A `PluginSelection` recording which plugin will handle the step + scoring rationale (Reason, ConfidentialityImplications, CostImplications).
- Approval requirements (`PlanApprovalReq`) sized by the step's risk class.

### 3. Approval
<Term word="approval">Approvals</Term> are gathered from the actors named on each `PlanApprovalReq`. The pipeline supports <Term word="separation of duties">separation-of-duties</Term> (the actor that approves cannot be the actor that submitted), threshold-based multi-party approval, and freshness invalidation (an approval bound to a plan-hash is invalidated when the plan re-compiles).

### 4. Execution
The plan executor walks the topologically-sorted steps, dispatching each through `pluginRegistry.DispatchWithCriteria`. Infrix's selector picks the best plugin per step from the criteria (confidentiality, cost cap, capabilities, trust domains, operator preference, historical reliability).

Plugins fire universal policy hooks (`plugin:admit`, `plugin:execute`, `plugin:finalize`) and category hooks (`settlement:reserve`, `external:send`, etc.) at canonical lifecycle points.

### 5. Outcome
Each step produces a `StepResult`; the executor aggregates them into an `OutcomeRecord` with <Term word="finality">finality</Term> state, gas usage, and policy decisions. The outcome is a managed object — readers consult it via `GetWithActor` with a `DisclosureContext`.

### 6. Evidence
Every plugin contributes to an `EvidenceBundle`: trace digests, trust snapshots, plan-hash binding, capability proofs, anchor references. The <Term word="evidence bundle">evidence bundle</Term> is portable — a regulator or auditor can verify it offline via `evidence.VerifyPortablePackage` without running an Infrix node.

### 7. Anchor
The `AnchorOrchestrator` writes a digest of the outcome + evidence to Accumulate L0 (or stays in bookkeeping mode per `--anchor-mode`). <Term word="anchor">Anchor</Term> confirmation drives the outcome's finality from `provisional` → `locally_final` → `l0_anchored_final`.

## What is *not* on the spine

The traditional contract surface (storage, function calls, events) lives **inside** an `execute` step — it is *what the spine schedules under the hood*. Smart contracts call host functions to read/write storage, but every storage write is a `StateChange` recorded in the step result and propagated through the dual-state finality window (handled by the runtime's `pkg/rewind`).

There is no API for "raw transactions" — every write originates from an intent.

## Why this matters

The governance spine makes the difference between *describing* governance (in prose) and *enforcing* it (in code). Every claim a community-facing pitch makes about Infrix being "governance-first" must be traceable to a hook on the spine. If you can find a state-mutating path that doesn't traverse it, that's a bug worth filing.

## Next steps

- [Submit your first intent](/tutorials/first-intent)
- [Multi-party trade walkthrough](/tutorials/multi-party-trade)
- [Approval policy patterns](/cookbook/approval-policies)
