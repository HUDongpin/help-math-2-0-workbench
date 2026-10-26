/** Source-block-boundary audio schedule for ALG001 L6 P003.
 * These are engineering coordinates, not original-runtime or listening acceptance. */
export const ALG_L06_P003_SOURCE_AUDIO = Object.freeze({
  version: 1,
  animationId: 'shared-alg001-l06-p003',
  sourceSwfSha256: 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766',
  frameDomain: 'sprite-154',
  fps: 12,
  firstFrame: 1,
  lastFrame: 719,
  sampleRate: 22050,
  measuredDecoderUserAgent: 'HeadlessChrome/153.0.0.0',
  gap: {firstFrame: 502, lastFrame: 543},
  runs: [
    {id: 'source-run-01', firstFrame: 41, lastBlockFrame: 501,
      sourceSha256: 'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70',
      sourceBytes: 190580, decodedSamples: 844416, initialSeekSamples: 1673,
      measuredPcmSha256: 'd0aa56218c7b0ef05d011d4c47898fd1550cba1a888368a75304f981decef69f',
      terminalEmptyBlock: {frame: 501, samples: 0, seek: -2276, mp3Bytes: 0}},
    {id: 'source-run-02', firstFrame: 544, lastBlockFrame: 719,
      sourceSha256: '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db',
      sourceBytes: 73060, decodedSamples: 323712, initialSeekSamples: 519,
      measuredPcmSha256: 'd53be298c40bd865740e1e77287eea868f1532f86c106b3f42dc07b8e5d9b82b',
      terminalEmptyBlock: null},
  ],
  alignmentStatus: 'source-block-boundary-candidate-not-original-runtime-accepted',
} as const);

export type AlgL06P003AudioSlice = Readonly<{
  runId: (typeof ALG_L06_P003_SOURCE_AUDIO.runs)[number]['id'];
  delaySeconds: number;
  firstDecodedSample: number;
  durationSeconds: number;
}>;

function slicesAt(position: number, frame?: number): readonly AlgL06P003AudioSlice[] {
  const plan = ALG_L06_P003_SOURCE_AUDIO;
  const terminal = (plan.lastFrame - 1) / plan.fps;
  if (!Number.isFinite(position) || position < 0 || position > terminal)
    throw new Error('invalid-source-position');
  return Object.freeze(plan.runs.flatMap(run => {
    const start = (run.firstFrame - 1) / plan.fps;
    const decodedEnd = start + (run.decodedSamples - run.initialSeekSamples) / plan.sampleRate;
    const end = Math.min(terminal, decodedEnd);
    const from = Math.max(position, start);
    if (from >= end) return [];
    return [Object.freeze({runId: run.id, delaySeconds: Math.max(0,
      frame === undefined ? start - position : (run.firstFrame - frame) / plan.fps),
      firstDecodedSample: run.initialSeekSamples + Math.max(0, from - start) * plan.sampleRate,
      durationSeconds: end - from})];
  }));
}

/** Frame-aligned inspection path. No source node starts during the gap. */
export function algL06P003AudioSlicesFromFrame(frame: number): readonly AlgL06P003AudioSlice[] {
  const plan = ALG_L06_P003_SOURCE_AUDIO;
  if (!Number.isSafeInteger(frame) || frame < plan.firstFrame || frame > plan.lastFrame)
    throw new Error('invalid-source-frame');
  return slicesAt((frame - 1) / plan.fps, frame);
}

/** Fractional position path for pause/resume without snapping to a frame. */
export function algL06P003AudioSlicesFromSeconds(position: number): readonly AlgL06P003AudioSlice[] {
  return slicesAt(position);
}
