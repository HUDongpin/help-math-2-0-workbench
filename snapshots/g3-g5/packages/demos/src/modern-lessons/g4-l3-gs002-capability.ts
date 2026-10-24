import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Gs002NativeRenderer} from '../modules/course-g04-l03-gs-002';
import {GS002_BINDING,getGs002TextSnapshot} from './g4-l3-gs002-text';
import {GS002_FRAME_CONTROL} from './g4-l3-gs002-playback';
import source from './generated/g4-l3-gs002-text.json';
import {GS002_SOURCE_ACTIVITIES,GS002_BUTTON_ACTIVITIES} from './g4-l3-gs002-source-activities';

/** Prepared capability; registry admission and actual host review remain separate. */
export const GS002_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={
  schemaVersion:1,binding:GS002_BINDING,Renderer:CourseG04L03Gs002NativeRenderer,
  keyTerms:{...source.keyTermsCapability,indexLanguage:'en'},getSnapshot:getGs002TextSnapshot,
  frameControl:GS002_FRAME_CONTROL,playbackMode:'once',
  activityTimelines:[...GS002_SOURCE_ACTIVITIES,...GS002_BUTTON_ACTIVITIES],
  playbackEndFrameByDomain:{'sprite-321':427},reducedMotionFrameByDomain:{'sprite-321':427},
};
