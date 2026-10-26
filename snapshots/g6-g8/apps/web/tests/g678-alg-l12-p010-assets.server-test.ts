import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs, {lstatSync, readFileSync, realpathSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {algL12P010Typography} from '../lib/g678-alg-l12-p010-typography.server';
import {algL12P010SourceAudio} from '../lib/g678-alg-l12-p010-source-audio.server';
import {algL12P010SpanishAudio, P010_SA_BYTES, P010_SA_SHA} from '../lib/g678-alg-l12-p010-spanish-audio.server';
import {GET as typographyGET} from '../app/flash-assets/g678-local/shared-alg001-l12-p010/typography-renderer.js/route';
import {GET as embeddedGET} from '../app/flash-assets/g678-local/shared-alg001-l12-p010/source-audio.mp3/route';
import {GET as spanishGET} from '../app/flash-assets/g678-local/shared-alg001-l12-p010/spanish-audio.mp3/route';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB05.swf`;
const SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
const fromRoot = (path: string) => fileURLToPath(new URL(`../../../${path}`, import.meta.url));
const runtime = fromRoot('migrations/shared-alg001-l12-p010/typography-v1/canvas-renderer.js');
const metaBytes = readFileSync(fromRoot('migrations/shared-alg001-l12-p010/typography-v1/runtime-meta.json'));
const meta = JSON.parse(metaBytes.toString()) as {animationId: string; sourceSha256: string; runtimeBytes: number;
  runtimeSha256: string; renderScale: number; bitmapCount: number; canvas: {width: number; height: number};
  registered: boolean; audioEnabled: boolean; acceptanceEffect: string};
const embedded = fromRoot('migrations/shared-alg001-l12-p010/audit/source-stream.mp3');
const blocks = fromRoot('migrations/shared-alg001-l12-p010/audit/source-stream-blocks.json');
const native = fromRoot('output/p010-browser-native-decode-20260927-v1/browser-native-result.json');
const sa = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/SA/L12VB05.mp3`;
const saDisposition = fromRoot('output/p010-sa-host-disposition-20260927-v1/SA_HOST_DISPOSITION_2026-09-27.md');
const prefix = '/flash-assets/g678-local/shared-alg001-l12-p010/';
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const env: Record<string, string | undefined> = process.env;
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;

async function local(run: () => void | Promise<void>) {
  const before = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1'; env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of ENV_KEYS) { if (before[key] === undefined) delete env[key]; else env[key] = before[key]; }
  }
}

