/** Page-specific P012 semantics shared by the admission producer and reader.
 * Physical bytes and the host/registry transaction are checked by
 * g678-admission-proof.mjs; this module checks what those bytes claim. */
import assert from 'node:assert/strict';

export const P012_ADMISSION_ID = 'shared-alg001-l12-p012';
export const P012_ADMISSION_CALIBRATION = 'g678-alg-l12-p012-current-js-v1';
export const P012_ADMISSION_SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const ID = P012_ADMISSION_ID;
const WORK = `migrations/${ID}`;
const RUNTIME_PATH = `work/g678-shared-page-factory/${P012_ADMISSION_CALIBRATION}/members/${ID}/canvas-renderer.js`;
const SHA = /^[a-f0-9]{64}$/;
const pin = (path, bytes, sha256) => ({path, bytes, sha256});

export const P012_ADMISSION_SOURCE = Object.freeze(pin('G6-G8-shared/ALG001/L12/VB/L12VB07.swf', 81_069,
  'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa'));
export const P012_ADMISSION_XML = Object.freeze(pin('G6-G8-shared/ALG001/L12/index.xml', 11_927,
  '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'));
export const P012_ADMISSION_SA = Object.freeze(pin('G6-G8-shared/ALG001/L12/SA/L12VB07.mp3', 121_968,
  'c52ca31cb1cc70487fe91606453f4d19d1caa53fa441f86e406cb50ec672d448'));
export const P012_ADMISSION_RUNTIME = Object.freeze(pin(RUNTIME_PATH, 1_253_326,
  'eee27611df58685bad502c7ceb54eb745a0407cd7fbb93cadd93e326e95491f1'));
export const P012_ADMISSION_PREDECESSOR = Object.freeze({
  calibrationId: 'g678-alg-l12-p010-current-js-v1',
  freezeManifest: Object.freeze(pin('catalog/product-bridge-calibrations/g678-alg-l12-p010-current-js-v1.json', 62_935,
    '0dd2ee04a5f0ac7fd6c400dc97ba5dd8b007d4c3f3107f2bbaf09a3153c08dcb')),
  registeredAnimationCount: 22, pageCount: 52, glossaryCount: 44,
});
export const P012_ADMISSION_DIRECTIONS = Object.freeze([
  {button: 'MoveBtn1', path: 'Top1', axis: 'y', delta: 1, buttonCharacter: 80},
  {button: 'MoveBtn2', path: 'Top3', axis: 'y', delta: 3, buttonCharacter: 81},
  {button: 'MoveBtn3', path: 'Bottom1', axis: 'y', delta: -1, buttonCharacter: 82},
  {button: 'MoveBtn4', path: 'Bottom3', axis: 'y', delta: -3, buttonCharacter: 83},
  {button: 'MoveBtn5', path: 'Left1', axis: 'x', delta: -1, buttonCharacter: 84},
  {button: 'MoveBtn6', path: 'Left3', axis: 'x', delta: -3, buttonCharacter: 85},
  {button: 'MoveBtn7', path: 'Right1', axis: 'x', delta: 1, buttonCharacter: 78},
  {button: 'MoveBtn8', path: 'Right3', axis: 'x', delta: 3, buttonCharacter: 79},
]);
export const P012_ADMISSION_COACH = Object.freeze([
  {label: 'S1', firstFrame: 3, returnFrame: 16},
  {label: 'S2', firstFrame: 18, returnFrame: 27},
  {label: 'S3', firstFrame: 31, returnFrame: 36},
  {label: 'S4', firstFrame: 40, returnFrame: 54},
]);
export const P012_ADMISSION_ACCEPTANCE_KEYS = Object.freeze([
  'authoritativeOriginalRuntime', 'fidelityAccepted', 'audioAccepted',
  'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published',
]);

function demand(value, reason) {assert(value, `P012_ADMISSION_SEMANTICS: ${reason}`);}
function same(actual, expected, reason) {
  assert.deepStrictEqual(actual, expected, `P012_ADMISSION_SEMANTICS: ${reason}`);
}
function validPin(value, expectedPath) {
  demand(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === 'bytes,path,sha256' &&
    typeof value.path === 'string' && value.path === expectedPath &&
    Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.bytes <= 64 * 1024 * 1024 &&
    SHA.test(value.sha256), `valid ${expectedPath} pin`);
}
function contained(pins, expected) {
  demand(pins.some(item => item.path === expected.path && item.bytes === expected.bytes &&
    item.sha256 === expected.sha256), `frozen closure includes ${expected.path}`);
}

/** Accepts either a one-entry registry calibration fragment (producer) or the
 * flattened live local-only registration (server reader). Does not read files. */
