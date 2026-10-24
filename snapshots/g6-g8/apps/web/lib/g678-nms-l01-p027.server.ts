import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P026Descriptor, readNmsL1P026Binding, NMS_L1_P026_CALIBRATION, NMS_L1_P026_FREEZE} from './g678-nms-l01-p026.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P027_ID = 'shared-nms002-l01-p027';
export const NMS_L1_P027_CALIBRATION = 'g678-nms-l01-p027-current-js-v2';
export const NMS_L1_P027_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p027-current-js-v2.json", "bytes": 817945, "sha256": "a87dad331ae9f8aee312bec8591c9d55ab5ed588bdceca9093089a1bcf9ea9aa"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string}[]};
  practice: {actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; sourceCharacterId: number; target: {sourceCharacterId: number; row: number}}[]; pictures: {sourceCharacterId: number}[]; dormantSource: {activePlayback: boolean}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P027_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
  demand(packet.audioPlan.mainFrameCount === 357 && packet.audioPlan.questionFrame === 330 && packet.audioPlan.outroFirstFrame === 331 &&
    packet.practice.actions.correctContinuation === 331 && isDeepStrictEqual(packet.practice.actions.mainStops, [330,357]), 'source stops and final continuation');
  demand(isDeepStrictEqual(packet.practice.choices.map(c => [c.sourceIndex,c.sourceCharacterId,c.target.sourceCharacterId,c.target.row]), [[1,93,92,4],[2,94,91,3],[3,95,89,1],[4,96,90,2]]), 'four source suffix mappings');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c => c.frameDomain), ['sprite-344','sprite-335','sprite-343']), 'three active MP3 streams');
  demand(isDeepStrictEqual(packet.practice.pictures.map(p=>p.sourceCharacterId),[98,100,103,106]),'four source pictures');
  demand(packet.practice.dormantSource.length===5 && packet.practice.dormantSource.every(d=>d.activePlayback===false),'five stopped source domains');
}
export const readNmsL1P027Binding = readNmsL1P026Binding;
export function readNmsL1P027Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P027Binding(root, NMS_L1_P027_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P027_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P027_ID && packet.entry.key === NMS_L1_P027_ID, 'exact single page');
  demand(packet.source.sha256 === 'dc386a58be9dabe0d3a6eabed5664551cfa35d6f10d17bcf95a94ba4c01a09d0' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 618675, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P027Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P027Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P027_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P027_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P026_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P026_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 34, 'validated preceding34-page lesson');
  const old = base.pages[26];
  demand(old.animationId === NMS_L1_P027_ID && old.placementId === NMS_L1_P027_ID && old.globalPageOrdinal === 27 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 8, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['counting-numbers','direction','distance','group','integers','natural-number','number-line','set'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P027_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P027_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-344', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 35 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P027_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P027_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P027_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P027_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P027Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P027Packet();
  return extendNmsL1P027Descriptor(nmsL1P026Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P027_ID));
}
export function nmsL1P027Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P027Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p027-current-js-v1/members/${NMS_L1_P027_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P027Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
