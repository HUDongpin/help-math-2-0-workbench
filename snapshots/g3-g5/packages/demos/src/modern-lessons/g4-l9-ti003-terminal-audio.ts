import type {LessonTextActivityDefinition,LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4L9_TI003_CLOCKS} from './g4-l9-ti003-host-state';
import A from './g4-l9-ti003-terminal/audio-config.json';
import BUTTONS from './g4-l9-ti003-terminal/button-activities.json';
const feedback:NonNullable<LessonTextActivityDefinition['audio']>={...A.feedback,language:'shared',spokenLanguage:'undetermined'};
const button:NonNullable<LessonTextActivityDefinition['audio']>={...A.buttonDown,language:'shared',spokenLanguage:'undetermined'};
/** Exact source children; the existing host clock owns playback and cancellation. */
export const TI003_TERMINAL_ACTIVITY_TIMELINES:readonly LessonTextActivityDefinition[]=[...G4L9_TI003_CLOCKS.map(d=>d.id==='g4l9-ti003-feedback'?{...d,audio:feedback}:d),...BUTTONS.map(d=>({...d,audio:button}))];
export const TI003_MAIN_AUDIO_CUES:NonNullable<LessonTextPresentationCapability<SourceStaticCanvasFrameState>['sourceTimelineAudioCues']>=A.sourceTimelineAudioCues.map(c=>({...c,language:'en',spokenLanguage:'undetermined'}));
