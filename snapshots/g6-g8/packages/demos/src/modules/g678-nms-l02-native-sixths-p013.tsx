 'use client';
import type {AnimationModule} from '../contract';
import {P013_IR as IR} from '../generated/nms-l02-p013-source-ir-v1';
import {p013ModuleFrame,P013_SCENARIOS,type P013FrameState} from '../nms-l02-p013-frame-v1';
import {NmsL2P013Renderer} from '../nms-l02-p013-renderer-v1';
import {P013_TEXT_BINDING,p013TextSnapshot} from '../nms-l02-p013-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(IR.domains).filter(([id])=>id!=='18').map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:IR.audio});
const animationModule:AnimationModule<P013FrameState>&{privateP013Sixths:typeof source}=Object.freeze({key:'shared-nms002-l02-p013',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-123',frameDomains:domains}),playbackMode:'once',scenarios:P013_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-sixths']))),audioCues:Object.freeze([]),Renderer:NmsL2P013Renderer,getFrameState:p013ModuleFrame,
 textPresentation:Object.freeze({schemaVersion:1,binding:P013_TEXT_BINDING,Renderer:NmsL2P013Renderer,getSnapshot:p013TextSnapshot,async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P013_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP013Sixths:source});
export default animationModule;
export {p013ModuleFrame as getFrameState} from '../nms-l02-p013-frame-v1';
export const SOURCE_SWF_SHA256=IR.sourceSha256;
