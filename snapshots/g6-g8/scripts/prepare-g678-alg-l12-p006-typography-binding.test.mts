import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {P006_TYPOGRAPHY_CHECKS, validateP006TypographyEvidence, assertReplaceableP006Candidate,
  validateP006TypographyPriorPair, assertP006TypographyRefreshEvidence,
  preserveP006TypographyRefreshArtifacts, main} from
  './prepare-g678-alg-l12-p006-typography-binding.mts';

const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const SOURCE = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const CATALOG = 'ade09b22c6df92ebbef45c15154abe20e60ffff2f8328dd9e1b877b734611996';
const ID = 'shared-alg001-l12-p006';
const RISKS = ['shape-text-unclassified', 'bitmap-text-unclassified'];
const RECEIPT = 'evidence/receipt.json';
const GENERATOR = 'scripts/prepare-g678-alg-l12-p006-typography-binding.mts';
function fixture(t: test.TestContext) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'p006-evidence-validation-')));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const put = (relative: string, value: string) => {
    fs.mkdirSync(path.dirname(path.join(root, relative)), {recursive: true});
    fs.writeFileSync(path.join(root, relative), value);
    return {path: relative, bytes: Buffer.byteLength(value), sha256: hash(value)};
  };
  // These isolated synthetic receipts exercise producer guards only. They never
  // reach the finalizer or the real worktree and do not record any actual pass.
  const implementationFiles = [put('src/page.tsx', '// isolated fixture'),
    put('src/shared.ts', '// isolated shared fixture')];
  const artifact = put('evidence/test-fixture.txt', 'synthetic guard test only');
  const receipt = {
    schemaVersion: 1, kind: 'p006-technical-typography-evidence-v1',
    animationId: ID, placementId: ID, sourceSwfSha256: SOURCE,
    sourceCatalogContentSha256: CATALOG, checkedAt: '2026-09-01T00:00:00Z',
    checks: Object.fromEntries(P006_TYPOGRAPHY_CHECKS.map(check => [check, 'passed'])),
    resolvedSourceRisks: [...RISKS], languagePolicy: {en: 'source', es: 'source-fallback'},
    sourceRiskResolutions: RISKS.map(kind => ({kind, disposition: 'Isolated validation fixture only.',
      artifactPaths: [artifact.path]})),
    artifacts: [{...artifact}], checkedImplementationFiles: implementationFiles.map(pin => ({...pin})),
  };
  const save = () => put(RECEIPT, JSON.stringify(receipt));
  const run = () => validateP006TypographyEvidence(RECEIPT,
    {implementationFiles, sourceRisks: RISKS}, root);
  save();
  return {root, put, receipt, save, run, implementationFiles, artifact};
}

function historicalFixture(t: test.TestContext) {
  const f = fixture(t);
  const producer = f.put(GENERATOR, '// isolated historical producer fixture');
  f.implementationFiles.push(producer);
  f.receipt.checkedImplementationFiles = f.implementationFiles.map(pin => ({...pin}));
  const receiptPin = f.save();
  const generator = {path: GENERATOR, version: '1.1.0', sha256: producer.sha256};
  const binding = {schemaVersion: 1, animationId: ID, placementId: ID, sourceSwfSha256: SOURCE,
    sourceCatalogContentSha256: CATALOG, generator,
    implementation: {status: 'implemented', files: f.implementationFiles},
    unresolved: [], preparationOnly: false, languagePolicy: f.receipt.languagePolicy,
    sourceRiskEvidence: {technicalRiskCheckRecorded: true, sourceParserRisks: RISKS,
      technicalReceipt: receiptPin, resolutions: f.receipt.sourceRiskResolutions},
    technicalFinalization: {kind: 'p006-technical-typography-finalization-v1',
      checkedAt: f.receipt.checkedAt, receipt: receiptPin}};
  const bindingBackup = f.put('history/prior-binding.json', JSON.stringify(binding));
  const check = {schemaVersion: 1, kind: 'g678-lesson-typography-check-v1',
    animationId: ID, placementId: ID, sourceSwfSha256: SOURCE, sourceCatalogContentSha256: CATALOG,
    bindingSha256: bindingBackup.sha256, producer: generator, checkedAt: f.receipt.checkedAt,
    checks: f.receipt.checks, languagePolicy: f.receipt.languagePolicy,
    resolvedSourceRisks: f.receipt.resolvedSourceRisks, sourceRiskResolutions: f.receipt.sourceRiskResolutions,
    artifacts: [f.artifact, receiptPin], checkedImplementationFiles: f.implementationFiles,
    receipt: receiptPin, humanReviewed: false, ownerAccepted: false, originalRuntimeAccepted: false,
    audioAccepted: false, strictComplete: false, published: false};
  const checkBackup = f.put('history/prior-check.json', JSON.stringify(check));
  const options = {fromBindingSha256: bindingBackup.sha256, fromCheckSha256: checkBackup.sha256,
    backupBindingPath: bindingBackup.path, backupCheckPath: checkBackup.path};
  const prior = () => validateP006TypographyPriorPair(options, RISKS, f.root);
  return {...f, producer, receiptPin, binding, check, bindingBackup, checkBackup, options, prior};
}

