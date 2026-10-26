import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs, {lstatSync, readFileSync, realpathSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {isP012AssetName, p012Asset, p012AssetManifest, P012_ASSET_PINS,
  type P012AssetName} from '../lib/g678-alg-l12-p012-assets.server';
import {GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p012/[asset]/route';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB07.swf`;
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const PREFIX = '/flash-assets/g678-local/shared-alg001-l12-p012/';
const fromRoot = (relative: string) => fileURLToPath(new URL(`../../../${relative}`, import.meta.url));
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const env: Record<string, string | undefined> = process.env;
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const names = Object.keys(P012_ASSET_PINS) as P012AssetName[];

async function local(run: () => void | Promise<void>) {
  const before = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1';
    env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    await run();
  } finally {
    for (const key of ENV_KEYS) {
      if (before[key] === undefined) delete env[key]; else env[key] = before[key];
    }
  }
}

function request(name: P012AssetName, options: {url?: string; headers?: Record<string, string>;
  omit?: readonly string[]; method?: string} = {}): Request {
  const pin = P012_ASSET_PINS[name];
  const script = pin.contentType.startsWith('text/javascript');
  const headers = new Headers({host: '127.0.0.1:3317',
    referer: 'http://127.0.0.1:3317/en/migration-status/g678-calibration/shared-alg001-l12-p012',
    origin: 'http://127.0.0.1:3317', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': script ? 'script' : 'empty',
    ...options.headers});
  for (const key of options.omit ?? []) headers.delete(key);
  return new Request(options.url ?? `http://127.0.0.1:3317${PREFIX}${name}?sha256=${pin.sha256}`,
    {method: options.method ?? 'GET', headers});
}
const get = (input: Request, asset: string) => GET(input, {params: Promise.resolve({asset})});
async function denied(input: Request, asset: string): Promise<void> {
  const response = await get(input, asset);
  assert.equal(response.status, 404, `${asset}: ${input.url}`);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('P012 reader binds real AWS source, fixed candidate artifacts and detached bytes', async () => local(() => {
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT);
  assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
  assert.equal(lstatSync(SOURCE).size, 81069);
  assert.equal(hash(readFileSync(SOURCE)), SOURCE_SHA);
  assert.equal(isP012AssetName('graphics.js'), true);
  assert.equal(isP012AssetName('../graphics.js'), false);
  assert.deepEqual(names, ['graphics.js', 'main.mp3', 'coach.mp3', 'typography.js']);
  const manifest = p012AssetManifest();
  assert.deepEqual(manifest.map(item => item.name), names);
  for (const name of names) {
    const pin = P012_ASSET_PINS[name];
    const physical = fromRoot(pin.path);
    assert.equal(realpathSync(physical), physical);
    assert.equal(lstatSync(physical).size, pin.bytes);
    assert.equal(hash(readFileSync(physical)), pin.sha256);
    const asset = p012Asset(name);
    assert.equal(asset.sha256, pin.sha256);
    assert.equal(asset.bytes.length, pin.bytes);
    assert.equal(asset.contentType, pin.contentType);
    assert.equal(hash(asset.bytes), pin.sha256);
    asset.bytes.fill(0);
    assert.equal(hash(p012Asset(name).bytes), pin.sha256);
    assert.deepEqual(manifest.find(item => item.name === name),
      {name, sha256: pin.sha256, bytes: pin.bytes, contentType: pin.contentType});
  }
}));

for (const name of names) {
  test(`P012 ${name} exact local GET sends private, source-bound bytes`, async () => local(async () => {
    const pin = P012_ASSET_PINS[name];
    const normal = request(name);
    const good = [normal,
      request(name, {url: normal.url.replace('127.0.0.1', 'localhost')}),
      request(name, {headers: {'x-forwarded-host': '127.0.0.1:3317'}}),
      request(name, {headers: {'sec-fetch-mode': 'no-cors',
        'sec-fetch-dest': pin.contentType.startsWith('text/javascript') ? 'script' : 'audio'}, omit: ['origin']}),
    ];
    for (const input of good) {
      const response = await get(input, name);
      assert.equal(response.status, 200, name);
      assert.equal(response.headers.get('content-type'), pin.contentType);
      assert.equal(response.headers.get('content-length'), String(pin.bytes));
      assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
      assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.match(response.headers.get('x-robots-tag') ?? '', /noindex, nofollow, noarchive, noimageindex/u);
      assert.equal(hash(new Uint8Array(await response.arrayBuffer())), pin.sha256);
    }
  }));

  test(`P012 ${name} rejects wrong identity, scope, headers, methods and Range`, async () => local(async () => {
    const pin = P012_ASSET_PINS[name];
    const url = request(name).url, plain = url.split('?')[0]!;
    for (const query of ['', '?sha256=wrong', `?sha256=${pin.sha256}&extra=1`,
      `?sha256=${pin.sha256}&sha256=${pin.sha256}`, `?%73ha256=${pin.sha256}`])
      await denied(request(name, {url: plain + query}), name);
    for (const target of [url.replace('p012', 'p011'), url.replace(name, 'unknown.js'),
      url.replace('127.0.0.1', 'helpmath.ai'), url.replace('http:', 'https:'), `${url}#fragment`])
      await denied(request(name, {url: target}), name);
    for (const headers of [
      {host: 'helpmath.ai'}, {host: '127.0.0.1:3317,example.com'},
      {host: '127.0.0.1:9999'}, {'x-forwarded-host': 'example.com'},
      {'x-forwarded-host': 'localhost:3317'},
      {referer: 'https://example.com/'}, {referer: 'http://127.0.0.1:9999/'},
      {referer: 'http://user:pass@127.0.0.1:3317/'},
      {origin: 'https://example.com'}, {origin: 'http://127.0.0.1:3317/path'},
      {'sec-fetch-site': 'cross-site'}, {'sec-fetch-mode': 'navigate'},
      {'sec-fetch-dest': pin.contentType.startsWith('text/javascript') ? 'audio' : 'script'},
      {range: 'bytes=0-10'},
    ] as Record<string, string>[]) await denied(request(name, {headers}), name);
    for (const header of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
      await denied(request(name, {omit: [header]}), name);
    for (const method of ['HEAD', 'POST']) await denied(request(name, {method}), name);
    await denied(request(name), '../graphics.js');
    if (pin.contentType.startsWith('text/javascript'))
      await denied(request(name, {omit: ['origin']}), name);
  }));
}

test('P012 readers and routes fail closed outside exact local environment and source root', async () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', undefined], ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
    ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
    ['HELP_MATH_G678_SOURCE_ROOT', '/Volumes/WestWorld/HELP MATH 2.0/source-assets/G6-G8-shared'],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    for (const name of names) {
      assert.throws(() => p012Asset(name), /P012 local/u);
      await denied(request(name), name);
    }
  });
});

