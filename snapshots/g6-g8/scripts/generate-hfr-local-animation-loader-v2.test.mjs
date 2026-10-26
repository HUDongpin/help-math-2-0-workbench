import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {CANDIDATE_MODULE_PATH, CLIENT_IMPORT, CLIENT_PATH, LOADER_PATH, SERVER_PATH, renderLoader, serverCandidatePins} from './generate-hfr-local-animation-loader-v2.mjs';
import {renderLoader as renderLoaderV1} from './generate-hfr-local-animation-loader-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const current = renderLoader(root);
const anchor = 'const CANDIDATES: Readonly<Record<string, Pin>> = Object.freeze({';
const staged = [];
test.after(() => {for (const dir of staged) fs.rmSync(dir, {recursive: true, force: true});});
function stage() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hfr-loader-v2-'));
  staged.push(dir);
  for (const input of current.inputs) {
    fs.mkdirSync(path.dirname(path.join(dir, input.path)), {recursive: true});
    fs.copyFileSync(path.join(root, input.path), path.join(dir, input.path));
  }
  return dir;
}
const readText = (dir, relative) => fs.readFileSync(path.join(dir, relative), 'utf8');
const edit = (dir, relative, change) => fs.writeFileSync(path.join(dir, relative), change(readText(dir, relative)));
function writePacket(dir, relative, packet) {
  const bytes = Buffer.from(JSON.stringify(packet, null, 1));
  fs.writeFileSync(path.join(dir, relative), bytes);
  return {path: relative, bytes: bytes.length, sha256: hash(bytes)};
}
// Replace one candidate's pin line with a new one-line pin, as the route tools write it.
function repin(dir, key, pin) {
  edit(dir, SERVER_PATH, server => {
    const line = new RegExp(`^  '${key}': Object\\.freeze\\(\\{"path".*\\}\\),\\n`, 'm');
    assert(line.test(server), `one-line pin for ${key}`);
    return server.replace(line, `  '${key}': Object.freeze(${JSON.stringify(pin)}),\n`);
  });
}
function mutatePacket(dir, key, change) {
  const pin = serverCandidatePins(readText(dir, SERVER_PATH)).get(key);
  const packet = JSON.parse(readText(dir, pin.path));
  change(packet);
  repin(dir, key, writePacket(dir, `catalog/product-bridge-calibrations/test-${key}.json`, packet));
}

test('product modules replace factory files for the reviewed algebra pages', () => {
  const expected = {
    'shared-alg001-l06-p001': './modules/g678-alg-l06-source-title-p001',
    'shared-alg001-l12-p001': './modules/shared-alg001-l12-p001',
    'shared-alg001-l08-p040': './modules/shared-alg001-l08-p040',
    'shared-alg001-l08-p050': './modules/shared-alg001-l08-p050',
    'shared-alg001-l12-p005': './modules/shared-alg001-l12-p005',
  };
  for (const [key, module] of Object.entries(expected)) {
    const entry = current.entries.find(item => item.key === key);
    assert.equal(entry?.module, module, key);
    assert.equal(current.candidates.includes(key), false, key);
    assert.equal(current.text.includes(`'${key}': () => import('../../../packages/demos/src/${module.slice(2)}').then(({default: animationModule}) => animationModule),`), true, key);
    assert.equal(current.text.includes(`hfr-pages/${key}`), false, key);
  }
});

test('the committed loader and candidate module are the projection of the current tree', () => {
  assert.deepEqual(current.outputs.map(output => output.outputPath), [LOADER_PATH, CANDIDATE_MODULE_PATH]);
  for (const output of current.outputs) assert.equal(readText(root, output.outputPath), output.text, output.outputPath);
});

