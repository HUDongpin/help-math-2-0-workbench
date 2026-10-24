'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P002Renderer,p002ModuleFrame} from '../nms-l02-p002-renderer-v1';
import {P002_TEXT_BINDING,p002TextSnapshot} from '../nms-l02-p002-text-v1';
import type {P002FrameState} from '../nms-l02-p002-timeline-v1';
import {P002_AUDIO_SOURCE} from '../nms-l02-p002-audio-source-v1';
import {P002_AUDIO_URL} from '../nms-l02-p002-audio-loader-v1';
import '../nms-l02-p002-v1.css';

const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'45408bbcba684a5f1bd12bdbe993ec37dfc33b12e854fd979698c1e66afc09c6',audioUrl:P002_AUDIO_URL,audio:P002_AUDIO_SOURCE});
/** Prepared module only. This file does not register or admit the placement. */
const animationModule:AnimationModule<P002FrameState>&{privateP002RealWorld:typeof source}=Object.freeze({
  key:'shared-nms002-l02-p002',movie,maturity:'private-current-js',
  runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-310',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-310',frameCount:910,rootFrame:6}])}),
  playbackMode:'loop',scenarios:Object.freeze([{id:'source-real-world',label:'Source real world activity'}]),
  defaultScenarioByFrameDomain:Object.freeze({root:'source-real-world','sprite-310':'source-real-world'}),
  audioCues:Object.freeze([]),Renderer:NmsL2P002Renderer,getFrameState:p002ModuleFrame,
  lessonHost:Object.freeze({capabilities:Object.freeze(['keyterm'] as const),legacyOperations:'blocked',auditStorage:'memory-only',storesPersonalData:false}),
  textPresentation:Object.freeze({schemaVersion:1,binding:P002_TEXT_BINDING,Renderer:NmsL2P002Renderer,getSnapshot:p002TextSnapshot,
    async prepare(){
      if(typeof document==='undefined')return;
      await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);
      await document.fonts.ready;
    },
  }),
  privateP002RealWorld:source,
});
export default animationModule;
