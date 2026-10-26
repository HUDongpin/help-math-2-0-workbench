import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {collectP010TextData, P010_GEOMETRY_PATH, P010_GEOMETRY_SHA} from './build-g678-alg-l12-p010-text-data.mjs';
import {P010_GLOSSARY_TERMS} from '../packages/demos/src/alg-l12-p010-glossary';
import {P010_TEXT_BINDING, P010_TITLE} from '../packages/demos/src/alg-l12-p010-typography';
import {
  P010_TYPOGRAPHY_ID as ID, P010_TYPOGRAPHY_SOURCE_ROOT as SOURCE_ROOT,
  P010_TYPOGRAPHY_SOURCE_PATH as SOURCE_PATH, P010_TYPOGRAPHY_SOURCE_SHA as SOURCE_SHA,
  P010_TYPOGRAPHY_BINDING_PATH, P010_TYPOGRAPHY_CHECK_PATH,
  P010_TYPOGRAPHY_CHECKS as CHECKS, P010_TYPOGRAPHY_SOURCE_RISKS as RISKS,
  P010_TYPOGRAPHY_SEED_PATHS, buildCandidate, collectP010TypographyImportClosure,
  validateP010SourceBindings, validateEvidence, finalize, main,
  type P010TypographyEvidence,
} from './prepare-g678-alg-l12-p010-typography-binding.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = `migrations/${ID}`;
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
type Mutable<T> = T extends readonly (infer Item)[] ? Mutable<Item>[] :
  T extends object ? {-readonly [Key in keyof T]: Mutable<T[Key]>} : T;
const RECEIPT = 'evidence/isolated-schema-fixture.json';
const FIXTURE_ROOT = path.join(ROOT, 'output/p010-typography-binding-review-20260927-v1/fixtures');

function receiptFixture(t: test.TestContext) {
  fs.mkdirSync(FIXTURE_ROOT, {recursive: true});
  const root = fs.realpathSync(fs.mkdtempSync(path.join(FIXTURE_ROOT, 'schema-guard-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const put = (relative: string, value: string) => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), {recursive: true});
    fs.writeFileSync(path.join(root, relative), value);
    return {path: relative, bytes: Buffer.byteLength(value), sha256: hash(value)};
  };
  // Synthetic guards live only in this task's isolated output directory. They are
  // never supplied to the real finalizer or recorded as real technical results.
  const implementationFiles = [put('src/page.ts', '// isolated implementation fixture'),
    put('src/shared.css', '/* isolated shared fixture */')];
  const artifact = put('evidence/isolated-result.txt', 'synthetic validator fixture, no real passed result');
  const catalog = 'c'.repeat(64);
  const evidence: P010TypographyEvidence = {
    schemaVersion: 1, kind: 'p010-technical-typography-evidence-v1',
    animationId: ID, placementId: ID, sourceSwfSha256: SOURCE_SHA,
    sourceCatalogContentSha256: catalog, checkedAt: new Date().toISOString(),
    checks: Object.fromEntries(CHECKS.map(name => [name, 'passed'])),
    checkEvidence: Object.fromEntries(CHECKS.map(name => [name,
      {result: 'Isolated schema validator fixture only.', artifactPaths: [artifact.path]}])),
    resolvedSourceRisks: [...RISKS],
    sourceRiskResolutions: RISKS.map(kind => ({kind, disposition: 'Isolated guard fixture only.', artifactPaths: [artifact.path]})),
    languagePolicy: {en: 'source', es: 'source-fallback'}, artifacts: [artifact],
    checkedImplementationFiles: clone(implementationFiles),
  };
  const expected = {implementationFiles, sourceRisks: RISKS, sourceCatalogContentSha256: catalog};
  const save = () => put(RECEIPT, JSON.stringify(evidence));
  const run = () => validateEvidence(RECEIPT, expected, root);
  save();
  return {root, put, evidence, expected, implementationFiles, artifact, save, run};
}

function actualSource() {
  const sourceFile = path.join(SOURCE_ROOT, SOURCE_PATH);
  assert.equal(fs.realpathSync(sourceFile), sourceFile);
  assert.equal(fs.lstatSync(sourceFile).nlink, 1);
  const bytes = fs.readFileSync(sourceFile);
  assert.equal(bytes.length, 183770); assert.equal(hash(bytes), SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(bytes);
  const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, WORK, 'audit/typography-source-inventory-v1.json'), 'utf8'));
  const geometryBytes = fs.readFileSync(path.join(ROOT, P010_GEOMETRY_PATH));
  assert.equal(hash(geometryBytes), P010_GEOMETRY_SHA);
  const data = collectP010TextData(bytes, JSON.parse(geometryBytes.toString()));
  const glossary = clone(P010_GLOSSARY_TERMS) as unknown as Mutable<typeof P010_GLOSSARY_TERMS>;
  const native = clone(P010_TEXT_BINDING) as Mutable<typeof P010_TEXT_BINDING>;
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, WORK, 'typography-v1/runtime-meta.json'), 'utf8'));
  return {source, inventory, data, native, meta, glossary,
    run: () => validateP010SourceBindings(source, inventory, data, native, P010_TITLE, meta, glossary)};
}

