#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678Final354CurrentBridgeSuccessorCompatibility} from
  './audit-g678-final354-current-bridge-successor-compatibility.mjs';
import {buildG678AlgL11Remaining23FamilyCalibration} from
  './build-g678-alg-l11-remaining23-family-calibration.mjs';
import {buildG678CurrentJs377BrowserAggregate} from
  './build-g678-current-js-377-browser-aggregate.mjs';
import {finalizeG678AlgL11Remaining23Provisional377Registration} from
  './finalize-g678-alg-l11-remaining23-provisional377-registration.mjs';
import {freezeG678Final354PrivateCurrentJsRegistryWitness} from
  './freeze-g678-final354-private-current-js-registry-witness.mjs';
import {IDS, qaG678AlgL11Remaining23Browser} from
  './qa-g678-alg-l11-remaining23-browser.mjs';
import {synchronizePrivateCurrentJsCalibration} from
  './upsert-private-current-js-calibration.mjs';
import {assertRemaining23InstructionalContentAdmission,
  requireRemaining23InstructionalContentAdmission} from
  './g678-alg-l11-remaining23-instructional-content.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const BROWSER_BLOCKER =
  'alg-l11-remaining23-browser-product-calibration-pending';
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-registration-v1.fragment.json';
const REGISTRY = 'packages/demos/private-current-js-registry.json';
const WITNESS =
  'catalog/product-bridge-calibrations/g678-final354-private-current-js-registry-witness-v1.json';
const SUCCESSOR =
  'catalog/g678-final354-current-bridge-successor-compatibility-v1.json';
const FOCUSED =
  'output/playwright/g678-alg-l11-remaining23-377-v1/evidence.json';
const AGGREGATE = 'output/playwright/g678-current-js-377-v1/evidence.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-alg-l11-remaining23-family-calibration-v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-377-page-product-calibrated-registration-v1.fragment.json';

