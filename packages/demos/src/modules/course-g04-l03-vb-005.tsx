"use client";

import React, {useMemo} from "react";
import type {AnimationRendererProps} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {createCourseG04L03SourceGlossaryCandidate} from "./course-g04-l03-source-glossary-candidate";
import {
  COURSE_G04_L03_VB_005_CONFIG,
  COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
  COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS,
  COURSE_G04_L03_VB_005_SOURCE,
} from "../timelines/course-g04-l03-vb-005";

const sourceStaticCandidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_VB_005_CONFIG,
);
const SourceStaticRenderer = sourceStaticCandidate.Renderer;

function NegativeNumberPresentation(props: AnimationRendererProps) {
  const frameDomain = props.frameDomain ?? "sprite-53";
  // The source removes the separate minus glyph at frame 177. Preserve the
  // complete -6 example when the modern, once-playing page reaches its end.
  const preserveNegativeExample = props.frame >= 177
    && frameDomain === "sprite-53"
    && props.scenario === "source-static-frame"
    && props.lang === "en"
    && !props.entryStateSha256;
  const signedExampleState = useMemo(() => sourceStaticCandidate.getFrameState(176, {
    frameDomain,
    lang: props.lang,
    scenario: props.scenario,
    seed: props.seed,
    requirementId: props.requirementId,
    traceId: props.traceId,
  }), [frameDomain, props.lang, props.scenario, props.seed, props.requirementId, props.traceId]);
  return <SourceStaticRenderer {...props}
    frame={preserveNegativeExample ? 176 : props.frame}
    state={preserveNegativeExample ? signedExampleState : props.state}
  />;
}
const candidate = createCourseG04L03SourceGlossaryCandidate(
  {...sourceStaticCandidate, Renderer: NegativeNumberPresentation},
  COURSE_G04_L03_VB_005_GLOSSARY_CONFIG,
);

export {COURSE_G04_L03_VB_005_GLOSSARY_HOTSPOTS, COURSE_G04_L03_VB_005_SOURCE};
export const COURSE_G04_L03_VB_005_MOVIE = sourceStaticCandidate.movie;
export const COURSE_G04_L03_VB_005_RUNTIME = sourceStaticCandidate.runtime;
export const COURSE_G04_L03_VB_005_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L03_VB_005_SCENARIOS = sourceStaticCandidate.scenarios;
export const normalizeCourseG04L03Vb005Frame = sourceStaticCandidate.normalizeFrame;
export const getCourseG04L03Vb005FrameState = sourceStaticCandidate.getFrameState;
export const buildCourseG04L03Vb005CaptureAttributes =
  sourceStaticCandidate.buildCaptureAttributes;
export const CourseG04L03Vb005Renderer = candidate.Renderer;

export default candidate.module;
