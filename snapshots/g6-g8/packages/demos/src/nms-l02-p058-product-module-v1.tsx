'use client';
import type {AnimationModule,RuntimeContext} from './contract';
import {P058_ID,P058_SOURCE_SHA,p058SemanticSnapshot} from './nms-l02-p058-semantic-v1';
import {P058_PRODUCT_SCENARIO,P058_PRODUCT_TEXT_BINDING,p058ProductContextReady,p058ProductTextSnapshotV1} from './nms-l02-p058-product-text-v1';
import {NmsL02P058ProductRendererV1} from './nms-l02-p058-product-renderer-v1';

const ROOT_SCENARIO='root-unavailable';
const stage=Object.freeze({width:800,height:600});
export const P058_PRODUCT_SOURCE_AUDIO=Object.freeze({
 path:'output/nms-l02-p058-audio-20260927/embedded-source-stream-v1.mp3',bytes:109720,
 sha256:'05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38',
 decodedSamples:486144,sampleRate:22050,channels:1,firstBlockFrame:10,lastBlockFrame:274,
 disposition:'private-source-evidence-not-product-url' as const,
});
export function p058ProductFrameState(frame:number,context:RuntimeContext){
 const ready=frame===context.frame&&p058ProductContextReady(context);
 return Object.freeze({animationId:P058_ID,sourceSwfSha256:P058_SOURCE_SHA,
  frame,frameDomain:context.frameDomain??'sprite-37',rootFrame:context.rootFrame??6,
  scenario:context.scenario,language:context.lang,seed:context.seed,
  status:ready?'ready' as const:'blocked' as const,
  blocker:ready?null:context.lang==='es'?'spanish-visual-unvalidated':'unsupported-runtime-request',
  semantic:ready?p058SemanticSnapshot(frame):null,
  sourceTerminalStopPresent:false as const,originalRuntimeEstablished:false as const,audioRendered:false as const,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',entryStateSha256:context.entryStateSha256?.trim()??''});
}
export const nmsL02P058ProductModule:AnimationModule<ReturnType<typeof p058ProductFrameState>>=Object.freeze({
 key:P058_ID,movie:Object.freeze({stage,fps:12,frameCount:274,durationMs:274*1000/12}),
 runtime:Object.freeze({stage,fps:12,frameCount:10,durationMs:10*1000/12,
  defaultFrameDomain:'sprite-37',frameDomains:Object.freeze([{id:'sprite-37',frameCount:274,fps:12,rootFrame:6}])}),
 playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:1,'sprite-37':274}),reducedMotionFrame:274,
 scenarios:Object.freeze([
  {id:P058_PRODUCT_SCENARIO,label:'English source-timed teaching sprite',description:'Maintained semantic DOM; original runtime and listening remain unverified.'},
  {id:ROOT_SCENARIO,label:'Root timeline (blocked)',description:'Ten source root frames; no preloader behavior is invented.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-37':P058_PRODUCT_SCENARIO}),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-37']),stepFrames:12,
  stateReconstruction:'renderer-remount-on-seek' as const,audioDisposition:'disabled-while-inspecting' as const,
  legacyBehaviorParity:false as const,strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:NmsL02P058ProductRendererV1,getFrameState:p058ProductFrameState,
 textPresentation:Object.freeze({schemaVersion:1 as const,binding:P058_PRODUCT_TEXT_BINDING,
  Renderer:NmsL02P058ProductRendererV1,reducedMotionFrameByDomain:{'sprite-37':274},
  getSnapshot:(state:ReturnType<typeof p058ProductFrameState>,context:RuntimeContext)=>{
   const snapshot=p058ProductTextSnapshotV1(context);
   return state.status==='ready'&&state.frame===context.frame?snapshot:Object.freeze({...snapshot,status:'blocked' as const,
    blockers:Object.freeze([...snapshot.blockers,'blocked-p058-frame-state']),blocks:Object.freeze([]),suppressedInstances:Object.freeze([])});
  }}),
});
