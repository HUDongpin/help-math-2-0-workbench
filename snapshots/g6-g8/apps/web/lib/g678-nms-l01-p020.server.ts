import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P019Descriptor, readNmsL1P019Binding, NMS_L1_P019_CALIBRATION, NMS_L1_P019_FREEZE} from './g678-nms-l01-p019.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P020_ID = 'shared-nms002-l01-p020';
export const NMS_L1_P020_CALIBRATION = 'g678-nms-l01-p020-current-js-v1';
export const NMS_L1_P020_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p020-current-js-v1.json',
  bytes: 120575, sha256: '21114ecdb9210a433129431cf111c98efbdcf68bc2a606fe623881a30a8b2b8b',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan:{mainFrameCount:number;questionFrame:number;mainFrameDomain:string;rawAudioFirstFrame:number;latencySamples:number;decoder:{sourceSha256:string;decodedSamples:number};sourceBoundary:{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}};
  practice:{actions:{mainStops:number[]};questions:string[];problems:{answerCharacterId:number;result:number}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P020_INVALID: ${message}`); }
export const readNmsL1P020Binding = readNmsL1P019Binding;
export function readNmsL1P020Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P020Binding(root, NMS_L1_P020_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P020_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P020_ID && packet.entry.key === NMS_L1_P020_ID, 'exact single page');
  demand(packet.source.sha256 === '03af79673e7b4cc21b2d9fce30ac856234e32a565c1fd15eed2816ad05753952' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 175044, 'source identity');
  demand(packet.audioPlan.mainFrameCount===570&&packet.audioPlan.questionFrame===569&&packet.audioPlan.mainFrameDomain==='sprite-114'&&isDeepStrictEqual(packet.practice.actions.mainStops,[569]),'source stop');
  demand(isDeepStrictEqual(packet.practice.questions,['3 - 15 =','13 - 2 =','12 - 2 =','5 - 3 =','7 - 5 =','3 - 5 =','6 - 8 =','10 - 15 =','6 - 10 =','5 - 5 =']),'ten exact source questions');
  demand(isDeepStrictEqual(packet.practice.problems.map(p=>[p.answerCharacterId,p.result]),[[75,-12],[80,11],[83,10],[88,2],[93,2],[96,-2],[101,-2],[105,-5],[109,-4],[113,0]]),'ten source answer branches');
  demand(packet.audioPlan.rawAudioFirstFrame===10&&packet.audioPlan.latencySamples===1673&&packet.audioPlan.decoder.sourceSha256==='c948c41e7431a6aa39f7d024c8336d52d5c0a92fd53d92dafe4602bf5f83a76b'&&packet.audioPlan.decoder.decodedSamples===970560,'native source stream');
  demand(isDeepStrictEqual(packet.audioPlan.sourceBoundary,{seconds:568/12,decodedSample:967443.5,unplayedPreservedTailSamples:3116.5}),'source hold caps native audio');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P020Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P020Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 570 && packet.audioPlan.questionFrame === 569 && isDeepStrictEqual(packet.practice.actions.mainStops,[569]), 'source stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P020_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P020_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P019_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P019_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 27, 'validated preceding27-page lesson');
  const old = base.pages[19];
  demand(old.animationId === NMS_L1_P020_ID && old.placementId === NMS_L1_P020_ID && old.globalPageOrdinal === 20 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 9 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 32 && packet.sourceGlossary.entries.length === 6,'exact predecessor and source glossary');
  const glossary = [...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(['positive-integers','perform','show','subtraction','operation','problem'].includes(entry.id),'exact source glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const existing=glossary.find(e=>e.id===entry.id);
    if(existing)demand(isDeepStrictEqual(existing,projected),'same source glossary binding '+entry.id);
    else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===34 && new Set(glossary.map(e=>e.id)).size===34 && isDeepStrictEqual(glossary.filter(e=>!['perform','subtraction'].includes(e.id)),base.glossary),'two new source glossary terms and32 preserved');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P020_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P020_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-114', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 28 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P020_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P020_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P020_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P020_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P020Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P020Packet();
  return extendNmsL1P020Descriptor(nmsL1P019Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P020_ID));
}
export function nmsL1P020Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P020Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p020-current-js-v1/members/${NMS_L1_P020_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P020Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
