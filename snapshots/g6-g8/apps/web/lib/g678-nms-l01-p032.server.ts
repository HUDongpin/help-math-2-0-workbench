import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P031Descriptor, readNmsL1P031Binding, NMS_L1_P031_CALIBRATION, NMS_L1_P031_FREEZE} from './g678-nms-l01-p031.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P032_ID = 'shared-nms002-l01-p032';
export const NMS_L1_P032_CALIBRATION = 'g678-nms-l01-p032-current-js-v1';
export const NMS_L1_P032_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p032-current-js-v1.json", "bytes": 325125, "sha256": "46ac46d5b4565807b009989d5aebca0c5c33477fefa1adfed562d8bc591a46cc"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {hotspots: unknown[]}; actions: {mainStops: number[]; hostTerminalStop: number}; choices: {sourceCharacterId: number; value: number; correct: boolean}[]; branches: {kind: string; index: number; sourceCharacterId: number}[]; fields: unknown[]; hostTerminal: Pin; maskSemantics: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P032_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===346 && packet.audioPlan.questionFrame===230 && packet.audioPlan.outroFirstFrame===231 && packet.audioPlan.mainAudioFirstFrame===9 && packet.audioPlan.livePlaybackEndFrame===346 && packet.practice.actions.hostTerminalStop===346 && isDeepStrictEqual(packet.practice.actions.mainStops,[230]),'source230 hold and bounded host346 stop');
 demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.sourceCharacterId,c.value,c.correct]),[[31,4000,false],[33,4500,true],[32,5000,false],[34,5500,false]]),'four exact source mountain choices');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[['wrong',1,88],['wrong',2,103],['wrong',3,117],['right',1,144],['right',2,172],['right',3,232],['right',4,204]]),'bounded host feedback selection');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-239',620352],['sprite-88',51264],['sprite-103',45504],['sprite-117',51264],['sprite-144',47232],['sprite-172',48960],['sprite-232',43776],['sprite-204',56448]]),'eight complete native buffers');
 demand(packet.practice.help.hotspots.length===2 && packet.practice.fields.length===4 && packet.practice.clipMasks.length===2 && packet.practice.hostTerminal.sha256==='08d0e99ba03da486be0fb23512373c03e442d79949079a827a7be3b1e035cabb' && packet.practice.maskSemantics.sha256==='1b54c06f5a564dfe630a1cea1a87c4812e26b1b1b005ea30d272d0fea50d7844','source terminal and fill-only mask semantics');
}
export const readNmsL1P032Binding = readNmsL1P031Binding;
export function readNmsL1P032Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P032Binding(root, NMS_L1_P032_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P032_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P032_ID && packet.entry.key === NMS_L1_P032_ID, 'exact single page');
  demand(packet.source.sha256 === 'baba6b4f0d4ebaa9d014f1be2061e6e82e912bfcc1034f69bd33f78a0d570dcc' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 859647, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P032Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P032Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P032_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P032_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P031_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P031_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 39, 'validated preceding39-page lesson');
  const old = base.pages[31];
  demand(old.animationId === NMS_L1_P032_ID && old.placementId === NMS_L1_P032_ID && old.globalPageOrdinal === 32 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 6 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 2, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['integers','opposite-integers'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P032_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P032_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-239', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 40 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P032_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P032_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P032_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P032_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P032Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P032Packet();
  return extendNmsL1P032Descriptor(nmsL1P031Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P032_ID));
}
export function nmsL1P032Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P032Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p032-current-js-v1/members/${NMS_L1_P032_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P032Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
