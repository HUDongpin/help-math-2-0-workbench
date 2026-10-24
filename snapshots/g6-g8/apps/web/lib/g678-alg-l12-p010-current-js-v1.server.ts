import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as exact} from 'node:util';
import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {P010_GLOSSARY_TERMS} from '../../../packages/demos/src/alg-l12-p010-glossary';
import {getWorkspaceRoot} from './catalog';
import {algL12P009CurrentJsDescriptor} from './g678-alg-l12-p009-current-js-v2.server';
import {supplementP010Glossary} from './g678-alg-l12-p010-glossary.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from
  './whole-lesson-player-descriptor';

export const ALG_L12_P010_CURRENT_JS_ID = 'shared-alg001-l12-p010';
export const ALG_L12_P010_CURRENT_JS_CALIBRATION = 'g678-alg-l12-p010-current-js-v1';
export const ALG_L12_P010_CURRENT_JS_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p010-current-js-v1.json',
});
const ID = ALG_L12_P010_CURRENT_JS_ID, CALIBRATION = ALG_L12_P010_CURRENT_JS_CALIBRATION;
const WORK = `migrations/${ID}`;
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = Object.freeze({path: 'G6-G8-shared/ALG001/L12/VB/L12VB05.swf', bytes: 183770,
  sha256: 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd'});
const SOURCE_XML = Object.freeze({path: 'G6-G8-shared/ALG001/L12/index.xml', bytes: 11927,
  sha256: '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325'});
const SPANISH_SOURCE = Object.freeze({path: 'G6-G8-shared/ALG001/L12/SA/L12VB05.mp3', bytes: 215376,
  sha256: '685174141928210d8190f02a778f28db993dfb3f8a7576852264e539ed8b4644'});
const SA_REPORT = Object.freeze({path: 'output/p010-sa-host-disposition-20260927-v1/SA_HOST_DISPOSITION_2026-09-27.md', bytes: 12811,
  sha256: '8fac333536efd5f164ed980083f8c056b6a7668a3a100f768371ed85b57d710d'});
const SA_ANALYSIS = Object.freeze({path: 'output/p010-browser-native-decode-20260927-v1/browser-native-result.json', bytes: 5102,
  sha256: 'f051dc2ba559b8ffb66b99025c2aa222bf32905848d1ac3a0db2ca87f9520ce8'});
const SA_RECEIPT = Object.freeze({path: 'output/p010-sa-host-disposition-20260927-v1/source-receipt.json', bytes: 17563,
  sha256: '52b7feebfe5382408a6a1c970e09028e368231025af60d9b9dde86448311a26c'});
const P009_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p009-current-js-v2.json', bytes: 64242,
  sha256: '249038ba1944983fdbb4ef24b570946223ff6d4a2bf394178e22382df9fa6c64'});
export const ALG_L12_P010_MUTABLE_INTEGRATION_PATHS = Object.freeze([
  'apps/web/lib/learning-lesson-availability.server.ts',
]);
const RUNTIME = Object.freeze({path: `${WORK}/typography-v1/canvas-renderer.js`, bytes: 6324535,
  sha256: '399967229775a6898473461b470901a6e1f416c96734795314b92773d5f98bdb'});
const REGISTERED_RUNTIME = Object.freeze({...RUNTIME,
  path: `work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`});
const CATALOG_CONTENT_SHA = '6e79191570fcb30d21907d3b541710a9bec4d85e5bc4a966d615e0d5e48d8942';
const LANGUAGE_POLICY = Object.freeze({en: 'source', es: 'source-fallback'});
const BINDING_PATH = `catalog/typography-v1/g678-page-bindings/${ID}.json`;
const CHECK_PATH = `catalog/typography-v1/g678-checks/${ID}.json`;
const CHECKS = ['sourceBinding', 'semanticText', 'mathSemantics', 'timingAndReplay',
  'teachingTextDisposition', 'hostIntegration', 'responsiveTypography', 'accessibility',
  'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability'] as const;
const RISKS = ['shape-text-unclassified', 'button-runtime-state-and-actions-not-interpreted',
  'actionscript-visibility-and-values-not-interpreted', 'mask-filter-blend-semantics-unresolved'] as const;
const ACCEPTANCE = ['authoritativeOriginalRuntime', 'fidelityAccepted', 'audioAccepted',
  'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published'] as const;
