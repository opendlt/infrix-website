# Security advisories — accepted exceptions

This repo builds a **static** documentation site. The advisories below all live
in VitePress's transitive **dev-server** dependency chain (Vite / esbuild /
launch-editor). The production artifact is the static `vitepress build` output
deployed to GitHub Pages — **no dev server runs in production**, so the exploit
surface for each of these is not present in the deployed site. They are accepted
under an explicit allow-list (mirrored in `.github/workflows` if/when an
`npm audit` gate is added) until a patched stable VitePress chain ships.

| GHSA | Package (path) | Severity | Why it does not affect the deployed site |
| --- | --- | --- | --- |
| GHSA-67mh-4wv8-2f99 | esbuild (vitepress → vite → esbuild) | moderate | Dev-server cross-origin response leak. Production is static HTML; no dev server. |
| GHSA-4w7w-66w2-5vf9 | vite (vitepress → vite) | moderate | Path traversal in `.map` handling — dev-server only. Production is static HTML. |
| GHSA-fx2h-pf6j-xcff | vite (vitepress → vite) | high | `server.fs.deny` bypass on Windows UNC paths — dev-server only; static production; authors use trusted networks. |
| GHSA-v6wh-96g9-6wx3 | launch-editor (vitepress → vite → launch-editor) | moderate | NTLMv2 hash disclosure via UNC path — a dev-server editor feature; not in production. |

VitePress 1.6.4 pins this chain; there is no non-major upgrade that clears these
without moving to the (alpha) VitePress 2.x line. Re-review when VitePress 2.x is
stable, or sooner if any advisory gains a production-affecting vector.

_Next review: 2026-09-20._
