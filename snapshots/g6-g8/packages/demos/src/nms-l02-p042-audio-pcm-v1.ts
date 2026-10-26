import { P042_AUDIO_SOURCE as source } from './generated/nms-l02-p042-audio-plan-v1';

/** Source-frame placement after full MP3 decode. Retained samples stay unchanged. */
export function p042PrepareSourcePcm(samples: Float32Array): Float32Array {
  if (samples.length !== source.decodedSamples) throw Error('P042_AUDIO_DECODE');
  let peak = 0;
  for (const value of samples) {
    if (!Number.isFinite(value)) throw Error('P042_AUDIO_NONFINITE');
    peak = Math.max(peak, Math.abs(value));
  }
  if (!peak) throw Error('P042_AUDIO_SILENT');
  for (let i = 0; i < source.latencySamples; i++) if (samples[i] !== 0) throw Error('P042_AUDIO_LATENCY_NOT_SILENT');
  for (let i = source.silentTailStart; i < samples.length; i++) if (samples[i] !== 0) throw Error('P042_AUDIO_TAIL_NOT_SILENT');
  const output = new Float32Array(source.totalSamples);
  let cursor: number = source.latencySamples, previousEnd = 0;
  for (const segment of source.segments) {
    if (segment.sourceStart !== cursor || segment.sourceEnd <= cursor || segment.sourceEnd > samples.length
      || segment.outputStart < previousEnd || segment.outputEnd - segment.outputStart !== segment.sourceEnd - segment.sourceStart) {
      throw Error('P042_AUDIO_PARTITION');
    }
    const count = Math.min(segment.sourceEnd - segment.sourceStart, output.length - segment.outputStart);
    if (count < 0) throw Error('P042_AUDIO_PARTITION');
    output.set(samples.subarray(segment.sourceStart, segment.sourceStart + count), segment.outputStart);
    cursor = segment.sourceEnd;
    previousEnd = segment.outputEnd;
  }
  if (cursor !== samples.length) throw Error('P042_AUDIO_PARTITION');
  return output;
}
