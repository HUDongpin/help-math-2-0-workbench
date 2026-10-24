import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P022Descriptor,readNmsL1P022Binding,NMS_L1_P022_CALIBRATION,NMS_L1_P022_FREEZE} from './g678-nms-l01-p022.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P023_ID = 'shared-nms002-l01-p023';
export const NMS_L1_P023_CALIBRATION = 'g678-nms-l01-p023-current-js-v1';
export const NMS_L1_P023_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p023-current-js-v1.json',
  bytes: 44151, sha256: 'ec9c01d74f44ca66879acd263475eccce463e3f07d08b842317c7e59cecfd233',
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
  if (!value) throw Error(`NMS_L1_P023_INVALID: ${message}`);
}
export const readNmsL1P023Binding = readNmsL1P022Binding;
export function readNmsL1P023Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P023Binding(root, NMS_L1_P023_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P023_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P023_ID && packet.entry.key === NMS_L1_P023_ID, 'exact single page');
  demand(packet.source.sha256 === '786e3a3e22f8d757a4943586435428bbfa5533cad2787bbd75337941da172421' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 349123, 'source identity');
  demand(packet.hostedPlayback.kind==='once-source-host-terminal'&&packet.hostedPlayback.frameDomain==='sprite-59'&&packet.hostedPlayback.stopFrame===1030,'source host terminal policy');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P023Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original calibrations and their source evidence retain their own identity. */
export function extendNmsL1P023Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.hostedPlayback.kind==='once-source-host-terminal'&&packet.hostedPlayback.stopFrame===1030,'source host terminal policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P023_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P023_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId===NMS_L1_P022_CALIBRATION&&base.source.candidateFreezeManifestSha256===NMS_L1_P022_FREEZE.sha256&&base.productBridge.registeredAnimationCount===30,'validated preceding30-page lesson');
  const old = base.pages[22];
  demand(old.animationId === NMS_L1_P023_ID && old.placementId === NMS_L1_P023_ID && old.globalPageOrdinal === 23 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 12 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 36 && base.glossary.some(e=>e.id==='multiplication'), 'source glossary predecessor');
  demand(packet.sourceGlossary.entries.length===6 && packet.sourceGlossary.controls.length===6, 'six authored glossary keys');
  const glossary=[...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(["temperature","increase","fahrenheit","degree","multiplication","addition"].includes(entry.id), 'exact glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const old=glossary.find(e=>e.id===entry.id);
    if(old)demand(isDeepStrictEqual(old,projected),'preserve existing glossary');else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===41 && new Set(glossary.map(e=>e.id)).size===41 && isDeepStrictEqual(glossary.filter(e=>!['temperature','increase','fahrenheit','degree','addition'].includes(e.id)),base.glossary), 'five source glossary additions preserve36 existing terms');
  for(const control of packet.sourceGlossary.controls)demand(glossary.some(e=>e.id===control.entryId && e.sourceKeyAttribute.toLowerCase()===control.sourceKeyAttribute.toLowerCase()),'every source glossary resolves');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P023_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P023_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-59', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary:Object.freeze(glossary), calibrationId: NMS_L1_P023_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P023_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P023_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P023_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P023Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P023Packet(), predecessor=nmsL1P022Descriptor();
  return extendNmsL1P023Descriptor(predecessor, packet, localOnlyAnimationModuleRegistration(NMS_L1_P023_ID));
}
export function nmsL1P023Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL1P023Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p023-current-js-v1/members/${NMS_L1_P023_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P023Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

