import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P002_ID = 'shared-nms002-l01-p002';
export const NMS_L1_P002_CALIBRATION = 'g678-nms-l01-p002-current-js-v1';
export const NMS_L1_P002_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p002-current-js-v1.json',
  bytes: 26041, sha256: 'be9ec599948011cb8d6f2073cd687db8ce87fe5d553ddce132b67301cac67cf9',
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
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`NMS_L1_P002_INVALID: ${message}`);
}
export function readNmsL1P002Binding(root: string, pin: Pin) {
  const file = path.resolve(root, pin.path);
  const anchors = [root, '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware',
    '/Volumes/WestWorld/HELP MATH Related Files/Private Recovery Containers/2026-08-25-BOULDER-LEARNING-AWS-S3-EMERGENCY-V1'];
  demand(anchors.some(anchor => file.startsWith(`${anchor}${path.sep}`)) && realpathSync(file) === file, 'physical input path');
  const before = lstatSync(file, {bigint: true}), bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand(before.isFile() && before.nlink === 1n && ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]), 'physical input identity');
  demand(bytes.length === pin.bytes && createHash('sha256').update(bytes).digest('hex') === pin.sha256, `input hash: ${pin.path}`);
  return bytes;
}
export function readNmsL1P002Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P002Binding(root, NMS_L1_P002_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P002_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P002_ID && packet.entry.key === NMS_L1_P002_ID, 'exact single page');
  demand(packet.source.sha256 === '8a7ecf75e3dc95dc4e9d7a35b52b97df02f5e93f5f7fa1e22b8e4472fe4fd6c4' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 2318610, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P002Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original 379-page calibration and its evidence retain their own identity. */
export function extendNmsL1P002Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P002_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P002_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  const old = base.pages[1];
  demand(old.animationId === NMS_L1_P002_ID && old.placementId === NMS_L1_P002_ID && old.globalPageOrdinal === 2 &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 22 && !base.glossary.some(e=>e.id==='number-line'), 'source glossary predecessor');
  demand(packet.sourceGlossary.entries.length===3 && packet.sourceGlossary.controls.length===3, 'three authored glossary keys');
  const glossary=[...base.glossary];
  for(const entry of packet.sourceGlossary.entries){
    demand(['positive-integers','negative-integers','number-line'].includes(entry.id), 'exact glossary scope');
    const projected={id:entry.id,sourceKeyAttribute:entry.sourceKeyAttribute,labels:entry.labels,definitions:entry.definitions,source:entry.source};
    const old=glossary.find(e=>e.id===entry.id);
    if(old)demand(isDeepStrictEqual(old,projected),'preserve existing glossary');else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length===23 && new Set(glossary.map(e=>e.id)).size===23, 'one source glossary addition');
  for(const control of packet.sourceGlossary.controls)demand(glossary.some(e=>e.id===control.entryId && e.sourceKeyAttribute.toLowerCase()===control.sourceKeyAttribute.toLowerCase()),'every source glossary resolves');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P002_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P002_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-722', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary:Object.freeze(glossary), calibrationId: NMS_L1_P002_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P002_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P002_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P002_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P002Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P002Packet(), predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', '379-page predecessor');
  const matches = predecessor.descriptors.filter(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 1);
  demand(matches.length === 1, 'unique source-ordered predecessor lesson');
  return extendNmsL1P002Descriptor(matches[0], packet, localOnlyAnimationModuleRegistration(NMS_L1_P002_ID));
}
export function nmsL1P002Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL1P002Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/${NMS_L1_P002_CALIBRATION}/members/${NMS_L1_P002_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P002Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

