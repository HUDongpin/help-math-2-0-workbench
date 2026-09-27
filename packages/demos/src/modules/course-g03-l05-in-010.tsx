"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L05_IN_010_CONFIG, COURSE_G03_L05_IN_010_SOURCE} from "../timelines/course-g03-l05-in-010";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L05_IN_010_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L05_IN_010_SOURCE};
export const COURSE_G03_L05_IN_010_MOVIE = candidate.movie;
export const COURSE_G03_L05_IN_010_RUNTIME = candidate.runtime;
export const COURSE_G03_L05_IN_010_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L05_IN_010_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L05In010Frame = candidate.normalizeFrame;
export const getCourseG03L05In010FrameState = candidate.getFrameState;
export const buildCourseG03L05In010CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L05In010Renderer = candidate.Renderer;
export default module;
