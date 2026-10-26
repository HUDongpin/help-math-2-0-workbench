import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P026Descriptor} from './g678-nms-l02-p026.server';
import {readP027Binding} from './nms-l02-p027-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P027_FREEZE} from './g678-nms-l02-p027-freeze-v1';

export const NMS_L2_P027_ID = 'shared-nms002-l02-p027';
export const NMS_L2_P027_CALIBRATION = 'g678-nms-l02-p027-native-question-current-js-v1';
export const P027_AUDIO_BINDINGS = Object.freeze({
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
  "207": {
    "bytes": 159120,
    "sha256": "9c8962d7d5019ae25596ec4fe24b4f340ef379058c52f19736077815f3451626",
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
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P027_INVALID: ' + label);}
export function readNmsL2P027Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP027Binding(root, NMS_L2_P027_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P027_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P027_ID
    && packet.entry.key === NMS_L2_P027_ID && packet.source.bytes === 393510
    && packet.source.sha256 === '1a7c64a17272d35a190997977ce53be2ee9972a9f547987d3ad10666f35b2fef'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP027Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P027_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P027_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P027_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P027Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P027Packet(), base = nmsL2P026Descriptor(), old = base.pages[26];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P027_ID && old.placementId === NMS_L2_P027_ID && old.globalPageOrdinal === 27
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 11 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P027_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P027_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-207', language: 'fixed-en' as const, scenario: 'source-equivalent-quiz', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P027_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P027_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P027_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P027_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P027Audio(domain:string) {
  const packet = readNmsL2P027Packet();
  demand(Object.hasOwn(P027_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P027_AUDIO_BINDINGS[domain as keyof typeof P027_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP027Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
