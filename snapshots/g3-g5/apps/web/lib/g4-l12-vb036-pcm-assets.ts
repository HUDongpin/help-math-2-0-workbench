/** Fixed untrimmed source PCM custody, not an original-runtime timing decision. */
export const VB036_PCM_ASSETS = Object.freeze([
  Object.freeze({"stream":"0001","frameDomain":"sprite-51","firstFrame":1,"lastFrame":5,"bytes":17324,"sha256":"c6064d11dd434b655d37ce4caef600bce2bf738db512445fc435ee0fee8f1afe","sampleFrames":8640,"pcmSha256":"9a013bc95969e2d4c1726df02eebc0ea7710f84e68e32c3d01d48095dd52001e"}),
  Object.freeze({"stream":"0002","frameDomain":"sprite-57","firstFrame":3,"lastFrame":31,"bytes":106028,"sha256":"0dc4514f641e3e17a99610a6bcfd9c4d123a6f4fd20b79acc8e14613abc9757f","sampleFrames":52992,"pcmSha256":"95fe62d0e44e74b219c3bdb764c76c7914e6acbca207129cff510e1c306a4497"}),
  Object.freeze({"stream":"0003","frameDomain":"sprite-85","firstFrame":2,"lastFrame":28,"bytes":97964,"sha256":"c1f75dccc58cd09fc6e0fe237524d2c507a000e4a6bb08596eaf2a22ea102998","sampleFrames":48960,"pcmSha256":"6e3d37c02ec95b20a45ec7d0ac3ef50136dcc49cb1b2efe8e006afce4279dc4c"}),
  Object.freeze({"stream":"0004","frameDomain":"sprite-96","firstFrame":2,"lastFrame":28,"bytes":97964,"sha256":"fee75e8adc79b4459d362bffdcd8c8f49296b8eb5306201b5920b6f5d7b86269","sampleFrames":48960,"pcmSha256":"21fcb950e93fcedf8a6eef48cff7eb6527334f78797395fa3cea6ee1213c51d6"}),
  Object.freeze({"stream":"0005","frameDomain":"sprite-108","firstFrame":2,"lastFrame":31,"bytes":106028,"sha256":"196586b129041f2547a6e4b98722c0d3b4646bd9a7653d98ca5aa62318c58b99","sampleFrames":52992,"pcmSha256":"199317b0694a6802f6b77e7abf588c849c620a1f6491e2493db60907c8e0902a"}),
  Object.freeze({"stream":"0006","frameDomain":"sprite-134","firstFrame":2,"lastFrame":31,"bytes":106028,"sha256":"fcc122e2946071bbfa38a8f1287d37dc311237219176671539bb0bae6b831971","sampleFrames":52992,"pcmSha256":"d6e2f0ec780c12d2063186a4694ee94c1fc24672d92e65c7aefd9ad2e4ed11cb"}),
  Object.freeze({"stream":"0007","frameDomain":"sprite-151","firstFrame":2,"lastFrame":28,"bytes":97964,"sha256":"c48a7dad4531859ca1e02d50185557d22fbd7c043bf1b9d67b8d6df9897e427b","sampleFrames":48960,"pcmSha256":"b50bb1854af429c0b22f913d851b5ad967247bca21410ebff6f51d221301559f"}),
  Object.freeze({"stream":"0008","frameDomain":"sprite-172","firstFrame":3,"lastFrame":33,"bytes":112940,"sha256":"0a81192d4e2b00f0b33d4b1badc6e38c631d98b8bfd9ab19ac3d7a9134b37fc7","sampleFrames":56448,"pcmSha256":"9f99e49c4f40c3ea3b486482632b13ebb5f48fd9491fe8e87753cba0e15e0f24"}),
  Object.freeze({"stream":"0009","frameDomain":"sprite-184","firstFrame":1,"lastFrame":28,"bytes":102572,"sha256":"02a4c553dea9e88cb9299cecf343f015fd7b02080d00575d59e9cc954b3d4dc3","sampleFrames":51264,"pcmSha256":"de07aa9f508bb426f56fde9e7f97ac3f5e37c37c30e31ad0b11805b291a5754e"}),
  Object.freeze({"stream":"0010","frameDomain":"sprite-215","firstFrame":2,"lastFrame":26,"bytes":91052,"sha256":"c477bdb734e85c1d7f2ba8809b5bf3703d7735ae86394269623f207c042004c0","sampleFrames":45504,"pcmSha256":"b5615dad877db1b0a08bcec349e74dff097e345ccc0e7267d7665f91922d39ba"}),
  Object.freeze({"stream":"0011","frameDomain":"sprite-216","firstFrame":9,"lastFrame":82,"bytes":270764,"sha256":"5dbda3995411e95084f9819e91460e19b76720751fe5ef0b54cf7f9204ab3f76","sampleFrames":135360,"pcmSha256":"9eef4f8b2661758b5b64ccbcfb931ac812cbeeb7e09233b98fb0ed543c425a87"}),
] as const);
export type Vb036PcmStream = typeof VB036_PCM_ASSETS[number]['stream'];
export function vb036PcmAsset(stream: Vb036PcmStream) {
  const asset = VB036_PCM_ASSETS.find((candidate) => candidate.stream === stream);
  if (!asset) throw new Error('Unknown VB036 PCM stream.');
  return asset;
}
export function vb036PcmUrl(stream: Vb036PcmStream) {
  return `/flash-assets/current-js-audio-calibration-v1/course-g04-l12-vb-036/source-pcm/${stream}?sha256=${vb036PcmAsset(stream).sha256}`;
}

/** Snapshot then verify the exact s16le container; no browser decoder, trim or resampling. */
export async function decodeVb036PrivatePcm(stream: Vb036PcmStream, input: ArrayBuffer): Promise<Float32Array> {
  const asset = vb036PcmAsset(stream);
  if (!(input instanceof ArrayBuffer) || input.byteLength !== asset.bytes) throw new Error('VB036 PCM length differs.');
  const copy = input.slice(0), view = new DataView(copy), raw = new Uint8Array(copy);
  const ascii = (start: number, end: number) => String.fromCharCode(...raw.subarray(start, end));
  if (ascii(0, 4) !== 'RIFF' || view.getUint32(4, true) !== asset.bytes - 8 ||
    ascii(8, 16) !== 'WAVEfmt ' || view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== 22_050 || view.getUint32(28, true) !== 44_100 ||
    view.getUint16(32, true) !== 2 || view.getUint16(34, true) !== 16 ||
    ascii(36, 40) !== 'data' || view.getUint32(40, true) !== asset.sampleFrames * 2) {
    throw new Error('VB036 PCM header differs.');
  }
  if (!globalThis.crypto?.subtle) throw new Error('VB036 PCM requires WebCrypto SHA-256.');
  const hash = await crypto.subtle.digest('SHA-256', copy);
  if (Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('') !== asset.sha256) {
    throw new Error('VB036 PCM SHA-256 differs.');
  }
  const samples = new Float32Array(asset.sampleFrames);
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(44 + i * 2, true) / 32768;
  return samples;
}
