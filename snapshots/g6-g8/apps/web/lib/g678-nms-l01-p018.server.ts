import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P017Descriptor, readNmsL1P017Binding, NMS_L1_P017_CALIBRATION, NMS_L1_P017_FREEZE} from './g678-nms-l01-p017-v3.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P018_ID = 'shared-nms002-l01-p018';
export const NMS_L1_P018_CALIBRATION = 'g678-nms-l01-p018-current-js-v2';
export const NMS_L1_P018_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p018-current-js-v2.json',
  bytes: 99428, sha256: 'f0c1973274e128162cb1b6233cd944bd0acd63c8cea95c0302a0ccd994395ec5',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan:{mainFrameCount:number;questionFrame:number;clips:{frameDomain:string;selectable:boolean}[];mainSegments:unknown[]};
  practice:{actions:{mainStops:number[];hostTerminal:number};cards:{id:string;value:number;targetId:string|null}[];targets:{integer:number;absoluteValue:number}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P018_INVALID: ${message}`); }
export const readNmsL1P018Binding = readNmsL1P017Binding;
export function readNmsL1P018Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P018Binding(root, NMS_L1_P018_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P018_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P018_ID && packet.entry.key === NMS_L1_P018_ID, 'exact single page');
  demand(packet.source.sha256 === '42109c2d4317b6e1b0af3519a00549344329d6a2266210d2cdd997c17d63bd7d' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 196253, 'source identity');
  demand(packet.audioPlan.mainFrameCount===492&&packet.audioPlan.questionFrame===445&&packet.practice.actions.hostTerminal===492&&isDeepStrictEqual(packet.practice.actions.mainStops,[445]),'source and host stops');
  demand(isDeepStrictEqual(packet.practice.cards.map(c=>[c.id,c.value,c.targetId]),[['Scr_1',-6,null],['Scr_2',-5,null],['Scr_3',-4,null],['Scr_4',-2,null],['Scr_5',0,'Mc_Tar_5'],['Scr_6',2,'Mc_Tar_6'],['Scr_7',4,'Mc_Tar_7'],['Scr_8',5,'Mc_Tar_8'],['Scr_9',6,'Mc_Tar_9']]),'nine exact source cards and five targets');
  demand(isDeepStrictEqual(packet.practice.targets.map(t=>[t.integer,t.absoluteValue]),[[2,2],[-6,6],[5,5],[-4,4],[0,0]]),'five absolute-value rows');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.selectable]),[['sprite-78',true],['sprite-69',true],['sprite-77',true],['sprite-75',false]]),'three active one dormant MP3');
  demand(isDeepStrictEqual(packet.audioPlan.mainSegments,[{firstFrame:9,firstDecodedSample:1673,endDecodedSample:725184},{firstFrame:409,firstDecodedSample:725420,endDecodedSample:879552}]),'two measured native stream runs');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P018Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P018Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 492 && packet.audioPlan.questionFrame === 445 && packet.practice.actions.hostTerminal === 492, 'source and host stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P018_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P018_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P017_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P017_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 25, 'validated preceding25-page lesson');
  const old = base.pages[17];
  demand(old.animationId === NMS_L1_P018_ID && old.placementId === NMS_L1_P018_ID && old.globalPageOrdinal === 18 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 7 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 31 && base.glossary.some(e => e.id === 'absolute-value') && packet.sourceGlossary.entries.length === 4, 'source glossary predecessor');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['absolute-value', 'column', 'distance', 'number-line'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const old = glossary.find(e => e.id === entry.id);
    if (old) demand(isDeepStrictEqual(old, projected), 'preserve existing glossary'); else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length === 32 && new Set(glossary.map(e => e.id)).size === 32 && isDeepStrictEqual(glossary.filter(e=>e.id!=='column'), base.glossary), 'one column term adds to31 preserved existing terms');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P018_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P018_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-78', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 26 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P018_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P018_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P018_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P018_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P018Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P018Packet();
  return extendNmsL1P018Descriptor(nmsL1P017Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P018_ID));
}
export function nmsL1P018Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P018Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p018-current-js-v1/members/${NMS_L1_P018_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P018Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
