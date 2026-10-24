'use client';
import type {AnimationModule} from '../contract';
import {P050_AUDIO_PLANS} from '../generated/nms-l02-p050-audio-plan-v1';
import {P050_FRAME_DOMAINS,P050_SCENARIOS,P050_SOURCE_SHA256,p050ModuleFrame} from '../nms-l02-p050-frame-v1';
import {NmsL2P050Renderer} from '../nms-l02-p050-renderer-v1';
import {P050_TEXT_BINDING,p050TextSnapshot} from '../nms-l02-p050-text-snapshot-v1';
const movie={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:10000/12};
const source={version:1 as const,sourceSwfSha256:P050_SOURCE_SHA256,audio:P050_AUDIO_PLANS};
/** Candidate only; exact registry and host bridge admission remain separate. */
const animationModule:AnimationModule<ReturnType<typeof p050ModuleFrame>>&{privateP050NumberLine:typeof source}={
 key:'shared-nms002-l02-p050',movie,maturity:'private-current-js',runtime:{...movie,defaultFrameDomain:'sprite-94',frameDomains:Object.entries(P050_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,...(id==='root'?{}:{rootFrame:6})}))},
 playbackMode:'once',scenarios:P050_SCENARIOS.map(id=>({id,label:id})),defaultScenarioByFrameDomain:{root:'source-inspection','sprite-94':'source-inspection','sprite-35':'help-example','sprite-88':'wrong-feedback','sprite-91':'correct-feedback','sprite-85':'completion-feedback','sprite-89':'completion-feedback'},
 audioCues:[],Renderer:NmsL2P050Renderer,getFrameState:p050ModuleFrame,privateP050NumberLine:source,
 textPresentation:{schemaVersion:1,binding:P050_TEXT_BINDING,Renderer:NmsL2P050Renderer,getSnapshot:state=>p050TextSnapshot(state),playbackEndFrameByDomain:{'sprite-94':209}},
};
export default animationModule;
