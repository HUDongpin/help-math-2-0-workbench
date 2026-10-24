"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G05_L03_IN_015_CONFIG,
  COURSE_G05_L03_IN_015_SOURCE,
} from "../timelines/course-g05-l03-in-015";

const candidate = createSourceStaticCanvasCandidate(COURSE_G05_L03_IN_015_CONFIG);

export {COURSE_G05_L03_IN_015_SOURCE};
export const COURSE_G05_L03_IN_015_MOVIE = candidate.movie;
export const COURSE_G05_L03_IN_015_RUNTIME = candidate.runtime;
export const COURSE_G05_L03_IN_015_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L03_IN_015_SCENARIOS = candidate.scenarios;
export const normalizeCourseG05L03In015Frame = candidate.normalizeFrame;
export const getCourseG05L03In015FrameState = candidate.getFrameState;
export const buildCourseG05L03In015CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG05L03In015Renderer = candidate.Renderer;

export default candidate.module;
