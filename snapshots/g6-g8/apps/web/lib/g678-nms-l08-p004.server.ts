import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L8_P004_ID = 'shared-nms002-l08-p004';
export const NMS_L8_P004_CALIBRATION = 'g678-nms-l08-p004-current-js-v1';
export const NMS_L8_P004_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l08-p004-current-js-v1.json',
  bytes: 15955, sha256: 'a9ca86e799676abeb1ea93e31f8e11f328fe86ca8911ddde7f5ea61c1859dffe',
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
  if (!value) throw Error(`NMS_L8_P004_INVALID: ${message}`);
}
export function readNmsL8P004Binding(root: string, pin: Pin) {
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
export function readNmsL8P004Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL8P004Binding(root, NMS_L8_P004_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L8_P004_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L8_P004_ID && packet.entry.key === NMS_L8_P004_ID, 'exact single page');
  demand(packet.source.sha256 === 'b13f1123d02706e075da4ce45063309dbb86a6037ddaacfb75b9d27510b9532f' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 1120866, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL8P004Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original 379-page calibration and its evidence retain their own identity. */
export function extendNmsL8Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 8 && base.course.activePageCount === 60 &&
    base.pages.length === 60 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L8_P004_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L8_P004_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  const old = base.pages[3];
  demand(old.animationId === NMS_L8_P004_ID && old.placementId === NMS_L8_P004_ID && old.globalPageOrdinal === 4 &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 3 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId === NMS_L8_P004_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L8_P004_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-204', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: NMS_L8_P004_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L8_P004_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L8_P004_FREEZE.path, candidateFreezeManifestSha256: NMS_L8_P004_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL8P004Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL8P004Packet(), predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', '379-page predecessor');
  const matches = predecessor.descriptors.filter(d => d.course.moduleCode === 'NMS002' && d.course.lesson === 8);
  demand(matches.length === 1, 'unique source-ordered predecessor lesson');
  return extendNmsL8Descriptor(matches[0], packet, localOnlyAnimationModuleRegistration(NMS_L8_P004_ID));
}
export function nmsL8P004Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readNmsL8P004Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/${NMS_L8_P004_CALIBRATION}/members/${NMS_L8_P004_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL8P004Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