export function validateP012AdmissionSemantics(packet, registration) {
  demand(packet && typeof packet === 'object' && !Array.isArray(packet), 'packet object');
  demand(packet.schemaVersion === 1 && packet.calibrationId === P012_ADMISSION_CALIBRATION &&
    packet.sourceRoot === P012_ADMISSION_SOURCE_ROOT && packet.scope === 'private-engineering' &&
    packet.deploymentScope === 'local-only', 'page identity and local scope');
  same(packet.predecessor, P012_ADMISSION_PREDECESSOR, 'P010 predecessor');
  same(packet.source, P012_ADMISSION_SOURCE, 'exact SWF source');
  same(packet.sourceXml, P012_ADMISSION_XML, 'exact lesson XML');
  same(packet.optionalSpanishAudio, {
    source: P012_ADMISSION_SA, automaticLocalePlayback: false,
    spokenLanguageVerified: false, listeningAccepted: false,
  }, 'sidecar custody is not language or listening acceptance');

  demand(Array.isArray(packet.selectedPages) && packet.selectedPages.length === 1, 'one selected page');
  const page = packet.selectedPages[0], runtime = page?.runtime;
  same({animationId: page.animationId, placementId: page.placementId, assetId: page.assetId,
    stableLessonKey: page.stableLessonKey, sourceSha256: page.sourceSha256,
    moduleCode: page.moduleCode, lessonNumber: page.lessonNumber,
    globalPageOrdinal: page.globalPageOrdinal, sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal, complexityLane: page.complexityLane},
  {animationId: ID, placementId: ID, assetId: `swf-${P012_ADMISSION_SOURCE.sha256}`,
    stableLessonKey: 'shared-alg001-l12', sourceSha256: P012_ADMISSION_SOURCE.sha256,
    moduleCode: 'ALG001', lessonNumber: 12, globalPageOrdinal: 12,
    sectionCode: 'VB', sectionPageOrdinal: 6, complexityLane: 'behavior-heavy'},
  'exact twelfth active VB6 placement');
  demand(runtime && typeof runtime === 'object', 'runtime');
  same({stage: runtime.stage, rootFrameCount: runtime.rootFrameCount,
    rootBeginFrame: runtime.rootBeginFrame, frameDomain: runtime.frameDomain,
    frameCount: runtime.frameCount, livePlaybackEndFrame: runtime.livePlaybackEndFrame,
    fps: runtime.fps, language: runtime.language, scenario: runtime.scenario,
    seed: runtime.seed, renderScale: runtime.renderScale, canvas: runtime.canvas},
  {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
    frameDomain: 'sprite-86', frameCount: 119, livePlaybackEndFrame: 119,
    fps: 12, language: 'fixed-en', scenario: 'ordered-pairs-interaction',
    seed: '0', renderScale: 2, canvas: {width: 1600, height: 1200}},
  'stopped interaction domain and 2x runtime');
  same(runtime.canvasRenderer, {...P012_ADMISSION_RUNTIME,
    url: `/flash-assets/g678-local/${ID}/typography.js?sha256=${P012_ADMISSION_RUNTIME.sha256}`},
  'exact prepared browser runtime');
  same(page.runtimeEvidenceBoundary, {
    runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
    actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
    audioAcceptance: 'not-established',
    replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
    productBehavior: 'maintained-javascript-state-machine-implemented',
    productVisualBehaviorComposite: 'not-established',
  }, 'qualified runtime evidence boundary');

  const entry = packet.entry, artifacts = entry?.artifacts;
  demand(entry?.key === ID && entry.module === `./modules/${ID}` &&
    entry.maturity === 'private-current-js' && entry.complexityLane === 'behavior-heavy' &&
    artifacts && Object.keys(artifacts).sort().join(',') === 'module,runtime,timeline',
  'one canonical source-native runtime registration, no DOM-kind substitution');
  validPin(artifacts.module, `packages/demos/src/modules/${ID}.tsx`);
  validPin(artifacts.timeline, `packages/demos/src/timelines/${ID}.ts`);
  same(artifacts.runtime, P012_ADMISSION_RUNTIME, 'registered exact runtime');

  const interaction = packet.interaction;
  validPin(interaction?.stateMachine, 'packages/demos/src/alg-l12-p012-state.ts');
  same(interaction.directions, P012_ADMISSION_DIRECTIONS, 'all eight source press/release directions');
  same(interaction.coachBranches, P012_ADMISSION_COACH, 'four source coach branches');
  same({coordinateLimit: interaction.coordinateLimit,
    pixelsPerCoordinate: interaction.pixelsPerCoordinate,
    pixelsPerTick: interaction.pixelsPerTick,
    popupClosePolicy: interaction.popupClosePolicy,
    unresolvedSourceCalls: interaction.unresolvedSourceCalls,
    rotationNormalizationAccepted: interaction.rotationNormalizationAccepted},
  {coordinateLimit: 10, pixelsPerCoordinate: 14, pixelsPerTick: 2,
    popupClosePolicy: 'explicit-modern-cancel', unresolvedSourceCalls: ['enableButton'],
    rotationNormalizationAccepted: false}, 'bounded movement and qualified source behavior');

  const audio = packet.audio;
  same(audio?.main, pin(`${WORK}/audio-source-v1/main-sprite-86.mp3`, 37_180,
    '6aaddb1bfc319127e85b94dcfce407765eeb3f0275f42830bdeaff4aaa4cb21a'), 'main source audio');
  same(audio.coach, pin(`${WORK}/audio-source-v1/coach-sprite-76.mp3`, 21_840,
    'e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf'), 'coach source audio');
  validPin(audio.schedule, 'packages/demos/src/alg-l12-p012-audio-schedule.ts');
  same({sampleRate: audio.sampleRate, channels: audio.channels,
    mainDecodedSamples: audio.mainDecodedSamples, coachDecodedSamples: audio.coachDecodedSamples,
    mainTerminalFrame: audio.mainTerminalFrame, coachPolicy: audio.coachPolicy,
    synchronizationAccepted: audio.synchronizationAccepted,
    listeningAccepted: audio.listeningAccepted},
  {sampleRate: 22_050, channels: 1, mainDecodedSamples: 164_736,
    coachDecodedSamples: 96_768, mainTerminalFrame: 119,
    coachPolicy: 'explicit-rejection-branch', synchronizationAccepted: false,
    listeningAccepted: false}, 'source audio and unaccepted modern schedule');

  const visual = packet.visual;
  same(visual?.graphics, pin(`${WORK}/graphics-source-v1/source-drawings.js`, 1_236_501,
    'ae25f758635bd24bc2c8c4ae877a57da2be5671d04c02d102491bf56a6d346e9'), 'source drawing bundle');
  same(visual.typography, pin(`${WORK}/typography-v1/renderer.js`, 1_253_326,
    P012_ADMISSION_RUNTIME.sha256), 'native typography bundle');
  same(visual.typographyMetadata, pin(`${WORK}/typography-v1/runtime-meta.json`, 3_648,
    '4a782fda378251825149f30323e51e0adf379eb74f845de47630f14d69d3a17a'), 'native typography metadata');
  same(packet.glossary, {sourceKeyAttribute: 'Coordinate', sourceButtonId: 53,
    existingEntryOnly: true, closePolicy: 'stay-paused'}, 'one existing Coordinate glossary term');
  demand(packet.integrity && Array.isArray(packet.integrity.files) && packet.integrity.files.length > 0,
    'frozen internal file closure');
  const files = packet.integrity.files;
  demand(new Set(files.map(item => item.path)).size === files.length &&
    files.every(item => item && typeof item.path === 'string' &&
      !item.path.startsWith('/') && !item.path.split('/').includes('..') &&
      Number.isSafeInteger(item.bytes) && item.bytes >= 0 && SHA.test(item.sha256)),
  'unique bounded internal pins');
  for (const expected of [artifacts.module, artifacts.timeline, interaction.stateMachine,
    audio.main, audio.coach, audio.schedule, visual.graphics, visual.typography,
    visual.typographyMetadata]) contained(files, expected);
  demand(!files.some(item => item.path === RUNTIME_PATH ||
    item.path === 'packages/demos/private-current-js-registry.json' ||
    item.path.startsWith('packages/demos/src/registry.local-only.') ||
    item.path === `catalog/product-bridge-calibrations/${P012_ADMISSION_CALIBRATION}.json`),
  'no cyclic registry, prepared runtime, or freeze input');
  same(Object.keys(packet.acceptanceEffects ?? {}).sort(),
    [...P012_ADMISSION_ACCEPTANCE_KEYS].sort(), 'all independent acceptance keys');
  demand(Object.values(packet.acceptanceEffects).every(value => value === false) &&
    packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false,
  'no independent acceptance or scale-out promotion');

  if (packet.freezeManifest !== undefined) {
    validPin(packet.freezeManifest, `catalog/product-bridge-calibrations/${P012_ADMISSION_CALIBRATION}.json`);
  }
  demand(registration && registration.calibrationId === P012_ADMISSION_CALIBRATION &&
    registration.deploymentScope === 'local-only', 'exact registration scope');
  if (Array.isArray(registration.entries)) {
    demand(registration.entries.length === 1, 'one registration entry');
    same(registration.entries[0], entry, 'fragment entry equals frozen entry');
    demand(registration.freezeManifest === `catalog/product-bridge-calibrations/${P012_ADMISSION_CALIBRATION}.json` &&
      Number.isSafeInteger(registration.freezeManifestBytes) &&
      SHA.test(registration.freezeManifestSha256), 'fragment freeze identity');
  } else {
    demand(registration.maturity === 'private-current-js' &&
      registration.scope === 'private-engineering' &&
      registration.moduleSha256 === artifacts.module.sha256 &&
      registration.timelineSha256 === artifacts.timeline.sha256 &&
      registration.runtimeSha256 === artifacts.runtime.sha256 &&
      SHA.test(registration.freezeManifestSha256), 'live exact module/timeline/runtime registration');
  }
  if (packet.freezeManifest !== undefined) demand(packet.freezeManifest.sha256 === registration.freezeManifestSha256 &&
    packet.freezeManifest.bytes === (registration.freezeManifestBytes ?? packet.freezeManifest.bytes),
  'registered frozen packet identity');
  return true;
}
