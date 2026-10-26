import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P035Descriptor} from './g678-nms-l02-p035.server';
import {readP036Binding} from './nms-l02-p036-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P036_FREEZE} from './g678-nms-l02-p036-freeze-v1';

export const NMS_L2_P036_ID = 'shared-nms002-l02-p036';
export const NMS_L2_P036_CALIBRATION = 'g678-nms-l02-p036-native-explanation-current-js-v1';
export const P036_AUDIO_BINDINGS=Object.freeze({"89":{"bytes":352300,"sha256":"88bf4ccac63d54603b156a74a8920c9a5fec98098f1255785f01a73fd4ca47e2","contentType":"audio/mpeg"}});

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']}>;
  entry: {key: string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P036_INVALID: ' + label);}
export function readNmsL2P036Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP036Binding(root, NMS_L2_P036_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P036_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P036_ID
    && packet.entry.key === NMS_L2_P036_ID && packet.source.bytes === 505341
    && packet.source.sha256 === '6054dc77874ffb4bf976fdf9452bc2a289e17e3777a3ab76edec85e3a2d8c401'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP036Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P036_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P036_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P036_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P036Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P036Packet(), base = nmsL2P035Descriptor(), old = base.pages[35];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 38, 'source lesson');
  demand(old.animationId === NMS_L2_P036_ID && old.placementId === NMS_L2_P036_ID && old.globalPageOrdinal === 36
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 20 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P036_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P036_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-89', language: 'fixed-en' as const, scenario: 'source-explanation', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P036_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P036_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P036_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P036_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P036Audio(domain:string) {
  const packet = readNmsL2P036Packet();
  demand(Object.hasOwn(P036_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P036_AUDIO_BINDINGS[domain as keyof typeof P036_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP036Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
