import 'server-only';
import {readP051CandidateAudio} from './nms-l02-p051-source-bytes';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P050Descriptor} from './g678-nms-l02-p050.server';
import {readP051Binding} from './nms-l02-p051-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {P051_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p051-audio-plan-v1';
import {readP051FreezePin} from './g678-nms-l02-p051-freeze-v1';

export const NMS_L2_P051_ID = 'shared-nms002-l02-p051';
export const NMS_L2_P051_CALIBRATION = 'g678-nms-l02-p051-native-fraction-match-current-js-v1';
export const P051_AUDIO_BINDINGS:Readonly<Record<string,{bytes:number;sha256:string;contentType:string}>>=Object.freeze(Object.fromEntries(Object.entries(P051_AUDIO_PLANS).map(([domain,p])=>[domain,{bytes:p.inputBytes,sha256:p.inputSha256,contentType:'audio/mpeg'}])));

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']; runtime:{frameDomain:string;frameCount:number;rootFrameCount:number;rootBeginFrame:number;fps:number;stage:{width:number;height:number}}}>;
  entry: {key: string; module:string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P051_INVALID: ' + label);}
export function readNmsL2P051Packet(): Packet {
  const NMS_L2_P051_FREEZE=readP051FreezePin();
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP051Binding(root, NMS_L2_P051_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P051_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P051_ID
    && packet.entry.key === NMS_L2_P051_ID
    && packet.entry.module === './modules/g678-nms-l02-native-fraction-match-p051'
    && packet.source.path.endsWith('/G6-G8-shared/NMS002/L2/TI/L2TI10.swf') && packet.source.bytes === 861848
    && packet.source.sha256 === '9c4c9857bb497497b4301a7b1cfec475b5f7bdf9d2cecabcd779fbd887de5d1f'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && ['originalRuntime','audioAcceptance','humanReview','ownerAcceptance','strictComplete','publication'].every(key=>packet.acceptanceEffects[key]===false)
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  const runtime=packet.selectedPages[0].runtime;
  demand(runtime.frameDomain==='sprite-257'&&runtime.frameCount===503&&runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&runtime.stage.width===800&&runtime.stage.height===600,'runtime identity');
  demand(Object.keys(packet.audio).sort().join(',')==='248,250,257','selected audio membership');
  demand(Array.isArray(packet.inputs)&&packet.inputs.length>0&&Array.isArray(packet.outputs)&&packet.outputs.length>0,'binding inventory');
  const artifactPins=[packet.entry.artifacts.module,packet.entry.artifacts.timeline,packet.entry.artifacts.memberManifest,packet.entry.artifacts.sourceRun];
  for(const pin of artifactPins)demand([...packet.inputs,...packet.outputs].some(candidate=>candidate.path===pin.path&&candidate.bytes===pin.bytes&&candidate.sha256===pin.sha256),'artifact inventory binding');
  readP051Binding(root,packet.source);
  demand(packet.sourceXml.path==='G6-G8-shared/NMS002/L2/index.xml','lesson XML path');
  readP051Binding(root,{...packet.sourceXml,path:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/'+packet.sourceXml.path});
  demand(packet.entry.artifacts.module.path==='packages/demos/src/modules/g678-nms-l02-native-fraction-match-p051.tsx'&&packet.entry.artifacts.timeline.path==='packages/demos/src/timelines/g678-nms-l02-native-fraction-match-p051.ts','artifact paths');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP051Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P051_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P051_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P051_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P051Descriptor(): PageOnlyLessonPlayerDescriptor {
  const NMS_L2_P051_FREEZE=readP051FreezePin();
  const packet = readNmsL2P051Packet(), base = nmsL2P050Descriptor(), old = base.pages[50];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 52, 'source lesson');
  demand(old.animationId === NMS_L2_P051_ID && old.placementId === NMS_L2_P051_ID && old.globalPageOrdinal === 51
    && old.sectionCode === 'TI' && old.sectionPageOrdinal === 9 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P051_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P051_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-257', language: 'route-locale' as const, scenario: 'source-inspection', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P051_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P051_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P051_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P051_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P051Audio(domain:string) {
  const packet = readNmsL2P051Packet();
  demand(Object.hasOwn(P051_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P051_AUDIO_BINDINGS[domain as keyof typeof P051_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  readP051Binding(getWorkspaceRoot(),audio);
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;demand(sourceRoot,'exact source root');
  return readP051CandidateAudio(getWorkspaceRoot(),sourceRoot,domain);
}
