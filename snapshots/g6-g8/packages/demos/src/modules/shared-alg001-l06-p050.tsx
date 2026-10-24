'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P050_DRAWING as drawing} from '../timelines/shared-alg001-l06-p050';
if(drawing.mainFrameDomain!=='sprite-489'||drawing.mainFrameCount!==674||drawing.rootBeginFrame!==6)throw Error('P050_DRAWING_SOURCE_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P050:Object.freeze({version:1 as const,drawing,sourceBeginFrame:662,sourceFinalFrame:673,
  questions:10,correctAnswers:['D','A','B','D','C','A','B','C','D','B'] as const,
  correctFeedbackSprites:[358,432,479] as const,wrongFeedbackSprite:380,
  behaviorOwner:'P050PageRuntimeV1' as const,activeSourceAudioStreamCount:5,
  optionalSpanishTrigger:'explicit-user-only' as const,mainStreamSpliced:false,
  originalRuntimeParity:false,audioAccepted:false})});
