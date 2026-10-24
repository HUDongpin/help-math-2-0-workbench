/** Generated from pinned P056 blocks and measured Chromium PCM. No listening/alignment acceptance. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P056_AUDIO_READBACK_SHA256="06c53a730193a47fe95545f2d6547e7d938e45dc6198b7921fbc471eea05a5b2";
export const P056_MEASURED_BINDINGS={
  "51": {
    "sourceBytes": 11960,
    "sourceSha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "51c955eeeea72cb4f68a8c38e5e60efd27a64640bc12e422d0e587034697899e"
  },
  "83": {
    "sourceBytes": 11856,
    "sourceSha256": "113258636df75e97cc83ceb37ed3f476453cf091834633480aaa6ebe63fd5875",
    "sampleRate": 22050,
    "channels": 2,
    "decodedSamples": 43776,
    "pcmSha256": "95f35cc29564214544e05bf3253ecf6698c24842f966b42bcc00c5618fc8d088"
  },
  "116": {
    "sourceBytes": 13260,
    "sourceSha256": "a8ec01f96883b993809fda76e339cfbb1ce72b40e7ac16b747f9f8139519aab8",
    "sampleRate": 22050,
    "channels": 2,
    "decodedSamples": 48960,
    "pcmSha256": "ece7bd370bb29027318ba4f4f82bd8876af1cb88abc725033599b1f7c5a9a2e9"
  },
  "124": {
    "sourceBytes": 10660,
    "sourceSha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 47232,
    "pcmSha256": "8d5cbb05db788f27b436d96245e9819642a780518492ddd14a165d0ea72b95bd"
  },
  "138": {
    "sourceBytes": 11960,
    "sourceSha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7"
  },
  "149": {
    "sourceBytes": 11570,
    "sourceSha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "ab64d27b1e56c2e2556cf7d502bc5b51d75a9400e948d51aef4e0ec1a9949870"
  },
  "160": {
    "sourceBytes": 10270,
    "sourceSha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 45504,
    "pcmSha256": "9177b19a275f4fcb880f2e913877e2043f9d44114df440d114cc61d5346f92b5"
  },
  "main": {
    "sourceBytes": 332800,
    "sourceSha256": "c71440d35758c445e2d6ea61ee963fbe347f2f666efa5ec41fc91bbe32774f32",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1474560,
    "pcmSha256": "ae6d6b0c03202d9477a434dc4dcafe74df38177ea86da2d722e0bbbbf4cf27cd"
  },
  "sa": {
    "sourceBytes": 109536,
    "sourceSha256": "5cc8952addd8da05969c88bee6c1f2563a968056ac787d2cd7a7070e4434ceec",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 375552,
    "pcmSha256": "3d4078bcfedcffb7aa79bf2a6973612223a1aad51ac8d36c14b6d7a11ec7947b"
  }
} as const satisfies Record<string,DecodedSourceStreamBinding>;
export const P056_AUDIO_CLOCKS={
  "51": {
    "spriteId": 51,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 31,
    "latencySamples": 1673,
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
  "83": {
    "spriteId": 83,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 25,
    "latencySamples": 1674,
    "decodedEntrySample": 1674,
    "trailingEmptyNegativeMarker": []
  },
  "116": {
    "spriteId": 116,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "lastFrame": 27,
    "latencySamples": 1674,
    "decodedEntrySample": 3512,
    "trailingEmptyNegativeMarker": []
  },
  "124": {
    "spriteId": 124,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 27,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "138": {
    "spriteId": 138,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 31,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "149": {
    "spriteId": 149,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 29,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "160": {
    "spriteId": 160,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 27,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -2093
      }
    ]
  },
  "main": {
    "spriteId": 305,
    "firstAudioFrame": 14,
    "entryFrame": 1,
    "lastFrame": 818,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 817,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -2223
      }
    ]
  }
} as const;
export type P056AudioDomain=keyof typeof P056_MEASURED_BINDINGS;
export type P056EmbeddedDomain=keyof typeof P056_AUDIO_CLOCKS;
