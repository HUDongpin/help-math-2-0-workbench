"use client";

import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";
import {
  COURSE_G04_L10_VB_003_CONFIG,
  COURSE_G04_L10_VB_003_SOURCE,
} from "../timelines/course-g04-l10-vb-003";

export const COURSE_G04_L10_VB_003_GLOSSARY_TERMS = Object.freeze([
  Object.freeze({
    id: "unit-of-measurement",
    sourceKeyAttribute: "Unit of measurement",
    sourceCharacterId: 10,
    firstFrame: 3,
    labels: Object.freeze({
      en: "Unit of measurement",
      es: "Unidad de medición",
    }),
  }),
  Object.freeze({
    id: "quantity",
    sourceKeyAttribute: "Quantity",
    sourceCharacterId: 11,
    firstFrame: 3,
    labels: Object.freeze({en: "Quantity", es: "Cantidad"}),
  }),
  Object.freeze({
    id: "length",
    sourceKeyAttribute: "Length",
    sourceCharacterId: 15,
    firstFrame: 51,
    labels: Object.freeze({en: "Length", es: "Longitud"}),
  }),
] as const);
const candidate = createPrivateSourceStaticGlossaryCandidate(
  COURSE_G04_L10_VB_003_CONFIG,
  Object.freeze({
    calibrationId: "g4-l10-candidate-to-product-v5",
    companionSurfaceId: "g4-l10-vb003-glossary",
    glossaryTerms: COURSE_G04_L10_VB_003_GLOSSARY_TERMS,
  }),
);

export {COURSE_G04_L10_VB_003_SOURCE};
export const COURSE_G04_L10_VB_003_MOVIE = candidate.movie;
export const COURSE_G04_L10_VB_003_RUNTIME = candidate.runtime;
export const COURSE_G04_L10_VB_003_SOURCE_CONTRACT = candidate.sourceContract;
export const COURSE_G04_L10_VB_003_SCENARIOS = candidate.scenarios;
export const normalizeCourseG04L10Vb003Frame = candidate.normalizeFrame;
export const getCourseG04L10Vb003FrameState = candidate.getFrameState;
export const buildCourseG04L10Vb003CaptureAttributes =
  candidate.buildCaptureAttributes;
export const CourseG04L10Vb003Renderer = candidate.Renderer;

export default candidate.module;
