/** Maintained P019 source stream schedule, bound to output/.../audio-plan-v1.json.
 * AudioContext decode pins came from Chrome 153 without starting playback. */
export const P019_AUDIO_ASSETS=[{
 id:'main-1',domain:'sprite-37',firstBlockFrame:2,lastBlockFrame:351,
 lastVisualFrame:351,initialSeekSamples:1673,
 sourcePath:'output/alg-l06-p019-audio-v1/sprite-37-source-v1.mp3',
 sourceBytes:144950,
 sourceSha256:'0817bac5188a2a24d9eb48b3c8bffd293f31b715c4816e7159467d00c83f49ad',
 sampleRate:22050,channels:1,decodedSamples:642240,
 pcmSha256:'e2a3cde4fdb4f7626831ea295541a754562d59012af969480d9bb4b45052734b',
 receiptSha256:'4ef9b6b86bec362e67d4b3e5fbc53781a86040ad82e81657d1bbf0a27a405e6b',
 originalRuntimeAccepted:false,audioAccepted:false,
}] as const;
export const P019_SA_ASSET={role:'separate-sa',
 sourcePath:'output/alg-l06-p019-audio-v1/separate-sa-source-v1.mp3',
 sourceBytes:238896,
 sourceSha256:'4c9c5df0d49d8a612a00c73f9dcf31ef63a4d34ab6c458625432e71b46c129d9',
 sampleRate:48000,channels:1,decodedSamples:819072,durationSeconds:17.064,
 pcmSha256:'acff960bea9c147864d74f2784cab292f5a96d9063c52ec76fd6b422e8b3ec9c',
 receiptSha256:'4ef9b6b86bec362e67d4b3e5fbc53781a86040ad82e81657d1bbf0a27a405e6b',
 playbackStarted:false,originalRuntimeAccepted:false,audioAccepted:false,
} as const;
export type P019AudioId=typeof P019_AUDIO_ASSETS[number]['id'];
export const P019_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-37',lastVisualFrame:351,
 mainRanges:[[2,351]],sourceHasNegativeSeek:false,sourceZeroPayloadBlockFrames:[3],
 sourceAlignment:'unresolved',syntheticSilenceAdded:false,
 mainRangesConcatenated:false,separateSaSpliced:false,localeStartsAudio:false,
 originalHostBindingObserved:false,originalRuntimeAccepted:false,
 listeningAccepted:false,audioAccepted:false} as const;

/** Source first-block seek as a modern engineering candidate. Browser PCM
 * sample exhaustion is before visual 351; this does not prove Flash sync. */
export const P019_NATIVE_AUDIO_END_POSITION=P019_AUDIO_ASSETS[0].firstBlockFrame+
 (P019_AUDIO_ASSETS[0].decodedSamples-P019_AUDIO_ASSETS[0].initialSeekSamples)/
 P019_AUDIO_ASSETS[0].sampleRate*P019_AUDIO_DISPOSITION.fps;
export const P019_AUDIO_END_POSITION=Math.max(P019_AUDIO_DISPOSITION.lastVisualFrame,
 P019_NATIVE_AUDIO_END_POSITION);

/** One intact MP3 stream covers blocks f2..351. The f3 empty payload is not
 * a missing block or a license to insert silence. */
export function p019AudioSlice(id:P019AudioId,framePosition:number){
 const asset=P019_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||
   framePosition>P019_AUDIO_END_POSITION)
  throw Error('P019_INVALID_MAIN_AUDIO_POSITION');
 const secondsFromFirst=(framePosition-asset.firstBlockFrame)/P019_AUDIO_DISPOSITION.fps;
 const firstDecodedSample=asset.initialSeekSamples+
  Math.max(0,secondsFromFirst)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
