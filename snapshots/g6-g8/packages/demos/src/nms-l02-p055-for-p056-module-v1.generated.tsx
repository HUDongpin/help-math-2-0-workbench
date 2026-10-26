'use client';
import type {AnimationModule,RuntimeContext} from './contract';
import {NMS_L02_P055_TIMELINE as timeline} from './timelines/shared-nms002-l02-p055';
import {NmsL02P055NativeRenderer} from './nms-l02-p055-for-p056-renderer-v1.generated';
import {loadP055NativeAsset} from './nms-l02-p055-for-p056-assets-v1.generated';
import {nmsP055TextBinding,nmsP055TextSnapshot} from './nms-l02-p055-native-text';

const MAIN='source-static-frame',ROOT='root-unavailable';
type P055Blocker='unsupported-runtime-request'|'frame-domain-scenario-mismatch'|
 'spanish-visual-and-audio-unvalidated'|'root-baseline-unavailable'|null;
export interface P055FrameState {
 readonly animationId:string;readonly frame:number;readonly exportFrame:number|null;
 readonly frameDomain:string;readonly rootFrame:number;readonly rootState:
  'authoritative-root-runtime-unavailable'|'stopped-at-begin-while-child-static-frame-is-inspected';
 readonly scenario:string;readonly language:'en'|'es';readonly seed:number;
 readonly status:'ready'|'blocked';readonly blocker:P055Blocker;
 readonly sourceStaticVisualReady:boolean;readonly visibleSourceMarkers:readonly string[];
 readonly interactiveControlsEnabled:false;readonly sourceHostBehaviorResolved:false;
 readonly naturalRuntimeEstablished:false;readonly audioRendered:false;
 readonly sourceSwfSha256:string;
 readonly requirementId:string;readonly traceId:string;readonly entryStateSha256:string;
}
const clamp=(frame:number,count:number)=>Number.isFinite(frame)?Math.min(count,Math.max(1,Math.floor(frame))):1;

/** Matches the source-static candidate's normalization and blocker order. */
export function nmsP055FrameState(frame:number,context:RuntimeContext):P055FrameState{
 const domainSupported=context.frameDomain===undefined||context.frameDomain==='root'||
  context.frameDomain===timeline.mainFrameDomain;
 const frameDomain=domainSupported?(context.frameDomain??timeline.mainFrameDomain):timeline.mainFrameDomain;
 const scenarioSupported=context.scenario===MAIN||context.scenario===ROOT;
 const scenario=scenarioSupported?context.scenario:frameDomain==='root'?ROOT:MAIN;
 const expected=frameDomain==='root'?ROOT:MAIN;
 const language=context.lang==='es'?'es':'en';
 const seed=Number.isSafeInteger(context.seed)?context.seed>>>0:0;
 const normalizedFrame=clamp(frame,frameDomain==='root'?timeline.rootFrameCount:timeline.mainFrameCount);
 const sourceContextSupported=context.seed===0&&
  (frameDomain==='root'||context.rootFrame===undefined||context.rootFrame===timeline.rootBeginFrame);
 const blocker:P055Blocker=!domainSupported||!scenarioSupported||!sourceContextSupported?'unsupported-runtime-request':
  scenario!==expected?'frame-domain-scenario-mismatch':
   language==='es'?'spanish-visual-and-audio-unvalidated':
    frameDomain==='root'?'root-baseline-unavailable':null;
 return Object.freeze({animationId:timeline.animationId,frame:normalizedFrame,
  exportFrame:frameDomain===timeline.mainFrameDomain?normalizedFrame-1:null,
  frameDomain,rootFrame:frameDomain==='root'?normalizedFrame:timeline.rootBeginFrame,
  rootState:frameDomain==='root'?'authoritative-root-runtime-unavailable' as const:
   'stopped-at-begin-while-child-static-frame-is-inspected' as const,
  scenario,language,seed,status:blocker?'blocked' as const:'ready' as const,blocker,
  sourceStaticVisualReady:blocker===null,
  visibleSourceMarkers:Object.freeze(blocker===null?['source-four-step-plan']:[]),
  interactiveControlsEnabled:false as const,sourceHostBehaviorResolved:false as const,
  naturalRuntimeEstablished:false as const,audioRendered:false as const,
  sourceSwfSha256:timeline.sourceSwfSha256,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',
  entryStateSha256:context.entryStateSha256?.trim()??''});
}

const movie=Object.freeze({stage:timeline.stage,fps:timeline.fps,frameCount:timeline.mainFrameCount,
 durationMs:timeline.mainFrameCount*1000/timeline.fps});
const runtime=Object.freeze({stage:timeline.stage,fps:timeline.fps,frameCount:timeline.rootFrameCount,
 durationMs:timeline.rootFrameCount*1000/timeline.fps,defaultFrameDomain:timeline.mainFrameDomain,
 frameDomains:Object.freeze([Object.freeze({id:timeline.mainFrameDomain,frameCount:timeline.mainFrameCount,
  fps:timeline.fps,rootFrame:timeline.rootBeginFrame})])});

export const nmsL02P055Module:AnimationModule<P055FrameState>=Object.freeze({
 key:timeline.animationId,movie,runtime,playbackMode:timeline.playbackMode,
 playbackEndFrameByDomain:Object.freeze({root:1,[timeline.mainFrameDomain]:timeline.mainFrameCount}),
 reducedMotionFrame:timeline.mainFrameCount,
 defaultScenarioByFrameDomain:Object.freeze({root:ROOT,[timeline.mainFrameDomain]:MAIN}),
 scenarios:Object.freeze([
  Object.freeze({id:MAIN,label:'English source-static drawing',
   description:'Hash-bound drawing frames only; source behavior, audio, and natural runtime are excluded.'}),
  Object.freeze({id:ROOT,label:'Root timeline (blocked)',
   description:'Records the root-domain obligation without inferring original runtime behavior.'}),
 ]),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,
  frameDomains:Object.freeze([timeline.mainFrameDomain]),stepFrames:20,
  stateReconstruction:'renderer-remount-on-seek' as const,
  audioDisposition:'disabled-while-inspecting' as const,legacyBehaviorParity:false as const,
  strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:NmsL02P055NativeRenderer,
 getFrameState:nmsP055FrameState,
 textPresentation:Object.freeze({schemaVersion:1 as const,binding:nmsP055TextBinding,
  Renderer:NmsL02P055NativeRenderer,reducedMotionFrameByDomain:{[timeline.mainFrameDomain]:timeline.mainFrameCount},
  prepare:async()=>{await loadP055NativeAsset();},
  getSnapshot:(_state:P055FrameState,context:RuntimeContext)=>nmsP055TextSnapshot(context),
 }),
});
