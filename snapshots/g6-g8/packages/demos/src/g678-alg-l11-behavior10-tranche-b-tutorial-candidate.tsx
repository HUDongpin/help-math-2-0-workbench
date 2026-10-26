"use client";

import {createAlgL11Behavior10CandidateCore} from
  "./g678-alg-l11-behavior10-tranche-b-candidate-core";
import type {AlgL11Behavior10PageConfig} from
  "./g678-alg-l11-behavior10-tranche-b-state";

export function createAlgL11Behavior10TutorialCandidate(
  config: AlgL11Behavior10PageConfig,
) {
  if (config.familyId !== "l11-tutorial-multi-question-choice" ||
    config.guidedHits.length !== 0 || config.help.staleAngleOverlay !== null) {
    throw new Error("ALG L11 behavior10 tutorial wrapper scope drifted");
  }
  return createAlgL11Behavior10CandidateCore(config, "tutorial");
}
