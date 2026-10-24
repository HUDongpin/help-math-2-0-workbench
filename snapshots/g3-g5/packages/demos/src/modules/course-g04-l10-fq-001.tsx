"use client";

import React from "react";

import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_FQ_001_CONFIG,
  COURSE_G04_L10_FQ_001_SOURCE,
} from "../timelines/course-g04-l10-fq-001";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_FQ_001_CONFIG,
);

function CourseG04L10Fq001PrivateRenderer(
  props: AnimationRendererProps,
) {
  return (
    <div
      data-behavior-parity-established="false"
      data-calibration-id="g4-l10-candidate-to-product-v5"
      data-complexity-lane="low"
      data-private-current-js="true"
      data-reachable-source-interaction="none"
      data-source-exported-scrollbar-reachability="not-proven-by-root-placement-graph"
      data-strict-acceptance-effect="none"
    >
      <candidate.Renderer {...props} />
    </div>
  );
}

const privateModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
  Renderer: CourseG04L10Fq001PrivateRenderer,
});

export {COURSE_G04_L10_FQ_001_SOURCE};
export const COURSE_G04_L10_FQ_001_MOVIE = candidate.movie;
export const COURSE_G04_L10_FQ_001_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_FQ_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_FQ_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Fq001Frame = candidate.normalizeFrame;
export const getCourseG04L10Fq001FrameState = candidate.getFrameState;
export const buildCourseG04L10Fq001CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Fq001Renderer =
  CourseG04L10Fq001PrivateRenderer;

export default privateModule;
