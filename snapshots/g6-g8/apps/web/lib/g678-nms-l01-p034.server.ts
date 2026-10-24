import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P033Descriptor, readNmsL1P033Binding, NMS_L1_P033_CALIBRATION, NMS_L1_P033_FREEZE} from './g678-nms-l01-p033.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P034_ID = 'shared-nms002-l01-p034';
export const NMS_L1_P034_CALIBRATION = 'g678-nms-l01-p034-current-js-v1';
export const NMS_L1_P034_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p034-current-js-v1.json", "bytes": 332326, "sha256": "d3cbc208951b92d457f217b18294c2110beb1280c559cc9526cd54315a65955a"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {hotspots: unknown[]}; actions: {mainStops: number[]; hostTerminalStop: number}; choices: {sourceCharacterId: number; value: number; correct: boolean}[]; branches: {kind: string; index: number; sourceCharacterId: number}[]; fields: unknown[]; hostTerminal: Pin; maskSemantics: Pin; teachingLabelGuard: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P034_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===625 && packet.audioPlan.questionFrame===290 && packet.audioPlan.outroFirstFrame===291 && packet.audioPlan.mainAudioFirstFrame===9 && packet.audioPlan.livePlaybackEndFrame===625 && packet.practice.actions.hostTerminalStop===625 && isDeepStrictEqual(packet.practice.actions.mainStops,[290]),'source290 hold and bounded host625 stop');
 demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.sourceCharacterId,c.value,c.correct]),[[33, 2, true], [31, 3, false], [32, 4, false], [34, 5, false]]),'four exact source raisin choices');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[["wrong", 1, 81], ["wrong", 2, 96], ["wrong", 3, 110], ["right", 1, 138], ["right", 2, 166], ["right", 3, 226], ["right", 4, 198]]),'bounded host feedback selection');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-231", 1132992], ["sprite-81", 51264], ["sprite-96", 45504], ["sprite-110", 51264], ["sprite-138", 47232], ["sprite-166", 48960], ["sprite-226", 43776], ["sprite-198", 56448]]),'eight complete native buffers');
 demand(packet.practice.help.hotspots.length===3 && packet.practice.fields.length===4 && packet.practice.clipMasks.length===2,'source Help and captions');
 demand(packet.practice.hostTerminal.sha256==='48edea1fd58527158d915b6d36d4034e18e8350a73485e15c668fdf10f02f4a7','source-bound hostTerminal');
 demand(packet.practice.maskSemantics.sha256==='1ee83da10c9653bf0b8d9a06ab9103e14f5a60f06c2e050b775b9e163cdf5c74','source-bound maskSemantics');
 demand(packet.practice.teachingLabelGuard.sha256==='4b2a3c29a023e190507c0df83b534e18ba558559c20ac03725df3d379b3dc8b5','source-bound teachingLabelGuard');
}
export const readNmsL1P034Binding = readNmsL1P033Binding;
export function readNmsL1P034Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P034Binding(root, NMS_L1_P034_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P034_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P034_ID && packet.entry.key === NMS_L1_P034_ID, 'exact single page');
  demand(packet.source.sha256 === 'ceeb9f0693e7ddcf85642ee66f8b6e8ef7a5be8ab3d4d6d9e9b9cb4eedb87f63' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 960950, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P034Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P034Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P034_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P034_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P033_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P033_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 41, 'validated preceding41-page lesson');
  const old = base.pages[33];
  demand(old.animationId === NMS_L1_P034_ID && old.placementId === NMS_L1_P034_ID && old.globalPageOrdinal === 34 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 8 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 3, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['addition','subtraction','solve'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P034_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P034_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-231', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 42 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P034_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P034_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P034_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P034_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P034Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P034Packet();
  return extendNmsL1P034Descriptor(nmsL1P033Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P034_ID));
}
export function nmsL1P034Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P034Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p034-current-js-v1/members/${NMS_L1_P034_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P034Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