test('fresh physical P010 source binds 53 text instances, 52 runs, title, four underlines, four ordered pairs and 10 links', () => {
  const f = actualSource(), result = f.run();
  assert.equal(result.sourceTextIds.length, 52); assert.equal(result.underlines.length, 4);
  assert.equal(result.orderedPairs.length, 4); assert.deepEqual(result.sourceRisks, [...RISKS]);
  assert.equal(f.native.blocks.length, 54); assert.equal(f.meta.exactSuppressionInstances.length, 58);
  assert.equal(f.source.shapeDefinitions.length, 58); assert.equal(f.glossary.length, 10);
  assert.equal(new Set(f.glossary.map(row => row.sourceKeyAttribute)).size, 9);
  assert.equal(f.inventory.nativeRunInstanceMetrics.length, 77);
});

test('source run omissions, duplicate reading order and wrong parent or outlined title instance fail closed', () => {
  for (const mutate of [
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[1]!.sourceTextIds.pop();},
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[2]!.readingOrder = f.native.blocks[1]!.readingOrder;},
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[2]!.instance = clone(f.native.blocks[1]!.instance);},
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[1]!.instance!.path[0]!.characterId = 97;},
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[0]!.sourceShapeIds = [19];},
    (f: ReturnType<typeof actualSource>) => {f.native.blocks[0]!.instance!.path[0]!.depth = 107;},
    (f: ReturnType<typeof actualSource>) => {f.data.definitions[0]!.runs[0]!.text = 'invented';},
    (f: ReturnType<typeof actualSource>) => {f.data.instances[0]!.firstFrame++;},
  ]) {
    const f = actualSource(); mutate(f); assert.throws(f.run);
  }
});

test('reviewed shape hashes, source roles, suppression membership and exact lifetimes cannot drift', () => {
  for (const mutate of [
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions.find((row: any) => row.characterId === 35).sourceTagSha256 = 'a'.repeat(64);},
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions.find((row: any) => row.characterId === 97).visualTranscription = 'invented title';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions[0].visualTranscription = 'invented shape words';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions[0].nativeDisposition = '';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions[0].reviewRole = 'clip-mask';},
    (f: ReturnType<typeof actualSource>) => {f.meta.version = 'p009-source-native-text-v1';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.shapeDefinitions.pop();},
    (f: ReturnType<typeof actualSource>) => {f.meta.exactSuppressionInstances.find((row: any) => row.id === 'root:108:1:97').lastFrameExclusive--;},
    (f: ReturnType<typeof actualSource>) => {f.meta.exactSuppressionInstances.find((row: any) => row.id === 'root:1:1:96/sprite-96:30:1:35').firstFrame--;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeSuppressionInstances[0].id = f.inventory.nativeSuppressionInstances[1].id;},
  ]) {
    const f = actualSource(); mutate(f); assert.throws(f.run);
  }
});

