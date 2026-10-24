"use client";
import {G4_L4_PLACE_VALUE_HOST_AUDIO_CANDIDATES} from "../modern-lessons/generated/g4-l4-place-value-config";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L04_IN_005_CONFIG, COURSE_G04_L04_IN_005_SOURCE} from "../timelines/course-g04-l04-in-005";

const candidate = createSourceStaticCanvasCandidate(COURSE_G04_L04_IN_005_CONFIG, G4_L4_PLACE_VALUE_HOST_AUDIO_CANDIDATES["course-g04-l04-in-005"]);
const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {COURSE_G04_L04_IN_005_SOURCE};
export const COURSE_G04_L04_IN_005_MOVIE = candidate.movie;
export const COURSE_G04_L04_IN_005_RUNTIME = candidate.runtime;
export const COURSE_G04_L04_IN_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L04_IN_005_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L04In005Frame = candidate.normalizeFrame;
export const getCourseG04L04In005FrameState = candidate.getFrameState;
export const buildCourseG04L04In005CaptureAttributes = candidate.buildCaptureAttributes;
export const CourseG04L04In005Renderer = candidate.Renderer;
export default module;
