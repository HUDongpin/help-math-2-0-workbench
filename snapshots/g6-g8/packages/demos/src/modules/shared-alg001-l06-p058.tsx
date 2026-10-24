'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P058_DRAWING as drawing} from '../timelines/shared-alg001-l06-p058';
if(drawing.mainFrameDomain!=='sprite-285'||drawing.mainFrameCount!==951||drawing.rootBeginFrame!==6)throw Error('P058_DRAWING_SOURCE_IDENTITY');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P058:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:934,
  feedbackOwner:'P058PageRuntimeV1' as const,sourceAudioStreamCount:8,
  wrongFeedbackSprites:[129,115,140] as const,rightFeedbackSprites:[97,76,62,36] as const,
  wrongCounterIncrement:'feedback-terminal' as const,firstWrongRetries:true,secondWrongResumes:true,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
