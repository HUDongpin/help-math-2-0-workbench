"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L08_IN_037_CONFIG, COURSE_G03_L08_IN_037_SOURCE} from "../timelines/course-g03-l08-in-037";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L08_IN_037_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L08_IN_037_SOURCE};
export const COURSE_G03_L08_IN_037_MOVIE = candidate.movie;
export const COURSE_G03_L08_IN_037_RUNTIME = candidate.runtime;
export const COURSE_G03_L08_IN_037_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L08_IN_037_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L08In037Frame = candidate.normalizeFrame;
export const getCourseG03L08In037FrameState = candidate.getFrameState;
export const buildCourseG03L08In037CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L08In037Renderer = candidate.Renderer;
export default module;
