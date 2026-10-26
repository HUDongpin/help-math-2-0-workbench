import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {P012_TEXT_DATA} from '../packages/demos/src/generated/alg-l12-p012-text-data';
import {P012_TEXT_BINDING} from '../packages/demos/src/alg-l12-p012-text-binding';
import {CHECKS, RISKS, SOURCE_ROOT, SOURCE_PATH, SOURCE_SHA, CATALOG_SHA,
  CANDIDATE_BINDING, CANDIDATE_CHECK, prepare, verifySource, validateObservation,
  type Observation, type Pin} from './prepare-g678-alg-l12-p012-typography-evidence.mts';

const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const root = process.cwd();

function sourceFixture() {
  const bytes = fs.readFileSync(path.join(SOURCE_ROOT, SOURCE_PATH));
  assert.equal(hash(bytes), SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(bytes);
  // Mutations below deliberately violate the readonly production types.
  const data: any = clone(P012_TEXT_DATA), binding: any = clone(P012_TEXT_BINDING);
  const meta = JSON.parse(fs.readFileSync(path.join(root,
    'migrations/shared-alg001-l12-p012/typography-v1/runtime-meta.json'), 'utf8'));
  const specs = JSON.parse(fs.readFileSync(path.join(root,
    'migrations/shared-alg001-l12-p012/typography-v1/suppression-specs.json'), 'utf8'));
  return {source, data, binding, meta, specs,
    run: () => verifySource(source, data, binding, meta, specs)};
}

test('physical P012 source verifies text definitions, 57 placements, 58 bound blocks and exact 60 suppressions', () => {
  const fixture = sourceFixture();
  const result = fixture.run();
  assert.equal(hash(JSON.stringify(fixture.source)), CATALOG_SHA);
  assert.equal(result.textDefinitions, 37); assert.equal(result.textPlacements, 57);
  assert.equal(result.teachingBlocks, 58); assert.equal(result.exactSuppressionInstances, 60);
  assert.equal(result.titleShapeTagSha256,
    'ad0e1a655a85561ac898a7493a28f360ba4ce67e6b721df63d514b78558d46a8');
});

test('source run, placement, ancestry, title and suppression drift fail closed', () => {
  const changes = [
    (f: ReturnType<typeof sourceFixture>) => {f.data.definitions.find((x: any) => x.characterId === 51)!.runs[0].text = 'invented';},
    (f: ReturnType<typeof sourceFixture>) => {f.data.instances.find((x: any) => x.characterId === 55)!.firstFrame++;},
    (f: ReturnType<typeof sourceFixture>) => {f.data.parentPlacements.find((x: any) => x.childTimelineId === 'sprite-61')!.firstFrame++;},
    (f: ReturnType<typeof sourceFixture>) => {f.binding.blocks.find((x: any) => x.id === 'sprite-86/depth-3/generation-1')!.sourceTextIds.pop();},
    (f: ReturnType<typeof sourceFixture>) => {f.binding.blocks[2].readingOrder = f.binding.blocks[1].readingOrder;},
    (f: ReturnType<typeof sourceFixture>) => {f.binding.blocks.find((x: any) => x.id === 'title')!.sourceShapeIds = [50];},
    (f: ReturnType<typeof sourceFixture>) => {f.binding.blocks.find((x: any) => x.id === 'sprite-61/depth-2/generation-1')!.instance.path[1].depth++;},
    (f: ReturnType<typeof sourceFixture>) => {f.binding.blocks.find((x: any) => x.id === 'button-71/record-4')!.instance = f.binding.blocks[1].instance;},
    (f: ReturnType<typeof sourceFixture>) => {f.specs.specs.pop();},
    (f: ReturnType<typeof sourceFixture>) => {f.meta.suppressedSourceInstanceIds.pop();},
    (f: ReturnType<typeof sourceFixture>) => {f.source.risks.pop();},
  ];
  for (const change of changes) {
    const fixture = sourceFixture(); change(fixture);
    assert.throws(fixture.run);
  }
});

test('preparation pins the current implementation and leaves all technical checks and source risks pending', () => {
  const first = prepare(), second = prepare();
  assert(first.bindingBytes.equals(second.bindingBytes));
  assert(first.checkBytes.equals(second.checkBytes));
  assert.equal(first.binding.preparationOnly, true);
  assert.equal(first.binding.implementation.status, 'candidate');
  assert(first.binding.implementation.files.some((item: Pin) =>
    item.path === 'packages/demos/src/modules/shared-alg001-l12-p012.tsx'));
  assert(first.binding.implementation.files.some((item: Pin) =>
    item.path === 'migrations/shared-alg001-l12-p012/typography-v1/renderer.js'));
  assert.equal(first.check.kind, 'p012-typography-preparation-check-v1');
  assert.equal(first.check.formalCheckerAdmitted, false);
  assert.deepEqual(Object.keys(first.check.checks), CHECKS);
  assert(Object.values(first.check.checks).every(status => status === 'pending'));
  assert.deepEqual(first.check.pendingSourceRisks, RISKS);
  assert.equal(first.check.structuralVerification.status, 'verified-source-and-code-only');
  assert.notEqual(CANDIDATE_BINDING,
    'catalog/typography-v1/g678-page-bindings/shared-alg001-l12-p012.json');
  assert.notEqual(CANDIDATE_CHECK,
    'catalog/typography-v1/g678-checks/shared-alg001-l12-p012.json');
  assert.throws(() => prepare({sourceRoot: '/tmp/not-the-physical-source'}),
    /Exact physical P012 source root required/u);
});

function receiptFixture(t: test.TestContext) {
  const temporary = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p012-typography-receipt-')));
  t.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
  const put = (relative: string, value: string): Pin => {
    const full = path.join(temporary, relative);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, value);
    return {path: relative, bytes: Buffer.byteLength(value), sha256: hash(value)};
  };
  const implementation = [put('src/p012.ts', '// isolated validator implementation')];
  const artifact = put('observations/browser.json', '{"realFixture":false,"scope":"isolated schema guard"}\n');
  const receiptPath = 'receipts/observation.json';
  const value: Observation = {schemaVersion: 1, kind: 'p012-typography-observation-v1',
    animationId: 'shared-alg001-l12-p012', sourceSwfSha256: SOURCE_SHA,
    sourceCatalogContentSha256: CATALOG_SHA, bindingVersion: 'p012-source-native-text-v1',
    checkedAt: new Date().toISOString(), artifacts: [clone(artifact)], checkedImplementationFiles: implementation,
    checks: {sourceBinding: {result: 'passed',
      detail: 'Isolated validator schema check with a separate artifact; not P012 admission.',
      artifactPaths: [artifact.path]}},
    sourceRiskResolutions: [{kind: 'dynamic-text-runtime-value-unresolved',
      disposition: 'Isolated validator schema check, not a real source-risk decision.',
      artifactPaths: [artifact.path]}]};
  const save = () => put(receiptPath, JSON.stringify(value));
  const run = () => validateObservation(receiptPath, implementation, temporary);
  save();
  return {temporary, value, implementation, artifact, receiptPath, save, run};
}

