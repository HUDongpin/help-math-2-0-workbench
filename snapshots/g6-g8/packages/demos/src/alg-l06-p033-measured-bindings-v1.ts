/** Generated from pinned P033 source blocks and measured Chromium PCM. No listening/alignment acceptance. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P033_AUDIO_READBACK_SHA256="dc0eeb030f6d7e0606434f14a31110c72dda777b3ee7efdea5b1f9f4bf08c861";
export const P033_MEASURED_BINDINGS={
  "46": {
    "sourceBytes": 11960,
    "sourceSha256": "70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "51c955eeeea72cb4f68a8c38e5e60efd27a64640bc12e422d0e587034697899e"
  },
  "78": {
    "sourceBytes": 9880,
    "sourceSha256": "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 43776,
    "pcmSha256": "a5c518c0c8a50a92bc5318ebc7226780ac2088313d86a5f3719673067f62c6c9"
  },
  "111": {
    "sourceBytes": 11050,
    "sourceSha256": "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "8e4fd4dd0e773d7cfb8497eae8d70216c4297524a6e63fe50bd0b99df60e125d"
  },
  "119": {
    "sourceBytes": 10660,
    "sourceSha256": "18e52976f77c535c485dccc2c41a17b63a651044748593990b355cee29b01aec",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 47232,
    "pcmSha256": "8d5cbb05db788f27b436d96245e9819642a780518492ddd14a165d0ea72b95bd"
  },
  "147": {
    "sourceBytes": 11960,
    "sourceSha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7"
  },
  "161": {
    "sourceBytes": 11570,
    "sourceSha256": "5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "ab64d27b1e56c2e2556cf7d502bc5b51d75a9400e948d51aef4e0ec1a9949870"
  },
  "175": {
    "sourceBytes": 10270,
    "sourceSha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 45504,
    "pcmSha256": "9177b19a275f4fcb880f2e913877e2043f9d44114df440d114cc61d5346f92b5"
  },
  "main": {
    "sourceBytes": 159120,
    "sourceSha256": "a01d6d1bacd035202f16913d4c4fb390d1c907d99900471d825c01101e473080",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 705024,
    "pcmSha256": "c55d40e7aba6c5e0de7509871655a741f741e3fcade27394a00e2550c1297641"
  },
  "sa": {
    "sourceBytes": 173040,
    "sourceSha256": "172f4d7a8f90e4e3d98487048eae702fdd4debf6706248d705f5c5dc55008220",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 593280,
    "pcmSha256": "d255de16ecf6ad045846368f57e8b73289a342629af6bfb9eb07bcb89f7e9283"
  }
} as const satisfies Record<string,DecodedSourceStreamBinding>;
export const P033_AUDIO_CLOCKS={
  "46": {
    "spriteId": 46,
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
  "78": {
    "spriteId": 78,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 25,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "111": {
    "spriteId": 111,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "lastFrame": 27,
    "latencySamples": 1673,
    "decodedEntrySample": 3511,
    "trailingEmptyNegativeMarker": []
  },
  "119": {
    "spriteId": 119,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 27,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "147": {
    "spriteId": 147,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 31,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "161": {
    "spriteId": 161,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 29,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "175": {
    "spriteId": 175,
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
    "spriteId": 190,
    "firstAudioFrame": 2,
    "entryFrame": 1,
    "lastFrame": 385,
    "latencySamples": 1673,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  }
} as const;
export type P033AudioDomain=keyof typeof P033_MEASURED_BINDINGS;
export type P033EmbeddedDomain=keyof typeof P033_AUDIO_CLOCKS;
