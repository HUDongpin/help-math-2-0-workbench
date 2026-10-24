'use client';
import {useMemo,type ComponentProps} from 'react';
import {G678AlgL12P006HostLesson} from './g678-alg-l12-p006-host-lesson';
import {SourceGlossaryLessonRuntime,type SourceGlossaryRuntimeConfig} from './source-glossary-lesson-runtime';
import {P012Runtime} from './g678-alg-l12-p012-runtime.generated';
import type {P012Assets} from '../../../packages/demos/src/alg-l12-p012-typography-asset';
import {ALG_L12_GLOSSARY_PAIR_CONTROLS} from '../../../packages/demos/src/generated/alg-l12-glossary-pair-controls';
import {ALG_L12_GLOSSARY_PAIR_AUDIO} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-schedule';
import {AlgL12GlossaryPairAudioController} from '../../../packages/demos/src/alg-l12-glossary-pair-audio';
import {AlgL12GlossaryPairSpanishAudioController} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-spanish';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import '../../../packages/demos/src/alg-l12-glossary-pair-native.css';
const CONFIGS:readonly SourceGlossaryRuntimeConfig[]=ALG_L12_GLOSSARY_PAIR_CONTROLS.map((page,index)=>{
 const audio=index===0?ALG_L12_GLOSSARY_PAIR_AUDIO.p013:ALG_L12_GLOSSARY_PAIR_AUDIO.p015;
 return {page,loadModule:index===0?async()=>(await import('../../../packages/demos/src/modules/shared-alg001-l12-p013')).default:
  async()=>(await import('../../../packages/demos/src/modules/shared-alg001-l12-p015')).default,
  createTransport:origin=>new AlgL12GlossaryPairAudioController(audio,{origin}),
  createSpanish:(origin,onEnded,onChange)=>new AlgL12GlossaryPairSpanishAudioController(audio,{origin,onEnded,onChange})};
});
export function G678GlossaryPairHostLesson(props:ComponentProps<typeof G678AlgL12P006HostLesson>&{p012Assets:P012Assets}){
 const {p012Assets,...hostProps}=props;
 const coordinate=props.descriptor.glossary.find(entry=>entry.sourceKeyAttribute==='Coordinate');
 if(!coordinate)throw Error('Predecessor Coordinate dictionary entry unavailable');
 const adapters=useMemo(()=>[
  {animationId:'shared-alg001-l12-p012',audioEnabled:true,glossaryClosePolicy:'stay-paused' as const,
   Component:(runtimeProps:LessonRuntimeAdapterProps)=><P012Runtime {...runtimeProps} assets={p012Assets} coordinateEntryId={coordinate.id}/>},
  ...CONFIGS.map(config=>({animationId:config.page.animationId,audioEnabled:true,glossaryClosePolicy:'stay-paused' as const,
   Component:(runtimeProps:LessonRuntimeAdapterProps)=><SourceGlossaryLessonRuntime {...runtimeProps} config={config}/>}))
 ],[p012Assets,coordinate.id]);
 return <G678AlgL12P006HostLesson {...hostProps} privateRuntimeAdapters={adapters}/>;
}
