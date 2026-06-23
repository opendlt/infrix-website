# Trust profiles

A `TrustProfile` is a named, versioned statement of *who and what a plan is
willing to rely on* — counterparties, operators, plugins, domains. Profiles are
referenced by governed plans and re-evaluated continuously, so trust is a
first-class, enforced input to execution rather than a deploy-time assumption.

## Bind a profile to a plan

A plan references the trust profile it requires. At execution time the
`TrustResponseOrchestrator` evaluates every referenced profile before and during
the run.

```yaml
trustProfile:
  id: settlement-counterparties
  version: 3
  requires:
    operatorDiversity: 2          # ≥ 2 distinct operators must reproduce
    minOperatorReliability: 0.99
    domains:
      - acc://clearing.acme
```

## Fail closed on trust drift

If a referenced profile **degrades** mid-flight — an operator drops below the
reliability floor, a domain is revoked, diversity is lost — the in-flight plan
flips `TrustDriftBlocked = true` and the executor exits via the canonical
Gap 4-C halt. Nothing settles on stale trust.

Bind the orchestrator to the pipeline and pair it with an approval gate so the
drift is both halted and surfaced for re-approval:

```yaml
- id: settlement-trust-gate
  type: settlement:reserve
  defaultEffect: deny
  rules:
    - match:
        trustProfile:
          id: settlement-counterparties
          minVersion: 3
      effect: allow
    - effect: deny
```

## Why versioning matters

A profile is bound by `id` **and** `version`. Tightening a profile bumps its
version, so a plan that approved against an older, weaker version is invalidated
and must re-approve against the current one — a stale trust assumption can never
silently carry forward.

## Related

- [Approval policies](./approval-policies.md)
- [Offline verification](./offline-verification.md)
- [The Governance Spine](../governance-spine.md)
