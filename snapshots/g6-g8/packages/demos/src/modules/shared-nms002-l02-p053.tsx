'use client';

import React from 'react';
import type {AnimationModule,AnimationRendererProps,RuntimeContext} from '../contract';
import {P053SourceScene} from '../nms-l02-p053-source-scene-v1';

export const P053_SOURCE=Object.freeze({animationId:'shared-nms002-l02-p053',relativePath:'G6-G8-shared/NMS002/L2/GS/L2GS02.swf',bytes:236774,sha256:'f42f6a4759759561035a7c97e7392241513d0410d69214af422425ef37523fdf',stage:{width:800,height:600},fps:12,rootFrames:10,rootPlacementFrame:6,mainSpriteId:187,mainFrames:694,heldFrame:693});
export function p053ProductFrameState(frame:number,context:RuntimeContext){
 const supported=Number.isSafeInteger(frame)&&frame>=1&&frame<=693&&context.frame===frame&&
  context.frameDomain==='sprite-187'&&context.rootFrame===6&&context.scenario==='source-directions-v1'&&
  context.lang==='en'&&context.seed===0;
 return Object.freeze({animationId:P053_SOURCE.animationId,sourceSwfSha256:P053_SOURCE.sha256,
  status:supported?'source-static-candidate' as const:'blocked' as const,frame,
  frameDomain:context.frameDomain==='sprite-187'?'sprite-187':'root',
  scenario:context.scenario,language:context.lang==='es'?'es':'en',
  originalRuntimeParityEstablished:false as const,audioSynchronizationEstablished:false as const,
  hostCompletion:false as const});
}
function Renderer(props:AnimationRendererProps){
 const state=p053ProductFrameState(props.frame,props);
 return state.status==='blocked'?<section data-p053-module-status="blocked"/>:
  <div data-p053-module-status="source-static-candidate"><P053SourceScene frame={props.frame}/></div>;
}
const stage=Object.freeze({width:800,height:600});
const animationModule:AnimationModule<ReturnType<typeof p053ProductFrameState>>=Object.freeze({
 key:P053_SOURCE.animationId,movie:{stage,fps:12,frameCount:10,durationMs:10000/12},
 runtime:{stage,fps:12,frameCount:10,durationMs:10000/12,defaultFrameDomain:'sprite-187',
  frameDomains:[{id:'sprite-187',frameCount:694,fps:12,rootFrame:6}]},
 playbackMode:'once',playbackEndFrameByDomain:{root:6,'sprite-187':693},
 scenarios:[{id:'source-directions-v1',label:'Source directions; maintained host owns controls'}],
 defaultScenarioByFrameDomain:{'sprite-187':'source-directions-v1'},audioCues:[],
 maturity:'private-current-js',Renderer,getFrameState:p053ProductFrameState,
});
export default animationModule;
