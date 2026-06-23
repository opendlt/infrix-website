# TypeScript Wallet SDK

`@infrix/wallet` is the ADI-native smart wallet SDK. It exposes **only**
governance-first primitives: every state-changing operation is submitted as an
**intent** and flows through the canonical spine (intent → plan → approval →
execution → outcome → evidence → anchor). There is no "raw transaction" surface.

## Install

```bash
npm install @infrix/wallet
```

## Submit an intent

```typescript
import { InfrixWallet } from '@infrix/wallet';

const wallet = new InfrixWallet('acc://alice.acme');
await wallet.generateKey();

const result = await wallet.submitIntent({
  type: 'CONTRACT_CALL',
  customParams: {
    contractAddress: 'acc://game.acme/counter',
    function: 'increment',
    arguments: [],
  },
});
```

## Connect an injected provider

```typescript
import { InfrixProvider } from '@infrix/wallet';

if (InfrixProvider.isAvailable()) {
  const wallet = await InfrixProvider.connect();
  console.log(wallet.adi); // acc://alice.acme
}
```

## What it covers

- `InfrixWallet` — an ADI-scoped wallet: key generation/derivation, balance
  reads (`WalletAmountResult`), and `submitIntent` (the only mutation path)
- `InfrixProvider` — discover and connect an injected wallet provider in the browser
- `SponsorConfig` — sponsored calls, where a sponsor pays for a governed intent
- `RecoveryRequest` — the key-recovery flow
- A Cinema-recorded session protocol for replayable, auditable wallet sessions

Source modules: `wallet`, `keystore`, `crypto`, `session`, `governance-types`.

## Related

- [TypeScript Client](./typescript-client.md) — the REST/WebSocket client the wallet builds on
- [Getting Started](../getting-started.md)
- [The Governance Spine](../governance-spine.md)
