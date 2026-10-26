import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  P005_TYPOGRAPHY_ID, P005_TYPOGRAPHY_SOURCE_SHA, P005_TYPOGRAPHY_CATALOG_SHA,
  P005_TYPOGRAPHY_CHECKS, P005_TYPOGRAPHY_SOURCE_RISKS,
  P005_TYPOGRAPHY_BINDING_PATH, P005_TYPOGRAPHY_CHECK_PATH, P005_TYPOGRAPHY_SEED_PATHS,
  collectP005TypographyImportClosure, validateP005TypographyEvidence, finalizeP005TypographyBinding,
  writeP005TypographyPair, checkP005TypographyPair, parseP005TypographyArguments, main,
  type P005TypographyPin, type P005TechnicalTypographyEvidence, type P005TypographyPreparation,
} from './prepare-g678-alg-l12-p005-typography-binding.mts';

const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const json = (value: unknown) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const RECEIPT = 'evidence/independent-receipt.json';
const ID = P005_TYPOGRAPHY_ID;
const RISKS = [...P005_TYPOGRAPHY_SOURCE_RISKS];

/** These synthetic records test validation/publication guards in a disposable
 * isolated root. They do not run real page preparation, create a worktree pair,
 * or establish any P005 check or acceptance result. */
function fixture(t: test.TestContext) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p005-typography-guards-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const put = (relative: string, contents: string | Buffer): P005TypographyPin => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), {recursive: true});
    fs.writeFileSync(path.join(root, relative), contents);
    return {path: relative, bytes: Buffer.byteLength(contents), sha256: hash(contents)};
  };
  const implementationFiles = [put('src/page.tsx', '// isolated page fixture'),
    put('src/shared.ts', '// isolated shared fixture')];
  const artifact = put('evidence/guard-artifact.txt', 'Synthetic guard evidence, no actual technical pass.');
  const evidence: P005TechnicalTypographyEvidence = {
    schemaVersion: 1, kind: 'p005-technical-typography-evidence-v1', animationId: ID, placementId: ID,
    sourceSwfSha256: P005_TYPOGRAPHY_SOURCE_SHA, sourceCatalogContentSha256: P005_TYPOGRAPHY_CATALOG_SHA,
    checkedAt: new Date().toISOString(),
    checks: Object.fromEntries(P005_TYPOGRAPHY_CHECKS.map(check => [check, 'passed' as const])),
    resolvedSourceRisks: [...RISKS], languagePolicy: {en: 'source', es: 'source-fallback'},
    sourceRiskResolutions: RISKS.map(kind => ({kind, disposition: 'Synthetic guard fixture only.', artifactPaths: [artifact.path]})),
    artifacts: [{...artifact}], checkedImplementationFiles: implementationFiles.map(pin => ({...pin})),
  };
  const save = () => put(RECEIPT, json(evidence));
  const run = (checkedAfter?: number, now?: number) => validateP005TypographyEvidence(RECEIPT,
    {implementationFiles, sourceRisks: RISKS, checkedAfter}, root, now);
  const candidate = {
    schemaVersion: 1, version: 'p005-source-native-text-v1', animationId: ID, placementId: ID,
    sourceSwfSha256: P005_TYPOGRAPHY_SOURCE_SHA, template: 'explanation',
    blocks: [{id: 'title', sourceTextIds: [], sourceShapeIds: [394], role: 'title', language: 'en',
      readingOrder: 0, valueSource: 'source-static', instance: {
        id: 'root:135:1:395/sprite-395:2:1:394', path: [
          {timelineId: 'root', depth: 135, generation: 1, characterId: 395},
          {timelineId: 'sprite-395', depth: 2, generation: 1, characterId: 394},
        ],
      }}],
    sourceRelativePath: 'G6-G8-shared/ALG001/L12/RW/L12RW05.swf',
    sourceCatalogContentSha256: P005_TYPOGRAPHY_CATALOG_SHA, sourceRoleDecisions: [],
    languagePolicy: evidence.languagePolicy,
    sourceRiskEvidence: {sourceDisposition: artifact, graphicsDisposition: artifact, implementationRoute: artifact,
      exactSuppressionManifest: artifact, nativeRuntimeMetadata: artifact,
      sourceParserRisks: RISKS, technicalRiskCheckRecorded: false},
    generator: {path: 'scripts/prepare-g678-alg-l12-p005-typography-binding.mts', version: '1.0.0', sha256: hash('synthetic producer')},
    implementation: {status: 'candidate', files: implementationFiles, closure: {scope: 'isolated-guard-fixture'}},
    unresolved: ['Synthetic guard candidate only.'], independentPending: ['All actual acceptance gates'], preparationOnly: true,
  };
  const prepared = {root, sourceRoot: root, sourcePin: artifact, binding: candidate, bytes: json(candidate), checkedAfter: 0} as unknown as P005TypographyPreparation;
  save();
  return {root, put, evidence, save, run, implementationFiles, artifact, prepared,
    finalize: () => finalizeP005TypographyBinding(prepared, RECEIPT)};
}

