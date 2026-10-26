#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {copyFile, lstat, readFile, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const OUTPUT =
  'catalog/g678-final342-current-bridge-successor-compatibility-v1.json';
const BRIDGE = 'apps/web/lib/g678-calibration-product-bridge.server.ts';
const BRIDGE_TEST =
  'apps/web/tests/g678-calibration-product-bridge.server-test.ts';
const DESCRIPTOR_PLAYER =
  'apps/web/components/descriptor-driven-whole-lesson-player.tsx';
const GLOSSARY_PAUSE_HELPER =
  'apps/web/lib/descriptor-driven-glossary-pause.ts';
const DESCRIPTOR_PLAYER_TEST =
  'apps/web/tests/descriptor-driven-whole-lesson-player.test.ts';
const GLOSSARY_PAUSE_HELPER_TEST =
  'apps/web/tests/descriptor-driven-glossary-pause.test.ts';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const FINAL342 =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const AGGREGATE_BROWSER =
  'output/playwright/g678-current-js-342-v1/evidence.json';
const FOCUSED_BROWSER =
  'output/playwright/g678-alg-l09-game-assessment-342-v1/evidence.json';
const EXPECTED_OLD_BRIDGE = Object.freeze({
  bytes: 146389,
  sha256: 'dcde1345c14742265165c683b4990fe0a4955d125d0ddd4df214f80caed464df',
});
const EXPECTED_OLD_DESCRIPTOR_PLAYER = Object.freeze({
  bytes: 47564,
  sha256: '531a6af5504f7b7dbdf9ced742a730ad270308c7595efd68a66710cc31ab2b06',
});
const ENTITY_DECODINGS = Object.freeze({
  '&#x003C;': '<',
  '&#x00B0;': '°',
  '&#x00B3;': '³',
  '&#x2260;': '≠',
  '&#x2264;': '≤',
  '&#x2265;': '≥',
  '&gt;': '>',
  '&quot;': '"',
});
const ENTITY_PATTERN = /&(?:#\d+|#x[a-f0-9]+|[a-z]+);/giu;

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
    ...(json ? {value: JSON.parse(bytes.toString('utf8'))} : {})});
}

function descriptor(value) {
  return Object.freeze({path: value.path, bytes: value.bytes,
    sha256: value.sha256});
}

function replaceOnce(source, before, after, label) {
  invariant(source.split(before).length === 2,
    `current bridge ${label} transformation is not exact`);
  return source.replace(before, after);
}

function replaceExactCount(source, before, after, expectedCount, label) {
  const count = source.split(before).length - 1;
  invariant(count === expectedCount,
    `current descriptor player ${label} transformation is not exact`);
  return source.split(before).join(after);
}

