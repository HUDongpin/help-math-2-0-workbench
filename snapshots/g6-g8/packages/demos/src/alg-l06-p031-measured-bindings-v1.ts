/** Generated from pinned P031 SWF and Chromium decode. Alignment/listening are unaccepted. */
import type {ContinuousSourceClockPlan} from './continuous-source-stream-clock-candidate';
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P031_BROWSER_READBACK_SHA256="d1fb6e2f03ce96714d1db5b248600056b954f869ffcebc1bd0f935f6a3107ce5";
export const P031_MEASURED_BINDINGS={
  "main": {
    "sourceBytes": 667810,
    "sourceSha256": "f3a9f682e20b8e76097ec8650e255727f64f0502a121e4346dc147bb496c22c7",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 2958912,
    "pcmSha256": "fdd70d0d41b771159ddcf4864b3513227ce0dcf34b0553fe4b7b622c3671319c"
  },
  "sa": {
    "sourceBytes": 299040,
    "sourceSha256": "b93fc98094fd30e603b8ad52c5a845fb1432a285298cb61e70cded340a1eff10",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 1025280,
    "pcmSha256": "0442409a26398246d53fa34bedfde525a4a0f4df1dcd0b597500a74ecf388a1e"
  }
} as const satisfies Record<'main'|'sa',DecodedSourceStreamBinding>;
export const P031_MAIN_CLOCK_PLAN={
  "sourceSwfSha256": "e0ab7279035ee362a5131807f8e6d7d683afb390f9dd627f9924b7a51f550a79",
  "frameDomain": "sprite-363",
  "firstFrame": 1,
  "lastFrame": 1611,
  "fps": 12,
  "latencySamples": 1673,
  "sourceSegmentCount": 1,
  "sourceHasNegativeSeek": false,
  "decoder": {
    "sourceBytes": 667810,
    "sourceSha256": "f3a9f682e20b8e76097ec8650e255727f64f0502a121e4346dc147bb496c22c7",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 2958912,
    "pcmSha256": "fdd70d0d41b771159ddcf4864b3513227ce0dcf34b0553fe4b7b622c3671319c"
  }
} as const satisfies ContinuousSourceClockPlan;