test('both Position instances and length/width half-open spans retain distinct source identity and exact lookup case', () => {
  const correct = actualSource(); correct.run();
  const positions = correct.glossary.filter(row => row.sourceKeyAttribute === 'Position');
  assert.equal(positions.length, 2); assert.notEqual(positions[0]!.instanceId, positions[1]!.instanceId);
  assert.notEqual(positions[0]!.sourceTextId, positions[1]!.sourceTextId);
  const length = correct.glossary.find(row => row.sourceKeyAttribute === 'length')!;
  const width = correct.glossary.find(row => row.sourceKeyAttribute === 'Width')!;
  assert.equal(length.sourceTextId, width.sourceTextId); assert(length.spanEnd < width.spanStart);
  assert.equal(length.firstReadableFrame, 86); assert.equal(width.firstReadableFrame, 86);
  assert.equal(length.dictionaryLookupKey, 'Length');
  for (const mutate of [
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[9]!, 'instanceId', f.glossary[2]!.instanceId);},
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[4]!, 'spanStart', 0);},
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[3]!, 'spanEnd', 13);},
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[3]!, 'dictionaryLookupKey', 'length');},
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[4]!, 'dictionaryLookupKey', 'width');},
    (f: ReturnType<typeof actualSource>) => {Reflect.set(f.glossary[3]!, 'firstReadableFrame', 85);},
    (f: ReturnType<typeof actualSource>) => {f.inventory.glossaryInstances[9].sourceTextId = 'character-20/run-5';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.glossaryButtons[0].sourceKeyAttribute = 'point';},
  ]) {
    const f = actualSource(); mutate(f); assert.throws(f.run);
  }
});

test('A–D signed pairs use source fragments, three independent callout baselines and separate reused character-50 instances', () => {
  const correct = actualSource(); const result = correct.run();
  assert.deepEqual(result.orderedPairs.map(row => [row.point, row.pair]), [['A', '(5,3)'], ['B', '(-4,2)'], ['C', '(-3,-5)'], ['D', '(5,-3)']]);
  assert.notEqual(result.orderedPairs[0]!.sourceInstances[1]!.instanceId, result.orderedPairs[3]!.sourceInstances[1]!.instanceId);
  for (const mutate of [
    (f: ReturnType<typeof actualSource>) => {f.data.definitions.find((row: any) => row.characterId === 84)!.runs[0]!.text = '5)';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.orderedPairs[3].coordinateComponents[0].instanceId = f.inventory.orderedPairs[0].coordinateComponents[0].instanceId;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.orderedPairs[2].semanticCoordinates[1] = 5;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.orderedPairs[3].literal = '(5,3)';},
    (f: ReturnType<typeof actualSource>) => {f.inventory.orderedPairs[0].callout.firstFrame++;},
    (f: ReturnType<typeof actualSource>) => {const row = f.data.definitions.find((row: any) => row.characterId === 56)!; row.runs[1]!.baselineTwips = clone(row.runs[0]!.baselineTwips);},
  ]) {
    const f = actualSource(); mutate(f); assert.throws(f.run);
  }
});

test('all 77 native run/instance metrics retain source visibility, pen baseline, advance and stage transformation', () => {
  for (const mutate of [
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics[0].baselineTwips[0]++;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics[0].advanceTwips++;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics[0].stageBaselineAtFirstPlacementPixels[1]++;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics[0].firstAllInkBoundsContainedAndFullOpacityFrame++;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics[0].baselineOwnedByRun = false;},
    (f: ReturnType<typeof actualSource>) => {f.inventory.nativeRunInstanceMetrics.push(clone(f.inventory.nativeRunInstanceMetrics[0]));},
  ]) {
    const f = actualSource(); mutate(f); assert.throws(f.run);
  }
});

test('isolated receipt binds every current input and observation artifact without producing an actual pass', t => {
  const f = receiptFixture(t), validated = f.run();
  assert.deepEqual(validated.checkedImplementationFiles, f.implementationFiles);
  assert.equal(validated.receipt.path, RECEIPT);
  assert.deepEqual(validated.artifacts, [f.artifact]);
});

