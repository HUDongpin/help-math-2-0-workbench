import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P036Descriptor} from './g678-nms-l02-p036.server';
import {readP037Binding} from './nms-l02-p037-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P037_FREEZE} from './g678-nms-l02-p037-freeze-v1';

export const NMS_L2_P037_ID = 'shared-nms002-l02-p037';
export const NMS_L2_P037_CALIBRATION = 'g678-nms-l02-p037-native-matching-current-js-v1';
export const P037_AUDIO_BINDINGS=Object.freeze({"52":{"bytes":7800,"sha256":"8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7","contentType":"audio/mpeg"},"79":{"bytes":6110,"sha256":"a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04","contentType":"audio/mpeg"},"80":{"bytes":193180,"sha256":"fd30155e9bd4b51514b354255c722ac3f8508a1698c75a1b1ace13942f916995","contentType":"audio/mpeg"}});

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P037_INVALID: ' + label);}
export function readNmsL2P037Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP037Binding(root, NMS_L2_P037_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P037_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P037_ID
    && packet.entry.key === NMS_L2_P037_ID && packet.source.bytes === 196912
    && packet.source.sha256 === '8f7ff05a83fd8c1370f979fedca8e148bd0b80c0bb45ddb7147534d3b92607a7'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP037Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P037_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P037_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P037_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P037Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P037Packet(), base = nmsL2P036Descriptor(), old = base.pages[36];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 39, 'source lesson');
  demand(old.animationId === NMS_L2_P037_ID && old.placementId === NMS_L2_P037_ID && old.globalPageOrdinal === 37
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 21 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P037_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P037_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-80', language: 'fixed-en' as const, scenario: 'source-practice', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P037_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P037_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P037_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P037_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P037Audio(domain:string) {
  const packet = readNmsL2P037Packet();
  demand(Object.hasOwn(P037_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P037_AUDIO_BINDINGS[domain as keyof typeof P037_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP037Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
