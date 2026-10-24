'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P056_DRAWING as drawing} from '../timelines/shared-alg001-l06-p056';
if(drawing.mainFrameDomain!=='sprite-305'||drawing.mainFrameCount!==818||drawing.rootBeginFrame!==6)throw Error('P056_DRAWING_SOURCE_IDENTITY');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P056:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:801,
  feedbackOwner:'P056PageRuntimeV1' as const,sourceAudioStreamCount:8,
  wrongFeedbackSprites:[138,149,160] as const,rightFeedbackSprites:[83,124,51,116] as const,
  wrongCounterIncrement:'feedback-terminal' as const,firstWrongRetries:true,secondWrongResumes:true,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