test('receipt rejects missing/extra inputs, changed bytes, fabricated hashes and byte counts', t => {
  const f = receiptFixture(t), original = clone(f.evidence);
  f.evidence.checkedImplementationFiles.pop(); f.save(); assert.throws(f.run, /entire current implementation/u);
  Object.assign(f.evidence, clone(original));
  f.evidence.checkedImplementationFiles.push(f.put('src/unrelated.ts', '// unrelated')); f.save();
  assert.throws(f.run, /entire current implementation/u);
  Object.assign(f.evidence, clone(original));
  f.put(f.implementationFiles[0]!.path, '// byte drift'); f.save(); assert.throws(f.run, /stale checked implementation/u);
  f.put(f.implementationFiles[0]!.path, '// isolated implementation fixture');
  f.evidence.artifacts[0]!.sha256 = 'f'.repeat(64); f.save(); assert.throws(f.run, /stale observation artifact/u);
  Object.assign(f.evidence, clone(original)); f.evidence.artifacts[0]!.bytes++; f.save();
  assert.throws(f.run, /stale observation artifact/u);
});

test('each of the twelve actual results needs an artifact-backed result and all source risks exactly once', t => {
  const f = receiptFixture(t), original = clone(f.evidence);
  delete f.evidence.checks.accessibility; f.save(); assert.throws(f.run, /exactly twelve/u);
  Object.assign(f.evidence, clone(original));
  Reflect.set(f.evidence.checks, 'accessibility', 'pending'); f.save(); assert.throws(f.run, /not passed/u);
  Object.assign(f.evidence, clone(original)); delete f.evidence.checkEvidence.lifecycle; f.save();
  assert.throws(f.run, /observation mapping/u);
  Object.assign(f.evidence, clone(original)); f.evidence.checkEvidence.performance!.artifactPaths = ['src/page.ts']; f.save();
  assert.throws(f.run, /must cite checked observation/u);
  Object.assign(f.evidence, clone(original)); f.evidence.checkEvidence.hostIntegration!.result = ' '; f.save();
  assert.throws(f.run, /concrete hostIntegration/u);
  Object.assign(f.evidence, clone(original)); f.evidence.resolvedSourceRisks[0] = f.evidence.resolvedSourceRisks[1]!; f.save();
  assert.throws(f.run, /every current source risk/u);
  Object.assign(f.evidence, clone(original)); f.evidence.sourceRiskResolutions[0]!.artifactPaths = []; f.save();
  assert.throws(f.run, /must cite checked observation/u);
  Object.assign(f.evidence, clone(original)); f.evidence.sourceRiskResolutions[0]!.kind = f.evidence.sourceRiskResolutions[1]!.kind; f.save();
  assert.throws(f.run, /nonduplicate source-risk/u);
});

test('wrong source, catalog, page, kind, timestamp or Spanish policy fails closed', t => {
  const f = receiptFixture(t), original = clone(f.evidence);
  for (const [key, value] of [
    ['sourceSwfSha256', 'a'.repeat(64)], ['sourceCatalogContentSha256', 'b'.repeat(64)],
    ['animationId', 'shared-alg001-l12-p006'], ['placementId', 'shared-alg001-l12-p008'],
    ['kind', 'p006-technical-typography-evidence-v1'], ['schemaVersion', 2],
    ['checkedAt', 'invalid'], ['checkedAt', new Date(Date.now() + 60_000).toISOString()],
    ['checkedAt', '2020-01-01T00:00:00.000Z'], ['languagePolicy', {en: 'source', es: 'source'}],
  ] as const) {
    Object.assign(f.evidence, clone(original)); Reflect.set(f.evidence, key, value); f.save();
    assert.throws(f.run, () => true, `${key} must fail`);
  }
});

