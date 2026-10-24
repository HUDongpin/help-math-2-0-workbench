 'use client';
import type {AnimationModule} from '../contract';
import {P021_IR as IR} from '../generated/nms-l02-p021-source-ir-v1';
import {p021ModuleFrame,P021_SCENARIOS,P021_DOMAINS,type P021FrameState} from '../nms-l02-p021-frame-v1';
import {NmsL2P021Renderer} from '../nms-l02-p021-renderer-v1';
import {P021_TEXT_BINDING,p021TextSnapshot} from '../nms-l02-p021-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(IR.domains).filter(([id])=>P021_DOMAINS.includes(id)).map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:IR.audio});
const animationModule:AnimationModule<P021FrameState>&{privateP021Partition:typeof source}=Object.freeze({key:'shared-nms002-l02-p021',movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-578',frameDomains:domains}),playbackMode:'once',scenarios:P021_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-partition-exercise']))),audioCues:Object.freeze([]),Renderer:NmsL2P021Renderer,getFrameState:p021ModuleFrame,
 textPresentation:Object.freeze({schemaVersion:1,binding:P021_TEXT_BINDING,Renderer:NmsL2P021Renderer,getSnapshot:p021TextSnapshot,async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P021_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP021Partition:source});
export default animationModule;
export {p021ModuleFrame as getFrameState} from '../nms-l02-p021-frame-v1';
export const SOURCE_SWF_SHA256=IR.sourceSha256;
