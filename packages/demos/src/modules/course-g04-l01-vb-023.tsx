"use client";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L01_VB_023_CONFIG, COURSE_G04_L01_VB_023_SOURCE} from "../timelines/course-g04-l01-vb-023";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L01_VB_023_CONFIG);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L01_VB_023_SOURCE};
export const COURSE_G04_L01_VB_023_MOVIE = candidate.movie;
export const COURSE_G04_L01_VB_023_RUNTIME = candidate.runtime;
export const COURSE_G04_L01_VB_023_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L01_VB_023_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L01Vb023Frame = candidate.normalizeFrame;
export const getCourseG04L01Vb023FrameState = candidate.getFrameState;
export const buildCourseG04L01Vb023CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L01Vb023Renderer = candidate.Renderer;
export default module;
