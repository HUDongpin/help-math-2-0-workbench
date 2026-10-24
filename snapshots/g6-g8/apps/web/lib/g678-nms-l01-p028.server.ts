import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P027Descriptor, readNmsL1P027Binding, NMS_L1_P027_CALIBRATION, NMS_L1_P027_FREEZE} from './g678-nms-l01-p027.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P028_ID = 'shared-nms002-l01-p028';
export const NMS_L1_P028_CALIBRATION = 'g678-nms-l01-p028-current-js-v1';
export const NMS_L1_P028_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p028-current-js-v1.json", "bytes": 318854, "sha256": "b7bdbe3d10276555e519d7a544ccdadf6284dab7ccbd6ccd9edb4f23f077d7a2"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string}[]};
  practice: {introExample: {value: number; learnerDraggable: boolean}; help: {firstButtonFrame: number; lastButtonFrame: number}; actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; value: number; sourceCharacterId: number; target: {sourceCharacterId: number}}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P028_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
  demand(packet.audioPlan.mainFrameCount === 195 && packet.audioPlan.questionFrame === 194 && packet.audioPlan.outroFirstFrame === 195 &&
    packet.practice.actions.correctContinuation === 195 && isDeepStrictEqual(packet.practice.actions.mainStops, [194,195]), 'source stops and final continuation');
  demand(isDeepStrictEqual(packet.practice.choices.map(c => [c.sourceIndex,c.value,c.sourceCharacterId,c.target.sourceCharacterId]), [[1,-8,80,79],[2,-2,81,73],[3,0,82,74],[4,-4,83,71],[5,2,84,75],[6,4,85,76],[7,8,86,77],[8,9,87,78]]), 'eight source suffix mappings');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c => c.frameDomain), ['sprite-123','sprite-118','sprite-122']), 'three active MP3 streams');
  demand(packet.audioPlan.mainAudioFirstFrame===17 && packet.practice.introExample.value===-9 && packet.practice.introExample.learnerDraggable===false,'source example and narration');
  demand(packet.practice.help.firstButtonFrame===194 && packet.practice.help.lastButtonFrame===194,'source194 Help only');
}
export const readNmsL1P028Binding = readNmsL1P027Binding;
export function readNmsL1P028Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P028Binding(root, NMS_L1_P028_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P028_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P028_ID && packet.entry.key === NMS_L1_P028_ID, 'exact single page');
  demand(packet.source.sha256 === '1309c39e9a0bc69561132a8e0bd8ec605ceee7decaba250bddf44951c0a15799' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 101975, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P028Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P028Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P028_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P028_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P027_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P027_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 35, 'validated preceding35-page lesson');
  const old = base.pages[27];
  demand(old.animationId === NMS_L1_P028_ID && old.placementId === NMS_L1_P028_ID && old.globalPageOrdinal === 28 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 2 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 6, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['counting-numbers','integers','natural-number','number-line','position','set'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P028_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P028_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-123', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 36 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P028_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P028_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P028_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P028_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P028Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P028Packet();
  return extendNmsL1P028Descriptor(nmsL1P027Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P028_ID));
}
export function nmsL1P028Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P028Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p028-current-js-v1/members/${NMS_L1_P028_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P028Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
