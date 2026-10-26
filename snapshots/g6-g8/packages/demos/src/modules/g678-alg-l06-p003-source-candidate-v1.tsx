'use client';

import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P003_SOURCE_AUDIO} from '../alg-l06-p003-source-audio-schedule-v1';
import {ALG_L06_P003_SOURCE_RUNS} from '../alg-l06-p003-source-runs.generated';
import {ALG_L06_P003_DRAWING} from '../timelines/shared-alg001-l06-p003';

if (ALG_L06_P003_SOURCE_AUDIO.animationId !== ALG_L06_P003_DRAWING.animationId ||
    ALG_L06_P003_SOURCE_AUDIO.sourceSwfSha256 !== ALG_L06_P003_DRAWING.sourceSwfSha256 ||
    ALG_L06_P003_SOURCE_AUDIO.frameDomain !== ALG_L06_P003_DRAWING.mainFrameDomain ||
    ALG_L06_P003_SOURCE_AUDIO.lastFrame !== ALG_L06_P003_DRAWING.mainFrameCount ||
    ALG_L06_P003_SOURCE_RUNS.sourceSwfSha256 !== ALG_L06_P003_DRAWING.sourceSwfSha256 ||
    ALG_L06_P003_SOURCE_RUNS.runs.length !== ALG_L06_P003_SOURCE_AUDIO.runs.length ||
    ALG_L06_P003_SOURCE_RUNS.runs.some((run, index) =>
      run.id !== ALG_L06_P003_SOURCE_AUDIO.runs[index]?.id ||
      run.bytes !== ALG_L06_P003_SOURCE_AUDIO.runs[index]?.sourceBytes ||
      run.sha256 !== ALG_L06_P003_SOURCE_AUDIO.runs[index]?.sourceSha256)) {
  throw new Error('P003 drawing and source audio schedule disagree');
}

const candidate = createSourceStaticCanvasCandidate(ALG_L06_P003_DRAWING);

/** Loadable module candidate with exact source-run bytes for the maintained
 * My Lesson clock. No listening or original-runtime acceptance is implied. */
export default Object.freeze({...candidate.module, reducedMotionFrame: 531,
  privateAlgL06P003: Object.freeze({version: 1 as const,
    drawing: ALG_L06_P003_DRAWING,
    sourceAudio: ALG_L06_P003_SOURCE_AUDIO,
    sourceRuns: ALG_L06_P003_SOURCE_RUNS.runs}),
});
