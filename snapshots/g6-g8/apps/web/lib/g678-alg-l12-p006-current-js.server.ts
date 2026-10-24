import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {P006_AUDIO_SOURCE} from '../../../packages/demos/src/alg-l12-p006-audio-decode';
import {P006_AUDIO_RUNS, P006_AUDIO_SCHEDULE} from
  '../../../packages/demos/src/alg-l12-p006-audio-schedule';
import {P006_GLOSSARY_BUTTONS} from '../../../packages/demos/src/alg-l12-p006-glossary-state';
import {P006_SPANISH_AUDIO_SOURCE} from '../../../packages/demos/src/alg-l12-p006-spanish-audio';
import {getWorkspaceRoot} from './catalog';
import {ALG_L12_P003_CALIBRATION, ALG_L12_P003_FREEZE, algL12P003Descriptor} from
  './g678-alg-l12-p003.server';
import {decodeG678GlossaryXmlText} from './g678-calibration-product-bridge.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L12_P006_CURRENT_JS_ID = 'shared-alg001-l12-p006';
export const ALG_L12_P006_CURRENT_JS_CALIBRATION = 'g678-alg-l12-p006-current-js-v2';
// The generated registration supplies the reviewed freeze digest. This fixed path
// avoids a circular hash when the freeze also binds this maintained reader.
export const ALG_L12_P006_CURRENT_JS_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v2.json',
});
const SUPERSEDED_ADMISSION = Object.freeze({
  calibrationId: 'g678-alg-l12-p006-current-js-v1',
  freeze: {path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v1.json',
    bytes: 37932, sha256: '46847b41be87fc22e2f9b1bcf566252180fc2b04a73ca94bd11978e9e42dd0c7'},
  fragment: {path: 'catalog/product-bridge-calibrations/g678-alg-l12-p006-current-js-v1.fragment.json',
    bytes: 1267, sha256: 'aa11119dd474a310ceeec314592a2fe69cb0e48fb7c4a4a3e3ed7532da4d44d3'},
});
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const GLOSSARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const ID = ALG_L12_P006_CURRENT_JS_ID;
const CALIBRATION = ALG_L12_P006_CURRENT_JS_CALIBRATION;
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const RUNTIME_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
const RUNTIME_BYTES = 11507597;
const RUNTIME_PATH = `work/g678-shared-page-factory/${CALIBRATION}/members/${ID}/canvas-renderer.js`;
const GLOSSARY_SHA = '7c0dcbfa455ad06a1a72c4d9550d6aabd4131c4c3e498ecad50193f1d5395bab';
const GLOSSARY_CATALOG_SHA = 'e5ff597b123c3097f2784d497b5f9ba1be0a750ffbd36b36e8038ea6bcd36763';

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Registration = ReturnType<typeof localOnlyAnimationModuleRegistration> | undefined;
export type AlgL12P006CurrentJsPacket = Readonly<{
  schemaVersion: number; calibrationId: string; sourceRoot: string;
  scope: string; deploymentScope: string;
  supersedes: Readonly<{calibrationId: string; freeze: Pin; fragment: Pin}>;
  predecessor: Readonly<{calibrationId: string; freezeManifestSha256: string;
    registeredAnimationCount: number}>;
  selectedPages: readonly Readonly<{
    animationId: string; placementId: string; assetId: string; sourceSha256: string;
    stableLessonKey: string; moduleCode: string; lessonNumber: number;
    globalPageOrdinal: number; sectionCode: string; sectionPageOrdinal: number;
    complexityLane: string;
    runtime: Readonly<{stage: Readonly<{width: number; height: number}>;
      frameDomain: string; frameCount: number; rootFrameCount: number;
      rootBeginFrame: number; livePlaybackEndFrame: number; language: string;
      audioPlaybackEnabled: boolean; canvasRenderer: Pin & {url: string}}>;
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
  }>[];
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; sourceAudit: Pin;
  candidateManifest: Pin; sourceGlossary: Pin; glossaryCatalog: Pin; hostAdapter: Pin;
  nativeTypography: Readonly<{runtime: Pin; runtimeMetadata: Pin;
    exactSuppressionManifest: Pin; sourceDisposition: Pin;
    sourceCatalogContentSha256: string; languagePolicy: Readonly<Record<'en' | 'es', string>>;
    criticalFiles: readonly Pin[]}>;
  entry: Readonly<{key: string; module: string; maturity: string;
    complexityLane: string; artifacts: Readonly<{module: Pin; timeline: Pin; runtime: Pin}>}>;
  embeddedAudio: Readonly<{sourceMp3: Pin; receipt: Pin; scheduleVersion: string;
    sourceSha256: string; sourceSampleRange: readonly number[];
    timelineStartSample: number; timelineEndSample: number; visualTerminalSample: number}>;
  optionalSpanishAudio: Readonly<{source: Pin; intendedRole: string;
    spokenLanguageVerified: boolean; automaticLocalePlayback: boolean}>;
  glossaryHostBoundary: Readonly<{sourceButtonCount: number;
    existingLessonEntryIds: readonly string[]; supplementalEntryIds: readonly string[];
    allSourceButtonsMappedToEntries: boolean; originalHostLookupVerified: boolean}>;
  integrity: Readonly<{files: readonly Pin[]}>;
  preparationState: Readonly<{status: string; typographyImplementation: string;
    activationPermitted: boolean; requiredBindingPath: string; requiredCheckPath: string;
    requiredDevelopmentCheck: string}>;
  acceptanceEffects: Readonly<Record<string, boolean>>;
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}>;
export type ReviewedAlgL12P006CurrentJsPacket = AlgL12P006CurrentJsPacket &
  Readonly<{freezeManifest: Pin}>;

