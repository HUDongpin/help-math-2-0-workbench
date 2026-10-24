'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P029Renderer,p029ModuleFrame} from '../nms-l02-p029-renderer-v1';
import {P029_TEXT_BINDING,p029TextSnapshot} from '../nms-l02-p029-text-v1';
import type {P029FrameState} from '../nms-l02-p029-timeline-v1';
import {P029_AUDIO_SOURCE} from '../nms-l02-p029-audio-source-v1';
import {P029_AUDIO_URL} from '../nms-l02-p029-audio-loader-v1';
import '../nms-l02-p029-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'4def014cda62cdfee43006ddbc1ce5b194ee89740f6576c886503b70c905fe30',audioUrl:P029_AUDIO_URL,audio:P029_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P029FrameState>&{privateP029Decimal:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p029',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-49',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-49',frameCount:383,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'default',label:'Naming decimals with a source place-value chart'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'default','sprite-49':'default'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P029Renderer,getFrameState:p029ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P029_TEXT_BINDING,Renderer:NmsL2P029Renderer,getSnapshot:p029TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('500 24px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P029_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP029Decimal:source,
});
export default animationModule;
