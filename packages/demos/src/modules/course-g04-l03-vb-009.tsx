"use client";

import type {AnimationModule, RuntimeContext} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_VB_009_CANDIDATE_CONFIG,
  COURSE_G04_L03_VB_009_GLOSSARY_CONFIG,
  COURSE_G04_L03_VB_009_MOVIE,
  COURSE_G04_L03_VB_009_RUNTIME,
  COURSE_G04_L03_VB_009_SOURCE_CONTRACT as SOURCE_CONTRACT,
  getCourseG04L03Vb009FrameState,
  type CourseG04L03Vb009FrameState,
} from "../timelines/course-g04-l03-vb-009";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_009_CANDIDATE_CONFIG,
);

export const buildCourseG04L03Vb009CaptureAttributes =
  candidate.buildCaptureAttributes;

const animationModule: AnimationModule<CourseG04L03Vb009FrameState> =
  Object.freeze({
    ...candidate.module,
    movie: COURSE_G04_L03_VB_009_MOVIE,
    runtime: COURSE_G04_L03_VB_009_RUNTIME,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getCourseG04L03Vb009FrameState(frame, context),
  });

const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, module: animationModule, sourceContract: SOURCE_CONTRACT},
  COURSE_G04_L03_VB_009_GLOSSARY_CONFIG,
);
export const CourseG04L03Vb009Renderer = glossaryCandidate.Renderer;
export const COURSE_G04_L03_VB_009_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export default glossaryCandidate.module;
