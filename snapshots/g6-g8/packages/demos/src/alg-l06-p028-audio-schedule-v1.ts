import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

/** Source-bound P028 values; the FFmpeg candidate is never a browser binding. */
export const P028_SOURCE_SWF_SHA256=
 '12b9912231512d5622b96708b83331217691169fadf185b3b2d0a27733e3c297';
export const P028_MAIN_ASSET=Object.freeze({id:'main-1' as const,
 sourceBytes:54990,
 sourceSha256:'4f6453056b67a9eb37859eba02a0f0c31d1619d50fd7c83863c55f0fd7c41a70',
 sampleRate:22050,channels:1,firstBlockFrame:2,lastBlockFrame:134,
 blockCount:133,declaredSamples:243648,initialSeekSamples:1673,
 ffmpegCandidateSamples:243648,
 ffmpegPcmSha256:'8d638424fef8843fc7ca5328861448301d564433bc6b1edd52765513e9fcfbf2'});
export const P028_SA_ASSET=Object.freeze({sourceBytes:37632,
 sourceSha256:'f056221dc3c4251538c3a1d2c201bec5abe92c18a58f6ce1d185a8a6cf6703cf',
 sampleRate:48000,channels:1});
export const P028_AUDIO_DISPOSITION=Object.freeze({frameDomain:'sprite-30' as const,
 fps:12,rootEntryFrame:6,visualFrames:134,mainRanges:[[2,134]] as const,
 zeroPayloadFrames:[3] as const,mainRunsConcatenated:false,syntheticSilenceAdded:false,
 separateSaSpliced:false,localeStartsAudio:false,browserDecodeObserved:false,
 originalRuntimeAccepted:false,listeningAccepted:false,audioAccepted:false});

export function p028ValidateBrowserBinding(binding:DecodedSourceStreamBinding|undefined,
 asset:Pick<typeof P028_MAIN_ASSET,'sourceSha256'|'sourceBytes'|'sampleRate'|'channels'>=P028_MAIN_ASSET){
 if(!binding||binding.sourceSha256!==asset.sourceSha256||
  binding.sourceBytes!==asset.sourceBytes||binding.sampleRate!==asset.sampleRate||
  binding.channels!==asset.channels||!Number.isSafeInteger(binding.decodedSamples)||
  binding.decodedSamples<=P028_MAIN_ASSET.initialSeekSamples||
  !/^[a-f0-9]{64}$/u.test(binding.pcmSha256))
  throw Error('P028_BROWSER_PCM_BINDING_REQUIRED');
 return binding;
}

/** A proposed sample seek. Native EOF and alignment require browser evidence. */
export function p028AudioSlice(framePosition:number,decodedSamples:number){
 if(!Number.isFinite(framePosition)||framePosition<1||framePosition>134||
  !Number.isSafeInteger(decodedSamples)||decodedSamples<=P028_MAIN_ASSET.initialSeekSamples)
  throw Error('P028_INVALID_AUDIO_POSITION');
 const seconds=(framePosition-P028_MAIN_ASSET.firstBlockFrame)/12;
 const firstDecodedSample=P028_MAIN_ASSET.initialSeekSamples+
  Math.max(0,seconds)*P028_MAIN_ASSET.sampleRate;
 if(firstDecodedSample>=decodedSamples)return null;
 return Object.freeze({firstDecodedSample,delaySeconds:Math.max(0,-seconds),
  advisoryNativeEndFrame:P028_MAIN_ASSET.firstBlockFrame+
   (decodedSamples-P028_MAIN_ASSET.initialSeekSamples)/P028_MAIN_ASSET.sampleRate*12});
}
