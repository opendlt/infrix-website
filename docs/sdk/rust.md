# Rust SDK

The Rust SDK is the canonical way to author Infrix smart contracts. Contracts
compile to WebAssembly and execute as subordinate plugins **inside** the
execution step of the governance spine (intent → plan → approval →
**execution** → outcome → evidence → anchor).

It ships as three crates on crates.io:

- `infrix-sdk` — the contract-author surface (Storage, L0, Environment, Events,
  and Crypto APIs, plus the contract macros)
- `infrix-types` — shared value types (`U256`, `Address`, `Hash`, `Error`, `CallResult`)
- `infrix-macros` — the procedural macros

## Install

```toml
[dependencies]
infrix-sdk = "0.1"
```

## Write a contract

```rust
use infrix_sdk::prelude::*;

#[contract]
pub struct Counter {
    value: U256,
}

#[contract_impl]
impl Counter {
    #[init]
    pub fn new() -> Self {
        Self { value: U256::ZERO }
    }

    #[call]
    pub fn increment(&mut self) -> Result<(), Error> {
        self.value = self.value.checked_add(&U256::ONE).ok_or(Error::Overflow)?;
        Ok(())
    }

    #[view]
    pub fn get(&self) -> U256 {
        self.value
    }
}
```

## The macros

- `#[contract]` / `#[contract_impl]` — declare the contract struct and its methods
- `#[init]` — the constructor invoked on deploy
- `#[call]` — a state-changing method (routed through the spine; may mutate `&mut self`)
- `#[view]` — a read-only method
- `#[require_role("admin")]` / `#[require_approval(threshold = 2, role = "board_member")]`
  — bind a governance gate directly to a method (see [Approval policies](../cookbook/approval-policies.md))

## Build for WASM

```bash
cargo build --target wasm32-unknown-unknown --release
```

The SDK is `no_std` + `alloc` compatible, so contracts compile to compact WASM.

## Related

- [Approval policies](../cookbook/approval-policies.md)
- [AssemblyScript SDK](./assemblyscript.md) — the other contract-authoring path
- [The Governance Spine](../governance-spine.md)
