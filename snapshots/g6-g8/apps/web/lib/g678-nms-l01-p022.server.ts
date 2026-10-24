import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P021Descriptor, readNmsL1P021Binding, NMS_L1_P021_CALIBRATION, NMS_L1_P021_FREEZE} from './g678-nms-l01-p021.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P022_ID = 'shared-nms002-l01-p022';
export const NMS_L1_P022_CALIBRATION = 'g678-nms-l01-p022-current-js-v1';
export const NMS_L1_P022_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p022-current-js-v1.json',
  bytes: 151912, sha256: '9bb0925404a8bf7c0d0006bc4c3c930168c53fd014be1f75696044dabcd0fc49',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan:{mainFrameCount:number;questionFrame:number;clips:{frameDomain:string;selectable:boolean}[];mainSegments:unknown[]};
  practice:{actions:{mainStops:number[];hostTerminal:number};cards:{id:string;value:number;targetId:string|null}[];targets:{left:number;operator:string;right:number;result:number}[];wrongCloseStateMatrixUnits:string};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P022_INVALID: ${message}`); }
export const readNmsL1P022Binding = readNmsL1P021Binding;
export function readNmsL1P022Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P022Binding(root, NMS_L1_P022_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P022_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P022_ID && packet.entry.key === NMS_L1_P022_ID, 'exact single page');
  demand(packet.source.sha256 === '0c634b34f16b55f42d954dec64f1aa353b22053d93ab6137cadf48e7cc3bb5e2' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 1232694, 'source identity');
  demand(packet.audioPlan.mainFrameCount===523&&packet.audioPlan.questionFrame===480&&packet.practice.actions.hostTerminal===523&&isDeepStrictEqual(packet.practice.actions.mainStops,[480]),'source and host stops');
  demand(isDeepStrictEqual(packet.practice.cards.map(c=>[c.id,c.value,c.targetId]),[["Scr_1", -6, "Mc_Tar_1"], ["Scr_2", 9, "Mc_Tar_2"], ["Scr_3", 7, "Mc_Tar_3"], ["Scr_4", 4, "Mc_Tar_4"], ["Scr_5", -3, "Mc_Tar_5"], ["Scr_6", 8, "Mc_Tar_6"], ["Scr_7", -5, null], ["Scr_8", -4, null], ["Scr_9", -2, null], ["Scr_10", -1, null], ["Scr_11", 0, null], ["Scr_12", 1, null], ["Scr_13", 2, null], ["Scr_14", 3, null], ["Scr_15", 5, null], ["Scr_16", 6, null]]),'sixteen exact source cards and six targets');
  demand(isDeepStrictEqual(packet.practice.targets.map(t=>[t.left,t.operator,t.right,t.result]),[[2, "−", 8, -6], [15, "−", 6, 9], [5, "+", 2, 7], [8, "−", 4, 4], [0, "−", 3, -3], [3, "+", 5, 8]]),'six source expressions and results');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.selectable]),[["sprite-342", true], ["sprite-333", true], ["sprite-341", true], ["sprite-339", false], ["sprite-129", false], ["sprite-169", false], ["sprite-210", false], ["sprite-256", false], ["sprite-320", false]]),'three active and six dormant source MP3');
  demand(isDeepStrictEqual(packet.audioPlan.mainSegments,[{firstFrame:9,firstDecodedSample:1673,endDecodedSample:945792}]),'whole main native stream');
  demand(packet.practice.wrongCloseStateMatrixUnits==='source-twips','raw Button state matrices');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P022Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P022Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 523 && packet.audioPlan.questionFrame === 480 && packet.practice.actions.hostTerminal === 523, 'source and host stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P022_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P022_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P021_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P021_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 29, 'validated preceding29-page lesson');
  const old = base.pages[21];
  demand(old.animationId === NMS_L1_P022_ID && old.placementId === NMS_L1_P022_ID && old.globalPageOrdinal === 22 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 11 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length===34&&packet.sourceGlossary.entries.length===4,'source glossary predecessor');
  const glossary=[...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(['expression','solution','integers','column'].includes(entry.id),'exact source glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const existing=glossary.find(e=>e.id===entry.id);
    if(existing)demand(isDeepStrictEqual(existing,projected),'preserve exact existing source term');else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===36&&new Set(glossary.map(e=>e.id)).size===36&&isDeepStrictEqual(glossary.filter(e=>!['expression','solution'].includes(e.id)),base.glossary),'two new terms and34 exact preserved terms');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P022_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P022_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-342', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 30 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P022_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P022_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P022_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P022_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P022Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P022Packet();
  return extendNmsL1P022Descriptor(nmsL1P021Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P022_ID));
}
export function nmsL1P022Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P022Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p022-current-js-v1/members/${NMS_L1_P022_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P022Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
