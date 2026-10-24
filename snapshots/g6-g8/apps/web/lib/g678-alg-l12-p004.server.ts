import {resolveG678PhysicalPath} from '../../../lib/g678-life-root-binding-v1.mjs';
import 'server-only';

import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';

import {localOnlyAnimationModuleRegistration} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {ALG_L12_P002_CALIBRATION, ALG_L12_P002_FREEZE,
  ALG_L12_P002_ID, algL12P002Descriptor} from './g678-alg-l12-p002.server';
import type {PageOnlyLessonGlossaryEntry, PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage} from
  './whole-lesson-player-descriptor';

export const ALG_L12_P004_ID = 'shared-alg001-l12-p004';
export const ALG_L12_P004_CALIBRATION = 'g678-alg-l12-p004-current-js-v1';
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const GLOSSARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const SOURCE_SHA = '4d7aa78bd955aa52d476f31548c97135da989daf9d106986ff06a954c6d8b334';
const RUNTIME_SHA = 'd4cd5a861761c4548793b8f94468b5284d5a1c98a68bc99ff5267344df124d13';
const RUNTIME_PATH =
  `work/g678-shared-page-factory/${ALG_L12_P004_CALIBRATION}/members/${ALG_L12_P004_ID}/canvas-renderer.js`;
export const ALG_L12_P004_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l12-p004-current-js-v2.json',
  bytes: 5781,
  sha256: '15f007eea3e5d19c34f8b3ef82cb67308746333da61b1a0314d246c52b3219df',
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
  sourceAudit: Pin; candidateManifest: Pin; sourceGlossary: Pin; hostAdapter: Pin;
  glossaryHostBoundary: Readonly<{sourceButtonCount: number;
    existingLessonEntryIds: readonly string[];
    supplementalEntryIds: readonly string[];
    pageClosePolicy: string; allSourceButtonsMappedToEntries: boolean;
    originalHostLookupVerified: boolean}>;
  entry: Readonly<{key: string; module: string; maturity: string;
    complexityLane: string; artifacts: Readonly<{
      module: Pin; timeline: Pin; runtime: Pin}>}>;
  acceptanceEffects: Record<string, boolean>;
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}>;
type GlossarySource = Readonly<{
  schemaVersion: number; animationId: string; sourceDirectory: string;
  physicalSources: Readonly<Record<'en' | 'es', Readonly<{
    file: string; bytes: number; sha256: string}>>>;
  entries: readonly Readonly<PageOnlyLessonGlossaryEntry & {
    rawScreenkeyTerm: string; requestedSourceKey: string;
    keyMappingDecision: string;
    sourceEntrySha256: Readonly<Record<'en' | 'es', string>>;
  }>[];
  originalHostLookupVerified: boolean;
  companionMediaVerified: boolean;
  acceptanceEffect: string;
}>;

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`ALG_L12_P004_INVALID: ${reason}`);
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

const SOURCE_GLOSSARY_TERMS = Object.freeze([
  ['function', 'Function'],
  ['graph', 'Graph'],
  ['point', 'Point'],
  ['vertical', 'Vertical'],
  ['vertical-line-test', 'Vertical-line test'],
] as const);

