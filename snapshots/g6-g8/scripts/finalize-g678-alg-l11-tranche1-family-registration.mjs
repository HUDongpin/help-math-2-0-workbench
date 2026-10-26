#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, realpath, unlink, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678Final342CurrentBridgeSuccessorCompatibility} from
  './audit-g678-final342-current-bridge-successor-compatibility.mjs';
import {buildG678AlgL11Tranche1FamilyCalibration} from
  './build-g678-alg-l11-tranche1-family-calibration.mjs';
import {finalizeAlgL11Tranche1Registration} from
  './finalize-g678-alg-l11-tranche1-registration.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const BROWSER_BLOCKER =
  'alg-l11-tranche1-browser-product-calibration-pending';
const IDS = Object.freeze([
  'shared-alg001-l11-p001', 'shared-alg001-l11-p002',
  'shared-alg001-l11-p003', 'shared-alg001-l11-p004',
  'shared-alg001-l11-p007', 'shared-alg001-l11-p013',
  'shared-alg001-l11-p016', 'shared-alg001-l11-p017',
  'shared-alg001-l11-p018', 'shared-alg001-l11-p022',
  'shared-alg001-l11-p023', 'shared-alg001-l11-p024',
]);
const ID_SET = new Set(IDS);
const INTRO_IDS = new Set(IDS.slice(0, 4));
const ADAPTER_FAMILIES = Object.freeze([
  'alg-l11-intro-terminal-tranche1-source-static',
  'alg-l11-simple-glossary-tranche1-source-static',
]);
const PROVISIONAL_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';
const PROVISIONAL_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.fragment.json';
const PREDECESSOR_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const FAMILY =
  'catalog/product-bridge-calibrations/g678-alg-l11-tranche1-family-calibration-v1.json';
const FOCUSED_BROWSER =
  'output/playwright/g678-alg-l11-tranche1-354-v1/evidence.json';
const AGGREGATE_BROWSER =
  'output/playwright/g678-current-js-354-v1/evidence.json';
const SUCCESSOR_COMPATIBILITY =
  'catalog/g678-final342-current-bridge-successor-compatibility-v1.json';
export const OUTPUT_FREEZE =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.json';
export const OUTPUT_FRAGMENT =
  'catalog/product-bridge-calibrations/g678-current-js-354-page-product-calibrated-registration-v1.fragment.json';

