import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Ti006Renderer} from '../modules/course-g04-l03-ti-006';
import {TI006_BINDING, getTi006TextSnapshot} from './g4-l3-ti006-text';
import {TI006_KEY_TERMS} from './g4-l3-ti006-help';
export const TI006_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TI006_BINDING, Renderer: CourseG04L03Ti006Renderer,
  keyTerms: TI006_KEY_TERMS, getSnapshot: getTi006TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {'sprite-269': 166}, reducedMotionFrameByDomain: {'sprite-269': 166},
};
