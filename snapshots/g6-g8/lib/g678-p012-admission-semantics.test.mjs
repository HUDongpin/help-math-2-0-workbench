import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P012_ADMISSION_ACCEPTANCE_KEYS, P012_ADMISSION_CALIBRATION,
  P012_ADMISSION_COACH, P012_ADMISSION_DIRECTIONS, P012_ADMISSION_ID,
  P012_ADMISSION_PREDECESSOR, P012_ADMISSION_RUNTIME, P012_ADMISSION_SA,
  P012_ADMISSION_SOURCE, P012_ADMISSION_SOURCE_ROOT, P012_ADMISSION_XML,
  validateP012AdmissionSemantics,
} from './g678-p012-admission-semantics.mjs';

const ID = P012_ADMISSION_ID;
const pin = (path, bytes, sha256 = 'a'.repeat(64)) => ({path, bytes, sha256});
function fixture() {
  const module = pin(`packages/demos/src/modules/${ID}.tsx`, 987);
  const timeline = pin(`packages/demos/src/timelines/${ID}.ts`, 456);
  const stateMachine = pin('packages/demos/src/alg-l12-p012-state.ts', 10_577);
  const schedule = pin('packages/demos/src/alg-l12-p012-audio-schedule.ts', 5_916);
  const main = pin(`migrations/${ID}/audio-source-v1/main-sprite-86.mp3`, 37_180,
    '6aaddb1bfc319127e85b94dcfce407765eeb3f0275f42830bdeaff4aaa4cb21a');
  const coach = pin(`migrations/${ID}/audio-source-v1/coach-sprite-76.mp3`, 21_840,
    'e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf');
  const graphics = pin(`migrations/${ID}/graphics-source-v1/source-drawings.js`, 1_236_501,
    'ae25f758635bd24bc2c8c4ae877a57da2be5671d04c02d102491bf56a6d346e9');
  const typography = pin(`migrations/${ID}/typography-v1/renderer.js`, 1_253_326,
    P012_ADMISSION_RUNTIME.sha256);
  const typographyMetadata = pin(`migrations/${ID}/typography-v1/runtime-meta.json`, 3_648,
    '4a782fda378251825149f30323e51e0adf379eb74f845de47630f14d69d3a17a');
  const entry = {key: ID, module: `./modules/${ID}`, maturity: 'private-current-js',
    complexityLane: 'behavior-heavy', artifacts: {module, timeline, runtime: P012_ADMISSION_RUNTIME}};
  const packet = {schemaVersion: 1, calibrationId: P012_ADMISSION_CALIBRATION,
    sourceRoot: P012_ADMISSION_SOURCE_ROOT, scope: 'private-engineering', deploymentScope: 'local-only',
    predecessor: P012_ADMISSION_PREDECESSOR,
    source: P012_ADMISSION_SOURCE, sourceXml: P012_ADMISSION_XML,
    optionalSpanishAudio: {source: P012_ADMISSION_SA, automaticLocalePlayback: false,
      spokenLanguageVerified: false, listeningAccepted: false},
    selectedPages: [{animationId: ID, placementId: ID,
      assetId: `swf-${P012_ADMISSION_SOURCE.sha256}`, stableLessonKey: 'shared-alg001-l12',
      sourceSha256: P012_ADMISSION_SOURCE.sha256, moduleCode: 'ALG001', lessonNumber: 12,
      globalPageOrdinal: 12, sectionCode: 'VB', sectionPageOrdinal: 6, complexityLane: 'behavior-heavy',
      runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6,
        frameDomain: 'sprite-86', frameCount: 119, livePlaybackEndFrame: 119, fps: 12,
        language: 'fixed-en', scenario: 'ordered-pairs-interaction', seed: '0', renderScale: 2,
        canvas: {width: 1600, height: 1200}, canvasRenderer: {...P012_ADMISSION_RUNTIME,
          url: `/flash-assets/g678-local/${ID}/typography.js?sha256=${P012_ADMISSION_RUNTIME.sha256}`}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
        actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
        audioAcceptance: 'not-established',
        replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
        productBehavior: 'maintained-javascript-state-machine-implemented',
        productVisualBehaviorComposite: 'not-established'}}],
    entry, interaction: {stateMachine, directions: P012_ADMISSION_DIRECTIONS,
      coachBranches: P012_ADMISSION_COACH, coordinateLimit: 10, pixelsPerCoordinate: 14,
      pixelsPerTick: 2, popupClosePolicy: 'explicit-modern-cancel',
      unresolvedSourceCalls: ['enableButton'], rotationNormalizationAccepted: false},
    audio: {main, coach, schedule, sampleRate: 22_050, channels: 1,
      mainDecodedSamples: 164_736, coachDecodedSamples: 96_768, mainTerminalFrame: 119,
      coachPolicy: 'explicit-rejection-branch', synchronizationAccepted: false,
      listeningAccepted: false},
    visual: {graphics, typography, typographyMetadata},
    glossary: {sourceKeyAttribute: 'Coordinate', sourceButtonId: 53,
      existingEntryOnly: true, closePolicy: 'stay-paused'},
    integrity: {files: [module, timeline, stateMachine, schedule, main, coach, graphics, typography, typographyMetadata]},
    acceptanceEffects: Object.fromEntries(P012_ADMISSION_ACCEPTANCE_KEYS.map(key => [key, false])),
    productCalibrationPassed: false, scaleOutAuthorized: false};
  const registration = {calibrationId: P012_ADMISSION_CALIBRATION, deploymentScope: 'local-only',
    freezeManifest: `catalog/product-bridge-calibrations/${P012_ADMISSION_CALIBRATION}.json`,
    freezeManifestBytes: 1234, freezeManifestSha256: 'b'.repeat(64), entries: [entry]};
  return {packet: structuredClone(packet), registration: structuredClone(registration)};
}