test('P012 fails on source indirection, hard links and physical artifact drift', async t => local(async () => {
  const originalRealpath = fs.realpathSync;
  const originalLstat = fs.lstatSync;
  const originalRead = fs.readFileSync;
  const scenarios = [
    {kind: 'indirect', target: SOURCE, affected: names},
    {kind: 'hardlink', target: SOURCE, affected: names},
    {kind: 'mtime', target: SOURCE, affected: names},
    ...names.map(name => ({kind: 'bytes', target: fromRoot(P012_ASSET_PINS[name].path), affected: [name]})),
    {kind: 'bytes', target: fromRoot('migrations/shared-alg001-l12-p012/graphics-source-v1/manifest.json'), affected: ['graphics.js']},
    {kind: 'bytes', target: fromRoot('migrations/shared-alg001-l12-p012/audio-source-v1/raw-index.json'), affected: ['main.mp3', 'coach.mp3']},
    {kind: 'bytes', target: fromRoot('migrations/shared-alg001-l12-p012/typography-v1/runtime-meta.json'), affected: ['typography.js']},
  ] as const;
  for (const scenario of scenarios) {
    let statCalls = 0;
    try {
      t.mock.method(fs, 'realpathSync', (...args: Parameters<typeof fs.realpathSync>) =>
        scenario.kind === 'indirect' && args[0] === scenario.target ? `${scenario.target}.indirect` : originalRealpath(...args));
      t.mock.method(fs, 'lstatSync', (...args: Parameters<typeof fs.lstatSync>) => {
        const stat = originalLstat(...args);
        if (args[0] !== scenario.target || !stat) return stat;
        statCalls++;
        const changed = Object.create(stat);
        if (scenario.kind === 'hardlink') Object.defineProperty(changed, 'nlink', {value: 2n});
        if (scenario.kind === 'mtime' && statCalls % 2 === 0)
          Object.defineProperty(changed, 'mtimeNs', {value: (stat as unknown as {mtimeNs: bigint}).mtimeNs + 1n});
        return changed;
      });
      t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
        const bytes = originalRead(...args);
        if (scenario.kind !== 'bytes' || args[0] !== scenario.target) return bytes;
        assert.ok(Buffer.isBuffer(bytes));
        const changed = Buffer.from(bytes); changed[0] ^= 1; return changed;
      });
      syncBuiltinESMExports();
      for (const name of scenario.affected) {
        assert.throws(() => p012Asset(name as P012AssetName), /P012 /u);
        await denied(request(name as P012AssetName), name);
      }
    } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
    for (const name of scenario.affected)
      assert.equal(hash(p012Asset(name as P012AssetName).bytes), P012_ASSET_PINS[name as P012AssetName].sha256);
  }
}));
