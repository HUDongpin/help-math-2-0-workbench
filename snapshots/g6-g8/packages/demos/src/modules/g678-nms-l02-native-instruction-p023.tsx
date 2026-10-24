'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P023Renderer,p023ModuleFrame} from '../nms-l02-p023-renderer-v1';
import {P023_TEXT_BINDING,p023TextSnapshot} from '../nms-l02-p023-text-v1';
import type {P023FrameState} from '../nms-l02-p023-timeline-v1';
import {P023_AUDIO_SOURCE} from '../nms-l02-p023-audio-source-v1';
import {P023_AUDIO_URL} from '../nms-l02-p023-audio-loader-v1';
import '../nms-l02-p023-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'3df3b8f63e6c1196d8726912e6601ae9f680a59cb639d2cc17b9bb9c5757ae59',audioUrl:P023_AUDIO_URL,audio:P023_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P023FrameState>&{privateP023Instruction:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p023',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-28',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-28',frameCount:469,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-instruction',label:'Source fractions on a number line'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-instruction','sprite-28':'source-instruction'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P023Renderer,getFrameState:p023ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P023_TEXT_BINDING,Renderer:NmsL2P023Renderer,getSnapshot:p023TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P023_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP023Instruction:source,
});
export default animationModule;
