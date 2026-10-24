'use client';
import type{AnimationModule}from'../contract';
import{P035_FRAME_DATA as IR}from'../generated/nms-l02-p035-frame-data-v1';
import{P035_AUDIO_SOURCES}from'../nms-l02-p035-audio-source-v1';
import{p035ModuleFrame,P035_SCENARIOS,type P035FrameState}from'../nms-l02-p035-frame-v1';
import{NmsL2P035Renderer}from'../nms-l02-p035-renderer-v1';
import{P035_TEXT_BINDING,p035TextSnapshot}from'../nms-l02-p035-text-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const domains=Object.freeze(Object.entries(IR.domains).map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})})));
const source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:P035_AUDIO_SOURCES});
/** Prepared only: metadata does not register the page or establish trace authority. */
const animationModule:AnimationModule<P035FrameState>&{privateP035Explanation:typeof source}=Object.freeze({key:IR.animationId,movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-46',frameDomains:domains}),playbackMode:'once',scenarios:P035_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-explanation']))),audioCues:Object.freeze([]),Renderer:NmsL2P035Renderer,getFrameState:p035ModuleFrame,textPresentation:Object.freeze({schemaVersion:1,binding:P035_TEXT_BINDING,Renderer:NmsL2P035Renderer,getSnapshot:p035TextSnapshot,async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('500 24px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P035_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP035Explanation:source});
export default animationModule;
