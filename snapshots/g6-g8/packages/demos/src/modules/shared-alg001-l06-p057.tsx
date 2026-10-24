'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P057_DRAWING as drawing} from '../timelines/shared-alg001-l06-p057';
if(drawing.mainFrameDomain!=='sprite-312'||drawing.mainFrameCount!==856||drawing.rootBeginFrame!==6)throw Error('P057_DRAWING_SOURCE_IDENTITY');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P057:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:839,
  feedbackOwner:'P057PageRuntimeV1' as const,sourceAudioStreamCount:8,
  wrongFeedbackSprites:[157,117,129] as const,rightFeedbackSprites:[77,93,52,105] as const,
  wrongCounterIncrement:'feedback-terminal' as const,firstWrongRetries:true,secondWrongResumes:true,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
