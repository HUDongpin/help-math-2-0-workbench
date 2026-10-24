"use client";

import {createPrivateSourceStaticAlgL11IntroTerminalCandidate} from "../private-source-static-alg-l11-intro-terminal-candidate";
import {SHARED_ALG001_L11_P001_CONFIG, SHARED_ALG001_L11_P001_SOURCE} from "../timelines/shared-alg001-l11-p001";

export const SHARED_ALG001_L11_P001_GLOSSARY_TERMS = Object.freeze([] as const);

const candidate = createPrivateSourceStaticAlgL11IntroTerminalCandidate(SHARED_ALG001_L11_P001_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l11-intro-terminal-tranche1-engineering-v1",
  companionSurfaceId: "shared-alg001-l11-p001-glossary",
  glossaryTerms: SHARED_ALG001_L11_P001_GLOSSARY_TERMS,
  sourceStopDisposition: "script-free-intro-modern-once-clamp",
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L11_P001_SOURCE};
export const SHARED_ALG001_L11_P001_MOVIE = candidate.movie;
export const SHARED_ALG001_L11_P001_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L11_P001_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L11_P001_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L11_P001_RENDERER = candidate.Renderer;
export default animationModule;
