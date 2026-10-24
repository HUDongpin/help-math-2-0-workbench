'use client';
import type {AnimationModule} from '../contract';
import {P049_AUDIO_PLANS} from '../generated/nms-l02-p049-audio-plan-v1';
import {P049_FRAME_DOMAINS,P049_SCENARIOS,P049_SOURCE_SHA256,p049ModuleFrame} from '../nms-l02-p049-frame-v1';
import {NmsL2P049Renderer} from '../nms-l02-p049-renderer-v1';
import {P049_TEXT_BINDING,p049TextSnapshot} from '../nms-l02-p049-text-v1';
const movie={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:10000/12};
const domains=Object.entries(P049_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,...(id==='root'?{}:{rootFrame:6})}));
const source={version:1 as const,sourceSwfSha256:P049_SOURCE_SHA256,audio:P049_AUDIO_PLANS};
/** Candidate module definition only; registration/admission requires the independent reviewed bridge. */
const animationModule:AnimationModule<ReturnType<typeof p049ModuleFrame>>&{privateP049DecimalInput:typeof source}={
 key:'shared-nms002-l02-p049',movie,maturity:'private-current-js',runtime:{...movie,defaultFrameDomain:'sprite-156',frameDomains:domains},
 playbackMode:'once',scenarios:P049_SCENARIOS.map(id=>({id,label:id})),
 defaultScenarioByFrameDomain:{root:'source-inspection','sprite-156':'source-inspection','sprite-72':'correct-feedback','sprite-143':'correct-feedback','sprite-153':'correct-feedback','sprite-74':'first-wrong','sprite-109':'help-example','sprite-131':'hint-example','sprite-8':'click-inspection','sprite-35':'click-inspection','sprite-117':'click-inspection'},
 audioCues:[],Renderer:NmsL2P049Renderer,getFrameState:p049ModuleFrame,privateP049DecimalInput:source,
 textPresentation:{schemaVersion:1,binding:P049_TEXT_BINDING,Renderer:NmsL2P049Renderer,getSnapshot:state=>p049TextSnapshot(state),playbackEndFrameByDomain:{'sprite-156':327}},
};
export default animationModule;
