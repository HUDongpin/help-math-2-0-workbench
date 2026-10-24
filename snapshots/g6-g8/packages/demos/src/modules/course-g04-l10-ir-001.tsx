"use client";

import React from "react";

import type {AnimationRendererProps, AudioCue} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_IR_001_CONFIG,
  COURSE_G04_L10_IR_001_SOURCE,
} from "../timelines/course-g04-l10-ir-001";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_IR_001_CONFIG,
);

export const COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "random-sound-0",
      sourceCueId: "sprite-5-soundstream-1",
      frame: 1,
      endFrame: 136,
      frameDomain: "sprite-31",
      language: "shared" as const,
      seedModulo: Object.freeze({divisor: 2, remainder: 0}),
      source:
        "/flash-assets/courses/course-g04-l10-ir-001/audio/embedded-stream-0001.mp3?sha256=b731347f2cd4ced88f5f86b21a1339a882821c42def7212b7b8aa15d72f31310",
      durationMs: 11337,
      sha256:
        "b731347f2cd4ced88f5f86b21a1339a882821c42def7212b7b8aa15d72f31310",
      spokenLanguage: "undetermined" as const,
    }),
    Object.freeze({
      id: "random-sound-1",
      sourceCueId: "sprite-6-soundstream-2",
      frame: 1,
      endFrame: 136,
      frameDomain: "sprite-31",
      language: "shared" as const,
      seedModulo: Object.freeze({divisor: 2, remainder: 1}),
      source:
        "/flash-assets/courses/course-g04-l10-ir-001/audio/embedded-stream-0002.mp3?sha256=2112a8b5764792dd64ab2955e55e02b8850e2a677efd8f71e34f91fc608604ad",
      durationMs: 11337,
      sha256:
        "2112a8b5764792dd64ab2955e55e02b8850e2a677efd8f71e34f91fc608604ad",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

function CourseG04L10Ir001PrivateRenderer(
  props: AnimationRendererProps,
) {
  return (
    <div
      data-audio-acceptance="pending"
      data-audio-candidate-count="2"
      data-behavior-parity-established="false"
      data-calibration-id="g4-l10-candidate-to-product-v5"
      data-complexity-lane="behavior-heavy"
      data-private-current-js="true"
      data-random-selection={`seed-modulo-2-remainder-${props.seed % 2}`}
      data-source-random-expression="random(2)"
      data-strict-acceptance-effect="none"
    >
      <candidate.Renderer {...props} />
    </div>
  );
}

const privateModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
  audioCues: COURSE_G04_L10_IR_001_PRIVATE_AUDIO_CUES,
  Renderer: CourseG04L10Ir001PrivateRenderer,
});

export {COURSE_G04_L10_IR_001_SOURCE};
export const COURSE_G04_L10_IR_001_MOVIE = candidate.movie;
export const COURSE_G04_L10_IR_001_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_IR_001_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_IR_001_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ir001Frame = candidate.normalizeFrame;
export const getCourseG04L10Ir001FrameState = candidate.getFrameState;
export const buildCourseG04L10Ir001CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ir001Renderer =
  CourseG04L10Ir001PrivateRenderer;

export default privateModule;
