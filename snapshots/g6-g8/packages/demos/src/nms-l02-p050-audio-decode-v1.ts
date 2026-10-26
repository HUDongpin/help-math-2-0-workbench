import { P050_AUDIO_PLANS } from './generated/nms-l02-p050-audio-plan-v1';
import { p050PrepareSourcePcm, type P050AudioDomain } from './nms-l02-p050-audio-pcm-v1';
/** Decode at each source rate. The playback context resamples the prepared buffer. */
export async function p050DecodeAudio(context: BaseAudioContext, domain: P050AudioDomain, encoded: ArrayBuffer, signal: AbortSignal): Promise<AudioBuffer> {
  signal.throwIfAborted();
  if (!Object.hasOwn(P050_AUDIO_PLANS, domain)) throw Error('P050_AUDIO_DOMAIN');
  const plan = P050_AUDIO_PLANS[domain];
  if (!plan || encoded.byteLength !== plan.inputBytes) throw Error('P050_AUDIO_INPUT');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoded))].map(n => n.toString(16).padStart(2, '0')).join('');
  signal.throwIfAborted();
  if (digest !== plan.inputSha256) throw Error('P050_AUDIO_HASH');
  const decoder = new OfflineAudioContext(1, 1, plan.sampleRate);
  const decoded = await decoder.decodeAudioData(encoded.slice(0));
  signal.throwIfAborted();
  if (decoded.numberOfChannels !== plan.channels || decoded.sampleRate !== plan.sampleRate || decoded.length !== plan.decodedSamples) throw Error('P050_AUDIO_DECODE');
  const samples = p050PrepareSourcePcm(domain, decoded.getChannelData(0));
  signal.throwIfAborted();
  const buffer = context.createBuffer(1, samples.length, plan.sampleRate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  return buffer;
}
