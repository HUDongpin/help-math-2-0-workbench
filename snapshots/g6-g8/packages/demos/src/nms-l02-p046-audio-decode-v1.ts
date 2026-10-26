import { P046_AUDIO_PLANS } from './generated/nms-l02-p046-audio-plan-v1';
import { p046PrepareSourcePcm, type P046AudioDomain } from './nms-l02-p046-audio-pcm-v1';
/** Decode at each source rate. The playback context resamples the prepared buffer. */
export async function p046DecodeAudio(context: BaseAudioContext, domain: P046AudioDomain, encoded: ArrayBuffer, signal: AbortSignal): Promise<AudioBuffer> {
  signal.throwIfAborted();
  if (!Object.hasOwn(P046_AUDIO_PLANS, domain)) throw Error('P046_AUDIO_DOMAIN');
  const plan = P046_AUDIO_PLANS[domain];
  if (!plan || encoded.byteLength !== plan.inputBytes) throw Error('P046_AUDIO_INPUT');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))].map(n => n.toString(16).padStart(2, '0')).join('');
  signal.throwIfAborted();
  if (digest !== plan.inputSha256) throw Error('P046_AUDIO_HASH');
  const decoder = new OfflineAudioContext(1, 1, plan.sampleRate);
  const decoded = await decoder.decodeAudioData(encoded.slice(0));
  signal.throwIfAborted();
  if (decoded.numberOfChannels !== plan.channels || decoded.sampleRate !== plan.sampleRate || decoded.length !== plan.decodedSamples) throw Error('P046_AUDIO_DECODE');
  const samples = p046PrepareSourcePcm(domain, decoded.getChannelData(0));
  signal.throwIfAborted();
  const buffer = context.createBuffer(1, samples.length, plan.sampleRate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  return buffer;
}