const SUPPLEMENTAL_KEYS = ['Geometric figures', 'Position', 'length', 'Width', 'Height'] as const;
export const ALG_L12_P010_NATIVE_INPUT_PATHS = Object.freeze([
  'packages/demos/src/alg-l12-p010-typography.ts',
  'packages/demos/src/alg-l12-p010-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p010-typography-asset.ts',
  'packages/demos/src/alg-l12-p010-typography.css',
  'packages/demos/src/generated/alg-l12-p010-text-data.ts',
  `${WORK}/typography-v1/canvas-renderer.js`, `${WORK}/typography-v1/runtime-meta.json`,
  `${WORK}/audit/source-text-catalog.json`, `${WORK}/audit/typography-source-inventory-v1.json`,
  `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`,
  'scripts/build-g678-alg-l12-p010-typography.mjs',
  'scripts/build-g678-alg-l12-p010-text-data.mjs', 'scripts/lib/swf-text-source-catalog.mjs',
]);
export const ALG_L12_P010_OPTIONAL_SA_INPUT_PATHS = Object.freeze([
  SA_REPORT.path, SA_ANALYSIS.path, SA_RECEIPT.path,
  'packages/demos/src/alg-l12-p010-spanish-audio.ts',
  'packages/demos/tests/alg-l12-p010-spanish-audio.test.ts',
  'apps/web/lib/g678-alg-l12-p010-spanish-audio.server.ts',
  'apps/web/tests/g678-alg-l12-p010-assets.server-test.ts',
  `apps/web/app/flash-assets/g678-local/${ID}/spanish-audio.mp3/route.ts`,
]);
export const ALG_L12_P010_ADMISSION_INPUT_PATHS = Object.freeze([...ALG_L12_P010_NATIVE_INPUT_PATHS,
  ...ALG_L12_P010_OPTIONAL_SA_INPUT_PATHS,
  `${WORK}/evidence/CURRENT_JS_IMPLEMENTATION_2026-09-27.md`,
  `packages/demos/src/modules/${ID}.tsx`, `packages/demos/src/timelines/${ID}.ts`,
  'packages/demos/src/alg-l12-p010-glossary.ts',
  'packages/demos/src/alg-l12-p010-audio-schedule.ts',
  'packages/demos/src/alg-l12-p010-embedded-audio.ts',
  'apps/web/components/g678-alg-l12-p010-host-lesson.tsx',
  'apps/web/lib/g678-alg-l12-p010-current-js-v1.server.ts',
  'apps/web/tests/g678-alg-l12-p010-current-js-v1.server-test.ts',
  'apps/web/lib/g678-current-js-p010-successor-v1.server.ts',
  'apps/web/lib/g678-alg-l12-p010-glossary.server.ts',
  'apps/web/lib/g678-alg-l12-p010-typography.server.ts',
  'apps/web/lib/g678-alg-l12-p010-source-audio.server.ts',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/source-audio.mp3/route.ts`,
  'catalog/typography-v1/g678-integration.json',
  'scripts/prepare-g678-alg-l12-p010-current-js-v1.mjs',
  'scripts/prepare-g678-alg-l12-p010-typography-binding.mts',
  'scripts/prepare-g678-alg-l12-p010-typography-binding.test.mts',
]);
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Registration = ReturnType<typeof localOnlyAnimationModuleRegistration> | undefined;
export type AlgL12P010CurrentJsPacket = Readonly<{
  schemaVersion: number; calibrationId: string; sourceRoot: string; scope: string; deploymentScope: string;
  predecessor: Readonly<{calibrationId: string; freezeManifest: Pin;
    registeredAnimationCount: number; pageCount: number; glossaryCount: number}>;
  source: Pin; sourceXml: Pin;
  selectedPages: readonly Readonly<{
    animationId: string; placementId: string; assetId: string; stableLessonKey: string;
    sourceSha256: string; moduleCode: string; lessonNumber: number; globalPageOrdinal: number;
    sectionCode: string; sectionPageOrdinal: number; complexityLane: string;
    runtime: Readonly<{stage: Readonly<{width: number; height: number}>; rootFrameCount: number;
      rootBeginFrame: number; frameDomain: string; frameCount: number; livePlaybackEndFrame: number;
      language: string; scenario: string; seed: string; fps: number; audioPlaybackEnabled: boolean;
      renderScale: number; canvas: Readonly<{width: number; height: number}>;
      canvasRenderer: Pin & Readonly<{url: string}>}>;
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
  }>[];
  entry: Readonly<{key: string; module: string; maturity: string; complexityLane: string;
    artifacts: Readonly<{module: Pin; timeline: Pin; runtime: Pin}>}>;
  nativeTypography: Readonly<{runtime: Pin; runtimeMetadata: Pin; sourceInventory: Pin;
    sourceDisposition: Pin; sourceCatalogContentSha256: string;
    languagePolicy: Readonly<Record<'en' | 'es', string>>;
    requiredBindingPath: string; requiredCheckPath: string; criticalFiles: readonly Pin[]}>;
  embeddedAudio: Readonly<{sourceMp3: Pin; sourceBlocks: Pin; analysis: Pin; scheduleVersion: string;
    sourceSampleRange: readonly number[]; timelineStartSample: number; timelineEndSample: number;
    visualTerminalSample: number; sourceTerminalStop: boolean; terminalPolicy: string}>;
  optionalSpanishAudio: Readonly<{source: Pin; disposition: Pin;
    sourceHostProof: Readonly<{report: Pin; analysis: Pin; receipt: Pin}>;
    implementation: Readonly<{controller: Pin; controllerTest: Pin; server: Pin; serverTest: Pin; route: Pin}>;
    intendedRole: string; automaticLocalePlayback: boolean; playbackPolicy: string; pauseRestartPolicy: string;
    mainPlaybackRetention: string; returnPolicy: string;
    nativeAudio: Readonly<{sampleRate: number; numberOfChannels: number; decodedSamples: number}>;
    originalHostParityAccepted: boolean; synchronizationAccepted: boolean;
    listeningAccepted: boolean; spokenLanguageVerified: boolean}>;
  glossary: Readonly<{sourceAudit: Pin; buttonCount: number; supplementalKeys: readonly string[]; expectedCount: number}>;
  integrity: Readonly<{files: readonly Pin[]; excludedMutableOutputs: readonly string[];
    mutableBoundaryPaths: readonly string[]}>;
  preparationState: Readonly<{status: string; activationPermitted: boolean; typographyImplementation: string}>;
  acceptanceEffects: Readonly<Record<string, boolean>>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}>;
export type ReviewedAlgL12P010CurrentJsPacket = AlgL12P010CurrentJsPacket & Readonly<{freezeManifest: Pin}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P010_CURRENT_JS_INVALID: ${reason}`);
}
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
function read(root: string, pin: Pin, allowEmpty = false) {
  demand(pin && typeof pin.path === 'string' && !path.isAbsolute(pin.path) && !pin.path.includes('\\') &&
    pin.path.split('/').every(part => part && part !== '.' && part !== '..') &&
    Number.isSafeInteger(pin.bytes) && pin.bytes >= (allowEmpty ? 0 : 1) && pin.bytes <= 32 * 1024 * 1024 &&
    /^[a-f0-9]{64}$/u.test(pin.sha256), 'bounded workspace-relative pin');
  const file = path.resolve(root, pin.path);
  demand(file.startsWith(`${root}${path.sep}`) && realpathSync(file) === file, 'physical bounded pin');
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && before.nlink === 1n && before.size === BigInt(pin.bytes), `ordinary pin: ${pin.path}`);
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    .every(key => before[key] === after[key]) && bytes.length === pin.bytes && hash(bytes) === pin.sha256,
  `current bytes: ${pin.path}`);
  return bytes;
}
function current(root: string, relative: string, limit: number) {
  const file = path.join(root, relative), before = lstatSync(file, {bigint: true});
  demand(realpathSync(file) === file && before.isFile() && before.nlink === 1n &&
    before.size > 0n && before.size <= BigInt(limit), 'bounded current record');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    .every(key => before[key] === after[key]) && before.size === BigInt(bytes.length), 'stable current record');
  return {bytes, pin: {path: relative, bytes: bytes.length, sha256: hash(bytes)}};
}
function validatePacket(packet: AlgL12P010CurrentJsPacket, registration: Registration) {
  demand(registration?.maturity === 'private-current-js' && registration.scope === 'private-engineering' &&
    registration.deploymentScope === 'local-only' && registration.calibrationId === CALIBRATION &&
    /^[a-f0-9]{64}$/u.test(registration.freezeManifestSha256 ?? ''), 'actual private module registration');
  const page = packet.selectedPages?.[0], runtime = page?.runtime;
  demand(packet.schemaVersion === 1 && packet.calibrationId === CALIBRATION &&
    packet.sourceRoot === SOURCE_ROOT && packet.scope === 'private-engineering' && packet.deploymentScope === 'local-only' &&
    exact(packet.source, SOURCE) && exact(packet.sourceXml, SOURCE_XML) &&
    packet.predecessor.calibrationId === 'g678-alg-l12-p009-current-js-v2' &&
    exact(packet.predecessor.freezeManifest, P009_FREEZE) &&
    packet.predecessor.registeredAnimationCount === 21 && packet.predecessor.pageCount === 52 &&
    packet.predecessor.glossaryCount === 39 && packet.selectedPages.length === 1 &&
    page?.animationId === ID && page.placementId === ID && page.assetId === `swf-${SOURCE.sha256}` &&
    page.sourceSha256 === SOURCE.sha256 && page.stableLessonKey === 'shared-alg001-l12' &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 && page.globalPageOrdinal === 10 &&
    page.sectionCode === 'VB' && page.sectionPageOrdinal === 4 && page.complexityLane === 'interactive-understood' &&
    runtime?.rootFrameCount === 10 && runtime.rootBeginFrame === 6 && runtime.frameDomain === 'sprite-96' &&
    runtime.frameCount === 465 && runtime.livePlaybackEndFrame === 465 && runtime.fps === 12 && runtime.language === 'fixed-en' &&
    runtime.scenario === 'source-static-frame' && runtime.seed === '0' && runtime.audioPlaybackEnabled === true &&
    runtime.renderScale === 2 && exact(runtime.stage, {width: 800, height: 600}) &&
    exact(runtime.canvas, {width: 1600, height: 1200}) &&
    exact(runtime.canvasRenderer, {...REGISTERED_RUNTIME, url: `/flash-assets/g678-local/${ID}/typography-renderer.js`}),
  'exact source placement, predecessor and native 2x runtime');
  demand(packet.entry.key === ID && packet.entry.module === `./modules/${ID}` &&
    packet.entry.maturity === 'private-current-js' && packet.entry.complexityLane === page.complexityLane &&
    packet.entry.artifacts.module.path === `packages/demos/src/modules/${ID}.tsx` &&
    packet.entry.artifacts.timeline.path === `packages/demos/src/timelines/${ID}.ts` &&
    exact(packet.entry.artifacts.runtime, REGISTERED_RUNTIME) &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === RUNTIME.sha256, 'actual module, timeline and runtime bindings');
  const native = packet.nativeTypography;
  demand(exact(native.runtime, RUNTIME) && native.sourceCatalogContentSha256 === CATALOG_CONTENT_SHA &&
    exact(native.languagePolicy, LANGUAGE_POLICY) && native.requiredBindingPath === BINDING_PATH &&
    native.requiredCheckPath === CHECK_PATH && native.runtimeMetadata.path === `${WORK}/typography-v1/runtime-meta.json` &&
    native.sourceInventory.path === `${WORK}/audit/typography-source-inventory-v1.json` &&
    native.sourceDisposition.path === `${WORK}/evidence/TYPOGRAPHY_SOURCE_INVENTORY_2026-09-27.md`,
  'source-bound native typography and live final pair paths');
  const audio = packet.embeddedAudio;
  demand(exact(audio.sourceMp3, {path: `${WORK}/audit/source-stream.mp3`, bytes: 189020,
    sha256: '2ab17de87e12c5f83c97ee15f95af50e5a9aa434977bfea970e60c087624482f'}) &&
    exact(audio.sourceBlocks, {path: `${WORK}/audit/source-stream-blocks.json`, bytes: 274267,
      sha256: '656ccb77ccea9737b88c946d4101a759c2441f93522cfd34c3d872fff8080d2e'}) &&
    exact(audio.analysis, SA_ANALYSIS) &&
    audio.scheduleVersion === 'full-native-buffer-modern-full-frame-terminal' &&
    exact(audio.sourceSampleRange, [0, 837504]) && audio.timelineStartSample === 16537.5 &&
    audio.timelineEndSample === 854041.5 && audio.visualTerminalSample === 854437.5 &&
    audio.sourceTerminalStop === false && audio.terminalPolicy === 'modern-hold-last-authored-frame-through-full-frame-span',
  'exact extracted audio and qualified modern terminal schedule');
  const sa = packet.optionalSpanishAudio;
  demand(sa && exact(sa.source, SPANISH_SOURCE) && exact(sa.disposition, SA_REPORT) &&
    exact(sa.sourceHostProof, {report: SA_REPORT, analysis: SA_ANALYSIS, receipt: SA_RECEIPT}) &&
    exact(Object.keys(sa.implementation).sort(), ['controller', 'controllerTest', 'server', 'serverTest', 'route'].sort()) &&
    sa.implementation.controller.path === 'packages/demos/src/alg-l12-p010-spanish-audio.ts' &&
    sa.implementation.controllerTest.path === 'packages/demos/tests/alg-l12-p010-spanish-audio.test.ts' &&
    sa.implementation.server.path === 'apps/web/lib/g678-alg-l12-p010-spanish-audio.server.ts' &&
    sa.implementation.serverTest.path === 'apps/web/tests/g678-alg-l12-p010-assets.server-test.ts' &&
    sa.implementation.route.path === `apps/web/app/flash-assets/g678-local/${ID}/spanish-audio.mp3/route.ts` &&
    sa.intendedRole === 'explicit-spanish-audio-control' && sa.automaticLocalePlayback === false &&
    sa.playbackPolicy === 'explicit-only-separate-start-from-zero' && sa.pauseRestartPolicy === 'restart-at-zero' &&
    sa.mainPlaybackRetention === 'pause-and-retain-nonterminal-position' &&
    sa.returnPolicy === 'retained-main-position; modern465terminal-no-auto-replay' &&
    exact(sa.nativeAudio, {sampleRate: 48000, numberOfChannels: 1, decodedSamples: 738432}) &&
    [sa.originalHostParityAccepted, sa.synchronizationAccepted, sa.listeningAccepted, sa.spokenLanguageVerified]
      .every(value => value === false), 'explicit separate optional SA and independent pending acceptance');
  demand(exact(packet.glossary.sourceAudit, {path: `${WORK}/audit/source-keyterms.json`, bytes: 27860,
    sha256: '9f524c88c59e9a3ce3a1e39e5461bb4b3c9c5b93e13c0d03daa60c2baeb41c07'}) &&
    packet.glossary.buttonCount === 10 && exact(packet.glossary.supplementalKeys, SUPPLEMENTAL_KEYS) &&
    packet.glossary.expectedCount === 44 && packet.preparationState.status === 'admission-reviewed' &&
    packet.preparationState.activationPermitted === true &&
    packet.preparationState.typographyImplementation === 'source-bound-implemented' &&
    exact(Object.keys(packet.acceptanceEffects).sort(), [...ACCEPTANCE].sort()) &&
    Object.values(packet.acceptanceEffects).every(value => value === false) &&
    packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    exact(page.runtimeEvidenceBoundary, {runtimeKind: 'source-static-current-js-candidate',
      actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
      audioAcceptance: 'not-established', replaySemantics: 'renderer-restart-only-source-behavior-not-established',
      productVisualBehaviorComposite: 'not-established'}), 'source glossary and independent pending gates');
}

