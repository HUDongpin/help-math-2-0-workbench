import 'server-only';
import {lstatSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {algL6P002Descriptor, readAlgL6P002Binding} from './g678-alg-l06-p002.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const ALG_L6_P001_ID = 'shared-alg001-l06-p001';
export const ALG_L6_P001_CALIBRATION = 'g678-alg-l06-p001-source-title-candidate-v1';
export const ALG_L6_P001_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-alg-l06-p001-source-title-candidate-v1.json',
  bytes: 11039, sha256: '3a9677c5b766818aab4b8472933a9e9b474e1dbf29dc18b9f6d4ec9c494d989b',
});
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number;
  calibrationId: string;
  deploymentScope: string;
  source: Pin;
  sourceXml: Pin;
  inputs: Pin[];
  outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string;
    moduleCode: string; lessonNumber: number; globalPageOrdinal: number;
    sectionCode: string; sectionPageOrdinal: number;
    runtime: {frameDomain: string; frameCount: number; rootEntryFrame: number;
      rendererBinding: Packet['entry']['artifacts']};
    runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {kind: string; module: Pin; timeline: Pin;
    memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean;
  scaleOutAuthorized: boolean;
  acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, message: string): asserts value {
  if (!value) throw Error(`ALG_L6_P001_INVALID: ${message}`);
}

export function readAlgL6P001Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT &&
    !lstatSync(SOURCE_ROOT).isSymbolicLink(), 'real AWS source root');
  const packet = JSON.parse(readAlgL6P002Binding(root, ALG_L6_P001_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === ALG_L6_P001_CALIBRATION &&
    packet.deploymentScope === 'local-only', 'exact local freeze');
  const page = packet.selectedPages[0];
  demand(packet.selectedPages.length === 1 && packet.entry.key === ALG_L6_P001_ID &&
    page.animationId === ALG_L6_P001_ID && page.moduleCode === 'ALG001' &&
    page.lessonNumber === 6 && page.globalPageOrdinal === 1 &&
    page.sectionCode === 'IR' && page.sectionPageOrdinal === 1, 'first source placement');
  demand(packet.source.bytes === 72330 && packet.source.sha256 ===
    '9daa5ffe3a1ea275d9467eadafc7addbbb26d14ad1c289e84b3f66f6b0ab9d35' &&
    page.sourceSha256 === packet.source.sha256 && packet.sourceXml.sha256 ===
    '9f3753a17e5e271d7bc63a1bdf8cd5237f19770bae3f5c7364cabcb62c84ce2c',
  'source identity');
  demand(page.runtime.frameDomain === 'sprite-142' && page.runtime.frameCount === 134 &&
    page.runtime.rootEntryFrame === 6 && packet.entry.artifacts.kind === 'maintained-dom-module-v1' &&
    isDeepStrictEqual(page.runtime.rendererBinding, packet.entry.artifacts), 'renderer binding');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).every(value => value === false), 'independent gates');
  for (const pin of [...packet.inputs, ...packet.outputs]) readAlgL6P002Binding(root, pin);
  return packet;
}

/** Add exactly the source-first title page to the already admitted ALG L6 descriptor. */
export function extendAlgL6P001Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 6 &&
    base.course.activePageCount === 60 && base.course.courseShellCount === 0 &&
    base.pages.length === 60, 'source lesson denominator');
  demand(registration?.calibrationId === ALG_L6_P001_CALIBRATION &&
    registration.deploymentScope === 'local-only' &&
    registration.maturity === 'private-current-js' &&
    registration.rendererBindingKind === 'maintained-dom-module-v1' &&
    registration.freezeManifestSha256 === ALG_L6_P001_FREEZE.sha256 &&
    registration.moduleSha256 === packet.entry.artifacts.module.sha256 &&
    registration.timelineSha256 === packet.entry.artifacts.timeline.sha256 &&
    registration.memberManifestSha256 === packet.entry.artifacts.memberManifest.sha256 &&
    registration.sourceRunSha256 === packet.entry.artifacts.sourceRun.sha256,
  'actual frozen module registration');
  const first = base.pages[0];
  demand(first.animationId === ALG_L6_P001_ID && first.placementId === ALG_L6_P001_ID &&
    first.globalPageOrdinal === 1 && first.sectionCode === 'IR' &&
    first.sectionPageOrdinal === 1 && first.rendererAvailability.kind === 'unavailable' &&
    first.source.assetId === `swf-${packet.source.sha256}` &&
    base.source.sourceXmlPath === packet.sourceXml.path &&
    base.source.sourceXmlSha256 === packet.sourceXml.sha256, 'exact unavailable source page');
  const second = base.pages[1];
  demand(second.animationId === 'shared-alg001-l06-p002' &&
    second.globalPageOrdinal === 2 && second.rendererAvailability.kind === 'registered' &&
    second.rendererAvailability.moduleKey === second.animationId, 'registered P002 predecessor');
  const pages = base.pages.map(page => page.animationId === ALG_L6_P001_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L6_P001_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-142', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    new Set(selected).size === selected.length, 'one-page registration delta');
  return Object.freeze({...base, calibrationId: ALG_L6_P001_CALIBRATION,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L6_P001_ID}?host=1`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: ALG_L6_P001_FREEZE.path,
      candidateFreezeManifestSha256: ALG_L6_P001_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}

export function algL6P001Descriptor(): PageOnlyLessonPlayerDescriptor {
  return extendAlgL6P001Descriptor(algL6P002Descriptor(), readAlgL6P001Packet(),
    localOnlyAnimationModuleRegistration(ALG_L6_P001_ID));
}
