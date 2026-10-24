import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

/** Physical source and FFmpeg technical decode only. There is no frozen
 * browser PCM binding yet; callers must inject an independently measured one. */
export const P027_SOURCE_SWF_SHA256=
  '689318e75aac8740344e8ff119df34a288e7da24dc3dc0c62c0f22601666f984';
export const P027_MAIN_ASSET=Object.freeze({id:'main-1' as const,
  sourceBytes:318760,
  sourceSha256:'8b2d1bf09c88647b4799108ad85ff563e744cc899226d1bb1b07ee1cc5551929',
  sampleRate:22050,channels:1,firstBlockFrame:2,lastBlockFrame:770,
  blockCount:769,declaredSamples:1412352,initialSeekSamples:1673,
  ffmpegCandidateSamples:1412352,
  ffmpegPcmSha256:'e5a8e22cd15ffa849f495ebca510071558cf5dcd90c2509d2b75be705a65e42e'});
export const P027_SA_ASSET=Object.freeze({sourceBytes:381360,
  sourceSha256:'445005ae7c0a6f4896c686ad46c35e56847e4e977b991d5aa40add7a5e271cc0',
  sampleRate:48000,channels:1,ffmpegCandidateSamples:1307520,
  ffmpegPcmSha256:'47b969e1ac241a14cc77683f33005f3ab6a94abc1c73437e3cebfe1eef00a392'});
export const P027_AUDIO_DISPOSITION=Object.freeze({frameDomain:'sprite-46' as const,
  fps:12,rootEntryFrame:6,visualFrames:770,mainRanges:[[2,770]] as const,
  zeroPayloadFrames:[3] as const,mainRunsConcatenated:false,syntheticSilenceAdded:false,
  separateSaSpliced:false,localeStartsAudio:false,browserDecodeObserved:false,
  originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});

export function p027ValidateBrowserBinding(binding:DecodedSourceStreamBinding|undefined,
  asset:Pick<typeof P027_MAIN_ASSET,'sourceSha256'|'sourceBytes'|'sampleRate'|'channels'>=P027_MAIN_ASSET){
 if(!binding||binding.sourceSha256!==asset.sourceSha256||
  binding.sourceBytes!==asset.sourceBytes||binding.sampleRate!==asset.sampleRate||
  binding.channels!==asset.channels||!Number.isSafeInteger(binding.decodedSamples)||
  binding.decodedSamples<=P027_MAIN_ASSET.initialSeekSamples||
  !/^[a-f0-9]{64}$/u.test(binding.pcmSha256))
  throw Error('P027_BROWSER_PCM_BINDING_REQUIRED');
 return binding;
}

/** Source frame predicts a seek, never a native EOF or listening result. */
export function p027AudioSlice(framePosition:number,decodedSamples:number){
 if(!Number.isFinite(framePosition)||framePosition<1||framePosition>770||
  !Number.isSafeInteger(decodedSamples)||decodedSamples<=P027_MAIN_ASSET.initialSeekSamples)
  throw Error('P027_INVALID_AUDIO_POSITION');
 const seconds=(framePosition-P027_MAIN_ASSET.firstBlockFrame)/12;
 const firstDecodedSample=P027_MAIN_ASSET.initialSeekSamples+
  Math.max(0,seconds)*P027_MAIN_ASSET.sampleRate;
 if(firstDecodedSample>=decodedSamples)return null;
 return Object.freeze({firstDecodedSample,delaySeconds:Math.max(0,-seconds),
  advisoryNativeEndFrame:P027_MAIN_ASSET.firstBlockFrame+
   (decodedSamples-P027_MAIN_ASSET.initialSeekSamples)/P027_MAIN_ASSET.sampleRate*12});
}
