"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_RW_004_CONFIG, COURSE_G03_L02_RW_004_SOURCE,
} from "../timelines/course-g03-l02-rw-004";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_RW_004_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_RW_004_SOURCE};
export const COURSE_G03_L02_RW_004_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_RW_004_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_RW_004_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_RW_004_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Rw004Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Rw004FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Rw004CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Rw004Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
