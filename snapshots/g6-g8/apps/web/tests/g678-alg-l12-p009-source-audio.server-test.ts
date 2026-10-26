import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs, {lstatSync, readFileSync, realpathSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {algL12P009SourceAudio} from '../lib/g678-alg-l12-p009-source-audio.server';
import {GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p009/source-audio.mp3/route';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_FILE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB04.swf`;
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const AUDIO_SHA = '15e60f13aad0e2187db0b32f6bcfe65151001a1ded336abd4fb4eb59b3014f2e';
const AUDIO_PATH = '/flash-assets/g678-local/shared-alg001-l12-p009/source-audio.mp3';
const AUDIO_URL = `http://127.0.0.1:3317${AUDIO_PATH}?sha256=${AUDIO_SHA}`;
const work = new URL('../../../migrations/shared-alg001-l12-p009/', import.meta.url);
const streamFile = fileURLToPath(new URL('audit/source-stream.mp3', work));
const analysisFile = fileURLToPath(new URL('audio-analysis-v1/analysis.json', work));
const env: Record<string, string | undefined> = process.env;
const keys = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function local(run: () => Promise<void>) {
  const before = Object.fromEntries(keys.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1'; env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of keys) { if (before[key] === undefined) delete env[key]; else env[key] = before[key]; }
  }
}
function request(url = AUDIO_URL, overrides: Record<string, string> = {}, omit: readonly string[] = []) {
  const headers = new Headers({host: '127.0.0.1:3317',
    referer: 'http://127.0.0.1:3317/en/migration-status/g678-calibration/shared-alg001-l12-p009',
    origin: 'http://127.0.0.1:3317', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty', ...overrides});
  for (const name of omit) headers.delete(name);
  return new Request(url, {headers});
}
async function assertDenied(input: Request) {
  const response = await GET(input);
  assert.equal(response.status, 404); assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('P009 reader binds the actual physical SWF, block audit, technical analysis and exact extracted stream', async () => local(async () => {
  const pins = [
    [SOURCE_FILE, 165405, SOURCE_SHA],
    [fileURLToPath(new URL('audit/source-stream-blocks.json', work)), 236488, 'cc20000fdef998ecd62aac8454f8f1edf0e9ad8c5595140e9899354256036c4a'],
    [analysisFile, 11426, '6547b52ae7e12e7ff7b2bb0ff190ab233a552dc68eda056869df015d26c883fd'],
    [streamFile, 162890, AUDIO_SHA],
  ] as const;
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT); assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
  for (const [file, bytes, sha256] of pins) {
    assert.equal(realpathSync(file), file);
    const stat = lstatSync(file); assert.ok(stat.isFile()); assert.equal(stat.nlink, 1);
    assert.equal(stat.size, bytes); assert.equal(hash(readFileSync(file)), sha256);
  }
  const analysis = JSON.parse(readFileSync(analysisFile).toString());
  assert.equal(analysis.animationId, 'shared-alg001-l12-p009'); assert.equal(analysis.source.sha256, SOURCE_SHA);
  assert.equal(analysis.encoded.sha256, AUDIO_SHA); assert.equal(analysis.encoded.bytes, 162890);
  assert.equal(analysis.claimBoundary.productAudioEnabled, false); assert.equal(analysis.claimBoundary.listeningAccepted, false);
  const audio = algL12P009SourceAudio();
  assert.equal(audio.bytes.length, 162890); assert.equal(audio.sha256, AUDIO_SHA); assert.equal(hash(audio.bytes), AUDIO_SHA);
  audio.bytes.fill(0);
  assert.equal(hash(algL12P009SourceAudio().bytes), AUDIO_SHA, 'a caller cannot mutate a retained shared source buffer');
}));

test('P009 route delivers exact full MP3 with private headers and Next loopback normalization', async () => local(async () => {
  const good = [request(), request(AUDIO_URL.replace('127.0.0.1', 'localhost')),
    request(AUDIO_URL, {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'}, ['origin']),
    request(AUDIO_URL, {'sec-fetch-mode': 'same-origin'}, ['origin']),
    request(AUDIO_URL, {}, ['origin']), request(AUDIO_URL, {'x-forwarded-host': '127.0.0.1:3317'})];
  for (const input of good) {
    const response = await GET(input); assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.equal(response.headers.get('content-length'), '162890');
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
    assert.match(response.headers.get('vary') ?? '', /Host/u);
    assert.equal(hash(new Uint8Array(await response.arrayBuffer())), AUDIO_SHA);
  }
}));

test('P009 route denies asset/query, origin, method, range and fetch-metadata drift without disclosing bytes', async () => local(async () => {
  for (const query of ['', '?sha256=wrong', `?sha256=${AUDIO_SHA}&extra=1`,
    `?sha256=${AUDIO_SHA}&sha256=${AUDIO_SHA}`, `?%73ha256=${AUDIO_SHA}`, `?sha256=%31${AUDIO_SHA.slice(1)}`])
    await assertDenied(request(AUDIO_URL.split('?')[0] + query));
  for (const target of [AUDIO_URL.replace('source-audio.mp3', 'source-audio'),
    AUDIO_URL.replace('p009', 'p006'), AUDIO_URL.replace('127.0.0.1', 'example.com'),
    AUDIO_URL.replace('http:', 'https:'), `${AUDIO_URL}#fragment`]) await assertDenied(request(target));
  const badHeaders: readonly Record<string, string>[] = [
    {host: 'helpmath.ai'}, {host: '127.0.0.1:9999'}, {host: '127.0.0.1:3317,example.com'},
    {'x-forwarded-host': 'localhost:3317'}, {'x-forwarded-host': 'example.com'},
    {referer: 'http://localhost:3317/'}, {referer: 'https://example.com/'},
    {referer: 'http://127.0.0.1:9999/'}, {origin: 'https://example.com'},
    {origin: 'http://127.0.0.1:3317/path'}, {range: 'bytes=0-10'},
    {'sec-fetch-site': 'cross-site'}, {'sec-fetch-mode': 'navigate'}, {'sec-fetch-dest': 'script'},
  ];
  for (const headers of badHeaders) await assertDenied(request(AUDIO_URL, headers));
  for (const name of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
    await assertDenied(request(AUDIO_URL, {}, [name]));
  for (const method of ['HEAD', 'POST'])
    await assertDenied(new Request(AUDIO_URL, {method, headers: request().headers}));
}));

test('P009 reader and route remain closed without exact local scope and in production/provider environments', async () => {
  const cases: ReadonlyArray<readonly [typeof keys[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'], ['HELP_MATH_G678_SOURCE_ROOT', undefined],
    ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'], ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => algL12P009SourceAudio(), /P009 local audio source required/u);
    await assertDenied(request());
  });
});

test('P009 reader rejects physical indirection, hard links, read-time changes and pinned byte drift', async t => local(async () => {
  const actualRealpath = fs.realpathSync, actualLstat = fs.lstatSync, actualRead = fs.readFileSync;
  const scenarios = ['indirect-source', 'hardlink-source', 'read-time-source-drift', 'audio-byte-drift', 'analysis-byte-drift'] as const;
  for (const scenario of scenarios) {
    let sourceStats = 0;
    try {
      t.mock.method(fs, 'realpathSync', (...args: Parameters<typeof fs.realpathSync>) => {
        if (scenario === 'indirect-source' && args[0] === SOURCE_FILE) return `${SOURCE_FILE}.indirect`;
        return actualRealpath(...args);
      });
      t.mock.method(fs, 'lstatSync', (...args: Parameters<typeof fs.lstatSync>) => {
        const stat = actualLstat(...args);
        if (args[0] !== SOURCE_FILE) return stat;
        assert.ok(stat);
        sourceStats++;
        const changed = Object.create(stat);
        if (scenario === 'hardlink-source') Object.defineProperty(changed, 'nlink', {value: 2n});
        if (scenario === 'read-time-source-drift' && sourceStats % 2 === 0)
          Object.defineProperty(changed, 'ctimeNs', {value: (stat as unknown as {ctimeNs: bigint}).ctimeNs + 1n});
        return changed;
      });
      t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
        const bytes = actualRead(...args);
        if ((scenario === 'audio-byte-drift' && args[0] === streamFile) ||
            (scenario === 'analysis-byte-drift' && args[0] === analysisFile)) {
          assert.ok(Buffer.isBuffer(bytes)); const changed = Buffer.from(bytes); changed[0] ^= 1; return changed;
        }
        return bytes;
      });
      syncBuiltinESMExports();
      assert.throws(() => algL12P009SourceAudio(), /P009 audio (physical path required|ordinary bounded file required|source or evidence drift)/u);
      await assertDenied(request());
    } finally {
      t.mock.restoreAll(); syncBuiltinESMExports();
    }
    assert.equal(hash(algL12P009SourceAudio().bytes), AUDIO_SHA, 'mocked failures leave physical evidence and normal reader intact');
  }
}));
