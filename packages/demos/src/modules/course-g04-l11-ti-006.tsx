"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_TI_006_CONFIG, COURSE_G04_L11_TI_006_SOURCE} from
  "../timelines/course-g04-l11-ti-006";
import {createCourseG04L11Ti006SegmentLengthCandidate} from
  "./course-g04-l11-ti-006-segment-length-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_TI_006_CONFIG);
const candidate = createCourseG04L11Ti006SegmentLengthCandidate(sourceCandidate);

export {COURSE_G04_L11_TI_006_SOURCE};
export const COURSE_G04_L11_TI_006_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_TI_006_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_TI_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_TI_006_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11Ti006Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11Ti006FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11Ti006CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11Ti006Renderer = candidate.Renderer;
export default candidate.module;
