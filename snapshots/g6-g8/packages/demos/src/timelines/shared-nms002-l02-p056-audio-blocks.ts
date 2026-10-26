import {
  P056_AUDIO_BLOCK_SAMPLE_COUNTS,
  P056_AUDIO_BLOCK_SOURCE,
} from '../generated/nms-l02-p056-audio-blocks-v1';

const cumulativeDeclaredSamples = [0];
for (const count of P056_AUDIO_BLOCK_SAMPLE_COUNTS) {
  cumulativeDeclaredSamples.push(cumulativeDeclaredSamples.at(-1)! + count);
}
if (P056_AUDIO_BLOCK_SAMPLE_COUNTS.length !== P056_AUDIO_BLOCK_SOURCE.blockCount ||
    cumulativeDeclaredSamples.at(-1) !== P056_AUDIO_BLOCK_SOURCE.totalBlockHeaderSamples) {
  throw new Error('P056 source audio block accounting is inconsistent');
}

/** A source SoundStreamBlock and its header sample counts, not a playback clock. */
export function p056SourceAudioBlock(teachingFrame: number): Readonly<{
  teachingFrame: number;
  declaredSamples: number;
  cumulativeDeclaredSamplesBefore: number;
  cumulativeDeclaredSamplesAfter: number;
}> | null {
  if (!Number.isInteger(teachingFrame) || teachingFrame < 1 ||
      teachingFrame > P056_AUDIO_BLOCK_SOURCE.lastBlockFrame) {
    throw new RangeError('P056 teaching frame is outside sprite-24');
  }
  if (teachingFrame < P056_AUDIO_BLOCK_SOURCE.firstBlockFrame) return null;
  const index = teachingFrame - P056_AUDIO_BLOCK_SOURCE.firstBlockFrame;
  return Object.freeze({
    teachingFrame,
    declaredSamples: P056_AUDIO_BLOCK_SAMPLE_COUNTS[index],
    cumulativeDeclaredSamplesBefore: cumulativeDeclaredSamples[index],
    cumulativeDeclaredSamplesAfter: cumulativeDeclaredSamples[index + 1],
  });
}
