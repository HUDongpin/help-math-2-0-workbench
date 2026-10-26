'use client';
import {SourceGlossaryLessonRuntime,type SourceGlossaryRuntimeConfig} from './source-glossary-lesson-runtime';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P057_CONTROLS} from '../../../packages/demos/src/nms-l02-p057-semantic-v1';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';
export const P057_MAIN_AUDIO=Object.freeze({
 path:'/migration-assets/nms-l02-p057/main.mp3?sha256=c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc',
 sha256:'c87ebf7d1117a616ebddd6b3530a7b19c50dfd885bc5e2734817657da026c2dc',
 bytes:134290,sampleRate:22050,channels:1,decodedSamples:595008,
});
export const P057_RUNTIME_CONFIG:SourceGlossaryRuntimeConfig={
 page:P057_CONTROLS,
 loadModule:async()=>(await import('../../../packages/demos/src/modules/shared-nms002-l02-p057')).default,
 createTransport:origin=>new SourceLinearAudioController({frameCount:328,fps:12,sampleRate:22050,channels:1,audioStartFrame:5,
  decodedSamples:595008,originalBlockHeaderSamples:595008,sourceSwfSha256:P057_CONTROLS.sourceSha256,
  mp3Sha256:P057_MAIN_AUDIO.sha256},{readVerified:async signal=>{
   const buffer=await loadVerifiedPairAudio(P057_MAIN_AUDIO,origin,new OfflineAudioContext(1,1,22050),signal,()=>!signal.aborted);
   if(!buffer)throw Error('LINEAR_AUDIO_CANCELLED');return buffer;
  }}),
};
export function NmsL02P057LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 return <SourceGlossaryLessonRuntime {...props} config={P057_RUNTIME_CONFIG}/>;
}
