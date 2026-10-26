import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P021Descriptor} from './g678-nms-l02-p021.server';
import {readP022Binding} from './nms-l02-p022-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P022_FREEZE} from './g678-nms-l02-p022-freeze-v1';

export const NMS_L2_P022_ID = 'shared-nms002-l02-p022';
export const NMS_L2_P022_CALIBRATION = 'g678-nms-l02-p022-native-question-current-js-v1';
export const P022_AUDIO_BINDINGS = Object.freeze({
  "62": {
    "bytes": 11570,
    "sha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d",
    "contentType": "audio/mpeg"
  },
  "77": {
    "bytes": 10270,
    "sha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "contentType": "audio/mpeg"
  },
  "98": {
    "bytes": 11050,
    "sha256": "1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5",
    "contentType": "audio/mpeg"
  },
  "116": {
    "bytes": 11960,
    "sha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "contentType": "audio/mpeg"
  },
  "142": {
    "bytes": 11960,
    "sha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "contentType": "audio/mpeg"
  },
  "154": {
    "bytes": 10660,
    "sha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
    "contentType": "audio/mpeg"
  },
  "171": {
    "bytes": 11050,
    "sha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "contentType": "audio/mpeg"
  },
  "185": {
    "bytes": 12350,
    "sha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
    "contentType": "audio/mpeg"
  },
  "206": {
    "bytes": 205140,
    "sha256": "5e55224c0610911a0b9f9e6be3abbd51d625b675133fe76b77fc57aafa2219e3",
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
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P022_INVALID: ' + label);}
export function readNmsL2P022Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP022Binding(root, NMS_L2_P022_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P022_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P022_ID
    && packet.entry.key === NMS_L2_P022_ID && packet.source.bytes === 520026
    && packet.source.sha256 === 'c02ece5daf5f6eab9c6852106a17fe189c94b4f1dc2c32f75a1bba49de35db1c'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP022Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P022_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P022_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P022_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P022Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P022Packet(), base = nmsL2P021Descriptor(), old = base.pages[21];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P022_ID && old.placementId === NMS_L2_P022_ID && old.globalPageOrdinal === 22
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 6 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P022_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P022_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-206', language: 'fixed-en' as const, scenario: 'source-fraction-quiz', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P022_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P022_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P022_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P022_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P022Audio(domain:string) {
  const packet = readNmsL2P022Packet();
  demand(Object.hasOwn(P022_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P022_AUDIO_BINDINGS[domain as keyof typeof P022_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP022Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
