"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_019_CONFIG,
  COURSE_G05_L03_IN_019_SOURCE,
} from "../timelines/course-g05-l03-in-019";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_019_CONFIG);

export {COURSE_G05_L03_IN_019_SOURCE};
export const COURSE_G05_L03_IN_019_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_019_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_019_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_019_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In019Frame = candidate.normalizeFrame;
export const getCourseG05L03In019FrameState = candidate.getFrameState;
export const buildCourseG05L03In019CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In019Renderer = candidate.Renderer;

export default candidate.module;
