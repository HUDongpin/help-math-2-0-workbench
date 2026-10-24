/** P026 sprite-55 source blocks. Browser PCM comes from Chrome 154 decode-only
 * receipt output/alg-l06-p026-chrome-decode-v1/browser-decode.json; native CLI
 * hashes are not substituted and playback/listening remain separate gates. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P026_AUDIO_BROWSER_RECEIPT_SHA256=
  '1fec740f47acdc7b52d27b519c8461f54a53976e74a338a0703296e2c3d001b3';
export const P026_SOURCE_SWF_SHA256='a61e60f95dc597c7b0024e7f013abfade47e199ae911be77916d5b38c7828e0c';
export const P026_AUDIO_ASSETS=[
  {id:'main-1',sourceBytes:52520,sourceSha256:'ef1eac21881278a8ad30a2c17fef520f820940bc0941aea533493c4307b5a670',
    sampleRate:22050,channels:1,firstBlockFrame:31,lastBlockFrame:158,initialSeekSamples:1673,
    nativeCandidateSamples:232704,negativeSeekBlock:{frame:158,seekSamples:-2267,mp3PayloadBytes:0}},
  {id:'main-2',sourceBytes:80470,sourceSha256:'c2ee52ab31a0ada790a4ac8659c0b703e999d830d6bc5c6b734f57d399c0f4dd',
    sampleRate:22050,channels:1,firstBlockFrame:196,lastBlockFrame:389,initialSeekSamples:541,
    nativeCandidateSamples:356544,negativeSeekBlock:null},
] as const;
export type P026AudioId=typeof P026_AUDIO_ASSETS[number]['id'];
export const P026_SA_ASSET={sourceBytes:120960,
  sourceSha256:'1ef4cbedd255911e0392e26fa5420787f6338dff70c405d4074eb86427003b06',
  sampleRate:48000,channels:1,nativeCandidateSamples:414720} as const;
export const P026_BROWSER_BINDINGS:Readonly<Record<P026AudioId,DecodedSourceStreamBinding>>=Object.freeze({
  'main-1':Object.freeze({sourceSha256:P026_AUDIO_ASSETS[0].sourceSha256,
    sourceBytes:P026_AUDIO_ASSETS[0].sourceBytes,sampleRate:22050,channels:1,
    decodedSamples:232704,
    pcmSha256:'6540b6ee5ea6e2d8fb34ec2942ebb7a91514664a88914057c120e9643f552382'}),
  'main-2':Object.freeze({sourceSha256:P026_AUDIO_ASSETS[1].sourceSha256,
    sourceBytes:P026_AUDIO_ASSETS[1].sourceBytes,sampleRate:22050,channels:1,
    decodedSamples:356544,
    pcmSha256:'c10e3cc7865cea5102bd7561b5b36af4f684468e4f6ee06a5945456f94f35e22'}),
});
export const P026_SA_BROWSER_BINDING:DecodedSourceStreamBinding=Object.freeze({
  sourceSha256:P026_SA_ASSET.sourceSha256,sourceBytes:P026_SA_ASSET.sourceBytes,
  sampleRate:48000,channels:1,decodedSamples:414720,
  pcmSha256:'b79feaf3b27da1e4948cbef96bf07399b0c8299a2c8b3713aae2d977549ffc42',
});
export const P026_AUDIO_DISPOSITION={fps:12,frameDomain:'sprite-55',firstFrame:1,lastVisualFrame:389,
  mainRanges:[[31,158],[196,389]],emptyNegativeSeekBlock:{frame:158,seekSamples:-2267,mp3PayloadBytes:0},
  gapFrames:[159,195],syntheticSilenceAdded:false,mainRangesConcatenated:false,
  separateSaSpliced:false,localeStartsAudio:false,originalRuntimeAccepted:false,
  listeningAccepted:false,audioAccepted:false} as const;

/** Source-derived candidate offset, retaining each range's own initial seek.
 * Native EOF is an event; this function never converts duration into EOF. */
export function p026AudioSlice(id:P026AudioId,framePosition:number,decodedSamples:number){
  const asset=P026_AUDIO_ASSETS.find(a=>a.id===id);
  if(!asset||!Number.isFinite(framePosition)||framePosition<1||framePosition>389||
    !Number.isSafeInteger(decodedSamples)||decodedSamples<=0)
    throw Error('P026_INVALID_AUDIO_POSITION');
  const seconds=(framePosition-asset.firstBlockFrame)/12;
  const firstDecodedSample=asset.initialSeekSamples+Math.max(0,seconds)*asset.sampleRate;
  if(firstDecodedSample>=decodedSamples)return null;
  return Object.freeze({asset,firstDecodedSample,
    delaySeconds:Math.max(0,-seconds),
    advisoryNativeEndFrame:asset.firstBlockFrame+
      (decodedSamples-asset.initialSeekSamples)/asset.sampleRate*12});
}
