"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TI_007_CONFIG, COURSE_G04_L11_TI_007_SOURCE} from
  "../timelines/course-g04-l11-ti-007";
import {createCourseG04L11Ti007SegmentLengthCandidate} from
  "./course-g04-l11-ti-007-segment-length-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TI_007_CONFIG);
const candidate = createCourseG04L11Ti007SegmentLengthCandidate(sourceCandidate);

export {COURSE_G04_L11_TI_007_SOURCE};
export const COURSE_G04_L11_TI_007_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_TI_007_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_TI_007_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TI_007_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Ti007Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Ti007FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Ti007CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Ti007Renderer = candidate.Renderer;
export default candidate.module;
