# Vendored offline verifier — provenance

`portableVerifier.js` and `canonicalJson.js` are the **canonical browser-side Infrix
proof verifier** — a byte-exact JS mirror of the Go `pkg/evidence/portable.go::VerifyPortablePackage`,
held to parity with the Go verifier by a test in the source package. They run the full
10-check cryptographic verification **entirely in the browser, with no Infrix node and no
network call** (SHA-256 via the Web Crypto `crypto.subtle` API).

This is the same verifier the `infrix verify` CLI and the Infrix Nexus playground run
client-side — so a proof verified on this site is verified the way anyone else would.

## Source

- Package: **`@infrix/verify`** (MIT), `packages/verify/src/`
- Repo: `github.com/opendlt/infrix-sdk-js`
- Vendored from local checkout at commit **`db2bfcabe0ee5dafd2feb16ebaaab48d286bd964`**
- Files copied verbatim (do not edit here): `portableVerifier.js`, `canonicalJson.js`
- Fixture: `src/portable-fixture.valid.json` → `theme/data/demo-evidence.json`
  (a real, valid `PortableEvidencePackage` version "4" that verifies green)

## Why vendored (not an npm dependency)

`@infrix/verify` is pure ESM with zero runtime dependencies (only the Web Crypto API).
Vendoring the two files keeps `npm ci && npm run build` fully self-contained — the static
Pages build needs no extra registry dependency — which mirrors the "commit the artifact,
self-contained build" principle in runbook 05 §5d. To update: re-copy from the source
package at a newer commit and re-run the fixture check (see runbook 05 QA).

## Update / re-vendor

```bash
V=../infrix-sdk-js/packages/verify   # adjust to your checkout
cp "$V/src/portableVerifier.js" "$V/src/canonicalJson.js" docs/.vitepress/theme/lib/verify/
cp "$V/src/portable-fixture.valid.json" docs/.vitepress/theme/data/demo-evidence.json
# then re-run the parity/fixture check and bump the commit SHA above
```
