"use client";

import {createAlgL11Behavior10CandidateCore} from
  "./g678-alg-l11-behavior10-tranche-b-candidate-core";
import type {AlgL11Behavior10PageConfig} from
  "./g678-alg-l11-behavior10-tranche-b-state";

export function createAlgL11Behavior10GuidedCandidate(
  config: AlgL11Behavior10PageConfig,
) {
  if (config.familyId !== "l11-guided-tutorial-choice" ||
    config.guidedHits.length !== 5 || !config.help.staleAngleOverlay ||
    config.help.staleAngleOverlay.suppressedByMaintainedCandidate !== true) {
    throw new Error("ALG L11 behavior10 guided wrapper scope drifted");
  }
  return createAlgL11Behavior10CandidateCore(config, "guided");
}