test('duplicate, unsafe, circular, implementation-only, symlink and hardlink artifacts are refused', t => {
  const f = receiptFixture(t), original = clone(f.evidence);
  f.evidence.artifacts.push(clone(f.artifact)); f.save(); assert.throws(f.run, /duplicate/u);
  Object.assign(f.evidence, clone(original)); f.evidence.artifacts[0]!.path = '../escape'; f.save(); assert.throws(f.run, /relative path/u);
  Object.assign(f.evidence, clone(original)); f.evidence.artifacts[0]!.path = RECEIPT; f.save(); assert.throws(f.run, /circular/u);
  Object.assign(f.evidence, clone(original)); f.evidence.artifacts = [clone(f.implementationFiles[0]!)]; f.save();
  assert.throws(f.run, /not an independently observed/u);
  Object.assign(f.evidence, clone(original)); f.evidence.artifacts[0]!.path = P010_TYPOGRAPHY_BINDING_PATH; f.save(); assert.throws(f.run, /circular/u);
  Object.assign(f.evidence, clone(original));
  const target = path.join(f.root, f.artifact.path), alias = 'evidence/link.txt';
  fs.symlinkSync(target, path.join(f.root, alias)); f.evidence.artifacts[0]!.path = alias; f.save();
  assert.throws(f.run, /physical file/u);
  Object.assign(f.evidence, clone(original)); fs.linkSync(target, path.join(f.root, 'evidence/hardlink.txt')); f.save();
  assert.throws(f.run, /single-link/u);
});

test('literal import closure includes nested imports, type imports, CSS/JSON and actual registry boundary bytes', t => {
  const f = receiptFixture(t);
  f.put('apps/web/tsconfig.json', JSON.stringify({compilerOptions: {moduleResolution: 'Bundler', module: 'ESNext', resolveJsonModule: true}, include: ['../../src/**/*.ts']}));
  f.put('src/page.ts', "import './style.css'; import data from './data.json'; import type {T} from './type'; export {value} from './nested'; export async function load(){return import('../packages/demos/src/registry.generated')}\n");
  f.put('src/style.css', '/* literal css */'); f.put('src/data.json', '{"literal":true}');
  f.put('src/type.ts', 'export type T = string;'); f.put('src/nested.ts', "import './leaf'; export const value = 1;");
  f.put('src/leaf.ts', 'export const leaf = 1;');
  const registry = f.put('packages/demos/src/registry.generated.ts', "export async function other(){return import('./unrelated')}\n");
  f.put('packages/demos/src/unrelated.ts', '// unrelated lesson branch');
  const collected = collectP010TypographyImportClosure(f.root, ['src/page.ts']);
  for (const relative of ['src/page.ts', 'src/style.css', 'src/data.json', 'src/type.ts', 'src/nested.ts', 'src/leaf.ts', registry.path])
    assert(collected.files.has(relative), relative);
  assert(!collected.files.has('packages/demos/src/unrelated.ts'));
  assert.deepEqual(collected.files.get(registry.path)!.pin, registry);
  assert.equal(collected.closure.completeTransitiveClosure, false);
  assert.deepEqual(collected.closure.registryStateBoundaries, [registry.path]);
  assert.throws(() => collectP010TypographyImportClosure(f.root, [P010_TYPOGRAPHY_CHECK_PATH]), /output/u);
  f.put('src/page.ts', "import './absent';");
  assert.throws(() => collectP010TypographyImportClosure(f.root, ['src/page.ts']), /unresolved local/u);
});

test('local scope gates and read-only CLI reject production, wrong source, writes and missing receipts', async () => {
  const saved = {NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV};
  try {
    delete process.env.VERCEL; delete process.env.VERCEL_ENV; delete process.env.NODE_ENV;
    await assert.rejects(buildCandidate({sourceRoot: `${SOURCE_ROOT}/`}), /exact physical AWS/u);
    for (const [name, value] of [['NODE_ENV', 'production'], ['VERCEL', '1'], ['VERCEL_ENV', 'preview']] as const) {
      process.env[name] = value;
      await assert.rejects(buildCandidate({sourceRoot: SOURCE_ROOT}), /local engineering/u);
      delete process.env[name];
    }
    await assert.rejects(main(['--write']), /read-only/u);
    await assert.rejects(main(['--evidence']), /Usage/u);
    await assert.rejects(main([]), /Usage/u);
  } finally {
    for (const [key, value] of Object.entries(saved)) value === undefined ? delete process.env[key] : process.env[key] = value;
  }
});

