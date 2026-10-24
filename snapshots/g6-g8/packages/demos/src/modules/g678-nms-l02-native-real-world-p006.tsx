'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P006Renderer,p006ModuleFrame} from '../nms-l02-p006-renderer-v1';
import {P006_TEXT_BINDING,p006TextSnapshot} from '../nms-l02-p006-text-v1';
import type {P006FrameState} from '../nms-l02-p006-timeline-v1';
import {P006_AUDIO_SOURCE} from '../nms-l02-p006-audio-source-v1';
import {P006_AUDIO_URL} from '../nms-l02-p006-audio-loader-v1';
import '../nms-l02-p006-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'b6afc05a82304d3e0721933c2b4c3f1d8740fc46699125b1ff5149e096601b4e',audioUrl:P006_AUDIO_URL,audio:P006_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P006FrameState>&{privateP006RealWorld:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p006',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-54',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-54',frameCount:153,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-essential-question',label:'Source real world activity'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-essential-question','sprite-54':'source-essential-question'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P006Renderer,getFrameState:p006ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P006_TEXT_BINDING,Renderer:NmsL2P006Renderer,getSnapshot:p006TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P006_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP006RealWorld:source,
});
export default animationModule;
