/** Generated from P048 real Chromium decode; alignment and listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P048AudioDomain = 'main' | 'wrong4' | 'right4' | 'sa';
export const P048_BROWSER_READBACK_SHA256 = "92a956f0d5802a0fcdc00c7f7a97d7fd2737c3741d373a12ac135fc34e97689d";
export const P048_MEASURED_BINDINGS = {
  "main": {
    "sourceBytes": 130910,
    "sourceSha256": "e4d9a1110c982abaeb68c18203d0ea58a855a5260273a7ca896b1bb447f53429",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 580032,
    "pcmSha256": "37639e9e023fd42c86900c4530f27f62a178d1a9cce94e3ab68363876957d7b2"
  },
  "wrong4": {
    "sourceBytes": 11960,
    "sourceSha256": "2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 52992,
    "pcmSha256": "ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7"
  },
  "right4": {
    "sourceBytes": 9880,
    "sourceSha256": "105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 43776,
    "pcmSha256": "a5c518c0c8a50a92bc5318ebc7226780ac2088313d86a5f3719673067f62c6c9"
  },
  "sa": {
    "sourceBytes": 192528,
    "sourceSha256": "b76a62e5c4af35ab3ba277c2e186bf2d148a319b63c8fe9a9f954ae15057e5fd",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 660096,
    "pcmSha256": "493cbf6cba0d3c8163037868dceb6471a5ff1e87abc2c1ab1e398eb6ed5119b8"
  }
} as const satisfies Record<P048AudioDomain, DecodedSourceStreamBinding>;
