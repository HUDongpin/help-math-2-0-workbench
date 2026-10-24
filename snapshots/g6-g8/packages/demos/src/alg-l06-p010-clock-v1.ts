import {ContinuousSourceStreamClockCandidate} from './continuous-source-stream-clock-candidate';
import {P010_CONTINUOUS_AUDIO} from './alg-l06-p010-audio-schedule-v1';
import {P010_TIMELINE} from './alg-l06-p010-timeline-v1';

/** Chrome 153 decode-only measurement. Playback, listening and original-runtime
 * synchronization are separate, still pending evidence gates. */
export const P010_BROWSER_DECODER = Object.freeze({
  receiptSha256: 'd5afcb1d51d1688d9704cd8cebc70d478a10a5b825084bb0be03e67b010d053c',
  sourceSha256: P010_CONTINUOUS_AUDIO.sourceMp3Sha256,
  sourceBytes: P010_CONTINUOUS_AUDIO.sourceMp3Bytes,
  sampleRate: P010_CONTINUOUS_AUDIO.sampleRate,
  channels: 1 as const,
  decodedSamples: P010_CONTINUOUS_AUDIO.decodedSamples,
  pcmSha256: '4d9ac20773088e0d854b6be777741c84d6754a461e51487a872304ef46d36778',
  browser: 'Chrome/153.0.0.0 macOS',
  originalRuntimeAccepted: false,
  audioAccepted: false,
});

export const P010_CONTINUOUS_SOURCE_URL =
  `/flash-assets/g678-local/shared-alg001-l06-p010/continuous-source-v1?sha256=${P010_BROWSER_DECODER.sourceSha256}`;

const plan = Object.freeze({
  sourceSwfSha256: P010_TIMELINE.sourceSwfSha256,
  frameDomain: P010_TIMELINE.frameDomain,
  firstFrame: 1,
  lastFrame: P010_TIMELINE.mainFrameCount,
  audioFirstFrame: P010_CONTINUOUS_AUDIO.firstBlockFrame,
  fps: P010_TIMELINE.fps,
  latencySamples: P010_CONTINUOUS_AUDIO.initialSeekSamples,
  sourceSegmentCount: 1 as const,
  sourceHasNegativeSeek: false as const,
  decoder: P010_BROWSER_DECODER,
});

/** The shared continuous transport owns one embedded stream and its visual
 * tail. Its 303 hold is the source-supported conditional host policy. */
export class AlgL06P010ClockV1 extends ContinuousSourceStreamClockCandidate {
  constructor(options: {createContext?: () => AudioContext; commitHeldFrame: (frame: number) => boolean}) {
    super(plan, options);
  }
}
