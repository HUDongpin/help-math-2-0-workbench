/** P044 Chrome 154 decode-only binding. No playback, listening, or
 * source frame alignment was measured by this receipt. */
import type {DecodedSourceStreamBinding}
  from './decoded-source-stream-transport';

export type P044MeasuredDomainId = 'main' | 'wrong4' | 'right4' | 'sa';
export const P044_BROWSER_READBACK_SHA256 =
  '022e0baef5caeac5ad4977329ca59f796af502ceca023209d8e48db12b74db6f' as const;
export const P044_SOURCE_AUDIO_RECEIPT_SHA256 =
  'a2312e72fc21a39be0d35f3ca8b5f862f33a240225d8436c2a26d8f3e5922ca9' as const;

export const P044_MEASURED_BINDINGS = {
  main: {sourceSha256: 'c6d5547cf28092293ec207a1c12a7031076af13a59de7b9c09e0ecf4fa3eb959',
    sourceBytes: 109330, sampleRate: 22050, channels: 1, decodedSamples: 484416,
    pcmSha256: '50588446d147e1b2c4cf38b3f297c72ea7203214ac8922425d81390d4aa08af2'},
  wrong4: {sourceSha256: '1421b1c2ed818b79f66f9d94530176299e8ebfaff946ccbb0e851cec9d72234e',
    sourceBytes: 10270, sampleRate: 22050, channels: 1, decodedSamples: 45504,
    pcmSha256: '9177b19a275f4fcb880f2e913877e2043f9d44114df440d114cc61d5346f92b5'},
  right4: {sourceSha256: '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b',
    sourceBytes: 11960, sampleRate: 22050, channels: 1, decodedSamples: 52992,
    pcmSha256: '51c955eeeea72cb4f68a8c38e5e60efd27a64640bc12e422d0e587034697899e'},
  sa: {sourceSha256: '11784e80c090326e9d4f2863ae54d1bcd25d454a4e325d76516f415e377e3abb',
    sourceBytes: 258384, sampleRate: 48000, channels: 1, decodedSamples: 885888,
    pcmSha256: '0960de241dda3d89bd19210fc0219722ac0655b5544680288e35edddc1f04e63'},
} as const satisfies Record<P044MeasuredDomainId, DecodedSourceStreamBinding>;

export const P044_BINDING_EVIDENCE = {
  browser: 'HeadlessChrome/154.0.0.0',
  decodeOnly: true, playbackAccepted: false, listeningAccepted: false,
  sourceFrameAlignmentAccepted: false, lessonCompleted: false,
} as const;
