 'use client';
import type {AnimationModule} from '../contract';
import {P016_IR as IR} from '../generated/nms-l02-p016-source-ir-v1';
import {p016ModuleFrame,P016_SCENARIOS,P016_DOMAINS,type P016FrameState} from '../nms-l02-p016-frame-v1';
import {NmsL2P016Renderer} from '../nms-l02-p016-renderer-v1';
import {P016_TEXT_BINDING,p016TextSnapshot} from '../nms-l02-p016-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(IR.domains).filter(([id])=>P016_DOMAINS.includes(id)).map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:IR.audio});
const animationModule:AnimationModule<P016FrameState>&{privateP016Percent:typeof source}=Object.freeze({key:'shared-nms002-l02-p016',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-194',frameDomains:domains}),playbackMode:'once',scenarios:P016_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-slider-exercise']))),audioCues:Object.freeze([]),Renderer:NmsL2P016Renderer,getFrameState:p016ModuleFrame,
 textPresentation:Object.freeze({schemaVersion:1,binding:P016_TEXT_BINDING,Renderer:NmsL2P016Renderer,getSnapshot:p016TextSnapshot,async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P016_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP016Percent:source});
export default animationModule;
export {p016ModuleFrame as getFrameState} from '../nms-l02-p016-frame-v1';
export const SOURCE_SWF_SHA256=IR.sourceSha256;
