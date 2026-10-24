"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L11_VB_002_CONFIG, COURSE_G04_L11_VB_002_SOURCE} from "../timelines/course-g04-l11-vb-002";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L11_VB_002_CONFIG);
const privateCurrentJsModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L11_VB_002_SOURCE};
export const COURSE_G04_L11_VB_002_MOVIE = candidate.movie;
export const COURSE_G04_L11_VB_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L11_VB_002_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L11_VB_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L11Vb002Frame = candidate.normalizeFrame;
export const getCourseG04L11Vb002FrameState = candidate.getFrameState;
export const buildCourseG04L11Vb002CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L11Vb002Renderer = candidate.Renderer;

export default privateCurrentJsModule;
