'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P007Renderer,p007ModuleFrame} from '../nms-l02-p007-renderer-v1';
import {P007_TEXT_BINDING,p007TextSnapshot} from '../nms-l02-p007-text-v1';
import type {P007FrameState} from '../nms-l02-p007-timeline-v1';
import {P007_AUDIO_SOURCE} from '../nms-l02-p007-audio-source-v1';
import {P007_AUDIO_URL} from '../nms-l02-p007-audio-loader-v1';
import '../nms-l02-p007-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'a02fbf6de8d9af4a4899ff79a204576b6def396bde0243932be64b591cf97936',audioUrl:P007_AUDIO_URL,audio:P007_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P007FrameState>&{privateP007Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p007',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-35',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-35',frameCount:312,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source fraction vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-35':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P007Renderer,getFrameState:p007ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P007_TEXT_BINDING,Renderer:NmsL2P007Renderer,getSnapshot:p007TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P007_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP007Vocabulary:source,
});
export default animationModule;