export function reconstructFinal342ProductBridge(currentSource) {
  let source = currentSource;
  source = replaceOnce(source,
    "export const G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH =\n  'catalog/product-bridge-calibrations/g678-current-js-354-page-registration-v1.json';\n",
    '', 'provisional354 constant');
  source = replaceOnce(source,
    "    : process.env.HELP_MATH_G678_CALIBRATION_PHASE ===\n      'alg-l11-tranche1-provisional-browser-qa'\n      ? G678_ALG_L11_TRANCHE1_PROVISIONAL_CALIBRATION_FREEZE_PATH\n",
    '', 'provisional354 phase');
  source = replaceOnce(source,
    "const UNDECODED_MATH_ENTITY =\n  /&(?:#\\d+|#x[a-f0-9]+|lt|gt|le|ge|ne);/iu;\n",
    '', 'ALG L11 authority entity guard');
  const decoderStart = source.indexOf(
    'export function decodeG678GlossaryXmlText');
  const decoderEnd = source.indexOf('function positiveInteger', decoderStart);
  invariant(decoderStart >= 0 && decoderEnd > decoderStart,
    'current bridge exact glossary decoder block is absent');
  source = source.slice(0, decoderStart) + source.slice(decoderEnd);
  source = replaceOnce(source,
    "          decodeG678GlossaryXmlText(labels.en) &&\n          decodeG678GlossaryXmlText(labels.es) &&\n          decodeG678GlossaryXmlText(definitions.en) &&\n          decodeG678GlossaryXmlText(definitions.es) &&",
    "          text(labels.en) && text(labels.es) &&\n          text(definitions.en) && text(definitions.es) &&",
    'glossary validation projection');
  source = replaceOnce(source,
    "        labels: Object.freeze({\n          en: String(decodeG678GlossaryXmlText(labels.en)),\n          es: String(decodeG678GlossaryXmlText(labels.es)),\n        }),\n        definitions: Object.freeze({\n          en: String(decodeG678GlossaryXmlText(definitions.en)),\n          es: String(decodeG678GlossaryXmlText(definitions.es)),\n        }),",
    "        labels: Object.freeze({en: String(labels.en), es: String(labels.es)}),\n        definitions: Object.freeze({\n          en: String(definitions.en),\n          es: String(definitions.es),\n        }),",
    'glossary text decode');
  source = replaceOnce(source,
    "    const companionTargetIdSuffix = text(record(selected?.presentation)\n      .pageInteractionCompanionTargetIdSuffix);\n    const algL11TrancheGlossary = selected && [\n      'alg-l11-intro-terminal-tranche1-source-static',\n      'alg-l11-simple-glossary-tranche1-source-static',\n    ].includes(String(selected.adapterFamily)) &&\n      animationId !== 'shared-alg001-l11-p001';\n    invariant((!algL11TrancheGlossary && !companionTargetIdSuffix) ||\n      (algL11TrancheGlossary && companionTargetIdSuffix ===\n        `alg-l11-${animationId.slice(-4)}-glossary-controls`),\n    'G678_CALIBRATION_COMPANION_PRESENTATION_INVALID');\n",
    '', 'ALG L11 companion presentation validation');
  source = replaceOnce(source,
    "      ...(companionTargetIdSuffix ? {\n        presentation: Object.freeze({\n          pageInteractionCompanionTargetIdSuffix: companionTargetIdSuffix,\n        }),\n      } : {}),\n",
    '', 'ALG L11 companion presentation projection');
  const authorityStart = source.indexOf(
    "    } else if (root.artifactType ===\n      'g678-alg-l11-residual-routing-audit-v1')");
  const authorityEnd = source.indexOf(
    '    } else if (root.calibrationId === G678_CALIBRATION_ID &&',
    authorityStart);
  invariant(authorityStart >= 0 && authorityEnd > authorityStart,
    'current bridge exact ALG L11 authority block is absent');
  return source.slice(0, authorityStart) + source.slice(authorityEnd);
}

export function reconstructFinal342DescriptorPlayer(currentSource) {
  let source = currentSource;
  source = replaceOnce(source,
    "import {\n  resetDescriptorGlossaryPause,\n  transitionDescriptorGlossaryPause,\n  type DescriptorGlossaryPauseSession,\n} from '@/lib/descriptor-driven-glossary-pause';\n",
    '', 'glossary pause helper import');
  source = replaceOnce(source,
    "  const glossaryPauseSessionRef =\n    useRef<DescriptorGlossaryPauseSession<AnimationRuntimeSeekRequest> | null>(\n      null,\n    );\n",
    '', 'glossary pause snapshot ref');
  source = replaceOnce(source,
    "  const resetGlossaryPause = useCallback(() => {\n    const reset =\n      resetDescriptorGlossaryPause<AnimationRuntimeSeekRequest>();\n    glossaryPauseSessionRef.current = reset.session;\n    setPaused(reset.paused);\n    setSeekRequest(reset.seekRequest);\n  }, []);\n",
    '', 'glossary pause reset callback');
  source = replaceOnce(source,
    "      if (request.type === 'open-glossary' ||\n          request.type === 'close-glossary') {\n        const glossaryPause = transitionDescriptorGlossaryPause({\n          allowed: true,\n          pageSessionId: currentPageSessionId,\n          paused,\n          requestType: request.type,\n          seekRequest,\n          session: glossaryPauseSessionRef.current,\n        });\n        glossaryPauseSessionRef.current = glossaryPause.session;\n        setPaused(glossaryPause.paused);\n        setSeekRequest(glossaryPause.seekRequest);\n      }\n",
    "      if (request.type === 'open-glossary') setPaused(true);\n      if (request.type === 'close-glossary') setPaused(false);\n",
    'glossary open-close transition');
  source = replaceOnce(source,
    "  }, [currentPageSessionId, descriptor, lessonHost, paused,\n    resetGlossaryPause, seekRequest]);\n",
    "  }, [currentPageSessionId, descriptor, lessonHost]);\n",
    'glossary hook dependencies');
  source = replaceExactCount(source,
    "        resetGlossaryPause();\n        setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);\n        setNarrationRequest(null);\n",
    "        setPaused(false);\n        setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);\n        setSeekRequest(null);\n        setNarrationRequest(null);\n",
    1, 'host-navigation reset');
  source = replaceExactCount(source,
    "    resetGlossaryPause();\n    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);\n    setNarrationRequest(null);\n",
    "    setPaused(false);\n    setPlaybackState(INITIAL_ANIMATION_RUNTIME_PLAYBACK_STATE);\n    setSeekRequest(null);\n    setNarrationRequest(null);\n",
    4, 'navigation-replay reset');
  return source;
}

