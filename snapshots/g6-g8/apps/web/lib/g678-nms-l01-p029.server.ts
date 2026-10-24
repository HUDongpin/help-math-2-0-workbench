import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P028Descriptor, readNmsL1P028Binding, NMS_L1_P028_CALIBRATION, NMS_L1_P028_FREEZE} from './g678-nms-l01-p028.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P029_ID = 'shared-nms002-l01-p029';
export const NMS_L1_P029_CALIBRATION = 'g678-nms-l01-p029-current-js-v1';
export const NMS_L1_P029_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p029-current-js-v1.json", "bytes": 351171, "sha256": "b2ff48fc84b23f74b64c5a8db62f4193e7df44f11e9983fbbee179a3408bc5ed"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {firstButtonFrame: number; lastButtonFrame: number; hotspots: unknown[]}; wrong: {hotspots: unknown[]}; actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; value: number; sourceCharacterId: number; canMatch: boolean; target: {sourceCharacterId: number} | null}[]; targets: {sourceIndex: number; givenValue: number; value: number; sourceCharacterId: number}[]; clipMasks: {characterId: number; placements: {depth: number; clipDepth: number}[]}[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P029_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
  demand(packet.audioPlan.mainFrameCount===437 && packet.audioPlan.questionFrame===396 && packet.audioPlan.outroFirstFrame===397 && packet.audioPlan.mainAudioFirstFrame===9 && packet.practice.actions.correctContinuation===397 && isDeepStrictEqual(packet.practice.actions.mainStops,[396,437]),'source396 hold and397..437 continuation');
  demand(isDeepStrictEqual(packet.practice.choices.map(c=>[c.sourceIndex,c.value,c.sourceCharacterId,c.target?.sourceCharacterId??null]),[[5,-6,51,null],[2,-5,63,48],[6,-4,52,null],[7,-3,53,null],[0,-2,54,46],[8,-1,55,null],[4,0,56,50],[9,1,57,null],[10,2,58,null],[11,3,59,null],[3,4,60,49],[12,5,61,null],[1,6,62,47]]),'13 source suffix choices including real0');
  demand(isDeepStrictEqual(packet.practice.targets.map(t=>[t.sourceIndex,t.givenValue,t.value,t.sourceCharacterId]),[[0,2,-2,46],[1,-6,6,47],[2,5,-5,48],[3,-4,4,49],[4,0,0,50]]) && packet.practice.choices.filter(c=>c.canMatch).length===5,'five exact opposite pairs and eight distractors');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-327',786816],['sprite-318',27072],['sprite-326',34560]]),'actual native MP3 samples, excluding declared excess');
  demand(packet.practice.help.firstButtonFrame===396 && packet.practice.help.lastButtonFrame===396 && packet.practice.help.hotspots.length===4 && packet.practice.wrong.hotspots.length===4,'source396 Help and independent wrong glossary');
  demand(isDeepStrictEqual(packet.practice.clipMasks.map(m=>[m.characterId,m.placements]),[[40,[{depth:57,clipDepth:59},{depth:60,clipDepth:62}]]]),'two source40 reveal masks');
}
export const readNmsL1P029Binding = readNmsL1P028Binding;
export function readNmsL1P029Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P029Binding(root, NMS_L1_P029_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P029_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P029_ID && packet.entry.key === NMS_L1_P029_ID, 'exact single page');
  demand(packet.source.sha256 === '1570b465737d854cc5ecf2bf294e5ae87675b428d7b7c132b6b85e405704d048' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 1197719, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P029Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P029Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P029_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P029_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P028_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P028_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 36, 'validated preceding36-page lesson');
  const old = base.pages[28];
  demand(old.animationId === NMS_L1_P029_ID && old.placementId === NMS_L1_P029_ID && old.globalPageOrdinal === 29 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 3 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 5, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['column','opposite-integers','value','direction','distance'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P029_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P029_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-327', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 37 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P029_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P029_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P029_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P029_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P029Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P029Packet();
  return extendNmsL1P029Descriptor(nmsL1P028Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P029_ID));
}
export function nmsL1P029Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P029Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p029-current-js-v1/members/${NMS_L1_P029_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P029Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
