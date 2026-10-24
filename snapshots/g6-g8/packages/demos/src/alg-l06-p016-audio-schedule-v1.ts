import {P016_AUDIO_ASSETS} from './generated/alg-l06-p016-audio-plan-v1';
export {P016_AUDIO_ASSETS,P016_SA_ASSET} from './generated/alg-l06-p016-audio-plan-v1';
export type P016AudioId=typeof P016_AUDIO_ASSETS[number]['id'];
export const P016_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-139',lastVisualFrame:815,
 mainRanges:[[2,299],[312,815]],
 syntheticSilenceAdded:false,mainRangesConcatenated:false,separateSaSpliced:false,
 localeStartsAudio:false,originalHostBindingObserved:false,negativeSeekSemanticsResolved:false,
 seekPolicy:'first-source-block-positive-seek-per-range-modern-candidate',
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;
export const P016_AUDIO_END_POSITION=Math.max(815,...P016_AUDIO_ASSETS.map(a=>
 a.firstBlockFrame+(a.decodedSamples-a.initialSeekSamples)/a.sampleRate*12));

/** The clock follows source frame time, including missing-block gaps. Each
 * independently decoded range retains its source start; no silence or SA is
 * inserted into an MP3. Positive first-block seek is a measured modern mapping,
 * not acceptance of original SWF SeekSamples semantics. */
export function p016AudioSlice(id:P016AudioId,framePosition:number){
 const asset=P016_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>P016_AUDIO_END_POSITION)
  throw Error('P016_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/12;
 const firstDecodedSample=asset.initialSeekSamples+Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
