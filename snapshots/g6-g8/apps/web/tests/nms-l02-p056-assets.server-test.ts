import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs, {readFileSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {GET} from '../app/migration-assets/nms-l02-p056/[asset]/route';
import {p056Asset, p056AssetManifest, verifyP056AssetSource} from '../lib/nms-l02-p056-assets.server';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const MP3 = 'migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3';
const MP3_SHA = '6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811';
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const env: Record<string, string | undefined> = process.env;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function local(run: () => void | Promise<void>) {
  const saved = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete env[key]; else env[key] = saved[key];
    }
  }
}

const ORIGIN = 'http://127.0.0.1:3377';
function request(options: {url?: string; headers?: Record<string, string>;
  omit?: readonly string[]; method?: string} = {}) {
  const headers = new Headers({host: '127.0.0.1:3377',
    referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056`,
    origin: ORIGIN, 'sec-fetch-site': 'same-origin', 'sec-fetch-mode': 'same-origin',
    'sec-fetch-dest': 'empty', ...options.headers});
  for (const name of options.omit ?? []) headers.delete(name);
  return new Request(options.url ??
    `${ORIGIN}/migration-assets/nms-l02-p056/main.mp3?sha256=${MP3_SHA}`,
  {method: options.method ?? 'GET', headers});
}
const get = (input: Request, asset = 'main.mp3') =>
  GET(input, {params: Promise.resolve({asset})});
async function denied(input: Request, asset = 'main.mp3') {
  const result = await get(input, asset);
  assert.equal(result.status, 404, `${asset}: ${input.url}`);
  assert.equal((await result.arrayBuffer()).byteLength, 0);
  assert.match(result.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('P056 reader binds the real SWF, lesson XML, intake and extracted stream', () => local(() => {
  const source = verifyP056AssetSource();
  assert.equal(source.animationId, 'shared-nms002-l02-p056');
  assert.equal(hash(readFileSync(path.join(SOURCE_ROOT, 'G6-G8-shared/NMS002/L2/TS/L2TS03.swf'))),
    source.sourceSwfSha256);
  assert.equal(hash(readFileSync(path.join(SOURCE_ROOT, 'G6-G8-shared/NMS002/L2/index.xml'))),
    source.lessonXmlSha256);
  const manifest = p056AssetManifest();
  assert.deepEqual(manifest.map(row => row.name), ['main.mp3']);
  assert.equal(manifest[0]?.sha256, MP3_SHA);
  assert.equal(manifest[0]?.bytes, 95290);
  assert.equal(manifest[0]?.role, 'embedded-source-stream-candidate');
  assert.equal(manifest[0]?.url,
    `/migration-assets/nms-l02-p056/main.mp3?sha256=${MP3_SHA}`);
  assert.equal(hash(readFileSync(path.join(ROOT, MP3))), MP3_SHA);
  const first = p056Asset('main.mp3'); first.bytes.fill(0);
  assert.equal(hash(p056Asset('main.mp3').bytes), MP3_SHA);
}));

test('P056 route serves exact local embedded audio from English and Spanish candidate pages', () =>
  local(async () => {
    for (const input of [request(),
      request({url: `http://localhost:3377/migration-assets/nms-l02-p056/main.mp3?sha256=${MP3_SHA}`}),
      request({headers: {referer: `${ORIGIN}/es/migration-status/g678-calibration/shared-nms002-l02-p056`}}),
      request({headers: {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'}, omit: ['origin']}),
      request({url: 'http://localhost:3377/migration-assets/nms-l02-p056/main.mp3?sha256=' + MP3_SHA,
        headers: {host: 'localhost:3377', origin: 'http://localhost:3377',
          referer: 'http://localhost:3377/en/migration-status/g678-calibration/shared-nms002-l02-p056'}})]) {
      const result = await get(input);
      assert.equal(result.status, 200);
      assert.equal(result.headers.get('content-type'), 'audio/mpeg');
      assert.equal(result.headers.get('content-length'), '95290');
      assert.equal(result.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.equal(result.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(hash(new Uint8Array(await result.arrayBuffer())), MP3_SHA);
    }
  }));

test('P056 route denies method, name, URL, query, range and cross-origin drift', () =>
  local(async () => {
    const good = request().url;
    const base = good.split('?')[0]!;
    for (const url of [base, `${base}?sha256=bad`, `${good}&extra=1`,
      `${good}&sha256=${MP3_SHA}`, good.replace('http:', 'https:'),
      good.replace('127.0.0.1:3377', 'helpmath.ai'),
      good.replace('nms-l02-p056', 'nms-l02-p055'),
      good.replace('main.mp3', 'sa.mp3')]) await denied(request({url}));
    for (const headers of [
      {host: 'helpmath.ai'}, {host: '127.0.0.1:3378'}, {'x-forwarded-host': 'localhost:3377'},
      {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p065`},
      {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056?frame=5`},
      {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056#x`},
      {origin: 'https://example.com'}, {'sec-fetch-site': 'cross-site'},
      {'sec-fetch-mode': 'navigate'}, {'sec-fetch-dest': 'script'}, {range: 'bytes=0-99'},
    ] as Record<string, string>[]) await denied(request({headers}));
    for (const omit of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
      await denied(request({omit: [omit]}));
    for (const method of ['HEAD', 'POST']) await denied(request({method}));
    await denied(request(), 'sa.mp3');
    await denied(request(), '../main.mp3');
  }));

test('P056 route and reader fail closed outside the exact local source environment', async () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => p056AssetManifest());
    await denied(request());
  });
});

test('P056 reader rejects changed source, lesson, intake or MP3 bytes without editing real files', t =>
  local(async () => {
    const original = fs.readFileSync;
    const targets = [path.join(SOURCE_ROOT, 'G6-G8-shared/NMS002/L2/TS/L2TS03.swf'),
      path.join(SOURCE_ROOT, 'G6-G8-shared/NMS002/L2/index.xml'),
      path.join(ROOT, 'output/nms-l02-p056-source-intake-20260927/source-intake.json'),
      path.join(ROOT, MP3)];
    for (const target of targets) {
      try {
        t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
          const bytes = original(...args);
          if (args[0] !== target) return bytes;
          assert(Buffer.isBuffer(bytes));
          const changed = Buffer.from(bytes); changed[changed.length - 1] ^= 1; return changed;
        });
        syncBuiltinESMExports();
        assert.throws(() => p056Asset('main.mp3'));
        await denied(request());
      } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
    }
  }));

 test('P056 source audio remains available when another valid NMS L02 page hosts the lesson',()=>local(async()=>{
  for(const locale of ['en','es'])for(let page=1;page<=64;page++){
   const referer=`${ORIGIN}/${locale}/migration-status/g678-calibration/shared-nms002-l02-p${String(page).padStart(3,'0')}`;
   assert.equal((await get(request({headers:{referer}}))).status,200);
  }
 }));
