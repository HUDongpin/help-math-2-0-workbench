'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P014Renderer,p014ModuleFrame} from '../nms-l02-p014-renderer-v1';
import {P014_TEXT_BINDING,p014TextSnapshot} from '../nms-l02-p014-text-v1';
import type {P014FrameState} from '../nms-l02-p014-timeline-v1';
import {P014_AUDIO_SOURCE} from '../nms-l02-p014-audio-source-v1';
import {P014_AUDIO_URL} from '../nms-l02-p014-audio-loader-v1';
import '../nms-l02-p014-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'c22333655f970f897f39d4d7eee231640ae84b8f0f0b3b5ee09c65e9ca7f29f1',audioUrl:P014_AUDIO_URL,audio:P014_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P014FrameState>&{privateP014Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p014',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-19',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-19',frameCount:145,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source equivalent-decimal vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-19':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P014Renderer,getFrameState:p014ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P014_TEXT_BINDING,Renderer:NmsL2P014Renderer,getSnapshot:p014TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P014_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP014Vocabulary:source,
});
export default animationModule;
