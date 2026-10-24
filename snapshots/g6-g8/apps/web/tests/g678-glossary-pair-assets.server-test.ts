import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs, {lstatSync, readFileSync, realpathSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {G678_LIFE_SOURCE_ROOT} from '../../../lib/g678-life-root-binding-v1.mjs';
import {pairHostAssetManifest, pairHostResources, type GlossaryPairId,
  type PairResourceName} from '../lib/g678-glossary-pair-assets.server';
import {GET as p013GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p013/[asset]/route';
import {GET as p015GET} from '../app/flash-assets/g678-local/shared-alg001-l12-p015/[asset]/route';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RECEIPT = path.join(ROOT, 'output/alg-l12-next-glossary-20260927/host-resources-v1.json');
const PRODUCER = path.join(ROOT, 'scripts/prepare-g678-glossary-pair-host-assets.mjs');
const IDS = ['shared-alg001-l12-p013', 'shared-alg001-l12-p015'] as const;
const NAMES = ['typography.js', 'main.mp3', 'spanish-audio.mp3'] as const;
const env: Record<string, string | undefined> = process.env;
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

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

function get(id: GlossaryPairId, input: Request, asset: string) {
  const handler = id === 'shared-alg001-l12-p013' ? p013GET : p015GET;
  return handler(input, {params: Promise.resolve({asset})});
}

function request(id: GlossaryPairId, name: PairResourceName, sha256: string,
  options: {url?: string; headers?: Record<string, string>; omit?: readonly string[]; method?: string} = {}) {
  const script = name === 'typography.js';
  const headers = new Headers({host: '127.0.0.1:3317',
    referer: `http://127.0.0.1:3317/en/migration-status/g678-calibration/${id}`,
    origin: 'http://127.0.0.1:3317', 'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors', 'sec-fetch-dest': script ? 'script' : 'empty',
    ...options.headers});
  for (const key of options.omit ?? []) headers.delete(key);
  const url = options.url ?? `http://127.0.0.1:3317/flash-assets/g678-local/${id}/${name}?sha256=${sha256}`;
  return new Request(url, {method: options.method ?? 'GET', headers});
}

async function denied(id: GlossaryPairId, input: Request, asset: string) {
  const response = await get(id, input, asset);
  assert.equal(response.status, 404, `${id}/${asset}: ${input.url}`);
  assert.equal((await response.arrayBuffer()).byteLength, 0);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/u);
}

test('pair producer matches its existing receipt without writing and pins two real sources', async () => local(() => {
  const before = readFileSync(RECEIPT);
  const result = spawnSync(process.execPath, [PRODUCER], {cwd: ROOT, encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Two source-bound local resource sets prepared/u);
  assert.deepEqual(readFileSync(RECEIPT), before);
  assert.equal(realpathSync(SOURCE_ROOT), SOURCE_ROOT);
  assert.ok(lstatSync(SOURCE_ROOT).isDirectory());
  const receipt = JSON.parse(before.toString('utf8')) as {pages: Array<{
    animationId: GlossaryPairId; source: {path: string; sha256: string; bytes: number}}>} ;
  assert.deepEqual(receipt.pages.map(page => page.animationId), IDS);
  for (const page of receipt.pages) {
    assert.equal(realpathSync(page.source.path), page.source.path);
    assert.equal(lstatSync(page.source.path).size, page.source.bytes);
    assert.equal(hash(readFileSync(page.source.path)), page.source.sha256);
  }
}));

for (const id of IDS) {
  test(`${id} reader and exact same-origin routes serve six pinned assets`, async () => local(async () => {
    const receipt = JSON.parse(readFileSync(RECEIPT, 'utf8')) as {pages: Array<{animationId: string;
      resources: Record<PairResourceName, {path: string; sha256: string; bytes: number; contentType: string}>}>};
    const page = receipt.pages.find(item => item.animationId === id)!;
    const resources = pairHostResources(id);
    const manifest = pairHostAssetManifest(id);
    assert.deepEqual(resources.map(item => item.name), NAMES);
    assert.deepEqual(manifest.map(item => item.name), NAMES);
    for (const name of NAMES) {
      const pin = page.resources[name];
      const file = path.isAbsolute(pin.path) ? pin.path : path.join(ROOT, pin.path);
      assert.equal(realpathSync(file), file);
      assert.equal(lstatSync(file).size, pin.bytes);
      assert.equal(hash(readFileSync(file)), pin.sha256);
      assert.deepEqual(manifest.find(item => item.name === name),
        {name, sha256: pin.sha256, bytes: pin.bytes, contentType: pin.contentType});
      const resource = resources.find(item => item.name === name)!;
      assert.equal(hash(resource.bytes), pin.sha256);
      resource.bytes.fill(0);
      assert.equal(hash(pairHostResources(id).find(item => item.name === name)!.bytes), pin.sha256);
      const regular = request(id, name, pin.sha256);
      const variants = [regular,
        request(id, name, pin.sha256, {url: regular.url.replace('127.0.0.1', 'localhost'),
          headers: {host: 'localhost:3317', referer: `http://localhost:3317/en/migration-status/g678-calibration/${id}`,
            origin: 'http://localhost:3317'}}),
        request(id, name, pin.sha256, {headers: {'x-forwarded-host': '127.0.0.1:3317'}}),
        request(id, name, pin.sha256, {headers: {'sec-fetch-mode': 'no-cors',
          'sec-fetch-dest': name === 'typography.js' ? 'script' : 'audio'}, omit: ['origin']})];
      for (const input of variants) {
        const response = await get(id, input, name);
        assert.equal(response.status, 200, `${id}/${name}`);
        assert.equal(response.headers.get('content-type'), pin.contentType);
        assert.equal(response.headers.get('content-length'), String(pin.bytes));
        assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
        assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.match(response.headers.get('x-robots-tag') ?? '', /noindex, nofollow/u);
        assert.equal(hash(new Uint8Array(await response.arrayBuffer())), pin.sha256);
      }
    }
  }));

  test(`${id} routes deny wrong names, hashes, origins, methods and Range`, async () => local(async () => {
    const pins = pairHostAssetManifest(id);
    for (const {name, sha256} of pins) {
      const url = request(id, name, sha256).url;
      const plain = url.split('?')[0]!;
      for (const query of ['', '?sha256=wrong', `?sha256=${sha256}&extra=1`,
        `?sha256=${sha256}&sha256=${sha256}`, `?%73ha256=${sha256}`])
        await denied(id, request(id, name, sha256, {url: plain + query}), name);
      for (const target of [url.replace(id, id === IDS[0] ? IDS[1] : IDS[0]),
        url.replace(name, 'unknown.js'), url.replace('127.0.0.1', 'helpmath.ai'),
        url.replace('http:', 'https:'), `${url}#fragment`])
        await denied(id, request(id, name, sha256, {url: target}), name);
      for (const headers of [
        {host: 'helpmath.ai'}, {host: '127.0.0.1:3317,example.com'},
        {host: '127.0.0.1:9999'}, {'x-forwarded-host': 'example.com'},
        {referer: 'https://example.com/'}, {referer: 'http://127.0.0.1:9999/'},
        {referer: 'http://user:pass@127.0.0.1:3317/'},
        {origin: 'https://example.com'}, {'sec-fetch-site': 'cross-site'},
        {'sec-fetch-mode': 'navigate'},
        {'sec-fetch-dest': name === 'typography.js' ? 'audio' : 'script'},
        {range: 'bytes=0-10'},
      ] as Record<string, string>[]) await denied(id, request(id, name, sha256, {headers}), name);
      for (const header of ['host', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest'])
        await denied(id, request(id, name, sha256, {omit: [header]}), name);
      for (const method of ['HEAD', 'POST'])
        await denied(id, request(id, name, sha256, {method}), name);
      await denied(id, request(id, name, sha256), '../typography.js');
      if (name === 'typography.js')
        await denied(id, request(id, name, sha256, {omit: ['origin']}), name);
    }
  }));
}

test('pair readers and routes fail closed outside the exact local source scope', async () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_SOURCE_ROOT', undefined], ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
    ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
    ['HELP_MATH_G678_SOURCE_ROOT', `${G678_LIFE_SOURCE_ROOT}/`],
  ];
  for (const [key, value] of cases) await local(async () => {
    if (value === undefined) delete env[key]; else env[key] = value;
    for (const id of IDS) {
      assert.throws(() => pairHostResources(id), /Pair local source scope/u);
      await denied(id, request(id, NAMES[0], '0'.repeat(64)), NAMES[0]);
    }
  });
});

test('Life preview root keeps the recorded WestWorld paths and reads the Life copies', async t => local(async () => {
  env.HELP_MATH_G678_SOURCE_ROOT = G678_LIFE_SOURCE_ROOT;
  assert.equal(realpathSync(G678_LIFE_SOURCE_ROOT), G678_LIFE_SOURCE_ROOT);
  const opened: string[] = [];
  const originalRead = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
    opened.push(String(args[0]));
    return originalRead(...args);
  });
  syncBuiltinESMExports();
  try {
    const receipt = JSON.parse(originalRead(RECEIPT, 'utf8')) as {pages: Array<{
      animationId: GlossaryPairId; source: {path: string};
      resources: Record<PairResourceName, {path: string; sha256: string; bytes: number}>}>};
    for (const id of IDS) {
      const page = receipt.pages.find(item => item.animationId === id)!;
      const stem = id.endsWith('p013') ? 'L12VB08' : 'L12VB10';
      assert.equal(page.source.path, `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/${stem}.swf`);
      assert.equal(page.resources['spanish-audio.mp3'].path,
        `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/SA/${stem}.mp3`);
      assert.equal(path.isAbsolute(page.resources['typography.js'].path), false);
      const resources = pairHostResources(id);
      assert.ok(opened.includes(`${G678_LIFE_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/${stem}.swf`));
      assert.ok(opened.includes(`${G678_LIFE_SOURCE_ROOT}/G6-G8-shared/ALG001/L12/SA/${stem}.mp3`));
      assert.equal(opened.some(item => item.startsWith(`${SOURCE_ROOT}/`)), false);
      assert.ok(opened.includes(path.join(ROOT, page.resources['typography.js'].path)));
      for (const name of NAMES) {
        const pin = page.resources[name];
        const resource = resources.find(item => item.name === name)!;
        assert.equal(hash(resource.bytes), pin.sha256);
        assert.equal(resource.bytes.length, pin.bytes);
        const response = await get(id, request(id, name, pin.sha256), name);
        assert.equal(response.status, 200, `${id}/${name}`);
        assert.equal(hash(new Uint8Array(await response.arrayBuffer())), pin.sha256);
      }
    }
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
}));

test('receipt and physical resource tampering fails closed without modifying serving files', async t => local(async () => {
  const originalRead = fs.readFileSync;
  const receipt = JSON.parse(originalRead(RECEIPT, 'utf8')) as {pages: Array<{
    source: {sha256: string}; frameCount: number; resources: Record<PairResourceName,
      {path: string; sha256: string; bytes: number; contentType: string}>}>};
  for (const [pageIndex, id] of IDS.entries()) {
    const resource = receipt.pages[pageIndex]!.resources['typography.js'];
    const physical = path.join(ROOT, resource.path);
    const scenarios = [
      {label: 'receipt resource hash', target: RECEIPT, edit: (doc: typeof receipt) => {doc.pages[pageIndex]!.resources['typography.js'].sha256 = '0'.repeat(64);}},
      {label: 'receipt resource path', target: RECEIPT, edit: (doc: typeof receipt) => {doc.pages[pageIndex]!.resources['typography.js'].path = '../other.js';}},
      {label: 'receipt source hash', target: RECEIPT, edit: (doc: typeof receipt) => {doc.pages[pageIndex]!.source.sha256 = '0'.repeat(64);}},
      {label: 'receipt frame count', target: RECEIPT, edit: (doc: typeof receipt) => {doc.pages[pageIndex]!.frameCount++; }},
      {label: 'physical resource bytes', target: physical},
    ] as const;
    for (const scenario of scenarios) {
      try {
        t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof fs.readFileSync>) => {
          const result = originalRead(...args);
          if (args[0] !== scenario.target) return result;
          if ('edit' in scenario) {
            const changed = structuredClone(receipt);
            scenario.edit(changed);
            return JSON.stringify(changed);
          }
          assert.ok(Buffer.isBuffer(result));
          const changed = Buffer.from(result); changed[0] ^= 1; return changed;
        });
        syncBuiltinESMExports();
        assert.throws(() => pairHostResources(id), /Pair /u, `${id}: ${scenario.label}`);
        const input = request(id, NAMES[0], resource.sha256);
        await denied(id, input, NAMES[0]);
      } finally {t.mock.restoreAll(); syncBuiltinESMExports();}
      assert.equal(hash(pairHostResources(id)[0]!.bytes), resource.sha256);
    }
  }
}));
