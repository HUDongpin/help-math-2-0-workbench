import CUE from '../../../../migrations/shared-alg001-l06-p029/audio-v1/adpcm179-cue-v1.json';
import {P029_AUDIO_MANIFEST} from './audio-schedule-v1';
import {P029_SOURCE} from './quiz-reducer-v1';
import type {DecodedSourceStreamBinding} from '../decoded-source-stream-transport';

/** Source/host-bound technical policy for the right-feedback #3 ADPCM clip.
 * This chooses the first Chrome sample grid point not before the source
 * frame-1 block boundary. It does not assert resampler-phase or Flash parity. */
export function p029Adpcm179EntryPolicy(binding:DecodedSourceStreamBinding){
  const asset=P029_AUDIO_MANIFEST.embedded.find(a=>a.domain==='sprite-179');
  if(!asset||asset.codec!=='swf-adpcm'||
    CUE.sourceBinding.pageSwfSha256!==P029_SOURCE.swfSha256||
    CUE.sourceBinding.pageStructureSha256!==P029_SOURCE.structuralXmlSha256||
    CUE.sourceBinding.wavSha256!==asset.sourceSha256||
    CUE.sourceBinding.rawAdpcmSha256!==asset.rawSourceSha256||
    CUE.hostBinding.selectedClipEntryFrame!==2||
    CUE.chromeBinding.sourceWavSha256!==binding.sourceSha256||
    CUE.chromeBinding.pcmSha256!==binding.pcmSha256||
    CUE.chromeBinding.sampleRate!==binding.sampleRate||
    CUE.chromeBinding.decodedSamples!==binding.decodedSamples||
    binding.sourceBytes!==asset.sourceBytes||binding.channels!==1||
    CUE.entryPolicy.decodedSample!==Math.ceil(
      CUE.sourceBinding.firstBlockSourceSamples*binding.sampleRate/CUE.sourceBinding.sourceSampleRate))
    throw Error('P029_ADPCM179_SOURCE_HOST_PCM_BINDING_MISMATCH');
  return Object.freeze({entryFrame:2 as const,
    decodedSample:CUE.entryPolicy.decodedSample,
    evidenceRef:CUE.entryPolicy.evidenceRef});
}