test('only independently pinned observations can contribute an individual pass or risk disposition', t => {
  const fixture = receiptFixture(t);
  assert.equal(fixture.run().observation.checks.sourceBinding.result, 'passed');
  fixture.value.artifacts[0].sha256 = 'f'.repeat(64); fixture.save();
  assert.throws(fixture.run, /stale observation artifact/u);
  fixture.value.artifacts[0] = fixture.artifact;
  fixture.value.checkedImplementationFiles = []; fixture.save();
  assert.throws(fixture.run, /entire current implementation closure/u);
  fixture.value.checkedImplementationFiles = fixture.implementation;
  fixture.value.checks.sourceBinding.artifactPaths = ['src/p012.ts']; fixture.save();
  assert.throws(fixture.run, /independent checked artifacts/u);
  fixture.value.checks.sourceBinding.artifactPaths = [fixture.artifact.path];
  fixture.value.checkedAt = new Date(Date.now() + 120_000).toISOString(); fixture.save();
  assert.throws(fixture.run, /nonfuture checkedAt/u);
});

test('unknown checks, duplicate risks, missing results and circular output fail closed', t => {
  const fixture = receiptFixture(t);
  (fixture.value.checks as any).invented = {result: 'passed',
    detail: 'An invented check must never enter the formal record.', artifactPaths: [fixture.artifact.path]};
  fixture.save(); assert.throws(fixture.run, /unknown technical check/u);
  delete (fixture.value.checks as any).invented;
  fixture.value.sourceRiskResolutions.push(clone(fixture.value.sourceRiskResolutions[0]));
  fixture.save(); assert.throws(fixture.run);
  fixture.value.sourceRiskResolutions.pop();
  fixture.value.checks.sourceBinding.result = 'pending' as 'passed';
  fixture.save(); assert.throws(fixture.run);
  fixture.value.checks.sourceBinding.result = 'passed';
  fixture.value.artifacts[0] = fixture.implementation[0];
  fixture.value.checks.sourceBinding.artifactPaths = [fixture.implementation[0].path];
  fixture.save(); assert.throws(fixture.run, /implementation observation/u);
  assert.throws(() => validateObservation(CANDIDATE_BINDING, fixture.implementation, fixture.temporary),
    /candidate output cannot be its own observation/u);
});
