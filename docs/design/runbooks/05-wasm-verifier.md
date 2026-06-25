# Runbook 05 — Live WASM Evidence Verifier

> **Effort 5 of 6.** Prerequisites: runbooks **02** (`<SpineDiagram>` + `theme/data/spine.ts`)
> and **03** (`<SpineWalkthrough>` + `theme/data/demo-bundle.ts` + the canned `verify()` seam).
> Read [`00-overview.md`](./00-overview.md) first — tokens, file tree, DoD, perf budget, and the
> banned-jargon list are defined there and are **not** repeated here.
>
> **Goal:** Ship `<EvidenceVerifier>` running the **real** offline evidence verifier compiled to
> **WebAssembly, client-side, with zero network calls.** This is the technical flex that *proves*
> the "verify offline — no node, no trust" claim instead of asserting it. It replaces the canned
> `verify()` seam runbook 03 left in `<SpineWalkthrough>` with the genuine verifier walking a real
> `PortableEvidencePackage`. This is UX-REVIEW **Part 4 §4 ("the payoff — verify it live")** and
> **Part 9 §4**, and it is **Part 10 P2 item 10** — the highest-risk, highest-credibility effort.

---

## Outcomes (what "done" looks like)

1. The repo's offline verifier (`evidence.VerifyPortablePackage`) is compiled to WebAssembly and
   its artifacts are committed under `docs/.vitepress/theme/assets/wasm/` (or built in CI from a
   pinned toolchain — both paths documented).
2. A JS/TS glue module `theme/data/verifier.ts` exposes
   `verify(bundleJSON: string) => Promise<{ ok: boolean; chainHash?: string; reason?: string }>`,
   instantiating the WASM module **lazily** — only on the first "Verify" click — with single-flight
   instantiation, error handling, and a timeout.
3. `<EvidenceVerifier>` (`theme/components/EvidenceVerifier.vue`) renders a **"Verify this proof"**
   button → loading spinner → success state (`✓ verified` + chain hash, `--ifx-verified` green) or
   failure state (the honest reason, `--ifx-pending` amber). Accessible: `aria-live` result,
   keyboard-operable, reduced-motion safe. Takes the evidence bundle as a prop.
4. `<SpineWalkthrough>`'s canned `verify()` seam from runbook 03 is **replaced** by a real
   `<EvidenceVerifier>` fed a **genuine** demo bundle — a committed
   `PortableEvidencePackage` fixture generated from the repo's `examples/full-spine-demo` (or a
   documented mock-fallback flag if the real fixture isn't available at build time).
5. VitePress serves the `.wasm` with the correct MIME type; the artifact is **not** `srcExclude`'d
   away; it stays under the perf budget and is lazy-loaded (00-overview §8).
6. **No network call** occurs during verification — proven by a QA pass with DevTools offline.

---

## Step 0 — Branch & baseline

```bash
git checkout -b redesign/05-wasm-verifier
npm ci
npm run dev    # confirm 01/02/03 surfaces render before touching anything
node --test docs-structure.test.mjs   # fence green from the start
```

Confirm the runbook-03 deliverables this effort plugs into exist:

```bash
ls docs/.vitepress/theme/components/SpineWalkthrough.vue
ls docs/.vitepress/theme/data/demo-bundle.ts
ls docs/.vitepress/theme/data/spine.ts
```

If `SpineWalkthrough.vue` is not present, **stop** — this effort has nothing to slot into. Land 03
first.

---

## Step 1 — Source & compile the verifier to WASM

