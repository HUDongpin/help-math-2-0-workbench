import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P023Descriptor} from './g678-nms-l02-p023.server';
import {readP024Binding} from './nms-l02-p024-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P024_FREEZE} from './g678-nms-l02-p024-freeze-v1';

export const NMS_L2_P024_ID = 'shared-nms002-l02-p024';
export const NMS_L2_P024_CALIBRATION = 'g678-nms-l02-p024-native-drag-current-js-v1';
export const P024_AUDIO_BINDINGS = Object.freeze({
  "93": {
    "bytes": 6110,
    "sha256": "a3634114101cc46babbe7470bea683f3484c5bf31ce2813d7ca8d197ba9cbe04",
    "contentType": "audio/mpeg"
  },
  "95": {
    "bytes": 7800,
    "sha256": "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "contentType": "audio/mpeg"
  },
  "97": {
    "bytes": 21840,
    "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
    "contentType": "audio/mpeg"
  },
  "98": {
    "bytes": 31850,
    "sha256": "7860ffdad0d0edfb7a08d5bb04f264c2c1a9c6d4ec110669d941ee91ac6e2011",
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
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P024_INVALID: ' + label);}
export function readNmsL2P024Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP024Binding(root, NMS_L2_P024_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P024_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P024_ID
    && packet.entry.key === NMS_L2_P024_ID && packet.source.bytes === 95309
    && packet.source.sha256 === 'ecdf064c4daa9dcc496a982eeb3aaa4a599a402fff2db1ec30b448b0b34fb082'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP024Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P024_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P024_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P024_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P024Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P024Packet(), base = nmsL2P023Descriptor(), old = base.pages[23];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P024_ID && old.placementId === NMS_L2_P024_ID && old.globalPageOrdinal === 24
    && old.sectionCode === 'IN' && old.sectionPageOrdinal === 8 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P024_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P024_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-98', language: 'fixed-en' as const, scenario: 'source-drag', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P024_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P024_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P024_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P024_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P024Audio(domain:string) {
  const packet = readNmsL2P024Packet();
  demand(Object.hasOwn(P024_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P024_AUDIO_BINDINGS[domain as keyof typeof P024_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP024Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
