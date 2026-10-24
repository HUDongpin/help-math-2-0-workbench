import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L1_P006_ID = 'shared-alg001-l01-p006';
export const ALG_L1_P006_CALIBRATION = 'g678-alg-l01-p006-current-js-v3';
export const ALG_L1_P006_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l01-p006-current-js-v3.json',
  bytes: 11859, sha256: '20ecbbb32de65430a0156370a00fda6cca4766f4325a8282660ccbe1fd5801f3',
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
  if (!value) throw Error(`ALG_L1_P006_INVALID: ${message}`);
}
export function readAlgL1P006Binding(root: string, pin: Pin) {
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
export function readAlgL1P006Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readAlgL1P006Binding(root, ALG_L1_P006_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === ALG_L1_P006_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === ALG_L1_P006_ID && packet.entry.key === ALG_L1_P006_ID, 'exact single page');
  demand(packet.source.sha256 === '0a5f2ba7b1311ed961509a7ac4ab0af01a56c392e4c9786072a07543c29c8868' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 1458326, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readAlgL1P006Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original 379-page calibration and its evidence retain their own identity. */
export function extendAlgL1Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 1 && base.course.activePageCount === 56 &&
    base.pages.length === 56 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === ALG_L1_P006_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === ALG_L1_P006_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  const old = base.pages[5];
  demand(old.animationId === ALG_L1_P006_ID && old.placementId === ALG_L1_P006_ID && old.globalPageOrdinal === 6 &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 5 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId === ALG_L1_P006_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L1_P006_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-25', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: ALG_L1_P006_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ALG_L1_P006_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: ALG_L1_P006_FREEZE.path, candidateFreezeManifestSha256: ALG_L1_P006_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function algL1P006Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL1P006Packet(), predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', '379-page predecessor');
  const matches = predecessor.descriptors.filter(d => d.course.moduleCode === 'ALG001' && d.course.lesson === 1);
  demand(matches.length === 1, 'unique source-ordered predecessor lesson');
  return extendAlgL1Descriptor(matches[0], packet, localOnlyAnimationModuleRegistration(ALG_L1_P006_ID));
}
export function algL1P006Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readAlgL1P006Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/${ALG_L1_P006_CALIBRATION}/members/${ALG_L1_P006_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readAlgL1P006Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}

