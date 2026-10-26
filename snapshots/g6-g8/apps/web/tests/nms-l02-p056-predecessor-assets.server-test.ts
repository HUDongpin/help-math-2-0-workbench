import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {GET} from '../app/migration-assets/nms-l02-p056-predecessors/[asset]/route';
import {p056PredecessorAsset, p056PredecessorAssetManifest,
  type P056PredecessorAssetName} from '../lib/nms-l02-p056-predecessor-assets.server';
import {CONTINUOUS_AUDIO_PHASE} from '../lib/continuous-source-audio-access';
import {p052AudioUrl as p052SuccessorAudioUrl} from '../../../packages/demos/src/nms-l02-p052-audio-loader-p056-v1';
import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ORIGIN = 'http://127.0.0.1:3377';
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT',
  'HELP_MATH_G678_P052_AUDIO_CANDIDATE', 'HELP_MATH_G678_CALIBRATION_PHASE'] as const;
const env: Record<string, string | undefined> = process.env;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function local(run: () => void | Promise<void>) {
  const saved = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    env.HELP_MATH_G678_P052_AUDIO_CANDIDATE = '1';
    env.HELP_MATH_G678_CALIBRATION_PHASE = CONTINUOUS_AUDIO_PHASE;
    await run();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete env[key]; else env[key] = saved[key];
    }
  }
}

type Row = ReturnType<typeof p056PredecessorAssetManifest>[number];
function request(row: Row, options: {url?: string; headers?: Record<string, string>;
  omit?: readonly string[]; method?: string} = {}) {
  const script = row.name === 'p055-typography.js';
  const headers = new Headers({host: '127.0.0.1:3377',
    referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056`,
    origin: ORIGIN, 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': script ? 'script' : 'empty', ...options.headers});
  for (const name of options.omit ?? []) headers.delete(name);
  return new Request(options.url ?? `${ORIGIN}${row.url}`,
    {method: options.method ?? 'GET', headers});
}
const get = (input: Request, asset: string) => GET(input, {params: Promise.resolve({asset})});
async function denied(input: Request, asset: string) {
  const response = await get(input, asset);
  assert.equal(response.status, 404, `${asset}: ${input.url}`);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('P056 predecessor manifest contains only two P055 and six P052 exact source assets', () =>
  local(() => {
    const manifest = p056PredecessorAssetManifest();
    assert.deepEqual(manifest.map(item => item.name), [
      'p055-typography.js', 'p055-main.mp3', 'p052-sprite-8.mp3',
      'p052-sprite-318.mp3', 'p052-sprite-327.mp3', 'p052-sprite-347.mp3',
      'p052-sprite-349.mp3', 'p052-sprite-350.mp3',
    ]);
    assert.equal(manifest[0]?.sha256,
      '47e796237e5520140a760175865f09c3f218ac942cf3cadc8fb9f56c38bd358d');
    assert.equal(manifest[1]?.sha256,
      'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b');
    for (const row of manifest) {
      const resource = p056PredecessorAsset(row.name as P056PredecessorAssetName);
      assert.equal(hash(resource.bytes), row.sha256);
      assert.equal(resource.bytes.length, row.bytes);
      assert.equal(row.url,
        `/migration-assets/nms-l02-p056-predecessors/${row.name}?sha256=${row.sha256}`);
    }
  }));

test('P052 copied client URLs select the six exact successor routes and original hashes', () =>
  local(() => {
    const manifest = p056PredecessorAssetManifest();
    for (const domain of Object.keys(P052_AUDIO_PLANS)) {
      const plan = P052_AUDIO_PLANS[domain as keyof typeof P052_AUDIO_PLANS];
      const expected = `/migration-assets/nms-l02-p056-predecessors/p052-${domain}.mp3?sha256=${plan.inputSha256}`;
      assert.equal(p052SuccessorAudioUrl(domain), expected);
      assert.equal(manifest.find(row => row.name === `p052-${domain}.mp3`)?.url, expected);
    }
    assert.throws(() => p052SuccessorAudioUrl('sprite-999'), /P052_AUDIO_DOMAIN/u);
  }));

test('P056 predecessor route serves all eight real bytes from EN/ES and normalized loopback URLs', () =>
  local(async () => {
    for (const row of p056PredecessorAssetManifest()) {
      for (const input of [request(row),
        request(row, {headers: {referer: `${ORIGIN}/es/migration-status/g678-calibration/shared-nms002-l02-p056`}}),
        request(row, {url: `http://localhost:3377${row.url}`})]) {
        const response = await get(input, row.name);
        assert.equal(response.status, 200, `${row.name}: ${input.url}`);
        assert.equal(response.headers.get('content-type'), row.contentType);
        assert.equal(response.headers.get('content-length'), String(row.bytes));
        assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
        assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
        assert.equal(hash(new Uint8Array(await response.arrayBuffer())), row.sha256);
      }
    }
  }));

