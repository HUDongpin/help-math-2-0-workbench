/** Generated from P058 source blocks and real Chromium PCM; alignment/listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P058_AUDIO_READBACK_SHA256="f319546c50c2001f8e3a8b3f5d6b2f2e66de65d99c2f85a7970d84b67a65b557";
export const P058_MEASURED_BINDINGS={
  "36": {
    "sourceBytes": 11570,
    "sourceSha256": "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "5f0d182f517e8cf4fb8f4af67ed46045fe2d18db4b2eea1fa55d2b71854f2f6d"
  },
  "62": {
    "sourceBytes": 11960,
    "sourceSha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "51c955eeeea72cb4f68a8c38e5e60efd27a64640bc12e422d0e587034697899e"
  },
  "76": {
    "sourceBytes": 12350,
    "sourceSha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 54720,
    "pcmSha256": "0fb59d5bfdaf6bed4c9cb6dc878c3c16760741efa44a394570dae7c6f3a3ff17"
  },
  "97": {
    "sourceBytes": 12740,
    "sourceSha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 56448,
    "pcmSha256": "2c0f627aca7dca65b77b1391a6f2ec4ab3fad676f00cf7b42cd32f5292715690"
  },
  "115": {
    "sourceBytes": 11050,
    "sourceSha256": "1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "2bfe49377ec1653752967eed3aa167f5dbab81cb9ef6ec86bb5ac53ce82c20c5"
  },
  "129": {
    "sourceBytes": 11960,
    "sourceSha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7"
  },
  "140": {
    "sourceBytes": 11570,
    "sourceSha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "ab64d27b1e56c2e2556cf7d502bc5b51d75a9400e948d51aef4e0ec1a9949870"
  },
  "main": {
    "sourceBytes": 388440,
    "sourceSha256": "3022c056730f1c3fb187a38153647fd0610272fdea02360f006ef05cf156001d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1721088,
    "pcmSha256": "31d4cd6bb89b53ab1f4e0907e156e6dace505f8c6e9092ce8a2cef7110db815b"
  },
  "sa": {
    "sourceBytes": 167328,
    "sourceSha256": "5e3fa2f4bfc3c534102315ec592c9547b667fb5d19198f2d653a3c9768636c7a",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 573696,
    "pcmSha256": "82632b10c81465c9b5d6760b08233a9bab1faed668458f1a555c87f1d525c1b6"
  }
} as const satisfies Record<string,DecodedSourceStreamBinding>;
export const P058_AUDIO_CLOCKS={
  "36": {
    "spriteId": 36,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 3511,
    "trailingEmptyNegativeMarker": []
  },
  "62": {
    "spriteId": 62,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 31,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 31,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -1953
      }
    ]
  },
  "76": {
    "spriteId": 76,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 32,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "97": {
    "spriteId": 97,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 33,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "115": {
    "spriteId": 115,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "129": {
    "spriteId": 129,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 31,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "140": {
    "spriteId": 140,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 29,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "main": {
    "spriteId": 285,
    "firstAudioFrame": 14,
    "entryFrame": 1,
    "lastFrame": 951,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 951,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -1853
      }
    ]
  }
} as const;
export type P058AudioDomain=keyof typeof P058_MEASURED_BINDINGS;
export type P058EmbeddedDomain=keyof typeof P058_AUDIO_CLOCKS;
