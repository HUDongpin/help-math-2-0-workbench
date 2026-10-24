import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Ti005Renderer} from '../modules/course-g04-l03-ti-005';
import {TI005_BINDING, getTi005TextSnapshot} from './g4-l3-ti005-text';

export const TI005_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: TI005_BINDING, Renderer: CourseG04L03Ti005Renderer,
  getSnapshot: getTi005TextSnapshot, playbackMode: 'once',
  playbackEndFrameByDomain: {'sprite-208': 209},
  reducedMotionFrameByDomain: {'sprite-208': 209},
};
