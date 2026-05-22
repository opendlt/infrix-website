# Cross-domain bridge

This tutorial drives a `GoalBridgeAction` through the production bridge adapter chain so a contract on Infrix can dispatch a transaction to a remote chain (Ethereum Sepolia, Cosmos testnet, Bitcoin testnet, Solana devnet, or another VDK-supported chain).

## Run the demo

```bash
cd examples/kermit-bridge-dispatch
go run .
```

## What it demonstrates

- `BRIDGE_SEND` admission with the full operator-fixture chain (TrustProfile + `bridge:send` policy + `verify:proof_accept` policy + admin role)
- `productionExternalBridgeRouter` selects the per-chain VDK adapter and signs a real transaction
- The `BridgeMessageDispatcher` seam carries the canonical `BridgeDispatchResult` (`MessageID` + `ProofType`) through evidence
- Plan compilation produces a `BridgeReceipt` artifact recorded against the `EvidenceLedger`

## Source

The example main is at `examples/kermit-bridge-dispatch/main.go`. To run against a different chain, swap the `--chain` flag (`ethereum-sepolia`, `cosmos-testnet`, `bitcoin-testnet`, `solana-devnet`).

## Related

- [Multi-party trade tutorial](./multi-party-trade.md)
- [Approval policies cookbook](../cookbook/approval-policies.md)
