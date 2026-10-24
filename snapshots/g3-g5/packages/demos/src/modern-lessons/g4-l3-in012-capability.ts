import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES} from '../g4-l3-main-timeline-audio.generated';
import {IN012_FEEDBACK_ACTIVITIES} from './g4-l3-in012-feedback-host';
import {IN012_BINDING} from './g4-l3-in012-text';
import {In012Renderer, IN012_KEY_TERMS} from './g4-l3-in012';
import {getIn012HostSnapshot} from './g4-l3-in012-host-snapshot';
const main = G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES['course-g04-l03-in-012'].audioCues[0];
if (main.sha256 !== '57c455b31967737803c2cbaf6092fd2bd28f21ae178bd32cca81a231884728b2' || main.frame !== 7 || main.endFrame !== 216) throw new Error('IN012 main audio binding drift');
/** Registered candidate; source-bound terminal continuation follows final feedback.
 * A host-only snapshot at174 blocks without the local interaction state.
 * The renderer supplies that state explicitly. No learner completion claim.
 */
export const IN012_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion:1,binding:IN012_BINDING,Renderer:In012Renderer,getSnapshot:getIn012HostSnapshot,
  sourceTimelineAudioCues:[{id:main.id,source:main.source,sha256:main.sha256,frame:main.frame,endFrame:main.endFrame,frameDomain:'sprite-228',language:'en',spokenLanguage:'undetermined'}],
  activityTimelines:IN012_FEEDBACK_ACTIVITIES,
  frameControl:{frameDomain:'sprite-228',completionFrame:215,transitions:[{fromFrame:174,toFrame:175,stopFrame:215}]},
  keyTerms:IN012_KEY_TERMS,playbackMode:'once',
  playbackEndFrameByDomain:{'sprite-228':174},reducedMotionFrameByDomain:{'sprite-228':174},
};