test('receipt validates actual current artifacts, exact four risks and complete input pins', t => {
  const f = fixture(t), result = f.run();
  assert.equal(result.evidence.kind, 'p005-technical-typography-evidence-v1');
  assert.deepEqual(result.checkedImplementationFiles, f.implementationFiles);
  assert.equal(result.receipt.path, RECEIPT);
  assert.deepEqual(result.artifacts, [f.artifact]);
});

test('implementation or artifact content/size drift fails even when the schema is valid', t => {
  const f = fixture(t);
  f.put(f.implementationFiles[0]!.path, '// changed page fixture');
  assert.throws(() => f.run(), /stale checked implementation/u);
  f.put(f.implementationFiles[0]!.path, '// isolated page fixture');
  f.evidence.checkedImplementationFiles[0]!.bytes = 1; f.save();
  assert.throws(() => f.run(), /stale checked implementation size/u);
  f.evidence.checkedImplementationFiles = f.implementationFiles.map(pin => ({...pin}));
  f.evidence.artifacts[0]!.sha256 = 'a'.repeat(64); f.save();
  assert.throws(() => f.run(), /stale evidence artifact/u);
  f.evidence.artifacts = [{...f.artifact}];
  f.evidence.artifacts[0]!.bytes = 0; f.save();
  assert.throws(() => f.run(), /stale evidence artifact size/u);
});

test('input closure omissions, extras and duplicate references are rejected', t => {
  const f = fixture(t);
  f.evidence.checkedImplementationFiles.pop(); f.save();
  assert.throws(() => f.run(), /all current implementation files/u);
  f.evidence.checkedImplementationFiles = [...f.implementationFiles,
    f.put('src/unrelated.ts', '// extra unreviewed fixture')]; f.save();
  assert.throws(() => f.run(), /all current implementation files/u);
  f.evidence.checkedImplementationFiles = [...f.implementationFiles, f.implementationFiles[0]!]; f.save();
  assert.throws(() => f.run(), /circular or duplicate/u);
});

test('all twelve actual technical results are required and unrelated checks cannot substitute', t => {
  const f = fixture(t);
  for (const check of P005_TYPOGRAPHY_CHECKS) {
    f.evidence.checks[check] = 'failed' as 'passed'; f.save();
    assert.throws(() => f.run(), /not passed/u);
    f.evidence.checks[check] = 'passed';
  }
  delete f.evidence.checks.resourceStability; f.save();
  assert.throws(() => f.run(), /exactly twelve/u);
  f.evidence.checks.resourceStability = 'passed'; f.evidence.checks.unrelated = 'passed'; f.save();
  assert.throws(() => f.run(), /exactly twelve/u);
});

