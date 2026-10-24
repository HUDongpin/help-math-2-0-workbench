'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P008Renderer,p008ModuleFrame} from '../nms-l02-p008-renderer-v1';
import {P008_TEXT_BINDING,p008TextSnapshot} from '../nms-l02-p008-text-v1';
import type {P008FrameState} from '../nms-l02-p008-timeline-v1';
import {P008_AUDIO_SOURCE} from '../nms-l02-p008-audio-source-v1';
import {P008_AUDIO_URL} from '../nms-l02-p008-audio-loader-v1';
import '../nms-l02-p008-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'997876146ea02743532b9475914e047a1b300574f7659d66698ac2994bc9ad02',audioUrl:P008_AUDIO_URL,audio:P008_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P008FrameState>&{privateP008Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p008',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-39',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-39',frameCount:310,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source decimal vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-39':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P008Renderer,getFrameState:p008ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P008_TEXT_BINDING,Renderer:NmsL2P008Renderer,getSnapshot:p008TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P008_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP008Vocabulary:source,
});
export default animationModule;