const REQUIRED_DEPENDENCIES = Object.freeze([
  `packages/demos/src/modules/${ID}.tsx`, `packages/demos/src/timelines/${ID}.ts`,
  'packages/demos/src/alg-l12-p006-audio-decode.ts',
  'packages/demos/src/alg-l12-p006-audio-schedule.ts',
  'packages/demos/src/alg-l12-p006-audio-transport.ts',
  'packages/demos/src/alg-l12-p006-spanish-audio.ts',
  'packages/demos/src/alg-l12-p006-visual-clock.ts',
  'packages/demos/src/alg-l12-p006-glossary-state.ts',
  'packages/demos/src/alg-l12-p006-glossary-hit.ts',
  'packages/demos/src/generated/alg-l12-p006-hit-spec.ts',
  'packages/demos/src/alg-l12-p006-host-policy.ts',
  'packages/demos/src/alg-l12-p006-typography.ts',
  'packages/demos/src/alg-l12-p006-typography.css',
  'packages/demos/src/alg-l12-p006-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p006-typography-asset.ts',
  `migrations/${ID}/typography-v1/canvas-renderer.js`,
  `migrations/${ID}/typography-v1/adapter-manifest.json`,
  `migrations/${ID}/typography-v1/runtime-meta.json`,
  `migrations/${ID}/evidence/TYPOGRAPHY_SOURCE_2026-09-27.md`,
  'scripts/build-g678-alg-l12-p006-typography.mjs',
  'scripts/lib/swf-text-source-catalog.mjs',
  'catalog/typography-v1/g678-integration.json',
  'packages/demos/src/source-static-canvas-candidate.tsx',
  'apps/web/components/g678-alg-l12-p006-host-lesson.tsx',
  'apps/web/components/g678-multi-page-lesson-player-v5.generated.tsx',
  'apps/web/lib/g678-alg-l12-p006-current-js.server.ts',
  'apps/web/lib/g678-current-js-extensions.server.ts',
  'apps/web/lib/g678-alg-l12-p006-admission-access.ts',
  'apps/web/proxy.ts',
  'apps/web/lib/g678-p047-proxy-host-successor.server.ts',
  'catalog/product-bridge-calibrations/g678-alg-l12-p006-admission-proxy-composed-successor-v1.json',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/page.tsx`,
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}-admission/page.tsx`,
  'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p007/page.tsx',
  `apps/web/app/[locale]/migration-status/g678-calibration/${ID}/probe.module.css`,
  'apps/web/lib/g678-alg-l12-p006.server.ts',
  'apps/web/lib/g678-alg-l12-p006-audio.server.ts',
  'apps/web/lib/g678-alg-l12-p006-spanish-audio.server.ts',
  `apps/web/app/flash-assets/g678-local/${ID}/canvas-renderer.js/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/source-audio/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/spanish-audio/route.ts`,
  `apps/web/app/flash-assets/g678-local/${ID}/typography-renderer.js/route.ts`,
]);
const ACCEPTANCE_KEYS = ['authoritativeOriginalRuntime', 'fidelityAccepted',
  'audioAccepted', 'humanVisualAccepted', 'ownerAccepted', 'strictComplete', 'published'] as const;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P006_CURRENT_JS_INVALID: ${reason}`);
}

function readPinned(file: string, pin: Pin, allowEmpty = false): Buffer {
  demand(Number.isSafeInteger(pin.bytes) && pin.bytes >= (allowEmpty ? 0 : 1) && pin.bytes <= 32 * 1024 * 1024 &&
    /^[a-f0-9]{64}$/u.test(pin.sha256) && realpathSync(file) === file, `bounded physical pin: ${pin.path}`);
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && before.nlink === 1n && before.size === BigInt(pin.bytes), 'ordinary pinned file');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
    .every(key => before[key] === after[key]) && bytes.length === pin.bytes &&
    createHash('sha256').update(bytes).digest('hex') === pin.sha256, `pinned bytes: ${pin.path}`);
  return bytes;
}

function workspacePin(root: string, pin: Pin, allowEmpty = false): Buffer {
  demand(!path.isAbsolute(pin.path) && pin.path.split('/').every(part => part && part !== '..' && part !== '.'),
    'workspace-relative binding');
  const file = path.resolve(root, pin.path);
  demand(file.startsWith(`${root}${path.sep}`), 'workspace boundary');
  return readPinned(file, pin, allowEmpty);
}

function requireRegistration(registration: Registration): asserts registration is NonNullable<Registration> {
  demand(registration?.calibrationId === CALIBRATION &&
    registration.scope === 'private-engineering' && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' &&
    /^[a-f0-9]{64}$/u.test(registration.freezeManifestSha256 ?? '') &&
    /^[a-f0-9]{64}$/u.test(registration.moduleSha256 ?? '') &&
    /^[a-f0-9]{64}$/u.test(registration.timelineSha256 ?? '') &&
    registration.runtimeSha256 === RUNTIME_SHA, 'actual private module registration');
}

function validatePacket(packet: AlgL12P006CurrentJsPacket, registration: Registration) {
  requireRegistration(registration);
  demand(isDeepStrictEqual(packet.supersedes, SUPERSEDED_ADMISSION), 'exact retained v1 provenance');
  const page = packet.selectedPages?.[0];
  demand(packet.schemaVersion === 1 && packet.calibrationId === CALIBRATION &&
    packet.sourceRoot === SOURCE_ROOT && packet.scope === 'private-engineering' &&
    packet.deploymentScope === 'local-only' && packet.selectedPages.length === 1 &&
    packet.predecessor.calibrationId === ALG_L12_P003_CALIBRATION &&
    packet.predecessor.freezeManifestSha256 === ALG_L12_P003_FREEZE.sha256 &&
    packet.predecessor.registeredAnimationCount === 19 &&
    page?.animationId === ID && page.placementId === ID && page.assetId === `swf-${SOURCE_SHA}` &&
    page.sourceSha256 === SOURCE_SHA && page.stableLessonKey === 'shared-alg001-l12' &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 &&
    page.globalPageOrdinal === 6 && page.sectionCode === 'RW' && page.sectionPageOrdinal === 5 &&
    page.complexityLane === 'behavior-heavy' && page.runtime.stage.width === 800 && page.runtime.stage.height === 600 &&
    page.runtime.frameDomain === 'sprite-53' && page.runtime.frameCount === 342 &&
    page.runtime.rootFrameCount === 10 && page.runtime.rootBeginFrame === 6 &&
    page.runtime.livePlaybackEndFrame === 342 && page.runtime.language === 'fixed-en' &&
    page.runtime.audioPlaybackEnabled === true && page.runtime.canvasRenderer.path === RUNTIME_PATH &&
    page.runtime.canvasRenderer.bytes === RUNTIME_BYTES && page.runtime.canvasRenderer.sha256 === RUNTIME_SHA &&
    page.runtime.canvasRenderer.url === `/flash-assets/g678-local/${ID}/canvas-renderer.js` &&
    packet.entry.key === ID && packet.entry.module === `./modules/${ID}` &&
    packet.entry.maturity === 'private-current-js' && packet.entry.complexityLane === 'behavior-heavy' &&
    packet.entry.artifacts.module.path === `packages/demos/src/modules/${ID}.tsx` &&
    packet.entry.artifacts.timeline.path === `packages/demos/src/timelines/${ID}.ts` &&
    packet.entry.artifacts.module.sha256 === registration.moduleSha256 &&
    packet.entry.artifacts.timeline.sha256 === registration.timelineSha256 &&
    isDeepStrictEqual(packet.entry.artifacts.runtime, {path: RUNTIME_PATH, bytes: RUNTIME_BYTES, sha256: RUNTIME_SHA}),
  'exact sixth source placement, maintained module, and composed runtime');
  const boundary = page.runtimeEvidenceBoundary;
  demand(boundary?.actionScriptExecution === 'not-executed' &&
    boundary.naturalTraceValidation === 'not-established' && boundary.audioAcceptance === 'not-established' &&
    packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    ACCEPTANCE_KEYS.every(key => packet.acceptanceEffects[key] === false) &&
    Object.values(packet.acceptanceEffects).every(value => value === false), 'independent pending acceptance gates');
  demand(packet.preparationState?.requiredBindingPath === `catalog/typography-v1/g678-page-bindings/${ID}.json` &&
    packet.preparationState.requiredCheckPath === `catalog/typography-v1/g678-checks/${ID}.json` &&
    packet.preparationState.requiredDevelopmentCheck === 'npm run check:typography --workspace @helpmath/demos' &&
    packet.preparationState.activationPermitted === true &&
    packet.preparationState.typographyImplementation === 'source-bound-implemented' &&
    packet.preparationState.status === 'admission-reviewed',
  'mandatory typography admission boundary');
  const native = packet.nativeTypography;
  demand(native?.runtime.path === `migrations/${ID}/typography-v1/canvas-renderer.js` &&
    native.runtime.bytes === 11529506 &&
    native.runtime.sha256 === '5b4b15ea0d75f77025ddbadacbc679e3355f9bf87aeedae2531ec87763e8714e' &&
    native.runtimeMetadata.path === `migrations/${ID}/typography-v1/runtime-meta.json` &&
    native.exactSuppressionManifest.path === `migrations/${ID}/typography-v1/adapter-manifest.json` &&
    native.sourceDisposition.path === `migrations/${ID}/evidence/TYPOGRAPHY_SOURCE_2026-09-27.md` &&
    native.sourceCatalogContentSha256 === 'ade09b22c6df92ebbef45c15154abe20e60ffff2f8328dd9e1b877b734611996' &&
    isDeepStrictEqual(native.languagePolicy, {en: 'source', es: 'source-fallback'}) &&
    Array.isArray(native.criticalFiles) && native.criticalFiles.length >= 9 &&
    new Set(native.criticalFiles.map(pin => pin.path)).size === native.criticalFiles.length,
  'exact source-native typography runtime');
  demand(packet.source.path === 'G6-G8-shared/ALG001/L12/RW/L12RW06.swf' &&
    packet.source.bytes === 708053 && packet.source.sha256 === SOURCE_SHA &&
    packet.sourceXml.path === 'G6-G8-shared/ALG001/L12/index.xml' && packet.sourceXml.bytes === 11927 &&
    packet.sourceXml.sha256 === '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325' &&
    packet.sourceCatalog.path === 'catalog/g678-shared-catalog.v1.json' &&
    packet.candidateManifest.path === `migrations/${ID}/candidate-v2/mask-manifest.json` &&
    packet.sourceGlossary.path === `migrations/${ID}/audit/glossary-disposition-v1.json` &&
    packet.sourceGlossary.bytes === 26891 && packet.sourceGlossary.sha256 === GLOSSARY_SHA &&
    packet.glossaryCatalog.path === 'catalog/g678-vb02-l1-family-audit-v1.json' &&
    packet.glossaryCatalog.bytes === 230498 && packet.glossaryCatalog.sha256 === GLOSSARY_CATALOG_SHA &&
    packet.hostAdapter.path === 'apps/web/components/g678-alg-l12-p006-host-lesson.tsx', 'source/evidence/host bindings');
  const audio = packet.embeddedAudio, sa = packet.optionalSpanishAudio;
  demand(audio.scheduleVersion === 'continuous-stream-v2' && audio.sourceSha256 === P006_AUDIO_SOURCE.sha256 &&
    audio.sourceMp3.path === `migrations/${ID}/audio-source-v1/sprite-53-source-stream.mp3` &&
    audio.sourceMp3.bytes === 140920 && audio.sourceMp3.sha256 === P006_AUDIO_SOURCE.sha256 &&
    audio.receipt.path === `migrations/${ID}/audio-source-v1/stream-source-receipt.json` &&
    audio.receipt.bytes === 142839 && audio.receipt.sha256 === 'c3f1c26102fb9b7e0cb41a60a0de764b8cc68da559a7d20be7ccb42f557f4f78' &&
    isDeepStrictEqual(audio.sourceSampleRange, [1673, 624384]) && audio.timelineStartSample === 3675 &&
    audio.timelineEndSample === 626386 && audio.visualTerminalSample === 626587.5 &&
    P006_AUDIO_RUNS.length === 1 && P006_AUDIO_RUNS[0].sourceStartSample === 1673 &&
    P006_AUDIO_RUNS[0].sourceEndSample === 624384 && P006_AUDIO_RUNS[0].timelineStartSample === 3675 &&
    P006_AUDIO_SCHEDULE.audioEndTimelineSample === 626386 && P006_AUDIO_SCHEDULE.terminalTimelineSample === 626587.5 &&
    sa.source.path === 'G6-G8-shared/ALG001/L12/SA/L12RW06.mp3' && sa.source.bytes === 214704 &&
    sa.source.sha256 === P006_SPANISH_AUDIO_SOURCE.sha256 &&
    sa.intendedRole === 'explicit-spanish-audio-control' && sa.spokenLanguageVerified === false &&
    sa.automaticLocalePlayback === false, 'continuous embedded stream and separate explicit SA');
  const glossary = packet.glossaryHostBoundary;
  demand(glossary.sourceButtonCount === 4 &&
    isDeepStrictEqual(glossary.existingLessonEntryIds, ['coordinate', 'graph', 'equation']) &&
    isDeepStrictEqual(glossary.supplementalEntryIds, ['inequality']) &&
    glossary.allSourceButtonsMappedToEntries === true && glossary.originalHostLookupVerified === false,
  'four audited glossary requests with one supplemental entry');
}

const TYPOGRAPHY_CHECKS = Object.freeze(['sourceBinding', 'semanticText', 'mathSemantics',
  'timingAndReplay', 'teachingTextDisposition', 'hostIntegration', 'responsiveTypography',
  'accessibility', 'bilingualPolicy', 'performance', 'lifecycle', 'resourceStability']);
const TYPOGRAPHY_RISKS = Object.freeze(['shape-text-unclassified', 'bitmap-text-unclassified',
  'button-runtime-state-and-actions-not-interpreted', 'actionscript-visibility-and-values-not-interpreted',
  'mask-filter-blend-semantics-unresolved']);
const NATIVE_TYPOGRAPHY_PATHS = Object.freeze([
  `packages/demos/src/modules/${ID}.tsx`,
  'packages/demos/src/alg-l12-p006-typography.ts',
  'packages/demos/src/alg-l12-p006-typography-renderer.tsx',
  'packages/demos/src/alg-l12-p006-typography.css',
  'packages/demos/src/alg-l12-p006-typography-asset.ts',
  `migrations/${ID}/typography-v1/canvas-renderer.js`,
  `migrations/${ID}/typography-v1/runtime-meta.json`,
  `migrations/${ID}/typography-v1/adapter-manifest.json`,
  `migrations/${ID}/evidence/TYPOGRAPHY_SOURCE_2026-09-27.md`,
  'scripts/build-g678-alg-l12-p006-typography.mjs',
  'scripts/lib/swf-text-source-catalog.mjs',
]);
type TypographyEvidence = Readonly<{
  schemaVersion: number; kind: string; animationId: string; placementId: string;
  sourceSwfSha256: string; sourceCatalogContentSha256: string; bindingSha256: string;
  checkedAt: string;
  checks: Readonly<Record<string, string>>; resolvedSourceRisks: readonly string[];
  sourceRiskResolutions: readonly unknown[]; languagePolicy: Readonly<Record<string, string>>;
  artifacts: readonly Pin[]; checkedImplementationFiles: readonly Pin[]; receipt: Pin;
  humanReviewed: boolean; ownerAccepted: boolean; originalRuntimeAccepted: boolean;
  audioAccepted: boolean; strictComplete: boolean; published: boolean;
}>;
type TypographyBinding = Readonly<{
  schemaVersion: number; version: string; animationId: string; placementId: string;
  sourceSwfSha256: string; sourceCatalogContentSha256: string;
  sourceRelativePath: string; languagePolicy: Readonly<Record<string, string>>;
  preparationOnly: boolean; unresolved: readonly unknown[];
  implementation: Readonly<{status: string; files: readonly Pin[]}>;
  sourceRiskEvidence: Readonly<{technicalRiskCheckRecorded: boolean;
    exactSuppressionManifest: Pin; nativeRuntimeMetadata: Pin; sourceDisposition: Pin;
    technicalReceipt: Pin; sourceParserRisks: readonly string[]; resolutions: readonly unknown[]}>;
  technicalFinalization: Readonly<{kind: string; checkedAt: string; receipt: Pin}>;
}>;

/** Read the current pair without freezing it into the admission packet. The
 * reviewed native inputs must stay byte-identical, while registration/route
 * evidence can be refreshed after the admission candidate runs without a hash cycle. */
function readTypographyAdmissionPair(root: string, packet: AlgL12P006CurrentJsPacket,
  scope: 'formal-current' | 'admission-candidate') {
  const current = (relative: string) => {
    const file = path.join(root, relative), before = lstatSync(file, {bigint: true});
    demand(realpathSync(file) === file && before.isFile() && before.nlink === 1n &&
      before.size > 0n && before.size <= 1024n * 1024n, 'bounded physical typography pair');
    const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
    demand((['dev', 'ino', 'size', 'mode', 'mtimeNs', 'ctimeNs', 'nlink'] as const)
      .every(key => before[key] === after[key]) && BigInt(bytes.length) === before.size,
    'stable typography pair');
    return bytes;
  };
  const bindingBytes = current(packet.preparationState.requiredBindingPath);
  const binding = JSON.parse(bindingBytes.toString()) as TypographyBinding;
  const check = JSON.parse(current(packet.preparationState.requiredCheckPath).toString()) as TypographyEvidence;
  const native = packet.nativeTypography, risk = binding.sourceRiskEvidence;
  demand(typeof check.checkedAt === 'string' && check.checkedAt.length <= 64 &&
    Number.isFinite(Date.parse(check.checkedAt)) && new Date(check.checkedAt).toISOString() === check.checkedAt &&
    binding.technicalFinalization.checkedAt === check.checkedAt,
  'coherent finite typography timestamps');
  const integrationPin = packet.integrity.files.find(pin => pin.path === 'catalog/typography-v1/g678-integration.json');
  demand(integrationPin, 'frozen shared typography integration');
  const integration = JSON.parse(workspacePin(root, integrationPin).toString()) as {
    kind: string; sharedFiles: readonly Pin[]};
  demand(integration.kind === 'g678-lesson-typography-integration-v1' &&
    Array.isArray(integration.sharedFiles) && integration.sharedFiles.length > 0 &&
    isDeepStrictEqual(native.criticalFiles.map(pin => pin.path).sort(),
      [...new Set([...NATIVE_TYPOGRAPHY_PATHS, ...integration.sharedFiles.map(pin => pin.path)])].sort()),
  'complete native and shared typography input closure');
  demand(binding.schemaVersion === 1 && binding.version === 'p006-source-native-text-v1' &&
    binding.animationId === ID && binding.placementId === ID && binding.sourceSwfSha256 === SOURCE_SHA &&
    binding.sourceCatalogContentSha256 === native.sourceCatalogContentSha256 &&
    binding.sourceRelativePath === packet.source.path && binding.preparationOnly === false &&
    binding.unresolved.length === 0 && binding.implementation.status === 'implemented' &&
    isDeepStrictEqual(binding.languagePolicy, native.languagePolicy) &&
    check.schemaVersion === 1 && check.kind === 'g678-lesson-typography-check-v1' &&
    check.animationId === ID && check.placementId === ID && check.sourceSwfSha256 === SOURCE_SHA &&
    check.sourceCatalogContentSha256 === native.sourceCatalogContentSha256 &&
    check.bindingSha256 === createHash('sha256').update(bindingBytes).digest('hex') &&
    isDeepStrictEqual(check.languagePolicy, native.languagePolicy) &&
    Object.keys(check.checks).length === TYPOGRAPHY_CHECKS.length &&
    TYPOGRAPHY_CHECKS.every(key => check.checks[key] === 'passed') &&
    [check.humanReviewed, check.ownerAccepted, check.originalRuntimeAccepted,
      check.audioAccepted, check.strictComplete, check.published].every(value => value === false),
  'current source-bound typography pair and twelve technical checks');
  demand(risk.technicalRiskCheckRecorded === true &&
    isDeepStrictEqual(risk.sourceParserRisks, TYPOGRAPHY_RISKS) &&
    isDeepStrictEqual(check.resolvedSourceRisks, TYPOGRAPHY_RISKS) &&
    isDeepStrictEqual(check.sourceRiskResolutions, risk.resolutions) &&
    risk.resolutions.length === TYPOGRAPHY_RISKS.length &&
    isDeepStrictEqual(risk.exactSuppressionManifest, native.exactSuppressionManifest) &&
    isDeepStrictEqual(risk.nativeRuntimeMetadata, native.runtimeMetadata) &&
    isDeepStrictEqual(risk.sourceDisposition, native.sourceDisposition) &&
    binding.technicalFinalization.kind === 'p006-technical-typography-finalization-v1' &&
    isDeepStrictEqual(binding.technicalFinalization.receipt, check.receipt) &&
    isDeepStrictEqual(risk.technicalReceipt, check.receipt) &&
    isDeepStrictEqual(binding.implementation.files, check.checkedImplementationFiles),
  'complete source-risk disposition and coherent technical receipt');
  const receipt = JSON.parse(workspacePin(root, check.receipt).toString()) as TypographyEvidence;
  demand(receipt.checkedAt === check.checkedAt, 'matching recorded typography timestamp');
  demand(receipt.schemaVersion === 1 && receipt.kind === 'p006-technical-typography-evidence-v1' &&
    receipt.animationId === ID && receipt.placementId === ID && receipt.sourceSwfSha256 === SOURCE_SHA &&
    receipt.sourceCatalogContentSha256 === native.sourceCatalogContentSha256 &&
    isDeepStrictEqual(receipt.checks, check.checks) &&
    isDeepStrictEqual(receipt.resolvedSourceRisks, check.resolvedSourceRisks) &&
    isDeepStrictEqual(receipt.sourceRiskResolutions, check.sourceRiskResolutions) &&
    Array.isArray(receipt.artifacts) && Array.isArray(check.artifacts) &&
    new Set(check.artifacts.map(pin => pin.path)).size === check.artifacts.length &&
    receipt.artifacts.every(pin => isDeepStrictEqual(
      check.artifacts.find(item => item.path === pin.path), pin)) &&
    isDeepStrictEqual(check.artifacts.find(pin => pin.path === check.receipt.path), check.receipt) &&
    isDeepStrictEqual(receipt.checkedImplementationFiles, check.checkedImplementationFiles),
  'matching recorded typography evidence');
  // Empty error/console logs are ordinary evidence files and still require
  // their exact zero-byte SHA-256, stable metadata and physical file identity.
  for (const artifact of check.artifacts) workspacePin(root, artifact, true);
  const manifest = JSON.parse(workspacePin(root, native.exactSuppressionManifest).toString()) as {
    schemaVersion: number; kind: string; animationId: string; sourceSwfSha256: string;
    runtimeSha256: string; originalRuntimeSha256: string; generator: {sha256: string}};
  demand(manifest.schemaVersion === 1 && manifest.kind === 'p006-exact-placement-typography-v1' &&
    manifest.animationId === ID && manifest.sourceSwfSha256 === SOURCE_SHA &&
    manifest.runtimeSha256 === native.runtime.sha256 && manifest.originalRuntimeSha256 === RUNTIME_SHA,
  'source-native adapter manifest identity');
  for (const pin of native.criticalFiles) {
    const frozen = packet.integrity.files.find(item => item.path === pin.path);
    demand(isDeepStrictEqual(frozen, pin), `frozen typography input: ${pin.path}`);
    const reviewed = binding.implementation.files.find(item => item.path === pin.path);
    // The dated pair binds this generator through its exact adapter manifest.
    // All later full-closure evidence includes the generator directly as well.
    const manifestBoundGenerator = !reviewed &&
      pin.path === 'scripts/build-g678-alg-l12-p006-typography.mjs' &&
      pin.sha256 === manifest.generator.sha256;
    demand(isDeepStrictEqual(reviewed, pin) || manifestBoundGenerator,
      `reviewed source-native input: ${pin.path}`);
  }
  if (scope === 'formal-current') {
    // Formal admission requires the entire recorded implementation inventory
    // to be current. The separately named engineering surface cannot change
    // this condition through a query, environment flag, or caller input.
    for (const pin of binding.implementation.files) {
      try { workspacePin(root, pin); }
      catch { throw Error(`ALG_L12_P006_CURRENT_JS_INVALID: current typography implementation: ${pin.path}`); }
    }
  }
}

/** The default path always requires the real generated registration. A supplied
 * registration/root is useful only for isolated admission fixture checks. */
export function readAlgL12P006CurrentJsPacket(root = getWorkspaceRoot(),
  registration: Registration = localOnlyAnimationModuleRegistration(ID)): ReviewedAlgL12P006CurrentJsPacket {
  return readReviewedP006Packet(root, registration, 'formal-current');
}

function readReviewedP006Packet(root: string, registration: Registration,
  scope: 'formal-current' | 'admission-candidate'): ReviewedAlgL12P006CurrentJsPacket {
  demand(isG678LocalPreviewEnabled() && process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT && lstatSync(SOURCE_ROOT).isDirectory(), 'physical local Preview only');
  requireRegistration(registration);
  const freezeFile = path.join(root, ALG_L12_P006_CURRENT_JS_FREEZE.path);
  const freezeManifest = Object.freeze({...ALG_L12_P006_CURRENT_JS_FREEZE,
    bytes: Number(lstatSync(freezeFile).size), sha256: registration.freezeManifestSha256!});
  demand(freezeManifest.bytes <= 512 * 1024, 'bounded freeze');
  const packet = JSON.parse(workspacePin(root, freezeManifest).toString()) as AlgL12P006CurrentJsPacket;
  validatePacket(packet, registration);
  for (const pin of [packet.source, packet.sourceXml, packet.optionalSpanishAudio.source])
    readPinned(path.join(SOURCE_ROOT, pin.path), pin);
  demand(Array.isArray(packet.integrity?.files) &&
    new Set(packet.integrity.files.map(pin => pin.path)).size === packet.integrity.files.length &&
    REQUIRED_DEPENDENCIES.every(file => packet.integrity.files.some(pin => pin.path === file)), 'complete maintained dependency closure');
  const boundPins = [packet.sourceCatalog, packet.sourceAudit, packet.candidateManifest,
    packet.sourceGlossary, packet.glossaryCatalog, packet.hostAdapter, packet.embeddedAudio.sourceMp3,
    packet.embeddedAudio.receipt, ...Object.values(packet.entry.artifacts)];
  for (const pin of boundPins) {
    const integrityPin = packet.integrity.files.find(item => item.path === pin.path);
    // Runtime is also directly bound by the generated registration and may be kept outside integrity.files.
    demand(pin.path === RUNTIME_PATH || isDeepStrictEqual(integrityPin, pin), `integrity agreement: ${pin.path}`);
    workspacePin(root, pin);
  }
  for (const pin of packet.integrity.files) workspacePin(root, pin);
  readTypographyAdmissionPair(root, packet, scope);
  const candidate = JSON.parse(workspacePin(root, packet.candidateManifest).toString());
  demand(candidate.animationId === ID && candidate.status === 'unregistered-mask-corrected-drawing-candidate' &&
    candidate.sourceSha256 === SOURCE_SHA && candidate.runtimeSha256 === RUNTIME_SHA &&
    candidate.runtimeBytes === RUNTIME_BYTES && candidate.registered === false &&
    candidate.originalRuntimeVerified === false && candidate.audioAccepted === false && candidate.strictComplete === false,
  'retained mask-v2 candidate facts do not imply registration or acceptance');
  return Object.freeze({...packet, freezeManifest});
}

function sourceBoundInequality(base: PageOnlyLessonPlayerDescriptor,
  packet: AlgL12P006CurrentJsPacket, root: string): PageOnlyLessonGlossaryEntry {
  type Text = Readonly<Record<'en' | 'es', string>>;
  type Term = {id: string; sourceKeyAttribute: string; labels: Text; definitions: Text;
    localeSourceResolution: Text; sourceEntrySha256: Text};
  const audit = JSON.parse(workspacePin(root, packet.sourceGlossary).toString()) as {
    schemaVersion: number; animationId: string; source: {sha256: string};
    buttons: {characterId: number; sourceKeyAttribute: string; depth: number}[];
    existingDefinitionCandidate: {catalogSha256: string;
      keyTermSources: Record<'en' | 'es', {bytes: number; sha256: string}>;
      entries: (Omit<Term, 'id'> & {entryId: string})[]};
  };
  const catalog = JSON.parse(workspacePin(root, packet.glossaryCatalog).toString()) as {
    artifactType: string; terms: Term[]};
  demand(audit.schemaVersion === 1 && audit.animationId === ID && audit.source.sha256 === SOURCE_SHA &&
    audit.existingDefinitionCandidate.catalogSha256 === GLOSSARY_CATALOG_SHA &&
    catalog.artifactType === 'g678-vb02-l1-family-audit-v1' && audit.buttons.length === 4 &&
    audit.existingDefinitionCandidate.entries.length === 4 &&
    isDeepStrictEqual(audit.buttons.map(({characterId, sourceKeyAttribute, depth}) =>
      [characterId, sourceKeyAttribute, depth]), P006_GLOSSARY_BUTTONS.map(({characterId, term, depth}) =>
      [characterId, term, depth])), 'exact four source glossary buttons');
  for (const [locale, file, bytes, sha256] of [
    ['en', 'L1KTE01.xml', 345838, '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'],
    ['es', 'L1KTS01.xml', 344456, '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'],
  ] as const) {
    demand(audit.existingDefinitionCandidate.keyTermSources[locale].bytes === bytes &&
      audit.existingDefinitionCandidate.keyTermSources[locale].sha256 === sha256, 'physical dictionary binding');
    readPinned(path.join(GLOSSARY_ROOT, file), {path: file, bytes, sha256});
  }
  let inequality: PageOnlyLessonGlossaryEntry | undefined;
  for (const [index, button] of P006_GLOSSARY_BUTTONS.entries()) {
    const audited = audit.existingDefinitionCandidate.entries[index];
    const matches = catalog.terms.filter(term => term.sourceKeyAttribute === button.term);
    demand(matches.length === 1 && audited?.sourceKeyAttribute === button.term, `unique source term: ${button.term}`);
    const source = matches[0]!;
    demand(audited.entryId === source.id && (['labels', 'definitions', 'localeSourceResolution', 'sourceEntrySha256'] as const)
      .every(key => isDeepStrictEqual(audited[key], source[key])), `audited bilingual content: ${button.term}`);
    const decode = (text: string) => {
      const decoded = decodeG678GlossaryXmlText(text);
      demand(decoded, `decoded glossary text: ${button.term}`);
      return decoded;
    };
    const entry: PageOnlyLessonGlossaryEntry = Object.freeze({
      id: source.id, sourceKeyAttribute: source.sourceKeyAttribute,
      labels: Object.freeze({en: decode(source.labels.en), es: decode(source.labels.es)}),
      definitions: Object.freeze({en: decode(source.definitions.en), es: decode(source.definitions.es)}),
      source: Object.freeze({
        en: Object.freeze({assetId: 'G678L1KTE01.xml' as const, path: source.localeSourceResolution.en,
          sha256: audit.existingDefinitionCandidate.keyTermSources.en.sha256}),
        es: Object.freeze({assetId: 'G678L1KTS01.xml' as const, path: source.localeSourceResolution.es,
          sha256: audit.existingDefinitionCandidate.keyTermSources.es.sha256}),
      }),
    });
    const existing = base.glossary.filter(item => item.id === source.id);
    if (source.id === 'inequality') {
      demand(existing.length === 0, 'only new Inequality entry');
      inequality = entry;
    } else demand(existing.length === 1 && isDeepStrictEqual(existing[0], entry), `preserve existing glossary: ${source.id}`);
  }
  demand(inequality, 'audited Inequality entry');
  return inequality;
}

export function extendAlgL12P006CurrentJsDescriptor(base: PageOnlyLessonPlayerDescriptor,
  packet: ReviewedAlgL12P006CurrentJsPacket, registration: Registration,
  root = getWorkspaceRoot()): PageOnlyLessonPlayerDescriptor {
  validatePacket(packet, registration);
  demand(registration?.freezeManifestSha256 === packet.freezeManifest.sha256 &&
    packet.freezeManifest.path === ALG_L12_P006_CURRENT_JS_FREEZE.path, 'matching reviewed freeze');
  demand(packet.preparationState.activationPermitted === true &&
    packet.preparationState.typographyImplementation === 'source-bound-implemented' &&
    packet.preparationState.status === 'admission-reviewed',
  'preparation-only packet is not admission; source-bound typography remains required');
  const target = base.pages[5];
  demand(base.calibrationId === ALG_L12_P003_CALIBRATION &&
    base.source.candidateFreezeManifestSha256 === ALG_L12_P003_FREEZE.sha256 &&
    base.course.moduleCode === 'ALG001' && base.course.lesson === 12 && base.course.activePageCount === 52 &&
    base.course.courseShellCount === 0 && base.pages.length === 52 && base.productBridge.pageOnlyDescriptorMemberCount === 52 &&
    base.productBridge.registeredAnimationCount === 19 && base.glossary.length === 34 &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256 &&
    target?.animationId === ID && target.placementId === ID && target.globalPageOrdinal === 6 &&
    target.sectionCode === 'RW' && target.sectionPageOrdinal === 5 &&
    target.previousPlacementId === 'shared-alg001-l12-p005' && target.nextPlacementId === 'shared-alg001-l12-p007' &&
    base.pages[4]?.animationId === 'shared-alg001-l12-p005' && base.pages[4].rendererAvailability.kind === 'unavailable' &&
    base.pages[6]?.animationId === 'shared-alg001-l12-p007' &&
    target.source.assetId === `swf-${SOURCE_SHA}` && target.rendererAvailability.kind === 'unavailable' &&
    isDeepStrictEqual(base.productBridge.selectedAnimationIds,
      base.pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId)) &&
    ACCEPTANCE_KEYS.every(key => base.productBridge.acceptanceEffects[key] === false), 'exact source-ordered P003 predecessor');
  const inequality = sourceBoundInequality(base, packet, root);
  const pages = base.pages.map((page, index) => index === 5 ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-53', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    presentation: Object.freeze({...page.presentation,
      pageInteractionCompanionTargetIdSuffix: 'p006-glossary-candidate'}),
    runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 20 && new Set(selected).size === 20 && selected[4] === ID &&
    isDeepStrictEqual(selected.filter(id => id !== ID), base.productBridge.selectedAnimationIds), 'one actual P006 registration delta');
  return Object.freeze({...base,
    calibrationId: CALIBRATION,
    descriptorId: `${base.descriptorId}:p006-current-js`, releaseId: `${base.releaseId}:p006-current-js`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: packet.freezeManifest.path,
      candidateFreezeManifestSha256: packet.freezeManifest.sha256}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p006-current-js`}),
    pages: Object.freeze(pages), glossary: Object.freeze([...base.glossary, inequality]),
    productBridge: Object.freeze({...base.productBridge, selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P006CurrentJsDescriptor(): PageOnlyLessonPlayerDescriptor {
  const registration = localOnlyAnimationModuleRegistration(ID);
  const packet = readAlgL12P006CurrentJsPacket(getWorkspaceRoot(), registration);
  return extendAlgL12P006CurrentJsDescriptor(algL12P003Descriptor(), packet, registration);
}

export type AlgL12P006AdmissionCandidateDescriptor = PageOnlyLessonPlayerDescriptor & Readonly<{
  admissionCandidateDisclosure: Readonly<{
    status: 'engineering-staged'; typographyGate: 'formal-current-proof-pending';
    officialCompletionClaim: false; acceptanceEffect: 'none';
  }>;
}>;

/** This named local engineering surface retains exact registered source/native
 * bindings while fresh browser evidence is collected. It never satisfies the
 * formal current-typography gate and never supplies official completion claims. */
export function algL12P006AdmissionCandidateDescriptor(): AlgL12P006AdmissionCandidateDescriptor {
  const registration = localOnlyAnimationModuleRegistration(ID);
  const root = getWorkspaceRoot();
  const packet = readReviewedP006Packet(root, registration, 'admission-candidate');
  const descriptor = extendAlgL12P006CurrentJsDescriptor(algL12P003Descriptor(), packet, registration, root);
  return Object.freeze({...descriptor,
    descriptorId: `${descriptor.descriptorId}:admission-staged`,
    releaseId: `${descriptor.releaseId}:admission-staged`,
    course: Object.freeze({...descriptor.course,
      href: `/migration-status/g678-calibration/${ID}-admission`}),
    persistence: Object.freeze({...descriptor.persistence,
      storageKey: `${descriptor.persistence.storageKey}:admission-staged`}),
    admissionCandidateDisclosure: Object.freeze({status: 'engineering-staged' as const,
      typographyGate: 'formal-current-proof-pending' as const,
      officialCompletionClaim: false as const, acceptanceEffect: 'none' as const}),
  });
}
