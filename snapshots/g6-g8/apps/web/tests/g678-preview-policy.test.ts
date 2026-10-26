import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {
  isG678CalibrationAssetPath,
  isG678CalibrationProductPath,
  isG678LocalPreviewEnabled,
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest,
  isG678ModuleCode,
  isG678ModuleCoursePath,
} from '../lib/g678-preview-policy';
import {proxyForRequest} from '../proxy';

async function withEnvironment<T>(
  values: Readonly<Record<string, string | undefined>>,
  callback: () => Promise<T>,
) {
  const original = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    return await callback();
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

test('G6-G8 module route policy is narrow and module-aware', () => {
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002/1'), true);
  assert.equal(isG678ModuleCoursePath('/courses/8/DAT001/08'), true);
  assert.equal(isG678ModuleCoursePath('/courses/5/nms002/1'), false);
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002'), false);
  assert.equal(isG678ModuleCoursePath('/courses/6/nms002/1/extra'), false);
  assert.equal(isG678ModuleCode('NMS002'), true);
  assert.equal(isG678ModuleCode('XYZ999'), false);
});

test('G6-G8 calibration product paths accept only canonical placement identities', () => {
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-nms002-l01-p001',
  ), true);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-geo001-l06-p002/host',
  ), true);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-geo001-l07-p003-candidate',
  ), true);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-dat001-l02-p002-candidate',
  ), true);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-dat001-l02-p002-candidate/extra',
  ), false);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-geo001-l07-p003-candidate/extra',
  ), false);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-geo001-l06-p002/host/extra',
  ), false);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/shared-xyz999-l01-p001',
  ), false);
  assert.equal(isG678CalibrationProductPath(
    '/migration-status/g678-calibration/../../source',
  ), false);
  assert.equal(isG678CalibrationAssetPath(
    '/flash-assets/g678-local/shared-dat001-l05-p040/canvas-renderer.js',
  ), true);
  assert.equal(isG678CalibrationAssetPath(
    '/flash-assets/g678-local/shared-dat001-l05-p040/member-manifest.json',
  ), false);
});

test('G6-G8 local preview requires an explicit non-production opt-in', () => {
  assert.equal(isG678LocalPreviewEnabled({NODE_ENV: 'development'}), false);
  assert.equal(isG678LocalPreviewEnabled({
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  }), true);
  assert.equal(isG678LocalPreviewEnabled({
    NODE_ENV: 'production',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  }), false);
  assert.equal(isG678LocalPreviewEnabled({
    NODE_ENV: 'development',
    VERCEL_ENV: 'preview',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  }), false);
  const enabled = {
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  };
  assert.equal(isG678LocalPreviewRequestUrl(
    new URL('http://127.0.0.1:3317/local'), enabled,
  ), true);
  assert.equal(isG678LocalPreviewRequestUrl(
    new URL('http://localhost:3317/local'), enabled,
  ), true);
  assert.equal(isG678LocalPreviewRequestUrl(
    new URL('http://192.168.1.20:3317/local'), enabled,
  ), false);
  assert.equal(isG678LocalPreviewRequestHeaders(new Headers({
    host: '127.0.0.1:3317',
  }), enabled), true);
  assert.equal(isG678LocalPreviewRequestHeaders(new Headers({
    host: '127.0.0.1:3317',
    'x-forwarded-host': 'www.helpmath.ai',
  }), enabled), false);
  const localAssetUrl = new URL(
    'http://127.0.0.1:3317/flash-assets/g678-local/example.js',
  );
  assert.equal(isG678SameOriginCanvasAssetRequest(new Headers({
    origin: 'http://127.0.0.1:3317',
    referer: 'http://127.0.0.1:3317/local-page',
    'sec-fetch-dest': 'script',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  }), localAssetUrl), true);
  assert.equal(isG678SameOriginCanvasAssetRequest(new Headers({
    referer: 'https://evil.example/attack',
    'sec-fetch-dest': 'script',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'cross-site',
  }), localAssetUrl), false);
});

test('proxy hard-closes calibration product and asset paths without local opt-in', async () => {
  const product = 'https://www.helpmath.ai/en/migration-status/' +
    'g678-calibration/shared-nms002-l01-p001';
  const asset = 'https://www.helpmath.ai/flash-assets/g678-local/' +
    'shared-nms002-l01-p001/canvas-renderer.js';
  for (const environment of [
    {NODE_ENV: 'production', HELP_MATH_G678_LOCAL_PREVIEW: 'true'},
    {NODE_ENV: 'development', HELP_MATH_G678_LOCAL_PREVIEW: undefined},
  ]) {
    await withEnvironment(environment, async () => {
      assert.equal((await proxyForRequest(new NextRequest(product))).status, 404);
      assert.equal((await proxyForRequest(new NextRequest(asset))).status, 404);
    });
  }
  await withEnvironment({
    NODE_ENV: 'development',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  }, async () => {
    assert.equal((await proxyForRequest(new NextRequest(product))).status, 404);
    assert.equal((await proxyForRequest(new NextRequest(asset))).status, 404);
    const localProduct = product.replace(
      'https://www.helpmath.ai', 'http://127.0.0.1:3317',
    );
    const localAsset = asset.replace(
      'https://www.helpmath.ai', 'http://127.0.0.1:3317',
    );
    const productResponse = await proxyForRequest(new NextRequest(localProduct));
    const sameOriginScriptHeaders = {
      origin: 'http://127.0.0.1:3317',
      referer: 'http://127.0.0.1:3317/en/migration-status/' +
        'g678-calibration/shared-nms002-l01-p001',
      'sec-fetch-dest': 'script',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
    };
    const assetResponse = await proxyForRequest(new NextRequest(localAsset, {
      headers: sameOriginScriptHeaders,
    }));
    assert.equal(productResponse.status, 200);
    assert.equal(assetResponse.status, 200);
    assert.equal(productResponse.headers.get('x-robots-tag'),
      'noindex, nofollow, noarchive');
    assert.equal(productResponse.headers.get('cache-control'),
      'private, no-store, max-age=0');
    assert.equal((await proxyForRequest(new NextRequest(localAsset, {
      headers: {
        ...sameOriginScriptHeaders,
        referer: 'https://evil.example/attack',
        'sec-fetch-site': 'cross-site',
      },
    }))).status, 404);
  });
  await withEnvironment({
    NODE_ENV: 'development',
    VERCEL_ENV: 'preview',
    HELP_MATH_G678_LOCAL_PREVIEW: 'true',
    HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
  }, async () => {
    const localProduct = product.replace(
      'https://www.helpmath.ai', 'http://127.0.0.1:3317',
    );
    const localAsset = asset.replace(
      'https://www.helpmath.ai', 'http://127.0.0.1:3317',
    );
    assert.equal((await proxyForRequest(
      new NextRequest(localProduct)
    )).status, 404);
    assert.equal((await proxyForRequest(
      new NextRequest(localAsset)
    )).status, 404);
  });
});
