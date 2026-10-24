import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P025Descriptor,readNmsL1P025Binding,NMS_L1_P025_CALIBRATION,NMS_L1_P025_FREEZE} from './g678-nms-l01-p025.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P026_ID = 'shared-nms002-l01-p026';
export const NMS_L1_P026_CALIBRATION = 'g678-nms-l01-p026-current-js-v1';
export const NMS_L1_P026_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p026-current-js-v1.json',
  bytes: 229211, sha256: 'b860612e70ba77613ef6e27dcacaffb94cf9ba5749fe2ae60f13db18c4de837a',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']; controls: Array<{sourceCharacterId:number;entryId:string;sourceKeyAttribute:string}>};
  source: Pin;
  sourceXml: Pin;
  sourceCatalog: Pin;
  inputs: Pin[];
  outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainFrameDomain:string;mainFrameCount:number;questionFrame:number;mainSegments:unknown[]};
  practice: {actions:{mainStops:number[]};problems:Array<{left:number;right:number;result:number;answerCharacterId:number;frameCount:number}>};
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`NMS_L1_P026_INVALID: ${message}`);
}
export const readNmsL1P026Binding = readNmsL1P025Binding;
export function readNmsL1P026Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P026Binding(root, NMS_L1_P026_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P026_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P026_ID && packet.entry.key === NMS_L1_P026_ID, 'exact single page');
  demand(packet.source.sha256 === 'ab06e54ffd16fa706e1d03ecccec20fb8d3f892f3d970b8175c4f883394a89c3' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 156200, 'source identity');
  demand(packet.audioPlan.mainFrameDomain==='sprite-97'&&packet.audioPlan.mainFrameCount===579&&packet.audioPlan.questionFrame===578&&isDeepStrictEqual(packet.practice.actions.mainStops,[578]),'source question stop policy');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P026Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  demand(isDeepStrictEqual(packet.practice.problems.map(p=>[p.left,p.right,p.result,p.answerCharacterId,p.frameCount]),[[45,3,15,71,53],[24,12,2,59,14],[24,2,12,62,44],[15,5,3,67,16],[35,7,5,96,23],[35,5,7,95,29],[40,8,5,76,22],[50,10,5,81,27],[36,6,6,86,32],[42,7,6,91,32]]),'ten source division questions and answer stops');
  demand(isDeepStrictEqual(packet.audioPlan.mainSegments,[{"firstFrame":4,"firstDecodedSample":1673,"endDecodedSample":323136},{"firstFrame":221,"firstDecodedSample":323585,"endDecodedSample":571392},{"firstFrame":424,"firstDecodedSample":571504,"endDecodedSample":857664}]),'three source audio segments');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original calibrations and their source evidence retain their own identity. */
export function extendNmsL1P026Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameDomain==='sprite-97'&&packet.audioPlan.mainFrameCount===579&&packet.audioPlan.questionFrame===578&&isDeepStrictEqual(packet.practice.actions.mainStops,[578]),'source question stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P026_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P026_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId===NMS_L1_P025_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P025_FREEZE.sha256&&base.productBridge.registeredAnimationCount===33,'validated preceding33-page lesson');
  const old = base.pages[25];
  demand(old.animationId === NMS_L1_P026_ID && old.placementId === NMS_L1_P026_ID && old.globalPageOrdinal === 26 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 15 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 44 && base.glossary.some(e=>e.id==='multiplication'), 'source glossary predecessor');
  demand(packet.sourceGlossary.entries.length===0 && packet.sourceGlossary.controls.length===0, 'no source glossary actions');
  const glossary=base.glossary;
  demand(glossary.length===44&&new Set(glossary.map(e=>e.id)).size===44,'preserve44 existing source terms');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P026_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P026_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-97', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary:Object.freeze(glossary), calibrationId: NMS_L1_P026_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P026_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P026_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P026_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P026Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P026Packet(), predecessor=nmsL1P025Descriptor();
  return extendNmsL1P026Descriptor(predecessor, packet, localOnlyAnimationModuleRegistration(NMS_L1_P026_ID));
}
export function nmsL1P026Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL1P026Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p026-current-js-v1/members/${NMS_L1_P026_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P026Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