const assets = [
  {name: 'typography', file: 'typography-renderer.js', sha: meta.runtimeSha256, bytes: meta.runtimeBytes,
    type: 'text/javascript; charset=utf-8', get: typographyGET, read: algL12P010Typography, dest: 'script', mode: 'cors'},
  {name: 'embedded', file: 'source-audio.mp3', sha: '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f', bytes: 189020,
    type: 'audio/mpeg', get: embeddedGET, read: algL12P010SourceAudio, dest: 'empty', mode: 'cors'},
  {name: 'spanish', file: 'spanish-audio.mp3', sha: '685174141928210d8190f02a778f28db993dfb3f8a7576852264e539ed8b4644', bytes: 215376,
    type: 'audio/mpeg', get: spanishGET, read: algL12P010SpanishAudio, dest: 'empty', mode: 'cors'},
] as const;
type Asset = (typeof assets)[number];
function request(asset: Asset, options: {url?: string; headers?: Record<string, string>; omit?: readonly string[]; method?: string} = {}) {
  const headers = new Headers({host: '127.0.0.1:3317',
    referer: 'http://127.0.0.1:3317/en/migration-status/g678-calibration/shared-alg001-l12-p010',
    origin: 'http://127.0.0.1:3317', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': asset.mode, 'sec-fetch-dest': asset.dest, ...options.headers});
  for (const name of options.omit ?? []) headers.delete(name);
  return new Request(options.url ?? `http://127.0.0.1:3317${prefix}${asset.file}?sha256=${asset.sha}`,
    {headers, method: options.method ?? 'GET'});
}
async function denied(asset: Asset, input: Request) {
  const response = await asset.get(input);
  assert.equal(response.status, 404, `${asset.name}: ${input.url}`);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('P010 readers bind physical source, runtime, native decode proof and optional SA identity', async () => local(() => {
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT); assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
  const pins = [
    [SOURCE, 183770, SOURCE_SHA], [runtime, meta.runtimeBytes, meta.runtimeSha256],
    [embedded, 189020, assets[1].sha],
    [blocks, 274267, '656ccb77ccea9737b88c946d4101a759c2441f93522cfd34c3d872fff8080d2e'],
    [native, 5102, 'f051dc2ba559b8ffb66b99025c2aa222bf32905848d1ac3a0db2ca87f9520ce8'],
    [`${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/index.xml`, 11927, '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'],
    [saDisposition, 12811, '8fac333536efd5f164ed980083f8c056b6a7668a3a100f768371ed85b57d710d'],
    [sa, 215376, assets[2].sha],
  ] as const;
  for (const [file, size, sha] of pins) {
    assert.equal(realpathSync(file), file);
    const stat = lstatSync(file); assert.ok(stat.isFile()); assert.equal(stat.nlink, 1);
    assert.equal(stat.size, size); assert.equal(hash(readFileSync(file)), sha);
  }
  assert.equal(meta.animationId, 'shared-alg001-l12-p010'); assert.equal(meta.sourceSha256, SOURCE_SHA);
  assert.equal(meta.registered, false); assert.equal(meta.audioEnabled, false); assert.equal(meta.acceptanceEffect, 'none');
  assert.equal(meta.bitmapCount, 0); assert.equal(meta.renderScale, 2); assert.deepEqual(meta.canvas, {width: 1600, height: 1200});
  assert.equal(P010_SA_BYTES, 215376); assert.equal(P010_SA_SHA, assets[2].sha);
  assert.notEqual(assets[1].sha, assets[2].sha); assert.notEqual(assets[1].bytes, assets[2].bytes);
  for (const asset of assets) {
    const actual = asset.read();
    assert.equal(actual.sha256, asset.sha); assert.equal(actual.bytes.length, asset.bytes); assert.equal(hash(actual.bytes), asset.sha);
    actual.bytes.fill(0);
    assert.equal(hash(asset.read().bytes), asset.sha, 'caller mutation cannot modify pinned physical bytes');
  }
}));

for (const asset of assets) {
  test(`P010 ${asset.name} route returns exact bytes and private headers for allowed local requests`, async () => local(async () => {
    const normal = request(asset);
    const good = [normal, request(asset, {url: normal.url.replace('127.0.0.1', 'localhost')}),
      request(asset, {headers: {'x-forwarded-host': '127.0.0.1:3317'}}),
      request(asset, {headers: {'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': asset.name === 'typography' ? 'script' : 'audio'}, omit: ['origin']})];
    if (asset.name !== 'typography') good.push(request(asset, {headers: {'sec-fetch-mode': 'same-origin'}, omit: ['origin']}));
    for (const input of good) {
      const response = await asset.get(input); assert.equal(response.status, 200, asset.name);
      assert.equal(response.headers.get('content-type'), asset.type); assert.equal(response.headers.get('content-length'), String(asset.bytes));
      assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex, nofollow, noarchive, noimageindex/u);
      assert.match(response.headers.get('vary') ?? '', /Sec-Fetch-Site/u);
      assert.equal(hash(new Uint8Array(await response.arrayBuffer())), asset.sha);
    }
  }));

  test(`P010 ${asset.name} denies wrong identity, remote origin, bad metadata, method and range`, async () => local(async () => {
    const url = request(asset).url, plain = url.split('?')[0];
    for (const query of ['', '?sha256=wrong', `?sha256=${asset.sha}&extra=1`, `?sha256=${asset.sha}&sha256=${asset.sha}`])
      await denied(asset, request(asset, {url: plain + query}));
    for (const target of [url.replace('p010', 'p009'), url.replace(asset.file, 'unknown-resource'),
      url.replace('127.0.0.1', 'helpmath.ai'), url.replace('127.0.0.1', 'example.com'), url.replace('http:', 'https:')])
      await denied(asset, request(asset, {url: target}));
    for (const headers of [
      {host: 'helpmath.ai'}, {host: '127.0.0.1:3317,example.com'}, {'x-forwarded-host': 'example.com'},
      {'x-forwarded-host': '127.0.0.1:3317,example.com'}, {referer: 'https://example.com/'},
      {referer: 'http://127.0.0.1:9999/'}, {origin: 'https://example.com'},
      {'sec-fetch-site': 'cross-site'}, {'sec-fetch-mode': 'navigate'},
      {'sec-fetch-dest': asset.name === 'typography' ? 'audio' : 'script'}, {range: 'bytes=0-10'},
    ] as Record<string, string>[]) await denied(asset, request(asset, {headers}));
    for (const name of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
      await denied(asset, request(asset, {omit: [name]}));
    for (const method of ['HEAD', 'POST']) await denied(asset, request(asset, {method}));
    if (asset.name === 'typography') await denied(asset, request(asset, {omit: ['origin']}));
  }));
}

test('P010 audio routes enforce raw hash query and the actual browser origin after Next URL normalization', async () => local(async () => {
  for (const asset of [assets[1], assets[2]]) {
    const url = request(asset).url;
    for (const query of [`?%73ha256=${asset.sha}`, `?sha256=%${asset.sha.charCodeAt(0).toString(16)}${asset.sha.slice(1)}`])
      await denied(asset, request(asset, {url: url.split('?')[0] + query}));
    await denied(asset, request(asset, {url: `${url}#fragment`}));
    for (const headers of [{host: '127.0.0.1:9999'}, {'x-forwarded-host': 'localhost:3317'},
      {referer: 'http://localhost:3317/'}, {referer: 'http://user:pass@127.0.0.1:3317/'},
      {referer: 'http://127.0.0.1:3317/#fragment'}, {origin: 'http://127.0.0.1:3317/path'}] as Record<string, string>[])
      await denied(asset, request(asset, {headers}));
    const wrongBinding = asset.name === 'spanish'
      ? '3ccbe37ecfabff0506ef3daafc7db4b9fd8b770f0baefd6a70efeaaa27ca6fd4'
      : assets[2].sha;
    await denied(asset, request(asset, {url: url.split('?')[0] + `?sha256=${wrongBinding}`}));
  }
}));

test('P010 readers and routes reject missing opt-in, provider/production scope and substituted source roots', async () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'], ['HELP_MATH_G678_LOCAL_PREVIEW', 'TRUE'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'localhost'], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '::1'],
    ['HELP_MATH_G678_SOURCE_ROOT', undefined], ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
    ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
    ['HELP_MATH_G678_SOURCE_ROOT', '/Volumes/WestWorld/HELP MATH 2.0/source-assets/G6-G8-shared'],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    for (const asset of assets) { assert.throws(() => asset.read(), /P010 local/u); await denied(asset, request(asset)); }
  });
});