/** Source-host association and native decode are dated technical observations.
 * The admitted policy retains their qualified role and accepts no listening,
 * language, synchronization, original runtime or enabled historical setting. */
function readSpanishSourceProof(root: string, packet: AlgL12P010CurrentJsPacket) {
  const sa = packet.optionalSpanishAudio;
  const analysis = JSON.parse(read(root, sa.sourceHostProof.analysis).toString()) as {
    audit: {kind: string; status: string; decodes: readonly {name: string; actualContextRate: number;
      bufferSampleRate: number; numberOfChannels: number; length: number; duration: number;
      verifiedSourceBytes: number; verifiedSourceSha256: string; nativeDecodeAudioData: boolean;
      sourceNodeCreatedForDecode: boolean}[]}; sourceNodeStarts: number; actualBrowserMeasured: boolean;
  };
  const receipt = JSON.parse(read(root, sa.sourceHostProof.receipt).toString()) as {
    schemaVersion: number; kind: string; animationId: string; sourceInputs: readonly Pin[];
    allInputsRecheckedBeforeSeal: boolean; report: Pin;
    activeXmlBinding: {activePageIndex: number; pageInSection: number; pagePath: string};
    staticConditionalApplication: {derivedSaUrlSymbolic: string; modernLocaleAutoplayProved: boolean;
      actualFlagsObserved: boolean; externalLessonDetailsAssociationVerified: boolean};
    sourceTransport: {completionAtFrame465RequestsMainPlay: boolean; completionAtFrame464WithQuizFalseRequestsMainPlay: boolean};
    independentTerminalHostGuard: {p010ConditionalTerminalFrame: number; embeddedAudioDrainPolicyProved: boolean};
    acceptanceEffects: Readonly<Record<string, boolean>>;
  };
  const decode = analysis.audit.decodes.find(row => row.name === 'sidecar');
  demand(analysis.audit.kind === 'p010-native-browser-decode-measurement-v1' && analysis.audit.status === 'passed' &&
    decode?.actualContextRate === 48000 && decode.bufferSampleRate === 48000 && decode.numberOfChannels === 1 &&
    decode.length === 738432 && decode.duration === 15.384 && decode.verifiedSourceBytes === SPANISH_SOURCE.bytes &&
    decode.verifiedSourceSha256 === SPANISH_SOURCE.sha256 && decode.nativeDecodeAudioData === true &&
    decode.sourceNodeCreatedForDecode === false && analysis.sourceNodeStarts === 0 && analysis.actualBrowserMeasured === true,
    'native P010 sidecar decode without playback or listening acceptance');
  const host = receipt.staticConditionalApplication;
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p010-source-only-sa-host-disposition-v1' &&
    receipt.animationId === ID && receipt.allInputsRecheckedBeforeSeal === true &&
    exact({...receipt.report, path: SA_REPORT.path}, SA_REPORT) &&
    receipt.activeXmlBinding.activePageIndex === 10 && receipt.activeXmlBinding.pageInSection === 4 &&
    receipt.activeXmlBinding.pagePath === 'VB/L12VB05.swf' &&
    host.derivedSaUrlSymbolic === '<ServerRoot>/HELP_COURSES/ALG001/L12/SA/L12VB05.mp3' &&
    host.modernLocaleAutoplayProved === false && host.actualFlagsObserved === false &&
    host.externalLessonDetailsAssociationVerified === false &&
    receipt.sourceTransport.completionAtFrame465RequestsMainPlay === false &&
    receipt.sourceTransport.completionAtFrame464WithQuizFalseRequestsMainPlay === true &&
    receipt.independentTerminalHostGuard.p010ConditionalTerminalFrame === 465 &&
    receipt.independentTerminalHostGuard.embeddedAudioDrainPolicyProved === false &&
    Object.values(receipt.acceptanceEffects).every(value => value === false), 'conditional source-host P010 disposition');
  demand(Array.isArray(receipt.sourceInputs) && receipt.sourceInputs.length === 22, 'bounded source-host proof inputs');
  for (const pin of receipt.sourceInputs) {
    demand(path.isAbsolute(pin.path), 'physical source-host proof input');
    read(path.dirname(pin.path), {...pin, path: path.basename(pin.path)});
  }
}

