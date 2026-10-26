import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P030Descriptor} from './g678-nms-l02-p030.server';
import {readP031Binding} from './nms-l02-p031-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P031_FREEZE} from './g678-nms-l02-p031-freeze-v1';

export const NMS_L2_P031_ID = 'shared-nms002-l02-p031';
export const NMS_L2_P031_CALIBRATION = 'g678-nms-l02-p031-native-question-current-js-v1';
export const P031_AUDIO_BINDINGS = Object.freeze({
  "68": {
    "bytes": 11050,
    "sha256": "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
    "contentType": "audio/mpeg"
  },
  "80": {
    "bytes": 10660,
    "sha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
    "contentType": "audio/mpeg"
  },
  "108": {
    "bytes": 11050,
    "sha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085",
    "contentType": "audio/mpeg"
  },
  "132": {
    "bytes": 11570,
    "sha256": "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8",
    "contentType": "audio/mpeg"
  },
  "157": {
    "bytes": 11570,
    "sha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d",
    "contentType": "audio/mpeg"
  },
  "173": {
    "bytes": 11570,
    "sha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541",
    "contentType": "audio/mpeg"
  },
  "188": {
    "bytes": 11050,
    "sha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "contentType": "audio/mpeg"
  },
  "242": {
    "bytes": 138840,
    "sha256": "023e27734ea7d0c466f08d03250f7c5aeb99caf2062e0fcb794dd78349f9d439",
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
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P031_INVALID: ' + label);}
export function readNmsL2P031Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP031Binding(root, NMS_L2_P031_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P031_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P031_ID
    && packet.entry.key === NMS_L2_P031_ID && packet.source.bytes === 822130
    && packet.source.sha256 === 'c6005df159523c3c266f02f77bfedecda8c4ce87540cbd38ce5e4b381f8047fa'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP031Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P031_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P031_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P031_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P031Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P031Packet(), base = nmsL2P030Descriptor(), old = base.pages[30];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 33, 'source lesson');
  demand(old.animationId === NMS_L2_P031_ID && old.placementId === NMS_L2_P031_ID && old.globalPageOrdinal === 31
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 15 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P031_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P031_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-242', language: 'fixed-en' as const, scenario: 'source-tenths-quiz', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P031_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P031_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P031_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P031_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P031Audio(domain:string) {
  const packet = readNmsL2P031Packet();
  demand(Object.hasOwn(P031_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P031_AUDIO_BINDINGS[domain as keyof typeof P031_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP031Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
