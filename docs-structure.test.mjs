// Relocated docs-site fence (was pkg/intent/g21_docs_site_fence_test.go in the
// infrix-accumen monorepo). Locks the site scaffold so a refactor can't silently
// drop a canonical page, detach from vitepress, lose the governance-first
// framing, drop a brand/theme file, or leak internal jargon onto a public page.
//
//   node --test docs-structure.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

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

// ---- Runbook 06 additions ------------------------------------------------

// (a) The canonical brand/theme scaffold + components (00-overview §2 file tree,
//     built across runbooks 01–06) must exist — a refactor can't silently drop them.
const requiredThemeFiles = [
  '.vitepress/theme/index.ts',
  '.vitepress/theme/styles/tokens.css',
  '.vitepress/theme/styles/base.css',
  '.vitepress/theme/styles/utilities.css',
  '.vitepress/theme/components/SpineDiagram.vue',
  '.vitepress/theme/components/SpineWalkthrough.vue',
  '.vitepress/theme/components/TypedTerminal.vue',
  '.vitepress/theme/components/EvmContrast.vue',
  '.vitepress/theme/components/PersonaCards.vue',
  '.vitepress/theme/components/EvidenceVerifier.vue',
  '.vitepress/theme/components/Term.vue',
  '.vitepress/theme/data/spine.ts',
  '.vitepress/theme/lib/verify/portableVerifier.js',
  '.vitepress/theme/assets/logo/mark.svg',
  '.vitepress/theme/assets/logo/lockup.svg',
  'public/og/og-default.png',
  'public/favicon.svg',
];

test('canonical theme/brand files exist (scaffold not silently dropped)', () => {
  for (const f of requiredThemeFiles) {
    assert.ok(existsSync(join(docs, f)), `missing theme/brand file: ${f}`);
  }
});

// (b) No internal jargon may leak onto a PUBLISHED page. Two tiers (00-overview §6):
//
//   ALWAYS-BANNED — never legitimate on a public page, in prose OR code:
//     §-section refs, and the internal marketing phrases the rewrite replaced.
//
//   PROSE-BANNED — real API type names. Legitimate ONLY inside code blocks / inline
//     code in deep-reference docs ("may appear in deep reference docs only when
//     defined inline" — 00-overview §6). Banned in human prose. We strip fenced
//     code and inline-code spans, then check the remaining prose.
//
// Scans every docs/**/*.md EXCEPT docs/design/** (planning material — srcExclude'd,
// and it defines the banned list) and .vitepress/.
const ALWAYS_BANNED = [
  '§',
  'load-bearing primitives',
  'execution fabric',
  'pluralistic plugin registry',
];
const PROSE_BANNED = [
  'DisclosureContext',
  'UnifiedStepParams',
  'TypeOutcomeRecord',
  'GetWithActor',
];

/** Remove fenced code blocks and inline-code spans, leaving human prose. */
function stripCode(md) {
  return md
    .replace(/```[\s\S]*?```/g, '')   // fenced blocks
    .replace(/~~~[\s\S]*?~~~/g, '')   // alt fences
    .replace(/`[^`]*`/g, '');         // inline code
}

function publishedMarkdown(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(docs, full);
    if (rel.split(sep)[0] === 'design') continue;          // planning tree (not shipped)
    if (rel.split(sep).includes('.vitepress')) continue;   // build/theme dir
    const st = statSync(full);
    if (st.isDirectory()) out.push(...publishedMarkdown(full));
    else if (name.endsWith('.md')) out.push(full);
  }
  return out;
}

test('no banned internal jargon leaks onto any published page', () => {
  const pages = publishedMarkdown(docs);
  assert.ok(
    pages.length >= requiredPages.length,
    `expected to scan at least ${requiredPages.length} published pages, found ${pages.length}`,
  );
  const offenders = [];
  for (const file of pages) {
    const raw = readFileSync(file, 'utf8');
    const prose = stripCode(raw);
    for (const token of ALWAYS_BANNED) {
      if (raw.includes(token)) {
        offenders.push(`${relative(docs, file)} :: banned-everywhere token "${token}"`);
      }
    }
    for (const token of PROSE_BANNED) {
      if (prose.includes(token)) {
        offenders.push(
          `${relative(docs, file)} :: internal type name "${token}" in prose ` +
            `(allowed only inside code/backticks)`,
        );
      }
    }
  }
  assert.equal(
    offenders.length,
    0,
    `banned jargon leaked onto published pages:\n  ${offenders.join('\n  ')}`,
  );
});
