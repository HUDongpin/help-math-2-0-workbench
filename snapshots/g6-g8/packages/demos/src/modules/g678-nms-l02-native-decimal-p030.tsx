'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P030Renderer,p030ModuleFrame} from '../nms-l02-p030-renderer-v1';
import {P030_TEXT_BINDING,p030TextSnapshot} from '../nms-l02-p030-text-v1';
import type {P030FrameState} from '../nms-l02-p030-timeline-v1';
import {P030_AUDIO_SOURCE} from '../nms-l02-p030-audio-source-v1';
import {P030_AUDIO_URL} from '../nms-l02-p030-audio-loader-v1';
import '../nms-l02-p030-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'a67fd2cd208277a695c01be67fe9346852bca4ff4a76ec88dd7902a63a048c48',audioUrl:P030_AUDIO_URL,audio:P030_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P030FrameState>&{privateP030Decimal:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p030',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-67',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-67',frameCount:299,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'default',label:'Tenths with a ten-strip model and source place-value chart'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'default','sprite-67':'default'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P030Renderer,getFrameState:p030ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P030_TEXT_BINDING,Renderer:NmsL2P030Renderer,getSnapshot:p030TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('500 24px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P030_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP030Decimal:source,
});
export default animationModule;
