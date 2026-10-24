import {P018_AUDIO_ASSETS} from './generated/alg-l06-p018-audio-plan-v1';
export {P018_AUDIO_ASSETS,P018_SA_ASSET} from './generated/alg-l06-p018-audio-plan-v1';
export type P018AudioId=typeof P018_AUDIO_ASSETS[number]['id'];
export const P018_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-32',lastVisualFrame:648,
 mainRanges:[[2,648]],syntheticSilenceAdded:false,mainRangesConcatenated:false,
 separateSaSpliced:false,localeStartsAudio:false,originalHostBindingObserved:false,
 negativeSeekSemanticsResolved:false,
 seekPolicy:'first-source-block-positive-seek-per-range-modern-candidate',
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;

/** First-block seek maps decoded source sample zero to the candidate visual
 * clock. Measured Chrome sample exhaustion is before frame 648; no old-runtime
 * start/stop synchronization or listening acceptance follows from this map. */
export const P018_NATIVE_AUDIO_END_POSITION=P018_AUDIO_ASSETS[0].firstBlockFrame+
 (P018_AUDIO_ASSETS[0].decodedSamples-P018_AUDIO_ASSETS[0].initialSeekSamples)/
 P018_AUDIO_ASSETS[0].sampleRate*P018_AUDIO_DISPOSITION.fps;
export const P018_AUDIO_END_POSITION=Math.max(P018_AUDIO_DISPOSITION.lastVisualFrame,
 P018_NATIVE_AUDIO_END_POSITION);

/** One intact source stream spans frames 2–648. The source's zero-payload
 * frame-3 block does not create a new range or invented silence. */
export function p018AudioSlice(id:P018AudioId,framePosition:number){
 const asset=P018_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||
   framePosition>P018_AUDIO_END_POSITION)
  throw Error('P018_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/P018_AUDIO_DISPOSITION.fps;
 const firstDecodedSample=asset.initialSeekSamples+
  Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
