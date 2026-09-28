import assert from "node:assert/strict";
import test from "node:test";

import {buildMatrix, renderMarkdown} from "./build-current-js-1751-acceptance-matrix.mjs";

test("the acceptance-neutral matrix remains bound to the Owner-approved 1,751 page denominator", async () => {
  const matrix = await buildMatrix();
  assert.equal(matrix.scope.activePageOccurrences, 1751);
  assert.equal(matrix.scope.lessonCount, 29);
  assert.equal(matrix.summary.activePageOccurrences, 1751);
  assert.equal(matrix.summary.currentJsRegisteredOccurrences, 426);
  assert.equal(matrix.summary.currentJsRegisteredUniqueAnimations, 425);
  assert.equal(matrix.summary.currentJsRegisteredSwfMachineAudits, 195);
  assert.equal(matrix.summary.currentJsRegisteredAudioMachineAudits, 195);
  assert.equal(matrix.summary.currentJsRegisteredImplementationCaptureAdoptionFiles, 59);
  assert.equal(matrix.summary.currentJsRegisteredImplementationCaptureRequirements, 105);
  assert.equal(matrix.summary.currentJsRegisteredImplementationCaptureFrames, 22112);
  assert.equal(matrix.summary.currentJsRegisteredFullFrameCoverageFiles, 195);
  assert.equal(matrix.summary.currentJsRegisteredFullFrameCoverageRequirements, 1261);
  assert.equal(matrix.summary.fullFrameCoverageComplete, 0);
  assert.equal(matrix.summary.fidelityAccepted, 0);
  assert.equal(matrix.summary.audioAccepted, 0);
  assert.equal(matrix.summary.humanVisualAccepted, 0);
  assert.equal(matrix.summary.ownerAccepted, 0);
  assert.equal(matrix.acceptanceEffects.fidelity, false);
  assert.equal(matrix.acceptanceEffects.audio, false);
  assert.equal(matrix.acceptanceEffects.humanVisualReview, false);
  assert.equal(matrix.acceptanceEffects.ownerAcceptance, false);
  assert.match(renderMarkdown(matrix), /acceptance-neutral/);
});
