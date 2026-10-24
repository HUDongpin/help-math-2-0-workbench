'use client';

import predecessor from './g678-alg-l06-p002-v2';

const ID = 'shared-alg001-l06-p002';
const SOURCE_SHA256 = '15578b29985566e60245259470926550a22f31435bc56e5bd3d2a739e4588bb5';
export const P002_PCM_CHROME149 = '039068574f980a0b164d3439c697bd8f8fe1c9b4fa3f39e54f382a271ee3e087';
export const P002_PCM_CHROME153 = '635a80ec488a5f5b15a07f4d037dfbdcd8e24f5abeff0328b46e5669c43a6593';

/** Exact browser profile only; transport still rejects any unexpected decoded bytes. */
export function p002DecodedPcmForUserAgent(userAgent: string): string {
  return /\bChrome\/153(?:\.|\b)/u.test(userAgent) ? P002_PCM_CHROME153 : P002_PCM_CHROME149;
}

const original = predecessor.privateTerminalSource;
if (predecessor.key !== ID || original.PLAN.decoder.sourceSha256 !== SOURCE_SHA256 ||
    original.PLAN.decoder.sourceBytes !== 347360 || original.PLAN.decoder.sampleRate !== 22050 ||
    original.PLAN.decoder.channels !== 1 || original.PLAN.decoder.decodedSamples !== 1539072 ||
    original.PLAN.decoder.pcmSha256 !== P002_PCM_CHROME149) {
  throw Error('P002_DECODER_SUCCESSOR_INVALID: predecessor identity');
}

const selectedPcmSha256 = p002DecodedPcmForUserAgent(
  typeof navigator === 'undefined' ? '' : navigator.userAgent,
);
const PLAN = Object.freeze({...original.PLAN,
  decoder: Object.freeze({...original.PLAN.decoder, pcmSha256: selectedPcmSha256}),
});

export default Object.freeze({...predecessor,
  privateTerminalSource: Object.freeze({...original, PLAN}),
});