test('isolated receipt validates actual artifact and complete implementation bytes', t => {
  const f = fixture(t), result = f.run();
  assert.equal(result.evidence.kind, 'p006-technical-typography-evidence-v1');
  assert.deepEqual(result.checkedImplementationFiles, f.implementationFiles);
  assert.equal(result.receipt.path, RECEIPT);
});

test('file drift, missing implementation pins and forged artifact hashes are refused', t => {
  const f = fixture(t);
  f.put(f.implementationFiles[0]!.path, '// changed');
  assert.throws(f.run, /stale checked implementation/u);
  f.put(f.implementationFiles[0]!.path, '// isolated fixture');
  f.receipt.checkedImplementationFiles.pop(); f.save();
  assert.throws(f.run, /all current implementation files/u);
  f.receipt.checkedImplementationFiles = [...f.implementationFiles];
  f.receipt.artifacts[0]!.sha256 = 'a'.repeat(64); f.save();
  assert.throws(f.run, /stale evidence artifact/u);
});

test('all current source risks require exact coverage and referenced dispositions', t => {
  const f = fixture(t);
  f.receipt.resolvedSourceRisks.pop(); f.save();
  assert.throws(f.run, /every current parser risk/u);
  f.receipt.resolvedSourceRisks = [...RISKS, RISKS[0]!]; f.save();
  assert.throws(f.run, /every current parser risk/u);
  f.receipt.resolvedSourceRisks = [...RISKS];
  f.receipt.sourceRiskResolutions[0]!.artifactPaths = ['evidence/not-listed.json']; f.save();
  assert.throws(f.run, /cite current receipt artifacts/u);
  f.receipt.sourceRiskResolutions[0]!.artifactPaths = [f.artifact.path];
  f.receipt.sourceRiskResolutions[0]!.disposition = '  '; f.save();
  assert.throws(f.run, /explanation required/u);
});

test('wrong identity, nonpassed checks, changed language policy and future timestamps are refused', t => {
  const f = fixture(t);
  f.receipt.placementId = 'shared-alg001-l12-p007'; f.save(); assert.throws(f.run);
  f.receipt.placementId = ID;
  f.receipt.checks.lifecycle = 'failed'; f.save(); assert.throws(f.run, /not passed/u);
  f.receipt.checks.lifecycle = 'passed';
  f.receipt.languagePolicy.es = 'source'; f.save(); assert.throws(f.run, /fallback policy/u);
  f.receipt.languagePolicy.es = 'source-fallback';
  f.receipt.checkedAt = '2999-01-01T00:00:00Z'; f.save(); assert.throws(f.run, /nonfuture/u);
});

test('generated output cycles, duplicate pins and symlink artifacts are refused', t => {
  const f = fixture(t);
  f.receipt.artifacts[0]!.path = `catalog/typography-v1/g678-page-bindings/${ID}.json`; f.save();
  assert.throws(f.run, /circular or duplicate/u);
  f.receipt.artifacts[0]!.path = f.artifact.path;
  f.receipt.artifacts.push({...f.artifact}); f.save(); assert.throws(f.run, /circular or duplicate/u);
  f.receipt.artifacts.pop();
  fs.renameSync(path.join(f.root, f.artifact.path), path.join(f.root, 'evidence/original.txt'));
  fs.symlinkSync('original.txt', path.join(f.root, f.artifact.path)); f.save();
  assert.throws(f.run, /symlink boundary/u);
});

test('ambiguous CLI modes and unsafe paths fail before preparation or writes', async () => {
  await assert.rejects(main(['--write', '--check']), /one output mode/u);
  await assert.rejects(main(['--evidence', '../receipt.json']), /ordinary relative path/u);
  await assert.rejects(main(['--backup', 'backup.json']), /only with --write/u);
  await assert.rejects(main(['--evidence']), /ordinary relative path/u);
  await assert.rejects(main(['--refresh', '--evidence', 'new.json']), /both exact pair hashes/u);
  await assert.rejects(main(['--from-binding-sha256', 'a'.repeat(64)]), /explicit --refresh/u);
  await assert.rejects(main(['--refresh', '--from-binding-sha256', 'truncated']), /exact full pair hashes/u);
});

test('replacement guard accepts this producer candidate and rejects foreign or finalized records', () => {
  const record = {schemaVersion: 1, animationId: ID, placementId: ID,
    sourceSwfSha256: SOURCE, sourceCatalogContentSha256: CATALOG,
    generator: {path: 'scripts/prepare-g678-alg-l12-p006-typography-binding.mts',
      version: '1.1.0', sha256: 'a'.repeat(64)},
    implementation: {status: 'candidate'}, preparationOnly: true,
    unresolved: ['fixture only'], sourceRiskEvidence: {technicalRiskCheckRecorded: false}};
  const run = () => assertReplaceableP006Candidate(Buffer.from(JSON.stringify(record)));
  run();
  record.generator.path = 'scripts/another-producer.mts'; assert.throws(run, /foreign or finalized/u);
  record.generator.path = 'scripts/prepare-g678-alg-l12-p006-typography-binding.mts';
  record.implementation.status = 'implemented'; assert.throws(run, /foreign or finalized/u);
  record.implementation.status = 'candidate'; record.preparationOnly = false;
  assert.throws(run, /foreign or finalized/u);
});

