// W.CONTEXT.HOSTED.DEREFERENCES: the hosted Infrix DID context is the pinned, immutable document and
// the nginx rule serves it with the right media type and content negotiation.
//
//   node --test ns-context.test.mjs
//
// infrix core pins the same SHA-256 (pkg/did context_test.go and pkg/zkp/vc/dataintegrity). If the
// bytes under docs/public/ns/did/v1.jsonld change, this test fails here and core fails there: the URL
// is versioned, so a change is a new version at a new URL, never an edit of v1.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const PINNED = 'aaad098874fa0984e29a84bca5a1e52048bd54936513585e74f425bd1f530247';
const context = readFileSync(join(root, 'docs/public/ns/did/v1.jsonld'));
const nginx = readFileSync(join(root, 'deploy/nginx/ns-did-v1.conf'), 'utf8');
const page = readFileSync(join(root, 'docs/ns/did/v1.md'), 'utf8');

test('the hosted context bytes are the pinned v1 document', () => {
  assert.equal(createHash('sha256').update(context).digest('hex'), PINNED);
});

test('PLANTED DEFECT: one extra byte changes the digest, so an edited context is refused', () => {
  const edited = Buffer.concat([context, Buffer.from(' ')]);
  assert.notEqual(createHash('sha256').update(edited).digest('hex'), PINNED);
});

test('the context is a JSON-LD context defining every private term core emits', () => {
  const doc = JSON.parse(context.toString('utf8'));
  for (const term of ['AccumulateKeyPage', 'AccumulateKeyPageProof', 'keyPageUrl', 'keyBookUrl', 'pageIndex', 'threshold',
    'CredentialRegistry', 'LinkedData', 'InfrixContract', 'InfrixAPI', 'description']) {
    assert.ok(term in doc['@context'], `term ${term} is undefined in the hosted context`);
  }
});

test('the nginx rule serves application/ld+json, negotiates on Accept, and is immutable', () => {
  assert.match(nginx, /location = \/ns\/did\/v1 \{/);
  assert.match(nginx, /default_type application\/ld\+json;/);
  assert.match(nginx, /add_header Vary "Accept" always;/);
  assert.match(nginx, /Cache-Control "public, max-age=31536000, immutable"/);
  assert.match(nginx, /"~\*text\/html"\s+\/ns\/did\/v1\.html;/);
  assert.match(nginx, /default\s+\/ns\/did\/v1\.jsonld;/);
});

test('PLANTED DEFECT: a rule that served HTML by default or dropped Vary would not pass these checks', () => {
  const htmlDefault = nginx.replace(/default\s+\/ns\/did\/v1\.jsonld;/, 'default /ns/did/v1.html;');
  assert.doesNotMatch(htmlDefault, /default\s+\/ns\/did\/v1\.jsonld;/);
  const noVary = nginx.replace('add_header Vary "Accept" always;', '');
  assert.doesNotMatch(noVary, /add_header Vary "Accept" always;/);
});

test('the human page names the pinned digest and links the raw document', () => {
  assert.ok(page.includes(PINNED));
  assert.ok(page.includes('/ns/did/v1.jsonld'));
});
