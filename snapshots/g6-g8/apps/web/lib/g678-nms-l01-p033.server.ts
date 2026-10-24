import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P032Descriptor, readNmsL1P032Binding, NMS_L1_P032_CALIBRATION, NMS_L1_P032_FREEZE} from './g678-nms-l01-p032.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P033_ID = 'shared-nms002-l01-p033';
export const NMS_L1_P033_CALIBRATION = 'g678-nms-l01-p033-current-js-v1';
export const NMS_L1_P033_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p033-current-js-v1.json", "bytes": 328110, "sha256": "520c07c4a3583665fc19c44385da28cf2f11b17e7a55a88c864b8b9d6538cbb4"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {hotspots: unknown[]}; actions: {mainStops: number[]; hostTerminalStop: number}; choices: {sourceCharacterId: number; value: number; correct: boolean}[]; branches: {kind: string; index: number; sourceCharacterId: number}[]; fields: unknown[]; hostTerminal: Pin; maskSemantics: Pin; arithmeticGuard: Pin; activeFeedbackTerminal: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P033_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===511 && packet.audioPlan.questionFrame===253 && packet.audioPlan.outroFirstFrame===254 && packet.audioPlan.mainAudioFirstFrame===9 && packet.audioPlan.livePlaybackEndFrame===511 && packet.practice.actions.hostTerminalStop===511 && isDeepStrictEqual(packet.practice.actions.mainStops,[253]),'source253 hold and bounded host511 stop');
 demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.sourceCharacterId,c.value,c.correct]),[[31, 84, false], [33, 86, true], [32, 90, false], [34, 94, false]]),'four exact source earnings choices');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[["wrong", 1, 249], ["wrong", 2, 199], ["wrong", 3, 213], ["right", 1, 105], ["right", 2, 126], ["right", 3, 183], ["right", 4, 143]]),'bounded host feedback selection');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-257", 923328], ["sprite-249", 48960], ["sprite-199", 51264], ["sprite-213", 45504], ["sprite-105", 43776], ["sprite-126", 56448], ["sprite-183", 52992], ["sprite-143", 48960]]),'eight complete native buffers');
 demand(packet.practice.help.hotspots.length===2 && packet.practice.fields.length===4 && packet.practice.clipMasks.length===2,'source Help and captions');
 demand(packet.practice.hostTerminal.sha256==='754e7564332daa761333c6e67c8c9491e17875490b419158d9b98a500954ba57','source-bound hostTerminal');
 demand(packet.practice.maskSemantics.sha256==='402ca0226c2d03da3931468220c7011d22d8e8d4e893df69e1b56e7a825f6a38','source-bound maskSemantics');
 demand(packet.practice.arithmeticGuard.sha256==='547e03b8f35b9410e5ff756b3fe8805abc8c36bfb3dd58c03fdbb4598f564ceb','source-bound arithmeticGuard');
 demand(packet.practice.activeFeedbackTerminal.sha256==='442295cdfd8c56f799361eee0e4cddecbb7d762ac77d613c306f466e7942d0d9','source-bound activeFeedbackTerminal');
}
export const readNmsL1P033Binding = readNmsL1P032Binding;
export function readNmsL1P033Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P033Binding(root, NMS_L1_P033_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P033_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P033_ID && packet.entry.key === NMS_L1_P033_ID, 'exact single page');
  demand(packet.source.sha256 === 'a8aff21f1b22bc62de728af927e685f82314eb8eced3419fff42766f3d5dcec9' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 337708, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P033Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P033Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P033_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P033_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P032_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P032_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 40, 'validated preceding40-page lesson');
  const old = base.pages[32];
  demand(old.animationId === NMS_L1_P033_ID && old.placementId === NMS_L1_P033_ID && old.globalPageOrdinal === 33 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 7 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 2, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['multiplication','solve'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P033_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P033_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-257', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 41 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P033_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P033_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P033_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P033_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P033Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P033Packet();
  return extendNmsL1P033Descriptor(nmsL1P032Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P033_ID));
}
export function nmsL1P033Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P033Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p033-current-js-v1/members/${NMS_L1_P033_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P033Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
