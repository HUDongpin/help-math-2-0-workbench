import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P023Descriptor,readNmsL1P023Binding,NMS_L1_P023_CALIBRATION,NMS_L1_P023_FREEZE} from './g678-nms-l01-p023.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P024_ID = 'shared-nms002-l01-p024';
export const NMS_L1_P024_CALIBRATION = 'g678-nms-l01-p024-current-js-v1';
export const NMS_L1_P024_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p024-current-js-v1.json',
  bytes: 201341, sha256: '74803aee22819d1dffaf1a4f62f4ba33a78e2eaf113b9f5aec546d2a8843b415',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']; controls: Array<{sourceCharacterId:number;entryId:string;sourceKeyAttribute:string}>};
  source: Pin;
  sourceXml: Pin;
  sourceCatalog: Pin;
  inputs: Pin[];
  outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainFrameDomain:string;mainFrameCount:number;questionFrame:number;mainSegments:unknown[]};
  practice: {actions:{mainStops:number[]};problems:Array<{left:number;right:number;result:number;answerCharacterId:number;frameCount:number}>};
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`NMS_L1_P024_INVALID: ${message}`);
}
export const readNmsL1P024Binding = readNmsL1P023Binding;
export function readNmsL1P024Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P024Binding(root, NMS_L1_P024_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P024_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P024_ID && packet.entry.key === NMS_L1_P024_ID, 'exact single page');
  demand(packet.source.sha256 === 'c7dbf393e645c04560e0977675131109667c8094315a70321ad8af552bca038d' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 157428, 'source identity');
  demand(packet.audioPlan.mainFrameDomain==='sprite-137'&&packet.audioPlan.mainFrameCount===469&&packet.audioPlan.questionFrame===468&&isDeepStrictEqual(packet.practice.actions.mainStops,[468]),'source question stop policy');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P024Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  demand(isDeepStrictEqual(packet.practice.problems.map(p=>[p.left,p.right,p.result,p.answerCharacterId,p.frameCount]),[[3,15,45,58,68],[2,12,24,64,42],[12,2,24,63,42],[5,3,15,69,39],[5,7,35,86,64],[7,5,35,102,67],[8,5,40,119,75],[5,5,25,126,56],[6,6,36,131,60],[10,0,0,136,9]]),'ten source multiplication questions and answer stops');
  demand(isDeepStrictEqual(packet.audioPlan.mainSegments,[{"firstFrame":6,"firstDecodedSample":1673,"endDecodedSample":293184},{"firstFrame":184,"firstDecodedSample":293414,"endDecodedSample":818496}]),'two source audio segments');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original calibrations and their source evidence retain their own identity. */
export function extendNmsL1P024Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameDomain==='sprite-137'&&packet.audioPlan.mainFrameCount===469&&packet.audioPlan.questionFrame===468&&isDeepStrictEqual(packet.practice.actions.mainStops,[468]),'source question stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P024_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P024_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId===NMS_L1_P023_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P023_FREEZE.sha256&&base.productBridge.registeredAnimationCount===31,'validated preceding31-page lesson');
  const old = base.pages[23];
  demand(old.animationId === NMS_L1_P024_ID && old.placementId === NMS_L1_P024_ID && old.globalPageOrdinal === 24 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 13 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 41 && base.glossary.some(e=>e.id==='multiplication'), 'source glossary predecessor');
  demand(packet.sourceGlossary.entries.length===0 && packet.sourceGlossary.controls.length===0, 'no source glossary actions');
  const glossary=[...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(["temperature","increase","fahrenheit","degree","multiplication","addition"].includes(entry.id), 'exact glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const old=glossary.find(e=>e.id===entry.id);
    if(old)demand(isDeepStrictEqual(old,projected),'preserve existing glossary');else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===41 && new Set(glossary.map(e=>e.id)).size===41 && isDeepStrictEqual(glossary,base.glossary), 'preserve41 existing source terms');
  for(const control of packet.sourceGlossary.controls)demand(glossary.some(e=>e.id===control.entryId && e.sourceKeyAttribute.toLowerCase()===control.sourceKeyAttribute.toLowerCase()),'every source glossary resolves');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P024_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P024_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-137', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary:Object.freeze(glossary), calibrationId: NMS_L1_P024_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P024_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P024_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P024_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P024Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P024Packet(), predecessor=nmsL1P023Descriptor();
  return extendNmsL1P024Descriptor(predecessor, packet, localOnlyAnimationModuleRegistration(NMS_L1_P024_ID));
}
export function nmsL1P024Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL1P024Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p024-current-js-v1/members/${NMS_L1_P024_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P024Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

