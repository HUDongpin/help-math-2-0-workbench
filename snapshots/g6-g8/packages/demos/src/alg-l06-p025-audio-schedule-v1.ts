/* Generated browser binding by output/alg-l06-p025-product-integration-v1/build-audio-schedule-v1.mjs. */
export const P025_AUDIO_BROWSER_RECEIPT_SHA256='5971aad4198006232e4af43890cabfa97f8fcbae2a57ca572354afadc249590b';
export const P025_AUDIO_ASSETS=[{
  "role": "main-1",
  "sourceBytes": 123500,
  "sourceSha256": "e6122c6402e0000f810b82a6f91b76b50a918a44b75709194b2cec3834a201c4",
  "contextSampleRate": 22050,
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 547200,
  "durationSeconds": 24.816326530612244,
  "pcmSha256": "251b3141cd0879bf22ab82ab81df9c071d313e438098a049df02212cf848a93a",
  "playbackStarted": false,
  "sourcePath": "output/alg-l06-p025-audio-v1/sprite-21-source-v1.mp3",
  "receiptSha256": "5971aad4198006232e4af43890cabfa97f8fcbae2a57ca572354afadc249590b",
  "originalRuntimeAccepted": false,
  "audioAccepted": false,
  "id": "main-1",
  "domain": "sprite-21",
  "firstBlockFrame": 2,
  "lastBlockFrame": 299,
  "lastVisualFrame": 299,
  "initialSeekSamples": 1673
}] as const;
export const P025_SA_ASSET={
  "role": "separate-sa",
  "sourceBytes": 173040,
  "sourceSha256": "295dcabe0549764ffe03ecc4e6a332a5cb85d05329095be079ad32bdac6a044e",
  "contextSampleRate": 48000,
  "sampleRate": 48000,
  "channels": 1,
  "decodedSamples": 593280,
  "durationSeconds": 12.36,
  "pcmSha256": "3dd78ab1d3e31085d8f7cc93403f1ff84ef70f42c93d26f2b8c43b48bad6789c",
  "playbackStarted": false,
  "sourcePath": "output/alg-l06-p025-audio-v1/separate-sa-source-v1.mp3",
  "receiptSha256": "5971aad4198006232e4af43890cabfa97f8fcbae2a57ca572354afadc249590b",
  "originalRuntimeAccepted": false,
  "audioAccepted": false
} as const;
export type P025AudioId=typeof P025_AUDIO_ASSETS[number]['id'];
export const P025_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-21',lastVisualFrame:299,
 mainRanges:[[2,299]],sourceHasNegativeSeek:false,sourceZeroPayloadBlockFrames:[3],sourceAlignment:'unresolved',
 syntheticSilenceAdded:false,mainRangesConcatenated:false,separateSaSpliced:false,localeStartsAudio:false,
 originalHostBindingObserved:false,originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false} as const;
export const P025_NATIVE_AUDIO_END_POSITION=2+(547200-1673)/22050*12;
export const P025_AUDIO_END_POSITION=299;
export function p025AudioSlice(id:P025AudioId,framePosition:number){
 const asset=P025_AUDIO_ASSETS.find(a=>a.id===id);
 if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>299)
  throw Error('P025_INVALID_MAIN_AUDIO_POSITION');
 const seconds=(framePosition-asset.firstBlockFrame)/12;
 const firstDecodedSample=asset.initialSeekSamples+Math.max(0,seconds)*asset.sampleRate;
 if(firstDecodedSample>=asset.decodedSamples)return null;
 return {asset,firstDecodedSample,delaySeconds:Math.max(0,-seconds),
  durationSeconds:(asset.decodedSamples-firstDecodedSample)/asset.sampleRate};
}
