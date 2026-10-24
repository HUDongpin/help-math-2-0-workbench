import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P018Descriptor, readNmsL1P018Binding, NMS_L1_P018_CALIBRATION, NMS_L1_P018_FREEZE} from './g678-nms-l01-p018.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P019_ID = 'shared-nms002-l01-p019';
export const NMS_L1_P019_CALIBRATION = 'g678-nms-l01-p019-current-js-v3';
export const NMS_L1_P019_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p019-current-js-v3.json',
  bytes: 60365, sha256: '4e635b532e2c96746b07b54a44d91d1bfcb94e69c8a21d8695b74f9565f1423d',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan:{mainFrameCount:number;questionFrame:number;mainFrameDomain:string;rawAudioFirstFrame:number;latencySamples:number;decoder:{sourceSha256:string;decodedSamples:number};sourceBoundary:{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}};
  practice:{actions:{mainStops:number[]};questions:string[];handles:{id:string;sourceCharacterId:number;y:number}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P019_INVALID: ${message}`); }
export const readNmsL1P019Binding = readNmsL1P018Binding;
export function readNmsL1P019Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P019Binding(root, NMS_L1_P019_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P019_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P019_ID && packet.entry.key === NMS_L1_P019_ID, 'exact single page');
  demand(packet.source.sha256 === '1e87c6449e84acba17d947b26d27d0172c0daf6542e24d4b1290b70e308fec98' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 185992, 'source identity');
  demand(packet.audioPlan.mainFrameCount===555&&packet.audioPlan.questionFrame===553&&packet.audioPlan.mainFrameDomain==='sprite-71'&&isDeepStrictEqual(packet.practice.actions.mainStops,[553]),'source stop');
  demand(isDeepStrictEqual(packet.practice.questions,['3 + 1','1 + 5','5 + 3','6 + 10','10 + 3','12 + 4','15 + 2','4 + 15','3 + 14','2 + 16']),'ten exact source questions');
  demand(isDeepStrictEqual(packet.practice.handles.map(h=>[h.id,h.sourceCharacterId,h.y]),[['h2',13,-30],['h4',11,47]]),'two exact source handles');
  demand(packet.audioPlan.rawAudioFirstFrame===7&&packet.audioPlan.latencySamples===1673&&packet.audioPlan.decoder.sourceSha256==='8069065f2f32eaa6322f5a7f26ecd356e53119f8daaa07bc65ccf290c8dbd8dc'&&packet.audioPlan.decoder.decodedSamples===1008000,'native source stream');
  demand(isDeepStrictEqual(packet.audioPlan.sourceBoundary,{seconds:46,decodedSample:1004948,unplayedPreservedTailSamples:3052}),'source hold caps native audio');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P019Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P019Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 555 && packet.audioPlan.questionFrame === 553 && isDeepStrictEqual(packet.practice.actions.mainStops,[553]), 'source stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P019_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P019_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P018_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P018_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 26, 'validated preceding26-page lesson');
  const old = base.pages[18];
  demand(old.animationId === NMS_L1_P019_ID && old.placementId === NMS_L1_P019_ID && old.globalPageOrdinal === 19 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 8 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 32 && packet.sourceGlossary.entries.length === 0,'retain all32 predecessor terms; source page has no glossary actions');
  const glossary = base.glossary;
  const pages = base.pages.map(page => page.animationId === NMS_L1_P019_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P019_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-71', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 27 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P019_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P019_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P019_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P019_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P019Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P019Packet();
  return extendNmsL1P019Descriptor(nmsL1P018Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P019_ID));
}
export function nmsL1P019Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P019Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p019-current-js-v2/members/${NMS_L1_P019_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P019Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
