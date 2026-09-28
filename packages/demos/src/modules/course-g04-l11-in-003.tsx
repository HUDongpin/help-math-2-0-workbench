"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L11_IN_003_CONFIG,
  COURSE_G04_L11_IN_003_SOURCE,
} from "../timelines/course-g04-l11-in-003";
import {
  createCourseG04L11In003OrderedPairCandidate,
} from "./course-g04-l11-in-003-coordinate-grid-candidate";

const sourceCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L11_IN_003_CONFIG,
);
const candidate = createCourseG04L11In003OrderedPairCandidate(sourceCandidate);

export {COURSE_G04_L11_IN_003_SOURCE};
export const COURSE_G04_L11_IN_003_MOVIE = sourceCandidate.movie;
export const COURSE_G04_L11_IN_003_RUNTIME = sourceCandidate.runtime;
export const COURSE_G04_L11_IN_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_IN_003_SCENARIOS = sourceCandidate.scenarios;
export const normalizeCourseG04L11In003Frame = sourceCandidate.normalizeFrame;
export const getCourseG04L11In003FrameState = sourceCandidate.getFrameState;
export const buildCourseG04L11In003CaptureAttributes =
  sourceCandidate.buildCaptureAttributes;
export const CourseG04L11In003Renderer = candidate.Renderer;

export default candidate.module;
