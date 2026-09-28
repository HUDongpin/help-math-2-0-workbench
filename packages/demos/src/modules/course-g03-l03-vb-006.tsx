"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G03_L03_VB_006_CONFIG, COURSE_G03_L03_VB_006_SOURCE} from "../timelines/course-g03-l03-vb-006";

const candidate = createSourceStaticCanvasCandidate(COURSE_G03_L03_VB_006_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G03_L03_VB_006_SOURCE};
export const COURSE_G03_L03_VB_006_MOVIE = candidate.movie;
export const COURSE_G03_L03_VB_006_RUNTIME = candidate.runtime;
export const COURSE_G03_L03_VB_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G03_L03_VB_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG03L03Vb006Frame = candidate.normalizeFrame;
export const getCourseG03L03Vb006FrameState = candidate.getFrameState;
export const buildCourseG03L03Vb006CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG03L03Vb006Renderer = candidate.Renderer;
export default module;
