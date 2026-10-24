import type {LessonTextActivityDefinition,LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {TI004_CLOCKS} from './g4-l9-ti004-host-state';
import A from './g4-l9-ti004-terminal/audio-config.json';
import BUTTONS from './g4-l9-ti004-terminal/button-activities.json';
const wrong:NonNullable<LessonTextActivityDefinition['audio']>={...A.wrong,language:'shared',spokenLanguage:'undetermined'};
const coach:NonNullable<LessonTextActivityDefinition['audio']>={...A.coach,language:'shared',spokenLanguage:'undetermined'};
const button:NonNullable<LessonTextActivityDefinition['audio']>={...A.buttonDown,language:'shared',spokenLanguage:'undetermined'};
/** Wrong starts at source2; its own audio origin remains1 plus head latency.
 * Final120 has no audio. Source8/17 button streams are byte-identical. */
export const TI004_ACTIVITY_TIMELINES:readonly LessonTextActivityDefinition[]=[...TI004_CLOCKS.map(d=>d.id==='g4l9-ti004-wrong'?{...d,audio:wrong}:d.id==='g4l9-ti004-coach'?{...d,audio:coach}:d),...BUTTONS.map(d=>({...d,audio:button}))];
export const TI004_MAIN_AUDIO_CUES:NonNullable<LessonTextPresentationCapability<SourceStaticCanvasFrameState>['sourceTimelineAudioCues']>=A.sourceTimelineAudioCues.map(c=>({...c,language:'en',spokenLanguage:'undetermined'}));
