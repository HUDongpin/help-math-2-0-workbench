'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P004Renderer,p004ModuleFrame} from '../nms-l02-p004-renderer-v1';
import {P004_TEXT_BINDING,p004TextSnapshot} from '../nms-l02-p004-text-v1';
import type {P004FrameState} from '../nms-l02-p004-timeline-v1';
import {P004_AUDIO_SOURCE} from '../nms-l02-p004-audio-source-v1';
import {P004_AUDIO_URL} from '../nms-l02-p004-audio-loader-v1';
import '../nms-l02-p004-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'63a14badb0fc16f3ce4229e1e417fe513ffce3562b51181c4a8e688d2af32265',audioUrl:P004_AUDIO_URL,audio:P004_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P004FrameState>&{privateP004RealWorld:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p004',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-552',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-552',frameCount:1152,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-real-world',label:'Source real world activity'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-real-world','sprite-552':'source-real-world'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P004Renderer,getFrameState:p004ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P004_TEXT_BINDING,Renderer:NmsL2P004Renderer,getSnapshot:p004TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P004_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP004RealWorld:source,
});
export default animationModule;
