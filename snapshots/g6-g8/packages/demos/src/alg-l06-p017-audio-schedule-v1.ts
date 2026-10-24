import {P017_AUDIO_ASSETS} from './generated/alg-l06-p017-audio-plan-v1';
export {P017_AUDIO_ASSETS,P017_SA_ASSET} from './generated/alg-l06-p017-audio-plan-v1';
export type P017AudioId=typeof P017_AUDIO_ASSETS[number]['id'];
export const P017_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-42',lastVisualFrame:721,
 mainRanges:[[2,721]],
 syntheticSilenceAdded:false,mainRangesConcatenated:false,separateSaSpliced:false,
 localeStartsAudio:false,originalHostBindingObserved:false,negativeSeekSemanticsResolved:false,
 seekPolicy:'first-source-block-positive-seek-per-range-modern-candidate',
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;
export const P017_AUDIO_END_POSITION=Math.max(721,...P017_AUDIO_ASSETS.map(a=>
 a.firstBlockFrame+(a.decodedSamples-a.initialSeekSamples)/a.sampleRate*12));

/** One continuous source stream retains its frame-2 start. The zero-payload
 * frame-3 block does not cause a pause or a synthetic silence insertion. SA
 * remains a separate explicitly selected asset. Positive first-block seek is a measured modern mapping,
 * not acceptance of original SWF SeekSamples semantics. */
export function p017AudioSlice(id:P017AudioId,framePosition:number){
 const asset=P017_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>P017_AUDIO_END_POSITION)
  throw Error('P017_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/12;
 const firstDecodedSample=asset.initialSeekSamples+Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