test('preserved finalized pair remains verifiable after implementation changes, without treating old pins as current', t => {
  const f = historicalFixture(t), prior = f.prior();
  assert.equal(prior.bindingBackup.sha256, f.options.fromBindingSha256);
  f.put('src/page.tsx', '// changed current implementation');
  assert.deepEqual(f.prior().oldFiles, prior.oldFiles);
  assert.throws(f.run, /stale checked implementation/u);
  assert.throws(() => validateP006TypographyPriorPair({...f.options,
    fromBindingSha256: 'a'.repeat(64)}, RISKS, f.root), /backup hash mismatch/u);
  f.put(f.artifact.path, 'changed historical checked artifact');
  assert.throws(f.prior, /historical checked artifact changed/u);
});

test('prior pair consistency and exact old receipt are mandatory even with explicitly matching backup hashes', t => {
  const f = historicalFixture(t);
  f.check.bindingSha256 = 'a'.repeat(64);
  const changed = f.put(f.checkBackup.path, JSON.stringify(f.check));
  assert.throws(() => validateP006TypographyPriorPair({...f.options,
    fromCheckSha256: changed.sha256}, RISKS, f.root), /consistent finalized pair/u);
  f.check.bindingSha256 = f.bindingBackup.sha256;
  f.check.checkedImplementationFiles = [...f.implementationFiles].slice(1);
  const omitted = f.put(f.checkBackup.path, JSON.stringify(f.check));
  assert.throws(() => validateP006TypographyPriorPair({...f.options,
    fromCheckSha256: omitted.sha256}, RISKS, f.root), /own implementation inventory/u);
});

test('unchanged source-artifact overlap is preserved; backups and changed overlap cannot enter current implementation', t => {
  const f = historicalFixture(t), prior = f.prior();
  const merged = preserveP006TypographyRefreshArtifacts([f.artifact],
    [...f.implementationFiles, f.artifact], prior);
  assert.equal(merged.filter(pin => pin.path === f.artifact.path).length, 1);
  assert(merged.some(pin => pin.path === f.bindingBackup.path && pin.sha256 === f.bindingBackup.sha256));
  assert(merged.some(pin => pin.path === f.checkBackup.path && pin.sha256 === f.checkBackup.sha256));
  assert.throws(() => preserveP006TypographyRefreshArtifacts([f.artifact],
    [...f.implementationFiles, {...f.artifact, sha256: 'a'.repeat(64)}], prior), /overlapping historical artifact changed/u);
  assert.throws(() => preserveP006TypographyRefreshArtifacts([f.artifact],
    [...f.implementationFiles, f.bindingBackup], prior), /backup cannot become/u);
  assert.throws(() => preserveP006TypographyRefreshArtifacts([{...f.artifact, sha256: 'a'.repeat(64)}],
    f.implementationFiles, prior), /conflicts with preserved history/u);
});

test('refresh requires a new, later receipt, new artifacts, and actual fresh current implementation pins', t => {
  const f = historicalFixture(t), prior = f.prior(), oldVerified = f.run();
  assert.throws(() => assertP006TypographyRefreshEvidence(oldVerified, prior), /new receipt path/u);
  const currentFiles = f.implementationFiles.map(pin => ({...pin}));
  currentFiles[0] = f.put(currentFiles[0]!.path, '// newly checked current fixture');
  const newArtifact = f.put('evidence/new-technical-fixture.txt', 'new isolated guard fixture');
  const freshReceipt = {...f.receipt, checkedAt: '2026-09-02T00:00:00Z',
    checkedImplementationFiles: currentFiles, artifacts: [f.artifact, newArtifact]};
  const freshPath = 'evidence/new-receipt.json';
  const saveFresh = () => f.put(freshPath, JSON.stringify(freshReceipt));
  const verifyFresh = () => validateP006TypographyEvidence(freshPath,
    {implementationFiles: currentFiles, sourceRisks: RISKS}, f.root);
  saveFresh();
  assertP006TypographyRefreshEvidence(verifyFresh(), prior);
  freshReceipt.checkedAt = f.receipt.checkedAt; saveFresh();
  assert.throws(() => assertP006TypographyRefreshEvidence(verifyFresh(), prior), /later real checkedAt/u);
  freshReceipt.checkedAt = '2026-09-02T00:00:00Z'; freshReceipt.artifacts = [f.artifact]; saveFresh();
  assert.throws(() => assertP006TypographyRefreshEvidence(verifyFresh(), prior), /new technical evidence/u);
  freshReceipt.artifacts = [f.artifact, newArtifact];
  freshReceipt.checkedImplementationFiles = f.implementationFiles; saveFresh();
  assert.throws(verifyFresh, /stale checked implementation/u);
});
