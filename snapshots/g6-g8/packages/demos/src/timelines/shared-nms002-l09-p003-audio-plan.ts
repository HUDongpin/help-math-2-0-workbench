// P003 local engineering audio plan. Chromium 153 decoded PCM is pinned
// separately from FFmpeg; neither digest establishes original-runtime audio.
import type {ContinuousSourceClockPlan} from
  '../continuous-source-stream-clock-candidate';
import {NMS_L09_P003_SOURCE} from './shared-nms002-l09-p003-source-clock';

export const NMS_L09_P003_AUDIO_PLAN: ContinuousSourceClockPlan = Object.freeze({
  sourceSwfSha256: NMS_L09_P003_SOURCE.swfSha256,
  frameDomain: NMS_L09_P003_SOURCE.mainFrameDomain,
  firstFrame: 1,
  lastFrame: NMS_L09_P003_SOURCE.mainFrameCount,
  audioFirstFrame: 1,
  fps: NMS_L09_P003_SOURCE.fps,
  latencySamples: 1673,
  sourceSegmentCount: 1,
  sourceHasNegativeSeek: false,
  decoder: Object.freeze({
    sourceSha256: 'a8ca1683d3f7848f16f9be96e3472c41594485a853778defc96cebfe6243307f',
    sourceBytes: 263120,
    sampleRate: 22050,
    channels: 1,
    decodedSamples: 1165824,
    pcmSha256: '8186323537f3a02d1a5a837cf1a7cfde96d64f7b5a1e1f823fdaf4419763a4a4',
  }),
});
