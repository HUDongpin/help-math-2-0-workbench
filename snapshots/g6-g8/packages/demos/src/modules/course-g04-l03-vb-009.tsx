"use client";

import type {AnimationModule, RuntimeContext} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_VB_009_CANDIDATE_CONFIG,
  COURSE_G04_L03_VB_009_MOVIE,
  COURSE_G04_L03_VB_009_RUNTIME,
  COURSE_G04_L03_VB_009_SOURCE_CONTRACT,
  getCourseG04L03Vb009FrameState,
  type CourseG04L03Vb009FrameState,
} from "../timelines/course-g04-l03-vb-009";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_009_CANDIDATE_CONFIG,
);

export const buildCourseG04L03Vb009CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Vb009Renderer = candidate.Renderer;

const animationModule: AnimationModule<CourseG04L03Vb009FrameState> =
  Object.freeze({
    ...candidate.module,
    movie: COURSE_G04_L03_VB_009_MOVIE,
    runtime: COURSE_G04_L03_VB_009_RUNTIME,
    getFrameState: (frame: number, context: RuntimeContext) =>
      getCourseG04L03Vb009FrameState(frame, context),
  });

export {COURSE_G04_L03_VB_009_SOURCE_CONTRACT};
export default animationModule;