function readP004SourceGlossary(root: string, pin: Pin): GlossarySource {
  const glossary = JSON.parse(workspacePin(root, pin).toString()) as GlossarySource;
  demand(glossary.schemaVersion === 1 &&
    glossary.animationId === ALG_L12_P004_ID &&
    glossary.sourceDirectory === GLOSSARY_ROOT &&
    glossary.originalHostLookupVerified === false &&
    glossary.companionMediaVerified === false &&
    glossary.acceptanceEffect === 'none' &&
    Array.isArray(glossary.entries) && glossary.entries.length === 5 &&
    realpathSync(resolveG678PhysicalPath(GLOSSARY_ROOT)) === resolveG678PhysicalPath(GLOSSARY_ROOT) &&
    lstatSync(resolveG678PhysicalPath(GLOSSARY_ROOT)).isDirectory() &&
    !lstatSync(resolveG678PhysicalPath(GLOSSARY_ROOT)).isSymbolicLink(),
  'pinned physical bilingual glossary');
  const sourcePins = {
    en: {file: 'L1KTE01.xml', bytes: 345838,
      sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
    es: {file: 'L1KTS01.xml', bytes: 344456,
      sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
  } as const;
  demand(isDeepStrictEqual(glossary.physicalSources, sourcePins),
    'physical glossary source pins');
  for (const lang of ['en', 'es'] as const) {
    const pin = sourcePins[lang];
    readPinned(path.join(GLOSSARY_ROOT, pin.file),
      {path: pin.file, bytes: pin.bytes, sha256: pin.sha256});
  }
  demand(isDeepStrictEqual(glossary.entries.map(entry =>
    [entry.id, entry.requestedSourceKey]), SOURCE_GLOSSARY_TERMS),
  'five source requests and stable entry order');
  for (const entry of glossary.entries) {
    demand(entry.sourceKeyAttribute === entry.requestedSourceKey &&
      entry.labels.en && entry.labels.es &&
      entry.definitions.en && entry.definitions.es &&
      entry.source.en.assetId === 'G678L1KTE01.xml' &&
      entry.source.en.path === 'HELP_KEYTERMS/KT/XML/L1KTE01.xml' &&
      entry.source.en.sha256 === sourcePins.en.sha256 &&
      entry.source.es.assetId === 'G678L1KTS01.xml' &&
      entry.source.es.path === 'HELP_KEYTERMS/KT/XML/L1KTS01.xml' &&
      entry.source.es.sha256 === sourcePins.es.sha256 &&
      /^[a-f0-9]{64}$/u.test(entry.sourceEntrySha256.en) &&
      /^[a-f0-9]{64}$/u.test(entry.sourceEntrySha256.es),
    `source-bound glossary entry: ${entry.id}`);
    if (entry.id === 'vertical-line-test') {
      demand(entry.rawScreenkeyTerm === 'vertical-line test' &&
        entry.keyMappingDecision.includes('case-insensitive') &&
        entry.keyMappingDecision.includes('original host lookup unverified'),
      'recorded case-only source alias');
    } else demand(entry.rawScreenkeyTerm === entry.requestedSourceKey &&
      entry.keyMappingDecision === 'exact', 'exact source request key');
  }
  return glossary;
}

export function readAlgL12P004Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === resolveG678PhysicalPath(SOURCE_ROOT) &&
    realpathSync(resolveG678PhysicalPath(SOURCE_ROOT)) === resolveG678PhysicalPath(SOURCE_ROOT) &&
    lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isDirectory() &&
    !lstatSync(resolveG678PhysicalPath(SOURCE_ROOT)).isSymbolicLink(), 'physical AWS source root');
  const packet = JSON.parse(workspacePin(root, ALG_L12_P004_FREEZE).toString()) as Packet;
  const page = packet.selectedPages?.[0];
  demand(packet.schemaVersion === 1 &&
    packet.calibrationId === ALG_L12_P004_CALIBRATION &&
    packet.deploymentScope === 'local-only' &&
    packet.predecessor.calibrationId === ALG_L12_P002_CALIBRATION &&
    packet.predecessor.freezeManifestSha256 === ALG_L12_P002_FREEZE.sha256 &&
    packet.predecessor.registeredAnimationCount === 17 &&
    packet.selectedPages.length === 1 &&
    page?.animationId === ALG_L12_P004_ID &&
    page.placementId === ALG_L12_P004_ID &&
    page.assetId === `swf-${SOURCE_SHA}` &&
    page.sourceSha256 === SOURCE_SHA &&
    page.stableLessonKey === 'shared-alg001-l12' &&
    page.moduleCode === 'ALG001' && page.lessonNumber === 12 &&
    page.globalPageOrdinal === 4 && page.sectionCode === 'RW' &&
    page.sectionPageOrdinal === 3 &&
    page.complexityLane === 'interactive-understood' &&
    page.runtime.frameDomain === 'sprite-90' &&
    page.runtime.frameCount === 969 &&
    page.runtime.rootFrameCount === 10 && page.runtime.rootBeginFrame === 6 &&
    page.runtime.audioPlaybackEnabled === false &&
    page.runtime.canvasRenderer.path === RUNTIME_PATH &&
    page.runtime.canvasRenderer.bytes === 18639014 &&
    page.runtime.canvasRenderer.sha256 === RUNTIME_SHA &&
    page.runtime.canvasRenderer.url ===
      `/flash-assets/g678-local/${ALG_L12_P004_ID}/canvas-renderer.js` &&
    packet.entry.key === ALG_L12_P004_ID &&
    packet.entry.module === `./modules/${ALG_L12_P004_ID}` &&
    packet.entry.maturity === 'private-current-js' &&
    packet.entry.complexityLane === page.complexityLane &&
    isDeepStrictEqual(packet.entry.artifacts.runtime,
      {path: RUNTIME_PATH, bytes: 18639014, sha256: RUNTIME_SHA}),
  'exact fourth placement and silent composed runtime');
  demand(packet.productCalibrationPassed === false &&
    packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).length > 0 &&
    Object.values(packet.acceptanceEffects).every(value => value === false),
  'independent acceptance gates');
  demand(packet.glossaryHostBoundary.sourceButtonCount === 5 &&
    isDeepStrictEqual(packet.glossaryHostBoundary.existingLessonEntryIds,
      ['vertical', 'point']) &&
    isDeepStrictEqual(packet.glossaryHostBoundary.supplementalEntryIds,
      ['function', 'graph', 'vertical-line-test']) &&
    packet.glossaryHostBoundary.pageClosePolicy ===
      'restore-pre-request-pause-on-dialog-close; original-host-parity-pending' &&
    packet.glossaryHostBoundary.allSourceButtonsMappedToEntries === true &&
    packet.glossaryHostBoundary.originalHostLookupVerified === false,
  'disclosed glossary host boundary');
  demand(packet.source.path === 'G6-G8-shared/ALG001/L12/RW/L12RW04.swf' &&
    packet.source.sha256 === SOURCE_SHA && packet.source.bytes === 363811 &&
    packet.sourceXml.path === 'G6-G8-shared/ALG001/L12/index.xml' &&
    packet.sourceXml.sha256 ===
      '0755afb5645d3179fb1105641b0d1f1b06d8c803c02484bfbdc703ba5bb6f325' &&
    packet.sourceCatalog.path === 'catalog/g678-shared-catalog.v1.json' &&
    packet.sourceAudit.path ===
      'migrations/shared-alg001-l12-p004/MIGRATION_BRIEF.md' &&
    packet.candidateManifest.path ===
      'migrations/shared-alg001-l12-p004/candidate-v1/adapter-manifest.json' &&
    packet.sourceGlossary.path ===
      'migrations/shared-alg001-l12-p004/audit/source-glossary-v1.json' &&
    packet.hostAdapter.path ===
      'apps/web/app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p004/player.tsx',
  'source and candidate paths');
  readPinned(path.join(SOURCE_ROOT, packet.source.path), packet.source);
  readPinned(path.join(SOURCE_ROOT, packet.sourceXml.path), packet.sourceXml);
  for (const pin of [packet.sourceCatalog, packet.sourceAudit, packet.hostAdapter,
    ...Object.values(packet.entry.artifacts)]) workspacePin(root, pin);
  readP004SourceGlossary(root, packet.sourceGlossary);
  const candidate = JSON.parse(workspacePin(root, packet.candidateManifest).toString());
  demand(candidate.animationId === ALG_L12_P004_ID &&
    candidate.status === 'unregistered-composed-drawing-candidate' &&
    candidate.sourceSha256 === SOURCE_SHA &&
    candidate.runtimeSha256 === RUNTIME_SHA &&
    candidate.runtimeBytes === 18639014 &&
    candidate.composition?.rootFrame === 6 &&
    candidate.composition.main?.objectId === 90 &&
    candidate.composition.title?.objectId === 92 &&
    candidate.composition.border?.objectId === 93 &&
    candidate.acceptanceEffects?.currentJavaScriptRegistered === false &&
    candidate.acceptanceEffects?.audioAccepted === false &&
    candidate.acceptanceEffects?.fidelityAccepted === false &&
    candidate.acceptanceEffects?.strictComplete === false,
  'candidate-v1 composition and runtime');
  return packet;
}

