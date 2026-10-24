"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_GS_003_CONFIG, COURSE_G03_L02_GS_003_SOURCE,
} from "../timelines/course-g03-l02-gs-003";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_GS_003_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_GS_003_SOURCE};
export const COURSE_G03_L02_GS_003_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_GS_003_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_GS_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_GS_003_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Gs003Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Gs003FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Gs003CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Gs003Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
