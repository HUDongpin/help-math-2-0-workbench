import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P037Descriptor, readNmsL1P037Binding, NMS_L1_P037_CALIBRATION, NMS_L1_P037_FREEZE} from './g678-nms-l01-p037.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P045_ID = 'shared-nms002-l01-p045';
export const NMS_L1_P045_CALIBRATION = 'g678-nms-l01-p045-current-js-v1';
export const NMS_L1_P045_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p045-current-js-v1.json", "bytes": 363392, "sha256": "7f1a3a1915c966692b7b26a7746780770b4ae4914692a8b52f9429a508e5ae1b"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {actions: {mainStops: number[]}; choices: {letter: string; sourceInstanceName: string; value: number; correct: boolean}[]; holds: {mainFrame: number; primarySourceHitBounds: null; secondaryCharacterId: number}[]; strategies: {sourceCharacterId: number; mainFrame: number; waitFrame: number; frameCount: number}[]; branches: {kind: string; index: number; sourceCharacterId: number; frameCount: number}[]; help: {hotspots: {entryId: string}[]}; fields: unknown[]; clipMasks: {placements: unknown[]}[]; teachingFlowGuard: Pin; hostTerminal: Pin; mathematicalContent: Pin; hostReachability: Pin};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P045_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===835 && packet.audioPlan.questionFrame===813 && packet.audioPlan.outroFirstFrame===814 && packet.audioPlan.livePlaybackEndFrame===832 && packet.audioPlan.mainAudioFirstFrame===9 && isDeepStrictEqual(packet.practice.actions.mainStops,[388,525,651,773,813,832]),'five source input holds and832 live stop');
 demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.letter,c.sourceInstanceName,c.value,c.correct]),[["A", "AnsBtn1", 65, false], ["B", "AnsBtn4", 85, false], ["C", "AnsBtn3", 90, true], ["D", "AnsBtn2", 100, false]]),'source letter/value/instance binding');
 demand(isDeepStrictEqual(packet.practice.holds.map(h=>[h.mainFrame,h.primarySourceHitBounds,h.secondaryCharacterId]),[[388,null,47],[525,null,47],[651,null,47],[773,null,47]]),'empty45 and geometric47 teaching controls');
 demand(isDeepStrictEqual(packet.practice.strategies.map(s=>[s.sourceCharacterId,s.mainFrame,s.waitFrame,s.frameCount]),[[110,651,15,20],[146,773,55,61]]),'independent source strategy waits');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId,b.frameCount]),[["wrong", 1, 185, 31], ["wrong", 2, 171, 28], ["wrong", 3, 196, 29], ["right", 1, 270, 33], ["right", 2, 249, 32], ["right", 3, 235, 31], ["right", 4, 209, 28]]),'seven host-selected branches');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-290", 1505664], ["sprite-185", 52992], ["sprite-171", 48960], ["sprite-196", 51264], ["sprite-270", 56448], ["sprite-249", 54720], ["sprite-235", 52992], ["sprite-209", 51264]]),'eight complete native source buffers');
 demand(packet.practice.fields.length===0 && packet.practice.clipMasks.length===8 && packet.practice.clipMasks.reduce((n,m)=>n+m.placements.length,0)===11 && isDeepStrictEqual(packet.practice.help.hotspots.map(h=>h.entryId),['multiplication','subtraction']),'eight masks and two Help glossary terms');
 demand(packet.practice.teachingFlowGuard.sha256==='9116c270054ff60a811c9b523578e5ddbf9fbec2ce858a46d215c9f30c6ab4b9','source-bound teachingFlowGuard');
 demand(packet.practice.hostTerminal.sha256==='fdfa76adc916930b9a27ded297865939269dbe377b13b5bac32f3fcabd480cef','source-bound hostTerminal');
 demand(packet.practice.mathematicalContent.sha256==='6695093c1c7468adf0307ea9e24caff2dccd7fce803d9720248d4921e3b0653c','source-bound mathematicalContent');
 demand(packet.practice.hostReachability.sha256==='f590e66c33dc3787a2b040c5aafe26b4252f05f6aca8070cdc202cb441f5b215','source-bound hostReachability');
}
export const readNmsL1P045Binding = readNmsL1P037Binding;
export function readNmsL1P045Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P045Binding(root, NMS_L1_P045_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P045_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P045_ID && packet.entry.key === NMS_L1_P045_ID, 'exact single page');
  demand(packet.source.sha256 === 'dce152af93c1bb221d02f1c09fd7265a3ebde88f47d0e39381d6f978bc3e1651' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 541218, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P045Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P045Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P045_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P045_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P037_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P037_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 45, 'validated preceding45-page lesson');
  const old = base.pages[44];
  demand(old.animationId === NMS_L1_P045_ID && old.placementId === NMS_L1_P045_ID && old.globalPageOrdinal === 45 &&
    old.sectionCode === 'TS' && old.sectionPageOrdinal === 8 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length===46 && isDeepStrictEqual(packet.sourceGlossary.entries.map(e=>e.id),['multiplication','subtraction']),'preserve46 terms with two Help-only source bindings');
  for(const entry of packet.sourceGlossary.entries){
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    demand(isDeepStrictEqual(base.glossary.find(e=>e.id===entry.id),projected),'existing source glossary bytes');
  }
  const glossary=[...base.glossary];
  const pages = base.pages.map(page => page.animationId === NMS_L1_P045_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P045_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-290', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 46 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P045_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P045_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P045_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P045_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P045Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P045Packet();
  return extendNmsL1P045Descriptor(nmsL1P037Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P045_ID));
}
export function nmsL1P045Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P045Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p045-current-js-v1/members/${NMS_L1_P045_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P045Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
