/** Generated from P046 real Chromium decode; alignment and listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P046AudioDomain = 'main' | 'wrong' | 'right' | 'sa';
export const P046_BROWSER_READBACK_SHA256 = "d90e3b417d465143ae80bdcc069d65f26bf9d7905df5dec0b92e5537d75fd3c2";
export const P046_MEASURED_BINDINGS = {
  "main": {
    "sourceBytes": 300040,
    "sourceSha256": "88c36312780026cfa4eeec99f23ab679350ca30c373844aad1cbaf92b74fca63",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1329408,
    "pcmSha256": "71b01ca54724c1f777cbc8dce40dbb5a88aab47a175f6fdeda815921b3c73c6c"
  },
  "wrong": {
    "sourceBytes": 7800,
    "sourceSha256": "c68f7f5191785be6289ed21bbc76fc61e4c39363cd1d16c6c680b712ab7afd52",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 34560,
    "pcmSha256": "5e550ef7f074a5d369e3fa4b64948c8e9a2d32f0842c1bb72b1eba8b7d996a47"
  },
  "right": {
    "sourceBytes": 7800,
    "sourceSha256": "8b843d72ae1de52bef4e2b22e65f6356f97dd115d8795bf9b3df69d87c3d16e7",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 34560,
    "pcmSha256": "bd495abdbe58cd1a1a757f388776f36c033b16e6626279deeb5f79625513c24a"
  },
  "sa": {
    "sourceBytes": 350784,
    "sourceSha256": "de3c127ba68d082b9a296fb17cb31a72f477f460fde01b8e3370402bb414f18e",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 1202688,
    "pcmSha256": "e6616a5db31dbde83ff0e21a31554db607f4199d5f6dc35fefb37b54a45b6532"
  }
} as const satisfies Record<P046AudioDomain, DecodedSourceStreamBinding>;
