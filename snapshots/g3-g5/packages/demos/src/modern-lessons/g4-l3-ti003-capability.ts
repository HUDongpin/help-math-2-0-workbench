import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Ti003Renderer} from '../modules/course-g04-l03-ti-003';
import {TI003_KEY_TERMS} from './g4-l3-ti003-keyterms';
import {TI003_BINDING,getTi003TextSnapshot} from './g4-l3-ti003-text';
export const TI003_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion:1,keyTerms:TI003_KEY_TERMS,binding:TI003_BINDING,Renderer:CourseG04L03Ti003Renderer,
  getSnapshot:getTi003TextSnapshot,playbackMode:'once',
  playbackEndFrameByDomain:{'sprite-126':139},reducedMotionFrameByDomain:{'sprite-126':139},
};
