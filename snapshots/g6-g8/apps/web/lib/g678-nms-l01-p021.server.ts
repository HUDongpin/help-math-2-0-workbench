import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P020Descriptor, readNmsL1P020Binding, NMS_L1_P020_CALIBRATION, NMS_L1_P020_FREEZE} from './g678-nms-l01-p020.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P021_ID = 'shared-nms002-l01-p021';
export const NMS_L1_P021_CALIBRATION = 'g678-nms-l01-p021-current-js-v2';
export const NMS_L1_P021_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p021-current-js-v2.json',
  bytes: 227530, sha256: '434bb5a3ef667d6170abc7df709bba261c4d0fdabcc677b1cba5e504000cbff8',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan:{mainFrameCount:number;questionFrame:number;mainFrameDomain:string;clips:{frameDomain:string;frameCount:number;rawAudioFirstFrame:number;playable:boolean;decoder:{sourceSha256:string;decodedSamples:number}}[];coachVariants:{label:string;firstFrame:number;stopFrame:number;firstDecodedSample:number}[];sourceBoundary:{seconds:number;decodedSample:number;unplayedPreservedTailSamples:number}};
  practice:{actions:{mainStops:number[]};questions:string[];problems:{first:number;second:number;result:number;completedQuestion:string}[];sourceCorrections:{id:string}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P021_INVALID: ${message}`); }
export const readNmsL1P021Binding = readNmsL1P020Binding;
export function readNmsL1P021Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P021Binding(root, NMS_L1_P021_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P021_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P021_ID && packet.entry.key === NMS_L1_P021_ID, 'exact single page');
  demand(packet.source.sha256 === '0d1c2ea937365b40403eb7584b3133fd1820fb959d23cdd76e18f02fb0b8a1b1' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 225642, 'source identity');
  demand(packet.audioPlan.mainFrameCount===572&&packet.audioPlan.questionFrame===571&&packet.audioPlan.mainFrameDomain==='sprite-160'&&isDeepStrictEqual(packet.practice.actions.mainStops,[571]),'source stop');
  demand(isDeepStrictEqual(packet.practice.problems.map(p=>[p.first,p.second,p.result]),[[4,-6,-2],[-4,-6,-10],[-1,5,4],[-5,-3,-8],[3,4,7],[-3,4,1],[-4,-3,-7],[-5,7,2],[7,-5,2],[-10,5,-5]]),'ten source normal-release branches');
  demand(packet.practice.problems[1].completedQuestion==='-4 - 6 = -10'&&packet.practice.sourceCorrections.some(c=>c.id==='case2-outside-copy-error'),'source copy-error correction retained');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.frameCount,c.rawAudioFirstFrame,c.decoder.decodedSamples,c.playable]),[['sprite-46',55,3,96768,true],['sprite-149',5,1,8640,true],['sprite-157',25,2,43776,true],['sprite-159',20,2,34560,false],['sprite-160',572,9,1035648,true]]),'five source streams and exact playable boundary');
  demand(isDeepStrictEqual(packet.audioPlan.coachVariants.map(c=>[c.label,c.firstFrame,c.stopFrame,c.firstDecodedSample]),[['S1',3,16,1673],['S2',18,27,27391],['S3',31,36,51272],['S4',40,54,67805]]),'four source coach branches');
  demand(isDeepStrictEqual(packet.audioPlan.sourceBoundary,{seconds:47.5,decodedSample:1034348,unplayedPreservedTailSamples:1300}),'source hold caps native audio');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P021Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P021Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 572 && packet.audioPlan.questionFrame === 571 && isDeepStrictEqual(packet.practice.actions.mainStops,[571]), 'source stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P021_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P021_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P020_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P020_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 28, 'validated preceding28-page lesson');
  const old = base.pages[20];
  demand(old.animationId === NMS_L1_P021_ID && old.placementId === NMS_L1_P021_ID && old.globalPageOrdinal === 21 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 10 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length===34&&packet.sourceGlossary.entries.length===2,'exact predecessor and source glossary');
  for(const entry of packet.sourceGlossary.entries){
    demand(['number-line','set'].includes(entry.id),'exact source glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    demand(isDeepStrictEqual(base.glossary.find(e=>e.id===entry.id),projected),'preserve exact existing source term');
  }
  const glossary=base.glossary;
  const pages = base.pages.map(page => page.animationId === NMS_L1_P021_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P021_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-160', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 29 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P021_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P021_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P021_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P021_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P021Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P021Packet();
  return extendNmsL1P021Descriptor(nmsL1P020Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P021_ID));
}
export function nmsL1P021Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P021Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p021-current-js-v2/members/${NMS_L1_P021_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P021Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
