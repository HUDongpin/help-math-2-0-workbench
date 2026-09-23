import assert from "node:assert/strict";
import {mkdtemp, mkdir, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  G4_L10_DECLARATION_REPORT_RELATIVE,
  INDEPENDENT_DOMAIN_SCENARIO_ID,
  assertAcceptanceNeutralManifestTransition,
  buildIndependentFrameDomainDeclaration,
  commitAtomicEntries,
  materializeG4L10IndependentFrameDomainDeclarations,
  parseArguments,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";

const digest = "a".repeat(64);

function claim() {
  return {
    timelineId: "sprite-7",
    sourceObjectId: "7",
    frameCount: 3,
    parentTimelineIds: ["sprite-2"],
    disposition: "independent-required",
    role: "multi-frame-local-action-independent-domain",
    claimScope: "separate-local-frame-action-domain-required",
    sourceProof: {
      directDoActionTagCount: 2,
      ffdecFrameScriptCount: 2,
      swfmillDoActionFrames: [1, 3],
      ffdecFrameScriptFrames: [1, 3],
      swfmillDoActionFrameSequenceSha256: digest,
      ffdecFrameScriptFrameSequenceSha256: digest,
      localActionFrameSequenceEncoding: "one-indexed-decimal-frame-newline-v1",
      exactDoActionToFfdecFrameScriptCount: true,
      exactDoActionToFfdecFrameSequence: true,
    },
  };
}

test("builds a conservative root-envelope declaration with exact proof lineage", () => {
  const domain = buildIndependentFrameDomainDeclaration({
    claim: claim(),
    evidenceRecord: {
      path: "migrations/example/audit/source-proven-independent-frame-domain-evidence.json",
      sha256: digest,
    },
    claimIndex: 4,
  });
  assert.equal(domain.id, "sprite-7");
  assert.equal(domain.sourceTimelineId, "sprite-7");
  assert.equal(domain.parentFrameDomainId, "root");
  assert.deepEqual(domain.sourceParentTimelineIds, ["sprite-2"]);
  assert.deepEqual(domain.scenarioIds, [INDEPENDENT_DOMAIN_SCENARIO_ID]);
  assert.equal(domain.sourceProof.claimIndex, 4);
  assert.equal(domain.sourceProof.actionFrameSequenceSha256, digest);
  assert.equal(domain.sourceProof.authoritativeRuntimeEntryEstablished, false);
});

test("rejects an equal-count shifted local-action sequence", () => {
  const shifted = claim();
  shifted.sourceProof.ffdecFrameScriptFrames = [1, 2];
  assert.throws(
    () => buildIndependentFrameDomainDeclaration({
      claim: shifted,
      evidenceRecord: {path: "migrations/example/audit/evidence.json", sha256: digest},
      claimIndex: 0,
    }),
    /local-action frame sequence is not exact/,
  );
});

test("acceptance-neutral transition guard rejects status or review drift", () => {
  const before = {
    animationId: "example",
    status: "preserved",
    scenarios: [{id: "default"}],
    implementation: {frameDomains: [{id: "root"}]},
    acceptance: {ownerReview: {decision: "pending"}},
  };
  const after = structuredClone(before);
  after.scenarios.push({id: INDEPENDENT_DOMAIN_SCENARIO_ID});
  after.implementation.frameDomains.push({id: "sprite-7"});
  assert.equal(assertAcceptanceNeutralManifestTransition(before, after), true);
  const promoted = structuredClone(after);
  promoted.status = "complete";
  assert.throws(
    () => assertAcceptanceNeutralManifestTransition(before, promoted),
    /outside scenarios\/frameDomains|acceptance-bearing status/,
  );
});

test("multi-file transaction rolls back every installed target on a late fault", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "l10-domain-transaction-"));
  try {
    await mkdir(path.join(root, "x"));
    await writeFile(path.join(root, "x", "a.json"), "old-a\n");
    await writeFile(path.join(root, "x", "b.json"), "old-b\n");
    const entries = [
      {path: "x/a.json", rendered: "new-a\n", bytes: 6, sha256: "54578a36036ade573160b2eb3ba5d8557897aa8c6b4ce4742e556d37eb81c680"},
      {path: "x/b.json", rendered: "new-b\n", bytes: 6, sha256: "550d594f5d87bd540b72a207fd32c27894f378088bd355d4f0b2bb7d43e58df9"},
    ];
    await assert.rejects(
      commitAtomicEntries(entries, {
        projectRoot: root,
        hooks: {
          afterInstall: ({index}) => {
            if (index === 1) throw new Error("synthetic late fault");
          },
        },
      }),
      /synthetic late fault/,
    );
    assert.equal(await readFile(path.join(root, "x", "a.json"), "utf8"), "old-a\n");
    assert.equal(await readFile(path.join(root, "x", "b.json"), "utf8"), "old-b\n");
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("live L10 historical declaration materializer fails closed after wave3", async () => {
  await assert.rejects(
    () => materializeG4L10IndependentFrameDomainDeclarations({mode: "dry-run"}),
    /post-declaration disposition totals/,
  );

  const receipt = JSON.parse(
    await readFile(G4_L10_DECLARATION_REPORT_RELATIVE, "utf8"),
  );
  assert.equal(receipt.summary.affectedMembers, 40);
  assert.equal(receipt.summary.childFrameDomainsDeclared, 213);
  assert.equal(receipt.summary.declaredLocalFrames, 21734);
  assert.equal(receipt.summary.matchedDirectDoActionFrames, 746);
  assert.equal(receipt.summary.actionFrameSequenceMismatchCount, 0);
  assert.equal(receipt.summary.newlyEnumeratedEnEsCoverageRequirements, 426);
  assert.deepEqual(receipt.summary.afterDispositionTotals, {
    declared: 260,
    composite: 751,
    independentRequired: 0,
    unresolved: 77,
    nonvisual: 0,
    excludedNotProven: 210,
  });
  assert(Object.values(receipt.acceptanceBoundary).every((value) => value === false));
  assert.match(receipt.strictAcceptanceEffect, /^none;/);
});

test("CLI accepts exactly one bounded execution mode", () => {
  assert.deepEqual(parseArguments(["--dry-run"]), {help: false, mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {help: false, mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {help: false, mode: "check"});
  assert.throws(() => parseArguments([]), /choose exactly one/);
  assert.throws(() => parseArguments(["--apply", "--check"]), /choose exactly one/);
  assert.throws(() => parseArguments(["--publish"]), /Unknown option/);
});
