/** P041 exact HeadlessChrome 154 PCM bindings; decode identity only.
 * The source-frame clock IR is separate and Flash AV alignment is unresolved. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P041MeasuredDomainId='main'|'sa'|'76'|'91'|'105'|'119'|'139'|'152'|'168';
export const P041_BROWSER_READBACK_SHA256='515ef9430250e61f43273bcddec382eda033f8c8fa9ee25ed763fbeecfceffa7' as const;
export const P041_SOURCE_AUDIO_PLAN_SHA256='60a80bc27858e02b7c5bf4d4f04c89aecb0b0cbc27cd1b554f1b859aeb2f3dc5' as const;
export const P041_SOURCE_FRAME_LEDGER_SHA256='57c5a6799468e8506df81f7887cef4d9ed7bdc58561c134e09e520042940f7a4' as const;
export const P041_MEASURED_BINDINGS={
  "76": {
    "sourceSha256": "1c3e481dcaa018b19c5b24eaa05b11d88e7cb75a640acd8a06133ccf3ff0c7e5",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "2bfe49377ec1653752967eed3aa167f5dbab81cb9ef6ec86bb5ac53ce82c20c5"
  },
  "91": {
    "sourceSha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "0e40aaf4b85fa77a0541b47168997f54711e3bc4020e83bf8d1d4bb9bc53d14b"
  },
  "105": {
    "sourceSha256": "1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e",
    "sourceBytes": 10270,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 45504,
    "pcmSha256": "9177b19a275f4fcb880f2e913877e2043f9d44114df440d114cc61d5346f92b5"
  },
  "119": {
    "sourceSha256": "7e9810de5390cdc982dac2795e046343157a6ad9fe4a2ab13e1020b401b2ad11",
    "sourceBytes": 12350,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 54720,
    "pcmSha256": "0fb59d5bfdaf6bed4c9cb6dc878c3c16760741efa44a394570dae7c6f3a3ff17"
  },
  "139": {
    "sourceSha256": "c9502f3d979684587046242dc9022b8aa89e89c72688dfa4bc027858badd9e6e",
    "sourceBytes": 12740,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 56448,
    "pcmSha256": "2c0f627aca7dca65b77b1391a6f2ec4ab3fad676f00cf7b42cd32f5292715690"
  },
  "152": {
    "sourceSha256": "ede0affb88cb9c7d0378514ff027a74e843f5f1cbac3f751820392dd9420d9e8",
    "sourceBytes": 11570,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "5f0d182f517e8cf4fb8f4af67ed46045fe2d18db4b2eea1fa55d2b71854f2f6d"
  },
  "168": {
    "sourceSha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "sourceBytes": 11050,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "a17cbe9b778519df16a29b841daf1b06b61d1d64d31482a7771b8d8c830c1982"
  },
  "main": {
    "sourceSha256": "dc45649b1b0b20f1b6e5764a043a4ccaf8be2f0b7b37a79ff8fb1c4a3b55564e",
    "sourceBytes": 359710,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1593792,
    "pcmSha256": "95da91c60b4953da90e9110674c174a0ad9aa932aec6cbf76b023df681352a1f"
  },
  "sa": {
    "sourceSha256": "5154170c4922f481ae3921c3ed67554c16a430daae24ec77167ecf689f264f1b",
    "sourceBytes": 261408,
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 896256,
    "pcmSha256": "6e9db11fa6232bbc42341d87f6ab9f9efe3c9e7ecd8b1c7291b16aae685eccf3"
  }
} as const satisfies Record<P041MeasuredDomainId,DecodedSourceStreamBinding>;
export const P041_BINDING_EVIDENCE={browser:'HeadlessChrome/154.0.0.0',
 capturedAtUtc:'2026-10-01T16:06:38.387Z',
 playbackAccepted:false,listeningAccepted:false,sourceFrameAlignmentAccepted:false,lessonCompleted:false} as const;
