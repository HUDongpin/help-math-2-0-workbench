import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG4L3SingleFrameDispositionCandidates,
  validateG4L3SingleFrameDispositionCandidates,
} from "./build-g4-l3-single-frame-disposition-candidates.mjs";

test("checked-in G4 L3 single-frame candidate report is deterministic and acceptance-neutral", async () => {
  const {action, document} = await buildG4L3SingleFrameDispositionCandidates({check: true});
  assert.equal(action, "verified");
  assert.equal(document.scope.memberCount, 37);
  assert.ok(document.summary.eligibleCandidateCount > 0);
  assert.equal(document.acceptance.frameDomainDispositionEstablished, false);
  assert.equal(document.acceptance.strictMigrationComplete, false);
});

test("G4 L3 single-frame candidate report rejects promotion and weakened proof", async () => {
  const {document} = await buildG4L3SingleFrameDispositionCandidates({check: true});
  const promoted = structuredClone(document);
  promoted.acceptance.frameDomainDispositionEstablished = true;
  assert.throws(() => validateG4L3SingleFrameDispositionCandidates(promoted), /must remain false/);

  const weakened = structuredClone(document);
  const member = weakened.members.find((item) => item.eligibleCandidates.length > 0);
  member.eligibleCandidates[0].sourceProof.ffdecFrameScriptCount = 1;
  assert.throws(() => validateG4L3SingleFrameDispositionCandidates(weakened), /ffdecFrameScriptCount must be zero/);
});
