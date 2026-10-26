#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {finalizeG678GlossaryFamilyRegistration} from
  './finalize-g678-glossary-family-registration.mjs';
import {auditTs05Family} from './audit-g678-ts05-family.mjs';
import {auditTs05L1Keyterms} from './audit-g678-ts05-l1-keyterms.mjs';
import {runTs05L1CurrentJs} from './build-g678-ts05-l1-current-js.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.json';
const PREDECESSOR_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-261-page-product-calibrated-registration-v1.fragment.json';
const AUDIT = 'catalog/g678-ts05-family-audit-v1.json';
const RECOVERY = 'catalog/g678-ts05-l1-keyterm-recovery-v1.json';
const GENERATED_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-ts05-l1-current-js-15-v1.fragment.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PROFILE = 'catalog/g678-shared-source-profile.v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-276-page-registration-v1.fragment.json';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function absolute(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(relativePath, json = false) {
  const target = absolute(relativePath);
  const before = await lstat(target, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    `${relativePath} must be one ordinary file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes)} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

async function verifyEntry(entry, runMember, pages, terms, recovery) {
  const catalog = pages.get(entry.key);
  invariant(catalog && entry.module === `./modules/${entry.key}` &&
    entry.complexityLane === 'interactive-understood' &&
    entry.adapterFamily === 'ts05-l1-glossary-source-static' &&
    runMember?.animationId === entry.key &&
    JSON.stringify(runMember.manifest) ===
      JSON.stringify(entry.memberManifest) &&
    JSON.stringify(runMember.runtime) ===
      JSON.stringify(entry.runtime.canvasRenderer),
  `${entry.key}: TS05 fragment/run/catalog identity drifted`);
  const [moduleFile, timeline, runtime, manifest] = await Promise.all([
    binding(entry.moduleFile.path), binding(entry.timeline.path),
    binding(entry.runtime.canvasRenderer.path),
    binding(entry.memberManifest.path, true),
  ]);
  for (const [actual, expected, label] of [
    [moduleFile, entry.moduleFile, 'module'],
    [timeline, entry.timeline, 'timeline'],
    [runtime, entry.runtime.canvasRenderer, 'runtime'],
    [manifest, entry.memberManifest, 'member manifest'],
  ]) invariant(actual.bytes === expected.bytes &&
    actual.sha256 === expected.sha256, `${entry.key}: ${label} drifted`);
  const page = catalog.page;
  const lesson = catalog.lesson;
  invariant(manifest.value.animationId === entry.key &&
    manifest.value.source.path === page.viewPath &&
    manifest.value.source.sha256 === page.sourceSha256 &&
    manifest.value.timeline.frameDomain === entry.runtime.frameDomain &&
    manifest.value.timeline.frameCount === entry.runtime.frameCount &&
    manifest.value.timeline.livePlaybackEndFrame ===
      entry.runtime.livePlaybackEndFrame &&
    [5, 6, 7, 10].includes(manifest.value.timeline.buttons.length) &&
    manifest.value.timeline.buttonFirstFrame >= 1 &&
    manifest.value.product.typedGlossaryIntentImplemented === true,
  `${entry.key}: TS05 member source/timeline/behavior drifted`);
  const seenTermIds = new Set();
  const pageTerms = manifest.value.timeline.buttons.flatMap((button) => {
    const term = terms.find((candidate) =>
      candidate.sourceKeyAttribute.toLowerCase() ===
        button.sourceKeyAttribute.toLowerCase());
    invariant(term, `${entry.key}: recovered glossary term missing`);
    if (seenTermIds.has(term.id)) return [];
    seenTermIds.add(term.id);
    return [term];
  });
  invariant(pageTerms.length === new Set(manifest.value.timeline.buttons.map(
    (button) => button.sourceKeyAttribute.toLowerCase())).size,
  `${entry.key}: TS05 page glossary term set drifted`);
  const glossaryEntries = pageTerms.map((term) => Object.freeze({
    id: term.id,
    sourceKeyAttribute: term.sourceKeyAttribute,
    labels: term.labels,
    definitions: term.definitions,
    source: Object.freeze({
      en: Object.freeze({assetId: 'G678L1KTE01.xml',
        path: 'HELP_KEYTERMS/KT/XML/L1KTE01.xml',
        sha256: recovery.value.selectedSources.find((source) =>
          source.localeRole === 'en').casObject.sha256}),
      es: Object.freeze({assetId: 'G678L1KTS01.xml',
        path: 'HELP_KEYTERMS/KT/XML/L1KTS01.xml',
        sha256: recovery.value.selectedSources.find((source) =>
          source.localeRole === 'es').casObject.sha256}),
    }),
    legacyCompanionReferences: term.legacyCompanionReferences,
  }));
  return Object.freeze({
    animationId: entry.key,
    placementId: entry.key,
    assetId: page.assetId,
    moduleCode: lesson.moduleCode,
    lessonNumber: lesson.lessonNumber,
    stableLessonKey: lesson.stableLessonKey,
    globalPageOrdinal: page.globalOrdinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    sourceSha256: page.sourceSha256,
    complexityLane: 'interactive-understood',
    adapterFamily: 'ts05-l1-glossary-source-static',
    implementation: Object.freeze({
      kind: 'source-static-current-js-candidate',
      deploymentScope: 'local-only',
      typedModernGlossaryIntentImplemented: true,
      productCalibrationPassed: false,
    }),
    runtime: Object.freeze({
      stage: Object.freeze({width: 800, height: 600}),
      rootFrameCount: manifest.value.timeline.rootFrameCount,
      rootBeginFrame: 6,
      frameDomain: entry.runtime.frameDomain,
      frameCount: entry.runtime.frameCount,
      livePlaybackEndFrame: entry.runtime.livePlaybackEndFrame,
      language: 'fixed-en',
      scenario: 'source-static-frame',
      seed: '0',
      canvasRenderer: entry.runtime.canvasRenderer,
    }),
    glossaryEntries: Object.freeze(glossaryEntries),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
      actionScriptExecution: 'not-executed',
      naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established',
      replaySemantics:
        'renderer-restart-only-source-behavior-not-established',
    }),
    productBlockers: Object.freeze([
      'ts05-l1-browser-product-calibration-pending',
      'legacy-key-term-sublinks-and-example-swfs-not-implemented',
      'embedded-audio-lifecycle-not-implemented',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

async function expectedArtifacts({requireCurrentPredecessorHost = false} = {}) {
  if (requireCurrentPredecessorHost) {
    const predecessorAdmission =
      await finalizeG678GlossaryFamilyRegistration({check: true});
    invariant(predecessorAdmission.check === true &&
      predecessorAdmission.registrationCandidatePlacementCount === 261,
    '261-page predecessor final admission failed');
  }
  const [ts05AuditCheck, recoveryCheck, generatorCheck] = await Promise.all([
    auditTs05Family({check: true}),
    auditTs05L1Keyterms({check: true}),
    runTs05L1CurrentJs({check: true}),
  ]);
  invariant(ts05AuditCheck.check && recoveryCheck.check && generatorCheck.check,
    'TS05 prerequisite checks did not complete');
  const [predecessorFreeze, predecessorFragment, audit, recovery,
    generatedFragment, catalog, profile, builder] = await Promise.all([
      binding(PREDECESSOR_FREEZE, true),
      binding(PREDECESSOR_FRAGMENT, true),
      binding(AUDIT, true), binding(RECOVERY, true),
      binding(GENERATED_FRAGMENT, true), binding(CATALOG, true),
      binding(PROFILE, true), binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  invariant(predecessorFreeze.value.calibrationId === CALIBRATION_ID &&
    predecessorFreeze.value.selectedPages.length === 261 &&
    predecessorFragment.value.calibration.calibrationId === CALIBRATION_ID &&
    predecessorFragment.value.calibration.freezeManifest ===
      PREDECESSOR_FREEZE &&
    JSON.stringify(predecessorFragment.value.freeze) ===
      JSON.stringify(descriptor(predecessorFreeze)) &&
    predecessorFragment.value.calibration.entries.length === 261 &&
    audit.value.scope.ts05Placements === 44 &&
    recovery.value.eligibility.eligiblePlacementCount === 15 &&
    generatedFragment.value.generatedPlacementCount === 15 &&
    generatedFragment.value.entries.length === 15 &&
    generatedFragment.value.currentJavaScriptRegisteredCount === 0 &&
    JSON.stringify(generatedFragment.value.reviewedAudit) ===
      JSON.stringify(descriptor(audit)) &&
    JSON.stringify(generatedFragment.value.keyTermRecovery) ===
      JSON.stringify(descriptor(recovery)) &&
    JSON.stringify(generatedFragment.value.predecessorFreeze) ===
      JSON.stringify(descriptor(predecessorFreeze)),
  'TS05 predecessor/audit/recovery/fragment authority drifted');
  const run = await binding(generatedFragment.value.compilerRun.path, true);
  invariant(run.bytes === generatedFragment.value.compilerRun.bytes &&
    run.sha256 === generatedFragment.value.compilerRun.sha256 &&
    run.value.generatedPlacementCount === 15 &&
    run.value.compiledUniqueSwfCount === 15 &&
    run.value.registryEntriesWritten === 0 &&
    JSON.stringify(run.value.inputs.audit) === JSON.stringify(descriptor(audit)) &&
    JSON.stringify(run.value.inputs.recovery) === JSON.stringify(descriptor(recovery)) &&
    JSON.stringify(run.value.inputs.predecessor) ===
      JSON.stringify(descriptor(predecessorFreeze)),
  'TS05 compiler run authority drifted');
  const expectedKeys = recovery.value.eligibility.eligible.map((row) =>
    row.animationId).sort();
  invariant(JSON.stringify(generatedFragment.value.entries.map((entry) =>
    entry.key).sort()) === JSON.stringify(expectedKeys) &&
    JSON.stringify(run.value.members.map((member) =>
      member.animationId).sort()) === JSON.stringify(expectedKeys),
  'TS05 exact generated/admitted membership drifted');
  const runMembers = new Map(run.value.members.map((member) =>
    [member.animationId, member]));
  const pages = pageMap(catalog.value);
  const ts05Pages = [];
  for (const entry of [...generatedFragment.value.entries].sort((left, right) =>
    left.key.localeCompare(right.key))) {
    ts05Pages.push(await verifyEntry(entry, runMembers.get(entry.key), pages,
      recovery.value.terms, recovery));
  }
  const selectedPages = [...predecessorFreeze.value.selectedPages,
    ...ts05Pages].sort((left, right) =>
    left.animationId.localeCompare(right.animationId));
  invariant(selectedPages.length === 276 &&
    new Set(selectedPages.map((page) => page.animationId)).size === 276 &&
    new Set(selectedPages.map((page) => page.stableLessonKey)).size === 44,
  'combined TS05 membership drifted');
  const acceptanceEffects = Object.freeze({
    ...predecessorFreeze.value.acceptanceEffects,
  });
  invariant(Object.values(acceptanceEffects).every((value) => value === false),
    'combined acceptance effects must remain false');
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    deploymentScope: 'local-only',
    status: 'private-current-js-calibration-candidates-generated',
    frozenCalibrationPlacementCount: 2282,
    registrationCandidatePlacementCount: 276,
    sharedAdapterPlacementCount: 273,
    advancedManualPlacementCount: 3,
    legacyFlashCourseShellCount: 0,
    scaleOutAuthorized: false,
    engineeringPreviewReady: false,
    productCalibrationPassed: false,
    inputs: {
      sharedCatalog: descriptor(catalog),
      sourceProfile: descriptor(profile),
      selectionAuthorities: [descriptor(predecessorFreeze), descriptor(audit),
        descriptor(recovery)],
      predecessorFreeze: descriptor(predecessorFreeze),
      ts05Audit: descriptor(audit),
      ts05L1KeytermRecovery: descriptor(recovery),
      ts05GeneratedFragment: descriptor(generatedFragment),
      finalizer: descriptor(builder),
    },
    selectedPages,
    pendingAdvancedManualPlacements: [],
    acceptanceEffects,
    limitations: [
      '276 registered pages remain partial across all 44 lessons; no N/N whole-lesson engineering preview exists.',
      'Only the exact 15 TS05 placements whose lessons reference the recovered L1 glossary pair are admitted; 29 TS05 placements remain blocked.',
      'TS05 browser product calibration, legacy glossary sublinks/example SWFs, audio, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      'Current-host replay of predecessor samples is deferred to the mandatory 276-page successor browser calibration.',
      'Recovered key-term XML remains private custody evidence and is not promoted into the canonical source tree.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const newEntries = generatedFragment.value.entries.map((entry) => ({
    key: entry.key,
    module: entry.module,
    maturity: entry.maturity,
    complexityLane: entry.complexityLane,
    artifacts: {module: entry.moduleFile, timeline: entry.timeline,
      runtime: entry.runtime.canvasRenderer},
  }));
  const entries = [...predecessorFragment.value.calibration.entries,
    ...newEntries].sort((left, right) => left.key.localeCompare(right.key));
  invariant(entries.length === 276 &&
    new Set(entries.map((entry) => entry.key)).size === 276,
  'combined registry entry membership drifted');
  const fragment = {
    schemaVersion: 1,
    artifactType: 'private-current-js-calibration-fragment-v1',
    calibration: {calibrationId: CALIBRATION_ID,
      deploymentScope: 'local-only', freezeManifest: OUTPUT_FREEZE, entries},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {registrationCandidatePlacementCount: 276,
      frozenCalibrationPlacementCount: 2282,
      affectedLessonCount: 44,
      wholeLessonEngineeringPreviewCount: 0,
      sourceOrderedLessonMembershipRequired: true,
      modernMyLessonHostRequired: true,
      engineeringPreviewReady: false},
    familyScaleout: {ts05AuditedPlacements: 44,
      recoveredEligiblePlacements: 15,
      blockedPlacements: 29,
      predecessorOverlap: 0,
      generatedAndAdmittedPlacements: 15,
      browserProductCalibrationPassed: false},
    acceptanceEffects,
  };
  return Object.freeze({freeze, fragment,
    freezeBytes, fragmentBytes: stableBytes(fragment)});
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function finalizeTs05L1Registration({check = false,
  requireCurrentPredecessorHost = false} = {}) {
  const artifacts = await expectedArtifacts({requireCurrentPredecessorHost});
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'TS05 276-page registration artifacts drifted');
  } else {
    await writeExclusive(OUTPUT_FREEZE, artifacts.freezeBytes);
    try {
      await writeExclusive(OUTPUT_FRAGMENT, artifacts.fragmentBytes);
    } catch (error) {
      const current = await binding(OUTPUT_FREEZE);
      if (current.buffer.equals(artifacts.freezeBytes)) {
        await unlink(absolute(OUTPUT_FREEZE));
      }
      throw error;
    }
  }
  return Object.freeze({check,
    registrationCandidatePlacementCount: 276,
    frozenCalibrationPlacementCount: 2282,
    affectedLessonCount: 44,
    wholeLessonEngineeringPreviewCount: 0,
    productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-ts05-l1-registration.mjs [--check]');
  finalizeTs05L1Registration({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
