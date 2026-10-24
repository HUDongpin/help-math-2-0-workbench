'use client';
import type {AnimationModule} from '../contract';
import {NmsL2P026Renderer,p026ModuleFrame} from '../nms-l02-p026-renderer-v1';
import {P026_TEXT_BINDING,p026TextSnapshot} from '../nms-l02-p026-text-v1';
import {P026_TRACE_FRAME_COUNTS,type P026FrameState} from '../nms-l02-p026-timeline-v1';
import {P026_AUDIO_SOURCE} from '../nms-l02-p026-audio-source-v1';
import {P026_AUDIO_URL} from '../nms-l02-p026-audio-loader-v1';
import '../nms-l02-p026-v1.css';
const movie=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
const source=Object.freeze({version:1 as const,sourceSwfSha256:'d168033f7af079b7fad715adadf4c94fffaa84a8b8ddaefbd8d344ed1cfde1f5',audioUrl:P026_AUDIO_URL,audio:P026_AUDIO_SOURCE});
/** Prepared only; no admission. Source domains inspect first visits. Native
 * scripted traces have scenario-specific lengths and are separately declared. */
const animationModule:AnimationModule<P026FrameState>&{privateP026Practice:typeof source;nativeTraceFrameCounts:typeof P026_TRACE_FRAME_COUNTS}=Object.freeze({
 key:'shared-nms002-l02-p026',movie,maturity:'private-current-js',
 runtime:Object.freeze({...movie,defaultFrameDomain:'sprite-82',frameDomains:Object.freeze([{id:'root',frameCount:10},{id:'sprite-82',frameCount:491,rootFrame:6}])}),
 playbackMode:'once',scenarios:Object.freeze([
  {id:'correct-pairs',label:'Correct pairs',description:'First main-frame visits along an explicit native correct-pair schedule; not an original-runtime recording.'},
  {id:'wrong-then-correct',label:'Wrong pair then correction',description:'One wrong pair per round followed by correction; interactive ticks are separately queryable.'},
 ]),defaultScenarioByFrameDomain:Object.freeze({root:'correct-pairs','sprite-82':'correct-pairs'}),
 audioCues:Object.freeze([]),Renderer:NmsL2P026Renderer,getFrameState:p026ModuleFrame,
 textPresentation:Object.freeze({schemaVersion:1,binding:P026_TEXT_BINDING,Renderer:NmsL2P026Renderer,getSnapshot:p026TextSnapshot,
  async prepare(){if(typeof document==='undefined')return;const faces=await Promise.all([document.fonts.load('18px "HELP Math Nunito Sans"'),document.fonts.load('28px "HELP Math Fredoka"')]);if(faces.some(group=>group.length===0))throw Error('P026_FONT_UNAVAILABLE');await document.fonts.ready;},
 }),privateP026Practice:source,nativeTraceFrameCounts:P026_TRACE_FRAME_COUNTS,
});
export default animationModule;
