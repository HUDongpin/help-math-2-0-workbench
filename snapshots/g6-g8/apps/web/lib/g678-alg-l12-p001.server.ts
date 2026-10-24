import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from
  './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from
  './whole-lesson-player-descriptor';

export const ALG_L12_P001_ID = 'shared-alg001-l12-p001';
const CALIBRATION = 'g678-alg-l12-p001-current-js-v1';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p001-current-js-v1.json',
  bytes: 4389,
  sha256: 'b840bba869fd0862d254237965537c76d296f1084fd26143749bf866aebb8226',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Packet = Readonly<{
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  selectedPages: readonly Readonly<{
    animationId: string; placementId: string; assetId: string;
    sourceSha256: string; moduleCode: string; lessonNumber: number;
    globalPageOrdinal: number; sectionCode: string; sectionPageOrdinal: number;
    runtime: Readonly<{frameDomain: string; frameCount: number;
      canvasRenderer: Pin}>;
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
  }>[];
  source: Pin; sourceXml: Pin; sourceCatalog: Pin;
  sourceAudit: Pin; candidateManifest: Pin;
  entry: Readonly<{key: string; artifacts: Readonly<{
    module: Pin; timeline: Pin; runtime: Pin}>}>;
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`ALG_L12_P001_INVALID: ${reason}`);
}

function readPinned(file: string, pin: Pin) {
  file = resolveG678PhysicalPath(file);
  demand(realpathSync(file) === file, 'physical path');
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n,
    'ordinary file');
  const bytes = readFileSync(file);
  const after = lstatSync(file, {bigint: true});
  demand(['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] ===
    after[key as keyof typeof after]), 'stable file');
  demand(bytes.length === pin.bytes &&
    createHash('sha256').update(bytes).digest('hex') === pin.sha256,
  `pinned bytes: ${pin.path}`);
  return bytes;
}

function workspacePin(root: string, pin: Pin) {
  demand(!path.isAbsolute(pin.path) && !pin.path.split('/').includes('..'),
    'workspace-relative binding');
  const target = path.resolve(root, pin.path);
  demand(target.startsWith(`${root}${path.sep}`), 'workspace boundary');
  return readPinned(target, pin);
}

export function readAlgL12P001Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === resolveG678PhysicalPath(SOURCE_ROOT) &&
    realpathSync(resolveG678PhysicalPath(SOURCE_ROOT)) === resolveG678PhysicalPath(SOURCE_ROOT) &&
    lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isDirectory() &&
    !lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isSymbolicLink(), 'physical AWS source root');
  const packet = JSON.parse(workspacePin(root, FREEZE).toString()) as Packet;
  const page = packet.selectedPages?.[0];
  demand(packet.schemaVersion === 1 && packet.calibrationId === CALIBRATION &&
    packet.deploymentScope === 'local-only' &&
    packet.selectedPages.length === 1 &&
    page?.animationId === ALG_L12_P001_ID &&
    page.placementId === ALG_L12_P001_ID &&
    page.assetId === `swf-${page.sourceSha256}` &&
    page.sourceSha256 === packet.source.sha256 &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 &&
    page.globalPageOrdinal === 1 && page.sectionCode === 'IR' &&
    page.sectionPageOrdinal === 1 && page.runtime.frameDomain === 'sprite-142' &&
    page.runtime.frameCount === 130 &&
    packet.entry.key === ALG_L12_P001_ID &&
    packet.entry.artifacts.runtime.path === page.runtime.canvasRenderer.path &&
    packet.entry.artifacts.runtime.sha256 === page.runtime.canvasRenderer.sha256,
  'exact single placement');
  demand(packet.productCalibrationPassed === false &&
    packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).every(value => value === false),
  'independent acceptance gates');
  demand(packet.source.path === 'G6-G8-shared/ALG001/L12/IR/L12IR01.swf' &&
    packet.sourceXml.path === 'G6-G8-shared/ALG001/L12/index.xml',
  'source paths');
  readPinned(path.join(SOURCE_ROOT, packet.source.path), packet.source);
  readPinned(path.join(SOURCE_ROOT, packet.sourceXml.path), packet.sourceXml);
  for (const pin of [packet.sourceCatalog, packet.sourceAudit,
    packet.candidateManifest, ...Object.values(packet.entry.artifacts)]) {
    workspacePin(root, pin);
  }
  return packet;
}

export function algL12P001Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL12P001Packet();
  const registration = localOnlyAnimationModuleRegistration(ALG_L12_P001_ID);
  demand(registration?.calibrationId === CALIBRATION &&
    registration.deploymentScope === 'local-only' &&
    registration.freezeManifestSha256 === FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256,
  'actual private module registration');
  const snapshot = g678PartialCalibrationSnapshot();
  demand(snapshot.status === 'ready', '379-page predecessor');
  const matches = snapshot.descriptors.filter(descriptor =>
    descriptor.course.moduleCode === 'ALG001' && descriptor.course.lesson === 12);
  demand(matches.length === 1, 'unique source-ordered lesson');
  const base = matches[0]!;
  demand(base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 14 &&
    base.course.courseShellCount === 0 &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256,
  'predecessor lesson identity');
  const first = base.pages[0]!;
  demand(first.animationId === ALG_L12_P001_ID &&
    first.rendererAvailability.kind === 'unavailable' &&
    first.source.assetId === `swf-${packet.source.sha256}`,
  'exact unavailable first placement');
  const pages = base.pages.map(page => page.animationId === ALG_L12_P001_ID
    ? Object.freeze({...page,
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P001_ID,
        runtimeQuery: Object.freeze({frameDomain: 'sprite-142',
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0'})}),
      runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
    }) : page);
  const selected = pages.filter(page =>
    page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 15 &&
    new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P001_ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: FREEZE.path,
      candidateFreezeManifestSha256: FREEZE.sha256}),
    pages: Object.freeze(pages),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P001Canvas() {
  const packet = readAlgL12P001Packet();
  const pin = packet.entry.artifacts.runtime;
  demand(pin.path ===
    `work/g678-shared-page-factory/g678-alg-l12-intro-current-js-v1/members/${ALG_L12_P001_ID}/canvas-renderer.js`,
  'exact local runtime path');
  return {bytes: workspacePin(getWorkspaceRoot(), pin), sha256: pin.sha256};
}
