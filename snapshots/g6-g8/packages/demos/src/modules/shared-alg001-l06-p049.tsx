'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P049_DRAWING} from '../timelines/shared-alg001-l06-p049';
const drawing=ALG_L06_P049_DRAWING;
if(drawing.mainFrameDomain!=='sprite-327'||drawing.mainFrameCount!==401||drawing.rootBeginFrame!==6)throw Error('P049_DRAWING_SOURCE_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P049:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:159,
  wrongFeedbackSprite:302,rightFeedbackSprite:192,correctAnswer:'B' as const,
  behaviorOwner:'P049PageRuntimeV1' as const,sourceAudioStreamCount:3,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
