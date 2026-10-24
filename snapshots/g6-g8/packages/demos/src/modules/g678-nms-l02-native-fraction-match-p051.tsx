'use client';
import type {AnimationModule} from '../contract';
import {P051_AUDIO_PLANS} from '../generated/nms-l02-p051-audio-plan-v1';
import {P051_FRAME_DOMAINS,P051_SCENARIOS,P051_SOURCE_SHA256,p051ModuleFrame} from '../nms-l02-p051-frame-v1';
import {NmsL2P051Renderer} from '../nms-l02-p051-renderer-v1';
import {P051_TEXT_BINDING,p051TextSnapshot} from '../nms-l02-p051-text-snapshot-v1';
const movie={stage:{width:800,height:600},fps:12,frameCount:10,durationMs:10000/12};
const source={version:1 as const,sourceSwfSha256:P051_SOURCE_SHA256,audio:P051_AUDIO_PLANS};
/** Unregistered candidate. Runtime structure is not an admission or acceptance receipt. */
const animationModule:AnimationModule<ReturnType<typeof p051ModuleFrame>>&{privateP051FractionMatch:typeof source}={
 key:'shared-nms002-l02-p051',movie,maturity:'private-current-js',runtime:{...movie,defaultFrameDomain:'sprite-257',frameDomains:Object.entries(P051_FRAME_DOMAINS).map(([id,frameCount])=>({id,frameCount,...(id==='root'?{}:{rootFrame:6})}))},
 playbackMode:'once',scenarios:P051_SCENARIOS.map(id=>({id,label:id})),defaultScenarioByFrameDomain:{root:'source-inspection','sprite-257':'source-inspection','sprite-248':'wrong-feedback','sprite-250':'correct-feedback','sprite-256':'completion-feedback'},
 audioCues:[],Renderer:NmsL2P051Renderer,getFrameState:p051ModuleFrame,privateP051FractionMatch:source,
 textPresentation:{schemaVersion:1,binding:P051_TEXT_BINDING,Renderer:NmsL2P051Renderer,getSnapshot:state=>p051TextSnapshot(state),playbackEndFrameByDomain:{'sprite-257':485}},
};
export default animationModule;
