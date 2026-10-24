import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P029Descriptor, readNmsL1P029Binding, NMS_L1_P029_CALIBRATION, NMS_L1_P029_FREEZE} from './g678-nms-l01-p029.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P030_ID = 'shared-nms002-l01-p030';
export const NMS_L1_P030_CALIBRATION = 'g678-nms-l01-p030-current-js-v1';
export const NMS_L1_P030_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p030-current-js-v1.json", "bytes": 337341, "sha256": "2dc63bf797db00da6f06cc85fa0a2822a6413d2b83809cc0252ccb6af9f08ae2"});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainAudioFirstFrame: number; mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string; decoder: {decodedSamples: number}}[]};
  practice: {help: {firstButtonFrame: number; lastButtonFrame: number; hotspots: unknown[]}; wrong: {hotspots: unknown[]}; actions: {mainStops: number[]; correctContinuation: number}; choices: {sourceIndex: number; value: number; sourceCharacterId: number; paired: boolean; permittedTargets: number[]}[]; targets: {targetIndex: number; givenValue: number; value: number; sourceCharacterId: number}[]; pairedProductGuard: Pin; clipMasks: unknown[]};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P030_INVALID: ${message}`); }
function assertSourceQuestion(packet: Packet) {
  demand(packet.audioPlan.mainFrameCount===450 && packet.audioPlan.questionFrame===449 && packet.audioPlan.outroFirstFrame===450 && packet.audioPlan.mainAudioFirstFrame===9 && packet.practice.actions.correctContinuation===450 && isDeepStrictEqual(packet.practice.actions.mainStops,[449,450]),'source449 hold and450 immediate stop');
  demand(isDeepStrictEqual([...packet.practice.choices].sort((a,b)=>a.sourceIndex-b.sourceIndex).map(c=>[c.sourceIndex,c.value,c.sourceCharacterId,c.permittedTargets]),[[1,2,70,[1]],[2,4,79,[2,4]],[3,0,68,[3]],[4,4,72,[2,4]],[5,6,74,[5]],[6,1,69,[6,7]],[7,1,80,[6,7]],[8,3,71,[8]],[9,-6,62,[]],[10,-5,63,[]],[11,-4,64,[]],[12,-3,65,[]],[13,-2,66,[]],[14,-1,67,[]],[15,5,73,[]]]),'15 source identities and exact target options');
  demand(isDeepStrictEqual(packet.practice.targets.map(t=>[t.targetIndex,t.givenValue,t.value,t.sourceCharacterId]),[[1,2,2,53],[2,-4,4,54],[3,0,0,55],[4,4,4,61],[5,6,6,56],[6,1,1,60],[7,-1,1,58],[8,-3,3,59]]) && isDeepStrictEqual(packet.practice.choices.filter(c=>c.paired).map(c=>c.sourceIndex),[6,4,2,7]),'eight source rows and four paired tokens');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c=>[c.frameDomain,c.decoder.decodedSamples]),[['sprite-113',811584],['sprite-108',27072],['sprite-112',34560]]),'three complete native source buffers');
  demand(packet.practice.help.firstButtonFrame===449 && packet.practice.help.lastButtonFrame===449 && packet.practice.help.hotspots.length===3 && packet.practice.wrong.hotspots.length===0,'source449 Help and static wrong explanation');
  demand(packet.practice.clipMasks.length===0 && packet.practice.pairedProductGuard.sha256==='681c2da385bb8713549607042f05108502b77d066c4ef36e727ea79d27acc53c','bounded immutable assignment product guard');
}
export const readNmsL1P030Binding = readNmsL1P029Binding;
export function readNmsL1P030Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P030Binding(root, NMS_L1_P030_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P030_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P030_ID && packet.entry.key === NMS_L1_P030_ID, 'exact single page');
  demand(packet.source.sha256 === '6a0083957bff3132bf4c1d573d21bbc18eabfcd9ad458efd20baa59a560405cc' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 186893, 'source identity');
  assertSourceQuestion(packet);
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P030Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P030Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  assertSourceQuestion(packet);
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P030_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P030_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P029_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P029_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 37, 'validated preceding37-page lesson');
  const old = base.pages[29];
  demand(old.animationId === NMS_L1_P030_ID && old.placementId === NMS_L1_P030_ID && old.globalPageOrdinal === 30 &&
    old.sectionCode === 'TI' && old.sectionPageOrdinal === 4 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && packet.sourceGlossary.entries.length === 5, 'existing lesson glossary');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['absolute-value','column','distance','integers','number-line'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    demand(isDeepStrictEqual(glossary.find(e => e.id === entry.id), projected), 'preserve existing glossary');
  }
  demand(glossary.length === 44 && new Set(glossary.map(e => e.id)).size === 44, 'no glossary additions');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P030_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P030_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-113', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 38 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P030_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P030_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P030_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P030_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P030Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P030Packet();
  return extendNmsL1P030Descriptor(nmsL1P029Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P030_ID));
}
export function nmsL1P030Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P030Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p030-current-js-v1/members/${NMS_L1_P030_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P030Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
