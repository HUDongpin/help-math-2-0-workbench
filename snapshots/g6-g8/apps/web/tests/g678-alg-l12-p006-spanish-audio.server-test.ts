import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {algL12P006SpanishAudio} from '../lib/g678-alg-l12-p006-spanish-audio.server';
import {GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p006/spanish-audio/route';

const ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const env: Record<string, string | undefined> = process.env;
const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;

async function withEnvironment(run: () => void | Promise<void>) {
  const saved = Object.fromEntries(keys.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = ROOT;
    await run();
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete env[key]; else env[key] = saved[key];
    }
  }
}

test('P006 optional SA reader binds lesson, page and separate MP3 without calling it accepted Spanish narration', async () => {
  await withEnvironment(() => {
    const first = algL12P006SpanishAudio();
    assert.equal(first.bytes.length, 214704);
    assert.equal(first.sha256, '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf');
    assert.equal(createHash('sha256').update(first.bytes).digest('hex'), first.sha256);
    assert.equal(first.intendedRole, 'explicit-spanish-audio-control');
    assert.equal(first.spokenLanguageVerified, false);
    first.bytes.fill(0);
    const second = algL12P006SpanishAudio();
    assert.equal(createHash('sha256').update(second.bytes).digest('hex'), second.sha256,
      'callers cannot mutate the source or a shared cached buffer');
  });
});

test('P006 optional SA reader fails closed for missing opt-in, wrong bind/root, production and provider environments', async () => {
  const denied: Array<[typeof keys[number], string | undefined]> = [
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', 'false'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
    ['HELP_MATH_G678_SOURCE_ROOT', ROOT + '/.'],
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
  ];
  for (const [key, value] of denied) await withEnvironment(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => algL12P006SpanishAudio(), /P006 SA local source and opt-in required/);
    assert.equal((await GET(request())).status, 404);
  });
});

const SHA = '86fdbdeb0fec8cd6b9682d75ec436e4db370d56ba23e48efc47cf00c374c64bf';
const URL = `http://127.0.0.1:43218/flash-assets/g678-local/shared-alg001-l12-p006/spanish-audio?sha256=${SHA}`;
function request(url = URL, overrides: Record<string, string> = {}) {
  return new Request(url, {headers: {host: '127.0.0.1:43218',
    referer: 'http://127.0.0.1:43218/es/migration-status/g678-calibration/shared-alg001-l12-p006',
    origin: 'http://127.0.0.1:43218', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty', ...overrides}});
}

test('optional SA route returns only exact source bytes with private headers', async () => {
  await withEnvironment(async () => {
    for (const req of [request(), request(URL.replace('127.0.0.1', 'localhost')),
      request(URL, {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'})]) {
      const res = await GET(req);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-length'), '214704');
      assert.equal(res.headers.get('content-type'), 'audio/mpeg');
      assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.match(res.headers.get('x-robots-tag') ?? '', /noindex/);
      assert.equal(createHash('sha256').update(new Uint8Array(await res.arrayBuffer())).digest('hex'), SHA);
    }
  });
});

test('optional SA route denies query, origin, fetch metadata, range and method mismatches', async () => {
  await withEnvironment(async () => {
    const badHeaders: Array<Record<string, string>> = [
      {host: 'helpmath.ai'}, {host: '127.0.0.1:9999'}, {'x-forwarded-host': 'helpmath.ai'},
      {origin: 'https://example.com'}, {referer: 'http://localhost:43218/'}, {referer: ''},
      {'sec-fetch-site': 'cross-site'}, {'sec-fetch-mode': 'navigate'},
      {'sec-fetch-dest': 'script'}, {range: 'bytes=0-10'},
    ];
    const badUrls = [URL.split('?')[0], URL + '&extra=1', URL + `&sha256=${SHA}`,
      URL.replace(SHA, 'wrong'), URL.replace('spanish-audio', 'source-audio'),
      URL.replace('127.0.0.1', 'example.com'), URL.replace('http:', 'https:')];
    const requests = [...badHeaders.map(h => request(URL, h)), ...badUrls.map(u => request(u)),
      new Request(URL, {method: 'POST', headers: request().headers})];
    for (const req of requests) {
      const res = await GET(req);
      assert.equal(res.status, 404);
      assert.equal((await res.arrayBuffer()).byteLength, 0);
      assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.match(res.headers.get('x-robots-tag') ?? '', /noindex/);
    }
  });
});