function decodeObservedEntityText(value) {
  return value.replace(ENTITY_PATTERN, (entity) => {
    const decoded = ENTITY_DECODINGS[entity];
    invariant(decoded !== undefined,
      `unreviewed glossary entity in final342: ${entity}`);
    return decoded;
  });
}

function glossaryProjection(page) {
  return (page.glossaryEntries ?? []).map((entry) => Object.freeze({
    id: entry.id,
    sourceKeyAttribute: entry.sourceKeyAttribute,
    labels: Object.freeze({en: decodeObservedEntityText(entry.labels.en),
      es: decodeObservedEntityText(entry.labels.es)}),
    definitions: Object.freeze({
      en: decodeObservedEntityText(entry.definitions.en),
      es: decodeObservedEntityText(entry.definitions.es),
    }),
    source: entry.source,
  }));
}

function rawGlossaryProjection(page) {
  return (page.glossaryEntries ?? []).map((entry) => Object.freeze({
    id: entry.id,
    sourceKeyAttribute: entry.sourceKeyAttribute,
    labels: entry.labels,
    definitions: entry.definitions,
    source: entry.source,
  }));
}

function pageMap(catalog) {
  return new Map(catalog.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
}

function pageInvariants(final342, catalog) {
  const catalogPages = pageMap(catalog);
  const entityCounts = new Map();
  const records = final342.selectedPages.map((selected) => {
    const catalogEntry = catalogPages.get(selected.animationId);
    invariant(catalogEntry && selected.placementId === selected.animationId &&
      catalogEntry.page.placementId === selected.animationId &&
      selected.assetId === catalogEntry.page.assetId &&
      selected.sourceSha256 === catalogEntry.page.sourceSha256 &&
      selected.stableLessonKey === catalogEntry.lesson.stableLessonKey &&
      selected.moduleCode === catalogEntry.lesson.moduleCode &&
      selected.lessonNumber === catalogEntry.lesson.lessonNumber &&
      selected.globalPageOrdinal === catalogEntry.page.globalOrdinal &&
      selected.sectionCode === catalogEntry.page.sectionCode &&
      selected.sectionPageOrdinal === catalogEntry.page.sectionPageOrdinal &&
      selected.runtime?.canvasRenderer?.sha256 &&
      selected.runtime.canvasRenderer.url ===
        `/flash-assets/g678-local/${selected.animationId}/canvas-renderer.js`,
    `${selected.animationId}: final342 descriptor identity drifted`);
    const raw = stableBytes(rawGlossaryProjection(selected));
    for (const match of raw.toString('utf8').matchAll(ENTITY_PATTERN)) {
      entityCounts.set(match[0], (entityCounts.get(match[0]) ?? 0) + 1);
    }
    const projected = stableBytes(glossaryProjection(selected));
    return Object.freeze({
      animationId: selected.animationId,
      stableLessonKey: selected.stableLessonKey,
      globalPageOrdinal: selected.globalPageOrdinal,
      sourceSha256: selected.sourceSha256,
      runtimeSha256: selected.runtime.canvasRenderer.sha256,
      glossaryRawSha256: sha256(raw),
      glossaryCurrentProjectionSha256: sha256(projected),
      disposition: raw.equals(projected)
        ? 'descriptor-identity-preserved'
        : 'glossary-text-exact-observed-entity-decode-only',
    });
  });
  invariant(records.length === 342 &&
    new Set(records.map((record) => record.animationId)).size === 342,
  'final342 exact page invariant denominator drifted');
  const observedEntities = [...entityCounts].sort(([left], [right]) =>
    left.localeCompare(right)).map(([entity, count]) => ({entity, count}));
  invariant(exact(observedEntities, [
    {entity: '&#x003C;', count: 4},
    {entity: '&#x00B0;', count: 6},
    {entity: '&#x00B3;', count: 8},
    {entity: '&#x2260;', count: 4},
    {entity: '&#x2264;', count: 4},
    {entity: '&#x2265;', count: 4},
    {entity: '&gt;', count: 8},
    {entity: '&quot;', count: 2},
  ]), 'final342 exact glossary entity inventory drifted');
  return Object.freeze({records, observedEntities,
    changedGlossaryPageCount: records.filter((record) =>
      record.disposition !== 'descriptor-identity-preserved').length});
}

async function runServerTests() {
  const args = Object.freeze([
    '--conditions=react-server', '--import', 'tsx', '--test',
    'tests/g678-shared-course-catalog.server-test.ts',
    'tests/g678-calibration-product-bridge.server-test.ts',
    'tests/g678-local-runtime-asset.server-test.ts',
  ]);
  const child = spawn(process.execPath, args, {
    cwd: absolute('apps/web'),
    env: process.env,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  invariant(result.code === 0 && result.signal === null,
    `current G678 server tests failed: ${stderr.slice(-1000)}`);
  return Object.freeze({command: process.execPath,
    argv: args, workingDirectory: 'apps/web', exitCode: 0,
    browserStarted: false, httpRequestsIssued: false});
}

async function runDescriptorPlayerTests() {
  const args = Object.freeze([
    '--import', 'tsx', '--test',
    'tests/descriptor-driven-glossary-pause.test.ts',
    'tests/descriptor-driven-whole-lesson-player.test.ts',
  ]);
  const child = spawn(process.execPath, args, {
    cwd: absolute('apps/web'),
    env: process.env,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  invariant(result.code === 0 && result.signal === null,
    `current descriptor player tests failed: ${stderr.slice(-1000)}`);
  return Object.freeze({command: process.execPath,
    argv: args, workingDirectory: 'apps/web', exitCode: 0,
    browserStarted: false, httpRequestsIssued: false});
}

async function expectedArtifact() {
  const [bridge, bridgeTest, descriptorPlayer, glossaryPauseHelper,
    descriptorPlayerTest, glossaryPauseHelperTest, catalog, final342,
    aggregate, focused, builder, testFile] = await Promise.all([
      binding(BRIDGE), binding(BRIDGE_TEST), binding(DESCRIPTOR_PLAYER),
      binding(GLOSSARY_PAUSE_HELPER), binding(DESCRIPTOR_PLAYER_TEST),
      binding(GLOSSARY_PAUSE_HELPER_TEST), binding(CATALOG, true),
      binding(FINAL342, true), binding(AGGREGATE_BROWSER, true),
      binding(FOCUSED_BROWSER, true), binding(path.relative(ROOT, SCRIPT_PATH)),
      binding('scripts/audit-g678-final342-current-bridge-successor-compatibility.test.mjs'),
    ]);
  const reconstructedBridge = Buffer.from(reconstructFinal342ProductBridge(
    bridge.buffer.toString('utf8')));
  invariant(reconstructedBridge.length === EXPECTED_OLD_BRIDGE.bytes &&
    sha256(reconstructedBridge) === EXPECTED_OLD_BRIDGE.sha256,
  'current bridge has changes beyond the exact reviewed successor transformation');
  const reconstructedPlayer = Buffer.from(reconstructFinal342DescriptorPlayer(
    descriptorPlayer.buffer.toString('utf8')));
  invariant(reconstructedPlayer.length === EXPECTED_OLD_DESCRIPTOR_PLAYER.bytes &&
    sha256(reconstructedPlayer) === EXPECTED_OLD_DESCRIPTOR_PLAYER.sha256,
  'current descriptor player has changes beyond exact glossary pause preservation');
  invariant(focused.value.artifactType ===
      'g678-alg-l09-game-assessment-browser-qa-v1' &&
    focused.value.inputs.productBridge.bytes === EXPECTED_OLD_BRIDGE.bytes &&
    focused.value.inputs.productBridge.sha256 === EXPECTED_OLD_BRIDGE.sha256 &&
    focused.value.registeredCurrentJsPages === 342 &&
    focused.value.allLessons.registeredPageSum === 342 &&
    focused.value.allLessons.completeLessonKeys.length === 1 &&
    focused.value.allLessons.completeLessonKeys[0] === 'shared-alg001-l09',
  'focused final342 browser receipt binding drifted');
  invariant(aggregate.value.artifactType ===
      'g678-current-js-342-browser-qa-v1' &&
    exact(aggregate.value.inputs.incremental, descriptor(focused)) &&
    aggregate.value.registeredCurrentJsPages === 342 &&
    aggregate.value.allLessons.sharedCardCount === 44 &&
    aggregate.value.allLessons.linkedCardCount === 0 &&
    aggregate.value.allLessons.registeredPageSum === 342 &&
    aggregate.value.allLessons.exactLessonVector.length === 44 &&
    aggregate.value.allLessons.completeLessonKeys.length === 1 &&
    aggregate.value.allLessons.completeLessonKeys[0] === 'shared-alg001-l09' &&
    aggregate.value.samples.length === 92 &&
    aggregate.value.screenshots.length === 96,
  'aggregate final342 browser receipt binding drifted');
  invariant(final342.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    final342.value.registrationCandidatePlacementCount === 342 &&
    final342.value.selectedPages.length === 342 &&
    exact(final342.value.inputs.browserProductEvidence,
      descriptor(aggregate)) &&
    final342.value.productHostCalibration.familyCalibratedPlacementCount ===
      126 &&
    final342.value.productHostCalibration.familyCalibrationCount === 21 &&
    final342.value.productHostCalibration.browserSampleCount === 92 &&
    final342.value.productHostCalibration.screenshotCount === 96 &&
    final342.value.productHostCalibration.wholeLessonEngineeringPreviewCount ===
      1 &&
    final342.value.productHostCalibration.overallG678ProductCalibrationPassed ===
      false &&
    Object.values(final342.value.acceptanceEffects).every((value) =>
      value === false),
  'final342 product-host freeze boundary drifted');
  const invariants = pageInvariants(final342.value, catalog.value);
  const [serverTests, descriptorPlayerTests] = await Promise.all([
    runServerTests(), runDescriptorPlayerTests(),
  ]);
  return {
    schemaVersion: 1,
    artifactType:
      'g678-final342-current-bridge-successor-compatibility-v1',
    status:
      'exact-successor-transformation-and-static-compatibility-browser-revalidation-required',
    inputs: {
      currentBridge: descriptor(bridge),
      currentBridgeServerTest: descriptor(bridgeTest),
      currentDescriptorPlayer: descriptor(descriptorPlayer),
      currentGlossaryPauseHelper: descriptor(glossaryPauseHelper),
      currentDescriptorPlayerTest: descriptor(descriptorPlayerTest),
      currentGlossaryPauseHelperTest: descriptor(glossaryPauseHelperTest),
      sharedCatalog: descriptor(catalog),
      final342ProductCalibratedFreeze: descriptor(final342),
      final342AggregateBrowserEvidence: descriptor(aggregate),
      final342FocusedBrowserEvidence: descriptor(focused),
      builder: descriptor(builder),
      builderTest: descriptor(testFile),
    },
    exactInverseTransformation: {
      reconstructedBytes: reconstructedBridge.length,
      reconstructedSha256: sha256(reconstructedBridge),
      expectedFinal342Bridge: EXPECTED_OLD_BRIDGE,
      reconstructedDescriptorPlayerBytes: reconstructedPlayer.length,
      reconstructedDescriptorPlayerSha256: sha256(reconstructedPlayer),
      expectedFinal342DescriptorPlayer: EXPECTED_OLD_DESCRIPTOR_PLAYER,
      exactMatch: true,
      allowedSuccessorChanges: [
        'provisional354 phase and exact ALG L11 selection-authority validation',
        'exact observed eight-token glossary XML entity decoding with unknown entities rejected',
        'exact eleven-page source-bound ALG L11 glossary companion presentation targets',
        'descriptor glossary open-close preserves prior running or inspected pause state and seek identity',
      ],
      otherBridgeChangesDetected: false,
      otherDescriptorPlayerChangesDetected: false,
    },
    currentServerTests: serverTests,
    currentDescriptorPlayerTests: descriptorPlayerTests,
    final342Compatibility: {
      registeredPlacementCount: 342,
      descriptorInvariantCount: invariants.records.length,
      descriptorInvariants: invariants.records,
      changedGlossaryPageCount: invariants.changedGlossaryPageCount,
      observedGlossaryEntities: invariants.observedEntities,
      completeLessonKeys: ['shared-alg001-l09'],
      familyCalibratedPlacementCount: 126,
      priorBrowserEvidenceStatus: 'retained-historical-exact-old-bridge-evidence',
      currentBridgeStaticCompatibilityEstablished: true,
      currentHostBrowserRevalidated: false,
    },
    requiredProvisional354BrowserAssertions: {
      predecessorSamplesMustBeReplayed: true,
      exactOldGlossaryPlacements: [
        'shared-alg001-l11-p005', 'shared-alg001-l11-p012',
      ],
      exactNewTranchePlacements: [
        'shared-alg001-l11-p001', 'shared-alg001-l11-p002',
        'shared-alg001-l11-p003', 'shared-alg001-l11-p004',
        'shared-alg001-l11-p007', 'shared-alg001-l11-p013',
        'shared-alg001-l11-p016', 'shared-alg001-l11-p017',
        'shared-alg001-l11-p018', 'shared-alg001-l11-p022',
        'shared-alg001-l11-p023', 'shared-alg001-l11-p024',
      ],
      inequalityUnicodeRequired: ['<', '≥', '≤', '≠'],
      rawEntityTextForbidden: true,
      glossaryPauseTransitions: {
        runningOpenCloseResumes: true,
        inspectedOpenCloseRemainsPaused: true,
        inspectedSeekRequestIdentityPreserved: true,
        blockedAndNestedRequestsMustNotOverwriteSnapshot: true,
        navigationReplayAndResetMustClearSnapshot: true,
      },
      browserProductCalibrationPassed: false,
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      behaviorParityAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseEligible: false,
      published: false,
    },
  };
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

export async function auditG678Final342CurrentBridgeSuccessorCompatibility(
  {check = false} = {},
) {
  const expected = stableBytes(await expectedArtifact());
  if (check) {
    const current = await binding(OUTPUT);
    invariant(current.buffer.equals(expected),
      'final342 current-bridge successor compatibility artifact drifted');
  } else {
    await writeExclusive(OUTPUT, expected);
  }
  return Object.freeze({check, output: {path: OUTPUT, bytes: expected.length,
    sha256: sha256(expected)}, descriptorInvariantCount: 342,
    currentHostBrowserRevalidated: false,
    exactInverseTransformationPassed: true,
    acceptanceEffectsChanged: false});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-final342-current-bridge-successor-compatibility.mjs [--check]');
  auditG678Final342CurrentBridgeSuccessorCompatibility({
    check: args.includes('--check'),
  }).then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
