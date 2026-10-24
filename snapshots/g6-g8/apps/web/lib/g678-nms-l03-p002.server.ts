import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import {activeHostPins} from './g678-active-host-pins.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L3_P002_ID = 'shared-nms002-l03-p002';
export const NMS_L3_P002_CALIBRATION = 'g678-nms-l03-p002-current-js-v3';
export const NMS_L3_P002_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l03-p002-current-js-v3.json',
  bytes: 21564, sha256: '15dd78ae3751402cd4ad8d3b1627826413461b5aad11fcbfb716561ec0772636',
});
// v3 changes the exact decoder plan only; the reviewed v2 drawing asset is retained.
export const NMS_L3_P002_CANVAS = Object.freeze({
  path: 'work/g678-shared-page-factory/g678-nms-l03-p002-current-js-v2/members/shared-nms002-l03-p002/canvas-renderer.js',
  bytes: 7975649, sha256: '3153dbb4051b68ef5de9e361d5bbe8addbcdf0786a837daf5346f3eed8411b09',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
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
  if (!value) throw Error(`NMS_L3_P002_INVALID: ${message}`);
}
export function readNmsL3P002Binding(root: string, pin: Pin) {
  const file = path.resolve(root, pin.path);
  const anchors = [root, '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'];
  demand(anchors.some(anchor => file.startsWith(`${anchor}${path.sep}`)) && realpathSync(file) === file, 'physical input path');
  const before = lstatSync(file, {bigint: true}), bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand(before.isFile() && before.nlink === 1n && ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]), 'physical input identity');
  demand(bytes.length === pin.bytes && createHash('sha256').update(bytes).digest('hex') === pin.sha256, `input hash: ${pin.path}`);
  return bytes;
}
export function readNmsL3P002Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL3P002Binding(root, NMS_L3_P002_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L3_P002_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L3_P002_ID && packet.entry.key === NMS_L3_P002_ID, 'exact single page');
  demand(packet.source.sha256 === '530ebbd934176f27ae1016720c60ac16ce1cfbec5dc3044feac5bbd4ecde0212' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 532935, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  const active = activeHostPins(root);
  for (const pin of packet.inputs) readNmsL3P002Binding(root, active.resolve(pin));
  for (const pin of packet.outputs) readNmsL3P002Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original 379-page calibration and its evidence retain their own identity. */
export function extendNmsL3Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 3 && base.course.activePageCount === 56 &&
    base.pages.length === 56 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L3_P002_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L3_P002_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  const old = base.pages[1];
  demand(old.animationId === NMS_L3_P002_ID && old.placementId === NMS_L3_P002_ID && old.globalPageOrdinal === 2 &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId === NMS_L3_P002_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L3_P002_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-237', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'nms-l03-p002-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: NMS_L3_P002_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L3_P002_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L3_P002_FREEZE.path, candidateFreezeManifestSha256: NMS_L3_P002_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL3P002Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL3P002Packet(), predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', '379-page predecessor');
  const matches = predecessor.descriptors.filter(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 3);
  demand(matches.length === 1, 'unique source-ordered predecessor lesson');
  return extendNmsL3Descriptor(matches[0], packet, localOnlyAnimationModuleRegistration(NMS_L3_P002_ID));
}
export function nmsL3P002Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL3P002Packet(), binding = packet.entry.artifacts.runtime;
  demand(isDeepStrictEqual(binding, NMS_L3_P002_CANVAS), 'exact retained v2 Canvas identity');
  return {bytes: readNmsL3P002Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

/** Overview counts include the new page only while both admissions validate. */
export function g678RegisteredDescriptorsWithNmsL3P002() {
  const descriptors = g678PartialCalibrationSnapshot().descriptors;
  try {
    const extended = nmsL3P002Descriptor();
    return descriptors.map(descriptor => descriptor.course.moduleCode === 'NMS002' && descriptor.course.lesson === 3 ? extended : descriptor);
  } catch {
    // A missing or drifted extension cannot raise the earlier trusted count.
    return descriptors;
  }
}
