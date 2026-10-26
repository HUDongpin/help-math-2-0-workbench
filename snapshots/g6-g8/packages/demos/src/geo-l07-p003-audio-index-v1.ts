import IR from './generated/geo001-l07-p003-display-ir-v2.json';

/** Four positive-block source runs. The gaps and frame-6 pre-roll are retained;
 * these sample offsets are structural evidence, not an approved playback clock. */
export const GEO_L07_P003_AUDIO_INDEX = Object.freeze({
  animationId: 'shared-geo001-l07-p003',
  sourceSwfSha256: 'd0e3c429a5cf15de8f89c0e627a51d990b2bfed8d532af3a84f559531b9a4deb',
  sourceMp3Sha256: '17b1d24e26ca2b225a421bdcaa1250a22a1f311b34d35e6b7880c4946a546e90',
  sampleRate: 22050,
  sourceFps: 12,
  declaredBlockSamples: 2061504,
  preRollFrame: 6,
  preRollSeekSamples: 1673,
  runs: Object.freeze([
    Object.freeze({firstFrame: 8, endFrame: 794, firstSample: 3510, lastSample: 1445555}),
    Object.freeze({firstFrame: 881, endFrame: 968, firstSample: 1447083, lastSample: 1605065}),
    Object.freeze({firstFrame: 986, endFrame: 1125, firstSample: 1606560, lastSample: 1860066}),
    Object.freeze({firstFrame: 1166, endFrame: 1275, firstSample: 1861764, lastSample: 2060160}),
  ]),
  originalHostBindingVerified: false,
  sourceSynchronizationAccepted: false,
  listeningAccepted: false,
} as const);

export function geoL07P003AudioAtFrame(frame: number): Readonly<{
  run: typeof GEO_L07_P003_AUDIO_INDEX.runs[number];
  sourceBlockSampleOffset: number;
}> | null {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 1274) {
    throw Error('GEO_L07_P003_AUDIO_FRAME_OUT_OF_RANGE');
  }
  const run = GEO_L07_P003_AUDIO_INDEX.runs.find(item =>
    frame >= item.firstFrame && frame < item.endFrame);
  if (!run) return null;
  return Object.freeze({run,
    sourceBlockSampleOffset: run.firstSample +
      (frame - run.firstFrame) * 1837});
}

if (IR.animationId !== GEO_L07_P003_AUDIO_INDEX.animationId ||
    IR.sourceSwfSha256 !== GEO_L07_P003_AUDIO_INDEX.sourceSwfSha256 ||
    IR.embeddedMp3Sha256 !== GEO_L07_P003_AUDIO_INDEX.sourceMp3Sha256 ||
    IR.soundBlocks.length !== 1126 || IR.mainFrameCount !== 1274 || IR.fps !== 12 ||
    IR.soundBlocks[0]?.frame !== 6 || IR.soundBlocks[0].sampleCount !== 3456 ||
    IR.soundBlocks[0].seekSamples !== 1673) {
  throw Error('GEO_L07_P003_AUDIO_SOURCE_DRIFT');
}
let before = 0;
for (const block of IR.soundBlocks) {
  const position = geoL07P003AudioAtFrame(block.frame);
  if (position) {
    if (block.sampleCount <= 0 ||
        before + block.seekSamples !== position.sourceBlockSampleOffset) {
      throw Error(`GEO_L07_P003_AUDIO_SEEK_DRIFT_${block.frame}`);
    }
  } else if (block.frame !== 6 && block.sampleCount !== 0) {
    throw Error(`GEO_L07_P003_AUDIO_RUN_DRIFT_${block.frame}`);
  }
  before += block.sampleCount;
}
if (before !== GEO_L07_P003_AUDIO_INDEX.declaredBlockSamples) {
  throw Error('GEO_L07_P003_AUDIO_LENGTH_DRIFT');
}
