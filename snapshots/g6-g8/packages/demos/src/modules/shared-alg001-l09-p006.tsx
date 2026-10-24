"use client";

import {createPrivateSourceStaticAlgL09TerminalStopCandidate} from "../private-source-static-alg-l09-terminal-stop-candidate";
import {SHARED_ALG001_L09_P006_CONFIG, SHARED_ALG001_L09_P006_SOURCE} from "../timelines/shared-alg001-l09-p006";

export const SHARED_ALG001_L09_P006_GLOSSARY_TERMS = Object.freeze([] as const);

const candidate = createPrivateSourceStaticAlgL09TerminalStopCandidate(SHARED_ALG001_L09_P006_CONFIG, Object.freeze({
  calibrationId: "g678-alg-l09-terminal-stop-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l09-p006-glossary",
  glossaryTerms: SHARED_ALG001_L09_P006_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L09_P006_SOURCE};
export const SHARED_ALG001_L09_P006_MOVIE = candidate.movie;
export const SHARED_ALG001_L09_P006_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L09_P006_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L09_P006_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L09_P006_RENDERER = candidate.Renderer;
export default animationModule;
