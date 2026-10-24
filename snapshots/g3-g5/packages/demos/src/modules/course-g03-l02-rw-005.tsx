"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_RW_005_CONFIG, COURSE_G03_L02_RW_005_SOURCE,
} from "../timelines/course-g03-l02-rw-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_RW_005_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_RW_005_SOURCE};
export const COURSE_G03_L02_RW_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_RW_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_RW_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_RW_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Rw005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Rw005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Rw005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Rw005Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
