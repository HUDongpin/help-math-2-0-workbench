import 'server-only';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL1P010Descriptor, readNmsL1P010Binding, NMS_L1_P010_CALIBRATION, NMS_L1_P010_FREEZE} from './g678-nms-l01-p010.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L1_P011_ID = 'shared-nms002-l01-p011';
export const NMS_L1_P011_CALIBRATION = 'g678-nms-l01-p011-current-js-v1';
export const NMS_L1_P011_FREEZE = Object.freeze({"path": "catalog/product-bridge-calibrations/g678-nms-l01-p011-current-js-v1.json", "bytes": 82034, "sha256": "2b0dc266c98c16ad658174a5158af31260e1a2d3f7cb0ed37526a25e68327911"});
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
function demand(value: unknown, message: string): asserts value { if (!value) throw Error(`NMS_L1_P011_INVALID: ${message}`); }
export const readNmsL1P011Binding = readNmsL1P010Binding;
export function readNmsL1P011Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  const packet = JSON.parse(readNmsL1P011Binding(root, NMS_L1_P011_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L1_P011_CALIBRATION && packet.deploymentScope === 'local-only', 'local candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L1_P011_ID && packet.entry.key === NMS_L1_P011_ID, 'exact single page');
  demand(packet.source.sha256 === '47d582e2d97b6ad33cdf5588a4894fde7ceeef80703fe1862f625cacb4fea481' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 && packet.source.bytes === 785655, 'source identity');
  demand(packet.audioPlan.mainFrameCount === 145 && packet.audioPlan.questionFrame === 102 && packet.audioPlan.outroFirstFrame === 103 &&
    packet.practice.actions.hostTerminalStop === 145 && isDeepStrictEqual(packet.practice.actions.mainStops, [102]), 'source and host stops');
  demand(isDeepStrictEqual(packet.audioPlan.branches.map(b => [b.kind, b.index, b.sourceCharacterId, b.frameCount]), [["wrong", 1, 92, 30], ["wrong", 2, 68, 28], ["wrong", 3, 80, 29], ["right", 1, 155, 27], ["right", 2, 183, 28], ["right", 3, 207, 28], ["right", 4, 143, 27]]), 'complete source host branch set');
  demand(isDeepStrictEqual(packet.audioPlan.clips.map(c => c.frameDomain), ["sprite-214", "sprite-92", "sprite-68", "sprite-80", "sprite-155", "sprite-183", "sprite-207", "sprite-143"]), 'all eight active MP3 streams');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false && Object.values(packet.acceptanceEffects).every(v => v === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL1P011Binding(root, pin);
  demand(packet.selectedPages[0].runtime.canvasRenderer.path === packet.entry.artifacts.runtime.path, 'source runtime');
  return packet;
}
export function extendNmsL1P011Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 1 && base.course.activePageCount === 47 &&
    base.pages.length === 47 && base.course.courseShellCount === 0, 'source lesson denominator');
  demand(registration?.calibrationId === NMS_L1_P011_CALIBRATION && registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L1_P011_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 && registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.runtimeSha256 === packet.entry.artifacts.runtime.sha256, 'actual registered module');
  demand(base.calibrationId === NMS_L1_P010_CALIBRATION && base.source.candidateFreezeManifestSha256 === NMS_L1_P010_FREEZE.sha256 &&
    base.productBridge.registeredAnimationCount === 20, 'validated preceding20-page lesson');
  const old = base.pages[10];
  demand(old.animationId === NMS_L1_P011_ID && old.placementId === NMS_L1_P011_ID && old.globalPageOrdinal === 11 &&
    old.sectionCode === 'VB' && old.sectionPageOrdinal === 6 && old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${packet.source.sha256}`, 'exact unavailable source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  demand(base.glossary.length === 30 && !base.glossary.some(e => e.id === 'represent') && packet.sourceGlossary.entries.length === 4, 'source glossary predecessor');
  const glossary = [...base.glossary];
  for (const entry of packet.sourceGlossary.entries) {
    demand(['absolute-value', 'distance', 'number-line', 'represent'].includes(entry.id), 'exact glossary scope');
    const projected = {id: entry.id, sourceKeyAttribute: entry.sourceKeyAttribute, labels: entry.labels, definitions: entry.definitions, source: entry.source};
    const old = glossary.find(e => e.id === entry.id);
    if (old) demand(isDeepStrictEqual(old, projected), 'preserve existing glossary'); else glossary.push(Object.freeze(projected));
  }
  demand(glossary.length === 31 && new Set(glossary.map(e => e.id)).size === 31, 'one source glossary addition');
  const pages = base.pages.map(page => page.animationId === NMS_L1_P011_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L1_P011_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-214', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
    presentation: Object.freeze({pageInteractionCompanionTargetIdSuffix: 'terminal-source-v1-readable'}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 21 && new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, glossary: Object.freeze(glossary), calibrationId: NMS_L1_P011_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${NMS_L1_P011_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L1_P011_FREEZE.path, candidateFreezeManifestSha256: NMS_L1_P011_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function nmsL1P011Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL1P011Packet();
  return extendNmsL1P011Descriptor(nmsL1P010Descriptor(), packet, localOnlyAnimationModuleRegistration(NMS_L1_P011_ID));
}
export function nmsL1P011Canvas(): {bytes: Buffer; sha256: string} {
  const binding = readNmsL1P011Packet().entry.artifacts.runtime;
  demand(binding.path === `work/g678-shared-page-factory/g678-nms-l01-p011-current-js-v1/members/${NMS_L1_P011_ID}/canvas-renderer.js`, 'exact Canvas path');
  return {bytes: readNmsL1P011Binding(getWorkspaceRoot(), binding), sha256: binding.sha256};
}