type TypographyEvidence = {
  schemaVersion: number; kind: string; animationId: string; placementId: string; sourceSwfSha256: string;
  sourceCatalogContentSha256: string; bindingSha256: string; checkedAt: string; checks: Record<string, string>;
  checkEvidence: Record<string, {artifactPaths: readonly string[]; result: string}>;
  resolvedSourceRisks: readonly string[];
  sourceRiskResolutions: readonly {kind: string; disposition: string; artifactPaths: readonly string[]}[];
  languagePolicy: Readonly<Record<string, string>>; artifacts: readonly Pin[];
  checkedImplementationFiles: readonly Pin[]; receipt: Pin;
  humanReviewed: boolean; ownerAccepted: boolean; originalRuntimeAccepted: boolean;
  audioAccepted: boolean; strictComplete: boolean; published: boolean;
};
type TypographyBinding = {
  schemaVersion: number; version: string; animationId: string; placementId: string; sourceSwfSha256: string;
  sourceRelativePath: string; sourceCatalogContentSha256: string; preparationOnly: boolean; unresolved: readonly unknown[];
  languagePolicy: Readonly<Record<string, string>>; blocks: readonly unknown[];
  implementation: {status: string; files: readonly Pin[]};
  nativeTextEvidence: {metadata: Pin; runtime: Pin; inventory: Pin; exactSuppressionInstances: readonly unknown[]};
  sourceRiskEvidence: {technicalRiskCheckRecorded: boolean; sourceParserRisks: readonly string[];
    sourceDisposition: Pin; sourceInventory: Pin; technicalReceipt: Pin;
    resolutions: TypographyEvidence['sourceRiskResolutions']};
  technicalFinalization: {kind: string; checkedAt: string; receipt: Pin};
  independentAcceptance: Readonly<Record<string, boolean>>;
};

