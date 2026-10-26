import assert from 'node:assert/strict';
import {test} from 'node:test';
import {NextRequest} from 'next/server';
import LAYOUT from '../../../migrations/shared-dat001-l02-p002/audit/source-visual-layout-v1.json';
import {DAT_L02_P002_SYMBOL_PREFIX, isDatL02P002SymbolRequest} from
  '../lib/dat-l02-p002-symbol-access';
import {proxyForRequest} from '../proxy';

const origin = 'http://127.0.0.1:3318';
const sha = LAYOUT.symbols[0]!.sha256!;
const env = {
  NODE_ENV: 'development',
  HELP_MATH_G678_LOCAL_PREVIEW: 'true',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND: '127.0.0.1',
};
function candidate() {
  return {
    method: 'GET',
    url: new URL(`${origin}${DAT_L02_P002_SYMBOL_PREFIX}${sha}`),
    headers: new Headers({
      host: '127.0.0.1:3318',
      referer: `${origin}/en/migration-status/g678-calibration/shared-dat001-l02-p002-candidate`,
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-dest': 'image',
    }),
  };
}

test('P002 SVG transport admits only exact candidate image requests', () => {
  assert.equal(isDatL02P002SymbolRequest(candidate(), env), true);
  const spanish = candidate();
  spanish.headers.set('referer', `${origin}/es/migration-status/g678-calibration/shared-dat001-l02-p002-candidate`);
  assert.equal(isDatL02P002SymbolRequest(spanish, env), true);
  for (const patch of [
    {NODE_ENV: 'production'}, {VERCEL_ENV: 'preview'},
    {HELP_MATH_G678_LOCAL_PREVIEW: undefined},
    {HELP_MATH_G678_LOCAL_PREVIEW_BIND: '0.0.0.0'},
  ]) assert.equal(isDatL02P002SymbolRequest(candidate(), {...env, ...patch}), false);
  for (const [name, value] of [
    ['host', 'example.com:3318'],
    ['x-forwarded-host', 'example.com'],
    ['referer', 'https://evil.example/page'],
    ['origin', 'https://evil.example'],
    ['sec-fetch-site', 'cross-site'],
    ['sec-fetch-mode', 'navigate'],
    ['sec-fetch-dest', 'document'],
    ['range', 'bytes=0-10'],
  ]) {
    const request = candidate(); request.headers.set(name!, value!);
    assert.equal(isDatL02P002SymbolRequest(request, env), false, name);
  }
  for (const method of ['HEAD', 'POST']) {
    const request = candidate(); request.method = method;
    assert.equal(isDatL02P002SymbolRequest(request, env), false);
  }
  for (const pathname of [`${DAT_L02_P002_SYMBOL_PREFIX}${sha}/extra`,
    `${DAT_L02_P002_SYMBOL_PREFIX}nope`]) {
    const request = candidate(); request.url.pathname = pathname;
    assert.equal(isDatL02P002SymbolRequest(request, env), false);
  }
  const query = candidate(); query.url.searchParams.set('extra', '1');
  assert.equal(isDatL02P002SymbolRequest(query, env), false);
});

test('proxy blocks P002 SVGs before generic local flash-asset fallback', async () => {
  const previous = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]));
  try {
    Object.assign(process.env, env);
    const allowed = candidate();
    assert.equal((await proxyForRequest(new NextRequest(allowed.url, {
      headers: allowed.headers,
    }))).status, 200);
    const denied = candidate(); denied.headers.set('sec-fetch-site', 'cross-site');
    assert.equal((await proxyForRequest(new NextRequest(denied.url, {
      headers: denied.headers,
    }))).status, 404);
    Reflect.set(process.env, 'NODE_ENV', 'production');
    assert.equal((await proxyForRequest(new NextRequest(allowed.url, {
      headers: allowed.headers,
    }))).status, 404);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
