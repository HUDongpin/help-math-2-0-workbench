import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import type {PageOnlyLessonPlayerDescriptor, WholeLessonPlayerPage} from './whole-lesson-player-descriptor';

export const GEO_L06_P001_ID = 'shared-geo001-l06-p001';
export const GEO_L06_P001_CALIBRATION = 'g678-geo-l06-p001-native-current-js-v1';
export const GEO_L06_P001_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-geo-l06-p001-native-current-js-v1.json',
  bytes: 3501,
  sha256: '33cbce628008b5ae6a2a54a31502effe855ccbfbd548b459594a3ba49c007ea5',
});
const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
type Artifacts = Readonly<{kind: 'maintained-dom-module-v1'; module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}>;
interface Packet {
  schemaVersion: 1;
  calibrationId: string;
  deploymentScope: 'local-only';
  sourceRoot: string;
  source: Pin;
  sourceXml: Readonly<{path: string; sha256: string}>;
  selectedPages: Array<{animationId: string; placementId: string; globalPageOrdinal: number;
    sectionCode: string; sourceSha256: string; complexityLane: string;
    runtime: {rendererBinding: Artifacts}; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>
  entry: {key: string; artifacts: Artifacts};
  productCalibrationPassed: false;
  scaleOutAuthorized: false;
  acceptanceEffects: Record<string, boolean>;
}

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`GEO_L06_P001_INVALID: ${reason}`);
}
function readBound(root: string, pin: Readonly<{path: string; sha256: string; bytes?: number}>) {
  demand(!path.isAbsolute(pin.path) && !pin.path.split('/').some(part => !part || part === '.' || part === '..'), 'bounded path');
  const file = path.join(root, pin.path), before = lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n && realpathSync(file) === file, 'physical file');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand(before.dev === after.dev && before.ino === after.ino && before.size === after.size &&
    before.mtimeNs === after.mtimeNs && before.nlink === after.nlink &&
    (pin.bytes === undefined || bytes.length === pin.bytes) &&
    createHash('sha256').update(bytes).digest('hex') === pin.sha256, `hash: ${pin.path}`);
  return bytes;
}
export function readGeoL06P001Packet(root = getWorkspaceRoot()): Packet {
  demand(process.env.NODE_ENV !== 'production', 'production closed');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT && realpathSync(SOURCE_ROOT) === SOURCE_ROOT, 'exact source root');
  const packet = JSON.parse(readBound(root, GEO_L06_P001_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === GEO_L06_P001_CALIBRATION &&
    packet.deploymentScope === 'local-only' && packet.sourceRoot === SOURCE_ROOT &&
    packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false &&
    Object.values(packet.acceptanceEffects).every(value => value === false), 'local-only closed candidate');
  demand(packet.source.path === 'G6-G8-shared/GEO001/L6/IR/L6IR01.swf' && packet.source.bytes === 17922 &&
    packet.source.sha256 === '8997176bb8c1f3e68a8011ee98f132ece217c881b2407b90b42ea4067de49c58' &&
    packet.sourceXml.path === 'G6-G8-shared/GEO001/L6/index.xml' &&
    packet.sourceXml.sha256 === 'f0c135ad236babcb2f31afed8db3204cdeaeb57f9fc590e2e1a639245a443834', 'source identity');
  readBound(SOURCE_ROOT, packet.source);
  readBound(SOURCE_ROOT, packet.sourceXml);
  demand(packet.selectedPages.length === 1 && packet.entry.key === GEO_L06_P001_ID &&
    packet.selectedPages[0].animationId === GEO_L06_P001_ID &&
    packet.selectedPages[0].placementId === GEO_L06_P001_ID &&
    packet.selectedPages[0].globalPageOrdinal === 1 &&
    packet.selectedPages[0].sectionCode === 'IR' &&
    packet.selectedPages[0].sourceSha256 === packet.source.sha256 &&
    packet.selectedPages[0].complexityLane === 'behavior-heavy' &&
    JSON.stringify(packet.selectedPages[0].runtime.rendererBinding) === JSON.stringify(packet.entry.artifacts), 'exact first page');
  const artifacts = packet.entry.artifacts;
  demand(artifacts.kind === 'maintained-dom-module-v1', 'maintained native renderer');
  for (const binding of [artifacts.module, artifacts.timeline, artifacts.memberManifest, artifacts.sourceRun]) readBound(root, binding);
  const member = JSON.parse(readBound(root, artifacts.memberManifest).toString()) as {
    animationId?: string; sourceSwfSha256?: string; implementation?: Pin[];
    deploymentScope?: string; productCalibrationPassed?: boolean;
  };
  const expectedPaths = [
    artifacts.module.path, artifacts.timeline.path,
    'packages/demos/src/geo-l06-p001-timeline-v1.ts',
    'packages/demos/src/geo-l06-p001-text-v1.ts',
    'packages/demos/src/geo-l06-p001-renderer-v1.tsx',
    'packages/demos/src/geo-l06-p001-v1.css',
    'packages/demos/src/generated/geo001-l06-p001-source-ir-v1.json',
  ];
  demand(member.animationId === GEO_L06_P001_ID && member.sourceSwfSha256 === packet.source.sha256 &&
    member.deploymentScope === 'local-only' && member.productCalibrationPassed === false &&
    member.implementation?.length === expectedPaths.length &&
    member.implementation.every((pin, index) => pin.path === expectedPaths[index]), 'exact member closure');
  for (const pin of member.implementation) readBound(root, pin);
  demand(member.implementation[0].sha256 === artifacts.module.sha256 &&
    member.implementation[1].sha256 === artifacts.timeline.sha256, 'registry member identity');
  const run = JSON.parse(readBound(root, artifacts.sourceRun).toString()) as {
    source?: {path: string; sha256: string; physicalRoot: string};
    inputs?: Array<{path: string; sha256: string}>;
    output?: {path: string; sha256: string};
    productCalibrationPassed?: boolean; scaleOutAuthorized?: boolean;
  };
  demand(run.source?.path === packet.source.path && run.source.sha256 === packet.source.sha256 &&
    run.source.physicalRoot === SOURCE_ROOT && run.productCalibrationPassed === false &&
    run.scaleOutAuthorized === false && run.inputs?.length === 4 &&
    run.output?.path === expectedPaths[6] &&
    run.output.sha256 === member.implementation[6].sha256, 'source IR run identity');
  for (const pin of run.inputs) readBound(root, pin);
  return packet;
}

