import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

/** One physical P032 stream. Chrome PCM is independently measured; source
 * frame-to-decoded-sample alignment and audible onset remain unaccepted. */
export const P032_SOURCE_SWF_SHA256=
 'e425600d0b6cfab41ae50f7512cb8e6c4e3c6ee04bbfa10c29b437459876d836';
export const P032_MAIN_ASSET=Object.freeze({id:'main-1' as const,
 sourceBytes:171080,
 sourceSha256:'2584a692ee3936f02c3dc491872225f020744ce92710f890e1a31d468a75c85b',
 sampleRate:22050,channels:1,firstBlockFrame:1,lastBlockFrame:413,
 blockCount:413,declaredSamples:758016,initialSeekSamples:1673,
 firstBlockSamples:3456,zeroSampleFrame:2,
 ffmpegCandidateSamples:758016,
 ffmpegPcmSha256:'3d1b76c12063ffc8886251b0648551f45656142e518c6e166663dc6258379051',
 chrome154DecodedSamples:758016,
 chrome154PcmSha256:'6b33e50188fb094d75efc85565431551186f9fe47cea5020a6e73f5342940373'});
export const P032_SA_ASSET=Object.freeze({sourceBytes:232176,
 sourceSha256:'9cdf2402eea05caebc190680eff4b15ee3baada80e366ed4e4ac96df7f3dd478',
 sampleRate:48000,channels:1,ffmpegCandidateSamples:796032,
 ffmpegPcmSha256:'95da9f0f4b8ae43948d1711993b0323929fb1a1bce43252a54698b8c3d7f2517',
 chrome154DecodedSamples:796032,
 chrome154PcmSha256:'9d800df26565b9c8c5b572e0e2f4ed3618b52ac5d99438f2c53f6674d3f7be19'});
export const P032_AUDIO_DISPOSITION=Object.freeze({frameDomain:'sprite-22' as const,
 fps:12,rootEntryFrame:6,visualFrames:413,mainRanges:[[1,413]] as const,
 zeroPayloadFrames:[2] as const,initialSeekSamples:1673,
 mainRunsConcatenated:false,syntheticSilenceAdded:false,separateSaSpliced:false,
 localeStartsAudio:false,browserDecodeObserved:true,hostPlaybackObserved:false,
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});

export function p032ValidateBrowserBinding(binding:DecodedSourceStreamBinding|undefined,
 asset:Pick<typeof P032_MAIN_ASSET,'sourceSha256'|'sourceBytes'|'sampleRate'|'channels'>=P032_MAIN_ASSET){
 if(!binding||binding.sourceSha256!==asset.sourceSha256||
  binding.sourceBytes!==asset.sourceBytes||binding.sampleRate!==asset.sampleRate||
  binding.channels!==asset.channels||!Number.isSafeInteger(binding.decodedSamples)||
  binding.decodedSamples<=P032_MAIN_ASSET.initialSeekSamples||
  !/^[a-f0-9]{64}$/u.test(binding.pcmSha256))
  throw Error('P032_BROWSER_PCM_BINDING_REQUIRED');
 return binding;
}

/** Advisory visual-frame seek. It is deliberately not a native EOF or
 * Flash/Chrome timing-parity claim. Resume must use the held decoded cursor. */
export function p032AudioSlice(framePosition:number,decodedSamples:number){
 if(!Number.isFinite(framePosition)||framePosition<1||framePosition>413||
  !Number.isSafeInteger(decodedSamples)||decodedSamples<=P032_MAIN_ASSET.initialSeekSamples)
  throw Error('P032_INVALID_AUDIO_POSITION');
 const seconds=(framePosition-P032_MAIN_ASSET.firstBlockFrame)/12;
 const firstDecodedSample=P032_MAIN_ASSET.initialSeekSamples+
  seconds*P032_MAIN_ASSET.sampleRate;
 if(firstDecodedSample>=decodedSamples)return null;
 return Object.freeze({firstDecodedSample,delaySeconds:0,
  advisoryNativeEndFrame:P032_MAIN_ASSET.firstBlockFrame+
   (decodedSamples-P032_MAIN_ASSET.initialSeekSamples)/P032_MAIN_ASSET.sampleRate*12,
  sourceAlignmentAccepted:false as const});
}
