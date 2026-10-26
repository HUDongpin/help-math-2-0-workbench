import 'server-only';

import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';

import {getWorkspaceRoot} from './catalog';
import {readNmsL09P003Binding} from './g678-nms-l09-p003-binding.server';
import {NMS_L09_P003_FREEZE} from './g678-nms-l09-p003-freeze-v3';
import {findG678PartialCalibrationDescriptor} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const NMS_L09_P003_ID = 'shared-nms002-l09-p003';
export const NMS_L09_P003_CALIBRATION = 'g678-nms-l09-p003-product-candidate-v3';
const SOURCE_SHA256 = 'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd';
const SOURCE_XML_SHA256 = '29e77c35dfa9d8942bf453f377743c7548d15015d9e1d9333353366b6516c200';

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Selected = Readonly<{
  animationId: string;
  sourceSha256: string;
  stableLessonKey: string;
  moduleCode: string;
  lessonNumber: number;
  globalPageOrdinal: number;
  sectionCode: string;
  sectionPageOrdinal: number;
  runtime: Readonly<{
    frameDomain: string; language: string; scenario: string; seed: string;
  }>;
  runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary'];
}>;
interface Packet {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  source: Pin;
  sourceXml: Pin;
  sourceCatalog: Pin;
  selectedPages: Selected[];
  entry: Readonly<{
    key: string; module: string; maturity: string; complexityLane: string;
    artifacts: Readonly<{
      kind: string; module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin;
    }>;
  }>;
  inputs: Pin[];
  outputs: Pin[];
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
  acceptanceEffects: Record<string, boolean>;
}

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error('NMS_L09_P003_INVALID:' + reason);
}

export function readNmsL09P003Packet(): Packet {
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readNmsL09P003Binding(root, NMS_L09_P003_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L09_P003_CALIBRATION &&
    packet.deploymentScope === 'local-only' && packet.selectedPages.length === 1 &&
    packet.entry.key === NMS_L09_P003_ID && packet.entry.maturity === 'private-current-js' &&
    packet.entry.complexityLane === 'behavior-heavy' &&
    packet.entry.module === './modules/g678-nms-l09-native-candidate-p003' &&
    packet.entry.artifacts.kind === 'maintained-dom-module-v1', 'candidate identity');
  const selected = packet.selectedPages[0];
  demand(selected.animationId === NMS_L09_P003_ID &&
    selected.sourceSha256 === SOURCE_SHA256 && packet.source.sha256 === SOURCE_SHA256 &&
    packet.source.bytes === 473410 && packet.sourceXml.sha256 === SOURCE_XML_SHA256 &&
    packet.sourceXml.path === 'G6-G8-shared/NMS002/L9/index.xml' &&
    selected.stableLessonKey === 'shared-nms002-l09' && selected.moduleCode === 'NMS002' &&
    selected.lessonNumber === 9 && selected.globalPageOrdinal === 3 &&
    selected.sectionCode === 'RW' && selected.sectionPageOrdinal === 2 &&
    selected.runtime.frameDomain === 'sprite-246' && selected.runtime.language === 'fixed-en' &&
    selected.runtime.scenario === 'source-static-frame' && selected.runtime.seed === '0',
  'source and runtime identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    Object.keys(packet.acceptanceEffects).length === 7 &&
    Object.values(packet.acceptanceEffects).every(value => value === false) &&
    selected.runtimeEvidenceBoundary?.audioAcceptance === 'not-established' &&
    selected.runtimeEvidenceBoundary?.naturalTraceValidation === 'not-established',
  'acceptance boundary');
  for (const pin of [...packet.inputs, ...packet.outputs]) readNmsL09P003Binding(root, pin);
  const artifacts = packet.entry.artifacts;
  const registration = localOnlyAnimationModuleRegistration(NMS_L09_P003_ID);
  demand(registration?.calibrationId === NMS_L09_P003_CALIBRATION &&
    registration.deploymentScope === 'local-only' && registration.maturity === 'private-current-js' &&
    registration.freezeManifestSha256 === NMS_L09_P003_FREEZE.sha256 &&
    registration.moduleSha256 === artifacts.module.sha256 &&
    registration.timelineSha256 === artifacts.timeline.sha256 &&
    registration.rendererBindingKind === 'maintained-dom-module-v1' &&
    registration.memberManifestSha256 === artifacts.memberManifest.sha256 &&
    registration.sourceRunSha256 === artifacts.sourceRun.sha256,
  'registered module');
  return packet;
}

/** One source-ordered page addition to the existing private Lesson 9 host. */
export function nmsL09P003Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL09P003Packet();
  const base = findG678PartialCalibrationDescriptor('shared-nms002-l09-p006');
  demand(base && base.course.moduleCode === 'NMS002' && base.course.lesson === 9 &&
    base.course.activePageCount === 53 && base.course.courseShellCount === 0 &&
    base.pages.length === 53 && base.pages.every((page, index) =>
      page.globalPageOrdinal === index + 1), 'source-ordered lesson');
  const old = base.pages[2];
  demand(old.animationId === NMS_L09_P003_ID && old.placementId === NMS_L09_P003_ID &&
    old.sectionCode === 'RW' && old.sectionPageOrdinal === 2 &&
    old.rendererAvailability.kind === 'unavailable' &&
    old.source.assetId === `swf-${SOURCE_SHA256}` &&
    base.source.sourceXmlPath === packet.sourceXml.path &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256,
  'unavailable exact placement');
  const selected = packet.selectedPages[0];
  const pages = base.pages.map(page => page.animationId !== NMS_L09_P003_ID ? page : Object.freeze({
    ...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L09_P003_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-246', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: selected.runtimeEvidenceBoundary,
  }));
  const selectedIds = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(selectedIds.length === base.productBridge.registeredAnimationCount + 1 &&
    new Set(selectedIds).size === selectedIds.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L09_P003_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${NMS_L09_P003_ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: NMS_L09_P003_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L09_P003_FREEZE.sha256}),
    pages: Object.freeze(pages),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selectedIds),
      registeredAnimationCount: selectedIds.length}),
  });
}
