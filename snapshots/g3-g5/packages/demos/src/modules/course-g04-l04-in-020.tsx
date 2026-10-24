"use client";
import {G4_L4_ESTIMATION_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-estimation-examples-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_020_CONFIG, COURSE_G04_L04_IN_020_SOURCE} from "../timelines/course-g04-l04-in-020";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_020_CONFIG, G4_L4_ESTIMATION_HOST_AUDIO_CANDIDATES["course-g04-l04-in-020"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_020_SOURCE};
export const COURSE_G04_L04_IN_020_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_020_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_020_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_020_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In020Frame = candidate.normalizeFrame;
export const getCourseG04L04In020FrameState = candidate.getFrameState;
export const buildCourseG04L04In020CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In020Renderer = candidate.Renderer;
export default module;
