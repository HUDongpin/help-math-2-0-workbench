'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P009Renderer,p009ModuleFrame} from '../nms-l02-p009-renderer-v1';
import {P009_TEXT_BINDING,p009TextSnapshot} from '../nms-l02-p009-text-v1';
import type {P009FrameState} from '../nms-l02-p009-timeline-v1';
import {P009_AUDIO_SOURCE} from '../nms-l02-p009-audio-source-v1';
import {P009_AUDIO_URL} from '../nms-l02-p009-audio-loader-v1';
import '../nms-l02-p009-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'9eea32af9ab642f0cadb478eca0be31c18e277ba7bfe3754f3fc9d5a5eb2f4d1',audioUrl:P009_AUDIO_URL,audio:P009_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P009FrameState>&{privateP009Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p009',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-37',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-37',frameCount:158,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source decimal-point vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-37':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P009Renderer,getFrameState:p009ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P009_TEXT_BINDING,Renderer:NmsL2P009Renderer,getSnapshot:p009TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P009_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP009Vocabulary:source,
});
export default animationModule;
