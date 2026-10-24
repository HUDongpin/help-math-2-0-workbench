'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P033_DRAWING as drawing} from '../timelines/shared-alg001-l06-p033';
if(drawing.mainFrameDomain!=='sprite-190'||drawing.mainFrameCount!==385||drawing.rootBeginFrame!==6)throw Error('P033_DRAWING_SOURCE_IDENTITY');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P033:Object.freeze({version:1 as const,drawing,sourceQuizStopFrame:52,
  feedbackOwner:'P033PageRuntimeV1' as const,sourceAudioStreamCount:8,
  wrongFeedbackSprites:[147,161,175] as const,rightFeedbackSprites:[78,119,46,111] as const,
  wrongCounterIncrement:'answer-release' as const,firstWrongRetries:true,secondWrongResumes:true,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