test('P010 rejects physical indirection, hard links, read-time changes and stream/proof byte drift without source writes', async t => local(async () => {
  const actualRealpath = fs.realpathSync, actualLstat = fs.lstatSync, actualRead = fs.readFileSync;
  const scenarios = [
    {kind: 'indirect', target: SOURCE, affected: assets}, {kind: 'hardlink', target: SOURCE, affected: assets},
    {kind: 'mtime', target: SOURCE, affected: assets}, {kind: 'bytes', target: runtime, affected: [assets[0]]},
    {kind: 'bytes', target: embedded, affected: [assets[1]]}, {kind: 'bytes', target: blocks, affected: [assets[1]]},
    {kind: 'bytes', target: native, affected: [assets[1]]}, {kind: 'bytes', target: sa, affected: [assets[2]]},
    {kind: 'bytes', target: saDisposition, affected: [assets[2]]},
  ] as const;
  for (const scenario of scenarios) {
    let stats = 0;
    try {
      t.mock.method(fs, 'realpathSync', (...args: Parameters<typeof fs.realpathSync>) =>
        scenario.kind === 'indirect' && args[0] === scenario.target ? `${scenario.target}.indirect` : actualRealpath(...args));
      t.mock.method(fs, 'lstatSync', (...args: Parameters<typeof fs.lstatSync>) => {
        const stat = actualLstat(...args);
        if (args[0] !== scenario.target) return stat;
        assert.ok(stat); stats++;
        const changed = Object.create(stat);
        if (scenario.kind === 'hardlink') Object.defineProperty(changed, 'nlink', {value: 2n});
        if (scenario.kind === 'mtime' && stats % 2 === 0)
          Object.defineProperty(changed, 'mtimeNs', {value: (stat as unknown as {mtimeNs: bigint}).mtimeNs + 1n});
        return changed;
      });
      t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
        const raw = actualRead(...args);
        if (scenario.kind !== 'bytes' || args[0] !== scenario.target) return raw;
        assert.ok(Buffer.isBuffer(raw)); const changed = Buffer.from(raw); changed[0] ^= 1; return changed;
      });
      syncBuiltinESMExports();
      for (const asset of scenario.affected) {
        assert.throws(() => asset.read(), /P010 (ordinary|pinned|audio|SA)/u);
        await denied(asset, request(asset));
      }
    } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
    for (const asset of scenario.affected) assert.equal(hash(asset.read().bytes), asset.sha);
  }
}));