export const FINAL354_REQUIRED_BINDINGS = Object.freeze({
  provisionalFreeze: Object.freeze({path: PROVISIONAL_FREEZE, bytes: 2150663,
    sha256: 'f17969295b87889c2e150ab259ad153f6fb8a0a3a890dd94582b3cc06e70ad3b'}),
  provisionalFragment: Object.freeze({path: PROVISIONAL_FRAGMENT, bytes: 243488,
    sha256: 'ee988a349187688c664323ae0886f590dfe42f71ad7e30744050343c7013b76f'}),
  family: Object.freeze({path: FAMILY, bytes: 12347,
    sha256: 'dffc9d559c4b9ca4bf46d320d951f283a60f6a469985b063e12492801904d3a6'}),
  focusedBrowser: Object.freeze({path: FOCUSED_BROWSER, bytes: 960315,
    sha256: '9be0fc2b2e5ce9e03e1eeb6ede42b6a8f6cc42e22d35eb998dc095b63391d6ec'}),
  aggregateBrowser: Object.freeze({path: AGGREGATE_BROWSER, bytes: 86640,
    sha256: '6e8a3beab7433a662d38b263e43749a1ee146a54558b47d698b742521cd7571e'}),
  successorCompatibility: Object.freeze({path: SUCCESSOR_COMPATIBILITY,
    bytes: 211039,
    sha256: 'fbe4fb77634a6fa84fbc7f6a2d486c78e20a0f5641332267f436dd78df81aeb8'}),
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

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function allFalse(value) {
  const values = Object.values(value ?? {});
  return values.length > 0 && values.every((item) => item === false);
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
  `${relativePath} must be one canonical ordinary file`);
  const bytes = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${relativePath} changed during read`);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes), buffer: bytes,
    ...(json ? {value: JSON.parse(bytes.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

export function assertFinal354RequiredBinding(label, actual) {
  const expected = FINAL354_REQUIRED_BINDINGS[label];
  invariant(expected && exact(actual, expected),
    `final354 ${label} binding drifted`);
  return true;
}

export function calibrateAlgL11Tranche1Page(page, {
  aggregateBrowser,
  family,
  focusedBrowser,
  successorCompatibility,
}) {
  invariant(ID_SET.has(page.animationId),
    `${page.animationId}: final354 page is outside exact12`);
  const expectedFamily = INTRO_IDS.has(page.animationId)
    ? ADAPTER_FAMILIES[0]
    : ADAPTER_FAMILIES[1];
  invariant(page.adapterFamily === expectedFamily,
    `${page.animationId}: final354 adapter family drifted`);
  const hasGlossary = page.animationId !== 'shared-alg001-l11-p001';
  const blockers = [...(page.productBlockers ?? [])];
  invariant(blockers.filter((blocker) => blocker === BROWSER_BLOCKER).length ===
      1,
  `${page.animationId}: final354 browser blocker is not exact`);
  const retainedBlockers = blockers.filter((blocker) =>
    blocker !== BROWSER_BLOCKER);
  const expectedRetainedBlockers = [
    ...(hasGlossary
      ? ['legacy-key-term-sublinks-and-example-swfs-not-implemented']
      : []),
    'source-audio-lifecycle-and-listening-acceptance-pending',
    'authoritative-original-runtime-not-established',
    'visual-fidelity-not-accepted',
  ];
  invariant(exact(retainedBlockers, expectedRetainedBlockers),
    `${page.animationId}: final354 downstream blockers drifted`);
  const glossary = page.glossaryEntries ?? [];
  const companionSuffix =
    page.presentation?.pageInteractionCompanionTargetIdSuffix;
  invariant((!hasGlossary && glossary.length === 0 && !companionSuffix) ||
    (hasGlossary && glossary.length > 0 && companionSuffix ===
      `alg-l11-${page.animationId.slice(-4)}-glossary-controls`),
  `${page.animationId}: final354 glossary presentation drifted`);
  invariant(page.implementation?.deploymentScope === 'local-only' &&
    page.implementation.productCalibrationPassed === false &&
    page.productCalibrationPassed === false &&
    page.engineeringPreviewReady === false,
  `${page.animationId}: final354 provisional boundary drifted`);
  return Object.freeze({...page,
    implementation: Object.freeze({...page.implementation,
      familyVisualPlaybackCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productHostCalibration: Object.freeze({
      familyAuthority: descriptor(family),
      focusedBrowserEvidence: descriptor(focusedBrowser),
      browserEvidence: descriptor(aggregateBrowser),
      successorCompatibilityAuthority: descriptor(successorCompatibility),
      canvasFirstMiddleLastReady: true,
      sourceFrameAndTerminalWindowsPassed: true,
      typedGlossaryHostOpenPauseCloseFocusPassed: hasGlossary,
      runningGlossaryOpenCloseResumeLivePassed: hasGlossary,
      inspectedGlossaryOpenClosePauseAndSeekPreservedLivePassed: hasGlossary,
      replayResetPassed: true,
      allObservedRequestsLoopback: true,
      allObservedRequestsExplicitlyAllowed: true,
      allLegacyNetworkOperationsBlocked: true,
      familyCurrentJsCalibrationPassed: true,
      productCalibrationPassed: false,
    }),
    productBlockers: Object.freeze(retainedBlockers),
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
  });
}

export function rebindFinal342PageToCurrentHost(page, aggregateBrowser) {
  if (!page.productHostCalibration) return page;
  invariant(page.productHostCalibration.browserEvidence &&
    typeof page.productHostCalibration.browserEvidence.path === 'string',
  `${page.animationId}: final342 browser evidence binding is absent`);
  return Object.freeze({...page,
    productHostCalibration: Object.freeze({...page.productHostCalibration,
      browserEvidence: descriptor(aggregateBrowser),
    }),
  });
}

export async function prepareG678AlgL11Tranche1FamilyRegistration() {
  const [provisionalAdmission, familyAdmission, compatibilityAdmission] =
    await Promise.all([
      finalizeAlgL11Tranche1Registration({check: true,
        requireCurrentPredecessorHost: false}),
      buildG678AlgL11Tranche1FamilyCalibration({check: true}),
      auditG678Final342CurrentBridgeSuccessorCompatibility({check: true}),
    ]);
  invariant(provisionalAdmission.registrationCandidatePlacementCount === 354 &&
    familyAdmission.authorizedPlacementCount === 12 &&
    familyAdmission.productHostCalibrationPassed === true &&
    compatibilityAdmission.descriptorInvariantCount === 342 &&
    compatibilityAdmission.exactInverseTransformationPassed === true &&
    compatibilityAdmission.currentHostBrowserRevalidated === false,
  'final354 predecessor/family/successor admission failed');

  const [provisionalFreeze, provisionalFragment, predecessorFreeze, family,
    focusedBrowser, aggregateBrowser, successorCompatibility, builder] =
    await Promise.all([
      binding(PROVISIONAL_FREEZE, true), binding(PROVISIONAL_FRAGMENT, true),
      binding(PREDECESSOR_FREEZE, true), binding(FAMILY, true),
      binding(FOCUSED_BROWSER, true), binding(AGGREGATE_BROWSER, true),
      binding(SUCCESSOR_COMPATIBILITY, true),
      binding(path.relative(ROOT, SCRIPT_PATH)),
    ]);
  for (const [label, value] of Object.entries({provisionalFreeze,
    provisionalFragment, family, focusedBrowser, aggregateBrowser,
    successorCompatibility})) {
    assertFinal354RequiredBinding(label, descriptor(value));
  }

  invariant(provisionalFreeze.value.calibrationId === CALIBRATION_ID &&
    provisionalFreeze.value.status ===
      'private-current-js-calibration-candidates-generated' &&
    provisionalFreeze.value.registrationCandidatePlacementCount === 354 &&
    provisionalFreeze.value.selectedPages.length === 354 &&
    provisionalFragment.value.calibration.freezeManifest ===
      PROVISIONAL_FREEZE &&
    provisionalFragment.value.calibration.entries.length === 354 &&
    exact(provisionalFragment.value.freeze, descriptor(provisionalFreeze)) &&
    exact(provisionalFreeze.value.inputs.predecessorFreeze,
      descriptor(predecessorFreeze)) &&
    predecessorFreeze.value.registrationCandidatePlacementCount === 342 &&
    predecessorFreeze.value.selectedPages.length === 342,
  'final354 provisional/fragment/predecessor boundary drifted');

  const familyHost = family.value.productHostCalibration;
  invariant(family.value.artifactType ===
      'g678-alg-l11-tranche1-family-calibration-v1' &&
    family.value.status ===
      'exact-12-alg-l11-intro-terminal-simple-glossary-product-host-calibrated' &&
    exact(family.value.adapterFamilies, ADAPTER_FAMILIES) &&
    exact(family.value.authorizedPlacementIds, IDS) &&
    family.value.auditedPlacementCount === 12 &&
    family.value.blockedPlacementCount === 0 &&
    family.value.focusedBrowserScreenshotCount === 15 &&
    family.value.currentHostPredecessorSampleReplayCount === 92 &&
    family.value.aggregateCurrentHostLiveSampleRecordCount === 104 &&
    family.value.aggregateBrowserScreenshotCount === 111 &&
    familyHost.familyCurrentJsCalibrationPassed === true &&
    familyHost.currentHostBrowserRevalidated === true &&
    familyHost.overallG678ProductCalibrationPassed === false &&
    exact(family.value.inputs.registrationFreeze,
      descriptor(provisionalFreeze)) &&
    exact(family.value.inputs.registrationFragment,
      descriptor(provisionalFragment)) &&
    exact(family.value.inputs.focusedBrowser, descriptor(focusedBrowser)) &&
    exact(family.value.inputs.aggregateBrowser, descriptor(aggregateBrowser)) &&
    exact(family.value.inputs.successorCompatibilityAudit,
      descriptor(successorCompatibility)) && allFalse(family.value.acceptanceEffects),
  'final354 family authority drifted');
  invariant(focusedBrowser.value.artifactType ===
      'g678-alg-l11-tranche1-browser-qa-v1' &&
    focusedBrowser.value.registeredCurrentJsPages === 354 &&
    focusedBrowser.value.screenshots.length === 15 &&
    focusedBrowser.value.currentHostPredecessorReplay
      .currentHostPredecessorSampleReplayCount === 92 &&
    focusedBrowser.value.currentHostPredecessorReplay
      .historicalInitialProgressedReplayCount === 89 &&
    focusedBrowser.value.currentHostPredecessorReplay
      .historicalSpecialReadyCount === 3 &&
    focusedBrowser.value.successorBridgeCompatibility
      .currentHostBrowserRevalidated === true &&
    exact(focusedBrowser.value.inputs.freeze, descriptor(provisionalFreeze)) &&
    exact(focusedBrowser.value.inputs.successorCompatibilityAudit,
      descriptor(successorCompatibility)) &&
    allFalse(focusedBrowser.value.acceptanceEffects),
  'final354 focused browser authority drifted');
  invariant(aggregateBrowser.value.artifactType ===
      'g678-current-js-354-browser-qa-v1' &&
    aggregateBrowser.value.registeredCurrentJsPages === 354 &&
    aggregateBrowser.value.browserEvidenceComposition
      .currentHostLiveRecordCount === 104 &&
    aggregateBrowser.value.browserEvidenceComposition
      .currentHostPredecessorSampleReplayCount === 92 &&
    aggregateBrowser.value.browserEvidenceComposition
      .currentHostHistoricalInitialProgressedReplayCount === 89 &&
    aggregateBrowser.value.browserEvidenceComposition
      .currentHostHistoricalSpecialReadyCount === 3 &&
    aggregateBrowser.value.browserEvidenceComposition
      .totalScreenshotCount === 111 &&
    aggregateBrowser.value.browserEvidenceComposition
      .currentHostBrowserRevalidated === true &&
    aggregateBrowser.value.browserEvidenceComposition
      .fullHistoricalSpecialInteractionReplay === false &&
    exact(aggregateBrowser.value.inputs.incremental, descriptor(focusedBrowser)) &&
    exact(aggregateBrowser.value.inputs.successorCompatibility,
      descriptor(successorCompatibility)) &&
    allFalse(aggregateBrowser.value.acceptanceEffects),
  'final354 aggregate browser authority drifted');
  invariant(successorCompatibility.value.artifactType ===
      'g678-final342-current-bridge-successor-compatibility-v1' &&
    successorCompatibility.value.exactInverseTransformation.exactMatch === true &&
    successorCompatibility.value.exactInverseTransformation
      .otherBridgeChangesDetected === false &&
    successorCompatibility.value.exactInverseTransformation
      .otherDescriptorPlayerChangesDetected === false &&
    successorCompatibility.value.final342Compatibility
      .descriptorInvariantCount === 342 &&
    successorCompatibility.value.final342Compatibility
      .currentHostBrowserRevalidated === false &&
    successorCompatibility.value.requiredProvisional354BrowserAssertions
      .predecessorSamplesMustBeReplayed === true &&
    allFalse(successorCompatibility.value.acceptanceEffects),
  'final354 successor compatibility authority drifted');

  const predecessorById = new Map(predecessorFreeze.value.selectedPages.map(
    (page) => [page.animationId, page]));
  const provisionalById = new Map(provisionalFreeze.value.selectedPages.map(
    (page) => [page.animationId, page]));
  invariant(predecessorById.size === 342 && provisionalById.size === 354 &&
    [...predecessorById].every(([animationId, page]) =>
      exact(provisionalById.get(animationId), page)),
  'final354 provisional predecessor pages are not exact final342 members');

  const selectedPages = provisionalFreeze.value.selectedPages.map((page) =>
    ID_SET.has(page.animationId)
      ? calibrateAlgL11Tranche1Page(page, {aggregateBrowser, family,
          focusedBrowser, successorCompatibility})
      : rebindFinal342PageToCurrentHost(page, aggregateBrowser));
  const retainedPredecessorPages = selectedPages.filter((page) =>
    predecessorById.has(page.animationId));
  const predecessorWithoutBrowserEvidence = (page) => page.productHostCalibration
    ? {...page, productHostCalibration: {...page.productHostCalibration,
        browserEvidence: null}}
    : page;
  invariant(selectedPages.length === 354 &&
    retainedPredecessorPages.length === 342 &&
    retainedPredecessorPages.every((page) =>
      exact(predecessorWithoutBrowserEvidence(page),
        predecessorWithoutBrowserEvidence(
          predecessorById.get(page.animationId))) &&
      (!page.productHostCalibration ||
        exact(page.productHostCalibration.browserEvidence,
          descriptor(aggregateBrowser)))) &&
    exact(selectedPages.filter((page) => ID_SET.has(page.animationId))
      .map((page) => page.animationId), IDS) &&
    selectedPages.filter((page) => ID_SET.has(page.animationId)).every((page) =>
      page.implementation.familyVisualPlaybackCalibrationPassed === true &&
      page.productHostCalibration?.familyCurrentJsCalibrationPassed === true &&
      !page.productBlockers.includes(BROWSER_BLOCKER) &&
      page.productCalibrationPassed === false &&
      page.engineeringPreviewReady === false),
  'final354 selected page transformation drifted');

  const selectionAuthorities = new Map();
  for (const item of [
    ...predecessorFreeze.value.inputs.selectionAuthorities,
    ...provisionalFreeze.value.inputs.selectionAuthorities,
    descriptor(provisionalFreeze),
  ]) {
    const prior = selectionAuthorities.get(item.path);
    invariant(!prior || exact(prior, item),
      `final354 selection authority conflict: ${item.path}`);
    selectionAuthorities.set(item.path, item);
  }
  const freeze = {
    ...provisionalFreeze.value,
    status: 'private-current-js-product-host-calibrated-candidates-registered',
    inputs: {...provisionalFreeze.value.inputs,
      selectionAuthorities: [...selectionAuthorities.values()],
      provisionalFreeze: descriptor(provisionalFreeze),
      provisionalFragment: descriptor(provisionalFragment),
      focusedBrowserProductEvidence: descriptor(focusedBrowser),
      browserProductEvidence: descriptor(aggregateBrowser),
      successorCompatibilityAudit: descriptor(successorCompatibility),
      algL11Tranche1FamilyCalibration: descriptor(family),
      provisionalFinalizer: provisionalFreeze.value.inputs.finalizer,
      finalizer: descriptor(builder)},
    selectedPages,
    productHostCalibration: {
      familyCalibratedPlacementCount: 138,
      familyCalibrationCount: 22,
      algL11Tranche1FamilyCalibratedPlacementCount: 12,
      currentHostPredecessorReplayCount: 92,
      currentHostLiveSampleRecordCount: 104,
      browserSampleCount: 104,
      screenshotCount: 111,
      oneCompleteAnd43PartialRegistrationTruthful: true,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    },
    limitations: [
      '354 registered Current-JS pages make ALG L9 the only exact 41/41 local engineering preview; ALG L11 remains partial at 21/44 and the other 42 lessons are also partial.',
      'The exact twelve ALG L11 tranche1 pages passed current-host family and browser calibration; the predecessor 342 page semantics remain unchanged, with only their existing 126 product-host records rebound to the fresh current-host aggregate evidence.',
      'Three historical ALG L9 samples received fresh current-host ready-only smoke because the predecessor receipt contains no source-bound interaction targets; no full historical special-interaction replay is claimed.',
      'Audio listening, authoritative original runtime, visual fidelity, human, Owner, strict completion, release, and publication gates remain false.',
    ],
  };
  const freezeBytes = stableBytes(freeze);
  const fragment = {
    ...provisionalFragment.value,
    calibration: {...provisionalFragment.value.calibration,
      freezeManifest: OUTPUT_FREEZE},
    freeze: {path: OUTPUT_FREEZE, bytes: freezeBytes.length,
      sha256: sha256(freezeBytes)},
    descriptorProjection: {...provisionalFragment.value.descriptorProjection,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      engineeringPreviewReady: false},
    familyScaleout: {
      algL11Tranche1ProductHostCalibratedPlacements: 12,
      totalProductHostCalibratedPlacements: 138,
      familyCalibrationCount: 22,
      currentHostPredecessorReplayCount: 92,
      browserSampleCount: 104,
      screenshotCount: 111,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      browserProductCalibrationPassed: true,
      overallG678ProductCalibrationPassed: false,
    },
    registrationBoundary: {
      exactRegisteredPlacementCount: 354,
      exactPredecessorPlacementCountPreserved: 342,
      exactNewFamilyCalibratedPlacementCount: 12,
      algL11RegisteredPageCount: 21,
      algL11ActivePageCount: 44,
      wholeLessonEngineeringPreviewCount: 1,
      newWholeLessonEngineeringPreviewCount: 0,
      releaseOrPublicationAuthorized: false,
    },
    limitations: freeze.limitations,
  };
  return Object.freeze({freeze, fragment, freezeBytes,
    fragmentBytes: stableBytes(fragment)});
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

export async function finalizeG678AlgL11Tranche1FamilyRegistration(
  {check = false} = {},
) {
  const artifacts = await prepareG678AlgL11Tranche1FamilyRegistration();
  if (check) {
    const [freeze, fragment] = await Promise.all([
      binding(OUTPUT_FREEZE), binding(OUTPUT_FRAGMENT),
    ]);
    invariant(freeze.buffer.equals(artifacts.freezeBytes) &&
      fragment.buffer.equals(artifacts.fragmentBytes),
    'post-family final354 registration artifacts drifted');
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
  return Object.freeze({check, registrationCandidatePlacementCount: 354,
    productHostCalibratedPlacementCount: 138,
    frozenCalibrationPlacementCount: 2282, affectedLessonCount: 44,
    algL11RegisteredPageCount: 21, algL11ActivePageCount: 44,
    wholeLessonEngineeringPreviewCount: 1,
    newWholeLessonEngineeringPreviewCount: 0,
    productCalibrationPassed: false,
    freeze: {path: OUTPUT_FREEZE, bytes: artifacts.freezeBytes.length,
      sha256: sha256(artifacts.freezeBytes)},
    fragment: {path: OUTPUT_FRAGMENT, bytes: artifacts.fragmentBytes.length,
      sha256: sha256(artifacts.fragmentBytes)}});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: finalize-g678-alg-l11-tranche1-family-registration.mjs [--check]');
  finalizeG678AlgL11Tranche1FamilyRegistration({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
