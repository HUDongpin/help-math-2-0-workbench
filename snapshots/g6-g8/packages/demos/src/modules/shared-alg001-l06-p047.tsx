/** P047 registered drawing. The maintained player owns matching and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P047_DRAWING} from '../timelines/shared-alg001-l06-p047';
const drawing=ALG_L06_P047_DRAWING;
if(drawing.mainFrameDomain!=='sprite-117'||drawing.mainFrameCount!==890||drawing.rootBeginFrame!==6)
 throw Error('P047_DRAWING_SOURCE_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P047:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:208,
  wrongFeedbackSprite:70,rightFeedbackSprite:72,feedbackFrames:20,matchingPairs:5,
  behaviorOwner:'P047PageRuntimeV1' as const,sourceAudioStreamCount:3,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
