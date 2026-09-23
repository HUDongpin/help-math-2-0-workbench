import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG4L3MultiFrameDispositionCandidates,
  validateG4L3MultiFrameDispositionCandidates,
} from "./build-g4-l3-multi-frame-disposition-candidates.mjs";

test("checked-in G4 L3 multi-frame candidate report is deterministic and acceptance-neutral", async () => {
  const {action, document} = await buildG4L3MultiFrameDispositionCandidates({check: true});
  assert.equal(action, "verified");
  assert.equal(document.scope.memberCount, 37);
  assert.equal(document.summary.undeclaredReachableMultiFrameCount, document.summary.eligibleCandidateCount + document.summary.excludedCandidateCount);
  assert.equal(document.acceptance.frameDomainDispositionEstablished, false);
  assert.equal(document.acceptance.strictMigrationComplete, false);
});

test("G4 L3 multi-frame candidate report rejects promotion and incomplete partition", async () => {
  const {document} = await buildG4L3MultiFrameDispositionCandidates({check: true});
  const promoted = structuredClone(document);
  promoted.acceptance.frameDomainDispositionEstablished = true;
  assert.throws(() => validateG4L3MultiFrameDispositionCandidates(promoted), /must remain false/);

  const weakened = structuredClone(document);
  const member = weakened.members.find((item) => item.eligibleCandidateCount > 0);
  member.eligibleCandidates[0].disqualifiers.push("forged");
  assert.throws(() => validateG4L3MultiFrameDispositionCandidates(weakened), /eligible multi-frame candidate is weakened/);
});
