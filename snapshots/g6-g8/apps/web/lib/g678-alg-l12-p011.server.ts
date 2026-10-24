import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {ALG_L12_P001_ID, algL12P001Descriptor} from
  './g678-alg-l12-p001.server';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L12_P011_ID = 'shared-alg001-l12-p011';
export const ALG_L12_P011_CALIBRATION = 'g678-alg-l12-p011-current-js-v1';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
export const ALG_L12_P011_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p011-current-js-v1.json',
  bytes: 5609,
  sha256: '6413840580ea9a52b2291761a98046dcbe9e0ae5cd45956be43e7f6ab90a87d4',
});
const RUNTIME_PATH =
  `work/g678-shared-page-factory/g678-alg-l12-origin-current-js-v1/members/${ALG_L12_P011_ID}/canvas-renderer.js`;
const CONTROLS = Object.freeze([
  {sourceCharacterId: 20, entryId: 'origin', sourceKeyAttribute: 'Origin', firstFrame: 8},
  {sourceCharacterId: 21, entryId: 'point', sourceKeyAttribute: 'Point', firstFrame: 8},
  {sourceCharacterId: 22, entryId: 'coordinate-plane-cartesian-plane',
    sourceKeyAttribute: 'Coordinate plane/Cartesian Plane', firstFrame: 8},
  {sourceCharacterId: 27, entryId: 'x-axis', sourceKeyAttribute: 'X-axis', firstFrame: 78},
  {sourceCharacterId: 28, entryId: 'y-axis', sourceKeyAttribute: 'Y-axis', firstFrame: 78},
  {sourceCharacterId: 29, entryId: 'intersect', sourceKeyAttribute: 'Intersect', firstFrame: 78},
]);
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Control = (typeof CONTROLS)[number];
type Packet = Readonly<{
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: readonly Readonly<{
    animationId: string; placementId: string; assetId: string;
    stableLessonKey: string; sourceSha256: string; moduleCode: string;
    lessonNumber: number; globalPageOrdinal: number; sectionCode: string;
    sectionPageOrdinal: number; complexityLane: string;
    runtime: Readonly<{frameDomain: string; frameCount: number;
      rootFrameCount: number; rootBeginFrame: number; canvasRenderer: Pin}>;
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
  }>[];
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; sourceAudit: Pin;
  candidateQa: Pin; candidateManifest: Pin; glossarySnapshot: Pin; hostAdapter: Pin;
  sourceGlossary: Readonly<{controls: readonly Control[]}>;
  entry: Readonly<{key: string; module: string; maturity: string;
    complexityLane: string; artifacts: Readonly<{
      module: Pin; timeline: Pin; runtime: Pin}>}>;
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`ALG_L12_P011_INVALID: ${reason}`);
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

export function readAlgL12P011Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === resolveG678PhysicalPath(SOURCE_ROOT) &&
    realpathSync(resolveG678PhysicalPath(SOURCE_ROOT)) === resolveG678PhysicalPath(SOURCE_ROOT) &&
    lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isDirectory() &&
    !lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isSymbolicLink(), 'physical AWS source root');
  const packet = JSON.parse(workspacePin(root, ALG_L12_P011_FREEZE).toString()) as Packet;
  const page = packet.selectedPages?.[0];
  demand(packet.schemaVersion === 1 &&
    packet.calibrationId === ALG_L12_P011_CALIBRATION &&
    packet.deploymentScope === 'local-only' &&
    packet.selectedPages.length === 1 &&
    page?.animationId === ALG_L12_P011_ID &&
    page.placementId === ALG_L12_P011_ID &&
    page.assetId === `swf-${page.sourceSha256}` &&
    page.sourceSha256 === packet.source.sha256 &&
    page.stableLessonKey === 'shared-alg001-l12' &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 &&
    page.globalPageOrdinal === 11 && page.sectionCode === 'VB' &&
    page.sectionPageOrdinal === 5 &&
    page.complexityLane === 'interactive-understood' &&
    page.runtime.frameDomain === 'sprite-33' &&
    page.runtime.frameCount === 118 &&
    page.runtime.rootFrameCount === 10 && page.runtime.rootBeginFrame === 6 &&
    page.runtime.canvasRenderer.path === RUNTIME_PATH &&
    page.runtime.canvasRenderer.sha256 ===
      '70bab6fd85db2afa782f987a241aef0abbf6deb5b98bffcca1146b440c541031' &&
    page.runtime.canvasRenderer.bytes === 884739 &&
    packet.entry.key === ALG_L12_P011_ID &&
    packet.entry.module === `./modules/${ALG_L12_P011_ID}` &&
    packet.entry.maturity === 'private-current-js' &&
    packet.entry.complexityLane === page.complexityLane &&
    isDeepStrictEqual(packet.entry.artifacts.runtime,
      {path: RUNTIME_PATH, bytes: 884739,
        sha256: page.runtime.canvasRenderer.sha256}) &&
    isDeepStrictEqual(packet.sourceGlossary.controls, CONTROLS),
  'exact P011 placement and six source controls');
  demand(packet.productCalibrationPassed === false &&
    packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).every(value => value === false),
  'independent acceptance gates');
  demand(packet.source.path === 'G6-G8-shared/ALG001/L12/VB/L12VB06.swf' &&
    packet.sourceXml.path === 'G6-G8-shared/ALG001/L12/index.xml',
  'source paths');
  readPinned(path.join(SOURCE_ROOT, packet.source.path), packet.source);
  readPinned(path.join(SOURCE_ROOT, packet.sourceXml.path), packet.sourceXml);
  for (const pin of [packet.sourceCatalog, packet.sourceAudit,
    packet.candidateQa, packet.candidateManifest, packet.glossarySnapshot, packet.hostAdapter,
    ...Object.values(packet.entry.artifacts)]) workspacePin(root, pin);
  return packet;
}

