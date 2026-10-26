'use client';
import {SourceGlossaryLessonRuntime,type SourceGlossaryRuntimeConfig} from './source-glossary-lesson-runtime';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P055_CONTROLS,P055_SOURCE} from '../../../packages/demos/src/nms-l02-ts-pilot-text';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

export const P055_MAIN_AUDIO=Object.freeze({
 path:'/migration-assets/nms-l02-ts-pilot/main.mp3?sha256=ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b',
 sha256:'ca2a80e75f1fc25d4ff0696af4cc1ccfcec87a1518bbc88eda998b855865a20b',
 bytes:143780,sampleRate:22050,channels:1,decodedSamples:637056,
});

// The modern host uses qualified L1 term entries. This does not establish the
// historical L02 host lookup or recover the missing L2 dictionaries.
export const P055_RUNTIME_CONFIG:SourceGlossaryRuntimeConfig={
 page:{...P055_CONTROLS,controls:P055_CONTROLS.controls.map(control=>({...control,
  entryId:control.entryId.toLowerCase()}))},
 loadModule:async()=>(await import('../../../packages/demos/src/nms-l02-p055-module')).nmsL02P055Module,
 createTransport:origin=>new SourceLinearAudioController({frameCount:351,fps:12,
  sampleRate:P055_MAIN_AUDIO.sampleRate,channels:P055_MAIN_AUDIO.channels,audioStartFrame:5,
  decodedSamples:P055_MAIN_AUDIO.decodedSamples,originalBlockHeaderSamples:637056,
  sourceSwfSha256:P055_SOURCE,mp3Sha256:P055_MAIN_AUDIO.sha256},{readVerified:async signal=>{
   const buffer=await loadVerifiedPairAudio(P055_MAIN_AUDIO,origin,
    new OfflineAudioContext(1,1,P055_MAIN_AUDIO.sampleRate),signal,()=>!signal.aborted);
   if(!buffer)throw Error('LINEAR_AUDIO_CANCELLED');
   return buffer;
  }}),
};

export function NmsL02P055LessonRuntime(props:LessonRuntimeAdapterProps){
 return <SourceGlossaryLessonRuntime {...props} config={P055_RUNTIME_CONFIG}/>;
}
