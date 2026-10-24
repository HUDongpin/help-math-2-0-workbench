import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L06_P003_ADMISSION_ID = 'shared-alg001-l06-p003';
export const ALG_L06_P003_ADMISSION_CALIBRATION = 'g678-alg-l06-p003-continuous-20260928-v1';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_SHA = 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766';
const XML_SHA = '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c';
const CANVAS_SHA = '87694adc7d08f6f95069deede781410ab912a24a44a6cfce0fc05a43118f205c';
const AUDIO_SHA = '91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111';
const RUNTIME_PATH = `work/g678-shared-page-factory/${ALG_L06_P003_ADMISSION_CALIBRATION}/members/${ALG_L06_P003_ADMISSION_ID}/canvas-renderer.js`;
const FREEZE_PATH = `catalog/product-bridge-calibrations/${ALG_L06_P003_ADMISSION_CALIBRATION}.json`;
const SOURCE_PATH = 'G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const XML_PATH = 'G6-G8-shared/ALG001/L6/index.xml';
const EXPECTED_PREDECESSOR_ORDINALS = Object.freeze([
  1, 2, 5, 6, 7, 9, 11, 12, 30, 36, 37, 39, 40, 51, 52, 53, 54, 55, 59,
]);
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;

/** The admission reader checks these bytes against the physical source and
 * freeze before calling this pure projection. These fields cannot be inferred
 * from the simulated continuous-v2 candidate descriptor. */
export interface AlgL06P003DescriptorPacketView {
  readonly calibrationId: string;
  readonly deploymentScope: 'local-only';
  readonly sourceRoot: string;
  readonly sourceXml: Pin;
  readonly source: Pin;
  readonly freezeManifest: Pin;
  readonly selectedPages: readonly [Readonly<{
    animationId: string;
    placementId: string;
    sourceSha256: string;
    globalPageOrdinal: number;
    sourceOccurrence: number;
    sectionCode: string;
    sectionPageOrdinal: number;
    runtime: Readonly<{
      frameDomain: string;
      frameCount: number;
      rootFrameCount: number;
      rootBeginFrame: number;
      fps: number;
      stage: Readonly<{width: number; height: number}>;
      scenario: string;
      seed: string;
      canvasRenderer: Pin;
      hostPlaybackCompletion: false;
    }>;
  }>];
  readonly continuousSource: Readonly<{
    audit: Pin;
    mp3: Pin;
    streamHeadCount: number;
    blockCount: number;
    sampleRate: number;
    decodedSamples: number;
    initialSeekSamples: number;
    firstAudioBlockFrame: number;
    twoRunPlayback: false;
    originalRuntimeAccepted: false;
    audioAccepted: false;
  }>;
  readonly entry: Readonly<{
    key: string;
    module: string;
    maturity: 'private-current-js';
    artifacts: Readonly<{module: Pin; timeline: Pin; runtime: Pin}>;
  }>;
  readonly acceptanceEffects: PageOnlyLessonPlayerDescriptor['productBridge']['acceptanceEffects'];
  readonly productCalibrationPassed: false;
  readonly scaleOutAuthorized: false;
}

/** Metadata projected from the real local-only registry row, not a candidate
 * registration object. The caller must first verify the registry transaction. */