function sourceGlossary(packet: Packet): PageOnlyLessonGlossaryEntry[] {
  type Snapshot = {selectedPages: Array<{glossaryEntries?: Array<
    PageOnlyLessonGlossaryEntry>}>};
  const snapshot = JSON.parse(workspacePin(getWorkspaceRoot(),
    packet.glossarySnapshot).toString()) as Snapshot;
  demand(Array.isArray(snapshot.selectedPages), 'glossary snapshot');
  const entries = snapshot.selectedPages.flatMap(page => page.glossaryEntries ?? []);
  return packet.sourceGlossary.controls.map(control => {
    const matches = entries.filter(entry => entry.id === control.entryId &&
      entry.sourceKeyAttribute === control.sourceKeyAttribute).map(entry => ({
        id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute,
        labels: entry.labels, definitions: entry.definitions,
        source: entry.source,
      }));
    demand(matches.length > 0 && matches.every(entry =>
      isDeepStrictEqual(entry, matches[0])), `source glossary: ${control.entryId}`);
    const entry = matches[0]!;
    demand(entry.labels.en && entry.labels.es &&
      entry.definitions.en && entry.definitions.es &&
      entry.source.en.assetId === 'G678L1KTE01.xml' &&
      entry.source.en.path === 'HELP_KEYTERMS/KT/XML/L1KTE01.xml' &&
      entry.source.en.sha256 ===
        '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b' &&
      entry.source.es.assetId === 'G678L1KTS01.xml' &&
      entry.source.es.path === 'HELP_KEYTERMS/KT/XML/L1KTS01.xml' &&
      entry.source.es.sha256 ===
        '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407',
    `bilingual glossary source: ${control.entryId}`);
    return entry;
  });
}

export function extendAlgL12P011Descriptor(base: PageOnlyLessonPlayerDescriptor,
  packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>):
  PageOnlyLessonPlayerDescriptor {
  demand(registration?.calibrationId === ALG_L12_P011_CALIBRATION &&
    registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' &&
    registration.freezeManifestSha256 === ALG_L12_P011_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256,
  'actual private module registration');
  demand(base.calibrationId === 'g678-alg-l12-p001-current-js-v1' &&
    base.course.moduleCode === 'ALG001' && base.course.lesson === 12 &&
    base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 15 &&
    base.course.courseShellCount === 0 &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256 &&
    base.pages[0]?.animationId === ALG_L12_P001_ID &&
    base.pages[0]?.rendererAvailability.kind === 'registered' &&
    base.glossary.length === 26 &&
    base.support.lessonHostCapabilities.includes('glossary'),
  'P001 predecessor and source-ordered lesson');
  const target = base.pages[10];
  demand(target?.animationId === ALG_L12_P011_ID &&
    target.placementId === ALG_L12_P011_ID &&
    target.globalPageOrdinal === 11 && target.sectionCode === 'VB' &&
    target.sectionPageOrdinal === 5 &&
    target.previousPlacementId === 'shared-alg001-l12-p010' &&
    target.rendererAvailability.kind === 'unavailable' &&
    target.source.assetId === `swf-${packet.source.sha256}`,
  'exact unavailable eleventh placement');
  const glossary = [...base.glossary];
  for (const entry of sourceGlossary(packet)) {
    const existing = glossary.find(candidate => candidate.id === entry.id);
    if (existing) demand(isDeepStrictEqual(existing, entry),
      `preserve existing glossary: ${entry.id}`);
    else {
      demand(entry.id === 'origin' || entry.id === 'intersect',
        'only two source terms may be added');
      glossary.push(Object.freeze(entry));
    }
  }
  demand(glossary.length === 28 &&
    new Set(glossary.map(entry => entry.id)).size === 28 &&
    isDeepStrictEqual(glossary.slice(0, base.glossary.length), base.glossary),
  'preserve 26 glossary entries and add two');
  const pages = base.pages.map(page => page.animationId === ALG_L12_P011_ID
    ? Object.freeze({...page,
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P011_ID,
        runtimeQuery: Object.freeze({frameDomain: 'sprite-33',
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0'})}),
      runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
      presentation: Object.freeze({
        pageInteractionCompanionTargetIdSuffix: 'origin-glossary-controls',
      }),
    }) : page);
  const selected = pages.filter(page =>
    page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 16 &&
    new Set(selected).size === selected.length &&
    selected.includes(ALG_L12_P001_ID) && selected.includes(ALG_L12_P011_ID),
  'one-page registration delta');
  return Object.freeze({...base, calibrationId: ALG_L12_P011_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P011_ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: ALG_L12_P011_FREEZE.path,
      candidateFreezeManifestSha256: ALG_L12_P011_FREEZE.sha256}),
    pages: Object.freeze(pages), glossary: Object.freeze(glossary),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P011Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL12P011Packet();
  return extendAlgL12P011Descriptor(algL12P001Descriptor(), packet,
    localOnlyAnimationModuleRegistration(ALG_L12_P011_ID));
}

export function algL12P011Canvas() {
  const packet = readAlgL12P011Packet();
  const pin = packet.entry.artifacts.runtime;
  demand(pin.path === RUNTIME_PATH, 'exact local runtime path');
  return {bytes: workspacePin(getWorkspaceRoot(), pin), sha256: pin.sha256};
}
