"use client";

import React from "react";
import type {AnimationRendererProps} from "../contract";
import {FourStepPlanContent} from "./course-g04-l03-four-step-plan-content";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";

import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L03_TS_002_CONFIG,
  COURSE_G04_L03_TS_002_GLOSSARY_CONFIG,
  COURSE_G04_L03_TS_002_SOURCE,
} from "../timelines/course-g04-l03-ts-002";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_TS_002_CONFIG,
);

const SourceRenderer = candidate.Renderer;
function VisualRenderer(props: AnimationRendererProps) {
  return <FourStepPlanContent animationId="course-g04-l03-ts-002" {...props}>
    <SourceRenderer {...props} />
  </FourStepPlanContent>;
}
const glossaryCandidate = createCourseG04L03SourceGlossaryCandidate(
  {...candidate, Renderer: VisualRenderer,
    module: Object.freeze({...candidate.module, reducedMotionFrame: 355})},
  COURSE_G04_L03_TS_002_GLOSSARY_CONFIG,
  {scenario: "source-static-frame", canvasCandidateStatus: "source-static-engineering-not-strict", surfacePlacement: "companion"},
);

export {COURSE_G04_L03_TS_002_SOURCE};
export const COURSE_G04_L03_TS_002_MOVIE = candidate.movie;
export const COURSE_G04_L03_TS_002_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_TS_002_SOURCE_CONTRACT = glossaryCandidate.sourceContract;
export const COURSE_G04_L03_TS_002_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L03Ts002Frame = candidate.normalizeFrame;
export const getCourseG04L03Ts002FrameState = candidate.getFrameState;
export const buildCourseG04L03Ts002CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L03Ts002Renderer = glossaryCandidate.Renderer;

export default glossaryCandidate.module;
