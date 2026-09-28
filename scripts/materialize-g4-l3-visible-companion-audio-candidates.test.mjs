import assert from "node:assert/strict";
import test from "node:test";

import {
  materializeG4L3VisibleCompanionAudioCandidates,
} from "./materialize-g4-l3-visible-companion-audio-candidates.mjs";

test("visible companion audio candidates remain exact, bounded, and acceptance-neutral", async () => {
  const result = await materializeG4L3VisibleCompanionAudioCandidates({
    check: true,
  });
  assert.deepEqual(result, {
    check: true,
    pageCount: 3,
    visibleCompanionCueCount: 25,
    unresolvedCompanionCueCount: 4,
    stagedAssetCount: 25,
    strictAcceptanceEffect: "none",
  });
});
