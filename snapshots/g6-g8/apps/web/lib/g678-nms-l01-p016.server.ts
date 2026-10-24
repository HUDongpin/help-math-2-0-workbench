import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P015Descriptor, readNmsL1P015Binding, NMS_L1_P015_CALIBRATION, NMS_L1_P015_FREEZE} from './g678-nms-l01-p015.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P016_ID = 'shared-nms002-l01-p016';
export const NMS_L1_P016_CALIBRATION = 'g678-nms-l01-p016-current-js-v1';
export const NMS_L1_P016_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-nms-l01-p016-current-js-v1.json',
  bytes: 123364, sha256: 'cb41bb7dd7f613d44218cd088b2e7f635fc9511d4bfc269e4f0954ba12c49765',
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  selectedPages: Array<{animationId: string; sourceSha256: string; runtime: {canvasRenderer: Pin}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  sourceGlossary: {entries: PageOnlyLessonPlayerDescriptor['glossary']};
  source: Pin; sourceXml: Pin; sourceCatalog: Pin; inputs: Pin[]; outputs: Pin[];
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; runtime: Pin}};
  audioPlan: {mainFrameCount: number; questionFrame: number; outroFirstFrame: number; clips: {frameDomain: string}[];
    branches: {kind: string; index: number; sourceCharacterId: number; frameCount: number}[]};
  practice: {actions: {mainStops: number[]; hostTerminalStop: number}};
  acceptanceEffects: Record<string, boolean>; productCalibrationPassed: boolean; scaleOutAuthorized: boolean;
}
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P016_INVALID: ${message}`); }
export const readNmsL1P016Binding = readNmsL1P015Binding;
export function readNmsL1P016Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P016Binding(root, NMS_L1_P016_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P016_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P016_ID && packet.entry.key === NMS_L1_P016_ID, 'exact single page');
  demand(packet.source.sha256 === '1e283560185a227c44498b8d0a77790323f0b006dfa0c4aadb7fe07bc8f757c6' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 747595, 'source identity');
  demand(packet.audioPlan.mainFrameCount === 73 && packet.audioPlan.questionFrame === 49 && packet.audioPlan.outroFirstFrame === 50 &&
    packet.practice.actions.hostTerminalStop === 73 && isDeepStrictEqual(packet.practice.actions.mainStops, [49]), 'source and host stops');
  demand(isDeepStrictEqual(packet.audioPlan.branches.map(b => [b.kind, b.index, b.sourceCharacterId, b.frameCount]), [
    ['wrong', 1, 132, 29], ['wrong', 2, 144, 29], ['wrong', 3, 157, 28],
    ['right', 2, 50, 25], ['right', 3, 86, 28], ['right', 4, 58, 27], ['right', 5, 107, 33],
  ]), 'complete source host branch set');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c => c.frameDomain), ['sprite-158', 'sprite-132', 'sprite-144', 'sprite-157', 'sprite-50', 'sprite-86', 'sprite-58', 'sprite-107']), 'seven active and one dormant source audio streams');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P016Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P016Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(packet.audioPlan.mainFrameCount === 73 && packet.audioPlan.questionFrame === 49 && packet.audioPlan.outroFirstFrame === 50 && packet.practice.actions.hostTerminalStop === 73, 'source and host stop policy');
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P016_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P016_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P015_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P015_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 23, 'validated preceding23-page lesson');
  const old = base.pages[15];
  demand(old.animationId === NMS_L1_P016_ID && old.placementId === NMS_L1_P016_ID && old.globalPageOrdinal === 16 &&
    old.sectionCode === 'IN' && old.sectionPageOrdinal === 5 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 31 && base.glossary.some(e => e.id === 'absolute-value') && packet.sourceGlossary.entries.length === 5, 'source glossary predecessor');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['opposite-integers', 'integers', 'distance', 'number-line', 'direction'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const old = glossary.find(e => e.id === entry.id);
    if (old) demand(isDeepStrictEqual(old, projected), 'preserve existing glossary'); else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length === 31 && new Set(glossary.map(e => e.id)).size === 31 && isDeepStrictEqual(glossary, base.glossary), 'five source keys preserve31 existing terms');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P016_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P016_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-158', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 24 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P016_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P016_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P016_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P016_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P016Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P016Packet();
  return extendNmsL1P016Descriptor(nmsL1P015Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P016_ID));
}
export function nmsL1P016Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P016Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p016-current-js-v1/members/${NMS_L1_P016_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P016Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
