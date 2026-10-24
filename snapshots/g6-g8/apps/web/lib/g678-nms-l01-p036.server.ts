import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P035Descriptor, readNmsL1P035Binding, NMS_L1_P035_CALIBRATION, NMS_L1_P035_FREEZE} from './g678-nms-l01-p035.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P036_ID = 'shared-nms002-l01-p036';
export const NMS_L1_P036_CALIBRATION = 'g678-nms-l01-p036-current-js-v1';
export const NMS_L1_P036_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p036-current-js-v1.json", "bytes": 338979, "sha256": "657dbcc02cfdcb3018b792353c0b1425b9318f7f22952f19d0584312abf0f460"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {livePlaybackEndFrame: number; mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {firstButtonFrame: number; lastButtonFrame: number; hotspots: unknown[]}; wrong: {hotspots: unknown[]}; actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; value: number; sourceCharacterId: number; paired: boolean; permittedTargets: number[]}[]; targets: {targetIndex: number; left: number; right: number; value: number; sourceCharacterId: number}[]; pairedProductGuard: Pin; hostTerminal: Pin; sourceColorExtraction: {currentState: Pin}; sourceHotspots: {sourceCharacterId: number; ranges: {firstFrame:number;lastFrame:number;sourceDepth:number}[]}[]; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P036_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===679 && packet.audioPlan.livePlaybackEndFrame===678 && packet.audioPlan.questionFrame===619 && packet.audioPlan.outroFirstFrame===620 && packet.audioPlan.mainAudioFirstFrame===9 && packet.practice.actions.correctContinuation===620 && isDeepStrictEqual(packet.practice.actions.mainStops,[619,678]),'source619 hold and678 authored stop');
 demand(isDeepStrictEqual([...packet.practice.choices].sort((a,b)=>a.sourceIndex-b.sourceIndex).map(c=>[c.sourceIndex,c.value,c.sourceCharacterId,c.permittedTargets]),[[1, 5, 73, [1, 5]], [2, 6, 71, [2]], [3, -6, 49, [3]], [4, -5, 51, [4]], [5, 5, 74, [1, 5]], [6, 3, 67, [6]], [7, 1, 63, [7]], [8, -4, 53, [8]], [9, -3, 55, []], [10, -2, 57, []], [11, -1, 59, []], [12, 0, 61, []], [13, 2, 65, []], [14, 4, 69, []]]),'14 source identities and exact division target options');
 demand(isDeepStrictEqual(packet.practice.targets.map(t=>[t.targetIndex,t.left,t.right,t.value,t.sourceCharacterId]),[[1, 35, 7, 5, 118], [2, 36, 6, 6, 106], [3, -36, 6, -6, 108], [4, -25, 5, -5, 110], [5, 40, 8, 5, 120], [6, -15, -5, 3, 112], [7, -2, -2, 1, 114], [8, 24, -6, -4, 116]]) && isDeepStrictEqual(packet.practice.choices.filter(c=>c.paired).map(c=>c.sourceIndex),[1,5]),'eight division rows and two5 tokens');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-130", 1232064], ["sprite-129", 27072], ["sprite-104", 34560]]),'three complete native source buffers');
 demand(packet.practice.help.firstButtonFrame===619 && packet.practice.help.lastButtonFrame===619 && packet.practice.help.hotspots.length===6 && packet.practice.wrong.hotspots.length===0 && packet.practice.clipMasks.length===0,'source619 Help and static wrong explanation');
 demand(isDeepStrictEqual(packet.practice.sourceHotspots.filter(h=>h.ranges.length).map(h=>[h.sourceCharacterId,h.ranges.map(r=>[r.firstFrame,r.lastFrame,r.sourceDepth])]),[[19, [[10, 10, 6], [10, 10, 10], [11, 11, 6], [11, 11, 10], [12, 12, 6], [12, 12, 10], [13, 678, 6], [13, 678, 10]]], [20, [[10, 10, 8], [11, 11, 8], [12, 12, 8], [13, 678, 8]]], [21, [[10, 10, 12], [11, 11, 12], [12, 12, 12], [13, 678, 12]]]]),'all moving source glossary occurrences');
 demand(packet.practice.pairedProductGuard.sha256==='dc3ecfb0c90390449da8c63bb7ceb9d9edcb47bb42f4f6ef024fdc26b989b688','source-bound pairedProductGuard');
 demand(packet.practice.hostTerminal.sha256==='1f03c8bd85eb55c13277e9c02b966cdf14de67a4977d038c42598143639c727c','source-bound hostTerminal');
 demand(packet.practice.sourceColorExtraction.currentState.sha256==='acd4badb651f502f4ec218fc1e2a670f54e562030e3bc7c19eb52df5b1574a94','source alpha0 target evidence');
}
export const readNmsL1P036Binding = readNmsL1P035Binding;
export function readNmsL1P036Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P036Binding(root, NMS_L1_P036_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P036_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P036_ID && packet.entry.key === NMS_L1_P036_ID, 'exact single page');
  demand(packet.source.sha256 === 'fc98e2133c350dcdd464a499239ae7a544e215a210866821130de065518955b9' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 267104, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P036Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P036Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P036_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P036_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P035_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P035_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 43, 'validated preceding43-page lesson');
  const old = base.pages[35];
  demand(old.animationId === NMS_L1_P036_ID && old.placementId === NMS_L1_P036_ID && old.globalPageOrdinal === 36 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 10 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 45 && packet.sourceGlossary.entries.length === 9, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['solution','expression','column','division','group','equivalent','opposite','multiplication','sign'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const existing=glossary.find(e=>e.id===entry.id);
    if(existing)demand(isDeepStrictEqual(existing,projected),'preserve existing glossary');
    else {demand(entry.id==='sign','only the source Sign term may be added');glossary.push(Object.freeze(projected));}
  }
  demand(glossary.length === 46 && new Set(glossary.map(e => e.id)).size === 46, 'preserve45 and add source Sign');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P036_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P036_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-130', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 44 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P036_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P036_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P036_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P036_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P036Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P036Packet();
  return extendNmsL1P036Descriptor(nmsL1P035Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P036_ID));
}
export function nmsL1P036Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P036Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p036-current-js-v1/members/${NMS_L1_P036_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P036Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
