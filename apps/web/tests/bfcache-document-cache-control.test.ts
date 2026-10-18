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
  assert.equal(documentMayUseBackForwardCache({previewArtifact: true, localeFreeAsset: false, localeFreeAuthApi: false}), false);
  assert.equal(documentMayUseBackForwardCache({previewArtifact: false, localeFreeAsset: true, localeFreeAuthApi: false}), false);
  assert.equal(documentMayUseBackForwardCache({previewArtifact: false, localeFreeAsset: false, localeFreeAuthApi: true}), false);
});
