import type {LessonTextActivityDefinition,LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4L9_IN004_CLOCKS} from './g4-l9-in004-host-state';
import A from './g4-l9-in004-terminal/audio-config.json';
const feedback:NonNullable<LessonTextActivityDefinition['audio']>={source:A.feedback.source,sha256:A.feedback.sha256,language:'shared',spokenLanguage:'undetermined',firstFrame:2,lastFrame:25,offsetSeconds:A.feedback.offsetSeconds};
/** Prepared source stream3 binding; audio belongs to the existing host child
 * clock. No AudioContext, timer, local media element or silent fallback. */
export const IN004_TERMINAL_ACTIVITY_TIMELINES:readonly LessonTextActivityDefinition[]=G4L9_IN004_CLOCKS.map(d=>d.id==='g4l9-in004-feedback'?{...d,audio:feedback}:d);
export const IN004_MAIN_AUDIO_CUES:NonNullable<LessonTextPresentationCapability<SourceStaticCanvasFrameState>['sourceTimelineAudioCues']>=A.sourceTimelineAudioCues.map(c=>({...c,language:'en',spokenLanguage:'undetermined'}));
// The complete page capability consumes these clocks; real My Lesson and
// listening acceptance remain separate from this staged product integration.
