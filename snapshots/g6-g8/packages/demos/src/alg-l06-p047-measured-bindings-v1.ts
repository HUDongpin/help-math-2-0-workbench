/** Generated from P047 real Chromium decode; alignment and listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P047AudioDomain = 'main' | 'wrong' | 'right' | 'sa';
export const P047_BROWSER_READBACK_SHA256 = "26b1b73859dd3d9f4780b0135ea5cb70bd6fedbb3a22efc6101233f17c9157c7";
export const P047_MEASURED_BINDINGS = {
  "main": {
    "sourceBytes": 361010,
    "sourceSha256": "7e1c08794833b98d90b61b44ec4522f9970db4e24d7654d24202ba2a8fe314b8",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1599552,
    "pcmSha256": "8845dd93a57766ac86a8d34b09bd042fc01ba16796220d522e7a4f6a9062efc0"
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
    "sourceBytes": 196560,
    "sourceSha256": "88e7c0f01e0569f5c8c828561669c87b4e468dbd218deca399db09bdb418448e",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 673920,
    "pcmSha256": "f81f9d6aa59238dc69c4aa2721207f5d9494e3b95f6e591b8be8e61686a2dc3b"
  }
} as const satisfies Record<P047AudioDomain, DecodedSourceStreamBinding>;
