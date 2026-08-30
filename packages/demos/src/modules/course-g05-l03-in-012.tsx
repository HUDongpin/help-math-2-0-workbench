"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_012_CONFIG,
  COURSE_G05_L03_IN_012_SOURCE,
} from "../timelines/course-g05-l03-in-012";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_012_CONFIG);

export {COURSE_G05_L03_IN_012_SOURCE};
export const COURSE_G05_L03_IN_012_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_012_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_012_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_012_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In012Frame = candidate.normalizeFrame;
export const getCourseG05L03In012FrameState = candidate.getFrameState;
export const buildCourseG05L03In012CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In012Renderer = candidate.Renderer;

export default candidate.module;
