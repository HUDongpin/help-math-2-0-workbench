'use client';
import {SourceGlossaryLessonRuntime,type SourceGlossaryRuntimeConfig} from './source-glossary-lesson-runtime';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P058_CONTROLS} from '../../../packages/demos/src/nms-l02-p058-semantic-v1';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';
export const P058_MAIN_AUDIO=Object.freeze({
 path:'/migration-assets/nms-l02-p058/main.mp3?sha256=05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38',
 sha256:'05f43faf63e470935728be5b54933ebb71760aeb819074b570091a6e4b068f38',
 bytes:109720,sampleRate:22050,channels:1,decodedSamples:486144,
});
export const P058_RUNTIME_CONFIG:SourceGlossaryRuntimeConfig={
 page:P058_CONTROLS,
 loadModule:async()=>(await import('../../../packages/demos/src/modules/shared-nms002-l02-p058')).default,
 createTransport:origin=>new SourceLinearAudioController({frameCount:274,fps:12,sampleRate:22050,channels:1,audioStartFrame:10,
  decodedSamples:486144,originalBlockHeaderSamples:486144,sourceSwfSha256:P058_CONTROLS.sourceSha256,
  mp3Sha256:P058_MAIN_AUDIO.sha256},{readVerified:async signal=>{
   const buffer=await loadVerifiedPairAudio(P058_MAIN_AUDIO,origin,new OfflineAudioContext(1,1,22050),signal,()=>!signal.aborted);
   if(!buffer)throw Error('LINEAR_AUDIO_CANCELLED');return buffer;
  }}),
};
export function NmsL02P058LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 return <SourceGlossaryLessonRuntime {...props} config={P058_RUNTIME_CONFIG}/>;
}
