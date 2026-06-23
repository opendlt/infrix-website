# AssemblyScript SDK

`@infrix/sdk` is the AssemblyScript SDK for authoring Infrix smart contracts in
a TypeScript-like language that compiles to WebAssembly. Like the Rust SDK,
contracts run inside the execution step of the governance spine.

## Install

```bash
npm install @infrix/sdk
```

## Write a contract

```typescript
import { U256, Storage, Env } from "@infrix/sdk";

// Top-level functions become the WASM exports the runtime calls.
export function setValue(): void {
  // Every state write is captured as a StateChange on the spine.
  Storage.setU256("value", Env.value());
}

export function getValue(): U256 | null {
  return Storage.getU256("value");
}
```

Only top-level functions and constants become WASM exports — the value classes
(`U256`, `Address`, `Hash`) and namespaces (`Storage`, `Env`, `L0`) are
author-side surface you `import`, not module exports.

## What it covers

- Value types: `U256`, `Address`, `Hash`
- `Storage` — typed contract state: `get`/`set`, `getString`/`setString`,
  `getU256`/`setU256`, `has`, `remove`, plus a `StorageMap` helper
- `Env` — execution context: `caller()`, `owner()`, `value()`, `blockHeight()`,
  `txHash()`, `log()`, `require()`, `revert()`
- `L0` — Accumulate L0 access: `getBalance()`, `transfer()`, `writeData()`
- `Governance` — the governance bindings (exported first so tooling can lock ordering)
- Token ABIs: `ACU20` / `ACU721` selector + event constants

## Build

```bash
npm run asbuild   # asc -> build/release.wasm (+ debug build)
```

## Related

- [Rust SDK](./rust.md) — the other contract-authoring path
- [The Governance Spine](../governance-spine.md)