test('every current risk needs a unique explanation backed by listed current artifacts', t => {
  const f = fixture(t);
  f.evidence.resolvedSourceRisks.pop(); f.save();
  assert.throws(() => f.run(), /every current source risk/u);
  f.evidence.resolvedSourceRisks = [...RISKS, RISKS[0]!]; f.save();
  assert.throws(() => f.run(), /every current source risk/u);
  f.evidence.resolvedSourceRisks = [...RISKS];
  f.evidence.sourceRiskResolutions.pop(); f.save();
  assert.throws(() => f.run(), /every source risk/u);
  f.evidence.sourceRiskResolutions = RISKS.map(kind => ({kind, disposition: 'Synthetic test only.', artifactPaths: [f.artifact.path]}));
  f.evidence.sourceRiskResolutions[1]!.kind = RISKS[0]!; f.save();
  assert.throws(() => f.run(), /unique source-risk/u);
  f.evidence.sourceRiskResolutions[1]!.kind = RISKS[1]!;
  f.evidence.sourceRiskResolutions[0]!.disposition = ' '; f.save();
  assert.throws(() => f.run(), /explanation required/u);
  f.evidence.sourceRiskResolutions[0]!.disposition = 'Synthetic test only.';
  f.evidence.sourceRiskResolutions[0]!.artifactPaths = ['evidence/unlisted.json']; f.save();
  assert.throws(() => f.run(), /actual current receipt artifacts/u);
  f.evidence.sourceRiskResolutions[0]!.artifactPaths = [f.artifact.path, f.artifact.path]; f.save();
  assert.throws(() => f.run(), /actual current receipt artifacts/u);
  assert.throws(() => validateP005TypographyEvidence(RECEIPT,
    {implementationFiles: f.implementationFiles, sourceRisks: RISKS.slice(1)}, f.root), /exact current four/u);
});

test('source/placement/schema identity and explicit English fallback cannot drift', t => {
  const f = fixture(t), record = f.evidence as unknown as Record<string, unknown>;
  for (const [key, wrong] of [['animationId', 'shared-alg001-l12-p006'], ['placementId', 'shared-alg001-l12-p004'],
    ['sourceSwfSha256', 'b'.repeat(64)], ['sourceCatalogContentSha256', 'c'.repeat(64)],
    ['kind', 'p006-technical-typography-evidence-v1'], ['schemaVersion', 2]] as const) {
    const original = record[key]; record[key] = wrong; f.save(); assert.throws(() => f.run()); record[key] = original;
  }
  f.evidence.languagePolicy.es = 'source' as 'source-fallback'; f.save();
  assert.throws(() => f.run(), /fallback required/u);
});

test('nonfuture timestamps and freshness after changed implementation inputs are enforced', t => {
  const f = fixture(t), now = Date.now();
  f.evidence.checkedAt = 'not-a-date'; f.save(); assert.throws(() => f.run(undefined, now), /nonfuture/u);
  f.evidence.checkedAt = new Date(now + 10_000).toISOString(); f.save();
  assert.throws(() => f.run(undefined, now), /nonfuture/u);
  f.evidence.checkedAt = new Date(now - 20_000).toISOString(); f.save();
  assert.throws(() => f.run(now - 5_000, now), /fresh receipt/u);
  f.evidence.checkedAt = new Date(now).toISOString(); f.save();
  f.run(now + 500, now);
});

test('outputs, registry state, self-reference and unsafe paths cannot be receipt evidence', t => {
  const f = fixture(t);
  for (const forbidden of [P005_TYPOGRAPHY_BINDING_PATH, P005_TYPOGRAPHY_CHECK_PATH,
    'packages/demos/private-current-js-registry.json', 'packages/demos/src/registry.local-only.generated.ts', RECEIPT]) {
    f.evidence.artifacts = [{path: forbidden, sha256: f.artifact.sha256}]; f.save();
    assert.throws(() => f.run(), /circular or duplicate/u);
  }
  for (const unsafe of ['../outside.txt', '/absolute.txt', 'a//b.txt', 'a/./b.txt', 'a\\b.txt']) {
    f.evidence.artifacts = [{path: unsafe, sha256: f.artifact.sha256}]; f.save();
    assert.throws(() => f.run(), /ordinary relative path/u);
  }
  f.evidence.artifacts = [{...f.artifact}]; f.evidence.artifacts[0]!.sha256 = 'short'; f.save();
  assert.throws(() => f.run(), /full evidence artifact SHA/u);
});

