/** P022 measured browser decode pins and source-frame range identity.
 * This is a modern technical schedule; original Flash seek/gap sync is open. */
export const P022_AUDIO_BROWSER_RECEIPT_SHA256=
  '77f5548d37df71b977a46cab35de3e0bda6fcf40fb627e1b7f02f615eb05c6fa';
export const P022_AUDIO_PLAN_V2_SHA256=
  '130aee754215123f8416750910c1ad90f2252101e90c6661d7b788aa55b91b26';
export const P022_AUDIO_ASSETS=[{
  id:'main-1',domain:'sprite-67',firstBlockFrame:2,lastBlockFrame:132,
  initialSeekSamples:1673,
  sourcePath:'output/alg-l06-p022-audio-v1/sprite-67-range-1-source-v1.mp3',
  sourceBytes:53820,
  sourceSha256:'a53bde941fbf8e15e8c3b7a416e8ee02d329b31fb4994f477c4cc76d5d9644d9',
  sampleRate:22050,channels:1,decodedSamples:238464,
  pcmSha256:'f0c73ef4bfc31618230a213c1f9401cf7cc2078905d2f0cfeae60162190c2dd3',
},{
  id:'main-2',domain:'sprite-67',firstBlockFrame:150,lastBlockFrame:422,
  initialSeekSamples:416,
  sourcePath:'output/alg-l06-p022-audio-v1/sprite-67-range-2-source-v1.mp3',
  sourceBytes:113230,
  sourceSha256:'9c9164f80ca329a12bfacd97feed7175547e8805dbf0d40d63becf8e79d20821',
  sampleRate:22050,channels:1,decodedSamples:501696,
  pcmSha256:'aa91728925dcf818ec21fd749b146473a4e92c4ae0695e9c9a0dcd59dc8138d1',
}] as const;
export const P022_SA_ASSET={role:'separate-sa',
  sourcePath:'output/alg-l06-p022-audio-v1/separate-sa-source-v1.mp3',
  sourceBytes:252000,
  sourceSha256:'2ced2d44148da73af856808834d32083d61d61d8073acdfe48650c1e9809a7bb',
  sampleRate:48000,channels:1,decodedSamples:864000,durationSeconds:18,
  pcmSha256:'1606599035355ba447310375dc3111a9d7ce393d409d8954e781de732896fee8',
  receiptSha256:P022_AUDIO_BROWSER_RECEIPT_SHA256,
  playbackStarted:false,originalRuntimeAccepted:false,audioAccepted:false,
} as const;
export type P022AudioId=typeof P022_AUDIO_ASSETS[number]['id'];
export const P022_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-67',
  lastVisualFrame:422,mainRanges:[[2,132],[150,422]],
  sourceZeroPayloadBlockFrames:[3,132],sourceNegativeSeek:{frame:132,samples:-2018},
  sourceMissingBlockFrames:Array.from({length:17},(_,i)=>133+i),
  sourceAlignment:'unresolved',syntheticSilenceAdded:false,
  mainRangesConcatenated:false,separateSaSpliced:false,localeStartsAudio:false,
  originalHostBindingObserved:false,originalRuntimeAccepted:false,
  listeningAccepted:false,audioAccepted:false} as const;

export const p022NativeAudioEndPosition=(id:P022AudioId)=>{
  const asset=P022_AUDIO_ASSETS.find(a=>a.id===id)!;
  return asset.firstBlockFrame+(asset.decodedSamples-asset.initialSeekSamples)/
    asset.sampleRate*P022_AUDIO_DISPOSITION.fps;
};
export const P022_AUDIO_END_POSITION=Math.max(P022_AUDIO_DISPOSITION.lastVisualFrame,
  p022NativeAudioEndPosition('main-2'));

/** One-indexed sprite-67 position, fractional during a partial frame.
 * Before a range this returns a delayed exact source start; after exhaustion
 * it returns null. It never supplies PCM for the absent-block interval. */
export function p022AudioSlice(id:P022AudioId,framePosition:number){
  const asset=P022_AUDIO_ASSETS.find(a=>a.id===id);
  if(!asset||!Number.isFinite(framePosition)||framePosition<1||
    framePosition>P022_AUDIO_END_POSITION)
    throw Error('P022_INVALID_MAIN_AUDIO_POSITION');
  const secondsFromFirst=(framePosition-asset.firstBlockFrame)/P022_AUDIO_DISPOSITION.fps;
  const firstDecodedSample=asset.initialSeekSamples+
    Math.max(0,secondsFromFirst)*asset.sampleRate;
  if(firstDecodedSample>=asset.decodedSamples)return null;
  return {asset,firstDecodedSample,delaySeconds:Math.max(0,-secondsFromFirst),
    durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
