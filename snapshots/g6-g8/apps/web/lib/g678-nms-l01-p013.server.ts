import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P011Descriptor, readNmsL1P011Binding, NMS_L1_P011_CALIBRATION, NMS_L1_P011_FREEZE} from './g678-nms-l01-p011.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P013_ID = 'shared-nms002-l01-p013';
export const NMS_L1_P013_CALIBRATION = 'g678-nms-l01-p013-current-js-v1';
export const NMS_L1_P013_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p013-current-js-v1.json", "bytes": 311931, "sha256": "5501133b5474793746cf4aa40d550d1c288211c6e67696905bd2ece21e58cbe5"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string}[]};
  practice: {actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; value: number; sourceCharacterId: number; target: {sourceCharacterId: number}}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P013_INVALID: ${message}`); }
export const readNmsL1P013Binding = readNmsL1P011Binding;
export function readNmsL1P013Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P013Binding(root, NMS_L1_P013_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P013_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P013_ID && packet.entry.key === NMS_L1_P013_ID, 'exact single page');
  demand(packet.source.sha256 === '3be54c99a5fdad5aa5e31dd736039d5b4bdc00980a793c317f8ae9543d5ddfcb' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 122668, 'source identity');
  demand(packet.audioPlan.mainFrameCount === 243 && packet.audioPlan.questionFrame === 196 && packet.audioPlan.outroFirstFrame === 197 &&
    packet.practice.actions.correctContinuation === 197 && isDeepStrictEqual(packet.practice.actions.mainStops, [196,243]), 'source stops and final continuation');
  demand(isDeepStrictEqual(packet.practice.choices.map(c => [c.sourceIndex,c.value,c.sourceCharacterId,c.target.sourceCharacterId]), [[1,-7,70,58],[2,-3,71,60],[3,0,72,64],[4,-1,73,62],[5,1,74,65],[6,3,75,66],[7,7,76,67],[8,9,77,68]]), 'eight source suffix mappings');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c => c.frameDomain), ['sprite-112','sprite-103','sprite-111']), 'three active MP3 streams');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P013Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P013Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P013_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P013_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P011_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P011_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 21, 'validated preceding21-page lesson');
  const old = base.pages[12];
  demand(old.animationId === NMS_L1_P013_ID && old.placementId === NMS_L1_P013_ID && old.globalPageOrdinal === 13 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 2 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 31 && packet.sourceGlossary.entries.length === 6, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['counting-numbers','integers','natural-number','number-line','position','set'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 31 && new Set(glossary.map(e => e.id)).size === 31, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P013_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P013_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-112', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 22 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P013_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P013_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P013_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P013_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P013Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P013Packet();
  return extendNmsL1P013Descriptor(nmsL1P011Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P013_ID));
}
export function nmsL1P013Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P013Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p013-current-js-v1/members/${NMS_L1_P013_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P013Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
