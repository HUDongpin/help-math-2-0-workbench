"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_FQ_002_CONFIG, COURSE_G03_L02_FQ_002_SOURCE,
} from "../timelines/course-g03-l02-fq-002";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_FQ_002_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_FQ_002_SOURCE};
export const COURSE_G03_L02_FQ_002_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_FQ_002_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_FQ_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_FQ_002_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Fq002Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Fq002FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Fq002CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Fq002Renderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
