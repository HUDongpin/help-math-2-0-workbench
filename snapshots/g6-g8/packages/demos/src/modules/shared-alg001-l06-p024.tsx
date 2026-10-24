/** Source-locked drawing module; the maintained My Lesson player owns behavior. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P024_DRAWING} from '../timelines/shared-alg001-l06-p024';
import {P024_STATE_SOURCE,P024_ANSWERS,P024_FEEDBACK} from '../alg-l06-p024-state-v1';
import {P024_AUDIO_DOMAINS,P024_AUDIO_SA,P024_AUDIO_DISPOSITION} from '../alg-l06-p024-audio-schedule-v1';
import {P024_NATIVE_TEXT_SOURCE} from '../alg-l06-p024-native-text-v1';
import {P024_PRESENTATION_BINDING} from '../alg-l06-p024-presentation-v1';
import CANVAS from '../../../../output/alg-l06-p024-canvas-v2/canvas-metadata-v2.json';
const drawing=ALG_L06_P024_DRAWING;
if(P024_STATE_SOURCE.swfSha256!==drawing.sourceSwfSha256||
 P024_STATE_SOURCE.mainFrames!==381||P024_STATE_SOURCE.quizFrame!==154||
 P024_AUDIO_DOMAINS.length!==8||P024_AUDIO_DISPOSITION.sourceBlockCount!==570||
 P024_AUDIO_DISPOSITION.mainFrameDomain!==drawing.mainFrameDomain||
 P024_AUDIO_DISPOSITION.domainsConcatenated!==false||
 P024_AUDIO_SA.splicedIntoMain!==false||P024_AUDIO_SA.localeAutoplay!==false||
 P024_NATIVE_TEXT_SOURCE.source.sha256!==drawing.sourceSwfSha256||
 P024_NATIVE_TEXT_SOURCE.textInstances.length!==77||
 P024_PRESENTATION_BINDING.source.swfSha256!==drawing.sourceSwfSha256||
 P024_PRESENTATION_BINDING.gates.length!==7||
 CANVAS.animationId!==drawing.animationId||CANVAS.sourceSwfSha256!==drawing.sourceSwfSha256||
 CANVAS.main.frameDomain!==drawing.mainFrameDomain||CANVAS.main.frameCount!==381||
 CANVAS.main.quizStopFrame!==154||CANVAS.assetSha256!==drawing.assetSha256||
 CANVAS.sourceGlyphRendering.suppressTextIdsSupported!==true||
 CANVAS.sourceMorphCharacterCount!==61||CANVAS.sourceMasks.length!==3)
 throw Error('P024_DRAWING_BEHAVIOR_AUDIO_TEXT_IDENTITY_MISMATCH');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P024:Object.freeze({version:1 as const,drawing,stateSource:P024_STATE_SOURCE,
  answers:P024_ANSWERS,feedback:P024_FEEDBACK,sourceAudio:P024_AUDIO_DOMAINS,
  optionalSpanishAudio:P024_AUDIO_SA,presentation:P024_PRESENTATION_BINDING})});
