import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L03Ti004Renderer} from '../modules/course-g04-l03-ti-004';
import {TI004_BINDING,getTi004TextSnapshot} from './g4-l3-ti004-text';
import {TI004_KEY_TERMS} from './g4-l3-ti004-keyterms';
export const TI004_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:TI004_BINDING,Renderer:CourseG04L03Ti004Renderer,keyTerms:TI004_KEY_TERMS,getSnapshot:getTi004TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-274':124},reducedMotionFrameByDomain:{'sprite-274':124}};