test('actual candidate is reproducible, pins every declared/shared/page input and stays pending', async () => {
  const prepared = await buildCandidate({sourceRoot: SOURCE_ROOT});
  const second = await buildCandidate({sourceRoot: SOURCE_ROOT});
  assert(prepared.bytes.equals(second.bytes));
  assert.equal(prepared.binding.sourceCatalogContentSha256,
    hash(JSON.stringify(collectSwfTextSourceCatalog(fs.readFileSync(path.join(SOURCE_ROOT, SOURCE_PATH))))));
  assert.equal(prepared.binding.implementation.status, 'candidate');
  assert.equal(prepared.binding.preparationOnly, true);
  assert.equal(prepared.binding.sourceRiskEvidence.technicalRiskCheckRecorded, false);
  assert(prepared.binding.unresolved.length > 0); assert(prepared.binding.independentPending.length > 0);
  const pins = new Map(prepared.binding.implementation.files.map(pin => [pin.path, pin]));
  assert.equal(pins.size, prepared.binding.implementation.files.length);
  for (const relative of P010_TYPOGRAPHY_SEED_PATHS) assert(pins.has(relative), relative);
  const integration = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/typography-v1/g678-integration.json'), 'utf8'));
  for (const pin of integration.sharedFiles) assert.deepEqual(pins.get(pin.path), pin);
  assert(!pins.has(P010_TYPOGRAPHY_BINDING_PATH)); assert(!pins.has(P010_TYPOGRAPHY_CHECK_PATH));
  assert.equal(prepared.binding.nativeTextEvidence.glossary.length, 10);
  assert.equal(prepared.binding.sourceRoleDecisions.length, 58);
  const roleCounts = new Map<string, number>();
  for (const decision of prepared.binding.sourceRoleDecisions) roleCounts.set(decision.kind, (roleCounts.get(decision.kind) ?? 0) + 1);
  assert.deepEqual(Object.fromEntries(roleCounts), {'source-educational-geometry': 50, 'source-mask-geometry': 2,
    'decorative-glossary-underlines': 4, 'source-glossary-hit-geometry': 1, 'outlined-text': 1});
  assert.equal(prepared.binding.nativeTextEvidence.orderedPairs.length, 4);
  assert.equal(prepared.binding.nativeTextEvidence.runInstancePairs, 77);
  assert.equal(prepared.binding.nativeTextEvidence.sourceGeometry.sha256, P010_GEOMETRY_SHA);
  assert(!pins.has('apps/web/tests/g678-alg-l12-p010-host-probe.server-test.ts'));
  assert(pins.has(`${WORK}/evidence/CURRENT_JS_IMPLEMENTATION_2026-09-27.md`));
  assert.equal(prepared.binding.externalSourceFiles.length, 4);
  assert(prepared.binding.implementation.closure.registryStateBoundaries.length > 0);
  const stale = clone(prepared.binding); stale.implementation.files[0]!.sha256 = 'a'.repeat(64);
  await assert.rejects(finalize({binding: stale, bytes: Buffer.from(`${JSON.stringify(stale, null, 2)}\n`)},
    'never-existing-receipt.json', {sourceRoot: SOURCE_ROOT}), /preparation is stale/u);
});


test('the preparation producer exposes no source, catalog, registry or evidence writer', () => {
  const file = fs.readFileSync(path.join(ROOT, 'scripts/prepare-g678-alg-l12-p010-typography-binding.mts'), 'utf8');
  assert(!/\b(?:writeFile|appendFile|mkdir|rm|unlink|rename|copyFile)(?:Sync)?\s*\(/u.test(file));
  assert(!P010_TYPOGRAPHY_SEED_PATHS.includes('apps/web/tests/g678-alg-l12-p010-host-probe.server-test.ts'));
  assert(P010_TYPOGRAPHY_SEED_PATHS.includes('apps/web/tests/g678-alg-l12-p010-current-js-v1.server-test.ts'));
});
