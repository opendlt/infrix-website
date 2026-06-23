# Offline verification

Every governed outcome carries a **portable evidence bundle**: trace digests, a
plan-hash binding, trust snapshots, capability proofs, and anchor references. The
bundle is designed to be verified **offline, by a third party, without running an
Infrix node and without trusting the node that produced it.**

## Verify a bundle (no node trust)

In the browser or Node, use the `@infrix/verify` package — the same canonical
verifier closure the SDKs and explorer share:

```typescript
import { verifyOffline } from '@infrix/verify';

const result = verifyOffline(bundle);
console.log(result.assurance);   // e.g. { proof: 'L3', governance: 'G2' }
console.log(result.nodeTrusted); // false — verification never trusts a node
```

A failed check can never render as a green badge: the verifier reports an honest
assurance level or it fails closed.

## Verify from the CLI

```bash
infrix verify ./evidence-bundle.json
```

The Go side verifies the same bundle via `evidence.VerifyPortablePackage` — the
Go and JS verifiers are held to byte-level parity by a cross-language fence, so a
bundle verifies identically in both.

## The assurance ladder

Verification reports two independent axes, never inflated:

| Axis | Levels | Meaning |
| --- | --- | --- |
| Proof | L0 … L4 | how strongly the run is *cryptographically* established |
| Governance | G0 … G2 | how completely the *governance spine* was satisfied |

- **Offline** verification caps the proof axis at **L3** — claiming **L4**
  requires a *live* L0 anchor confirmation, which an offline verifier cannot
  fabricate.
- A local run never claims L0/L4 and never reports `nodeTrusted: true`.

## Related

- [Trust profiles](./trust-profiles.md)
- [The Governance Spine](../governance-spine.md)
- [Getting Started](../getting-started.md)
