import assert from 'node:assert/strict';
import {test} from 'node:test';
import {NextRequest} from 'next/server';

import {ALG_L12_P006_ADMISSION_PATH, isAlgL12P006AdmissionPath,
  isAlgL12P006AdmissionRequest} from '../lib/g678-alg-l12-p006-admission-access';
import {isG678CalibrationProductPath} from '../lib/g678-preview-policy';
import {proxyForRequest} from '../proxy';

const enabled = Object.freeze({NODE_ENV: 'development',
  HELP_MATH_G678_LOCAL_PREVIEW: 'true', HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1'});
const request = (pathname = ALG_L12_P006_ADMISSION_PATH, method = 'GET',
  hostname = '127.0.0.1') => ({pathname, method, url: {hostname}});

test('the engineering entry accepts only the exact named route and preserves placement classification', () => {
  assert(isAlgL12P006AdmissionPath(ALG_L12_P006_ADMISSION_PATH));
  assert.equal(isG678CalibrationProductPath(ALG_L12_P006_ADMISSION_PATH), false);
  for (const pathname of [
    `${ALG_L12_P006_ADMISSION_PATH}/extra`, `${ALG_L12_P006_ADMISSION_PATH}/`,
    `${ALG_L12_P006_ADMISSION_PATH}?admission=1`, ALG_L12_P006_ADMISSION_PATH.toUpperCase(),
    '/migration-status/g678-calibration/shared-alg001-l12-p005-admission',
    '/migration-status/g678-calibration/shared-alg001-l12-p006',
    '/migration-status/g678-calibration/shared-nms002-l12-p006-admission',
  ]) assert.equal(isAlgL12P006AdmissionPath(pathname), false, pathname);
});

test('admission access requires the existing local opt-in, loopback and read methods', () => {
  for (const hostname of ['127.0.0.1', 'localhost', '[::1]']) {
    for (const method of ['GET', 'HEAD']) assert(isAlgL12P006AdmissionRequest(
      request(ALG_L12_P006_ADMISSION_PATH, method, hostname), enabled));
  }
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
    assert.equal(isAlgL12P006AdmissionRequest(request(ALG_L12_P006_ADMISSION_PATH, method), enabled), false);
  for (const hostname of ['www.helpmath.ai', '192.168.1.20', '127.0.0.1.evil.example'])
    assert.equal(isAlgL12P006AdmissionRequest(request(ALG_L12_P006_ADMISSION_PATH, 'GET', hostname), enabled), false);
  for (const env of [{}, {...enabled, NODE_ENV: 'production'}, {...enabled, VERCEL_ENV: 'preview'},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW: undefined},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'}])
    assert.equal(isAlgL12P006AdmissionRequest(request(), env), false);
});

async function withEnvironment(values: Readonly<Record<string, string | undefined>>,
  run: () => Promise<void>) {
  const prior = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
    await run();
  } finally {
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) Reflect.deleteProperty(process.env, key);
      else Reflect.set(process.env, key, value);
    }
  }
}

test('the request proxy reaches only the guarded engineering route with noindex/no-store', async () => {
  await withEnvironment({...enabled, VERCEL_ENV: undefined}, async () => {
    for (const locale of ['en', 'es']) {
      const url = `http://127.0.0.1:3317/${locale}${ALG_L12_P006_ADMISSION_PATH}`;
      for (const method of ['GET', 'HEAD']) {
        const response = await proxyForRequest(new NextRequest(url, {method}));
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('x-middleware-next'), '1');
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
        assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
      }
      assert.equal((await proxyForRequest(new NextRequest(url, {method: 'POST'}))).status, 404);
      assert.equal((await proxyForRequest(new NextRequest(`${url}/extra`))).status, 404);
      assert.equal((await proxyForRequest(new NextRequest(url.replace('-p006-admission', '-p005-admission')))).status, 404);
      assert.equal((await proxyForRequest(new NextRequest(url.replace('127.0.0.1:3317', 'www.helpmath.ai')))).status, 404);
    }
    // Existing ordinary placement entries retain their original classification.
    const formal = `http://127.0.0.1:3317/en${ALG_L12_P006_ADMISSION_PATH.replace('-admission', '')}`;
    assert.equal((await proxyForRequest(new NextRequest(formal))).status, 200);
  });
  for (const environment of [{...enabled, NODE_ENV: 'production', VERCEL_ENV: undefined},
    {...enabled, VERCEL_ENV: 'preview'},
    {...enabled, HELP_MATH_G678_LOCAL_PREVIEW: undefined, VERCEL_ENV: undefined}]) {
    await withEnvironment(environment, async () => {
      const url = `http://127.0.0.1:3317/en${ALG_L12_P006_ADMISSION_PATH}`;
      assert.equal((await proxyForRequest(new NextRequest(url))).status, 404);
    });
  }
});
