import {P038_AUDIO_SOURCES} from './nms-l02-p038-audio-source-v1';
export type P038AudioDomain = keyof typeof P038_AUDIO_SOURCES;
export function p038AudioSource(domain: string) {
  if (!Object.hasOwn(P038_AUDIO_SOURCES, domain)) throw Error('P038_AUDIO_DOMAIN');
  return P038_AUDIO_SOURCES[domain as P038AudioDomain];
}
export function p038PrepareSourcePcm(samples: Float32Array, domain: string): Float32Array {
  const source = p038AudioSource(domain);
  if (samples.length !== source.decodedSamples) throw Error('P038_AUDIO_DECODE');
  let peak = 0;
  for (const x of samples) {
    if (!Number.isFinite(x)) throw Error('P038_AUDIO_NONFINITE');
    peak = Math.max(peak, Math.abs(x));
  }
  if (!peak) throw Error('P038_AUDIO_SILENT');
  const output = new Float32Array(source.totalSamples);
  let sourceCursor: number = source.latencySamples, outputCursor = 0;
  for (const segment of source.segments) {
    if (segment.sourceStart !== sourceCursor || segment.sourceEnd <= segment.sourceStart
      || segment.sourceEnd > samples.length || segment.outputStart < outputCursor
      || segment.outputEnd > output.length
      || segment.outputEnd - segment.outputStart !== segment.sourceEnd - segment.sourceStart) {
      throw Error('P038_AUDIO_PARTITION');
    }
    output.set(samples.subarray(segment.sourceStart, segment.sourceEnd), segment.outputStart);
    sourceCursor = segment.sourceEnd; outputCursor = segment.outputEnd;
  }
  if (sourceCursor !== samples.length) throw Error('P038_AUDIO_PARTITION');
  return output;
}
