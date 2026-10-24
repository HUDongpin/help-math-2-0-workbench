import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {ALG_L12_P011_CALIBRATION, ALG_L12_P011_FREEZE,
  ALG_L12_P011_ID, algL12P011Descriptor} from './g678-alg-l12-p011.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from
  './whole-lesson-player-descriptor';

export const ALG_L12_P002_ID = 'shared-alg001-l12-p002';
export const ALG_L12_P002_CALIBRATION = 'g678-alg-l12-p002-current-js-v1';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const RUNTIME_PATH =
  `work/g678-shared-page-factory/g678-alg-l12-real-world-current-js-v1/members/${ALG_L12_P002_ID}/canvas-renderer.js`;
const RUNTIME_SHA = '993722d3cf0c30601805005fe8b750cecf50620a9b6692f5628f342184b4a3e4';
export const ALG_L12_P002_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p002-current-js-v1.json',
  bytes: 4783,
  sha256: '94a0ee624f434c465ed071a79e3824b183fb779410b642b65828c5c56e9c4f3d',
});

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Packet = Readonly<{
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  predecessor: Readonly<{calibrationId: string; freezeManifestSha256: string;
    registeredAnimationCount: number}>;
  selectedPages: readonly Readonly<{
    animationId: string; placementId: string; assetId: string;
    stableLessonKey: string; sourceSha256: string; moduleCode: string;
    lessonNumber: number; globalPageOrdinal: number; sectionCode: string;
    sectionPageOrdinal: number; complexityLane: string;
    runtime: Readonly<{frameDomain: string; frameCount: number;
      rootFrameCount: number; rootBeginFrame: number;
      audioPlaybackEnabled: boolean; canvasRenderer: Pin & {url: string}}>;
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
  }>[];
  source: Pin; sourceXml: Pin; sourceCatalog: Pin;
  sourceAudit: Pin; candidateManifest: Pin; hostAdapter: Pin;
  entry: Readonly<{key: string; module: string; maturity: string;
    complexityLane: string; artifacts: Readonly<{
      module: Pin; timeline: Pin; runtime: Pin}>}>;
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`ALG_L12_P002_INVALID: ${reason}`);
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

export function readAlgL12P002Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === resolveG678PhysicalPath(SOURCE_ROOT) &&
    realpathSync(resolveG678PhysicalPath(SOURCE_ROOT)) === resolveG678PhysicalPath(SOURCE_ROOT) &&
    lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isDirectory() &&
    !lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isSymbolicLink(), 'physical AWS source root');
  const packet = JSON.parse(workspacePin(root, ALG_L12_P002_FREEZE).toString()) as Packet;
  const page = packet.selectedPages?.[0];
  demand(packet.schemaVersion === 1 &&
    packet.calibrationId === ALG_L12_P002_CALIBRATION &&
    packet.deploymentScope === 'local-only' &&
    packet.predecessor.calibrationId === ALG_L12_P011_CALIBRATION &&
    packet.predecessor.freezeManifestSha256 === ALG_L12_P011_FREEZE.sha256 &&
    packet.predecessor.registeredAnimationCount === 16 &&
    packet.selectedPages.length === 1 &&
    page?.animationId === ALG_L12_P002_ID &&
    page.placementId === ALG_L12_P002_ID &&
    page.assetId === `swf-${page.sourceSha256}` &&
    page.sourceSha256 === packet.source.sha256 &&
    page.stableLessonKey === 'shared-alg001-l12' &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 &&
    page.globalPageOrdinal === 2 && page.sectionCode === 'RW' &&
    page.sectionPageOrdinal === 1 &&
    page.complexityLane === 'interactive-understood' &&
    page.runtime.frameDomain === 'sprite-454' &&
    page.runtime.frameCount === 1951 &&
    page.runtime.rootFrameCount === 10 && page.runtime.rootBeginFrame === 6 &&
    page.runtime.audioPlaybackEnabled === false &&
    page.runtime.canvasRenderer.path === RUNTIME_PATH &&
    page.runtime.canvasRenderer.bytes === 23587892 &&
    page.runtime.canvasRenderer.sha256 === RUNTIME_SHA &&
    page.runtime.canvasRenderer.url ===
      `/flash-assets/g678-local/${ALG_L12_P002_ID}/canvas-renderer.js` &&
    packet.entry.key === ALG_L12_P002_ID &&
    packet.entry.module === `./modules/${ALG_L12_P002_ID}` &&
    packet.entry.maturity === 'private-current-js' &&
    packet.entry.complexityLane === page.complexityLane &&
    isDeepStrictEqual(packet.entry.artifacts.runtime,
      {path: RUNTIME_PATH, bytes: 23587892, sha256: RUNTIME_SHA}),
  'exact second placement and silent composed runtime');
  demand(packet.productCalibrationPassed === false &&
    packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).every(value => value === false),
  'independent acceptance gates');
  demand(packet.source.path === 'G6-G8-shared/ALG001/L12/RW/L12RW02.swf' &&
    packet.sourceXml.path === 'G6-G8-shared/ALG001/L12/index.xml' &&
    packet.sourceAudit.path ===
      'migrations/shared-alg001-l12-p002/SOURCE_AUDIT_2026-09-25.md' &&
    packet.candidateManifest.path ===
      'migrations/shared-alg001-l12-p002/candidate-v2/adapter-manifest.json' &&
    packet.hostAdapter.path ===
      'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p002/player.tsx',
  'source and candidate paths');
  readPinned(path.join(SOURCE_ROOT, packet.source.path), packet.source);
  readPinned(path.join(SOURCE_ROOT, packet.sourceXml.path), packet.sourceXml);
  for (const pin of [packet.sourceCatalog, packet.sourceAudit, packet.hostAdapter,
    ...Object.values(packet.entry.artifacts)]) workspacePin(root, pin);
  const candidate = JSON.parse(workspacePin(root, packet.candidateManifest).toString());
  demand(candidate.animationId === ALG_L12_P002_ID &&
    candidate.status === 'unregistered-composed-canvas-drawing-candidate' &&
    isDeepStrictEqual(candidate.source, packet.source) &&
    candidate.outputs?.runtime?.bytes === 23587892 &&
    candidate.outputs.runtime.sha256 === RUNTIME_SHA &&
    candidate.composition?.rootFrame === 6 &&
    candidate.composition.main?.objectId === 454 &&
    candidate.composition.title?.objectId === 458 &&
    candidate.composition.frame?.objectId === 459 &&
    candidate.acceptanceEffects?.audioAccepted === false,
  'candidate-v2 composition and runtime');
  return packet;
}

