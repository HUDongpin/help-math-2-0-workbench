"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_011_CONFIG,
  COURSE_G05_L03_IN_011_SOURCE,
} from "../timelines/course-g05-l03-in-011";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_011_CONFIG);

export {COURSE_G05_L03_IN_011_SOURCE};
export const COURSE_G05_L03_IN_011_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_011_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_011_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_011_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In011Frame = candidate.normalizeFrame;
export const getCourseG05L03In011FrameState = candidate.getFrameState;
export const buildCourseG05L03In011CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In011Renderer = candidate.Renderer;

export default candidate.module;
