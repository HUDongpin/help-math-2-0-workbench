import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {BACK_FORWARD_CACHEABLE_DOCUMENT, documentMayUseBackForwardCache, proxyForRequest} from '../proxy';

test('public documents are private, no-cache (bfcache-eligible, never shared-cached, always revalidated)', async () => {
  assert.equal(BACK_FORWARD_CACHEABLE_DOCUMENT, 'private, no-cache');
  for (const url of ['https://www.helpmath.ai/en', 'https://www.helpmath.ai/', 'https://www.helpmath.ai/es']) {
    const response = await proxyForRequest(new NextRequest(url));
    assert.equal(response.status, 200, url);
    assert.equal(response.headers.get('cache-control'), 'private, no-cache', url);
  }
});

test('assets, auth API, preview artifacts and 404s keep their existing policies', async () => {
  const asset = await proxyForRequest(new NextRequest('https://www.helpmath.ai/flash-assets/missing.svg'));
  assert.notEqual(asset.headers.get('cache-control'), 'private, no-cache');
  const blocked = await proxyForRequest(new NextRequest('https://www.helpmath.ai/about'));
  assert.notEqual(blocked.headers.get('cache-control'), 'private, no-cache');
  assert.equal(documentMayUseBackForwardCache({previewArtifact: true, public1751: false, localeFreeAsset: false, localeFreeAuthApi: false}), false);
  assert.equal(documentMayUseBackForwardCache({previewArtifact: false, public1751: false, localeFreeAsset: true, localeFreeAuthApi: false}), false);
  assert.equal(documentMayUseBackForwardCache({previewArtifact: false, public1751: false, localeFreeAsset: false, localeFreeAuthApi: true}), false);
});

test('the public 1751 build qualifies even though it carries the preview-build marker', () => {
  assert.equal(documentMayUseBackForwardCache({previewArtifact: true, public1751: true, localeFreeAsset: false, localeFreeAuthApi: false}), true);
  assert.equal(documentMayUseBackForwardCache({previewArtifact: true, public1751: true, localeFreeAsset: true, localeFreeAuthApi: false}), false);
});

test('the 1751 config rule skips dotted static files', async () => {
  const {readFile} = await import('node:fs/promises');
  const source = await readFile(new URL('../next.config.ts', import.meta.url), 'utf8');
  const match = /source: '(\/\(\(\?!api\/[^']+)',\n\s+headers: \[\{key: 'Cache-Control', value: 'private, no-cache'\}\]/u.exec(source);
  assert.ok(match, 'document cache rule present');
  const pattern = new RegExp(`^${match[1]}$`, 'u');
  for (const path of ['/', '/en', '/courses/3/2', '/es/courses/4/3']) assert.match(path, pattern, path);
  for (const path of ['/learning-theme-bootstrap.js', '/brand/help-math-2-logo.png', '/generated/x.json', '/opengraph-image.png', '/api/nova', '/flash-assets/a']) {
    assert.doesNotMatch(path, pattern, path);
  }
});
