import { P043_AUDIO_PLANS } from './generated/nms-l02-p043-audio-plan-v1';
export type P043AudioDomain = keyof typeof P043_AUDIO_PLANS;
export function p043PrepareSourcePcm(domain: P043AudioDomain, samples: Float32Array): Float32Array {
  const plan = P043_AUDIO_PLANS[domain];
  if (!plan || samples.length !== plan.decodedSamples) throw Error('P043_AUDIO_IDENTITY');
  let peak = 0;
  for (const value of samples) {
    if (!Number.isFinite(value)) throw Error('P043_AUDIO_NONFINITE');
    peak = Math.max(peak, Math.abs(value));
  }
  if (!peak) throw Error('P043_AUDIO_SILENT');
  const output = new Float32Array(plan.totalSamples);
  let cursor: number = plan.latencySamples, end = 0;
  for (const segment of plan.segments) {
    if (segment.sourceStart !== cursor || segment.sourceEnd <= cursor || segment.sourceEnd > samples.length
      || segment.outputStart < end || segment.outputEnd - segment.outputStart !== segment.sourceEnd - segment.sourceStart) throw Error('P043_AUDIO_PARTITION');
    const count = Math.min(segment.sourceEnd - segment.sourceStart, output.length - segment.outputStart);
    if (count < 0) throw Error('P043_AUDIO_PARTITION');
    for (let i = segment.sourceStart + count; i < segment.sourceEnd; i++) if (samples[i] !== 0) throw Error('P043_AUDIO_NONZERO_TAIL');
    output.set(samples.subarray(segment.sourceStart, segment.sourceStart + count), segment.outputStart);
    cursor = segment.sourceEnd; end = segment.outputEnd;
  }
  if (cursor !== samples.length) throw Error('P043_AUDIO_PARTITION');
  return output;
}