export function extendAlgL12P002Descriptor(base: PageOnlyLessonPlayerDescriptor,
  packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>):
  PageOnlyLessonPlayerDescriptor {
  demand(registration?.calibrationId === ALG_L12_P002_CALIBRATION &&
    registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' &&
    registration.freezeManifestSha256 === ALG_L12_P002_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === RUNTIME_SHA,
  'actual private module registration');
  demand(base.calibrationId === ALG_L12_P011_CALIBRATION &&
    base.source.candidateFreezeManifestSha256 === ALG_L12_P011_FREEZE.sha256 &&
    base.course.moduleCode === 'ALG001' && base.course.lesson === 12 &&
    base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 16 &&
    base.course.courseShellCount === 0 &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256 &&
    base.pages[10]?.animationId === ALG_L12_P011_ID &&
    base.pages[10]?.rendererAvailability.kind === 'registered' &&
    base.glossary.length === 28 &&
    base.support.lessonHostCapabilities.includes('glossary'),
  'P011 predecessor and source-ordered lesson');
  const target = base.pages[1];
  demand(target?.animationId === ALG_L12_P002_ID &&
    target.placementId === ALG_L12_P002_ID &&
    target.globalPageOrdinal === 2 && target.sectionCode === 'RW' &&
    target.sectionPageOrdinal === 1 &&
    target.previousPlacementId === 'shared-alg001-l12-p001' &&
    target.rendererAvailability.kind === 'unavailable' &&
    target.source.assetId === `swf-${packet.source.sha256}`,
  'exact unavailable second placement');
  const pages = base.pages.map(page => page.animationId === ALG_L12_P002_ID
    ? Object.freeze({...page,
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P002_ID,
        runtimeQuery: Object.freeze({frameDomain: 'sprite-454',
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0'})}),
      runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
    }) : page);
  const selected = pages.filter(page =>
    page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 17 &&
    new Set(selected).size === selected.length &&
    selected.includes(ALG_L12_P011_ID) && selected.includes(ALG_L12_P002_ID) &&
    selected.filter(id => id !== ALG_L12_P002_ID).every(id =>
      base.productBridge.selectedAnimationIds.includes(id)),
  'one-page registration delta');
  return Object.freeze({...base, calibrationId: ALG_L12_P002_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P002_ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: ALG_L12_P002_FREEZE.path,
      candidateFreezeManifestSha256: ALG_L12_P002_FREEZE.sha256}),
    pages: Object.freeze(pages),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P002Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL12P002Packet();
  return extendAlgL12P002Descriptor(algL12P011Descriptor(), packet,
    localOnlyAnimationModuleRegistration(ALG_L12_P002_ID));
}

export function algL12P002Canvas() {
  const packet = readAlgL12P002Packet();
  return {bytes: workspacePin(getWorkspaceRoot(), packet.entry.artifacts.runtime),
    sha256: RUNTIME_SHA};
}
