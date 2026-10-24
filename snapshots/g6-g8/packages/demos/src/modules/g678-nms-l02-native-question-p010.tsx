 'use client';
import type {AnimationModule} from '../contract';
import {P010_IR as IR} from '../generated/nms-l02-p010-source-ir-v1';
import {p010ModuleFrame,P010_SCENARIOS,type P010FrameState} from '../nms-l02-p010-frame-v1';
import {NmsL2P010Renderer} from '../nms-l02-p010-renderer-v1';
import {P010_TEXT_BINDING,p010TextSnapshot} from '../nms-l02-p010-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(IR.domains).map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:IR.audio});
const animationModule:AnimationModule<P010FrameState>&{privateP010Question:typeof source}=Object.freeze({key:'shared-nms002-l02-p010',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-176',frameDomains:domains}),playbackMode:'once',scenarios:P010_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-question']))),audioCues:Object.freeze([]),Renderer:NmsL2P010Renderer,getFrameState:p010ModuleFrame,
 textPresentation:Object.freeze({schemaVersion:1,binding:P010_TEXT_BINDING,Renderer:NmsL2P010Renderer,getSnapshot:p010TextSnapshot,async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P010_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP010Question:source});
export default animationModule;
export {p010ModuleFrame as getFrameState} from '../nms-l02-p010-frame-v1';
export const SOURCE_SWF_SHA256=IR.sourceSha256;
