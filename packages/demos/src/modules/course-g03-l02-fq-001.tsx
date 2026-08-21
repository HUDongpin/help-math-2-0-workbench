"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_FQ_001_CONFIG, COURSE_G03_L02_FQ_001_SOURCE,
} from "../timelines/course-g03-l02-fq-001";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_FQ_001_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_FQ_001_SOURCE};
export const COURSE_G03_L02_FQ_001_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_FQ_001_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_FQ_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_FQ_001_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Fq001Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Fq001FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Fq001CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Fq001Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
