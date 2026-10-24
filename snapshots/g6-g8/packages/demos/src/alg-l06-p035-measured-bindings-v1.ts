/** Exact P035 HeadlessChrome 154 browser PCM, root-readback-bound; product asset hashes unchanged.
 * Decode identity only; playback, listening, and source-frame alignment remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P035MeasuredDomainId='main'|'sa'|80|95|126|154|195|207;
export const P035_BROWSER_READBACK_SHA256='23daff0c08ed1541b8e51885982fb57df411dc549487143faf57388f88bf538b' as const;
export const P035_SOURCE_PLAN_SHA256='853993d6729229b8698cf8a83f0018a112537d92281f9e6ea107276b1b92b605' as const;
export const P035_PCM_APPLICABILITY_SHA256='7beb613c7c48fd0017d811866ef4ad21c8c7743affe2b77c00567742d417ec8b' as const;
export const P035_MEASURED_BINDINGS={
  "80": {
    "sourceSha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541",
    "sourceBytes": 11570,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "ce78e46dacfbabe3385d5742485619f3985bb7df827bbd81b63e02925f4a1d1a"
  },
  "95": {
    "sourceSha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "0e40aaf4b85fa77a0541b47168997f54711e3bc4020e83bf8d1d4bb9bc53d14b"
  },
  "126": {
    "sourceSha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "5a615a63a611ee4fcfd7674654f49c3ce6ede152ba85865032ccbe031e34a3c3"
  },
  "154": {
    "sourceSha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "c87bccb6f3ba10fcfecc47e076d3ded26889c2305a153751c019b004e67d3394"
  },
  "195": {
    "sourceSha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "a17cbe9b778519df16a29b841daf1b06b61d1d64d31482a7771b8d8c830c1982"
  },
  "207": {
    "sourceSha256": "4b5db760a6ab8916c19422426bfc5a8980323ea280543a32f00f3e60a7f8a646",
    "sourceBytes": 12038,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 23922,
    "pcmSha256": "61acd6cd669ace2b163ac08e5d7a8eb1d1254c3424ad79ae062d5fb3a90d5c65"
  },
  "main": {
    "sourceSha256": "31769b5944c74d1246f2fea66f4da200c2e57de869ab63ac4293ea0ae87d36c0",
    "sourceBytes": 216320,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 958464,
    "pcmSha256": "81b6de453ba9c85a936494fdd883e2421744503406134eeaffcee8f05798ba75"
  },
  "sa": {
    "sourceSha256": "ca0d2121df287403e350e2f8812a755c3d5f43f6b13c2c84f8e205b286b8c79f",
    "sourceBytes": 130704,
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 448128,
    "pcmSha256": "423a6d9c594bc816f82d61885e5d42e0b7ac9ddb7fdd8cc8aff890cb3eb24a7e"
  }
} as const satisfies Record<P035MeasuredDomainId,DecodedSourceStreamBinding>;
export const P035_BROWSER_DECODE_EVIDENCE={browser:'HeadlessChrome/154.0.0.0',
 capturedAtUtc:'2026-10-01T07:28:29.804Z',
 source179Enabled:false,playbackAccepted:false,listeningAccepted:false,
 sourceFrameAlignmentAccepted:false,lessonCompleted:false} as const;
