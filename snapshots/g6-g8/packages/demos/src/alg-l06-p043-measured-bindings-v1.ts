/** P043 Chrome 154 decode-only binding. No playback, listening, or
 * source frame alignment was measured by this receipt. */
import type {DecodedSourceStreamBinding}
  from './decoded-source-stream-transport';

export type P043MeasuredDomainId = 'main' | 'wrong4' | 'right4' | 'sa';
export const P043_BROWSER_READBACK_SHA256 =
  '08a75daa2be509547e60b8e0eeba6812f4e15ef5ab30bc79857bc58913119f92' as const;
export const P043_SOURCE_AUDIO_RECEIPT_SHA256 =
  '88af856e8217453acee4c5705b145b0b9f6476219fe10f09bf79667a2f635202' as const;

export const P043_MEASURED_BINDINGS = {
  main: {sourceSha256: '17a8fab7576e0216bf6ed390f6e61769d0f01554433d85e7c9b8bea01f133255',
    sourceBytes: 95290, sampleRate: 22050, channels: 1, decodedSamples: 422208,
    pcmSha256: '25dd1889ecc377da9b68f94a98ce2b2f812410608826edd6ad34a281c43a9db4'},
  wrong4: {sourceSha256: '5bfd44f657eb1ee276cbae924e79bf448bfb0e6d7bef7515164118f295726f4d',
    sourceBytes: 11570, sampleRate: 22050, channels: 1, decodedSamples: 51264,
    pcmSha256: 'ab64d27b1e56c2e2556cf7d502bc5b51d75a9400e948d51aef4e0ec1a9949870'},
  right4: {sourceSha256: '70f9eeb16521b9fe8c12f243af3c99482c185a39dab38b226eb3801ed204290b',
    sourceBytes: 11960, sampleRate: 22050, channels: 1, decodedSamples: 52992,
    pcmSha256: '51c955eeeea72cb4f68a8c38e5e60efd27a64640bc12e422d0e587034697899e'},
  sa: {sourceSha256: 'dfd986d3c9d1615b2456c5a9b5ebc2d24ab3b5d22f1b1d6f20df9aa886fcadf1',
    sourceBytes: 151200, sampleRate: 48000, channels: 1, decodedSamples: 518400,
    pcmSha256: '7196264fdda847d3a97d44a9adcc00e0be610dda38dc27958451f2f902afacb9'},
} as const satisfies Record<P043MeasuredDomainId, DecodedSourceStreamBinding>;

export const P043_BINDING_EVIDENCE = {
  browser: 'HeadlessChrome/154.0.0.0',
  decodeOnly: true, playbackAccepted: false, listeningAccepted: false,
  sourceFrameAlignmentAccepted: false, lessonCompleted: false,
} as const;
