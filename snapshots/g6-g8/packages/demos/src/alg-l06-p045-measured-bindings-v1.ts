/** P045 measured browser decode binding; frame alignment and listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export type P045MeasuredDomainId = 'main' | 'wrong4' | 'right4' | 'sa';
export const P045_BROWSER_READBACK_SHA256 = '5fc56a2122139f0215d14e69011e62960aef08a7a65abd52257f611a390795ea';
export const P045_SOURCE_AUDIO_RECEIPT_SHA256 = 'a781aaeb80edbf52fbb9601ef2e3440ba1bdb7ab71f46940c4e56ee8bba06ee7';
export const P045_MEASURED_BINDINGS = {
  main: {sourceSha256: '66fd95d752bed4d1e82df7e27a4278c429fe85078fe9af4e08b9b92ef6f66945', sourceBytes: 64610,
    sampleRate: 22050, channels: 1, decodedSamples: 286272,
    pcmSha256: '8355279b0506accfd524e5fee513336d10eace6a72949dad7e9fd0eab94fa7d1'},
  wrong4: {sourceSha256: '2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77', sourceBytes: 11960,
    sampleRate: 22050, channels: 1, decodedSamples: 52992,
    pcmSha256: 'ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7'},
  right4: {sourceSha256: '105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d', sourceBytes: 9880,
    sampleRate: 22050, channels: 1, decodedSamples: 43776,
    pcmSha256: 'a5c518c0c8a50a92bc5318ebc7226780ac2088313d86a5f3719673067f62c6c9'},
  sa: {sourceSha256: '99404ff17adb3498bf64c033a3063077f3dce961ca52dfc8074f8f84f33dc7e7', sourceBytes: 321216,
    sampleRate: 48000, channels: 1, decodedSamples: 1101312,
    pcmSha256: '1093e961fc4f0c0cdf889cc6c093cbb23caaf1bb75a1b2a2a728103b180f0353'},
} as const satisfies Record<P045MeasuredDomainId, DecodedSourceStreamBinding>;
export const P045_BINDING_EVIDENCE = {
  browser: 'HeadlessChrome/154.0.0.0', decodeOnly: true,
  playbackAccepted: false, listeningAccepted: false,
  sourceFrameAlignmentAccepted: false, lessonCompleted: false,
} as const;
