'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P015Renderer,p015ModuleFrame} from '../nms-l02-p015-renderer-v1';
import {P015_TEXT_BINDING,p015TextSnapshot} from '../nms-l02-p015-text-v1';
import type {P015FrameState} from '../nms-l02-p015-timeline-v1';
import {P015_AUDIO_SOURCE} from '../nms-l02-p015-audio-source-v1';
import {P015_AUDIO_URL} from '../nms-l02-p015-audio-loader-v1';
import '../nms-l02-p015-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'ad417efe396213cc94270a209f3c1632f8afac1d61ea05f64a94360c5ab72e94',audioUrl:P015_AUDIO_URL,audio:P015_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P015FrameState>&{privateP015Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p015',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-47',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-47',frameCount:336,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source percent vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-47':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P015Renderer,getFrameState:p015ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P015_TEXT_BINDING,Renderer:NmsL2P015Renderer,getSnapshot:p015TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P015_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP015Vocabulary:source,
});
export default animationModule;
