import {P040_AUDIO_SOURCE as source} from './generated/nms-l02-p040-audio-plan-v1';
import {p040PrepareSourcePcm} from './nms-l02-p040-audio-pcm-v1';
/** Caller owns context and hash-verified loading. A stale decode never publishes
 * a prepared buffer after pause, Replay, or unmount aborts this request. */
export async function p040DecodeAudio(context:BaseAudioContext,encoded:ArrayBuffer,signal:AbortSignal):Promise<AudioBuffer>{
 signal.throwIfAborted();if(context.sampleRate!==source.sampleRate)throw Error('P040_AUDIO_RATE');
 const decoded=await context.decodeAudioData(encoded.slice(0));signal.throwIfAborted();
 if(decoded.sampleRate!==source.sampleRate||decoded.numberOfChannels!==source.channels||decoded.length!==source.decodedSamples)throw Error('P040_AUDIO_DECODE');
 const samples=p040PrepareSourcePcm(decoded.getChannelData(0));signal.throwIfAborted();
 const prepared=context.createBuffer(1,samples.length,source.sampleRate);prepared.copyToChannel(new Float32Array(samples),0);return prepared;
}
