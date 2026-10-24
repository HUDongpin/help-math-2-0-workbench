"use client";

import React from "react";

import type {AnimationRendererProps, AudioCue, AudioTrack} from "../contract";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {
  COURSE_G04_L10_TS_006_CONFIG,
  COURSE_G04_L10_TS_006_SOURCE,
} from "../timelines/course-g04-l10-ts-006";

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L10_TS_006_CONFIG,
);

export const COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES: readonly AudioCue[] =
  Object.freeze([
    Object.freeze({
      id: "embedded-stream-0001",
      sourceCueId: "sprite-13-soundstream-1",
      frame: 1,
      endFrame: 246,
      frameDomain: "sprite-13",
      language: "en" as const,
      scenario: "source-static-frame",
      source:
        "/flash-assets/courses/course-g04-l10-ts-006/audio/embedded-stream-0001.mp3?sha256=d27c65e6bd7b9087b168e2a54ff60568e9481c84bd9996b87ef50392d8cc77e6",
      durationMs: 20402,
      sha256:
        "d27c65e6bd7b9087b168e2a54ff60568e9481c84bd9996b87ef50392d8cc77e6",
      spokenLanguage: "undetermined" as const,
    }),
  ]);

export const COURSE_G04_L10_TS_006_PRIVATE_AUDIO_TRACKS: readonly AudioTrack[] =
  Object.freeze([
    Object.freeze({
      id: "spanish-host-narration",
      language: "es" as const,
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l10-ts-006/audio/spanish-host-narration.mp3?sha256=c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
      durationMs: 7632,
      sha256:
        "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
      activation: "user" as const,
      visibleWhen: Object.freeze(["es" as const]),
      frameDomains: Object.freeze(["sprite-13"]),
      timelineBehavior: "pause-while-playing" as const,
    }),
  ]);

function CourseG04L10Ts006PrivateRenderer(
  props: AnimationRendererProps,
) {
  return (
    <div
      data-audio-acceptance="pending"
      data-audio-disposition="embedded-en-engineering-cue-plus-es-user-track"
      data-behavior-parity-established="false"
      data-calibration-id="g4-l10-candidate-to-product-v5"
      data-complexity-lane="low"
      data-private-current-js="true"
      data-reachable-source-interaction="none"
      data-source-actionscript-executed="false"
      data-source-reachability="root-frame-6-to-sprite-13"
      data-spoken-language-accepted="false"
      data-strict-acceptance-effect="none"
    >
      <candidate.Renderer {...props} />
    </div>
  );
}

const privateModule = Object.freeze({
  ...candidate.module,
  maturity: "private-current-js" as const,
  audioCues: COURSE_G04_L10_TS_006_PRIVATE_AUDIO_CUES,
  audioTracks: COURSE_G04_L10_TS_006_PRIVATE_AUDIO_TRACKS,
  Renderer: CourseG04L10Ts006PrivateRenderer,
});

export {COURSE_G04_L10_TS_006_SOURCE};
export const COURSE_G04_L10_TS_006_MOVIE = candidate.movie;
export const COURSE_G04_L10_TS_006_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_TS_006_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_TS_006_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Ts006Frame = candidate.normalizeFrame;
export const getCourseG04L10Ts006FrameState = candidate.getFrameState;
export const buildCourseG04L10Ts006CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Ts006Renderer =
  CourseG04L10Ts006PrivateRenderer;

export default privateModule;
