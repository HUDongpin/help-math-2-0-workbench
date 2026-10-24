'use client';
import type {AnimationModule,RuntimeContext} from './contract';
import {P057_ID,P057_SOURCE_SHA,p057SemanticSnapshot} from './nms-l02-p057-semantic-v1';
import {P057_PRODUCT_SCENARIO,P057_PRODUCT_TEXT_BINDING,p057ProductContextReady,p057ProductTextSnapshotV1} from './nms-l02-p057-product-text-v1';
import {NmsL02P057ProductRendererV1} from './nms-l02-p057-product-renderer-v1';

const ROOT_SCENARIO='root-unavailable';
const stage=Object.freeze({width:800,height:600});
export const P057_PRODUCT_SOURCE_AUDIO=Object.freeze({
 path:'output/nms-l02-p057-audio-20260927/embedded-source-stream-v1.mp3',bytes:134290,
 sha256:'c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc',
 decodedSamples:595008,sampleRate:22050,channels:1,firstBlockFrame:5,lastBlockFrame:328,
 disposition:'private-source-evidence-not-product-url' as const,
});
export function p057ProductFrameState(frame:number,context:RuntimeContext){
 const ready=frame===context.frame&&p057ProductContextReady(context);
 return Object.freeze({animationId:P057_ID,sourceSwfSha256:P057_SOURCE_SHA,
  frame,frameDomain:context.frameDomain??'sprite-66',rootFrame:context.rootFrame??6,
  scenario:context.scenario,language:context.lang,seed:context.seed,
  status:ready?'ready' as const:'blocked' as const,
  blocker:ready?null:context.lang==='es'?'spanish-visual-unvalidated':'unsupported-runtime-request',
  semantic:ready?p057SemanticSnapshot(frame):null,
  sourceTerminalStopPresent:false as const,originalRuntimeEstablished:false as const,audioRendered:false as const,
  requirementId:context.requirementId?.trim()??'',traceId:context.traceId?.trim()??'',entryStateSha256:context.entryStateSha256?.trim()??''});
}
export const nmsL02P057ProductModule:AnimationModule<ReturnType<typeof p057ProductFrameState>>=Object.freeze({
 key:P057_ID,movie:Object.freeze({stage,fps:12,frameCount:328,durationMs:328*1000/12}),
 runtime:Object.freeze({stage,fps:12,frameCount:10,durationMs:10*1000/12,
  defaultFrameDomain:'sprite-66',frameDomains:Object.freeze([{id:'sprite-66',frameCount:328,fps:12,rootFrame:6}])}),
 playbackMode:'once',playbackEndFrameByDomain:Object.freeze({root:1,'sprite-66':328}),reducedMotionFrame:328,
 scenarios:Object.freeze([
  {id:P057_PRODUCT_SCENARIO,label:'English source-timed teaching sprite',description:'Maintained semantic DOM; original runtime and listening remain unverified.'},
  {id:ROOT_SCENARIO,label:'Root timeline (blocked)',description:'Ten source root frames; no preloader behavior is invented.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:ROOT_SCENARIO,'sprite-66':P057_PRODUCT_SCENARIO}),
 audioCues:Object.freeze([]),
 transport:Object.freeze({mode:'visual-frame-inspector' as const,frameDomains:Object.freeze(['sprite-66']),stepFrames:12,
  stateReconstruction:'renderer-remount-on-seek' as const,audioDisposition:'disabled-while-inspecting' as const,
  legacyBehaviorParity:false as const,strictAcceptanceEffect:'none' as const}),
 maturity:'legacy-prototype',Renderer:NmsL02P057ProductRendererV1,getFrameState:p057ProductFrameState,
 textPresentation:Object.freeze({schemaVersion:1 as const,binding:P057_PRODUCT_TEXT_BINDING,
  Renderer:NmsL02P057ProductRendererV1,reducedMotionFrameByDomain:{'sprite-66':328},
  getSnapshot:(state:ReturnType<typeof p057ProductFrameState>,context:RuntimeContext)=>{
   const snapshot=p057ProductTextSnapshotV1(context);
   return state.status==='ready'&&state.frame===context.frame?snapshot:Object.freeze({...snapshot,status:'blocked' as const,
    blockers:Object.freeze([...snapshot.blockers,'blocked-p057-frame-state']),blocks:Object.freeze([]),suppressedInstances:Object.freeze([])});
  }}),
});