export interface AlgL06P003RegistrationView {
  readonly calibrationId: string;
  readonly deploymentScope: 'local-only';
  readonly maturity: 'private-current-js';
  readonly freezeManifestSha256: string;
  readonly moduleSha256: string;
  readonly timelineSha256: string;
  readonly runtimeSha256: string;
}

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L06_P003_DESCRIPTOR_INVALID: ${reason}`);
}
function validPin(pin: Pin | undefined): boolean {
  return Boolean(pin && typeof pin.path === 'string' && Number.isSafeInteger(pin.bytes) &&
    pin.bytes > 0 && /^[a-f0-9]{64}$/u.test(pin.sha256));
}
const pageId = (ordinal: number) => `shared-alg001-l06-p${String(ordinal).padStart(3, '0')}`;

/** Exactly one source-ordered ALG001 L6 page becomes registered. All other
 * page objects and all independent acceptance gates remain the predecessor's. */
export function extendAlgL6P003Descriptor(
  base: PageOnlyLessonPlayerDescriptor,
  packet: AlgL06P003DescriptorPacketView,
  registration: AlgL06P003RegistrationView | undefined,
): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 6 &&
    base.course.activePageCount === 60 && base.course.expectedReleaseMemberCount === 60 &&
    base.course.courseShellCount === 0 && base.pages.length === 60 &&
    base.productBridge.pageOnlyDescriptorMemberCount === 60 &&
    base.productBridge.registeredAnimationCount === 19,
  'real 19/60 page-only predecessor');
  demand(base.source.sequenceAuthority === 'course-xml-occurrence' &&
    base.source.sourceXmlPath === XML_PATH && base.source.sourceXmlSha256 === XML_SHA,
  'source-ordered lesson XML');
  const selectedBefore = base.pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(selectedBefore.length === 19 &&
    JSON.stringify(selectedBefore) === JSON.stringify(base.productBridge.selectedAnimationIds) &&
    JSON.stringify(selectedBefore) ===
      JSON.stringify(EXPECTED_PREDECESSOR_ORDINALS.map(pageId)) &&
    base.pages[0].rendererAvailability.kind === 'registered' &&
    base.pages[1].rendererAvailability.kind === 'registered',
  'actual predecessor membership');
  for (const [index, page] of base.pages.entries()) {
    const id = pageId(index + 1);
    demand(page.animationId === id && page.placementId === id &&
      page.globalPageOrdinal === index + 1 && page.source.sourceOccurrence === index + 1 &&
      page.previousPlacementId === (index ? pageId(index) : null) &&
      page.nextPlacementId === (index < 59 ? pageId(index + 2) : null) &&
      page.previousAnimationId === (index ? pageId(index) : null) &&
      page.nextAnimationId === (index < 59 ? pageId(index + 2) : null),
    'all 60 source-ordered placements and links');
  }
  const old = base.pages[2];
  demand(old.rendererAvailability.kind === 'unavailable' &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 2 &&
    old.source.assetId === `swf-${SOURCE_SHA}`,
  'third RW source occurrence is unavailable');
  demand(packet.calibrationId === ALG_L06_P003_ADMISSION_CALIBRATION &&
    packet.deploymentScope === 'local-only' && packet.sourceRoot === SOURCE_ROOT &&
    packet.sourceXml.path === XML_PATH && packet.sourceXml.bytes === 13926 &&
    packet.sourceXml.sha256 === XML_SHA && packet.source.path === SOURCE_PATH &&
    packet.source.bytes === 1220637 && packet.source.sha256 === SOURCE_SHA,
  'exact physical-source identity');
  demand(validPin(packet.freezeManifest) && packet.freezeManifest.path === FREEZE_PATH,
  'bounded freeze identity');
  const selected = packet.selectedPages;
  demand(selected.length === 1, 'one selected page');
  const page = selected[0], runtime = page.runtime, artifacts = packet.entry.artifacts;
  demand(page.animationId === ALG_L06_P003_ADMISSION_ID &&
    page.placementId === ALG_L06_P003_ADMISSION_ID &&
    page.sourceSha256 === SOURCE_SHA && page.globalPageOrdinal === 3 &&
    page.sourceOccurrence === 3 && page.sectionCode === 'RW' &&
    page.sectionPageOrdinal === 2,
  'selected RW2 page identity');
  demand(runtime.frameDomain === 'sprite-154' && runtime.frameCount === 719 &&
    runtime.rootFrameCount === 10 && runtime.rootBeginFrame === 6 &&
    runtime.fps === 12 && runtime.stage.width === 800 && runtime.stage.height === 600 &&
    runtime.scenario === 'source-static-frame' && runtime.seed === '0' &&
    runtime.hostPlaybackCompletion === false,
  'continuous candidate frame domain without host completion');
  demand(packet.entry.key === ALG_L06_P003_ADMISSION_ID &&
    packet.entry.module === `./modules/${ALG_L06_P003_ADMISSION_ID}` &&
    packet.entry.maturity === 'private-current-js' &&
    validPin(artifacts.module) &&
    artifacts.module.path === `packages/demos/src/modules/${ALG_L06_P003_ADMISSION_ID}.tsx` &&
    validPin(artifacts.timeline) &&
    artifacts.timeline.path === `packages/demos/src/timelines/${ALG_L06_P003_ADMISSION_ID}.ts` &&
    validPin(artifacts.runtime) && artifacts.runtime.path === RUNTIME_PATH &&
    artifacts.runtime.bytes === 9063233 && artifacts.runtime.sha256 === CANVAS_SHA &&
    runtime.canvasRenderer.path === artifacts.runtime.path &&
    runtime.canvasRenderer.bytes === artifacts.runtime.bytes &&
    runtime.canvasRenderer.sha256 === artifacts.runtime.sha256,
  'canonical Canvas registration and selected runtime');
  const audio = packet.continuousSource;
  demand(audio.audit.path === 'output/alg-l06-p003-audio-alignment-20260928/continuous-v3.json' &&
    audio.audit.bytes === 320688 &&
    audio.audit.sha256 === 'd3b66115dc1aa6bc61e3d375f475052d646f4f52ea50e544fa9eff4be3b273af' &&
    audio.mp3.path === '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt/source-stream.mp3' &&
    audio.mp3.bytes === 263640 && audio.mp3.sha256 === AUDIO_SHA &&
    audio.streamHeadCount === 1 && audio.blockCount === 637 &&
    audio.sampleRate === 22050 && audio.decodedSamples === 1168128 &&
    audio.initialSeekSamples === 1673 && audio.firstAudioBlockFrame === 41 &&
    audio.twoRunPlayback === false && audio.originalRuntimeAccepted === false &&
    audio.audioAccepted === false,
  'one continuous source stream, never restored two-run playback');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    JSON.stringify(Object.keys(packet.acceptanceEffects).sort()) ===
      JSON.stringify(['authoritativeOriginalRuntime', 'fidelityAccepted', 'audioAccepted',
        'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published'].sort()) &&
    Object.values(packet.acceptanceEffects).every(value => value === false) &&
    Object.values(base.productBridge.acceptanceEffects).every(value => value === false),
  'independent acceptance remains closed');
  demand(registration?.calibrationId === packet.calibrationId &&
    registration.deploymentScope === 'local-only' && registration.maturity === 'private-current-js' &&
    registration.freezeManifestSha256 === packet.freezeManifest.sha256 &&
    registration.moduleSha256 === artifacts.module.sha256 &&
    registration.timelineSha256 === artifacts.timeline.sha256 &&
    registration.runtimeSha256 === artifacts.runtime.sha256,
  'actual registry metadata must match frozen artifacts');
  const pages = base.pages.map((item, index): WholeLessonPlayerPage => index !== 2 ? item : Object.freeze({
    ...item,
    rendererAvailability: Object.freeze({kind: 'registered' as const,
      moduleKey: ALG_L06_P003_ADMISSION_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-154', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-static-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const,
      naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established' as const,
      productVisualBehaviorComposite: 'not-established' as const,
    }),
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'p003-source-readable'}),
  }));
  const selectedAfter = pages.filter(item => item.rendererAvailability.kind === 'registered')
    .map(item => item.animationId);
  demand(selectedAfter.length === 20 &&
    selectedAfter[2] === ALG_L06_P003_ADMISSION_ID &&
    new Set(selectedAfter).size === 20 &&
    JSON.stringify(selectedAfter.filter(id => id !== ALG_L06_P003_ADMISSION_ID)) ===
      JSON.stringify(selectedBefore),
  'one selected-page delta');
  return Object.freeze({...base,
    descriptorId: `${base.descriptorId}:${ALG_L06_P003_ADMISSION_CALIBRATION}`,
    calibrationId: ALG_L06_P003_ADMISSION_CALIBRATION,
    releaseId: ALG_L06_P003_ADMISSION_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L06_P003_ADMISSION_ID}/continuous-v2`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: packet.freezeManifest.path,
      candidateFreezeManifestSha256: packet.freezeManifest.sha256}),
    persistence: Object.freeze({...base.persistence,
      storageKey: `${base.persistence.storageKey}:${ALG_L06_P003_ADMISSION_CALIBRATION}`}),
    pages: Object.freeze(pages),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selectedAfter), registeredAnimationCount: 20}),
  });
}