function readCurrentTypography(root: string, packet: AlgL12P010CurrentJsPacket) {
  const bindingFile = current(root, BINDING_PATH, 4 * 1024 * 1024);
  const binding = JSON.parse(bindingFile.bytes.toString()) as TypographyBinding;
  const check = JSON.parse(current(root, CHECK_PATH, 4 * 1024 * 1024).bytes.toString()) as TypographyEvidence;
  const native = packet.nativeTypography, risk = binding.sourceRiskEvidence;
  demand(binding.schemaVersion === 1 && binding.version === 'p010-source-native-text-v1' &&
    binding.animationId === ID && binding.placementId === ID && binding.sourceSwfSha256 === SOURCE.sha256 &&
    binding.sourceRelativePath === SOURCE.path && binding.sourceCatalogContentSha256 === CATALOG_CONTENT_SHA &&
    binding.preparationOnly === false && Array.isArray(binding.unresolved) && binding.unresolved.length === 0 &&
    binding.implementation.status === 'implemented' && binding.blocks.length === 54 &&
    exact(binding.languagePolicy, LANGUAGE_POLICY) && check.schemaVersion === 1 &&
    check.kind === 'g678-lesson-typography-check-v1' && check.animationId === ID && check.placementId === ID &&
    check.sourceSwfSha256 === SOURCE.sha256 && check.sourceCatalogContentSha256 === CATALOG_CONTENT_SHA &&
    check.bindingSha256 === bindingFile.pin.sha256 && exact(check.languagePolicy, LANGUAGE_POLICY) &&
    exact(Object.keys(check.checks).sort(), [...CHECKS].sort()) && CHECKS.every(key => check.checks[key] === 'passed') &&
    [check.humanReviewed, check.ownerAccepted, check.originalRuntimeAccepted, check.audioAccepted,
      check.strictComplete, check.published].every(value => value === false) &&
    exact(Object.keys(binding.independentAcceptance).sort(), ['registered', 'originalRuntimeAccepted',
      'flashFidelityAccepted', 'audioAccepted', 'humanReviewed', 'ownerAccepted', 'strictComplete', 'published'].sort()) &&
    Object.values(binding.independentAcceptance).every(value => value === false), 'current finalized technical typography pair');
  demand(typeof check.checkedAt === 'string' && Number.isFinite(Date.parse(check.checkedAt)) &&
    Date.parse(check.checkedAt) <= Date.now() + 1000 &&
    binding.technicalFinalization.checkedAt === check.checkedAt &&
    binding.technicalFinalization.kind === 'p010-technical-typography-finalization-v1' &&
    exact(binding.technicalFinalization.receipt, check.receipt) && exact(risk.technicalReceipt, check.receipt) &&
    risk.technicalRiskCheckRecorded === true && exact([...risk.sourceParserRisks].sort(), [...RISKS].sort()) &&
    exact([...check.resolvedSourceRisks].sort(), [...RISKS].sort()) &&
    exact(risk.resolutions, check.sourceRiskResolutions) && check.sourceRiskResolutions.length === RISKS.length &&
    exact(risk.sourceDisposition, native.sourceDisposition) && exact(risk.sourceInventory, native.sourceInventory) &&
    exact(binding.nativeTextEvidence.metadata, native.runtimeMetadata) &&
    exact(binding.nativeTextEvidence.runtime, native.runtime) &&
    exact(binding.nativeTextEvidence.inventory, native.sourceInventory) &&
    binding.nativeTextEvidence.exactSuppressionInstances.length === 58 &&
    exact(binding.implementation.files, check.checkedImplementationFiles), 'source risks, suppression and coherent final receipt');
  const receipt = JSON.parse(read(root, check.receipt).toString()) as TypographyEvidence;
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p010-technical-typography-evidence-v1' &&
    receipt.animationId === ID && receipt.placementId === ID && receipt.sourceSwfSha256 === SOURCE.sha256 &&
    receipt.sourceCatalogContentSha256 === CATALOG_CONTENT_SHA && receipt.checkedAt === check.checkedAt &&
    exact(receipt.checks, check.checks) && exact(receipt.checkEvidence, check.checkEvidence) &&
    exact(receipt.resolvedSourceRisks, check.resolvedSourceRisks) &&
    exact(receipt.sourceRiskResolutions, check.sourceRiskResolutions) &&
    exact(receipt.languagePolicy, check.languagePolicy) &&
    exact(receipt.checkedImplementationFiles, check.checkedImplementationFiles) &&
    Array.isArray(check.artifacts) && new Set(check.artifacts.map(pin => pin.path)).size === check.artifacts.length &&
    receipt.artifacts.every(pin => exact(check.artifacts.find(item => item.path === pin.path), pin)) &&
    exact(check.artifacts.find(pin => pin.path === check.receipt.path), check.receipt), 'matching independently recorded evidence');
  const inputPaths = new Set(binding.implementation.files.map(pin => pin.path));
  demand(binding.implementation.files.length > 0 && inputPaths.size === binding.implementation.files.length &&
    ALG_L12_P010_MUTABLE_INTEGRATION_PATHS.every(file => inputPaths.has(file)) &&
    ![BINDING_PATH, CHECK_PATH, ALG_L12_P010_CURRENT_JS_FREEZE.path, REGISTERED_RUNTIME.path, check.receipt.path]
      .some(file => inputPaths.has(file)) &&
    packet.integrity.files.every(pin => exact(binding.implementation.files.find(item => item.path === pin.path), pin)),
  'entire frozen admission closure was technically checked without output cycles');
  for (const pin of binding.implementation.files) read(root, pin, true);
  for (const pin of check.artifacts) {
    demand(!inputPaths.has(pin.path), 'observation is independent of implementation');
    read(root, pin, true);
  }
  const observed = new Set(receipt.artifacts.map(pin => pin.path));
  const references = (paths: readonly string[]) => Array.isArray(paths) && paths.length > 0 &&
    new Set(paths).size === paths.length && paths.every(file => observed.has(file));
  demand(exact(Object.keys(check.checkEvidence).sort(), [...CHECKS].sort()) &&
    CHECKS.every(key => typeof check.checkEvidence[key]?.result === 'string' &&
      check.checkEvidence[key].result.trim() && references(check.checkEvidence[key].artifactPaths)) &&
    exact(check.sourceRiskResolutions.map(item => item.kind).sort(), [...RISKS].sort()) &&
    check.sourceRiskResolutions.every(item => typeof item.disposition === 'string' && item.disposition.trim() &&
      references(item.artifactPaths)), 'each technical check and risk has separate observation evidence');
  const integrationPin = packet.integrity.files.find(pin => pin.path === 'catalog/typography-v1/g678-integration.json');
  demand(integrationPin, 'frozen shared native typography integration');
  const integration = JSON.parse(read(root, integrationPin).toString()) as {kind: string; sharedFiles: readonly Pin[]};
  demand(integration.kind === 'g678-lesson-typography-integration-v1' && integration.sharedFiles.length > 0 &&
    exact(native.criticalFiles.map(pin => pin.path).sort(), [...new Set([
      ...ALG_L12_P010_NATIVE_INPUT_PATHS, ...integration.sharedFiles.map(pin => pin.path)])].sort()) &&
    native.criticalFiles.every(pin => exact(packet.integrity.files.find(item => item.path === pin.path), pin)),
  'complete source-native and shared input closure');
  const meta = JSON.parse(read(root, native.runtimeMetadata).toString()) as {
    animationId: string; version: string; sourceSha256: string; runtimeSha256: string; runtimeBytes: number;
    renderScale: number; canvas: {width: number; height: number}; bitmapCount: number;
    exactSuppressionInstances: readonly unknown[]; registered: boolean; audioEnabled: boolean; acceptanceEffect: string};
  demand(meta.animationId === ID && meta.version === 'p010-source-native-text-v1' &&
    meta.sourceSha256 === SOURCE.sha256 && meta.runtimeSha256 === RUNTIME.sha256 && meta.runtimeBytes === RUNTIME.bytes &&
    meta.renderScale === 2 && exact(meta.canvas, {width: 1600, height: 1200}) && meta.bitmapCount === 0 &&
    exact(meta.exactSuppressionInstances, binding.nativeTextEvidence.exactSuppressionInstances) &&
    meta.registered === false && meta.audioEnabled === false && meta.acceptanceEffect === 'none',
  'retained unregistered native asset facts and exact suppression do not confer acceptance');
}

