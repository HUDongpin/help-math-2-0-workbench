/** P044 registry drawing module; source behavior and audio are page owned. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P044_DRAWING} from '../timelines/shared-alg001-l06-p044';

const drawing=ALG_L06_P044_DRAWING;
if(drawing.sourceSwfSha256!==
   '50952b58f10d24b5d649930817aff9f6b779ebb1f698f14392eda00d8afdec34'||
   drawing.assetSha256!==
   '26a7c58ba4f7ce018ffd8d1f552ecb8d63fa6d480eef7721a14cd8ba36cce01b'||
   drawing.mainFrameDomain!=='sprite-354'||drawing.mainFrameCount!==275||
   drawing.rootFrameCount!==10||drawing.rootBeginFrame!==6||drawing.fps!==12)
  throw Error('P044_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P044:Object.freeze({version:1 as const,drawing,
    sourceQuizStopFrame:53,wrongFeedbackSprite:336,rightFeedbackSprite:198,
    feedbackOwner:'P044PageRuntimeV1' as const,
    audioOwner:'P044AudioOwnerV1' as const,sourceAudioStreamCount:3,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:false,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