test('symlink receipt, direct artifact and ancestor directory are refused', t => {
  const f = fixture(t);
  const receiptFull = path.join(f.root, RECEIPT);
  fs.renameSync(receiptFull, path.join(f.root, 'evidence/real-receipt.json'));
  fs.symlinkSync('real-receipt.json', receiptFull);
  assert.throws(() => f.run(), /without symlinks/u);
  fs.unlinkSync(receiptFull); fs.renameSync(path.join(f.root, 'evidence/real-receipt.json'), receiptFull);
  const artifactFull = path.join(f.root, f.artifact.path);
  fs.renameSync(artifactFull, path.join(f.root, 'evidence/real-artifact.txt'));
  fs.symlinkSync('real-artifact.txt', artifactFull);
  assert.throws(() => f.run(), /without symlinks/u);
  fs.unlinkSync(artifactFull); fs.renameSync(path.join(f.root, 'evidence/real-artifact.txt'), artifactFull);
  const pin = f.put('real-dir/item.txt', 'Ancestor-symlink fixture.');
  fs.symlinkSync('real-dir', path.join(f.root, 'alias-dir'));
  f.evidence.artifacts = [{...pin, path: 'alias-dir/item.txt'}]; f.save();
  assert.throws(() => f.run(), /without symlinks/u);
});

test('initial finalization binds its real receipt and preserves every independent false gate', t => {
  const f = fixture(t), result = f.finalize();
  assert.equal(f.prepared.binding.preparationOnly, true);
  assert.equal(f.prepared.binding.implementation.status, 'candidate');
  assert.equal(f.prepared.binding.sourceRiskEvidence.technicalRiskCheckRecorded, false);
  assert(f.prepared.binding.unresolved.length > 0);
  assert.equal(result.binding.preparationOnly, false);
  assert.equal(result.binding.implementation.status, 'implemented');
  assert.deepEqual(result.binding.unresolved, []);
  assert.equal(result.check.bindingSha256, hash(result.bytes));
  assert.equal(result.check.receipt.sha256, hash(fs.readFileSync(path.join(f.root, RECEIPT))));
  assert.deepEqual(result.check.checkedImplementationFiles, f.implementationFiles);
  assert.equal(result.check.artifacts.filter(pin => pin.path === RECEIPT).length, 1);
  for (const gate of ['humanReviewed', 'ownerAccepted', 'originalRuntimeAccepted', 'audioAccepted', 'strictComplete', 'published'] as const)
    assert.equal(result.check[gate], false);
  for (const effect of ['currentJavaScriptRegistrationEffect', 'strictCompletionEffect', 'publicationEffect'] as const)
    assert.equal(result.check[effect], 'none');
});

test('first-pair write in an isolated root is exclusive and exact check revalidates current evidence', t => {
  const f = fixture(t), result = f.finalize();
  assert(!fs.existsSync(path.join(f.root, P005_TYPOGRAPHY_BINDING_PATH)));
  assert(!fs.existsSync(path.join(f.root, P005_TYPOGRAPHY_CHECK_PATH)));
  writeP005TypographyPair(result, f.root);
  assert(fs.readFileSync(path.join(f.root, P005_TYPOGRAPHY_BINDING_PATH)).equals(result.bytes));
  assert(fs.readFileSync(path.join(f.root, P005_TYPOGRAPHY_CHECK_PATH)).equals(result.checkBytes));
  assert.deepEqual(checkP005TypographyPair(f.prepared).check, result.check);
  assert.throws(() => writeP005TypographyPair(result, f.root), /refuses any existing output/u);
  f.put(f.implementationFiles[0]!.path, '// changed after synthetic finalization');
  assert.throws(() => checkP005TypographyPair(f.prepared), /stale checked implementation/u);
});