test('P056 predecessor route rejects other lesson or invalid page, wrong name/hash/method and cross-origin headers', () =>
  local(async () => {
    for (const row of p056PredecessorAssetManifest()) {
      const good = `${ORIGIN}${row.url}`, base = good.split('?')[0]!;
      for (const url of [base, `${base}?sha256=bad`, `${good}&extra=1`,
        `${good}&sha256=${row.sha256}`, good.replace('http:', 'https:'),
        good.replace('127.0.0.1:3377', 'helpmath.ai'),
        good.replace('nms-l02-p056-predecessors', 'nms-l02-ts-pilot')])
        await denied(request(row, {url}), row.name);
      for (const headers of [{host: 'helpmath.ai:3377'},
        {'x-forwarded-host': 'localhost:3377'},
        {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p065`},
        {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l03-p056`},
        {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p000`},
        {referer: `${ORIGIN}/en/migration-status/g678-calibration/shared-nms002-l02-p056?frame=1`},
        {origin: 'http://localhost:3377'}, {'sec-fetch-site': 'cross-site'},
        {'sec-fetch-mode': 'navigate'}, {'sec-fetch-dest': 'document'},
        {range: 'bytes=0-1'}] as Record<string, string>[])
        await denied(request(row, {headers}), row.name);
      for (const omit of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
        await denied(request(row, {omit: [omit]}), row.name);
      for (const method of ['HEAD', 'POST']) await denied(request(row, {method}), row.name);
    }
    const row = p056PredecessorAssetManifest()[0]!;
    await denied(request(row), 'p055-spanish.mp3');
    await denied(request(row), 'p052-sprite-999.mp3');
    await denied(request(row), '../p055-typography.js');
  }));

test('P056 predecessor route preserves script and P052 domain fetch shapes', () =>
  local(async () => {
    const [script, p055Audio, p052Audio] = p056PredecessorAssetManifest();
    assert(script && p055Audio && p052Audio);
    await denied(request(script, {omit: ['origin']}), script.name);
    await denied(request(script, {headers: {'sec-fetch-mode': 'same-origin'}}), script.name);
    await denied(request(p052Audio, {headers: {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'}}), p052Audio.name);
    for (const input of [request(p055Audio, {headers: {'sec-fetch-mode': 'same-origin'}, omit: ['origin']}),
      request(p055Audio, {headers: {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'audio'}, omit: ['origin']})]) {
      const response = await get(input, p055Audio.name);
      assert.equal(response.status, 200);
      assert.equal(hash(new Uint8Array(await response.arrayBuffer())), p055Audio.sha256);
    }
  }));

test('P056 predecessor route is closed outside exact local phase and source scope', async () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    const row = p056PredecessorAssetManifest;
    assert.throws(() => row());
    const input = request({name: 'p055-main.mp3',
      url: '/migration-assets/nms-l02-p056-predecessors/p055-main.mp3?sha256=' +
        'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b'} as Row);
    await denied(input, 'p055-main.mp3');
  });
  for (const [key, value] of [['HELP_MATH_G678_P052_AUDIO_CANDIDATE', undefined],
    ['HELP_MATH_G678_CALIBRATION_PHASE', 'other']] as const) await local(async () => {
    const row = p056PredecessorAssetManifest()[2]!;
    if (value === undefined) delete env[key]; else env[key] = value;
    await denied(request(row), row.name);
  });
});

test('P055 and P052 byte-pinned resources remain available to other NMS L02 host entry pages',()=>local(async()=>{
 for(const row of p056PredecessorAssetManifest())for(const locale of ['en','es'])for(const page of ['001','055','057','064']){
  const response=await get(request(row,{headers:{referer:`${ORIGIN}/${locale}/migration-status/g678-calibration/shared-nms002-l02-p${page}`}}),row.name);
  assert.equal(response.status,200);
  assert.equal(hash(new Uint8Array(await response.arrayBuffer())),row.sha256);
 }
}));
