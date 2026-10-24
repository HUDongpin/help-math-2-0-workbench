'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P028Renderer,p028ModuleFrame} from '../nms-l02-p028-renderer-v1';
import {P028_TEXT_BINDING,p028TextSnapshot} from '../nms-l02-p028-text-v1';
import type {P028FrameState} from '../nms-l02-p028-timeline-v1';
import {P028_AUDIO_SOURCE} from '../nms-l02-p028-audio-source-v1';
import {P028_AUDIO_URL} from '../nms-l02-p028-audio-loader-v1';
import '../nms-l02-p028-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'4bea567b608dd85703804f645ed1c60231c494c76a811d48514663c39359eb4e',audioUrl:P028_AUDIO_URL,audio:P028_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P028FrameState>&{privateP028Decimal:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p028',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-29',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-29',frameCount:199,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'default',label:'Source decimal definition and equal-part models'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'default','sprite-29':'default'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P028Renderer,getFrameState:p028ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P028_TEXT_BINDING,Renderer:NmsL2P028Renderer,getSnapshot:p028TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P028_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP028Decimal:source,
});
export default animationModule;
