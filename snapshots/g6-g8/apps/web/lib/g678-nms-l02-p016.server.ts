import 'server-only';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P015Descriptor} from './g678-nms-l02-p015.server';
import {readP016Binding} from './nms-l02-p016-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {NMS_L2_P016_FREEZE} from './g678-nms-l02-p016-freeze-v1';

export const NMS_L2_P016_ID = 'shared-nms002-l02-p016';
export const NMS_L2_P016_CALIBRATION = 'g678-nms-l02-p016-native-percent-current-js-v1';
export const P016_AUDIO_BINDINGS = Object.freeze({
  "159": {
    "bytes": 1950,
    "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "contentType": "audio/mpeg"
  },
  "168": {
    "bytes": 21840,
    "sha256": "e551e71005de2df6e95d44ca10fba65b6ae0131032336e67b2609c71b798e8cf",
    "contentType": "audio/mpeg"
  },
  "175": {
    "bytes": 1950,
    "sha256": "ad4a86a727b8d4b5379655258cdffc62f85f89cb460a96565fad27d975a2aa38",
    "contentType": "audio/mpeg"
  },
  "186": {
    "bytes": 8190,
    "sha256": "5411e0e794915162e2bb293428b6f0ddd2a15c82bb5b2ce7a86818c32a17d71a",
    "contentType": "audio/mpeg"
  },
  "194": {
    "bytes": 83590,
    "sha256": "3709f05b0788dd206a85f439665db5229fe9598e831bd5cb4671df0861c8557d",
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
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P016_INVALID: ' + label);}
export function readNmsL2P016Packet(): Packet {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP016Binding(root, NMS_L2_P016_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P016_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P016_ID
    && packet.entry.key === NMS_L2_P016_ID && packet.source.bytes === 122448
    && packet.source.sha256 === 'b12976880eb12956d4ee758276b06b725fe2efc89f72c0c1e26c5b0c33d04edd'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP016Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P016_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P016_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P016_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P016Descriptor(): PageOnlyLessonPlayerDescriptor {
  const packet = readNmsL2P016Packet(), base = nmsL2P015Descriptor(), old = base.pages[15];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0, 'source lesson');
  demand(old.animationId === NMS_L2_P016_ID && old.placementId === NMS_L2_P016_ID && old.globalPageOrdinal === 16
    && old.sectionCode === 'VB' && old.sectionPageOrdinal === 10 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P016_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P016_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-194', language: 'fixed-en' as const, scenario: 'source-slider-exercise', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P016_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P016_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P016_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P016_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P016Audio(domain:string) {
  const packet = readNmsL2P016Packet();
  demand(Object.hasOwn(P016_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P016_AUDIO_BINDINGS[domain as keyof typeof P016_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  return {bytes:readP016Binding(getWorkspaceRoot(),audio),contentType:audio.contentType};
}