test('every candidate is read from its server-pinned packet and nothing else', () => {
  const pins = serverCandidatePins(readText(root, SERVER_PATH));
  assert.deepEqual(current.sources.map(source => source.key), [...pins.keys()]);
  for (const source of current.sources) {
    const packet = JSON.parse(readText(root, pins.get(source.key).path));
    assert.equal(source.sourceSha256, packet.source.sha256);
    assert.equal(source.importPath, `../../../packages/demos/src/modules/${source.key}`);
    assert.equal(current.candidateModule.text.split(`\n  '${source.key}': '${source.sourceSha256}',\n`).length, 2);
    assert.equal(current.candidateModule.text.split(`\n  '${source.key}': () => process.env.NODE_ENV === 'development'\n    ? import('${source.importPath}') : Promise.resolve(null),\n`).length, 2);
  }
  assert.equal([...current.candidateModule.text.matchAll(/import\(/g)].length, pins.size);
  assert.deepEqual(current.candidates, [...pins.keys()].sort());
});

test('a new candidate changes only its server pin', () => {
  const dir = stage(), key = 'shared-nms002-l11-p099', sourceSha256 = 'ab'.repeat(32);
  const model = JSON.parse(readText(dir, serverCandidatePins(readText(dir, SERVER_PATH)).get('shared-nms002-l11-p023').path));
  model.entry.key = model.meta.key = model.selectedPages[0].animationId = key;
  model.entry.module = `./modules/${key}`;
  model.entry.artifacts.module.path = `packages/demos/src/modules/${key}.tsx`;
  model.source.sha256 = model.meta.sourceSha256 = sourceSha256;
  const pin = writePacket(dir, `catalog/product-bridge-calibrations/test-${key}.json`, model);
  const client = readText(dir, CLIENT_PATH);
  edit(dir, SERVER_PATH, server => server.replace(anchor, `${anchor}\n  '${key}': Object.freeze(${JSON.stringify(pin)}),`));
  const next = renderLoader(dir);
  assert.equal(readText(dir, CLIENT_PATH), client);
  assert.deepEqual(next.sources[0], {key, sourceSha256, module: `./modules/${key}`, importPath: `../../../packages/demos/src/modules/${key}`});
  assert.deepEqual(next.sources.slice(1), current.sources);
  const added = (after, before) => {const lines = new Set(before.split('\n')); return after.split('\n').filter(line => !lines.has(line));};
  assert.deepEqual(added(next.candidateModule.text, current.candidateModule.text), [
    `  '${key}': '${sourceSha256}',`,
    `  '${key}': () => process.env.NODE_ENV === 'development'`,
    `    ? import('../../../packages/demos/src/modules/${key}') : Promise.resolve(null),`,
  ]);
  assert.equal(next.candidateModule.text.split('\n').length, current.candidateModule.text.split('\n').length + 3);
  assert.deepEqual(added(next.text, current.text), [
    `      '${key}': () => import('../../../packages/demos/src/modules/${key}').then(({default: animationModule}) => animationModule),`,
  ]);
  assert.deepEqual(next.entries.filter(entry => entry.key !== key), current.entries);
});

test('the client must delegate to the generated module', () => {
  for (const [change, message] of [
    [client => client.replace(CLIENT_IMPORT, ''), /imports the generated candidate module once/],
    [client => client + CLIENT_IMPORT, /imports the generated candidate module once/],
    [client => client + "const extra = () => import('../../../packages/demos/src/modules/x');\n", /no dynamic candidate import/],
    [client => client + "const pinned = 'shared-nms002-l11-p023';\n", /names no candidate page/],
    [client => client.replace(CLIENT_IMPORT, `${CLIENT_IMPORT}const loadCandidate = (animationId: string) => null;\n`), /defines no candidate table or loader/],
  ]) {
    const dir = stage();
    edit(dir, CLIENT_PATH, change);
    assert.throws(() => renderLoader(dir), message);
  }
});

test('server pins outside the two reviewed shapes are refused', () => {
  const pin = JSON.stringify({path: 'catalog/product-bridge-calibrations/x.json', bytes: 1, sha256: '0'.repeat(64)});
  for (const [change, message] of [
    [server => server.replace(anchor, `${anchor}\n  // comment`), /reviewed server candidate pin shape/],
    [server => server.replace(anchor, `${anchor}\n  'shared-nms002-l11-p023': Object.freeze(${pin}),`), /unique server candidate: shared-nms002-l11-p023/],
    [server => server.replace(anchor, `${anchor}\n  'shared-nms002-l11-p23': Object.freeze(${pin}),`), /server candidate identity/],
    [server => server.replace(anchor, `${anchor}\n  'shared-nms002-l11-p098': Object.freeze(${pin.replace('catalog/product-bridge-calibrations/', 'work/')}),`), /bounded candidate packet path/],
    [server => server.replace(anchor, `${anchor}\n  'shared-nms002-l11-p098': Object.freeze(${pin.replace('}', ',"extra":1}')}),`), /reviewed server candidate pin shape/],
    [server => server.replace(anchor, `${anchor}\n  'shared-nms002-l11-p098': Object.freeze({path: 'catalog/product-bridge-calibrations/x.json', bytes: 1, sha256: '${'0'.repeat(64)}'}),`), /reviewed server candidate pin shape/],
    [server => `${server}\n${anchor}\n});\n`, /one server candidate map/],
  ]) {
    const dir = stage();
    edit(dir, SERVER_PATH, change);
    assert.throws(() => renderLoader(dir), message);
  }
});

test('a packet must match its pin and its own candidate identity', () => {
  const key = 'shared-nms002-l11-p023';
  {
    const dir = stage(), {path: packet} = serverCandidatePins(readText(dir, SERVER_PATH)).get(key);
    edit(dir, packet, text => `${text} `);
    assert.throws(() => renderLoader(dir), /actual candidate packet size: shared-nms002-l11-p023/);
  }
  {
    const dir = stage(), {path: packet} = serverCandidatePins(readText(dir, SERVER_PATH)).get(key);
    edit(dir, packet, text => text.replace('"local-only"', '"local-onlx"'));
    assert.throws(() => renderLoader(dir), /actual candidate packet hash: shared-nms002-l11-p023/);
  }
  for (const [change, message] of [
    [packet => {packet.entry.key = 'shared-nms002-l11-p022';}, /exact candidate packet identity/],
    [packet => {packet.meta.key = 'shared-nms002-l11-p022';}, /exact candidate packet identity/],
    [packet => {packet.selectedPages.push({animationId: key});}, /exact candidate packet identity/],
    [packet => {packet.deploymentScope = 'public';}, /exact candidate packet identity/],
    [packet => {packet.meta.sourceSha256 = 'cd'.repeat(32);}, /exact candidate source/],
    [packet => {packet.source.sha256 = packet.meta.sourceSha256 = 'XYZ';}, /exact candidate source/],
    [packet => {packet.entry.module = './modules/shared-nms002-l11-p022';}, /exact candidate module: shared-nms002-l11-p023/],
    [packet => {packet.entry.artifacts.module.path = 'packages/demos/src/modules/other.tsx';}, /exact candidate module artifact/],
  ]) {
    const dir = stage();
    mutatePacket(dir, key, change);
    assert.throws(() => renderLoader(dir), message);
  }
  // A re-pinned packet with a new source is followed, never a stale table.
  const dir = stage();
  mutatePacket(dir, key, packet => {packet.source.sha256 = packet.meta.sourceSha256 = 'cd'.repeat(32);});
  assert.equal(renderLoader(dir).sources.find(source => source.key === key).sourceSha256, 'cd'.repeat(32));
});

test('v1 assertions are kept: reviewed descriptor bridge and registry-bound base freeze', () => {
  {
    const dir = stage();
    edit(dir, 'apps/web/lib/g678-calibration-product-bridge.server.ts', text => `${text}\n`);
    assert.throws(() => renderLoader(dir), /reviewed descriptor selection source/);
  }
  {
    const dir = stage(), base = current.inputs[5].path;
    assert.match(base, /^catalog\/product-bridge-calibrations\/g678-current-js-\d+-page/);
    edit(dir, base, text => `${text} `);
    assert.throws(() => renderLoader(dir), /actual base freeze size/);
  }
  {
    const dir = stage();
    edit(dir, 'packages/demos/src/registry.local-only.generated.ts', text => text.replace(/^      '[^']+': \(\) => import\(.*\n/m, ''));
    assert.throws(() => renderLoader(dir), /all local generated registry loaders recognized/);
  }
});

test('the command line checks both outputs, also through a symlinked path', () => {
  const dir = stage(), link = fs.mkdtempSync(path.join(os.tmpdir(), 'hfr-loader-v2-link-'));
  staged.push(link);
  fs.symlinkSync(path.join(root, 'scripts/generate-hfr-local-animation-loader-v2.mjs'), path.join(link, 'generator.mjs'));
  const run = (...args) => spawnSync(process.execPath, [path.join(link, 'generator.mjs'), ...args], {encoding: 'utf8'});
  const passed = run('--check', '--source-root', root, '--output-root', root);
  assert.equal(passed.status, 0, passed.stderr);
  const receipt = JSON.parse(passed.stdout);
  assert.equal(receipt.kind, 'hfr-exact-reachable-lesson-loader-v2');
  assert.deepEqual(receipt.outputs.map(output => output.path), [LOADER_PATH, CANDIDATE_MODULE_PATH]);
  for (const output of current.outputs) {
    fs.mkdirSync(path.dirname(path.join(dir, 'out', output.outputPath)), {recursive: true});
    fs.writeFileSync(path.join(dir, 'out', output.outputPath), output.text);
  }
  edit(dir, path.join('out', CANDIDATE_MODULE_PATH), text => text.replace(/'[0-9a-f]{64}'/, `'${'0'.repeat(64)}'`));
  const drifted = run('--check', '--source-root', root, '--output-root', path.join(dir, 'out'));
  assert.notEqual(drifted.status, 0);
  assert.match(drifted.stderr, /HFR loader projection drift: apps\/web\/lib\/hfr-local-candidates-v2\.generated\.ts/);
  const refused = run('--write', '--source-root', root, '--output-root', path.join(dir, 'out'));
  assert.match(refused.stderr, /refuse generated loader drift/);
});

test('v1 is superseded and fails closed on the delegating client', () => {
  assert.throws(() => renderLoaderV1(root), /candidate map: const CANDIDATE_SOURCES/);
});
