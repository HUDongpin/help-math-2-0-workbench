import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';

// Exact Chrome 156 source decodes, each reproduced twice on 2026-10-23.
// Evidence: work/hfr-typescript/alg-l06-technical-20261023-01a168f4/decoder-profiles.
// This selects an expected digest; the transport still hashes all decoded PCM.
const CHROME_156_PROFILES = Object.freeze([
  {
    "sourceSha256": "15578b29985566e60245259470926550a22f31435bc56e5bd3d2a739e4588bb5",
    "sourceBytes": 347360,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1539072,
    "predecessorPcmSha256": "039068574f980a0b164d3439c697bd8f8fe1c9b4fa3f39e54f382a271ee3e087",
    "pcmSha256": "635a80ec488a5f5b15a07f4d037dfbdcd8e24f5abeff0328b46e5669c43a6593"
  },
  {
    "sourceSha256": "bf6cbc0d490526ed4dec3b7566204cb22057a09a37be6fbe61d2367143caaaad",
    "sourceBytes": 78260,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 346752,
    "predecessorPcmSha256": "fa46206bcba3c6ad8edb38739a0c84ee791058c126eed5fdc7064834a2083eb9",
    "pcmSha256": "d7dfc9dcd175f32857debb33ca6279df7be3497115c6defa97cb7d935747df7a"
  }
] as const);
export function resolveMeasuredSourceDecoderProfile(
  binding: DecodedSourceStreamBinding,
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): DecodedSourceStreamBinding {
  if (!/(?:^|\s)(?:HeadlessChrome|Chrome)\/156(?:\.|\b)/u.test(userAgent)) return binding;
  const profile = CHROME_156_PROFILES.find(row => row.sourceSha256 === binding.sourceSha256
    && row.sourceBytes === binding.sourceBytes && row.sampleRate === binding.sampleRate
    && row.channels === binding.channels && row.decodedSamples === binding.decodedSamples
    && (binding.pcmSha256 === row.predecessorPcmSha256 || binding.pcmSha256 === row.pcmSha256));
  return profile ? Object.freeze({...binding, pcmSha256: profile.pcmSha256}) : binding;
}
