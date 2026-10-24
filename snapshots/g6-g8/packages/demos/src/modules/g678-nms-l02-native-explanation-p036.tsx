'use client';
import type{AnimationModule}from'../contract';
import{P036_FRAME_DATA as IR}from'../generated/nms-l02-p036-frame-data-v1';
import{P036_AUDIO_SOURCES}from'../nms-l02-p036-audio-source-v1';
import{p036ModuleFrame,P036_SCENARIOS,type P036FrameState}from'../nms-l02-p036-frame-v1';
import{NmsL2P036Renderer}from'../nms-l02-p036-renderer-v1';
import{P036_TEXT_BINDING,p036TextSnapshot}from'../nms-l02-p036-text-v1';
import{prepareP036Images}from'../nms-l02-p036-images-v1';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12}),domains=Object.freeze(Object.entries(IR.domains).map(([id,d])=>Object.freeze({id:id==='root'?id:'sprite-'+id,frameCount:d.frameCount,...(id==='root'?{}:{rootFrame:6})}))),source=Object.freeze({version:1 as const,sourceSwfSha256:IR.sourceSha256,audio:P036_AUDIO_SOURCES});
/** Prepared module only; independent source-local inspection is not trace authority. */
const animationModule:AnimationModule<P036FrameState>&{privateP036Explanation:typeof source}=Object.freeze({key:IR.animationId,movie,maturity:'private-current-js',runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-89',frameDomains:domains}),playbackMode:'once',scenarios:P036_SCENARIOS,defaultScenarioByFrameDomain:Object.freeze(Object.fromEntries(domains.map(d=>[d.id,'source-explanation']))),audioCues:Object.freeze([]),Renderer:NmsL2P036Renderer,getFrameState:p036ModuleFrame,textPresentation:Object.freeze({schemaVersion:1,binding:P036_TEXT_BINDING,Renderer:NmsL2P036Renderer,getSnapshot:p036TextSnapshot,async prepare(){if(typeof document==='undefined')return;await prepareP036Images();const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('500 24px "HELP Math Fredoka"')]);if(faces.some(g=>g.length===0))throw Error('P036_FONT_UNAVAILABLE');await document.fonts.ready;}}),privateP036Explanation:source});export default animationModule;
