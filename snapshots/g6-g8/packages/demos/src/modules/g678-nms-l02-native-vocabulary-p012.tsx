'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P012Renderer,p012ModuleFrame} from '../nms-l02-p012-renderer-v1';
import {P012_TEXT_BINDING,p012TextSnapshot} from '../nms-l02-p012-text-v1';
import type {P012FrameState} from '../nms-l02-p012-timeline-v1';
import {P012_AUDIO_SOURCE} from '../nms-l02-p012-audio-source-v1';
import {P012_AUDIO_URL} from '../nms-l02-p012-audio-loader-v1';
import '../nms-l02-p012-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'5f96b1fc2bc87ee47e9f6bd57680eb9019367df8433cf4f2f850611f41b0adab',audioUrl:P012_AUDIO_URL,audio:P012_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P012FrameState>&{privateP012Vocabulary:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p012',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-33',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-33',frameCount:172,rootFrame:6}])}),
  playbackMode:'once',scenarios:Object.freeze([{id:'source-vocabulary',label:'Source equivalent-fraction vocabulary'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-vocabulary','sprite-33':'source-vocabulary'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P012Renderer,getFrameState:p012ModuleFrame,
  textPresentation:Object.freeze({schemaVersion:1,binding:P012_TEXT_BINDING,Renderer:NmsL2P012Renderer,getSnapshot:p012TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      if(faces.some(group=>group.length===0))throw Error('P012_FONT_UNAVAILABLE');
      await document.fonts.ready;
    },
  }),
  privateP012Vocabulary:source,
});
export default animationModule;