test('missing or drifted pair cannot produce an exact/check success', t => {
  const f = fixture(t);
  assert.throws(() => checkP005TypographyPair(f.prepared), /ENOENT/u);
  const result = f.finalize(); writeP005TypographyPair(result, f.root);
  f.put(P005_TYPOGRAPHY_BINDING_PATH, '{}\n');
  assert.throws(() => checkP005TypographyPair(f.prepared), /binding drift/u);
  f.put(P005_TYPOGRAPHY_BINDING_PATH, result.bytes);
  f.put(P005_TYPOGRAPHY_CHECK_PATH, json({...result.check, humanReviewed: true}));
  assert.throws(() => checkP005TypographyPair(f.prepared), /check record drift/u);
  f.put(P005_TYPOGRAPHY_CHECK_PATH, result.checkBytes);
  const oldCheckedAt = f.evidence.checkedAt;
  f.evidence.checkedAt = new Date(Date.parse(oldCheckedAt) + 1).toISOString(); f.save();
  assert.throws(() => checkP005TypographyPair(f.prepared), /binding drift/u);
});

test('existing or dangling-symlink second target is refused before the first output is created', t => {
  const f = fixture(t), result = f.finalize();
  f.put(P005_TYPOGRAPHY_CHECK_PATH, 'existing foreign output');
  assert.throws(() => writeP005TypographyPair(result, f.root), /refuses any existing output/u);
  assert(!fs.existsSync(path.join(f.root, P005_TYPOGRAPHY_BINDING_PATH)));
  fs.unlinkSync(path.join(f.root, P005_TYPOGRAPHY_CHECK_PATH));
  fs.symlinkSync('missing-foreign-target', path.join(f.root, P005_TYPOGRAPHY_CHECK_PATH));
  assert.throws(() => writeP005TypographyPair(result, f.root), /refuses any existing output/u);
  assert(!fs.existsSync(path.join(f.root, P005_TYPOGRAPHY_BINDING_PATH)));
});

test('stale input and symlink destination ancestors stop first publication without outputs', t => {
  const f = fixture(t), result = f.finalize();
  f.put(f.artifact.path, 'artifact changed after validation');
  assert.throws(() => writeP005TypographyPair(result, f.root), /input changed before publication/u);
  assert(!fs.existsSync(path.join(f.root, P005_TYPOGRAPHY_BINDING_PATH)));
  f.put(f.artifact.path, 'Synthetic guard evidence, no actual technical pass.');
  fs.mkdirSync(path.join(f.root, 'real-catalog'));
  fs.symlinkSync('real-catalog', path.join(f.root, 'catalog'));
  assert.throws(() => writeP005TypographyPair(result, f.root), /physical directory required/u);
  assert(!fs.existsSync(path.join(f.root, 'real-catalog/typography-v1/g678-page-bindings/shared-alg001-l12-p005.json')));
});

test('serialization tampering cannot be published through the exclusive pair writer', t => {
  const f = fixture(t), result = f.finalize();
  result.check.bindingSha256 = 'a'.repeat(64);
  assert.throws(() => writeP005TypographyPair(result, f.root), /finalized matching pair/u);
  result.check.bindingSha256 = hash(result.bytes);
  result.checkBytes = Buffer.from('{}');
  assert.throws(() => writeP005TypographyPair(result, f.root), /serialized pair differs/u);
});

