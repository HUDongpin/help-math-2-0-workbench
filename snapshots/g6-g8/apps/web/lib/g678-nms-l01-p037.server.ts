import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P036Descriptor, readNmsL1P036Binding, NMS_L1_P036_CALIBRATION, NMS_L1_P036_FREEZE} from './g678-nms-l01-p036.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P037_ID = 'shared-nms002-l01-p037';
export const NMS_L1_P037_CALIBRATION = 'g678-nms-l01-p037-current-js-v1';
export const NMS_L1_P037_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p037-current-js-v1.json", "bytes": 361101, "sha256": "5e62fc0ab9085d7e7c23eb2e04e261d8a792918e29d40cad8f3ad2330632479d"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; instructionFrame: number; questionFrame: number; outroFirstFrame: number; endChildFrameDomain: string; endChildFirstMainFrame: number; endChildFrameCount: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {actions: {mainStops: number[]; actualClickSites: number; sourceLoopUpperBound: number; missingClickName: string}; rows: {play: number; start: number; delta: number; answer: number; correctClickIndex: number}[]; clickSites: {clickIndex: number; lineNumber: number; origin: string}[]; correctPictures: {play: number; sourceCharacterId: number}[]; deviceFields: {sourceCharacterId: number}[]; orderedPlayGuard: Pin; hostTerminal: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P037_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===601 && packet.audioPlan.instructionFrame===595 && packet.audioPlan.questionFrame===596 && packet.audioPlan.outroFirstFrame===597 && packet.audioPlan.mainAudioFirstFrame===2 && isDeepStrictEqual(packet.practice.actions.mainStops,[595,596,601]),'source595 instructions,596 game and601 main stop');
 demand(packet.audioPlan.endChildFrameDomain==='sprite-635' && packet.audioPlan.endChildFirstMainFrame===598 && packet.audioPlan.endChildFrameCount===111,'independent child635 reaches111 after main601');
 demand(isDeepStrictEqual(packet.practice.rows.map(r=>[r.play,r.start,r.delta,r.answer,r.correctClickIndex]),[[1, 0, 8, 8, 29], [2, 8, -10, -2, 19], [3, -2, 30, 28, 49], [4, 28, -3, 25, 46], [5, 25, 15, 40, 61], [6, 40, 7, 47, 68], [7, 47, -2, 45, 66], [8, 45, 9, 54, 75], [9, 54, -11, 43, 64], [10, 43, 21, 64, 85], [11, 64, 7, 71, 92], [12, 71, 7, 78, 99], [13, 78, -4, 74, 95], [14, 74, 6, 80, 101]]),'14 exact source plays and arithmetic');
 demand(packet.practice.clickSites.length===101 && packet.practice.actions.actualClickSites===101 && packet.practice.actions.sourceLoopUpperBound===102 && packet.practice.actions.missingClickName==='ClickMc_102' && isDeepStrictEqual(packet.practice.clickSites.map(c=>[c.clickIndex,c.lineNumber]),Array.from({length:101},(_,i)=>[i+1,i-20])) && packet.practice.clickSites.filter(c=>c.origin==='original').length===22,'101 source sites with79 duplicates and no invented102');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-636", 1100160], ["sprite-569", 27072], ["sprite-635", 194112]]),'three complete native source buffers');
 demand(isDeepStrictEqual(packet.practice.correctPictures.map(c=>[c.play,c.sourceCharacterId]),[[0, 534], [1, 536], [2, 538], [3, 540], [4, 542], [5, 544], [6, 546], [7, 548], [8, 550], [9, 552], [10, 554], [11, 556], [12, 558], [13, 560], [14, 562]]) && isDeepStrictEqual(packet.practice.deviceFields.map(f=>f.sourceCharacterId),[529,530,531,568]) && packet.practice.clipMasks.length===3,'15 source tableaux, four device fields and three vector masks');
 demand(packet.practice.orderedPlayGuard.sha256==='f2a7465060a0e23ce671df1c9e21fa02cf0f56d07f6791827932221d2f2431ea','source-bound orderedPlayGuard');
 demand(packet.practice.hostTerminal.sha256==='14bb95511e502e8f9805f08b7df9b9c56773117aa1569b2a8ffb29d1f108c2cc','source-bound hostTerminal');
}
export const readNmsL1P037Binding = readNmsL1P036Binding;
export function readNmsL1P037Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P037Binding(root, NMS_L1_P037_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P037_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P037_ID && packet.entry.key === NMS_L1_P037_ID, 'exact single page');
  demand(packet.source.sha256 === '6090cf99eed95c383c7f04d55f9e4dc697b02202aab168d1698cbef26752e2ce' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 1721909, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P037Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P037Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P037_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P037_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P036_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P036_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 44, 'validated preceding44-page lesson');
  const old = base.pages[36];
  demand(old.animationId === NMS_L1_P037_ID && old.placementId === NMS_L1_P037_ID && old.globalPageOrdinal === 37 &&
    old.sectionCode === 'GS' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length===46 && packet.sourceGlossary.entries.length===0,'preserve46 existing terms without page37 glossary additions');
  const glossary=[...base.glossary];
  const pages = base.pages.map(page => page.animationId === NMS_L1_P037_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P037_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-636', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 45 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P037_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P037_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P037_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P037_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P037Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P037Packet();
  return extendNmsL1P037Descriptor(nmsL1P036Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P037_ID));
}
export function nmsL1P037Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P037Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p037-current-js-v1/members/${NMS_L1_P037_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P037Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
