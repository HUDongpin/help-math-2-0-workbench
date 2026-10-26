'use client';
import {SourceGlossaryLessonRuntime,type SourceGlossaryRuntimeConfig} from './source-glossary-lesson-runtime';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P056_CONTROLS} from '../../../packages/demos/src/nms-l02-p056-product-controls-v1';
import {SourceLinearAudioController} from '../../../packages/demos/src/source-linear-audio';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

export const P056_MAIN_AUDIO=Object.freeze({
 path:'/migration-assets/nms-l02-p056/main.mp3?sha256=6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811',
 sha256:'6ab63ac96194356d22da4335ce4ff121964044fc5dab27cc79b33fa22e2fc811',
 bytes:95290,sampleRate:22050,channels:1,decodedSamples:422208,
});

/** One source-bound embedded stream. The separate lesson SA file is not an
 * interchangeable track; locale changes never select or start that recording. */
export const P056_RUNTIME_CONFIG:SourceGlossaryRuntimeConfig={
 page:P056_CONTROLS,
 loadModule:async()=>(await import('../../../packages/demos/src/modules/shared-nms002-l02-p056')).default,
 createTransport:origin=>new SourceLinearAudioController({frameCount:234,fps:12,
  sampleRate:P056_MAIN_AUDIO.sampleRate,channels:P056_MAIN_AUDIO.channels,audioStartFrame:5,
  decodedSamples:P056_MAIN_AUDIO.decodedSamples,originalBlockHeaderSamples:422208,
  sourceSwfSha256:P056_CONTROLS.sourceSha256,mp3Sha256:P056_MAIN_AUDIO.sha256},{readVerified:async signal=>{
   const buffer=await loadVerifiedPairAudio(P056_MAIN_AUDIO,origin,
    new OfflineAudioContext(1,1,P056_MAIN_AUDIO.sampleRate),signal,()=>!signal.aborted);
   if(!buffer)throw Error('LINEAR_AUDIO_CANCELLED');
   return buffer;
  }}),
};
export function NmsL02P056LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 return <SourceGlossaryLessonRuntime {...props} config={P056_RUNTIME_CONFIG}/>;
}