test('literal TS imports, CSS/JSON and type imports form a current closure with a registry boundary', t => {
  const f = fixture(t);
  f.put('apps/web/tsconfig.json', JSON.stringify({compilerOptions: {module: 'ESNext', moduleResolution: 'Bundler',
    target: 'ES2022', paths: {'@/*': ['./*']}, resolveJsonModule: true}, include: ['**/*.ts']}));
  f.put('apps/web/page.ts', "import type {X} from './types'; import './page.css'; import data from './data.json'; export {X} from './types'; const module = import('./child'); type T=import('./types').X; import '../../packages/demos/src/registry.local-only.generated'; import 'react';");
  f.put('apps/web/types.ts', 'export type X = number;'); f.put('apps/web/child.ts', 'export const child=1;');
  f.put('apps/web/page.css', 'body{color:blue}'); f.put('apps/web/data.json', '{"synthetic":true}');
  f.put('packages/demos/src/registry.local-only.generated.ts', "export const unrelated = () => import('./must-not-follow');");
  const result = collectP005TypographyImportClosure(f.root, ['apps/web/page.ts']);
  assert.deepEqual([...result.files.keys()].sort(), ['apps/web/child.ts', 'apps/web/data.json', 'apps/web/page.css', 'apps/web/page.ts', 'apps/web/types.ts']);
  assert.deepEqual(result.closure.registryStateBoundaries, ['packages/demos/src/registry.local-only.generated.ts']);
  assert(result.closure.externalImportSpecifiers.includes('react'));
  assert.equal(result.closure.completeTransitiveClosure, false);
  assert(result.closure.localImportEdges.some(edge => edge.to === 'apps/web/child.ts' && edge.kind === 'dynamic'));
  f.put('apps/web/page.ts', 'import "./missing";');
  assert.throws(() => collectP005TypographyImportClosure(f.root, ['apps/web/page.ts']), /unresolved local import/u);
  assert.throws(() => collectP005TypographyImportClosure(f.root, [P005_TYPOGRAPHY_BINDING_PATH]), /cannot be a closure seed/u);
});

test('nonliteral dynamic imports are disclosed instead of invented as complete dependencies', t => {
  const f = fixture(t);
  f.put('apps/web/tsconfig.json', JSON.stringify({compilerOptions: {module: 'ESNext', moduleResolution: 'Bundler'}, include: ['**/*.ts']}));
  f.put('apps/web/page.ts', "const name='./not-selected'; const selected=import(name);");
  const result = collectP005TypographyImportClosure(f.root, ['apps/web/page.ts']);
  assert.deepEqual(result.closure.nonliteralDynamicImports, [{path: 'apps/web/page.ts', line: 1}]);
});

test('CLI ambiguity/unsafe paths and evidence-free writes fail before preparation', async () => {
  assert.deepEqual(parseP005TypographyArguments([]), {mode: '--dry-run', evidencePath: undefined});
  assert.deepEqual(parseP005TypographyArguments(['--prepare', '--dry-run']), {mode: '--dry-run', evidencePath: undefined});
  assert.deepEqual(parseP005TypographyArguments(['--check']), {mode: '--check', evidencePath: undefined});
  assert.deepEqual(parseP005TypographyArguments(['--evidence', RECEIPT, '--write']), {mode: '--write', evidencePath: RECEIPT});
  for (const args of [['--write'], ['--write', '--check'], ['--dry-run', '--dry-run'], ['--prepare', '--write'],
    ['--prepare', '--check'], ['--prepare', '--evidence', RECEIPT], ['--evidence'], ['--evidence', '../outside'],
    ['--evidence', RECEIPT, '--evidence', RECEIPT], ['--evidence', P005_TYPOGRAPHY_CHECK_PATH], ['--refresh']])
    await assert.rejects(main(args));
});

test('page seeds include actual source/native/host/report/test/config inputs without a P006 page seed', () => {
  for (const suffix of ['TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md', 'TYPOGRAPHY_IMPLEMENTATION_ROUTE_2026-09-27.md',
    'TYPOGRAPHY_GRAPHICS_DISPOSITION_2026-09-27.md', 'typography-v1/source-evidence.json']) {
    assert(P005_TYPOGRAPHY_SEED_PATHS.some(seed => seed.endsWith(suffix)), `required seed suffix ${suffix}`);
  }
  assert(P005_TYPOGRAPHY_SEED_PATHS.includes('apps/web/lib/g678-alg-l12-p005-host.production-stub.tsx'));
  assert(P005_TYPOGRAPHY_SEED_PATHS.includes('scripts/prepare-g678-alg-l12-p005-typography-binding.test.mts'));
  assert(P005_TYPOGRAPHY_SEED_PATHS.every(seed => !seed.includes('alg-l12-p006') && !seed.includes('alg001-l12-p006')));
  const seeds = new Set<string>(P005_TYPOGRAPHY_SEED_PATHS);
  assert(!seeds.has(P005_TYPOGRAPHY_BINDING_PATH) && !seeds.has(P005_TYPOGRAPHY_CHECK_PATH));
});
