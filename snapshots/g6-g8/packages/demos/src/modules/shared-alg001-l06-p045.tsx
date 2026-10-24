/** P045 registry drawing module; source behavior and audio are page owned. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P045_DRAWING} from '../timelines/shared-alg001-l06-p045';

const drawing=ALG_L06_P045_DRAWING;
if(drawing.sourceSwfSha256!==
   '9dfff51a15bb0010b98ca10c1fac954bee5d9451ceb649d8ac202e98f2c05b9d'||
   drawing.assetSha256!==
   '4e9e318fdd503275e8d89b1b462b7e525888f0b0c14ecad3d6c114d18c7d5bc0'||
   drawing.mainFrameDomain!=='sprite-350'||drawing.mainFrameCount!==167||
   drawing.rootFrameCount!==10||drawing.rootBeginFrame!==6||drawing.fps!==12)
  throw Error('P045_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P045:Object.freeze({version:1 as const,drawing,
    sourceQuizStopFrame:53,wrongFeedbackSprite:307,rightFeedbackSprite:220,
    feedbackOwner:'P045PageRuntimeV1' as const,
    audioOwner:'P045AudioOwnerV1' as const,sourceAudioStreamCount:3,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:false,graphHitTargetsSourceBound:true,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
