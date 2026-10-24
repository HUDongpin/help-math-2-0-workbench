'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P014_DRAWING} from '../timelines/shared-alg001-l06-p014';
import {P014_TIMELINE} from '../alg-l06-p014-timeline-v1';
import {P014_AUDIO_ASSETS,P014_SA_ASSET,P014_AUDIO_DISPOSITION}
  from '../alg-l06-p014-audio-schedule-v1';
import {P014_OPTIONAL_SPANISH_AUDIO_BINDING}
  from '../alg-l06-p014-optional-spanish-audio-v1';
import {P014_TEXT_STATE_SOURCE} from '../generated/alg-l06-p014-text-state-v1';
import {P014_CANVAS_V1} from '../generated/alg-l06-p014-canvas-v1';

if(P014_TIMELINE.animationId!==ALG_L06_P014_DRAWING.animationId||
  P014_TIMELINE.sourceSwfSha256!==ALG_L06_P014_DRAWING.sourceSwfSha256||
  P014_TIMELINE.frameDomain!==ALG_L06_P014_DRAWING.mainFrameDomain||
  P014_TIMELINE.mainFrameCount!==ALG_L06_P014_DRAWING.mainFrameCount||
  P014_TIMELINE.quizHoldFrame!==120||
  P014_AUDIO_ASSETS.length!==9||
  P014_AUDIO_DISPOSITION.originalRuntimeAccepted!==false||
  P014_SA_ASSET.sourceSha256!==P014_OPTIONAL_SPANISH_AUDIO_BINDING.sourceSha256||
  P014_TEXT_STATE_SOURCE.animationId!==ALG_L06_P014_DRAWING.animationId||
  P014_TEXT_STATE_SOURCE.sourceSwfSha256!==ALG_L06_P014_DRAWING.sourceSwfSha256||
  P014_TEXT_STATE_SOURCE.frameCount!==449||
  P014_CANVAS_V1.assetSha256!==ALG_L06_P014_DRAWING.assetSha256||
  P014_CANVAS_V1.sourceSwfSha256!==ALG_L06_P014_DRAWING.sourceSwfSha256)
  throw Error('P014_DRAWING_AUDIO_TEXT_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(ALG_L06_P014_DRAWING);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P014:Object.freeze({version:1 as const,drawing:ALG_L06_P014_DRAWING,
    sourceAudio:P014_AUDIO_ASSETS,optionalSpanishAudio:P014_OPTIONAL_SPANISH_AUDIO_BINDING,
    textSource:P014_TEXT_STATE_SOURCE,quizHoldFrame:P014_TIMELINE.quizHoldFrame,
    conditionalHostSelector:P014_TIMELINE.oldHostPolicy}),
});
