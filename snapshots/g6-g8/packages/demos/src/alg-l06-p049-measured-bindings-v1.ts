/** Generated from P049 real Chromium decode; alignment and listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P049AudioDomain = 'main' | 'wrong4' | 'right4' | 'sa';
export const P049_BROWSER_READBACK_SHA256 = "52d3e4662b83eb5561c3345b756c9db856de39a12be9016ebf580e8bf219fd81";
export const P049_MEASURED_BINDINGS = {
  "main": {
    "sourceBytes": 161590,
    "sourceSha256": "3641957aaae5efe149e318409f35c8de196dea06124a15df2abdb42fb5424b55",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 715968,
    "pcmSha256": "99a63366398db08a527ad6b27f2bf42a13433b772df2a0e6385297c7a34c5330"
  },
  "wrong4": {
    "sourceBytes": 11050,
    "sourceSha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "5a615a63a611ee4fcfd7674654f49c3ce6ede152ba85865032ccbe031e34a3c3"
  },
  "right4": {
    "sourceBytes": 11978,
    "sourceSha256": "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8",
    "sampleRate": 11025,
    "channels": 1,
    "decodedSamples": 11935,
    "pcmSha256": "79e4ccd4998d79ef463ef12c18c70b2e76cb12393ff50092a0056e77761cfb0e"
  },
  "sa": {
    "sourceBytes": 111888,
    "sourceSha256": "936b059a5355877c47f2bda90da6d4de47d7145371d97ef50cd9f1e267254150",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 383616,
    "pcmSha256": "922e04ef024225f72b1e3389bbabbe5fddf773cbf33ef1a178e7621934343425"
  }
} as const satisfies Record<P049AudioDomain, DecodedSourceStreamBinding>;
export const P049_RIGHT4_ENTRY = {
  "entryFrame": 2,
  "decodedSample": 919,
  "sourceRate": 5512,
  "skippedSourceSamples": 459,
  "sourceModelSha256": "8faf55033928e8449c96fe3a9c1a7504b7f119119f2f90a4f81d8caf309b11ff",
  "browserReceiptSha256": "52d3e4662b83eb5561c3345b756c9db856de39a12be9016ebf580e8bf219fd81",
  "resamplerPhaseVerified": false,
  "originalRuntimeAccepted": false,
  "listeningAccepted": false
} as const;
