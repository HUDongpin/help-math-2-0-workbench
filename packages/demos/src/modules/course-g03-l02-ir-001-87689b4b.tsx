"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G03_L02_IR_001_87689B4B_CONFIG, COURSE_G03_L02_IR_001_87689B4B_SOURCE,
} from "../timelines/course-g03-l02-ir-001-87689b4b";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(COURSE_G03_L02_IR_001_87689B4B_CONFIG);
const candidate = sourceStaticCandidate;

export {COURSE_G03_L02_IR_001_87689B4B_SOURCE};
export const COURSE_G03_L02_IR_001_87689B4B_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G03_L02_IR_001_87689B4B_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G03_L02_IR_001_87689B4B_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L02_IR_001_87689B4B_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG03L02Ir00187689b4bFrame = sourceStaticCandidate.normalizeFrame;
export const getCourseG03L02Ir00187689b4bFrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG03L02Ir00187689b4bCaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG03L02Ir00187689b4bRenderer = candidate.Renderer;

export default Object.freeze({
  ...candidate.module,
  audioTracks: Object.freeze([]),
});
