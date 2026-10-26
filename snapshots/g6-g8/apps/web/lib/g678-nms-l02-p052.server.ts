import 'server-only';
import {P052_SOURCE_ROOT,readP052CandidateAudio} from './nms-l02-p052-source-bytes';
import {localOnlyAnimationModuleRegistration} from '@helpmath/demos/local-only-animation-registry-metadata';
import {getWorkspaceRoot} from './catalog';
import {nmsL2P051Descriptor} from './g678-nms-l02-p051.server';
import {readP052Binding} from './nms-l02-p052-binding.server';
import type {WholeLessonPlayerPage, PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';
import {P052_AUDIO_PLANS} from '../../../packages/demos/src/generated/nms-l02-p052-runtime-audio-v1';
import {readP052FreezePin} from './g678-nms-l02-p052-freeze-v1';

export const NMS_L2_P052_ID = 'shared-nms002-l02-p052';
export const NMS_L2_P052_CALIBRATION = 'g678-nms-l02-p052-percent-practice-current-js-v1';
export const P052_AUDIO_BINDINGS:Readonly<Record<string,{bytes:number;sha256:string;contentType:string}>>=Object.freeze(Object.fromEntries(Object.entries(P052_AUDIO_PLANS).map(([domain,p])=>[domain,{bytes:p.inputBytes,sha256:p.inputSha256,contentType:'audio/mpeg'}])));

type Pin = Readonly<{path: string; bytes: number; sha256: string}>;
interface Packet {
  schemaVersion: number; calibrationId: string; deploymentScope: string;
  source: Pin; sourceXml: Pin; audio: Record<string, Pin & {contentType: string}>; inputs: Pin[]; outputs: Pin[];
  selectedPages: Array<{animationId: string; sourceSha256: string; runtimeEvidenceBoundary: WholeLessonPlayerPage['runtimeEvidenceBoundary']; runtime:{frameDomain:string;frameCount:number;rootFrameCount:number;rootBeginFrame:number;fps:number;stage:{width:number;height:number}}}>;
  entry: {key: string; module:string; artifacts: {module: Pin; timeline: Pin; memberManifest: Pin; sourceRun: Pin}};
  productCalibrationPassed: boolean; scaleOutAuthorized: boolean; acceptanceEffects: Record<string, boolean>;
}
function demand(value: unknown, label: string): asserts value {if (!value) throw Error('NMS_L2_P052_INVALID: ' + label);}
export function readNmsL2P052Packet(): Packet {
  const NMS_L2_P052_FREEZE=readP052FreezePin();
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV, 'local runtime');
  demand(process.env.HELP_MATH_G678_SOURCE_ROOT === P052_SOURCE_ROOT, 'exact source root');
  const root = getWorkspaceRoot();
  const packet = JSON.parse(readP052Binding(root, NMS_L2_P052_FREEZE).toString()) as Packet;
  demand(packet.schemaVersion === 1 && packet.calibrationId === NMS_L2_P052_CALIBRATION
    && packet.deploymentScope === 'local-only', 'candidate scope');
  demand(packet.selectedPages.length === 1 && packet.selectedPages[0].animationId === NMS_L2_P052_ID
    && packet.entry.key === NMS_L2_P052_ID
    && packet.entry.module === './modules/g678-nms-l02-percent-practice-p052'
    && packet.source.path === P052_SOURCE_ROOT + '/G6-G8-shared/NMS002/L2/TI/L2TI11.swf' && packet.source.bytes === 106791
    && packet.source.sha256 === '5efa48905e74c0dd604b9e896bee1a1b4cfb1fe0839044686527fe96e1311638'
    && packet.selectedPages[0].sourceSha256 === packet.source.sha256, 'source identity');
  demand(packet.productCalibrationPassed === false && packet.scaleOutAuthorized === false
    && ['originalRuntime','audioAcceptance','humanReview','ownerAcceptance','strictComplete','publication'].every(key=>packet.acceptanceEffects[key]===false)
    && Object.values(packet.acceptanceEffects).every(value => value === false), 'independent acceptance');
  const runtime=packet.selectedPages[0].runtime;
  demand(runtime.frameDomain==='sprite-350'&&runtime.frameCount===156&&runtime.rootFrameCount===10&&runtime.rootBeginFrame===6&&runtime.fps===12&&runtime.stage.width===800&&runtime.stage.height===600,'runtime identity');
  demand(Object.keys(packet.audio).sort().join(',')==='sprite-318,sprite-327,sprite-347,sprite-349,sprite-350,sprite-8','selected audio membership');
  demand(Array.isArray(packet.inputs)&&packet.inputs.length>0&&Array.isArray(packet.outputs)&&packet.outputs.length>0,'binding inventory');
  for(const [domain,expected] of Object.entries(P052_AUDIO_BINDINGS)){
    const audio=packet.audio[domain];
    demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
    demand(audio.path===`migrations/shared-nms002-l02-p052/audit/${domain}-source-stream-v1.mp3`,'audio path');
    demand([...packet.inputs,...packet.outputs].some(pin=>pin.path===audio.path&&pin.bytes===audio.bytes&&pin.sha256===audio.sha256),'audio inventory binding');
  }
  const artifactPins=[packet.entry.artifacts.module,packet.entry.artifacts.timeline,packet.entry.artifacts.memberManifest,packet.entry.artifacts.sourceRun];
  for(const pin of artifactPins)demand([...packet.inputs,...packet.outputs].some(candidate=>candidate.path===pin.path&&candidate.bytes===pin.bytes&&candidate.sha256===pin.sha256),'artifact inventory binding');
  readP052Binding(root,packet.source);
  demand(packet.sourceXml.path==='G6-G8-shared/NMS002/L2/index.xml','lesson XML path');
  readP052Binding(root,{...packet.sourceXml,path:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/'+packet.sourceXml.path});
  demand(packet.entry.artifacts.module.path==='packages/demos/src/modules/g678-nms-l02-percent-practice-p052.tsx'&&packet.entry.artifacts.timeline.path==='packages/demos/src/timelines/g678-nms-l02-percent-practice-p052.ts','artifact paths');
  for (const pin of [...packet.inputs, ...packet.outputs]) readP052Binding(root, pin);
  const registration = localOnlyAnimationModuleRegistration(NMS_L2_P052_ID), a = packet.entry.artifacts;
  demand(registration?.calibrationId === NMS_L2_P052_CALIBRATION && registration.deploymentScope === 'local-only'
    && registration.maturity === 'private-current-js' && registration.freezeManifestSha256 === NMS_L2_P052_FREEZE.sha256
    && registration.moduleSha256 === a.module.sha256 && registration.timelineSha256 === a.timeline.sha256
    && registration.rendererBindingKind === 'maintained-dom-module-v1'
    && registration.memberManifestSha256 === a.memberManifest.sha256 && registration.sourceRunSha256 === a.sourceRun.sha256,
  'actual registered module');
  return packet;
}
export function nmsL2P052Descriptor(): PageOnlyLessonPlayerDescriptor {
  const NMS_L2_P052_FREEZE=readP052FreezePin();
  const packet = readNmsL2P052Packet(), base = nmsL2P051Descriptor(), old = base.pages[51];
  demand(base.course.moduleCode === 'NMS002' && base.course.lesson === 2 && base.course.activePageCount === 64
    && base.pages.length === 64 && base.course.courseShellCount === 0 && base.productBridge.registeredAnimationCount === 53, 'source lesson');
  demand(old.animationId === NMS_L2_P052_ID && old.placementId === NMS_L2_P052_ID && old.globalPageOrdinal === 52
    && old.sectionCode === 'TI' && old.sectionPageOrdinal === 10 && old.rendererAvailability.kind === 'unavailable'
    && old.source.assetId === 'swf-' + packet.source.sha256, 'unavailable exact source placement');
  demand(base.source.sourceXmlSha256 === packet.sourceXml.sha256 && base.source.sourceXmlPath === packet.sourceXml.path, 'source XML');
  const pages = base.pages.map(page => page.animationId !== NMS_L2_P052_ID ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: NMS_L2_P052_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-350', language: 'route-locale' as const, scenario: 'intro', seed: '0'})}),
    runtimeEvidenceBoundary: packet.selectedPages[0].runtimeEvidenceBoundary,
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length, 'one-page delta');
  return Object.freeze({...base, calibrationId: NMS_L2_P052_CALIBRATION,
    course: Object.freeze({...base.course, href: '/migration-status/g678-calibration/' + NMS_L2_P052_ID}),
    source: Object.freeze({...base.source, candidateFreezeManifestPath: NMS_L2_P052_FREEZE.path,
      candidateFreezeManifestSha256: NMS_L2_P052_FREEZE.sha256}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
export function readNmsL2P052Audio(domain:string) {
  const packet = readNmsL2P052Packet();
  demand(Object.hasOwn(P052_AUDIO_BINDINGS,domain)&&Object.hasOwn(packet.audio,domain),'audio domain');
  const expected=P052_AUDIO_BINDINGS[domain as keyof typeof P052_AUDIO_BINDINGS],audio=packet.audio[domain];
  demand(audio.bytes===expected.bytes&&audio.sha256===expected.sha256&&audio.contentType===expected.contentType,'audio identity');
  readP052Binding(getWorkspaceRoot(),audio);
  const sourceRoot=process.env.HELP_MATH_G678_SOURCE_ROOT;demand(sourceRoot===P052_SOURCE_ROOT,'exact source root');
  return readP052CandidateAudio(getWorkspaceRoot(),sourceRoot,domain);
}