export const FINAL377_REQUIRED_BINDINGS = Object.freeze({
  provisionalFreeze: Object.freeze({path: PROVISIONAL_FREEZE, bytes: 2275220,
    sha256: '16a8e04786520f62e1e5a833cb9b23aa0e9c25c5e2c1a610970c4774e1bae646'}),
  provisionalFragment: Object.freeze({path: PROVISIONAL_FRAGMENT, bytes: 276582,
    sha256: '9b0e4f2a84882ab499154d77fa2831581665487182adf256683d8de04ea3efa4'}),
  registry: Object.freeze({path: REGISTRY, bytes: 430979,
    sha256: 'bdae8f916495a80d13dd1e02282c21f6de25a8f45247ddb1207b410fc68b9212'}),
  final354RegistryWitness: Object.freeze({path: WITNESS, bytes: 397841,
    sha256: '2c734cdba9d19efaea00812bffdae5fa2de747972b447b8f86f6f2a0d037d239'}),
  successorCompatibility: Object.freeze({path: SUCCESSOR, bytes: 4232,
    sha256: '2b9f3501c97f0d2eb1bc298d093d67417eba89e24e17f5a20e0b67ff8b0f61c1'}),
  focusedBrowser: null,
  aggregateBrowser: null,
  family: null,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function stableBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }
function exact(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function allFalse(value) {
  const values = Object.values(value ?? {});
  return values.length > 0 && values.every((item) => item === false);
}
function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}
function absolute(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}
async function binding(relativePath, json = false) {
  const target = absolute(relativePath);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${relativePath} must be one canonical ordinary single-link file`);
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

export function final377BrowserBindingStatus() {
  const pending = ['focusedBrowser', 'aggregateBrowser', 'family'].filter(
    (key) => FINAL377_REQUIRED_BINDINGS[key] === null);
  return Object.freeze({ready: pending.length === 0,
    blocker: pending.length
      ? 'final377-browser-family-evidence-not-stable'
      : null,
    pending: Object.freeze(pending)});
}

export function assertFinal377RequiredBinding(label, actual) {
  const expected = FINAL377_REQUIRED_BINDINGS[label];
  invariant(expected !== null && expected !== undefined &&
    exact(actual, expected),
  expected === null
    ? 'final377 browser/family evidence is not stable'
    : `final377 ${label} binding drifted`);
  return true;
}

export function assertFinal377EvidenceSummary({focused, aggregate, family,
  provisional}) {
  const focusedPages = [
    ...(focused?.aInteractive10?.pages ?? []),
    ...(focused?.bBehavior10?.pages ?? []),
    ...(focused?.dAdvanced3?.pages ?? []),
  ];
  invariant(focused?.artifactType ===
      'g678-alg-l11-remaining23-browser-qa-v1' &&
    focused.registeredCurrentJsPages === 377 &&
    exact(focused.exact23Pages?.map((item) => item.animationId), IDS) &&
    focused.exact23Pages.every((item) => item.domModuleLoaded === true &&
      item.pageSpecificAssetRequestCount === 0 &&
      item.deepProductBehaviorPassed === true) &&
    exact(focusedPages.map((item) => item.animationId), IDS) &&
    focusedPages.every((item) => Array.isArray(item.errors) &&
      item.errors.length === 0 && item.screenshot?.sha256) &&
    focused.currentHostPredecessorReplay
      ?.currentHostPredecessorReplayCount === 104 &&
    focused.currentHostPredecessorReplay
      ?.uniqueCurrentHostPredecessorModuleCount === 104 &&
    focused.currentHostPredecessorReplay.results.every((item) =>
      item.errors?.length === 0 &&
      item.replayCounterAfter === item.replayCounterBefore + 1) &&
    focused.requestPolicy?.allObservedRequestsLoopback === true &&
    focused.requestPolicy?.allObservedRequestsExplicitlyAllowed === true &&
    focused.requestPolicy?.legacyNetworkOperationsObserved === 0 &&
    focused.requestPolicy?.guardMode ===
      'abort-unallowlisted-before-network' &&
    focused.requestPolicy?.blockedRequestCount === 0 &&
    focused.allLessons?.errors?.length === 0 &&
    focused.screenshots?.length === 24 &&
    new Set(focused.screenshots.map((item) => item.path)).size === 24 &&
    allFalse(focused.acceptanceEffects),
  'final377 focused browser evidence drifted');
  invariant(aggregate?.artifactType === 'g678-current-js-377-browser-qa-v1' &&
    aggregate.registeredCurrentJsPages === 377 &&
    aggregate.samples?.length === 127 &&
    new Set(aggregate.samples.map((item) => item.animationId)).size === 127 &&
    aggregate.samples.every((item) =>
      item.currentHostBrowserRevalidated === true) &&
    aggregate.screenshots?.length === 135 &&
    new Set(aggregate.screenshots.map((item) => item.path)).size === 135 &&
    aggregate.browserEvidenceComposition
      ?.currentHostPredecessorReplayCount === 104 &&
    aggregate.browserEvidenceComposition
      ?.currentHostNewPlacementDeepRecordCount === 23 &&
    aggregate.browserEvidenceComposition?.currentHostLiveRecordCount === 127 &&
    aggregate.browserEvidenceComposition
      ?.currentHostUniqueSampledModuleCount === 127 &&
    aggregate.browserEvidenceComposition
      ?.fullHistoricalSpecialInteractionReplay === false &&
    aggregate.browserEvidenceComposition?.exact23FamilyCalibrationPending ===
      true && aggregate.browserEvidenceComposition
      ?.overallG678ProductCalibrationPassed === false &&
    allFalse(aggregate.acceptanceEffects),
  'final377 aggregate browser evidence drifted');
  invariant(family?.artifactType ===
      'g678-alg-l11-remaining23-family-calibration-v1' &&
    family.status ===
      'exact-23-alg-l11-private-current-js-product-host-calibrated-final-registration-pending' &&
    exact(family.authorizedPlacementIds, IDS) &&
    family.auditedPlacementCount === 23 &&
    family.blockedPlacementCount === 0 &&
    family.focusedBrowserScreenshotCount === 24 &&
    family.currentHostPredecessorReplayCount === 104 &&
    family.aggregateCurrentHostLiveSampleRecordCount === 127 &&
    family.aggregateCurrentHostUniqueSampledModuleCount === 127 &&
    family.aggregateBrowserScreenshotCount === 135 &&
    family.productHostCalibration?.exact23FamilyCurrentJsCalibrationPassed ===
      true && family.productHostCalibration
      ?.allBrowserConsoleAndPageErrorsZero === true &&
    family.productHostCalibration?.allObservedRequestsLoopback === true &&
    family.productHostCalibration
      ?.allObservedRequestsExplicitlyAllowed === true &&
    family.productHostCalibration?.allLegacyNetworkOperationsBlocked === true &&
    family.productHostCalibration?.algL11Complete44Of44 === true &&
    family.productHostCalibration?.overallG678ProductCalibrationPassed ===
      false && family.authorization?.authorized === true &&
    family.authorization?.permitsOtherG678Placements === false &&
    family.authorization?.permitsFinal377Registration === false &&
    allFalse(family.acceptanceEffects) &&
    provisional?.registrationCandidatePlacementCount === 377 &&
    provisional.selectedPages?.length === 377,
  'final377 family calibration authority drifted');
  return true;
}

export function calibrateFinal377Remaining23Page(page, {focusedBrowser,
  aggregateBrowser, family, successorCompatibility, contentAdmission}) {
  assertRemaining23InstructionalContentAdmission(contentAdmission);
  invariant(IDS.includes(page?.animationId) &&
    page.runtime?.rendererBinding?.kind === 'maintained-dom-module-v1' &&
    page.runtime?.canvasRenderer === undefined &&
    page.implementation?.familyVisualPlaybackCalibrationPassed === false &&
    page.productCalibrationPassed === false &&
    page.engineeringPreviewReady === false,
  `${page?.animationId ?? 'unknown'}: final377 exact23 page boundary drifted`);
  const blockers = [...(page.productBlockers ?? [])];
  invariant(blockers.filter((item) => item === BROWSER_BLOCKER).length === 1,
    `${page.animationId}: final377 browser blocker is not exact`);
  const retained = blockers.filter((item) => item !== BROWSER_BLOCKER);
  invariant(exact(retained, [
    'source-audio-lifecycle-and-listening-acceptance-pending',
    'authoritative-original-runtime-not-established',
    'visual-fidelity-not-accepted',
  ]), `${page.animationId}: final377 downstream blockers drifted`);
  return Object.freeze({...page,
    implementation: Object.freeze({...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      productCalibrationPassed: false}),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(family),
      focusedBrowserEvidence: descriptor(focusedBrowser),
      browserEvidence: descriptor(aggregateBrowser),
      successorCompatibilityAuthority: descriptor(successorCompatibility),
      instructionalContentContract: contentAdmission.contentContract,
      visibleInstructionalContent: contentAdmission.browserVisibleContent,
      rendererBindingKind: 'maintained-dom-module-v1',
      maintainedDomModuleLoaded: true,
      pageSpecificCanvasAssetRequestCount: 0,
      deepProductBehaviorPassed: true,
      replayResetPassed: true,
      currentHostBrowserRevalidated: true,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      familyCurrentJsCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productBlockers: Object.freeze(retained),
    productCalibrationPassed: false,
    engineeringPreviewReady: false});
}

export function rebindFinal377PredecessorPage(page, aggregateBrowser) {
  if (!page?.productHostCalibration) return page;
  invariant(page.productHostCalibration.browserEvidence?.path,
    `${page.animationId}: predecessor browser evidence binding is absent`);
  return Object.freeze({...page,
    productHostCalibration: Object.freeze({...page.productHostCalibration,
      browserEvidence: descriptor(aggregateBrowser)}),
  });
}

export function buildFinal377Artifacts({provisionalFreeze,
  provisionalFragment, focusedBrowser, aggregateBrowser, family,
  successorCompatibility, builder, contentAdmission}) {
  assertRemaining23InstructionalContentAdmission(contentAdmission);
  invariant(exact(family?.value?.inputs?.instructionalContentContract,
    contentAdmission.contentContract) &&
    exact(family?.value?.inputs?.visibleInstructionalContent,
      contentAdmission.browserVisibleContent),
  'final377 family instructional content binding drifted');
  assertFinal377EvidenceSummary({focused: focusedBrowser.value,
    aggregate: aggregateBrowser.value, family: family.value,
    provisional: provisionalFreeze.value});
  const provisional = provisionalFreeze.value;
  const newIds = new Set(IDS);
  const selectedPages = provisional.selectedPages.map((page) =>
    newIds.has(page.animationId)
      ? calibrateFinal377Remaining23Page(page, {focusedBrowser,
          aggregateBrowser, family, successorCompatibility, contentAdmission})
      : rebindFinal377PredecessorPage(page, aggregateBrowser));
  const predecessorPages = selectedPages.filter((page) =>
    !newIds.has(page.animationId));
  const calibratedPages = selectedPages.filter((page) =>
    page.productHostCalibration);
  const familyAuthorities = new Set(calibratedPages.map((page) =>
    page.productHostCalibration.familyAuthority.path));
  invariant(selectedPages.length === 377 && predecessorPages.length === 354 &&
    calibratedPages.length === 161 && familyAuthorities.size === 23 &&
    exact(selectedPages.filter((page) => newIds.has(page.animationId))
      .map((page) => page.animationId).sort(), [...IDS].sort()) &&
    selectedPages.filter((page) => newIds.has(page.animationId)).every(
      (page) => !page.productBlockers.includes(BROWSER_BLOCKER) &&
        page.implementation.familyVisualPlaybackCalibrationPassed === true),
  'final377 selected-page family transformation drifted');
  const selectionAuthorities = new Map();
  for (const item of [...provisional.inputs.selectionAuthorities,
    descriptor(provisionalFreeze), descriptor(family)]) {
    const prior = selectionAuthorities.get(item.path);
    invariant(!prior || exact(prior, item),
      `final377 selection authority conflict: ${item.path}`);
    selectionAuthorities.set(item.path, item);
  }
  const freeze = {...provisional,
    status: 'private-current-js-product-host-calibrated-candidates-registered',
    inputs: {...provisional.inputs,
      selectionAuthorities: [...selectionAuthorities.values()],
      provisionalFreeze: descriptor(provisionalFreeze),
      provisionalFragment: descriptor(provisionalFragment),
      focusedBrowserProductEvidence: descriptor(focusedBrowser),
      browserProductEvidence: descriptor(aggregateBrowser),
      successorCompatibilityAudit: descriptor(successorCompatibility),
      algL11Remaining23FamilyCalibration: descriptor(family),
      provisionalFinalizer: provisional.inputs.finalizer,
      finalizer: descriptor(builder)},
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 161,
      familyCalibrationCount: 23,
      algL11Remaining23FamilyCalibratedPlacementCount: 23,
      currentHostPredecessorReplayCount: 104,
      currentHostLiveSampleRecordCount: 127,
      browserSampleCount: 127,
      screenshotCount: 135,
      registeredCompleteLessonCount: 2,
      exactRegisteredCompleteLessonKeys: [
        'shared-alg001-l09', 'shared-alg001-l11'],
      productCalibratedWholeLessonEngineeringPreviewCount: 2,
      newWholeLessonEngineeringPreviewCount: 1,
      currentHostBrowserRevalidated: true,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false},
    limitations: [
      '377 registered Current-JS pages complete ALG L9 and ALG L11 at registration and product-calibrated engineering-preview layers only.',
      'The exact twenty-three remaining ALG L11 maintained DOM pages passed bounded current-host browser and family calibration; all 104 predecessor samples were replayed on the same current host.',
      'The three historical special-ready predecessor interactions remain ready-only and are not reclassified as full historical interaction replays.',
      'Audio listening, authoritative original runtime, behavior parity, visual fidelity, human, Owner, strict completion, release, and publication remain false.',
    ]};
  invariant(allFalse(freeze.acceptanceEffects),
    'final377 acceptance boundary drifted');
  const freezeBytes = stableBytes(freeze);
  const fragment = {...provisionalFragment.value,
    calibration: {...provisionalFragment.value.calibration,
      freezeManifest: OUTPUT_FREEZE},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {...provisionalFragment.value.descriptorProjection,
      registeredCompleteLessonCount: 2,
      exactRegisteredCompleteLessonKeys: [
        'shared-alg001-l09', 'shared-alg001-l11'],
      wholeLessonEngineeringPreviewCount: 2,
      newWholeLessonEngineeringPreviewCount: 1,
      productCalibratedCompleteLessonKeys: [
        'shared-alg001-l09', 'shared-alg001-l11'],
      engineeringPreviewReady: false},
    familyScaleout: {
      algL11Remaining23ProductHostCalibratedPlacements: 23,
      totalProductHostCalibratedPlacements: 161,
      familyCalibrationCount: 23,
      currentHostPredecessorReplayCount: 104,
      browserSampleCount: 127,
      screenshotCount: 135,
      registeredCompleteLessonCount: 2,
      wholeLessonEngineeringPreviewCount: 2,
      newWholeLessonEngineeringPreviewCount: 1,
      currentHostBrowserRevalidated: true,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false},
    registrationBoundary: {
      exactRegisteredPlacementCount: 377,
      exactPredecessorPlacementCountPreserved: 354,
      exactNewFamilyCalibratedPlacementCount: 23,
      algL11RegisteredPageCount: 44,
      algL11ActivePageCount: 44,
      registeredCompleteLessonCount: 2,
      wholeLessonEngineeringPreviewCount: 2,
      newWholeLessonEngineeringPreviewCount: 1,
      releaseOrPublicationAuthorized: false},
    limitations: freeze.limitations};
  return Object.freeze({freeze, fragment, freezeBytes,
    fragmentBytes: stableBytes(fragment)});
}

export async function prepareG678AlgL11Remaining23FamilyRegistration() {
  const contentAdmission = await requireRemaining23InstructionalContentAdmission();
  const status = final377BrowserBindingStatus();
  invariant(status.ready,
    'final377 browser/family evidence is not stable');
  const [provisionalCheck, focusedCheck, aggregateCheck, familyCheck,
    successorCheck, witnessCheck, registryCheck] = await Promise.all([
    finalizeG678AlgL11Remaining23Provisional377Registration({check: true}),
    qaG678AlgL11Remaining23Browser({check: true}),
    buildG678CurrentJs377BrowserAggregate({check: true}),
    buildG678AlgL11Remaining23FamilyCalibration({check: true}),
    auditG678Final354CurrentBridgeSuccessorCompatibility({check: true}),
    freezeG678Final354PrivateCurrentJsRegistryWitness({check: true}),
    synchronizePrivateCurrentJsCalibration({check: true,
      calibrationPath: PROVISIONAL_FRAGMENT, provisionalBrowserQa: true}),
  ]);
  invariant(provisionalCheck.registrationCandidatePlacementCount === 377 &&
    focusedCheck.exact23DeepProductRecordCount === 23 &&
    focusedCheck.predecessorReplayCount === 104 &&
    aggregateCheck.currentHostLiveRecords === 127 &&
    familyCheck.authorizedPlacementCount === 23 &&
    successorCheck.exactDescriptorInvariantCount === 354 &&
    witnessCheck.exactFinal354RegistrationCount === 354 &&
    registryCheck.entries === 377,
  'final377 prerequisite check receipts drifted');
  const paths = {provisionalFreeze: PROVISIONAL_FREEZE,
    provisionalFragment: PROVISIONAL_FRAGMENT, registry: REGISTRY,
    final354RegistryWitness: WITNESS, successorCompatibility: SUCCESSOR,
    focusedBrowser: FOCUSED, aggregateBrowser: AGGREGATE, family: FAMILY};
  const values = Object.fromEntries(await Promise.all(Object.entries(paths)
    .map(async ([label, relativePath]) => {
      const value = await binding(relativePath, true);
      assertFinal377RequiredBinding(label, descriptor(value));
      return [label, value];
    })));
  const builder = await binding(path.relative(ROOT, SCRIPT_PATH));
  return buildFinal377Artifacts({provisionalFreeze: values.provisionalFreeze,
    provisionalFragment: values.provisionalFragment,
    focusedBrowser: values.focusedBrowser,
    aggregateBrowser: values.aggregateBrowser, family: values.family,
    successorCompatibility: values.successorCompatibility, builder,
    contentAdmission});
}

async function writeExclusive(relativePath, bytes) {
  const target = absolute(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try { await copyFile(temporary, target, fsConstants.COPYFILE_EXCL); }
  finally { await unlink(temporary).catch(() => {}); }
}

export async function finalizeG678AlgL11Remaining23FamilyRegistration(
  {check = false} = {},
) {
  const artifacts = await prepareG678AlgL11Remaining23FamilyRegistration();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-family final377 registration artifacts drifted');
  } else {
    await writeExclusive(OUTPUT_FREEZE, artifacts.freezeBytes);
    try { await writeExclusive(OUTPUT_FRAGMENT, artifacts.fragmentBytes); }
    catch (error) {
      const current = await binding(OUTPUT_FREEZE).catch(() => null);
      if (current?.buffer.equals(artifacts.freezeBytes)) {
        await unlink(absolute(OUTPUT_FREEZE));
      }
      throw error;
    }
  }
  return Object.freeze({check, registrationCandidatePlacementCount: 377,
    productHostCalibratedPlacementCount: 161,
    familyCalibrationCount: 23,
    frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
    algL11RegisteredPageCount: 44, algL11ActivePageCount: 44,
    registeredCompleteLessonCount: 2,
    wholeLessonEngineeringPreviewCount: 2,
    newWholeLessonEngineeringPreviewCount: 1,
    currentHostPredecessorReplayCount: 104,
    currentHostBrowserRevalidated: true,
    productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l11-remaining23-family-registration.mjs [--check]');
  finalizeG678AlgL11Remaining23FamilyRegistration({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
