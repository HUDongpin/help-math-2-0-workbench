'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P011Renderer,p011ModuleFrame} from '../nms-l02-p011-renderer-v1';
import {P011_TEXT_BINDING,p011TextSnapshot} from '../nms-l02-p011-text-v1';
import type {P011FrameState} from '../nms-l02-p011-timeline-v1';
import {P011_AUDIO_SOURCE} from '../nms-l02-p011-audio-source-v1';
import {P011_AUDIO_URL} from '../nms-l02-p011-audio-loader-v1';
import '../nms-l02-p011-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'7186633f1f7b735672642247d8080ae31322d421292cdb8bb2312a5089b86ee2',audioUrl:P011_AUDIO_URL,audio:P011_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P011FrameState>&{privateP011Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p011',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-27',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-27',frameCount:117,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source equivalent vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-27':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P011Renderer,getFrameState:p011ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P011_TEXT_BINDING,Renderer:NmsL2P011Renderer,getSnapshot:p011TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P011_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP011Vocabulary:source,
});
export default animationModule;
