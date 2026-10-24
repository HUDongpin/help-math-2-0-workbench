/** Maintained P021 source stream schedule, bound to output/.../audio-plan-v1.json.
 * AudioContext decode pins came from HeadlessChrome 153 without playback. */
export const P021_AUDIO_ASSETS=[{
 id:'main-1',domain:'sprite-43',firstBlockFrame:7,lastBlockFrame:377,
 lastVisualFrame:377,initialSeekSamples:1673,
 sourcePath:'output/alg-l06-p021-audio-v1/sprite-43-source-v1.mp3',
 sourceBytes:153660,
 sourceSha256:'8d9675013afc1efd57dabf4cdddc12d3e54454fdef5989e4feb180f1b452f305',
 sampleRate:22050,channels:1,decodedSamples:680832,
 pcmSha256:'aaa49c95986f27510bbed6b5f23388d6a8b5a42df0b4794b71fafff8789f77d8',
 receiptSha256:'b0e6128363828db59fe74ef0265c76824958e9335aa9e585eeff0b4180d3d6fc',
 originalRuntimeAccepted:false,audioAccepted:false,
}] as const;
export const P021_SA_ASSET={role:'separate-sa',
 sourcePath:'output/alg-l06-p021-audio-v1/separate-sa-source-v1.mp3',
 sourceBytes:355152,
 sourceSha256:'74d2579aeb963ca841d501a80e9830c05ae23153a87daa6e0a277c105f31f5d9',
 sampleRate:48000,channels:1,decodedSamples:1217664,durationSeconds:25.368,
 pcmSha256:'a2693b4035a88949fddc6cb0085a25d88e918bc66b90d8f72dce903be50738a6',
 receiptSha256:'b0e6128363828db59fe74ef0265c76824958e9335aa9e585eeff0b4180d3d6fc',
 playbackStarted:false,originalRuntimeAccepted:false,audioAccepted:false,
} as const;
export type P021AudioId=typeof P021_AUDIO_ASSETS[number]['id'];
export const P021_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-43',lastVisualFrame:377,
 mainRanges:[[7,377]],sourceHasNegativeSeek:false,sourceZeroPayloadBlockFrames:[8],
 sourceAlignment:'unresolved',syntheticSilenceAdded:false,
 mainRangesConcatenated:false,separateSaSpliced:false,localeStartsAudio:false,
 originalHostBindingObserved:false,originalRuntimeAccepted:false,
 listeningAccepted:false,audioAccepted:false} as const;

/** First-block seek is only a modern candidate. Browser sample exhaustion is
 * before final visual frame 377; the original Flash alignment is unresolved. */
export const P021_NATIVE_AUDIO_END_POSITION=P021_AUDIO_ASSETS[0].firstBlockFrame+
 (P021_AUDIO_ASSETS[0].decodedSamples-P021_AUDIO_ASSETS[0].initialSeekSamples)/
 P021_AUDIO_ASSETS[0].sampleRate*P021_AUDIO_DISPOSITION.fps;
export const P021_AUDIO_END_POSITION=Math.max(P021_AUDIO_DISPOSITION.lastVisualFrame,
 P021_NATIVE_AUDIO_END_POSITION);

/** One intact MP3 stream covers source blocks 7..377. The empty f8 payload
 * remains in the source schedule and does not license invented silence. */
export function p021AudioSlice(id:P021AudioId,framePosition:number){
 const asset=P021_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||
   framePosition>P021_AUDIO_END_POSITION)
  throw Error('P021_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/P021_AUDIO_DISPOSITION.fps;
 const firstDecodedSample=asset.initialSeekSamples+
  Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
