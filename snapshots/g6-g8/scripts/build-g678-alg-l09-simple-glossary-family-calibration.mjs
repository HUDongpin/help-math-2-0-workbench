#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {auditG678AlgL09SimpleGlossaryFamily} from
  './audit-g678-alg-l09-simple-glossary-family.mjs';
import {runAlgL09SimpleGlossaryCurrentJs} from
  './build-g678-alg-l09-simple-glossary-current-js.mjs';
import {finalizeAlgL09SimpleGlossaryRegistration} from
  './finalize-g678-alg-l09-simple-glossary-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);
const OUTPUT =
  'catalog/product-bridge-calibrations/g678-alg-l09-simple-glossary-family-calibration-v1.json';
const PATHS = Object.freeze({
  audit: 'catalog/g678-alg-l09-simple-glossary-family-audit-v1.json',
  auditBuilder: 'scripts/audit-g678-alg-l09-simple-glossary-family.mjs',
  generator: 'scripts/build-g678-alg-l09-simple-glossary-current-js.mjs',
  generatorRun:
    'work/g678-shared-page-factory/g678-alg-l09-simple-glossary-current-js-9-v1/run-manifest.json',
  generatorFragment:
    'catalog/product-bridge-calibrations/g678-alg-l09-simple-glossary-current-js-9-v1.fragment.json',
  registrationFinalizer:
    'scripts/finalize-g678-alg-l09-simple-glossary-registration.mjs',
  registrationFreeze:
    'catalog/product-bridge-calibrations/g678-current-js-319-page-registration-v1.json',
  registrationFragment:
    'catalog/product-bridge-calibrations/g678-current-js-319-page-registration-v1.fragment.json',
  browser: 'output/playwright/g678-current-js-319-v1/evidence.json',
  browserVerifier: 'scripts/qa-g678-current-js-319-browser.mjs',
  sourceStaticHost: 'packages/demos/src/source-static-canvas-candidate.tsx',
  algL09SimpleGlossaryHost:
    'packages/demos/src/private-source-static-alg-l09-simple-glossary-candidate.tsx',
  productBridge: 'apps/web/lib/g678-calibration-product-bridge.server.ts',
});
const EXPECTED_IDS = Object.freeze([
  'shared-alg001-l09-p005',
  'shared-alg001-l09-p010',
  'shared-alg001-l09-p011',
  'shared-alg001-l09-p013',
  'shared-alg001-l09-p015',
  'shared-alg001-l09-p017',
  'shared-alg001-l09-p019',
  'shared-alg001-l09-p021',
  'shared-alg001-l09-p023',
]);
const FALSE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  invariant(typeof relativePath === 'string' && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), 'input path must be project-relative');
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, {json = false} = {}) {
  const target = projectPath(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary file`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: buffer.length,
    sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function normalizedKey(value) {
  return value.trim().toLocaleLowerCase('en-US');
}

function validateSample(sample, page, auditRecord, baseUrl) {
  const entriesByKey = new Map(page.glossaryEntries.map((entry) =>
    [normalizedKey(entry.sourceKeyAttribute), entry]));
  const inspectionFrame = Math.max(...auditRecord.behavior.buttons.map(
    (button) => button.firstFrame));
  invariant(sample.animationId === page.animationId &&
    sample.frameDomain === page.runtime.frameDomain &&
    sample.frameCount === page.runtime.frameCount &&
    sample.runtimeSha256 === page.runtime.canvasRenderer.sha256 &&
    sample.canvasState === 'ready' && sample.progressedFrame > sample.initialFrame &&
    sample.playbackComplete === 'false' &&
    sample.glossaryInspectionFrame === inspectionFrame &&
    sample.consoleErrors.length === 0 && sample.pageErrors.length === 0 &&
    sample.assetResponses.length === 1,
  `${page.animationId}: ALG L9 browser playback evidence drifted`);
  const response = sample.assetResponses[0];
  invariant(response.url === `${baseUrl}/flash-assets/g678-local/` +
    `${page.animationId}/canvas-renderer.js?sha256=` +
    page.runtime.canvasRenderer.sha256 &&
    response.status === 200 && response.corp === 'same-origin' &&
    response.nosniff === 'nosniff' &&
    response.cacheControl === 'private, no-store, max-age=0' &&
    response.contentType.startsWith('text/javascript'),
  `${page.animationId}: ALG L9 local asset policy drifted`);
  const expectedEnglish = auditRecord.behavior.buttons.map((sourceButton) => {
    const entry = entriesByKey.get(normalizedKey(
      sourceButton.sourceKeyAttribute));
    invariant(entry,
      `${page.animationId}: ${sourceButton.characterId} lacks a glossary entry`);
    return Object.freeze({button: entry.labels.en, entryId: entry.id,
      definition: entry.definitions.en,
      sourceCharacterId: sourceButton.characterId});
  });
  const expectedSpanish = auditRecord.behavior.buttons.map((sourceButton) => {
    const entry = entriesByKey.get(normalizedKey(
      sourceButton.sourceKeyAttribute));
    invariant(entry,
      `${page.animationId}: ${sourceButton.characterId} lacks a Spanish glossary entry`);
    return Object.freeze({button: entry.labels.es, entryId: entry.id,
      definition: entry.definitions.es,
      sourceCharacterId: sourceButton.characterId});
  });
  invariant(exact(sample.glossary?.englishTerms, expectedEnglish) &&
    exact(sample.glossary?.spanishTerms, expectedSpanish) &&
    sample.glossary.pausedWhileOpen === true &&
    sample.glossary.resumedAfterClose === true,
  `${page.animationId}: ALG L9 bilingual glossary behavior drifted`);
}

async function expectedArtifact() {
  const auditCheck = await auditG678AlgL09SimpleGlossaryFamily({check: true});
  const generatorCheck = await runAlgL09SimpleGlossaryCurrentJs({check: true});
  const registrationCheck =
    await finalizeAlgL09SimpleGlossaryRegistration({check: true});
  invariant(auditCheck.check === true &&
    auditCheck.registrationCandidatePlacementCount === 9 &&
    generatorCheck.check === true && generatorCheck.generatedPlacementCount === 9 &&
    registrationCheck.check === true &&
    registrationCheck.registrationCandidatePlacementCount === 319,
  'ALG L9 source/generator/provisional admission checks failed');
  const qa = await execFileAsync(process.execPath,
    [PATHS.browserVerifier, '--check'], {
      cwd: ROOT,
      env: {...process.env,
        HELP_MATH_G678_QA_BASE_URL: 'http://127.0.0.1:3321'},
      maxBuffer: 32 * 1024 * 1024,
    });
  invariant(qa.stderr === '', 'ALG L9 browser receipt check emitted stderr');
  const qaReceipt = JSON.parse(qa.stdout);
  invariant(qaReceipt.check === true &&
    qaReceipt.registeredCurrentJsPages === 319 &&
    qaReceipt.sharedLessonCards === 44 &&
    qaReceipt.linkedLessonCards === 0 &&
    qaReceipt.screenshotCount === 70,
  'ALG L9 browser receipt check did not prove the 319-page product slice');

  const jsonInputs = new Set(['audit', 'generatorRun', 'generatorFragment',
    'registrationFreeze', 'registrationFragment', 'browser']);
  const entries = await Promise.all(Object.entries(PATHS).map(
    async ([key, relativePath]) => [key, await binding(relativePath,
      {json: jsonInputs.has(key)})],
  ));
  const inputs = Object.fromEntries(entries);
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  const audit = inputs.audit.value;
  const run = inputs.generatorRun.value;
  const generated = inputs.generatorFragment.value;
  const freeze = inputs.registrationFreeze.value;
  const fragment = inputs.registrationFragment.value;
  const browser = inputs.browser.value;
  const auditIds = audit.records.map((record) => record.animationId).sort();
  invariant(audit.artifactType ===
      'g678-alg-l09-simple-glossary-family-audit-v1' &&
    audit.status ===
      'exact-9-source-script-keyterm-audio-audit-registration-candidate' &&
    audit.scope.selectedAlgL09SimpleGlossaryPlacements === 9 &&
    audit.scope.exactButtonScripts === 34 &&
    audit.scope.recoveredGlossaryTerms === 18 &&
    audit.scope.affectedLessons === 1 &&
    exact(auditIds, [...EXPECTED_IDS].sort()) &&
    audit.records.every((record) =>
      record.behavior.childTimelineScriptCount === 0 &&
      record.behavior.buttons.length > 0 &&
      record.behavior.buttons.every((button) =>
        Number.isSafeInteger(button.characterId) && button.characterId > 0 &&
        Number.isSafeInteger(button.firstFrame) && button.firstFrame > 0) &&
      record.generationAuthorized === true),
  'ALG L9 exact source/behavior classifier drifted');
  invariant(run.runId ===
      'g678-alg-l09-simple-glossary-current-js-9-v1' &&
    run.generatedPlacementCount === 9 && run.members.length === 9 &&
    run.registryEntriesWritten === 0 &&
    exact(run.members.map((member) => member.animationId).sort(), auditIds) &&
    exact(run.inputs.audit, descriptor(inputs.audit)) &&
    generated.generatedPlacementCount === 9 &&
    generated.currentJavaScriptRegisteredCount === 0 &&
    generated.entries.length === 9 &&
    exact(generated.entries.map((entry) => entry.key).sort(), auditIds) &&
    exact(generated.compilerRun, descriptor(inputs.generatorRun)),
  'ALG L9 generated candidate authority drifted');
  invariant(freeze.registrationCandidatePlacementCount === 319 &&
    freeze.selectedPages.length === 319 &&
    fragment.calibration.entries.length === 319 &&
    fragment.calibration.freezeManifest === inputs.registrationFreeze.path &&
    exact(fragment.freeze, descriptor(inputs.registrationFreeze)),
  'ALG L9 319-page provisional registration evidence drifted');
  const selected = new Map(freeze.selectedPages.map((page) =>
    [page.animationId, page]));
  invariant(EXPECTED_IDS.every((id) =>
    selected.get(id)?.adapterFamily ===
      'alg-l09-simple-glossary-source-static' &&
    selected.get(id)?.productBlockers?.includes(
      'alg-l09-simple-glossary-browser-product-calibration-pending')),
  'ALG L9 registered page set is not the exact pre-calibration slice');
  invariant(browser.artifactType === 'g678-current-js-319-browser-qa-v1' &&
    browser.baseUrl === 'http://127.0.0.1:3321' &&
    browser.registeredCurrentJsPages === 319 &&
    browser.allLessons.sharedCardCount === 44 &&
    browser.allLessons.linkedCardCount === 0 &&
    browser.allLessons.registeredPageSum === 319 &&
    browser.samples.length === 69 && browser.screenshots.length === 70 &&
    browser.allLessons.consoleErrors.length === 0 &&
    browser.allLessons.pageErrors.length === 0 &&
    exact(browser.inputs.freeze, descriptor(inputs.registrationFreeze)) &&
    exact(browser.inputs.script, descriptor(inputs.browserVerifier)) &&
    exact(browser.inputs.productBridge, descriptor(inputs.productBridge)) &&
    exact(browser.inputs.sourceStaticHost, descriptor(inputs.sourceStaticHost)) &&
    exact(browser.inputs.algL09SimpleGlossaryHost,
      descriptor(inputs.algL09SimpleGlossaryHost)) &&
    Object.values(browser.acceptanceEffects).every((value) => value === false),
  'ALG L9 browser product-host evidence drifted');
  const samples = new Map(browser.samples.map((sample) =>
    [sample.animationId, sample]));
  for (const id of EXPECTED_IDS) {
    invariant(samples.has(id) && selected.has(id),
      `${id}: ALG L9 browser calibration sample is missing`);
    validateSample(samples.get(id), selected.get(id),
      audit.records.find((record) => record.animationId === id), browser.baseUrl);
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l09-simple-glossary-family-calibration-v1',
    calibrationId: 'g678-alg-l09-simple-glossary-family-calibration-v1',
    adapterFamily: 'alg-l09-simple-glossary-source-static',
    status: 'exact-9-current-js-visual-glossary-product-host-calibrated',
    inputs: Object.freeze({...Object.fromEntries(entries.map(([key, value]) =>
      [key, descriptor(value)])), builder: descriptor(builder)}),
    auditedPlacementCount: 9,
    authorizedPlacementIds: EXPECTED_IDS,
    blockedPlacementCount: 0,
    sourceButtonCount: 34,
    uniqueGlossaryTermCount: 18,
    browserSamples: Object.freeze(EXPECTED_IDS.map((id) => Object.freeze({
      animationId: id,
      frameDomain: selected.get(id).runtime.frameDomain,
      frameCount: selected.get(id).runtime.frameCount,
      runtimeSha256: selected.get(id).runtime.canvasRenderer.sha256,
      glossaryTermCount: selected.get(id).glossaryEntries.length,
    }))),
    productHostCalibration: Object.freeze({
      canvasReadyAndProgressing: true,
      sourceFrameBoundGlossaryControls: true,
      sourceCharacterIdentityBound: true,
      exactEnglishGlossaryDefinitions: true,
      exactSpanishGlossaryDefinitions: true,
      playbackPausesWhileGlossaryOpen: true,
      playbackResumesAfterGlossaryClose: true,
      localAssetIntegrityAndCrossOriginIsolation: true,
      allLessonsPartialRegistrationTruthful: true,
      familyCurrentJsVisualGlossaryCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    }),
    authorization: Object.freeze({
      authorized: true,
      scope: 'exact-9-alg-l09-simple-glossary-placement-set-only',
      permitsOtherAlgL09Placements: false,
      permitsCanonicalSourcePromotion: false,
      permitsAudioAcceptance: false,
      permitsOriginalRuntimeOrVisualFidelityClaim: false,
      permitsWholeLessonEngineeringPreviewClaim: false,
      permitsReleaseOrPublication: false,
    }),
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'This authority calibrates maintained Current-JS visual playback and source-frame/source-character-bound bilingual glossary behavior for the exact 9 ALG L9 placements only.',
      'The fraction definition difference between the two recovered locale sources is preserved; no definition was invented or merged.',
      'Legacy key-term sublinks/example SWFs, embedded audio lifecycle, authoritative original runtime, fidelity, human, Owner, strict-completion, release, and publication remain unaccepted.',
      'All 44 lessons remain partial; this authority creates no N/N whole-lesson engineering preview or learner route.',
    ]),
  });
}

async function writeExclusive(bytes) {
  const target = projectPath(OUTPUT);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function buildAlgL09SimpleGlossaryFamilyCalibration(
  {check = false} = {},
) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(bytes),
      'ALG L9 simple-glossary family calibration artifact drifted');
  } else {
    await writeExclusive(bytes);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), status: artifact.status,
    auditedPlacementCount: artifact.auditedPlacementCount,
    authorizedPlacementCount: artifact.authorizedPlacementIds.length,
    blockedPlacementCount: artifact.blockedPlacementCount,
    productHostCalibrationPassed:
      artifact.productHostCalibration
        .familyCurrentJsVisualGlossaryCalibrationPassed,
    acceptanceEffects: artifact.acceptanceEffects});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l09-simple-glossary-family-calibration.mjs [--check]');
  buildAlgL09SimpleGlossaryFamilyCalibration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