export function extendAlgL12P004Descriptor(base: PageOnlyLessonPlayerDescriptor,
  packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>):
  PageOnlyLessonPlayerDescriptor {
  demand(packet.glossaryHostBoundary.allSourceButtonsMappedToEntries === true,
    'five source glossary terms need real lesson definitions');
  demand(registration?.calibrationId === ALG_L12_P004_CALIBRATION &&
    registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' &&
    registration.freezeManifestSha256 === ALG_L12_P004_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === RUNTIME_SHA,
  'actual private module registration');
  demand(base.calibrationId === ALG_L12_P002_CALIBRATION &&
    base.source.candidateFreezeManifestSha256 === ALG_L12_P002_FREEZE.sha256 &&
    base.course.moduleCode === 'ALG001' && base.course.lesson === 12 &&
    base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 17 &&
    base.course.courseShellCount === 0 &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256 &&
    base.pages[1]?.animationId === ALG_L12_P002_ID &&
    base.pages[1]?.rendererAvailability.kind === 'registered' &&
    base.glossary.length === 28 &&
    base.support.lessonHostCapabilities.includes('glossary'),
  'P002 predecessor and source-ordered lesson');
  const target = base.pages[3];
  demand(target?.animationId === ALG_L12_P004_ID &&
    target.placementId === ALG_L12_P004_ID &&
    target.globalPageOrdinal === 4 && target.sectionCode === 'RW' &&
    target.sectionPageOrdinal === 3 &&
    target.previousPlacementId === 'shared-alg001-l12-p003' &&
    target.rendererAvailability.kind === 'unavailable' &&
    target.source.assetId === `swf-${SOURCE_SHA}`,
  'exact unavailable fourth placement');
  const glossary = [...base.glossary];
  for (const source of readP004SourceGlossary(getWorkspaceRoot(),
    packet.sourceGlossary).entries) {
    const entry: PageOnlyLessonGlossaryEntry = {
      id: source.id, sourceKeyAttribute: source.sourceKeyAttribute,
      labels: source.labels, definitions: source.definitions, source: source.source,
    };
    const prior = glossary.find(candidate => candidate.id === entry.id);
    if (prior) demand(isDeepStrictEqual(prior, entry),
      `preserve existing glossary: ${entry.id}`);
    else {
      demand(packet.glossaryHostBoundary.supplementalEntryIds.includes(entry.id),
        'only source-backed P004 terms may be added');
      glossary.push(Object.freeze(entry));
    }
  }
  demand(glossary.length === 31 &&
    isDeepStrictEqual(glossary.slice(0, base.glossary.length), base.glossary) &&
    new Set(glossary.map(entry => entry.id)).size === 31 &&
    SOURCE_GLOSSARY_TERMS.every(([id, key]) => glossary.some(entry =>
      entry.id === id && entry.sourceKeyAttribute === key)),
  'preserve 28 entries and append three exact source-bound terms');
  const pages = base.pages.map(page => page.animationId === ALG_L12_P004_ID
    ? Object.freeze({...page,
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P004_ID,
        runtimeQuery: Object.freeze({frameDomain: 'sprite-90',
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0'})}),
      runtimeEvidenceBoundary: packet.selectedPages[0]!.runtimeEvidenceBoundary,
      presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'p004-glossary-controls'}),
    }) : page);
  const selected = pages.filter(page =>
    page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 18 &&
    new Set(selected).size === selected.length &&
    selected.includes(ALG_L12_P002_ID) && selected.includes(ALG_L12_P004_ID) &&
    selected.filter(id => id !== ALG_L12_P004_ID).every(id =>
      base.productBridge.selectedAnimationIds.includes(id)),
  'one-page proposed registration delta');
  return Object.freeze({...base, calibrationId: ALG_L12_P004_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P004_ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: ALG_L12_P004_FREEZE.path,
      candidateFreezeManifestSha256: ALG_L12_P004_FREEZE.sha256}),
    pages: Object.freeze(pages), glossary: Object.freeze(glossary),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}

export function algL12P004Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readAlgL12P004Packet();
  return extendAlgL12P004Descriptor(algL12P002Descriptor(), packet,
    localOnlyAnimationModuleRegistration(ALG_L12_P004_ID));
}

export function algL12P004Canvas() {
  const packet = readAlgL12P004Packet();
  return {bytes: workspacePin(getWorkspaceRoot(), packet.entry.artifacts.runtime),
    sha256: RUNTIME_SHA};
}
