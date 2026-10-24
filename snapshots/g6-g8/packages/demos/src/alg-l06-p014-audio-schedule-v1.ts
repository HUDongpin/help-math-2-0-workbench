import {P014_AUDIO_ASSETS} from './generated/alg-l06-p014-audio-plan-v1';
export {P014_AUDIO_ASSETS,P014_SA_ASSET} from './generated/alg-l06-p014-audio-plan-v1';
export type P014AudioId=typeof P014_AUDIO_ASSETS[number]['id'];
export const P014_AUDIO_DISPOSITION={fps:12,quizStopFrame:120,
 mainMissingBlockFrames:[111,112,113,114,115,116,117,118,119,120,121,122,123,124],
 syntheticSilenceAdded:false,feedbackStreamsConcatenated:false,separateSaSpliced:false,
 localeStartsAudio:false,originalHostBindingObserved:false,negativeSeekSemanticsResolved:false,
 sprite83OrphanTrailerAppended:false,sprite148Frame1BoundaryResolved:false,
 range2SeekPolicy:'first-source-block-seek-571-modern-candidate',
 feedbackEntryPolicy:'domain-frame-aligned-modern-candidate-not-original-runtime',
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;

/** Domain-local position in one-indexed frames (fraction allowed). The owner
 * holds main at 120 for the quiz and selects exactly one feedback domain.
 * This measured-decode schedule is a modern engineering choice, not a claim
 * that MP3 SeekSamples or malformed trailing bytes match original Flash. */
export function p014AudioSlice(id:P014AudioId,framePosition:number){
 const asset=P014_AUDIO_ASSETS.find(a=>a.id===id);
 const endFrame=asset?Math.max(asset.lastVisualFrame,asset.firstBlockFrame+
  (asset.decodedSamples-asset.initialSeekSamples)/asset.sampleRate*12):0;
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>endFrame)
  throw Error('P014_INVALID_DOMAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/12;
 const firstDecodedSample=asset.initialSeekSamples+Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
