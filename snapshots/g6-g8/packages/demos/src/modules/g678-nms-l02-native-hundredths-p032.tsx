'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P032Renderer,p032ModuleFrame} from '../nms-l02-p032-renderer-v1';
import {P032_TEXT_BINDING,p032TextSnapshot} from '../nms-l02-p032-text-v1';
import type {P032FrameState} from '../nms-l02-p032-timeline-v1';
import {P032_AUDIO_SOURCE} from '../nms-l02-p032-audio-source-v1';
import {P032_AUDIO_URL} from '../nms-l02-p032-audio-loader-v1';
import '../nms-l02-p032-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'3172ad7f4cb8ddef009d1b9948e2f3c5b782144c9a5ed092c08ce61b5213bc51',audioUrl:P032_AUDIO_URL,audio:P032_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P032FrameState>&{privateP032Hundredths:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p032',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-176',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-176',frameCount:451,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'default',label:'Hundredths with two source examples'},{id:'term-decimal',label:'Source Decimal glossary inspection'},{id:'term-ones-group',label:'Source Ones group glossary inspection'},{id:'term-place-value-chart',label:'Source Place value chart glossary inspection'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'default','sprite-176':'default'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P032Renderer,getFrameState:p032ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P032_TEXT_BINDING,Renderer:NmsL2P032Renderer,getSnapshot:p032TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('500 24px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P032_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP032Hundredths:source,
});
export default animationModule;
