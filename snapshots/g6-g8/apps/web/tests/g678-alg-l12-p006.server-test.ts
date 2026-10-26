import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {algL12P006Canvas} from '../lib/g678-alg-l12-p006.server';
import {isG678LocalPreviewRequestHeaders, isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest} from '../lib/g678-preview-policy';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const RUNTIME_BYTES = 11507597;
const testEnv: Record<string, string | undefined> = process.env;
const ASSET_URL = 'http://127.0.0.1:3134/flash-assets/g678-local/shared-alg001-l12-p006/canvas-renderer.js';
const digest = (bytes: Buffer | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

async function withPreviewEnv(run: () => Promise<void>) {
  const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
    'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    testEnv.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    process.env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    process.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of keys) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else testEnv[key] = value;
    }
  }
}

function request(url = `${ASSET_URL}?sha256=${RUNTIME_SHA}`,
  overrides: Record<string, string> = {}) {
  return new Request(url, {headers: {
    host: '127.0.0.1:3134',
    referer: 'http://127.0.0.1:3134/en/migration-status/g678-calibration/shared-alg001-l12-p006',
    origin: 'http://127.0.0.1:3134',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'script',
    ...overrides,
  }});
}

test('P006 physical source and private candidate-v2 bytes match mask evidence', () => {
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT);
  assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
  const sourcePath = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/RW/L12RW06.swf`;
  assert.equal(realpathSync(sourcePath), sourcePath);
  assert.equal(lstatSync(sourcePath).nlink, 1);
  const source = readFileSync(sourcePath);
  assert.equal(source.length, 708053);
  assert.equal(digest(source), SOURCE_SHA);
  const runtimePath = new URL(
    '../../../migrations/shared-alg001-l12-p006/candidate-v2/canvas-renderer.js',
    import.meta.url);
  assert.equal(realpathSync(runtimePath), fileURLToPath(runtimePath));
  assert.equal(lstatSync(runtimePath).nlink, 1);
  const runtime = readFileSync(runtimePath);
  assert.equal(runtime.length, RUNTIME_BYTES);
  assert.equal(digest(runtime), RUNTIME_SHA);
  assert.equal(existsSync(new URL(
    '../public/flash-assets/g678-local/shared-alg001-l12-p006/canvas-renderer.js',
    import.meta.url)), false);
  const manifest = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-alg001-l12-p006/candidate-v2/mask-manifest.json',
    import.meta.url), 'utf8'));
  assert.equal(manifest.animationId, 'shared-alg001-l12-p006');
  assert.equal(manifest.status, 'unregistered-mask-corrected-drawing-candidate');
  assert.equal(manifest.sourceSha256, SOURCE_SHA);
  assert.equal(manifest.runtimeSha256, RUNTIME_SHA);
  assert.equal(manifest.runtimeBytes, RUNTIME_BYTES);
  assert.deepEqual(manifest.maskAudit.uses.map((mask: {
    characterId: string; depth: string; clipDepth: string;
  }) => [mask.characterId, mask.depth, mask.clipDepth]), [
    ['1', '1', '62'], ['43', '18', '29'], ['52', '18', '29'],
  ]);
  assert.equal(manifest.browserValidated, false);
  assert.equal(manifest.registered, false);
  assert.equal(manifest.audioAccepted, false);
  assert.equal(manifest.strictComplete, false);
});

test('P006 route binds exact v2 private bytes and restrictive response headers', async () => {
  await withPreviewEnv(async () => {
    const asset = algL12P006Canvas();
    assert.equal(asset.bytes.length, RUNTIME_BYTES);
    assert.equal(asset.sha256, RUNTIME_SHA);
    assert.equal(digest(asset.bytes), RUNTIME_SHA);
    const route = readFileSync(new URL(
      '../app/flash-assets/g678-local/shared-alg001-l12-p006/canvas-renderer.js/route.ts',
      import.meta.url), 'utf8');
    assert.match(route, /algL12P006Canvas\(\)/u);
    assert.match(route, /isG678LocalPreviewRequestUrl\(url\)/u);
    assert.match(route, /isG678LocalPreviewRequestHeaders\(request\.headers\)/u);
    assert.match(route, /isG678SameOriginCanvasAssetRequest\(request\.headers, url\)/u);
    assert.match(route, /query\.length !== 1/u);
    assert.match(route, /query\[0\]\?\.\[0\] !== 'sha256'/u);
    assert.match(route, /query\[0\]\?\.\[1\] !== RUNTIME_SHA/u);
    assert.ok(route.includes(RUNTIME_SHA));
    assert.match(route, /runtime\.sha256 !== RUNTIME_SHA/u);
    assert.match(route, /runtime\.bytes\.length !== RUNTIME_BYTES/u);
    assert.match(route, /private, no-store, max-age=0/u);
    assert.match(route, /same-origin/u);
    assert.match(route, /nosniff/u);
    assert.match(route, /noindex, nofollow, noarchive, noimageindex/u);
  });
});

test('P006 route policy and source reader reject foreign requests and unavailable source', async () => {
  await withPreviewEnv(async () => {
    const good = request();
    assert.equal(isG678LocalPreviewRequestUrl(new URL(good.url)), true);
    assert.equal(isG678LocalPreviewRequestHeaders(good.headers), true);
    assert.equal(isG678SameOriginCanvasAssetRequest(good.headers,
      new URL(good.url)), true);
    const crossSite = request(undefined, {'sec-fetch-site': 'cross-site'});
    assert.equal(isG678SameOriginCanvasAssetRequest(crossSite.headers,
      new URL(crossSite.url)), false);
    const foreignOrigin = request(undefined, {origin: 'https://example.com'});
    assert.equal(isG678SameOriginCanvasAssetRequest(foreignOrigin.headers,
      new URL(foreignOrigin.url)), false);
    const foreignReferer = request(undefined, {referer: 'https://example.com/'});
    assert.equal(isG678SameOriginCanvasAssetRequest(foreignReferer.headers,
      new URL(foreignReferer.url)), false);
    const foreignHost = request(undefined, {host: 'helpmath.ai'});
    assert.equal(isG678LocalPreviewRequestHeaders(foreignHost.headers), false);
    assert.equal(isG678LocalPreviewRequestUrl(new URL(
      `https://helpmath.ai/flash-assets/g678-local/shared-alg001-l12-p006/canvas-renderer.js?sha256=${RUNTIME_SHA}`)), false);
    process.env.HELP_MATH_G678_SOURCE_ROOT = '/nonexistent';
    assert.throws(() => algL12P006Canvas(), /P006 local source required/u);
    process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    testEnv.NODE_ENV = 'production';
    assert.equal(isG678LocalPreviewRequestUrl(new URL(good.url)), false);
    assert.throws(() => algL12P006Canvas(), /P006 local source required/u);
    testEnv.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'preview';
    assert.equal(isG678LocalPreviewRequestUrl(new URL(good.url)), false);
    assert.throws(() => algL12P006Canvas(), /P006 local source required/u);
  });
});
