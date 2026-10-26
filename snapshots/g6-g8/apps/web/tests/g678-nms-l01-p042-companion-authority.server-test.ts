import {currentTypographyHostBinding,resolveTypographyHostClosurePins} from '../lib/g678-typography-host-successor.server';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {linkSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {collectG678P042Pins, G678_P042_AUTHORITY, G678_P042_BASE, G678_P042_ID, G678_P042_PREDECESSOR,
  G678_P042_READABLE, G678_P042_RUNTIME, G678_P042_SUFFIX, g678P042PhysicalClosurePins, readG678P042FileBinding,
  readG678P042PhysicalPin, resolveG678P042PhysicalPath, validateG678P042CompanionAuthority,
  validateG678P042PhysicalClosure} from '../lib/g678-nms-l01-p042-companion-authority.server';

const root = realpathSync(new URL('../../../', import.meta.url));
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const pin = (name: string, bytes: Uint8Array) => ({path: name, bytes: bytes.length, sha256: hash(bytes)});
function authorityFixture() {
  const read = (pin: Parameters<typeof readG678P042FileBinding>[1]) => readG678P042FileBinding(root, pin);
  const predecessorFreeze = read(G678_P042_PREDECESSOR);
  const freeze = structuredClone(predecessorFreeze.value) as any;
  // Authority-only membership envelope; this is deliberately not a product
  // snapshot or a registered-page fixture. Product tests use the real planner.
  freeze.selectedPages.push({animationId: G678_P042_ID, complexityLane: 'behavior-heavy', productCalibrationPassed: false,
    engineeringPreviewReady: false, implementation: {kind: 'maintained-dom-current-js-candidate', deploymentScope: 'local-only',
      productCalibrationPassed: false, familyVisualPlaybackCalibrationPassed: false, registeredCompanionProductQaPassed: false}});
  freeze.registrationCandidatePlacementCount = 378; freeze.sharedAdapterPlacementCount = 365;
  freeze.advancedManualPlacementCount = 13;
  freeze.inputs.p042PredecessorFreeze = G678_P042_PREDECESSOR;
  freeze.inputs.selectionAuthorities.push(G678_P042_AUTHORITY);
  return {authority: read(G678_P042_AUTHORITY), baseCandidate: read(G678_P042_BASE),
    readableCandidate: read(G678_P042_READABLE), predecessorFreeze, freeze};
}

test('sealed one-page authority binds source root6/main125 and the one exact readable slot without granting acceptance', () => {
  const input = authorityFixture(), before = JSON.stringify(input), result = validateG678P042CompanionAuthority(input);
  assert.equal(JSON.stringify(input), before); assert.equal(result.entry.key, G678_P042_ID);
  assert.deepEqual(result.entry.runtimeContract, G678_P042_RUNTIME);
  assert.deepEqual(result.proposedPresentation, {pageInteractionCompanionTargetIdSuffix: G678_P042_SUFFIX});
  assert.ok(Object.values(result.entry.acceptanceEffects as object).every(value => value === false));
});

test('canonical pins reject alias, size/hash, stale wrapper and forged source metadata regardless of binding field insertion order', () => {
  const input = authorityFixture();
  function permutations(items: string[]): string[][] {
    return items.length ? items.flatMap((item, i) => permutations(items.filter((_, n) => i !== n)).map(rest => [item, ...rest])) : [[]];
  }
  for (const key of ['authority', 'baseCandidate', 'readableCandidate', 'predecessorFreeze'] as const) {
    for (const order of permutations(['path', 'bytes', 'sha256', 'value'])) {
      const value = Object.fromEntries(order.map(field => [field, input[key][field as keyof typeof input[typeof key]]])) as typeof input[typeof key];
      assert.doesNotThrow(() => validateG678P042CompanionAuthority({...input, [key]: value}));
    }
    for (const fields of [{path: `${input[key].path}.alias`}, {bytes: input[key].bytes + 1},
      {sha256: '0'.repeat(64)}, {extra: true}]) {
      assert.throws(() => validateG678P042CompanionAuthority({...input, [key]: {...input[key], ...fields}}), /binding/u);
    }
  }
  for (const mutation of [(a: any) => {a.entries[0].moduleFile = a.entries[0].timeline;},
    (a: any) => {a.entries[0].source.sha256 = 'f'.repeat(64);},
    (a: any) => {a.entries[0].runtimeContract.lessonHostCapabilities.push('audio');},
    (a: any) => {a.entries[0].runtimeContract.rootBeginFrame = 1;},
    (a: any) => {a.entries[0].proposedPresentation.descriptorActivated = true;},
    (a: any) => {a.productCalibrationPassed = true;}]) {
    const value = structuredClone(input.authority.value); mutation(value);
    assert.throws(() => validateG678P042CompanionAuthority({...input, authority: {...input.authority, value}}), /canonical bytes/u);
  }
});

test('all377 previous page objects, authority lineage and historical lane counts are immutable', () => {
  for (const mutation of [(f: any) => {f.selectedPages[0].runtime.seed = '2';},
    (f: any) => {f.selectedPages.reverse();}, (f: any) => {f.selectedPages.push({animationId: G678_P042_ID});},
    (f: any) => {f.sharedAdapterPlacementCount = 364;}, (f: any) => {f.advancedManualPlacementCount = 14;},
    (f: any) => {f.inputs.selectionAuthorities.shift();},
    (f: any) => {f.inputs.p042PredecessorFreeze.sha256 = 'f'.repeat(64);}]) {
    const input = authorityFixture(); input.freeze = structuredClone(input.freeze); mutation(input.freeze);
    assert.throws(() => validateG678P042CompanionAuthority(input), /(?:all377|classification|prior selection|predecessor binding)/u);
  }
});

test('actual source packet and both candidate closures rehash ordinary files; logical VM audit is not a physical claim', () => {
  const original = process.env.HELP_MATH_G678_SOURCE_ROOT;
  process.env.HELP_MATH_G678_SOURCE_ROOT = original ?? path.join(path.dirname(root),
    'HELP MATH Related Files/AWS Grade-Classified Courseware');
  try {
    const validated = validateG678P042CompanionAuthority(authorityFixture());
    const pins = g678P042PhysicalClosurePins(root, validated);
    const successor=currentTypographyHostBinding(root);
    if(successor)assert.throws(()=>validateG678P042PhysicalClosure(root,validated),/physical input changed/);
    const currentPins=resolveTypographyHostClosurePins(root,pins);
    const paths=successor?currentPins.map(p=>{readG678P042PhysicalPin(root,p);return resolveG678P042PhysicalPath(root,p.path);}):validateG678P042PhysicalClosure(root,validated);
    assert.ok(paths.length >= 322); assert.ok(currentPins.length >= paths.length);
    assert.equal(pins.some(pin => pin.path === 'in-memory-p042-readable-metadata.cjs'), false);
    for (const name of ['packages/demos/src/g678-nms-l01-p042-readable-companion-candidate.tsx',
      'packages/demos/src/g678-nms-l01-p042-candidate.tsx',
      'packages/demos/src/generated/g678-nms-l01-p042-source-visual-v1.ts',
      'G6-G8-shared/NMS002/L1/TS/L1TS06.swf']) assert.ok(pins.some(pin => pin.path === name));
    assert.ok(pins.some(pin => pin.path.endsWith('/output-inventory.json')));
  } finally {
    if (original === undefined) delete process.env.HELP_MATH_G678_SOURCE_ROOT;
    else process.env.HELP_MATH_G678_SOURCE_ROOT = original;
  }
});

test('actual sealed base/readable files are ordinary canonical files and loader fields match real snapshot order', () => {
  for (const expected of [G678_P042_BASE, G678_P042_READABLE]) {
    const actual = readG678P042FileBinding(root, expected);
    assert.deepEqual(Object.keys(actual), ['bytes', 'path', 'sha256', 'value']);
    assert.equal(actual.path, expected.path); assert.equal(actual.sha256, expected.sha256);
    assert.equal(actual.bytes, expected.bytes);
  }
});

test('physical input hash/size/ordinary/single-link/alias checks fail closed using retained temp evidence only', () => {
  const directory = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'g678-p042-physical-')));
  const data = Buffer.from('exact local evidence\n'), expected = pin('evidence.txt', data);
  writeFileSync(path.join(directory, expected.path), data, {flag: 'wx'});
  assert.deepEqual(readG678P042PhysicalPin(directory, expected), data);
  for (const altered of [{...expected, bytes: expected.bytes + 1}, {...expected, sha256: '0'.repeat(64)},
    {...expected, path: './evidence.txt'}, {...expected, path: 'unused/../evidence.txt'}]) {
    assert.throws(() => readG678P042PhysicalPin(directory, altered), /G678_P042_COMPANION_AUTHORITY_INVALID/u);
  }
  symlinkSync(path.join(directory, expected.path), path.join(directory, 'symlink.txt'));
  assert.throws(() => readG678P042PhysicalPin(directory, {...expected, path: 'symlink.txt'}), /noncanonical physical input/u);
  linkSync(path.join(directory, expected.path), path.join(directory, 'hardlink.txt'));
  assert.throws(() => readG678P042PhysicalPin(directory, expected), /noncanonical physical input/u);
  unlinkSync(path.join(directory, 'hardlink.txt'));
  assert.deepEqual(readG678P042PhysicalPin(directory, expected), data);
  assert.throws(() => readG678P042PhysicalPin(directory, {...expected, path: 'missing.txt'}), /ENOENT/u);
  // Retain this tiny evidence directory; no repository/source file was edited.
});