test('P012 producer fragment and flattened live registration accept the same exact page semantics', () => {
  const {packet, registration} = fixture();
  assert.equal(validateP012AdmissionSemantics(packet, registration), true);
  packet.freezeManifest = pin(registration.freezeManifest, registration.freezeManifestBytes,
    registration.freezeManifestSha256);
  const live = {calibrationId: registration.calibrationId, deploymentScope: 'local-only',
    scope: 'private-engineering', maturity: 'private-current-js',
    freezeManifestSha256: registration.freezeManifestSha256,
    moduleSha256: packet.entry.artifacts.module.sha256,
    timelineSha256: packet.entry.artifacts.timeline.sha256,
    runtimeSha256: packet.entry.artifacts.runtime.sha256};
  assert.equal(validateP012AdmissionSemantics(packet, live), true);
});

test('P012 rejects source, page, direction, coach, audio, glossary and acceptance drift', () => {
  const cases = [
    packet => {packet.source.sha256 = '0'.repeat(64);},
    packet => {packet.sourceXml.bytes++;},
    packet => {packet.optionalSpanishAudio.automaticLocalePlayback = true;},
    packet => {packet.selectedPages[0].globalPageOrdinal = 11;},
    packet => {packet.selectedPages[0].runtime.frameDomain = 'sprite-85';},
    packet => {packet.selectedPages[0].runtime.canvasRenderer.sha256 = '0'.repeat(64);},
    packet => {packet.interaction.directions[7].delta = -3;},
    packet => {packet.interaction.coachBranches[3].returnFrame = 55;},
    packet => {packet.interaction.rotationNormalizationAccepted = true;},
    packet => {packet.audio.mainDecodedSamples--;},
    packet => {packet.audio.listeningAccepted = true;},
    packet => {packet.visual.typography.sha256 = '0'.repeat(64);},
    packet => {packet.glossary.existingEntryOnly = false;},
    packet => {packet.acceptanceEffects.audioAccepted = true;},
    packet => {packet.integrity.files = packet.integrity.files.filter(item => item.path !== packet.audio.schedule.path);},
  ];
  for (const change of cases) {
    const {packet, registration} = fixture(); change(packet);
    assert.throws(() => validateP012AdmissionSemantics(packet, registration));
  }
});

test('P012 rejects a DOM-kind substitute, mismatched fragment and mismatched live registration', () => {
  const {packet, registration} = fixture();
  packet.entry.artifacts.kind = 'maintained-dom-module-v1';
  assert.throws(() => validateP012AdmissionSemantics(packet, registration));
  delete packet.entry.artifacts.kind;
  registration.entries[0].artifacts.module.sha256 = 'c'.repeat(64);
  assert.throws(() => validateP012AdmissionSemantics(packet, registration));
  const clean = fixture();
  const live = {calibrationId: P012_ADMISSION_CALIBRATION, deploymentScope: 'local-only',
    scope: 'private-engineering', maturity: 'private-current-js',
    freezeManifestSha256: 'b'.repeat(64),
    moduleSha256: 'c'.repeat(64), timelineSha256: clean.packet.entry.artifacts.timeline.sha256,
    runtimeSha256: P012_ADMISSION_RUNTIME.sha256};
  assert.throws(() => validateP012AdmissionSemantics(clean.packet, live));
});
