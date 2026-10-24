/** P023 single-range source schedule bound to FFmpeg and actual Chrome decode.
 * First-block seek is a modern candidate; original Flash sync is unresolved. */
export const P023_AUDIO_BROWSER_RECEIPT_SHA256=
  '09ce38fc1c6ba3814d118a5af50aab352596a06e3bceb9baed68c554b5e31d5f';
export const P023_AUDIO_PLAN_V2_SHA256=
  '94dba8a84b49793abf8159c4cd1ef76db6f891d8832468096c0ba552c23098de';
export const P023_AUDIO_ASSETS=[{
  id:'main-1',domain:'sprite-38',firstBlockFrame:11,lastBlockFrame:410,
  lastVisualFrame:410,initialSeekSamples:1673,
  sourcePath:'output/alg-l06-p023-audio-v1/sprite-38-source-v1.mp3',
  sourceBytes:165750,
  sourceSha256:'a8a52336d0b4e37aa2c00edc77a491afac4b38b173f13909d75b4a889a1e09a6',
  sampleRate:22050,channels:1,decodedSamples:734400,
  pcmSha256:'c0daeabc88ad08cc893cde22cb2d61c1c4d85471fb5f7c384778228fcac55206',
  receiptSha256:P023_AUDIO_BROWSER_RECEIPT_SHA256,
  originalRuntimeAccepted:false,audioAccepted:false,
}] as const;
export const P023_SA_ASSET={role:'separate-sa',
  sourcePath:'output/alg-l06-p023-audio-v1/separate-sa-source-v1.mp3',
  sourceBytes:292320,
  sourceSha256:'c8da225f06545b2fd3b7edb77be46af198337b168dadd3c869cd9613377c33c5',
  sampleRate:48000,channels:1,decodedSamples:1002240,durationSeconds:20.88,
  pcmSha256:'c13d24be27ecce1a41429ab36e10996d4dd8d7212a2c56d3fb31baa199d2f38c',
  receiptSha256:P023_AUDIO_BROWSER_RECEIPT_SHA256,
  playbackStarted:false,originalRuntimeAccepted:false,audioAccepted:false,
} as const;
export type P023AudioId=typeof P023_AUDIO_ASSETS[number]['id'];
export const P023_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-38',
  lastVisualFrame:410,mainRanges:[[11,410]],sourceHasNegativeSeek:false,
  sourceZeroPayloadBlockFrames:[12],sourceAlignment:'unresolved',
  syntheticSilenceAdded:false,mainRangesConcatenated:false,
  separateSaSpliced:false,localeStartsAudio:false,
  originalHostBindingObserved:false,originalRuntimeAccepted:false,
  listeningAccepted:false,audioAccepted:false} as const;

export const P023_NATIVE_AUDIO_END_POSITION=P023_AUDIO_ASSETS[0].firstBlockFrame+
  (P023_AUDIO_ASSETS[0].decodedSamples-P023_AUDIO_ASSETS[0].initialSeekSamples)/
  P023_AUDIO_ASSETS[0].sampleRate*P023_AUDIO_DISPOSITION.fps;
export const P023_AUDIO_END_POSITION=Math.max(P023_AUDIO_DISPOSITION.lastVisualFrame,
  P023_NATIVE_AUDIO_END_POSITION);

/** One intact MP3 range covers source blocks 11..410. Frame 12's empty
 * payload remains a source fact; this function never fabricates silence. */
export function p023AudioSlice(id:P023AudioId,framePosition:number){
  const asset=P023_AUDIO_ASSETS.find(a=>a.id===id);
  if(!asset||!Number.isFinite(framePosition)||framePosition<1||
    framePosition>P023_AUDIO_END_POSITION)
    throw Error('P023_INVALID_MAIN_AUDIO_POSITION');
  const secondsFromFirst=(framePosition-asset.firstBlockFrame)/P023_AUDIO_DISPOSITION.fps;
  const firstDecodedSample=asset.initialSeekSamples+
    Math.max(0,secondsFromFirst)*asset.sampleRate;
  if(firstDecodedSample>=asset.decodedSamples)return null;
  return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
    durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