/** Always requires the real registration and current full technical proof.
 * Explicit root/registration arguments are only for isolated admission fixtures. */
export function readAlgL12P010CurrentJsPacket(root = getWorkspaceRoot(),
  registration: Registration = localOnlyAnimationModuleRegistration(ID)): ReviewedAlgL12P010CurrentJsPacket {
  demand(isG678LocalPreviewEnabled() && !process.env.VERCEL &&
    process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT && lstatSync(SOURCE_ROOT).isDirectory(), 'physical local Preview only');
  demand(registration?.calibrationId === CALIBRATION &&
    /^[a-f0-9]{64}$/u.test(registration.freezeManifestSha256 ?? ''), 'actual private module registration');
  const frozen = current(root, ALG_L12_P010_CURRENT_JS_FREEZE.path, 512 * 1024);
  demand(frozen.pin.sha256 === registration.freezeManifestSha256, 'registered exact admission freeze');
  const packet = JSON.parse(frozen.bytes.toString()) as AlgL12P010CurrentJsPacket;
  validatePacket(packet, registration);
  read(SOURCE_ROOT, SOURCE); read(SOURCE_ROOT, SOURCE_XML); read(SOURCE_ROOT, SPANISH_SOURCE); read(root, P009_FREEZE);
  demand(Array.isArray(packet.integrity.files) && packet.integrity.files.length > 0 &&
    new Set(packet.integrity.files.map(pin => pin.path)).size === packet.integrity.files.length &&
    exact(packet.integrity.mutableBoundaryPaths, ALG_L12_P010_MUTABLE_INTEGRATION_PATHS) &&
    !ALG_L12_P010_MUTABLE_INTEGRATION_PATHS.some(file => packet.integrity.files.some(pin => pin.path === file)) &&
    ALG_L12_P010_ADMISSION_INPUT_PATHS.every(file => packet.integrity.files.some(pin => pin.path === file)) &&
    !packet.integrity.files.some(pin => [BINDING_PATH, CHECK_PATH, ALG_L12_P010_CURRENT_JS_FREEZE.path, REGISTERED_RUNTIME.path,
      'packages/demos/private-current-js-registry.json',
      'packages/demos/src/registry.generated.ts', 'packages/demos/src/registry.metadata.generated.ts',
      'packages/demos/src/registry.local-only.generated.ts',
      'packages/demos/src/registry.local-only.metadata.generated.ts'].includes(pin.path)),
  'complete acyclic maintained admission closure');
  for (const pin of packet.integrity.files) read(root, pin, true);
  // The registry requires this prepared member path. It is an output rather
  // than a source input, and its admitted bytes must equal the native runtime.
  demand(read(root, packet.entry.artifacts.runtime).equals(read(root, RUNTIME)), 'byte-identical prepared native runtime');
  for (const pin of [...Object.values(packet.entry.artifacts), packet.nativeTypography.runtimeMetadata,
    packet.nativeTypography.sourceInventory, packet.nativeTypography.sourceDisposition,
    packet.embeddedAudio.sourceMp3, packet.embeddedAudio.sourceBlocks, packet.embeddedAudio.analysis, packet.glossary.sourceAudit,
    ...Object.values(packet.optionalSpanishAudio.sourceHostProof), ...Object.values(packet.optionalSpanishAudio.implementation)])
    demand(pin.path === REGISTERED_RUNTIME.path ||
      exact(packet.integrity.files.find(item => item.path === pin.path), pin), `frozen direct artifact: ${pin.path}`);
  readSpanishSourceProof(root, packet);
  readCurrentTypography(root, packet);
  return Object.freeze({...packet, freezeManifest: frozen.pin});
}

