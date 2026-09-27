"use client";

import {createG5L4Fq23QuestionAtlasCandidate} from "../g5-l4-fq23-question-atlas-candidate";
import {
  COURSE_G05_L04_FQ_003_CONFIG,
  COURSE_G05_L04_FQ_003_SOURCE,
} from "../timelines/course-g05-l04-fq-003";

const candidate = createG5L4Fq23QuestionAtlasCandidate(
  COURSE_G05_L04_FQ_003_CONFIG,
);

export {COURSE_G05_L04_FQ_003_SOURCE};
export const COURSE_G05_L04_FQ_003_MOVIE = candidate.movie;
export const COURSE_G05_L04_FQ_003_RUNTIME = candidate.runtime;
export const COURSE_G05_L04_FQ_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G05_L04_FQ_003_SCENARIOS = candidate.scenarios;
export const getCourseG05L04Fq003FrameState = candidate.getFrameState;
export const CourseG05L04Fq003Renderer = candidate.Renderer;

export default candidate.module;
