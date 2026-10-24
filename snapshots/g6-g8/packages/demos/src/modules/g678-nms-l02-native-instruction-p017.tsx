'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P017Renderer,p017ModuleFrame} from '../nms-l02-p017-renderer-v1';
import {P017_TEXT_BINDING,p017TextSnapshot} from '../nms-l02-p017-text-v1';
import type {P017FrameState} from '../nms-l02-p017-timeline-v1';
import {P017_AUDIO_SOURCE} from '../nms-l02-p017-audio-source-v1';
import {P017_AUDIO_URL} from '../nms-l02-p017-audio-loader-v1';
import '../nms-l02-p017-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'31782fb2a974391e32c20d88697512432f5548fd91652b74852204e218c360c0',audioUrl:P017_AUDIO_URL,audio:P017_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P017FrameState>&{privateP017Instruction:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p017',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-73',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-73',frameCount:331,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-instruction',label:'Source fractions instruction'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-instruction','sprite-73':'source-instruction'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P017Renderer,getFrameState:p017ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P017_TEXT_BINDING,Renderer:NmsL2P017Renderer,getSnapshot:p017TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P017_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP017Instruction:source,
});
export default animationModule;
