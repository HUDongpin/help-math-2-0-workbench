'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P025Renderer,p025ModuleFrame} from '../nms-l02-p025-renderer-v1';
import {P025_TEXT_BINDING,p025TextSnapshot} from '../nms-l02-p025-text-v1';
import type {P025FrameState} from '../nms-l02-p025-timeline-v1';
import {P025_AUDIO_SOURCE} from '../nms-l02-p025-audio-source-v1';
import {P025_AUDIO_URL} from '../nms-l02-p025-audio-loader-v1';
import '../nms-l02-p025-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'8d67790688d960f87acf21c9129af070e98c9110e4efbf99cd85aae697facaeb',audioUrl:P025_AUDIO_URL,audio:P025_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P025FrameState>&{privateP025Instruction:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p025',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-36',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-36',frameCount:351,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-instruction',label:'Source equivalent fractions'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-instruction','sprite-36':'source-instruction'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P025Renderer,getFrameState:p025ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P025_TEXT_BINDING,Renderer:NmsL2P025Renderer,getSnapshot:p025TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P025_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP025Instruction:source,
});
export default animationModule;
