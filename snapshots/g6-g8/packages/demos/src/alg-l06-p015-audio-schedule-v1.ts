import {P015_AUDIO_ASSETS} from './generated/alg-l06-p015-audio-plan-v1';
export {P015_AUDIO_ASSETS,P015_SA_ASSET} from './generated/alg-l06-p015-audio-plan-v1';
export type P015AudioId=typeof P015_AUDIO_ASSETS[number]['id'];
export const P015_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-270',lastVisualFrame:914,
 mainRanges:[[2,622],[646,702],[712,849],[852,914]],
 syntheticSilenceAdded:false,mainRangesConcatenated:false,separateSaSpliced:false,
 localeStartsAudio:false,originalHostBindingObserved:false,negativeSeekSemanticsResolved:false,
 seekPolicy:'first-source-block-positive-seek-per-range-modern-candidate',
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;
export const P015_AUDIO_END_POSITION=Math.max(914,...P015_AUDIO_ASSETS.map(a=>
 a.firstBlockFrame+(a.decodedSamples-a.initialSeekSamples)/a.sampleRate*12));

/** The clock follows source frame time, including missing-block gaps. Each
 * independently decoded range retains its source start; no silence or SA is
 * inserted into an MP3. Positive first-block seek is a measured modern mapping,
 * not acceptance of original SWF SeekSamples semantics. */
export function p015AudioSlice(id:P015AudioId,framePosition:number){
 const asset=P015_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>P015_AUDIO_END_POSITION)
  throw Error('P015_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/12;
 const firstDecodedSample=asset.initialSeekSamples+Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
