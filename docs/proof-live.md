# Proof, live — don't trust us, run it

Every other page here makes a claim: *governed execution, a portable proof, no
node to trust.* This page is the claim **executed** — one command, a real run
anchored to the public Accumulate Kermit ledger, and three ways for you to check
it yourself without taking our word for anything.

## One command → an L4 proof

With the CLI ([install](/getting-started), or use `npx @infrix/cli` with no
install):

```sh
npx @infrix/cli demo start --mode kermit
```

It self-provisions a throwaway identity on the Accumulate **Kermit** testnet
(faucet → credits → ADI → anchor accounts), runs the golden escrow as a governed
flow, anchors the evidence to L0, and re-verifies it. The tail of a real run:

```text
Ran: governed escrow
Result: completed
Proof: verified against live L0 (kermit)
Assurance: L4/G2
L0: kermit
```

`L4/G2` is the top of the ladder: **L4** = the evidence is anchored on and
confirmed against Accumulate L0; **G2** = the flow carried a full governance
spine (intent → policy → approval → outcome → evidence → anchor). The receipt
from that run:

```json
{
  "demo": "golden-escrow",
  "mode": "kermit",
  "status": "completed",
  "proofLevel": "L4",
  "governanceLevel": "G2",
  "tier": "L4/G2",
  "nodeTrusted": false,
  "l0Verified": true,
  "replayVerified": true,
  "fullyVerified": true
}
```

## Check it yourself — three ways, zero trust

### 1. Re-verify the proof without trusting the node

The run hands you a portable evidence bundle. Re-verify it against L0 yourself —
`nodeTrusted` stays `false`; the verdict is math you re-run:

```sh
infrix verify bundle.infrix.json \
  --l0 https://kermit.accumulatenetwork.io/v3 \
  --require L4/G2 --require-replay
```
```text
✔ VERIFIED
  ✔ Cryptographically verified  — the maths binding every step checks out
  ✔ Live L0 verified            — confirmed against Accumulate L0 right now
  • No node trust required       — the proof stands on its own
  ✔ Replay matched              — we re-ran it and got the same result
  Trust: No one — anyone can re-run the maths to reach this verdict.
```

### 2. Read the anchor straight off the public ledger

The evidence is a `writeData` transaction on Accumulate L0 — it exists
independently of Infrix. Here is the anchor from the run above:

- **Anchor tx:** `17101084d152a41f87d5e7ce1198663cc1f66a6df1b5a7bbf778c4f5bb4af70b`
- **On-ledger account:** `acc://infrix-demo-1782869318198481700-1.acme/data`
- **Explorer:** [view it on the Kermit explorer](https://kermit.explorer.accumulatenetwork.io/acc/infrix-demo-1782869318198481700-1.acme/data)

### 3. Query the ledger directly

Don't trust our explorer link either — ask the public Kermit API yourself:

```sh
curl -s -X POST https://kermit.accumulatenetwork.io/v3 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"scope":"17101084d152a41f87d5e7ce1198663cc1f66a6df1b5a7bbf778c4f5bb4af70b@infrix-demo-1782869318198481700-1.acme/data"}}'
```

It returns the `writeData` transaction whose payload is the proof bundle's
`stateRoot`, `bundleHash`, and `chainHash` — the same values `infrix verify`
re-derived. The ledger and the proof agree, and neither needed an Infrix node to
be trusted.

> The account name is timestamped per run, so **your** run anchors to **your**
> account and tx — reproduce the whole thing and check your own numbers.

## The point

"Verifiable" isn't a slogan here — it's a `curl` you can paste. The run happened,
the ledger recorded it, and you re-checked it three independent ways without
trusting us. That's the whole product in one page.

**Next:** [run it live in the browser](https://play.infrix.opendlt.org) ·
[see the two-ways comparison](/why-infrix) · [build your first intent](/tutorials/first-intent)
