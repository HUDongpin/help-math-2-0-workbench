/** P042 Chrome 154 decode identity. Frame-to-sample and listening acceptance remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

export type P042MeasuredDomainId='main'|'wrong4'|'right4'|'sa';
export const P042_BROWSER_READBACK_SHA256=
  'aa200d0bfd280eef21ede8fc662247866553e59551a472a8cbb6dfe7fe8a852d' as const;
export const P042_SOURCE_AUDIO_SCHEDULE_SHA256=
  'd51318d9836296682ac15620469febfda2dc50605db7df819f738838d7a2967a' as const;
export const P042_MEASURED_BINDINGS={
  main:{sourceSha256:'c937ff7d5b4f9acb6c1f39a79454d821310307067f5034a7cccfcfa25a51006b',
    sourceBytes:161200,sampleRate:22050,channels:1,decodedSamples:714240,
    pcmSha256:'d45b2dea6b3d36656b331b33ae2ac4280d68b3215edf3d87208d305162f11138'},
  wrong4:{sourceSha256:'2f88e5ee5c496df615af35c8a53582961becbb4978948a48662cfb4a56485e77',
    sourceBytes:11960,sampleRate:22050,channels:1,decodedSamples:52992,
    pcmSha256:'ff10f6f4d65f8eb26cd8d0479135d9410c6ea298155e84a05225a35f8ebe8fa7'},
  right4:{sourceSha256:'105da94835aa6ae9fa8c8f149fdb28167ba1a2de31e842c7997e1a8557dc981d',
    sourceBytes:9880,sampleRate:22050,channels:1,decodedSamples:43776,
    pcmSha256:'a5c518c0c8a50a92bc5318ebc7226780ac2088313d86a5f3719673067f62c6c9'},
  sa:{sourceSha256:'1af6e25217490b60e3bce052a5e29f3be3d5ce932389a48de14bde0369603907',
    sourceBytes:239232,sampleRate:48000,channels:1,decodedSamples:820224,
    pcmSha256:'6158cd05362caadad06219f29ccb7521dc458bae1bc88175b7764cf69bacfab7'},
} as const satisfies Record<P042MeasuredDomainId,DecodedSourceStreamBinding>;

export const P042_BINDING_EVIDENCE={browser:'HeadlessChrome/154.0.0.0',
  playbackAccepted:false,listeningAccepted:false,sourceFrameAlignmentAccepted:false,
  lessonCompleted:false} as const;
