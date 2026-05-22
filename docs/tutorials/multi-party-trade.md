# Multi-party trade settlement

This tutorial drives a delivery-vs-payment (DvP) settlement across two domains through the canonical `Pipeline.Submit(GoalSettlement)` path with a multi-party approval gate.

## Run the demo

```bash
cd examples/multi-party-trade
go run .
```

## What it demonstrates

- `GoalSettlement` with two `Leg` entries (one local, one cross-chain bridge)
- Production `SettlementDispatcher` wiring with real `ReservationManager`, `BridgeMessageDispatcher`, and per-state settlement hooks
- Separation-of-duties approval policy requiring 2-of-N signatures from the `board_member` role
- Trust-drift gate that invalidates the plan if any referenced TrustProfile degrades mid-flight

## Source

The example main is at `examples/multi-party-trade/main.go`. The plan compilation, approval flow, and settlement dispatch are routed through the same code paths a production deployment would use.

## Related

- [Cross-domain bridge tutorial](./cross-domain-bridge.md)
- [Approval policies cookbook](../cookbook/approval-policies.md)
- [`kermit-dvp-multichain`](https://github.com/AccumulateNetwork/infrix/tree/main/examples/kermit-dvp-multichain) — same shape against the Kermit testnet with Sepolia + Cosmos legs