export function extendGeoL06Descriptor(base: PageOnlyLessonPlayerDescriptor, packet: Packet,
  registration: ReturnType<typeof localOnlyAnimationModuleRegistration>): PageOnlyLessonPlayerDescriptor {
  const actual = registration as (NonNullable<typeof registration> & {
    rendererBindingKind?: string; memberManifestSha256?: string; sourceRunSha256?: string
  }) | undefined;
  const artifacts = packet.entry.artifacts;
  demand(actual?.maturity === 'private-current-js' && actual.deploymentScope === 'local-only' &&
    actual.calibrationId === GEO_L06_P001_CALIBRATION && actual.freezeManifestSha256 === GEO_L06_P001_FREEZE.sha256 &&
    actual.rendererBindingKind === 'maintained-dom-module-v1' &&
    actual.moduleSha256 === artifacts.module.sha256 && actual.timelineSha256 === artifacts.timeline.sha256 &&
    actual.memberManifestSha256 === artifacts.memberManifest.sha256 &&
    actual.sourceRunSha256 === artifacts.sourceRun.sha256, 'actual private registration');
  demand(base.course.moduleCode === 'GEO001' && base.course.lesson === 6 && base.course.activePageCount === 54 &&
    base.course.courseShellCount === 0 && base.pages.length === 54 &&
    base.source.sourceXmlPath === packet.sourceXml.path && base.source.sourceXmlSha256 === packet.sourceXml.sha256,
    'source-ordered GEO lesson');
  const first = base.pages[0];
  demand(first.animationId === GEO_L06_P001_ID && first.placementId === GEO_L06_P001_ID &&
    first.globalPageOrdinal === 1 && first.sectionCode === 'IR' && first.sectionPageOrdinal === 1 &&
    first.previousPlacementId === null && first.nextPlacementId === 'shared-geo001-l06-p002' &&
    first.rendererAvailability.kind === 'unavailable' &&
    first.source.assetId === `swf-${packet.source.sha256}`, 'first unavailable placement');
  const pages = base.pages.map(page => page.animationId === GEO_L06_P001_ID ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: GEO_L06_P001_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-142', language: 'fixed-en' as const,
        scenario: 'source-introduction', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length,
    'one-page admission delta');
  return Object.freeze({...base, calibrationId: GEO_L06_P001_CALIBRATION,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${GEO_L06_P001_ID}`}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: GEO_L06_P001_FREEZE.path,
      candidateFreezeManifestSha256: GEO_L06_P001_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}

export function geoL06P001Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readGeoL06P001Packet(), predecessor = g678PartialCalibrationSnapshot();
  demand(predecessor.status === 'ready', 'registered predecessor');
  const matches = predecessor.descriptors.filter(descriptor =>
    descriptor.course.moduleCode === 'GEO001' && descriptor.course.lesson === 6);
  demand(matches.length === 1, 'unique source lesson');
  return extendGeoL06Descriptor(matches[0], packet, localOnlyAnimationModuleRegistration(GEO_L06_P001_ID));
}
