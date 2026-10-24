'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P018Renderer,p018ModuleFrame} from '../nms-l02-p018-renderer-v1';
import {P018_TEXT_BINDING,p018TextSnapshot} from '../nms-l02-p018-text-v1';
import type {P018FrameState} from '../nms-l02-p018-timeline-v1';
import {P018_AUDIO_SOURCE} from '../nms-l02-p018-audio-source-v1';
import {P018_AUDIO_URL} from '../nms-l02-p018-audio-loader-v1';
import '../nms-l02-p018-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'4edc7317ccc46c54f95432b0e29c167d0f6246dcdf347da550831d46a7a96510',audioUrl:P018_AUDIO_URL,audio:P018_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P018FrameState>&{privateP018Instruction:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p018',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-29',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-29',frameCount:293,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-instruction',label:'Source fractions instruction'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-instruction','sprite-29':'source-instruction'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P018Renderer,getFrameState:p018ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P018_TEXT_BINDING,Renderer:NmsL2P018Renderer,getSnapshot:p018TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P018_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP018Instruction:source,
});
export default animationModule;
