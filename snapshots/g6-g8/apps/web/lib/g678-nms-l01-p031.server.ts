import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P030Descriptor, readNmsL1P030Binding, NMS_L1_P030_CALIBRATION, NMS_L1_P030_FREEZE} from './g678-nms-l01-p030.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P031_ID = 'shared-nms002-l01-p031';
export const NMS_L1_P031_CALIBRATION = 'g678-nms-l01-p031-current-js-v1';
export const NMS_L1_P031_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p031-current-js-v1.json", "bytes": 352044, "sha256": "07465b12fd94ec6eea69cd9d16a159b3ae7734f34409199ff0d669e109bebd92"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {hotspots: unknown[]}; actions: {mainStops: number[]; questionFrames: number[]; answerFrames: number[]; finalSourceStop: number}; problems: {left: number; right: number; result: number; nextCharacterId: number; questionFrame: number; answerFrame: number}[]; branches: {kind: string; index: number; sourceCharacterId: number}[]; fields: unknown[]; productGuard: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P031_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===605 && packet.audioPlan.questionFrame===542 && packet.audioPlan.outroFirstFrame===549 && packet.audioPlan.mainAudioFirstFrame===4 && packet.audioPlan.livePlaybackEndFrame===604 && packet.practice.actions.finalSourceStop===604 && isDeepStrictEqual(packet.practice.actions.mainStops,[542,543,544,545,546,547,548,604,605]),'four question holds and explicit549..604 repair');
 demand(isDeepStrictEqual(packet.practice.problems.map(p=>[p.left,p.right,p.result,p.questionFrame,p.answerFrame,p.nextCharacterId]),[[6,9,15,542,543,336],[12,15,27,544,545,349],[32,49,81,546,547,361],[37,17,54,548,549,361]]),'four exact source additions');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[['wrong',1,169],['wrong',2,200],['wrong',3,134],['right',1,310],['right',2,252],['right',3,217],['right',4,231]]),'bounded host feedback selection');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-374',1105344],['sprite-169',48960],['sprite-200',48960],['sprite-134',52992],['sprite-310',43776],['sprite-252',56448],['sprite-217',48960],['sprite-231',54720],['sprite-336',71424],['sprite-349',71424],['sprite-361',71424]]),'eleven complete native buffers');
 demand(packet.practice.help.hotspots.length===1 && packet.practice.fields.length===9 && packet.practice.clipMasks.length===2 && packet.practice.productGuard.sha256==='7d95a22bbe243eadef6c1774d472e9c683326e56bbb2f5aa7b0a9249b520b618','source fields and explicit four-question product repair');
}
export const readNmsL1P031Binding = readNmsL1P030Binding;
export function readNmsL1P031Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P031Binding(root, NMS_L1_P031_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P031_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P031_ID && packet.entry.key === NMS_L1_P031_ID, 'exact single page');
  demand(packet.source.sha256 === '3ac14a522b818900e75c202e149d29e613844b61b68edb2b2d4cc82c7051a77e' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 385362, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P031Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P031Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P031_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P031_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P030_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P030_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 38, 'validated preceding38-page lesson');
  const old = base.pages[30];
  demand(old.animationId === NMS_L1_P031_ID && old.placementId === NMS_L1_P031_ID && old.globalPageOrdinal === 31 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 5 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 2, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['solution','number-line'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P031_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P031_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-374', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 39 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P031_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P031_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P031_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P031_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P031Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P031Packet();
  return extendNmsL1P031Descriptor(nmsL1P030Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P031_ID));
}
export function nmsL1P031Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P031Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p031-current-js-v1/members/${NMS_L1_P031_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P031Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
