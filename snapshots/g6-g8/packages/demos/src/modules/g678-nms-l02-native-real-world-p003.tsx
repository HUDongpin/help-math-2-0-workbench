'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P003Renderer,p003ModuleFrame} from '../nms-l02-p003-renderer-v1';
import {P003_TEXT_BINDING,p003TextSnapshot} from '../nms-l02-p003-text-v1';
import type {P003FrameState} from '../nms-l02-p003-timeline-v1';
import {P003_AUDIO_SOURCE} from '../nms-l02-p003-audio-source-v1';
import {P003_AUDIO_URL} from '../nms-l02-p003-audio-loader-v1';
import '../nms-l02-p003-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'3b07c5011ab8f821681f95cca248bc0e28876e90101d72613b824152fb07d0ed',audioUrl:P003_AUDIO_URL,audio:P003_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P003FrameState>&{privateP003RealWorld:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p003',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-326',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-326',frameCount:1319,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-real-world',label:'Source real world activity'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-real-world','sprite-326':'source-real-world'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P003Renderer,getFrameState:p003ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P003_TEXT_BINDING,Renderer:NmsL2P003Renderer,getSnapshot:p003TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P003_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP003RealWorld:source,
});
export default animationModule;
