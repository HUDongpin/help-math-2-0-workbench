import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P009Descriptor} from './g678-nms-l02-p009.server';
import {readP010Binding} from './nms-l02-p010-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P010_FREEZE} from './g678-nms-l02-p010-freeze-v1';

export const NMS_L2_P010_ID = 'shared-nms002-l02-p010';
export const NMS_L2_P010_CALIBRATION = 'g678-nms-l02-p010-native-question-current-js-v1';
export const P010_AUDIO_BINDINGS = Object.freeze({
  "51": {
    "bytes": 10270,
    "sha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "contentType": "audio/mpeg"
  },
  "67": {
    "bytes": 11050,
    "sha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "contentType": "audio/mpeg"
  },
  "99": {
    "bytes": 11050,
    "sha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "contentType": "audio/mpeg"
  },
  "127": {
    "bytes": 11050,
    "sha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085",
    "contentType": "audio/mpeg"
  },
  "143": {
    "bytes": 11050,
    "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "contentType": "audio/mpeg"
  },
  "155": {
    "bytes": 11978,
    "sha256": "1cd830798de122ce36bc2393e258d602f323c1bb7674b9231d288fffc60bf4f7",
    "contentType": "audio/wav"
  },
  "175": {
    "bytes": 12740,
    "sha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e",
    "contentType": "audio/mpeg"
  },
  "176": {
    "bytes": 25220,
    "sha256": "3f830f7dc5452a1ae604b1d5d1c03f0326f1ccd85f2beccbdbce771597883c8b",
    "contentType": "audio/mpeg"
  }
});
type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P010_INVALID: ' + label);}
export function readNmsL2P010Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP010Binding(root, NMS_L2_P010_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P010_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P010_ID
    && packet.entry.key === NMS_L2_P010_ID && packet.source.bytes === 528243
    && packet.source.sha256 === '2aa2b207666639f59f1387dbd916f98629f7613a4dcceb4817dc69006839ac92'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP010Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P010_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P010_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P010_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P010Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P010Packet(), base = nmsL2P009Descriptor(), old = base.pages[9];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P010_ID && old.placementId === NMS_L2_P010_ID && old.globalPageOrdinal === 10
    && old.sectionCode === 'VB' && old.sectionPageOrdinal === 4 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P010_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P010_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-176', language: 'fixed-en' as const, scenario: 'source-question', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P010_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P010_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P010_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P010_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P010Audio(domain:string) {
  const packet = readNmsL2P010Packet();
  demand(Object.hasOwn(P010_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P010_AUDIO_BINDINGS[domain as keyof typeof P010_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP010Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