The canonical offline verifier lives in the Infrix repo
([`github.com/opendlt/infrix-accumen`](https://github.com/opendlt/infrix-accumen)) as the Go
function **`evidence.VerifyPortablePackage`** — the same closure referenced by
[`first-intent.md`](../../tutorials/first-intent.md) and
[`offline-verification.md`](../../cookbook/offline-verification.md), held to byte-level parity with
the JS verifier by a cross-language fence. There are two viable compile paths.

> **Recommendation: take the Go/WASM path.** The canonical verifier *is* Go, and the docs reference
> the Go-side `VerifyPortablePackage` as the source of truth. Compiling that exact function removes
> any "is the browser running the same code as the CLI?" doubt — which is the entire point of this
> effort. Use the Rust/wasm-bindgen path **only** if/when a maintained Rust port of the verifier
> exists and the Go toolchain is unavailable in CI.

Work in a checkout of the Infrix repo (sibling to this website repo), not inside the website tree:

```bash
git clone https://github.com/opendlt/infrix-accumen.git
cd infrix-accumen
```

### Path A — Go → WASM (recommended)

The verifier must be wrapped in a tiny `main` that registers a JS-callable function on `globalThis`.
Add this shim under `cmd/verifier-wasm/main.go` in the Infrix repo (or vendor it into a build dir):

```go
//go:build js && wasm

// cmd/verifier-wasm: thin WASM wrapper around evidence.VerifyPortablePackage.
// Compiled with GOOS=js GOARCH=wasm. Exposes globalThis.__ifx_verify(bundleJSON)
// returning { ok, chainHash, reason }. No network, no node — pure offline verify.
package main

import (
	"encoding/json"
	"syscall/js"

	"github.com/opendlt/infrix-accumen/pkg/evidence"
)

// verify is the single exported entry point. It takes one string arg (the bundle
// JSON) and returns a plain JS object the glue layer reads directly.
func verify(this js.Value, args []js.Value) any {
	out := map[string]any{"ok": false}
	if len(args) < 1 || args[0].Type() != js.TypeString {
		out["reason"] = "verify expects one string argument (bundle JSON)"
		return out
	}

	var pkg evidence.PortableEvidencePackage
	if err := json.Unmarshal([]byte(args[0].String()), &pkg); err != nil {
		out["reason"] = "bundle is not valid JSON: " + err.Error()
		return out
	}

	res, err := evidence.VerifyPortablePackage(&pkg)
	if err != nil {
		// Fail closed: a failed check is NEVER a green badge (offline-verification.md).
		out["reason"] = err.Error()
		return out
	}

	out["ok"] = res.OK
	out["chainHash"] = res.ChainHash // hex string, e.g. "0xfeed…"
	if !res.OK {
		out["reason"] = res.Reason
	}
	return out
}

func main() {
	js.Global().Set("__ifx_verify", js.FuncOf(verify))
	// Block forever so the Go runtime (and the registered func) stay alive.
	select {}
}
```

> **Adapt to the real `VerifyPortablePackage` signature.** The shim above assumes
> `VerifyPortablePackage(*PortableEvidencePackage) (Result{OK bool; ChainHash, Reason string}, error)`.
> If the actual signature differs (e.g. returns the assurance ladder `{ proof: 'L3', governance:
> 'G2' }` from `offline-verification.md`), map it: set `ok = res.NodeTrusted == false && proofLevel >= L1`,
> surface `chainHash` from the bundle's anchor ref, and put the assurance string in a `reason`-style
> field. **Confirm against the repo before building** — `go doc ./pkg/evidence VerifyPortablePackage`.

Build it. Pin the toolchain (see Step 5):

```bash
# from the infrix-accumen checkout root
GOOS=js GOARCH=wasm go build -trimpath -ldflags="-s -w" \
  -o verifier.wasm ./cmd/verifier-wasm

# the Go runtime glue that loads/instantiates a GOOS=js binary:
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ./wasm_exec.js
# (older Go: $(go env GOROOT)/misc/wasm/wasm_exec.js)
```

**Output artifacts:** `verifier.wasm` (the binary) and `wasm_exec.js` (the runtime). Copy **both**
into the website repo:

```bash
mkdir -p ../infrix-website/docs/.vitepress/theme/assets/wasm
cp verifier.wasm wasm_exec.js ../infrix-website/docs/.vitepress/theme/assets/wasm/
```

`-trimpath -ldflags="-s -w"` strip paths and debug symbols for a smaller, reproducible binary.
TinyGo (`tinygo build -target wasm`) yields a dramatically smaller `.wasm` and is worth trying if
the verifier's deps are TinyGo-compatible — but it ships its own `wasm_exec.js`; pair the matching
runtime, never mix.

### Path B — Rust → WASM via wasm-bindgen (alternative)

Use only if a maintained Rust verifier crate exists (e.g. `infrix-evidence`). Wrap it:

```rust
// crates/verifier-wasm/src/lib.rs
use wasm_bindgen::prelude::*;
use infrix_evidence::verify_portable_package; // the Rust equivalent of VerifyPortablePackage

#[wasm_bindgen]
pub fn ifx_verify(bundle_json: &str) -> JsValue {
    // Returns { ok, chainHash?, reason? } — same contract as the Go path.
    let result = match verify_portable_package(bundle_json) {
        Ok(r) => serde_json::json!({ "ok": r.ok, "chainHash": r.chain_hash, "reason": r.reason }),
        Err(e) => serde_json::json!({ "ok": false, "reason": e.to_string() }),
    };
    serde_wasm_bindgen::to_value(&result).unwrap()
}
```

```bash
# Cargo.toml: [lib] crate-type = ["cdylib"]; deps wasm-bindgen, serde-wasm-bindgen, serde_json
cargo install wasm-pack            # pin the version (Step 5)
wasm-pack build crates/verifier-wasm --target web --release --out-dir pkg
```

**Output artifacts (wasm-pack glue):** `pkg/verifier_wasm_bg.wasm`, `pkg/verifier_wasm.js`,
`pkg/verifier_wasm.d.ts`. Copy them into the same dir:

```bash
cp pkg/verifier_wasm_bg.wasm pkg/verifier_wasm.js pkg/verifier_wasm.d.ts \
   ../infrix-website/docs/.vitepress/theme/assets/wasm/
```

The Rust path has **no** `wasm_exec.js` — wasm-bindgen generates its own JS glue and there is no
`globalThis.__ifx_verify`; the glue module imports the export directly (Step 2 covers both).

---

## Step 2 — The JS binding contract (`theme/data/verifier.ts`)

One module owns lazy instantiation, the timeout, and error normalization. It exposes exactly the
contract every consumer (and the runbook-03 seam) expects:

```ts
verify(bundleJSON: string) => Promise<{ ok: boolean; chainHash?: string; reason?: string }>
```

Create `docs/.vitepress/theme/data/verifier.ts`:

```ts
// Lazy, single-instantiation binding to the offline evidence verifier (WASM).
// The module is dynamically imported and the WASM is instantiated ONCE, on the
// first verify() call — never at page load (00-overview §8: WASM is lazy-loaded
// on demand only). No network call is made during verification.

export interface VerifyResult {
  ok: boolean;
  chainHash?: string;
  reason?: string;
}

const VERIFY_TIMEOUT_MS = 8000;

// Single-flight: the in-flight (or resolved) instantiation promise. All callers
// share it, so the WASM is fetched + instantiated at most once per page.
let bootstrap: Promise<(json: string) => VerifyResult> | null = null;

// ---- Path A: Go + wasm_exec.js -------------------------------------------------
async function bootGo(): Promise<(json: string) => VerifyResult> {
  // wasm_exec.js defines globalThis.Go and is side-effecting. Import for effect.
  // The ?url import gives us the hashed asset URL Vite emits for the .wasm.
  await import("../assets/wasm/wasm_exec.js");
  const wasmUrl = (await import("../assets/wasm/verifier.wasm?url")).default;

  // @ts-expect-error — Go is injected onto globalThis by wasm_exec.js
  const go = new globalThis.Go();
  const resp = await fetch(wasmUrl); // same-origin static asset; NOT a node call
  const { instance } = await WebAssembly.instantiateStreaming(resp, go.importObject);

  // go.run resolves when main() returns; our main() blocks on select{}, so it
  // stays alive and registers __ifx_verify. Do NOT await go.run().
  void go.run(instance);

  // Give the runtime a microtask to register the global, then bind.
  await Promise.resolve();
  const fn = (globalThis as any).__ifx_verify as undefined | ((s: string) => VerifyResult);
  if (typeof fn !== "function") {
    throw new Error("verifier did not register (__ifx_verify missing)");
  }
  return (json: string) => fn(json);
}

// ---- Path B: Rust / wasm-bindgen (uncomment if you took Path B) ----------------
// async function bootRust(): Promise<(json: string) => VerifyResult> {
//   const mod = await import("../assets/wasm/verifier_wasm.js");
//   const wasmUrl = (await import("../assets/wasm/verifier_wasm_bg.wasm?url")).default;
//   await mod.default(wasmUrl);            // wasm-bindgen init
//   return (json: string) => mod.ifx_verify(json) as VerifyResult;
// }

function boot(): Promise<(json: string) => VerifyResult> {
  if (!bootstrap) {
    bootstrap = bootGo().catch((err) => {
      bootstrap = null; // allow a retry on the next click after a transient failure
      throw err;
    });
  }
  return bootstrap;
}

export async function verify(bundleJSON: string): Promise<VerifyResult> {
  let run: (json: string) => VerifyResult;
  try {
    run = await Promise.race([
      boot(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("verifier load timed out")), VERIFY_TIMEOUT_MS),
      ),
    ]);
  } catch (err) {
    return { ok: false, reason: humanize(err) };
  }

  try {
    const raw = run(bundleJSON);
    // Normalize: never trust the WASM to return a perfectly-shaped object.
    return {
      ok: Boolean(raw?.ok),
      chainHash: raw?.chainHash,
      reason: raw?.ok ? undefined : raw?.reason ?? "verification failed",
    };
  } catch (err) {
    return { ok: false, reason: humanize(err) };
  }
}

function humanize(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Keep UI copy plain (00-overview §6 banned-jargon list) — no internal type names.
  if (msg.includes("timed out")) return "The verifier took too long to load. Try again.";
  return "Could not run the verifier in this browser. " + msg;
}
```

Notes:
- **Lazy:** nothing here runs until `verify()` is first called; `<EvidenceVerifier>` only imports
  this module dynamically (Step 3), so the `.wasm` is fetched on the first click, not on page load.
- **Single instantiation:** the shared `bootstrap` promise guarantees one fetch + one
  `WebAssembly.instantiate` regardless of how many times users click or how many verifier instances
  mount.
- **Timeout:** load is bounded at 8s; on timeout the UI shows a plain retry message.
- `WebAssembly.instantiateStreaming` is fed the **same-origin** hashed asset URL — that `fetch` is a
  static-asset read, never a call to an Infrix node (Step 6).

---

## Step 3 — `<EvidenceVerifier>` SFC

Create `docs/.vitepress/theme/components/EvidenceVerifier.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { VerifyResult } from "../data/verifier";

const props = defineProps<{
  // The evidence bundle — accepted as a JSON string OR an object (we stringify).
  bundle: string | Record<string, unknown>;
  // Optional label override for the button.
  label?: string;
}>();

type Phase = "idle" | "running" | "ok" | "fail";
const phase = ref<Phase>("idle");
const result = ref<VerifyResult | null>(null);

const bundleJSON = computed(() =>
  typeof props.bundle === "string" ? props.bundle : JSON.stringify(props.bundle),
);

const live = computed(() => {
  switch (phase.value) {
    case "running": return "Verifying the proof in your browser…";
    case "ok":      return `Verified offline. Chain hash ${result.value?.chainHash ?? ""}.`;
    case "fail":    return `Could not verify: ${result.value?.reason ?? "unknown reason"}.`;
    default:        return "";
  }
});

async function run() {
  if (phase.value === "running") return;
  phase.value = "running";
  result.value = null;
  // Dynamic import keeps the WASM off the page-load critical path (00-overview §8).
  const { verify } = await import("../data/verifier");
  const res = await verify(bundleJSON.value);
  result.value = res;
  phase.value = res.ok ? "ok" : "fail";
}
</script>

<template>
  <div class="ifx-verifier" :data-phase="phase">
    <button
      class="ifx-verify-btn"
      type="button"
      :disabled="phase === 'running'"
      :aria-busy="phase === 'running'"
      @click="run"
    >
      <span v-if="phase === 'running'" class="ifx-spinner" aria-hidden="true" />
      <span>{{ phase === 'running' ? 'Verifying…' : (label ?? 'Verify this proof') }}</span>
    </button>

    <!-- Single polite live region: the ONLY announced result surface. -->
    <p class="ifx-verify-status" role="status" aria-live="polite">{{ live }}</p>

    <div v-if="phase === 'ok'" class="ifx-verify-result is-ok">
      <span class="ifx-verify-icon" aria-hidden="true">✓</span>
      <span>
        <strong>Verified offline.</strong> No node, no trust required.
        <code v-if="result?.chainHash" class="ifx-chainhash">{{ result.chainHash }}</code>
      </span>
    </div>

    <div v-else-if="phase === 'fail'" class="ifx-verify-result is-fail">
      <span class="ifx-verify-icon" aria-hidden="true">✕</span>
      <span><strong>Did not verify.</strong> {{ result?.reason }}</span>
    </div>
  </div>
</template>

<style scoped>
.ifx-verifier { display: flex; flex-direction: column; gap: 12px; }

.ifx-verify-btn {
  display: inline-flex; align-items: center; gap: 10px; align-self: flex-start;
  font-family: var(--ifx-font-mono); font-size: 0.95rem; cursor: pointer;
  padding: 10px 18px; border-radius: var(--ifx-r-sm);
  color: var(--ifx-bg); background: var(--ifx-brand); border: 1px solid var(--ifx-brand-strong);
  transition: background var(--ifx-dur-fast) var(--ifx-ease);
}
.ifx-verify-btn:hover:not(:disabled) { background: var(--ifx-brand-strong); }
.ifx-verify-btn:disabled { opacity: 0.7; cursor: progress; }
.ifx-verify-btn:focus-visible { outline: 2px solid var(--ifx-verified); outline-offset: 2px; }

.ifx-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--ifx-bg) 40%, transparent);
  border-top-color: var(--ifx-bg);
  animation: ifx-spin 700ms linear infinite;
}
@keyframes ifx-spin { to { transform: rotate(360deg); } }

.ifx-verify-status { margin: 0; min-height: 1.2em; font-size: 0.85rem; color: var(--ifx-text-muted); }

.ifx-verify-result {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px 16px; border-radius: var(--ifx-r-md); font-size: 0.95rem;
  border: 1px solid var(--ifx-border); background: var(--ifx-surface);
}
.ifx-verify-result.is-ok {
  color: var(--ifx-verified);
  border-color: color-mix(in srgb, var(--ifx-verified) 50%, transparent);
  background: color-mix(in srgb, var(--ifx-verified) 8%, var(--ifx-surface));
}
.ifx-verify-result.is-fail {
  color: var(--ifx-pending);
  border-color: color-mix(in srgb, var(--ifx-pending) 50%, transparent);
  background: color-mix(in srgb, var(--ifx-pending) 8%, var(--ifx-surface));
}
.ifx-verify-result strong { color: inherit; }
.ifx-verify-icon { font-weight: 700; line-height: 1.4; }
.ifx-chainhash {
  display: inline-block; margin-top: 4px; font-family: var(--ifx-font-mono);
  font-size: 0.82rem; color: var(--ifx-text); word-break: break-all;
}

@media (prefers-reduced-motion: reduce) {
  .ifx-spinner { animation: none; border-top-color: transparent; }
  .ifx-verify-btn { transition: none; }
}
</style>
```

Accessibility (00-overview §7):
- **`aria-live="polite"` + `role="status"`** on one status paragraph announces phase changes once;
  the result blocks are visual reinforcement, not duplicate announcements.
- **Color is never the sole signal:** `✓`/`✕` icons + bold text labels ("Verified offline." /
  "Did not verify.") accompany the green/amber.
- **Keyboard:** a native `<button>` is focusable and Enter/Space-activated; `:focus-visible` shows a
  green ring (never `outline: none`).
- **Reduced motion:** the spinner stops animating under `prefers-reduced-motion`; `aria-busy` still
  conveys progress to AT.

Register it globally in `docs/.vitepress/theme/index.ts` (the `enhanceApp` slot from runbook 01):

```ts
import EvidenceVerifier from "./components/EvidenceVerifier.vue";
// inside enhanceApp({ app }):
app.component("EvidenceVerifier", EvidenceVerifier);
```

---

## Step 4 — Wire it into `<SpineWalkthrough>` (replace the canned seam)

Runbook 03 left a `verify()` seam at the final ("Evidence" / payoff) stage of
`<SpineWalkthrough>` — canned/mocked, returning fake-but-real-looking data. **Replace that seam**
with `<EvidenceVerifier>`, fed the demo bundle.

In `docs/.vitepress/theme/components/SpineWalkthrough.vue`, at the Evidence-stage payoff, swap the
mocked button for:

```vue
<!-- was: <button @click="mockVerify()">Verify this proof</button> -->
<EvidenceVerifier :bundle="demoBundle" />
```

…where `demoBundle` is imported from the shared data module (created by runbook 03 per
00-overview §2):

```ts
import { demoBundle } from "../data/demo-bundle";
```

### 4a — The bundle MUST be real (the dependency, stated plainly)

The real verifier only passes on a **real, valid `PortableEvidencePackage`.** Runbook 03's
`demo-bundle.ts` may have shipped a *plausible-looking but invalid* mock (fine for a mocked
`verify()`; **fatal** for the real one — it will honestly fail closed). Two options:

**Option 1 (preferred) — commit a genuine fixture.** Generate a real package from the repo's
`examples/full-spine-demo` (the Go-side counterpart referenced by
[`first-intent.md`](../../tutorials/first-intent.md)), which "emits a `PortableEvidencePackage` for
offline verification — handy for CI":

```bash
# in the infrix-accumen checkout
go test ./examples/full-spine-demo -v
# the demo writes a PortableEvidencePackage; capture it to a file. If the test
# does not already write one, add a one-liner that marshals the package, e.g.:
#   os.WriteFile("portable-evidence.json", mustJSON(pkg), 0o644)
cp examples/full-spine-demo/portable-evidence.json \
   ../infrix-website/docs/.vitepress/theme/data/demo-evidence.json
```

Then make `demo-bundle.ts` export that genuine package (so both the walkthrough's display and the
verifier consume the same source of truth):

```ts
// docs/.vitepress/theme/data/demo-bundle.ts
import demoEvidence from "./demo-evidence.json";
export const demoBundle = demoEvidence; // a REAL PortableEvidencePackage — verifies green
```

> **Round-trip rule:** the fixture and the `verifier.wasm` come from the **same** repo commit. If
> the bundle schema changes, regenerate **both** together, or the verifier will reject its own demo.
> Record the source commit in a comment at the top of `demo-evidence.json` (or a sibling
> `demo-evidence.SOURCE`).

**Option 2 (fallback) — keep a mock flag.** If a genuine fixture cannot be produced at build time,
gate it so the walkthrough still demonstrates the flow without a misleading green check:

```ts
// in EvidenceVerifier consumption — pass a flag down, or branch in verifier.ts:
export const USE_REAL_VERIFIER = true; // flip false only if no genuine fixture exists
```

When `false`, `verify()` returns a clearly-labelled deterministic result and the UI copy reads
"Demo verification (sample data)" rather than claiming a real offline proof. **Never ship a green
"Verified offline" badge over data the real verifier would reject** — that defeats the entire
purpose (offline-verification.md: "a failed check can never render as a green badge"). Prefer
Option 1; treat Option 2 as a temporary build-unblock, not a shipped state.

---

## Step 5 — Build / CI considerations

### 5a — VitePress must serve `.wasm` correctly and NOT exclude it

- **MIME type:** Vite serves `.wasm` as `application/wasm` out of the box, and importing
  `?url` (Step 2) routes the file through Vite's asset pipeline so it gets a hashed name and the
  right `Content-Type` in dev, `preview`, and the static build. Do **not** hand-place the `.wasm` in
  `public/` and `fetch` a raw path — go through the `?url` import so hashing + MIME are handled.
- **Not `srcExclude`'d:** `srcExclude: ["design/**"]` only excludes Markdown pages under
  `docs/design/`. Our artifacts live under `docs/.vitepress/theme/assets/wasm/` — **outside** the
  exclude glob — so they ship. Verify after build:

```bash
npm run build
ls docs/.vitepress/dist/assets | grep -E '\.wasm$'   # the hashed verifier.wasm must be present
```

If the host (GitHub Pages) ever serves `.wasm` as `application/octet-stream`,
`instantiateStreaming` falls back gracefully because we feed it a `Response`; if a host strict-checks
MIME, swap to `WebAssembly.instantiate(await resp.arrayBuffer(), …)` in `verifier.ts`.

### 5b — Size / budget

`-s -w` + `-trimpath` keep the Go `.wasm` lean; TinyGo shrinks it further. The artifact is
**lazy-loaded on the first Verify click only** (00-overview §8: "WASM lazy-loaded on demand only"),
so it adds **zero** bytes to the landing route's initial JS. Note the artifact size in the PR; if a
plain `go build` `.wasm` is large (multi-MB), evaluate TinyGo before merging. The budget that
matters is the **initial** landing payload (< 100KB gz incremental JS) — the WASM sits outside it.

### 5c — Reproducible toolchain (pin it)

Document the exact toolchain so the committed `.wasm` is reproducible:

- **Go path:** pin in the Infrix repo's `go.mod` (`go 1.22.x`) and record the exact `go version` and
  `wasm_exec.js` origin in a `docs/.vitepress/theme/assets/wasm/BUILD.md`:

```
verifier.wasm built from infrix-accumen@<commit-sha>
  go version go1.22.5
  GOOS=js GOARCH=wasm go build -trimpath -ldflags="-s -w" -o verifier.wasm ./cmd/verifier-wasm
wasm_exec.js copied from go1.22.5 GOROOT/lib/wasm/wasm_exec.js
```

- **Rust path:** pin `rust-toolchain.toml` (channel + date) and the `wasm-pack` version; record both
  the same way.

### 5d — Build in CI (optional alternative to committing the binary)

If committing a binary is undesirable, add a CI job that clones the Infrix repo at the pinned SHA,
runs the Step-1 build, and drops the artifacts into `theme/assets/wasm/` before `npm run build`.
Either way the **same** pinned toolchain produces the **same** bytes. Committing the binary keeps
`npm ci && npm run build` self-contained (no Go toolchain on the docs builder) and is the simpler
default; CI-build is better if binary review in PRs is a concern.

---

## Step 6 — Security / trust note (the claim being demonstrated)

The entire value of this component is that **verification happens in the user's browser with no
network round-trip to any Infrix node.** Enforce and prove it:

- The only `fetch` in `verifier.ts` targets the **same-origin, hashed static `.wasm` asset** — never
  an Infrix endpoint, RPC, or `/v4/*` route. There is no `endpoint` prop, no node URL anywhere in
  this effort's code.
- The verifier operates purely on the bundle JSON passed in. It does not call out to re-fetch
  anchors or trust state — offline verification caps proof at L3 precisely *because* it cannot (and
  must not) contact a live L0 (offline-verification.md).
- **Prove it in QA:** open DevTools → Network, check **Offline**, then click Verify on a valid
  bundle. It must still pass green. The only network entry permitted during the whole interaction is
  the one-time `.wasm`/`wasm_exec.js` asset load (cache it: a second Verify offline shows **zero**
  new requests). If any request to a node host appears, that is a release-blocking bug.

---

## QA matrix

Run `npm run dev` (and re-run under `npm run preview` for the production build):

- [ ] **Passes on a valid bundle:** clicking Verify on the genuine demo fixture shows the spinner,
      then green `✓ Verified offline.` with a chain hash.
- [ ] **Fails visibly on a tampered bundle:** flip one byte of `demo-evidence.json` (e.g. mutate a
      digest) and reload — Verify shows the amber `✕ Did not verify.` state with an honest reason.
      It must **never** render green over tampered data.
- [ ] **Works offline:** DevTools → Network → **Offline**; after the one-time asset load, Verify
      still passes green and issues **no** node request.
- [ ] **Both themes:** green success and amber failure states are legible and on-token in dark
      (default) and light; contrast ≥ 4.5:1 against `--ifx-surface`.
- [ ] **Reduced motion:** with `prefers-reduced-motion: reduce`, the spinner does not spin; progress
      is still conveyed (button label "Verifying…", `aria-busy`, live region).
- [ ] **Keyboard:** Tab to the button, activate with Enter and Space; visible green focus ring; the
      result is announced via the `aria-live` region (screen-reader check).
- [ ] **Single instantiation:** verify twice in a row — DevTools shows the `.wasm` fetched **once**
      (second click reuses the instantiated module).
- [ ] **Lazy load:** on first page load (before any click), the `.wasm` is **not** in the Network
      tab; it appears only after the first Verify click.
- [ ] **Walkthrough integration:** the runbook-03 canned `verify()` seam is gone;
      `<SpineWalkthrough>`'s payoff uses the real `<EvidenceVerifier>` with the shared `demoBundle`.

---

## Acceptance criteria (Definition of Done)

Meets the shared DoD in `00-overview.md` §9, specifically:

- `verifier.wasm` + its runtime glue are committed under `theme/assets/wasm/` (or CI-built from the
  pinned toolchain), with a `BUILD.md` recording the source commit + exact toolchain (Step 5c).
- `theme/data/verifier.ts` exposes the exact contract
  `verify(bundleJSON) => Promise<{ ok, chainHash?, reason? }>`, lazy + single-instantiation +
  timeout + fail-closed error handling.
- `<EvidenceVerifier>` ships the button → spinner → green-verified / amber-failed states, satisfies
  the **§7** a11y checklist (aria-live, keyboard, color-not-sole-signal, reduced-motion, both
  themes), and is registered globally.
- `<SpineWalkthrough>`'s canned seam is replaced by the real verifier fed a **genuine**
  `PortableEvidencePackage` fixture (Option 1) — or, only as a documented temporary fallback, the
  honest mock-flagged state (Option 2), never a false green.
- **§8 perf:** WASM is lazy-loaded on first click only; landing initial JS budget unaffected; size
  noted in the PR.
- **§6 no jargon leak:** all *visible* UI copy ("Verify this proof", "Verified offline.", "No node,
  no trust required.", "Did not verify.", error strings) is plain English — no `§`, no internal type
  names, no "WASM contract layer" phrasing.
- **Network-silent verification proven** (Step 6 offline QA pass).
- Fence green (`node --test docs-structure.test.mjs`), build green, `npm run preview` renders.

---

## Out of scope for this effort (so we don't gold-plate)

- Logo / wordmark, custom OG images, the **full** accessibility audit, broad motion polish, and
  fence hardening (the banned-jargon grep test) — **all runbook 06.**
- Building or restyling `<SpineWalkthrough>`, `<SpineDiagram>`, `<TypedTerminal>`, `<EvmContrast>`,
  `<PersonaCards>` — runbooks 02/03. This effort only *replaces the verify seam* inside the
  walkthrough.
- Local search, `<Term>` glossary, docs diagrams — runbook 04.
- A second verifier path: ship **one** (recommended Go). Do not maintain both Go and Rust artifacts
  unless a concrete need arises.
- Server-side / Node verification, the `@infrix/verify` npm package surface, or the assurance-ladder
  UI — out of scope; this is the in-browser flex only.

---

## Handoff notes for runbook 06

- `<EvidenceVerifier>` is a "done" surface — runbook 06's full a11y audit should re-check its
  `aria-live` announcements, focus order, and contrast, but the structure is stable.
- The green checkmark / verified motif is the **same** semantic as the spine's `--ifx-verified`
  CONFIRMATION color — runbook 06's logo (a line resolving into a checkmark, UX-REVIEW Part 6) can
  reuse this exact green token for visual continuity.
- The banned-jargon fence test runbook 06 adds must **not** flag this component's visible copy
  (already plain English) — but it should grep `theme/components/EvidenceVerifier.vue` and
  `data/verifier.ts` along with the public pages.
- Toolchain pin (`assets/wasm/BUILD.md`) and the `.wasm` reproducibility note are now part of the
  repo's release surface — runbook 06's "fence hardening" can optionally assert the `.wasm` +
  `BUILD.md` both exist so a future refactor can't drop the binary silently.
- Motion polish in 06 should leave the spinner's reduced-motion behavior intact (it is correct).
