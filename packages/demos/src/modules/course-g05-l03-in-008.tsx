"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_008_CONFIG,
  COURSE_G05_L03_IN_008_SOURCE,
} from "../timelines/course-g05-l03-in-008";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_008_CONFIG);

export {COURSE_G05_L03_IN_008_SOURCE};
export const COURSE_G05_L03_IN_008_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_008_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_008_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_008_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In008Frame = candidate.normalizeFrame;
export const getCourseG05L03In008FrameState = candidate.getFrameState;
export const buildCourseG05L03In008CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In008Renderer = candidate.Renderer;

export default candidate.module;
