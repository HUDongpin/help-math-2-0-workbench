"use client";
import {G4_L4_COLUMN_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-column-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_017_CONFIG, COURSE_G04_L04_IN_017_SOURCE} from "../timelines/course-g04-l04-in-017";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_017_CONFIG, G4_L4_COLUMN_HOST_AUDIO_CANDIDATES["course-g04-l04-in-017"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_017_SOURCE};
export const COURSE_G04_L04_IN_017_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_017_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_017_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_017_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In017Frame = candidate.normalizeFrame;
export const getCourseG04L04In017FrameState = candidate.getFrameState;
export const buildCourseG04L04In017CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In017Renderer = candidate.Renderer;
export default module;
