'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P048_DRAWING} from '../timelines/shared-alg001-l06-p048';
const drawing=ALG_L06_P048_DRAWING;
if(drawing.mainFrameDomain!=='sprite-348'||drawing.mainFrameCount!==327||drawing.rootBeginFrame!==6)throw Error('P048_DRAWING_SOURCE_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P048:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:224,
  wrongFeedbackSprite:304,rightFeedbackSprite:217,correctAnswer:'A' as const,
  behaviorOwner:'P048PageRuntimeV1' as const,sourceAudioStreamCount:3,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
