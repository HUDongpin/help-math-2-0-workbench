import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertG678CompiledLocalQaConfiguration,
  isG678CompiledLocalQaEnabled,
  isG678LocalPreviewEnabled,
  isG678LocalPreviewRequestHeaders,
  isG678LocalPreviewRequestUrl,
  isG678SameOriginCanvasAssetRequest,
} from '../lib/g678-preview-policy';
import {hfrAssetRequest, hfrDocumentRequest} from '../lib/hfr-local-access';

const enabled = Object.freeze({
  NODE_ENV: 'production',
  HELP_MATH_G678_COMPILED_LOCAL_QA: '1',
  HELP_MATH_G678_LOCAL_PREVIEW: '1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
});
const origin = 'http://127.0.0.1:3331';
const id = 'shared-nms002-l07-p005';
const documentUrl = new URL(`${origin}/en/migration-status/g678-hfr/${id}/registered`);
const dataUrl = new URL(`${origin}/flash-assets/g678-local/${id}/hfr/${id}.data.json`);
const requestHeaders = () => new Headers({
  host: '127.0.0.1:3331', referer: `${origin}/en/migration-status/g678-course/nms002/7`,
  'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty',
});

test('compiled QA is distinct from default production and existing development opt-in', () => {
  assert.equal(isG678CompiledLocalQaEnabled(enabled), true);
  assert.equal(isG678LocalPreviewEnabled(enabled), true);
  assert.doesNotThrow(() => assertG678CompiledLocalQaConfiguration(enabled));
  for (const value of [undefined, '0']) {
    const environment = {...enabled, HELP_MATH_G678_COMPILED_LOCAL_QA: value};
    assert.equal(isG678CompiledLocalQaEnabled(environment), false);
    assert.equal(isG678LocalPreviewEnabled(environment), false);
    assert.equal(hfrDocumentRequest(documentUrl, requestHeaders(), 'GET', environment), null);
    assert.equal(hfrAssetRequest(dataUrl, requestHeaders(), 'GET', environment), null);
    assert.doesNotThrow(() => assertG678CompiledLocalQaConfiguration(environment));
  }
  const development = {...enabled, NODE_ENV: 'development', HELP_MATH_G678_COMPILED_LOCAL_QA: undefined};
  assert.equal(isG678CompiledLocalQaEnabled(development), false);
  assert.equal(isG678LocalPreviewEnabled(development), true);
  assert.ok(hfrDocumentRequest(documentUrl, requestHeaders(), 'GET', development));
});

test('cloud markers, invalid bind, missing opt-in, and wrong compilation mode fail closed', () => {
  const denied = [
    {...enabled, VERCEL: '1'}, {...enabled, VERCEL: '0'},
    {...enabled, VERCEL_ENV: 'preview'}, {...enabled, VERCEL_ENV: 'production'},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW_BIND: 'localhost'},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW_BIND: undefined},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW: undefined},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW: '0'},
    {...enabled, HELP_MATH_G678_COMPILED_LOCAL_QA: 'true'},
    {...enabled, NODE_ENV: 'development'}, {...enabled, NODE_ENV: undefined},
  ];
  for (const environment of denied) {
    assert.equal(isG678CompiledLocalQaEnabled(environment), false);
    assert.throws(() => assertG678CompiledLocalQaConfiguration(environment),
      /G678_COMPILED_QA_REQUIRES_PRODUCTION_LOOPBACK_NON_CLOUD_OPT_IN/);
    // An invalid compiled profile is rejected before Next starts. At request
    // time the valid development profile remains a separate supported path.
    if (environment.NODE_ENV === 'production') {
      assert.equal(isG678LocalPreviewEnabled(environment), false);
      assert.equal(hfrDocumentRequest(documentUrl, requestHeaders(), 'GET', environment), null);
      assert.equal(hfrAssetRequest(dataUrl, requestHeaders(), 'GET', environment), null);
    }
  }
});

test('compiled QA preserves exact local origin, host, fetch and lesson restrictions', () => {
  assert.ok(hfrDocumentRequest(documentUrl, requestHeaders(), 'GET', enabled));
  assert.equal(hfrDocumentRequest(new URL(documentUrl.href.replace('/registered', '/candidate')),
    requestHeaders(), 'GET', enabled), null);
  assert.ok(hfrAssetRequest(dataUrl, requestHeaders(), 'GET', enabled));
  assert.ok(hfrAssetRequest(dataUrl, requestHeaders(), 'HEAD', enabled));
  for (const method of ['POST', 'PUT', 'DELETE']) {
    assert.equal(hfrDocumentRequest(documentUrl, requestHeaders(), method, enabled), null);
    assert.equal(hfrAssetRequest(dataUrl, requestHeaders(), method, enabled), null);
  }
  for (const value of ['https://example.test', 'http://192.168.1.2:3331', 'https://127.0.0.1:3331']) {
    const remote = new URL(dataUrl.href.replace(origin, value));
    assert.equal(hfrAssetRequest(remote, requestHeaders(), 'GET', enabled), null);
  }
  for (const [key, value] of [
    ['host', 'www.helpmath.ai'], ['host', '127.0.0.1:3331,example.test'],
    ['x-forwarded-host', 'example.test'], ['x-forwarded-host', '127.0.0.1:3332'],
    ['referer', `${origin}/en/migration-status/g678-course/nms002/8`],
    ['referer', `${origin}/en/migration-status/g678-course/geo001/7`],
    ['referer', 'https://example.test/en/courses/6/nms002/7'],
    ['origin', 'http://localhost:3331'], ['sec-fetch-site', 'cross-site'],
    ['sec-fetch-dest', 'script'], ['range', 'bytes=0-5'],
  ]) {
    const headers = requestHeaders(); headers.set(key!, value!);
    assert.equal(hfrAssetRequest(dataUrl, headers, 'GET', enabled), null, `${key}: ${value}`);
  }
  for (const resource of [`${id}.bytecode.json`, `${id}.ts`, 'artifact-closure.json', 'media/%2e%2e/a.mp3']) {
    assert.equal(hfrAssetRequest(new URL(dataUrl.href.replace(`${id}.data.json`, resource)),
      requestHeaders(), 'GET', enabled), null, resource);
  }
  assert.equal(isG678LocalPreviewRequestUrl(new URL('https://www.helpmath.ai/en/courses/6/nms002/7'), enabled), false);
  assert.equal(isG678LocalPreviewRequestHeaders(new Headers({host: '127.0.0.1:3331',
    'x-forwarded-host': 'example.test'}), enabled), false);
});

test('NMS L7 source-canvas requests retain the existing same-origin script policy', () => {
  for (const page of ['004', '047', '051']) {
    const url = new URL(`${origin}/flash-assets/g678-local/shared-nms002-l07-p${page}/canvas-renderer.js?sha256=bound-by-resolver`);
    const headers = new Headers({origin, referer: `${origin}/en/courses/6/nms002/7`,
      'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'script'});
    assert.equal(isG678LocalPreviewRequestUrl(url, enabled), true);
    assert.equal(isG678SameOriginCanvasAssetRequest(headers, url), true);
    headers.set('sec-fetch-site', 'cross-site');
    assert.equal(isG678SameOriginCanvasAssetRequest(headers, url), false);
    assert.equal(isG678LocalPreviewRequestUrl(url, {...enabled, VERCEL_ENV: 'preview'}), false);
    assert.equal(isG678LocalPreviewRequestUrl(url, {...enabled, HELP_MATH_G678_COMPILED_LOCAL_QA: undefined}), false);
  }
});
