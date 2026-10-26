import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P016Descriptor} from './g678-nms-l02-p016.server';
import {readP017Binding} from './nms-l02-p017-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P017_FREEZE} from './g678-nms-l02-p017-freeze-v1';

export const NMS_L2_P017_ID = 'shared-nms002-l02-p017';
export const NMS_L2_P017_CALIBRATION = 'g678-nms-l02-p017-native-instruction-current-js-v1';
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Pin; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P017_INVALID: ' + label);}
export function readNmsL2P017Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP017Binding(root, NMS_L2_P017_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P017_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P017_ID
    && packet.entry.key === NMS_L2_P017_ID && packet.source.bytes === 109564
    && packet.source.sha256 === '31782fb2a974391e32c20d88697512432f5548fd91652b74852204e218c360c0'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP017Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P017_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P017_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P017_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P017Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P017Packet(), base = nmsL2P016Descriptor(), old = base.pages[16];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P017_ID && old.placementId === NMS_L2_P017_ID && old.globalPageOrdinal === 17
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 1 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P017_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P017_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-73', language: 'fixed-en' as const, scenario: 'source-instruction', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P017_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P017_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P017_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P017_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P017Audio() {
  const packet = readNmsL2P017Packet();
  demand(packet.audio.bytes === 133770 && packet.audio.sha256 === '22e434ef5f7cfc97907c27cd91c5904ca5a352836e7a4940fc8e2e19e35a215c', 'audio identity');
  return readP017Binding(getWorkspaceRoot(), packet.audio);
}
