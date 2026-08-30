"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_006_CONFIG,
  COURSE_G05_L03_IN_006_SOURCE,
} from "../timelines/course-g05-l03-in-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_006_CONFIG);

export {COURSE_G05_L03_IN_006_SOURCE};
export const COURSE_G05_L03_IN_006_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_006_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In006Frame = candidate.normalizeFrame;
export const getCourseG05L03In006FrameState = candidate.getFrameState;
export const buildCourseG05L03In006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In006Renderer = candidate.Renderer;

export default candidate.module;