test('esbuild vendor relative pins resolve only within the canonical installed dependency tree', () => {
  const readable = readG678P042FileBinding(root, G678_P042_READABLE).value as any;
  const vendors = readable.files.filter((item: any) => item.path.startsWith('../'));
  assert.ok(vendors.length > 0);
  const vendorRoot = realpathSync(path.join(root, 'node_modules'));
  for (const binding of vendors) {
    assert.ok(resolveG678P042PhysicalPath(root, binding.path).startsWith(`${vendorRoot}/`));
    assert.equal(hash(readG678P042PhysicalPin(root, binding)), binding.sha256);
    assert.throws(() => readG678P042PhysicalPin(root, {...binding, sha256: 'f'.repeat(64)}), /physical input changed/u);
  }
  assert.throws(() => resolveG678P042PhysicalPath(root, '../HELP MATH 2.0/AGENTS.md'), /escapes installed vendor tree/u);
  assert.throws(() => resolveG678P042PhysicalPath(root, '../HELP MATH 2.0/source-assets'), /escapes installed vendor tree/u);
});

test('pinned closure deduplicates exact references but rejects conflicting hashes and malformed pins', () => {
  const bytes = readFileSync(path.join(root, G678_P042_BASE.path));
  const actual = pin(G678_P042_BASE.path, bytes);
  assert.deepEqual(collectG678P042Pins([actual, {nested: [actual]}]), [actual]);
  assert.throws(() => collectG678P042Pins([actual, {...actual, bytes: actual.bytes + 1}]), /conflicting pin/u);
  assert.throws(() => collectG678P042Pins([{path: 'invalid', bytes: 1, sha256: 'no'}]), /invalid file pin/u);
});
