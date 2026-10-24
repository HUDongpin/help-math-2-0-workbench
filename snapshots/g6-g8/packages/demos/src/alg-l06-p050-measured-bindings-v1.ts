/** Generated from P050 Chromium decode. Original timing and listening remain unaccepted. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P050AudioDomain = 'main' | 'wrong' | 'correct358' | 'correct432' | 'correct479' | 'sa';
export type P050EmbeddedDomain = Exclude<P050AudioDomain, 'sa'>;
export const P050_BROWSER_READBACK_SHA256 = "60dfdb82740a88b30388273b11eb788fe7810da397c61815fe3a1ff5f2a65857";
export const P050_MEASURED_BINDINGS = {
  "main": {
    "sourceBytes": 278070,
    "sourceSha256": "e507c0e9eda0e12349bab2db8f88d2ce3f943d397028c22c0714e38a04ba29e9",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1232064,
    "pcmSha256": "e185316803de09560bb7d44e905c043c8019c3e42fe093fdf6d5330879c8ff50"
  },
  "wrong": {
    "sourceBytes": 11050,
    "sourceSha256": "1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "2bfe49377ec1653752967eed3aa167f5dbab81cb9ef6ec86bb5ac53ce82c20c5"
  },
  "correct358": {
    "sourceBytes": 11570,
    "sourceSha256": "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "5f0d182f517e8cf4fb8f4af67ed46045fe2d18db4b2eea1fa55d2b71854f2f6d"
  },
  "correct432": {
    "sourceBytes": 11978,
    "sourceSha256": "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8",
    "sampleRate": 11025,
    "channels": 1,
    "decodedSamples": 11935,
    "pcmSha256": "79e4ccd4998d79ef463ef12c18c70b2e76cb12393ff50092a0056e77761cfb0e"
  },
  "correct479": {
    "sourceBytes": 11050,
    "sourceSha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "a17cbe9b778519df16a29b841daf1b06b61d1d64d31482a7771b8d8c830c1982"
  },
  "sa": {
    "sourceBytes": 629664,
    "sourceSha256": "518d91f553c9ecf52f2a2eb1228a7193e1b2230a6357df382314a7d94c78583b",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 2158848,
    "pcmSha256": "faffe45515992349504a1eb54f1233277ab1aadb6de4f393b1c3db09a889ee3a"
  }
} as const satisfies Record<P050AudioDomain, DecodedSourceStreamBinding>;
export const P050_AUDIO_CLOCKS = {
  "main": {
    "spriteId": 489,
    "firstAudioFrame": 4,
    "entryFrame": 1,
    "decodedEntrySample": 0,
    "entryAuthority": "nominal-12fps-onset-on-decoded-stream",
    "mp3SeekAndLatencyAligned": false,
    "originalRuntimeAccepted": false
  },
  "wrong": {
    "spriteId": 380,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "decodedEntrySample": 0,
    "entryAuthority": "nominal-12fps-onset-on-decoded-stream",
    "mp3SeekAndLatencyAligned": false,
    "originalRuntimeAccepted": false
  },
  "correct358": {
    "spriteId": 358,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "decodedEntrySample": 1838,
    "entryAuthority": "nominal-12fps-onset-on-decoded-stream",
    "mp3SeekAndLatencyAligned": false,
    "originalRuntimeAccepted": false
  },
  "correct432": {
    "spriteId": 432,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "decodedEntrySample": 919,
    "entryAuthority": "source-ADPCM-block-boundary-on-browser-sample-grid",
    "mp3SeekAndLatencyAligned": false,
    "originalRuntimeAccepted": false
  },
  "correct479": {
    "spriteId": 479,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "decodedEntrySample": 0,
    "entryAuthority": "nominal-12fps-onset-on-decoded-stream",
    "mp3SeekAndLatencyAligned": false,
    "originalRuntimeAccepted": false
  }
} as const;
