import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P024Descriptor,readNmsL1P024Binding,NMS_L1_P024_CALIBRATION,NMS_L1_P024_FREEZE} from './g678-nms-l01-p024.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P025_ID = 'shared-nms002-l01-p025';
export const NMS_L1_P025_CALIBRATION = 'g678-nms-l01-p025-current-js-v1';
export const NMS_L1_P025_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p025-current-js-v1.json',
  bytes: 35181, sha256: 'a7a60144d68597d4dfe2518dbc5fdeeccc74d2b4a9f88c97d10495098205df7b',
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
  hostedPlayback: {kind:string;frameDomain:string;stopFrame:number};
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`NMS_L1_P025_INVALID: ${message}`);
}
export const readNmsL1P025Binding = readNmsL1P024Binding;
export function readNmsL1P025Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P025Binding(root, NMS_L1_P025_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P025_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P025_ID && packet.entry.key === NMS_L1_P025_ID, 'exact single page');
  demand(packet.source.sha256 === '2df9773f0ac3a30efe982b3e9ff1377672790ec8890a1d6bf548177b0f037fdc' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 121386, 'source identity');
  demand(packet.hostedPlayback.kind==='once-source-host-terminal'&&packet.hostedPlayback.frameDomain==='sprite-38'&&packet.hostedPlayback.stopFrame===337,'source host terminal policy');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P025Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original calibrations and their source evidence retain their own identity. */
export function extendNmsL1P025Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.hostedPlayback.kind==='once-source-host-terminal'&&packet.hostedPlayback.stopFrame===337,'source host terminal policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P025_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P025_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId===NMS_L1_P024_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P024_FREEZE.sha256&&base.productBridge.registeredAnimationCount===32,'validated preceding32-page lesson');
  const old = base.pages[24];
  demand(old.animationId === NMS_L1_P025_ID && old.placementId === NMS_L1_P025_ID && old.globalPageOrdinal === 25 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 14 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 41 && base.glossary.some(e=>e.id==='multiplication'), 'source glossary predecessor');
  demand(packet.sourceGlossary.entries.length===5 && packet.sourceGlossary.controls.length===5, 'five authored glossary keys');
  const glossary=[...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(["multiplication","opposite","division","group","equivalent"].includes(entry.id), 'exact glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const old=glossary.find(e=>e.id===entry.id);
    if(old)demand(isDeepStrictEqual(old,projected),'preserve existing glossary');else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===44 && new Set(glossary.map(e=>e.id)).size===44 && isDeepStrictEqual(glossary.filter(e=>!['division','equivalent','group'].includes(e.id)),base.glossary), 'three source glossary additions preserve41 existing terms');
  for(const control of packet.sourceGlossary.controls)demand(glossary.some(e=>e.id===control.entryId && e.sourceKeyAttribute.toLowerCase()===control.sourceKeyAttribute.toLowerCase()),'every source glossary resolves');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P025_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P025_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-38', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary:Object.freeze(glossary), calibrationId: NMS_L1_P025_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P025_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P025_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P025_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P025Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P025Packet(), predecessor=nmsL1P024Descriptor();
  return extendNmsL1P025Descriptor(predecessor, packet, localOnlyAnimationModuleRegistration(NMS_L1_P025_ID));
}
export function nmsL1P025Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL1P025Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p025-current-js-v1/members/${NMS_L1_P025_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P025Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

