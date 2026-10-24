import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {resolveG678HistoricalEvidencePath} from '../../../lib/g678-life-root-binding-v1.mjs';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L6_P002_ID = 'shared-alg001-l06-p002';
export const ALG_L6_P002_CALIBRATION = 'g678-alg-l06-p002-current-js-v2';
export const ALG_L6_P002_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l06-p002-current-js-v2.json',
  bytes: 14396, sha256: 'fe2136a31156085feaf671d97ad466ac478762638a5b7369b593b58a4e54c44e',
});
export const ALG_L6_P002_DECODER_CALIBRATION = 'g678-alg-l06-p002-decoder-v3';
export const ALG_L6_P002_DECODER_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l06-p002-decoder-v3.json',
  bytes: 2436, sha256: '55ac275d96e35cad0d00e8743dc407832a14ecca70c0bceec3b1b3e6c7a1ab09',
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
interface DecoderSuccessor {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  predecessorFreeze: Pin;
  selectedPages: Array<{animationId: string; sourceSha256: string; complexityLane: string; runtime: {canvasRenderer: Pin}}>;
  entry: {key: string; module: string; maturity: string; complexityLane: string;
    artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  sourceAudioSha256: string;
  decodedPcmProfiles: {chrome149: string; chrome153: string};
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`ALG_L6_P002_INVALID: ${message}`);
}
export function readAlgL6P002Binding(root: string, pin: Pin) {
  const file = resolveG678HistoricalEvidencePath(path.resolve(root, pin.path), root);
  const anchors = [root, '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222',
    resolveG678HistoricalEvidencePath('/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware', root)];
  demand(anchors.some(anchor => file.startsWith(`${anchor}${path.sep}`)) && realpathSync(file) === file, 'physical input path');
  const before = lstatSync(file, {bigint: true}), bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand(before.isFile() && before.nlink === 1n && ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]), 'physical input identity');
  demand(bytes.length === pin.bytes && createHash('sha256').update(bytes).digest('hex') === pin.sha256, `input hash: ${pin.path}`);
  return bytes;
}
export function readAlgL6P002Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readAlgL6P002Binding(root, ALG_L6_P002_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === ALG_L6_P002_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === ALG_L6_P002_ID && packet.entry.key === ALG_L6_P002_ID, 'exact single page');
  demand(packet.source.sha256 === '63126b485c23810e3d3a08d910306554cc4fe78a3713d8a0de99cd47d134bb1b' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 2027783, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readAlgL6P002Binding(root, pin);
  demand(isDeepStrictEqual(packet.selectedPages[0].runtime.canvasRenderer.path, packet.entry.artifacts.runtime.path), 'source runtime');
  return packet;
}
export function readAlgL6P002DecoderSuccessor(root = getWorkspaceRoot()): DecoderSuccessor {
  const predecessor = readAlgL6P002Packet(root);
  const successor = JSON.parse(readAlgL6P002Binding(root, ALG_L6_P002_DECODER_FREEZE).toString()) as DecoderSuccessor;
  demand(successor.schemaVersion === 1 && successor.calibrationId === ALG_L6_P002_DECODER_CALIBRATION &&
    successor.deploymentScope === 'local-only' && isDeepStrictEqual(successor.predecessorFreeze, ALG_L6_P002_FREEZE), 'versioned decoder successor');
  demand(successor.selectedPages.length === 1 && successor.selectedPages[0].animationId === ALG_L6_P002_ID &&
    successor.selectedPages[0].sourceSha256 === predecessor.source.sha256 &&
    successor.selectedPages[0].complexityLane === 'interactive-understood' &&
    isDeepStrictEqual(successor.selectedPages[0].runtime.canvasRenderer, predecessor.entry.artifacts.runtime), 'unchanged source and renderer');
  demand(successor.entry.key === ALG_L6_P002_ID && successor.entry.module === './modules/g678-alg-l06-p002-decoder-v3' &&
    successor.entry.maturity === 'private-current-js' && successor.entry.complexityLane === 'interactive-understood' &&
    isDeepStrictEqual(successor.entry.artifacts.timeline, predecessor.entry.artifacts.timeline) &&
    isDeepStrictEqual(successor.entry.artifacts.runtime, predecessor.entry.artifacts.runtime), 'unchanged timeline and runtime');
  demand(successor.sourceAudioSha256 === '15578b29985566e60245259470926550a22f31435bc56e5bd3d2a739e4588bb5' &&
    successor.decodedPcmProfiles.chrome149 === '039068574f980a0b164d3439c697bd8f8fe1c9b4fa3f39e54f382a271ee3e087' &&
    successor.decodedPcmProfiles.chrome153 === '635a80ec488a5f5b15a07f4d037dfbdcd8e24f5abeff0328b46e5669c43a6593', 'measured decoder profiles');
  demand(successor.productCalibrationPassed === false && successor.scaleOutAuthorized === false &&
    Object.values(successor.acceptanceEffects).every(v => v === false), 'independent acceptance');
  readAlgL6P002Binding(root, successor.entry.artifacts.module);
  return successor;
}

/** Add one registered placement to the already validated source-ordered lesson.
 * The original 379-page calibration and its evidence retain their own identity. */
export function extendAlgL6Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet, successor: DecoderSuccessor,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 6 && base.course.activePageCount === 60 &&
    base.pages.length === 60 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === ALG_L6_P002_DECODER_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === ALG_L6_P002_DECODER_FREEZE.sha256 &&
    registration.moduleSha256 === successor.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  const old = base.pages[1];
  demand(old.animationId === ALG_L6_P002_ID && old.placementId === ALG_L6_P002_ID && old.globalPageOrdinal === 2 &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId === ALG_L6_P002_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L6_P002_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-370', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: ALG_L6_P002_DECODER_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ALG_L6_P002_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: ALG_L6_P002_DECODER_FREEZE.path,
      candidateFreezeManifestSha256: ALG_L6_P002_DECODER_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function algL6P002Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL6P002Packet(), successor = readAlgL6P002DecoderSuccessor(),
    predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', '379-page predecessor');
  const matches = predecessor.descriptors.filter(d => d.course.moduleCode === 'ALG001' && d.course.lesson === 6);
  demand(matches.length === 1, 'unique source-ordered predecessor lesson');
  return extendAlgL6Descriptor(matches[0], packet, successor, localOnlyAnimationModuleRegistration(ALG_L6_P002_ID));
}
export function algL6P002Canvas(): {bytes: Buffer; sha256: string} {
  const packet = readAlgL6P002Packet(), binding = packet.entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/${ALG_L6_P002_CALIBRATION}/members/${ALG_L6_P002_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readAlgL6P002Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
