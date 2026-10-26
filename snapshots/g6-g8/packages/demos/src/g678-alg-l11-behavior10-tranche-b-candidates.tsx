"use client";

import {createAlgL11Behavior10GuidedCandidate} from
  "./g678-alg-l11-behavior10-tranche-b-guided-candidate";
import {
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES,
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC,
} from "./g678-alg-l11-behavior10-tranche-b-state";
import {createAlgL11Behavior10TutorialCandidate} from
  "./g678-alg-l11-behavior10-tranche-b-tutorial-candidate";

const candidates = G678_ALG_L11_BEHAVIOR10_TRANCHE_B_PAGES.map((config) =>
  config.familyId === "l11-tutorial-multi-question-choice"
    ? createAlgL11Behavior10TutorialCandidate(config)
    : createAlgL11Behavior10GuidedCandidate(config));

function candidate(animationId: string) {
  const value = candidates.find((entry) =>
    entry.config.animationId === animationId);
  if (!value) throw new Error(`${animationId}: behavior10 candidate missing`);
  return value;
}

export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P026_CANDIDATE =
  candidate("shared-alg001-l11-p026");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P027_CANDIDATE =
  candidate("shared-alg001-l11-p027");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P028_CANDIDATE =
  candidate("shared-alg001-l11-p028");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P029_CANDIDATE =
  candidate("shared-alg001-l11-p029");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P030_CANDIDATE =
  candidate("shared-alg001-l11-p030");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P031_CANDIDATE =
  candidate("shared-alg001-l11-p031");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P032_CANDIDATE =
  candidate("shared-alg001-l11-p032");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P040_CANDIDATE =
  candidate("shared-alg001-l11-p040");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P041_CANDIDATE =
  candidate("shared-alg001-l11-p041");
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_P042_CANDIDATE =
  candidate("shared-alg001-l11-p042");

export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATES = Object.freeze(
  candidates,
);
export const G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES =
  Object.freeze(candidates.map((entry) => entry.module));

if (G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC
  .registrationCandidatePlacementCount !== 0 ||
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_SPEC
    .currentJavaScriptRegisteredPlacementCount !== 0 ||
  G678_ALG_L11_BEHAVIOR10_TRANCHE_B_CANDIDATE_MODULES.some((module) =>
    module.maturity !== "private-current-js")) {
  throw new Error("behavior10 tranche-b candidates may not self-register");
}
