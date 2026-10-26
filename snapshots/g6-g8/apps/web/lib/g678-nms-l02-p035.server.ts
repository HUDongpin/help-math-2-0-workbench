import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P034Descriptor} from './g678-nms-l02-p034.server';
import {readP035Binding} from './nms-l02-p035-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P035_FREEZE} from './g678-nms-l02-p035-freeze-v1';

export const NMS_L2_P035_ID = 'shared-nms002-l02-p035';
export const NMS_L2_P035_CALIBRATION = 'g678-nms-l02-p035-native-explanation-current-js-v1';
export const P035_AUDIO_BINDINGS=Object.freeze({"46":{"bytes":428610,"sha256":"b21ca497758b47d362fca34457a83a85bab6d3998e9a5e3073dcfc66cc6e7e70","contentType":"audio/mpeg"}});

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P035_INVALID: ' + label);}
export function readNmsL2P035Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP035Binding(root, NMS_L2_P035_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P035_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P035_ID
    && packet.entry.key === NMS_L2_P035_ID && packet.source.bytes === 363716
    && packet.source.sha256 === '24b2264eb4235034551040b479b267d64783f25be636391e3f811e39399f69f0'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP035Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P035_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P035_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P035_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P035Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P035Packet(), base = nmsL2P034Descriptor(), old = base.pages[34];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 37, 'source lesson');
  demand(old.animationId === NMS_L2_P035_ID && old.placementId === NMS_L2_P035_ID && old.globalPageOrdinal === 35
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 19 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P035_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P035_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-46', language: 'fixed-en' as const, scenario: 'source-explanation', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P035_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P035_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P035_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P035_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P035Audio(domain:string) {
  const packet = readNmsL2P035Packet();
  demand(Object.hasOwn(P035_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P035_AUDIO_BINDINGS[domain as keyof typeof P035_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP035Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
