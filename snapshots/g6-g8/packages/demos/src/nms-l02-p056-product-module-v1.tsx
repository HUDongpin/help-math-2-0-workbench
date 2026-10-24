'use client';
import type {AnimationModule,RuntimeContext} from './contract';
import type {TextPresentationSnapshot} from './lesson-text-contract';
import {P056_DISPLAY_SOURCE} from './generated/nms-l02-p056-display-list-v1';
import {p056SemanticSnapshot} from './nms-l02-p056-semantic-view-v1';
import {NmsL02P056ProductRendererV1} from './nms-l02-p056-product-renderer-v1';
import {P056_PRODUCT_SCENARIO,P056_PRODUCT_TEXT_BINDING,p056ProductTextSnapshotV1} from './nms-l02-p056-product-text-v1';
import {p056SourceSpriteFrame} from './timelines/shared-nms002-l02-p056-display-list';
import {P056_SOURCE_BEHAVIOR} from './timelines/shared-nms002-l02-p056-source-behavior';

const ROOT_SCENARIO='root-unavailable';
const STAGE=Object.freeze({width:800,height:600});
const FPS=12,MAIN_FRAMES=234,ROOT_FRAMES=10;
type P056Blocker='unsupported-runtime-request'|'frame-domain-scenario-mismatch'|
  'spanish-visual-unvalidated'|'root-baseline-unavailable'|null;

export const P056_PRODUCT_SOURCE_AUDIO=Object.freeze({
  path:'migrations/shared-nms002-l02-p056/audit/embedded-source-stream-v1.mp3',
  bytes:95290,sha256:'6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811',
  decodedSamples:422208,sampleRate:22050,channels:1,firstBlockFrame:5,lastBlockFrame:234,
  disposition:'private-source-evidence-not-product-asset' as const,
});

export interface P056ProductFrameState {
  readonly animationId:typeof P056_SOURCE_BEHAVIOR.animationId;
  readonly sourceSwfSha256:typeof P056_SOURCE_BEHAVIOR.swfSha256;
  readonly frame:number;readonly frameDomain:string;readonly rootFrame:number;
  readonly scenario:string;readonly language:'en'|'es';readonly seed:number;
  readonly status:'ready'|'blocked';readonly blocker:P056Blocker;
  readonly sourceStaticVisualReady:boolean;readonly sourceLayerCount:number;
  readonly headingAlpha:number;readonly stepTwoAlpha:number;
  readonly haveQuestionAlpha:number;readonly needQuestionAlpha:number;
  readonly highlightedTerm:'Organize'|'Information'|null;
  readonly sourceButtonKeys:readonly ['Organize','Information'];
  readonly sourceButtonsFullyOpaque:boolean;
  readonly sourceTerminalStopPresent:false;
  readonly naturalRuntimeEstablished:false;readonly audioRendered:false;
  readonly requirementId:string;readonly traceId:string;readonly entryStateSha256:string;
}
const normalized=(frame:number,count:number)=>Number.isFinite(frame)?Math.max(1,Math.min(count,Math.floor(frame))):1;

export function p056ProductFrameState(frame:number,context:RuntimeContext):P056ProductFrameState{
  const suppliedDomain=context.frameDomain??'sprite-24';
  const domainSupported=suppliedDomain==='sprite-24'||suppliedDomain==='root';
  const frameDomain=domainSupported?suppliedDomain:'sprite-24';
  const expectedScenario=frameDomain==='root'?ROOT_SCENARIO:P056_PRODUCT_SCENARIO;
  const scenarioSupported=context.scenario===P056_PRODUCT_SCENARIO||context.scenario===ROOT_SCENARIO;
  const language=context.lang==='es'?'es':'en';
  const seed=Number.isSafeInteger(context.seed)?context.seed>>>0:0;
  const frameCount=frameDomain==='root'?ROOT_FRAMES:MAIN_FRAMES;
  const localFrame=normalized(frame,frameCount);
  const validFrame=Number.isSafeInteger(frame)&&frame>=1&&frame<=frameCount&&context.frame===frame;
  const validIdentity=validFrame&&context.seed===0&&
    Number.isSafeInteger(context.replay??0)&&(context.replay??0)>=0&&
    (frameDomain==='root'||context.rootFrame===6);
  const blocker:P056Blocker=!domainSupported||!scenarioSupported||!validIdentity?'unsupported-runtime-request':
    context.scenario!==expectedScenario?'frame-domain-scenario-mismatch':
    language==='es'?'spanish-visual-unvalidated':frameDomain==='root'?'root-baseline-unavailable':null;
  const semantic=blocker===null?p056SemanticSnapshot(localFrame):null;
  const layers=blocker===null?p056SourceSpriteFrame(localFrame):[];
  return Object.freeze({animationId:P056_SOURCE_BEHAVIOR.animationId,
    sourceSwfSha256:P056_SOURCE_BEHAVIOR.swfSha256,frame:localFrame,frameDomain,
    rootFrame:frameDomain==='root'?localFrame:6,scenario:scenarioSupported?context.scenario:expectedScenario,
    language,seed,status:blocker?'blocked' as const:'ready' as const,blocker,
    sourceStaticVisualReady:blocker===null,sourceLayerCount:layers.length,
    headingAlpha:semantic?.headingAlpha??0,stepTwoAlpha:semantic?.stepTwoAlpha??0,
    haveQuestionAlpha:semantic?.haveQuestionAlpha??0,needQuestionAlpha:semantic?.needQuestionAlpha??0,
    highlightedTerm:semantic?.highlightedTerm??null,
    sourceButtonKeys:Object.freeze(['Organize','Information'] as const),
    sourceButtonsFullyOpaque:semantic?.glossaryReady??false,
    sourceTerminalStopPresent:false as const,naturalRuntimeEstablished:false as const,
    audioRendered:false as const,
    requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',
    entryStateSha256:context.entryStateSha256?.trim()??''});
}

