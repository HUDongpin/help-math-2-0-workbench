/** P046 registered drawing. The maintained player owns matching and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P046_DRAWING} from '../timelines/shared-alg001-l06-p046';
const drawing=ALG_L06_P046_DRAWING;
if(drawing.mainFrameDomain!=='sprite-123'||drawing.mainFrameCount!==743||drawing.rootBeginFrame!==6)
 throw Error('P046_DRAWING_SOURCE_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P046:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:163,
  wrongFeedbackSprite:61,rightFeedbackSprite:63,feedbackFrames:20,matchingPairs:5,
  behaviorOwner:'P046PageRuntimeV1' as const,sourceAudioStreamCount:3,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