/** One source-ordered extension of the independently validated P009 predecessor. */
export function extendAlgL12P010CurrentJsDescriptor(base: PageOnlyLessonPlayerDescriptor,
  packet: ReviewedAlgL12P010CurrentJsPacket, registration: Registration): PageOnlyLessonPlayerDescriptor {
  validatePacket(packet, registration);
  demand(packet.freezeManifest.path === ALG_L12_P010_CURRENT_JS_FREEZE.path &&
    packet.freezeManifest.sha256 === registration?.freezeManifestSha256, 'matching reviewed P010 freeze');
  const target = base.pages[9];
  demand(base.calibrationId === 'g678-alg-l12-p009-current-js-v2' &&
    base.source.candidateFreezeManifestPath === P009_FREEZE.path &&
    base.source.candidateFreezeManifestSha256 === P009_FREEZE.sha256 && base.source.sourceXmlSha256 === SOURCE_XML.sha256 &&
    base.course.moduleCode === 'ALG001' && base.course.lesson === 12 && base.course.activePageCount === 52 &&
    base.course.courseShellCount === 0 && base.pages.length === 52 &&
    base.productBridge.pageOnlyDescriptorMemberCount === 52 && base.productBridge.registeredAnimationCount === 21 &&
    base.glossary.length === 39 && base.pages[4]?.animationId === 'shared-alg001-l12-p005' &&
    base.pages[4].rendererAvailability.kind === 'unavailable' && base.pages[5]?.animationId === 'shared-alg001-l12-p006' &&
    base.pages[5].rendererAvailability.kind === 'registered' && base.pages[6]?.animationId === 'shared-alg001-l12-p007' &&
    base.pages[6].rendererAvailability.kind === 'registered' && target?.animationId === ID && target.placementId === ID &&
    target.globalPageOrdinal === 10 && target.sectionCode === 'VB' && target.sectionPageOrdinal === 4 &&
    target.previousPlacementId === 'shared-alg001-l12-p009' && target.nextPlacementId === 'shared-alg001-l12-p011' &&
    target.source.assetId === `swf-${SOURCE.sha256}` && target.rendererAvailability.kind === 'unavailable' &&
    exact(base.productBridge.selectedAnimationIds,
      base.pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId)) &&
    ACCEPTANCE.every(key => base.productBridge.acceptanceEffects[key] === false), 'strict source-ordered P009 predecessor');
  const glossary = supplementP010Glossary(base.glossary);
  demand(glossary.length === 44 && exact(glossary.slice(39).map(entry => entry.sourceKeyAttribute), SUPPLEMENTAL_KEYS) &&
    P010_GLOSSARY_TERMS.every(term => glossary.filter(entry => entry.sourceKeyAttribute === term.sourceKeyAttribute).length === 1),
  'ten source glossary button instances and five verified bilingual additions');
  const pages = base.pages.map((page, index) => index === 9 ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-96', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 22 && new Set(selected).size === 22 &&
    exact(selected.filter(id => id !== ID), base.productBridge.selectedAnimationIds), 'only one actual registration delta');
  return Object.freeze({...base, calibrationId: CALIBRATION,
    descriptorId: `${base.descriptorId}:p010-current-js`, releaseId: `${base.releaseId}:p010-current-js`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: packet.freezeManifest.path,
      candidateFreezeManifestSha256: packet.freezeManifest.sha256}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p010-current-js`}),
    pages: Object.freeze(pages), glossary,
    productBridge: Object.freeze({...base.productBridge, selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P010CurrentJsDescriptor(): PageOnlyLessonPlayerDescriptor {
  // The unchanged formal P009 reader must succeed. Its staged engineering
  // descriptor is never an admission fallback for this route or aggregate.
  const base = algL12P009CurrentJsDescriptor();
  const registration = localOnlyAnimationModuleRegistration(ID);
  const packet = readAlgL12P010CurrentJsPacket(getWorkspaceRoot(), registration);
  return extendAlgL12P010CurrentJsDescriptor(base, packet, registration);
}
