# Approval policies

Recipes for the most common approval shapes used by governed plans.

## Single-role approval

Most contract calls only need one approver with a specific role. Bind a `PolicySet` of type `contract:call` with a role-derived gate:

```yaml
- id: allow-admin-call
  type: contract:call
  defaultEffect: allow
  rules:
    - match:
        actor:
          role: admin
      effect: allow
    - effect: deny
```

## N-of-M signed approvals

For larger transfers or governance changes use `#[require_approval]` on the contract method (Rust SDK) and bind a multi-signature policy:

```rust
#[call]
#[require_role("admin")]
#[require_approval(threshold = 2, role = "board_member")]
pub fn large_withdraw(&mut self, amount: U256) -> Result<(), Error> { ... }
```

The `ApprovalStore` collects signed envelopes and the `InvalidationChecker` re-verifies the role-derivation chain so a stale derivation can never close the gate.

## Separation of duties

For DvP / settlement flows, require the approver role to be disjoint from the actor role:

```yaml
- id: settlement-sod
  type: settlement:reserve
  defaultEffect: deny
  rules:
    - match:
        actor:
          role: trader
        approval:
          role: ops-manager
      effect: allow
```

## Trust-drift gate

Bind `TrustResponseOrchestrator` to the pipeline so when a referenced `TrustProfile` degrades the in-flight plan flips to `TrustDriftBlocked=true` and the executor exits via the canonical Gap 4-C halt.

## Related

- [Multi-party trade tutorial](../tutorials/multi-party-trade.md)
- [Cross-domain bridge tutorial](../tutorials/cross-domain-bridge.md)
