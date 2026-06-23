// Relocated docs-site fence (was pkg/intent/g21_docs_site_fence_test.go in the
// infrix-accumen monorepo). Locks the site scaffold so a refactor can't silently
// drop a canonical page, detach from vitepress, or lose the governance-first
// framing. VitePress does NOT validate themeConfig nav/sidebar targets, so a
// page that the sidebar links to but that does not exist is a silent 404 — this
// fence is what catches that.
//
//   node --test docs-structure.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const docs = join(root, 'docs');

// Every page reachable from the vitepress nav/sidebar MUST exist on disk.
const requiredPages = [
  'index.md',
  'getting-started.md',
  'governance-spine.md',
  'sdk/typescript-client.md',
  'sdk/typescript-wallet.md',
  'sdk/rust.md',
  'sdk/assemblyscript.md',
  'tutorials/first-intent.md',
  'tutorials/multi-party-trade.md',
  'tutorials/cross-domain-bridge.md',
  'cookbook/approval-policies.md',
  'cookbook/trust-profiles.md',
  'cookbook/offline-verification.md',
];

test('every nav/sidebar-linked page exists (no silent 404s)', () => {
  for (const p of requiredPages) {
    assert.ok(existsSync(join(docs, p)), `missing docs page: ${p}`);
  }
});

test('vitepress config is present and well-formed', () => {
  const cfg = join(docs, '.vitepress', 'config.mts');
  assert.ok(existsSync(cfg), 'missing docs/.vitepress/config.mts');
  const src = readFileSync(cfg, 'utf8');
  for (const marker of ['defineConfig', 'sidebar', 'Governance Spine']) {
    assert.ok(src.includes(marker), `vitepress config missing ${marker}`);
  }
});

test('landing page keeps the governance-first framing', () => {
  const src = readFileSync(join(docs, 'index.md'), 'utf8');
  for (const marker of ['governance-first', 'submitIntent', 'governance-spine']) {
    assert.ok(src.includes(marker), `index.md missing governance-first marker: ${marker}`);
  }
});
