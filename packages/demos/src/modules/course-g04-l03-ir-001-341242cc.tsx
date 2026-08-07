"use client";
import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";
import {COURSE_G04_L03_IR_001_341242CC_CONFIG, COURSE_G04_L03_IR_001_341242CC_SOURCE} from "../timelines/course-g04-l03-ir-001-341242cc";

const audioCandidate = Object.freeze({
  audioCues: Object.freeze([
    Object.freeze({
      id: "course-g04-l03-ir-001-341242cc-random-audio-outcome-0",
      sourceCueId: "sprite-9-sound-stream-1",
      frame: 5,
      frameDomain: "sprite-27",
      language: "en" as const,
      scenario: "source-static-frame",
      seedModulo: Object.freeze({divisor: 2, remainder: 0}),
      source:
        "/flash-assets/courses/course-g04-l03-ir-001-341242cc/audio/random-audio-outcome-0.mp3",
      durationMs: 11_180,
      sha256:
        "9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff",
      spokenLanguage: "undetermined" as const,
    }),
    Object.freeze({
      id: "course-g04-l03-ir-001-341242cc-random-audio-outcome-1",
      sourceCueId: "sprite-10-sound-stream-2",
      frame: 5,
      frameDomain: "sprite-27",
      language: "en" as const,
      scenario: "source-static-frame",
      seedModulo: Object.freeze({divisor: 2, remainder: 1}),
      source:
        "/flash-assets/courses/course-g04-l03-ir-001-341242cc/audio/random-audio-outcome-1.mp3",
      durationMs: 11_180,
      sha256:
        "d90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420",
      spokenLanguage: "undetermined" as const,
    }),
  ]),
  audioTracks: Object.freeze([]),
});

const candidate = createSourceStaticCanvasCandidate(
  COURSE_G04_L03_IR_001_341242CC_CONFIG,
  audioCandidate,
);
export {COURSE_G04_L03_IR_001_341242CC_SOURCE};
export const COURSE_G04_L03_IR_001_341242CC_MOVIE = candidate.movie;
export const COURSE_G04_L03_IR_001_341242CC_RUNTIME = candidate.runtime;
export const COURSE_G04_L03_IR_001_341242CC_SOURCE_CONTRACT = candidate.sourceContract;
export const getCourseG04L03Ir001341242ccFrameState = candidate.getFrameState;
export const CourseG04L03Ir001341242ccRenderer = candidate.Renderer;
export default candidate.module;