function textSnapshot(state:P056ProductFrameState,context:RuntimeContext):TextPresentationSnapshot{
  const snapshot=p056ProductTextSnapshotV1(context);
  if(state.status==='ready'&&state.frame===context.frame&&state.frameDomain===context.frameDomain&&
    state.sourceSwfSha256===P056_SOURCE_BEHAVIOR.swfSha256)return snapshot;
  return Object.freeze({...snapshot,status:'blocked' as const,
    blockers:Object.freeze([...snapshot.blockers,'blocked-p056-frame-state']),
    blocks:Object.freeze([]),suppressedInstances:Object.freeze([])});
}

const movie=Object.freeze({stage:STAGE,fps:FPS,frameCount:MAIN_FRAMES,durationMs:MAIN_FRAMES*1000/FPS});
const runtime=Object.freeze({stage:STAGE,fps:FPS,frameCount:ROOT_FRAMES,durationMs:ROOT_FRAMES*1000/FPS,
  defaultFrameDomain:'sprite-24',frameDomains:Object.freeze([
    Object.freeze({id:'sprite-24',frameCount:MAIN_FRAMES,fps:FPS,rootFrame:6}),
  ])});

/** Unregistered product adapter. The host supplies the two source-key glossary
 * controls and any later verified audio transport; no private audit path is a URL. */
export const nmsL02P056ProductModule:AnimationModule<P056ProductFrameState>=Object.freeze({
  key:P056_SOURCE_BEHAVIOR.animationId,movie,runtime,playbackMode:'once',
  playbackEndFrameByDomain:Object.freeze({root:1,'sprite-24':MAIN_FRAMES}),
  reducedMotionFrame:MAIN_FRAMES,
  scenarios:Object.freeze([
    Object.freeze({id:P056_PRODUCT_SCENARIO,label:'English source-static teaching sprite',
      description:'Source SVG and semantic text; natural host timing and audio are unverified.'}),
    Object.freeze({id:ROOT_SCENARIO,label:'Root timeline (blocked)',
      description:'Ten source root frames are recorded without inventing preloader behavior.'}),
  ]),
  defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-24':P056_PRODUCT_SCENARIO}),
  audioCues:Object.freeze([]),
  transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-24']),
    stepFrames:12,stateReconstruction:'renderer-remount-on-seek' as const,
    audioDisposition:'disabled-while-inspecting' as const,legacyBehaviorParity:false as const,
    strictAcceptanceEffect:'none' as const}),
  maturity:'legacy-prototype',Renderer:NmsL02P056ProductRendererV1,
  getFrameState:p056ProductFrameState,
  textPresentation:Object.freeze({schemaVersion:1 as const,binding:P056_PRODUCT_TEXT_BINDING,
    Renderer:NmsL02P056ProductRendererV1,reducedMotionFrameByDomain:{'sprite-24':MAIN_FRAMES},
    getSnapshot:textSnapshot}),
});
export const nmsL02P056ProductModuleV1=nmsL02P056ProductModule;

if(P056_DISPLAY_SOURCE.animationId!==P056_SOURCE_BEHAVIOR.animationId||
  P056_DISPLAY_SOURCE.sourceSwfSha256!==P056_SOURCE_BEHAVIOR.swfSha256||
  P056_DISPLAY_SOURCE.frameCount!==MAIN_FRAMES||P056_DISPLAY_SOURCE.rootPlacement.frame!==6)
  throw Error('P056 source projection identity mismatch');
