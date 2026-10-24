import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P034Descriptor, readNmsL1P034Binding, NMS_L1_P034_CALIBRATION, NMS_L1_P034_FREEZE} from './g678-nms-l01-p034.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P035_ID = 'shared-nms002-l01-p035';
export const NMS_L1_P035_CALIBRATION = 'g678-nms-l01-p035-current-js-v1';
export const NMS_L1_P035_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p035-current-js-v1.json", "bytes": 341939, "sha256": "5092b2e8621accec3a8b23331d613932fe0ca06ad774ae5843d99f84a135919c"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; livePlaybackEndFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {hotspots: unknown[]}; actions: {mainStops: number[]; hostTerminalStop: number}; choices: {sourceCharacterId: number; value: number; correct: boolean}[]; branches: {kind: string; index: number; sourceCharacterId: number}[]; fields: unknown[]; hostTerminal: Pin; maskSemantics: Pin; mathematicalContent: Pin; activeFeedbackTerminal: Pin; sourceHotspots: {sourceCharacterId: number; ranges: {firstFrame: number; lastFrame: number}[]}[]; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P035_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
 demand(packet.audioPlan.mainFrameCount===623 && packet.audioPlan.questionFrame===245 && packet.audioPlan.outroFirstFrame===246 && packet.audioPlan.mainAudioFirstFrame===9 && packet.audioPlan.livePlaybackEndFrame===623 && packet.practice.actions.hostTerminalStop===623 && isDeepStrictEqual(packet.practice.actions.mainStops,[245]),'source245 hold and bounded host623 stop');
 demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.sourceCharacterId,c.value,c.correct]),[[36, 63, false], [35, 64, false], [37, 65, true], [38, 66, false]]),'four exact source temperature choices');
 demand(isDeepStrictEqual(packet.practice.branches.map(b=>[b.kind,b.index,b.sourceCharacterId]),[["wrong", 1, 235], ["wrong", 2, 185], ["wrong", 3, 199], ["right", 1, 91], ["right", 2, 112], ["right", 3, 169], ["right", 4, 129]]),'bounded host feedback selection');
 demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[["sprite-246", 1129536], ["sprite-235", 48960], ["sprite-185", 51264], ["sprite-199", 45504], ["sprite-91", 43776], ["sprite-112", 56448], ["sprite-169", 52992], ["sprite-129", 48960]]),'eight complete native buffers');
 demand(packet.practice.help.hotspots.length===3 && packet.practice.fields.length===4 && packet.practice.clipMasks.length===2,'source Help and captions');
 const primary=packet.practice.sourceHotspots.filter(h=>h.ranges.length);
 demand(isDeepStrictEqual(primary.map(h=>h.sourceCharacterId),[19,20,21]) && primary.every(h=>isDeepStrictEqual(h.ranges.map(r=>[r.firstFrame,r.lastFrame]),[[9,9],[10,10],[11,11],[12,12],[13,623]])),'three source glossary motion ranges');
 demand(packet.practice.hostTerminal.sha256==='5044f941d0b784dafbebe1634c76873f5aa75431a89da65e882010a1c707bef0','source-bound hostTerminal');
 demand(packet.practice.maskSemantics.sha256==='42f434cd8d7f6e2470b420916c51435394f0050137352f8710764ed5b0d3d8ef','source-bound maskSemantics');
 demand(packet.practice.mathematicalContent.sha256==='1dbc9cf280a75a46a75c3232287f8024b41843bc0830981d9785513d073c81f0','source-bound mathematicalContent');
 demand(packet.practice.activeFeedbackTerminal.sha256==='28fc6a62a4e63eb993be389d44db427a46d073e530ce40cb2019a88524984641','source-bound activeFeedbackTerminal');
}
export const readNmsL1P035Binding = readNmsL1P034Binding;
export function readNmsL1P035Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P035Binding(root, NMS_L1_P035_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P035_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P035_ID && packet.entry.key === NMS_L1_P035_ID, 'exact single page');
  demand(packet.source.sha256 === 'f782359938a02658c23fdfb1b81fee008046a9a56afc3e7c62879870c7d40192' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 382420, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P035Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P035Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P035_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P035_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P034_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P034_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 42, 'validated preceding42-page lesson');
  const old = base.pages[34];
  demand(old.animationId === NMS_L1_P035_ID && old.placementId === NMS_L1_P035_ID && old.globalPageOrdinal === 35 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 9 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 6, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['fahrenheit','temperature','decrease','multiplication','subtraction','solve'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const existing = glossary.find(e => e.id === entry.id);
    if (existing) demand(isDeepStrictEqual(existing, projected), 'preserve existing glossary');
    else { demand(entry.id === 'decrease', 'only the source Decrease term may be added'); glossary.push(Object.freeze(projected)); }
  }
  demand(glossary.length === 45 && new Set(glossary.map(e => e.id)).size === 45, 'one source Decrease glossary addition');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P035_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P035_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-246', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 43 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P035_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P035_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P035_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P035_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P035Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P035Packet();
  return extendNmsL1P035Descriptor(nmsL1P034Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P035_ID));
}
export function nmsL1P035Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P035Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p035-current-js-v1/members/${NMS_L1_P035_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P035Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
