import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  analyzeSuccessorEvidence,
  assertEpochSha256,
  assertPlanSafety,
  buildPlanDocument,
  parseArguments,
  serializePlan,
  validateFrozenClosureTripleIdentity,
  validateRejectedV1Identity,
  validateRuntimeAlignment,
  validateSqlAggregate,
  writeAtomicExact,
} from "./build-g4-ledger-successor-promotion-plan.mjs";

const testProjectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function inspectedBytes(bytes, mode) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return {
    bytes: buffer,
    byteCount: buffer.length,
    sha256: sha256(buffer),
    mode,
  };
}

function frozenTripleFixture() {
  const appliedName = "combined-freeze-applied-receipt-v1.json";
  const manifestName = "combined-freeze-manifest-v1.jsonl";
  const sidecarName = "combined-freeze-applied-receipt-v1.sha256";
  const recordManifest = inspectedBytes(
    '{"root":"v7","path":"fixture","bytes":1,"sha256":"fixture"}\n',
    0o400,
  );
  const appliedReceipt = inspectedBytes(
    `${JSON.stringify({
      schemaVersion: "help-math-drive-intake-combined-freeze-applied/v1",
      outcome: "frozen-read-only-with-unresolved-independent-review",
      recordManifest: {
        name: manifestName,
        bytes: recordManifest.byteCount,
        sha256: recordManifest.sha256,
      },
    })}\n`,
    0o400,
  );
  const appliedReceiptSidecar = inspectedBytes(
    `${appliedReceipt.sha256}  ${appliedName}\n`,
    0o400,
  );
  const triple = { appliedReceipt, recordManifest, appliedReceiptSidecar };
  const expectedIdentities = {
    appliedReceipt: {
      name: appliedName,
      bytes: appliedReceipt.byteCount,
      sha256: appliedReceipt.sha256,
      mode: 0o400,
    },
    recordManifest: {
      name: manifestName,
      bytes: recordManifest.byteCount,
      sha256: recordManifest.sha256,
      mode: 0o400,
    },
    appliedReceiptSidecar: {
      name: sidecarName,
      bytes: appliedReceiptSidecar.byteCount,
      sha256: appliedReceiptSidecar.sha256,
      mode: 0o400,
    },
  };
  return { triple, expectedIdentities };
}

function fixtureEvidence() {
  const missing = Array.from({ length: 16 }, (_, index) => ({
    canonicalPath: `HELP_COURSES/ELMGR4/L2/SA/MISSING${String(index + 1).padStart(2, "0")}.mp3`,
    sourceType: "runtime-bound-audio",
    bindingReason: "fixture-source-binding",
    bindingEvidence: "fixture-current-alignment-binding",
    audioBindingKind: "ordinary-spanish-page",
    language: "es",
    requiredBy: ["HELP_COURSES/ELMGR4/L2/IN/L2IN01.swf"],
  }));
  const frozen = {
    ledgerSha256: new Set(["a".repeat(64), "b".repeat(64)]),
    privatePlacementMetadata: new Set(["private/not-shared"]),
    input: {
      appliedReceipt: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: "combined-freeze-applied-receipt-v1.json",
        bytes: 8_375,
        sha256: "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
        outcome: "frozen-read-only-with-unresolved-independent-review",
      },
      recordManifest: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: "combined-freeze-manifest-v1.jsonl",
        bytes: 3_231_021,
        sha256: "1be3672f9a9337982b6b37cb2bce4a298a2f855a95ac3ba5f31e9443372926a4",
      },
      appliedReceiptSidecar: {
        artifactToken: "frozen-v7-v8-combined-closure",
        name: "combined-freeze-applied-receipt-v1.sha256",
        bytes: 106,
        sha256: "fb8c00a90926b2ae2ae6d371781e9dc66e491dab10d2e6b99ea19a1c0c32c750",
      },
    },
    summary: { uniqueSha256Count: 2 },
  };
  const canonical = {
    canonicalSha256: new Set(["c".repeat(64)]),
    input: {},
    summary: {},
  };
  const predecessor = {
    closureSha256: new Set(["d".repeat(64)]),
    runtimeSha256: new Set(["e".repeat(64)]),
    placementMetadata: new Set(["HELP_COURSES/ELMGR4/L1/GS/L1GS01.swf"]),
    missing,
    input: {},
    summary: {},
  };
  const alignment = {
    runtimeSha256: new Set(["f".repeat(64)]),
    categorySha256: {
      activePages: new Set(["f".repeat(64)]),
      lessonShells: new Set(["1".repeat(64)]),
      sequenceAuthorityXml: new Set(["2".repeat(64)]),
      presentAudio: new Set(["3".repeat(64)]),
    },
    missing,
    input: {
      path: "catalog/alignments/g4-curriculum-runtime-dependency-map-v1.json",
      bytes: 2_272_953,
      sha256: "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
    },
    summary: {
      keyTermCandidateReviewHolds: {
        total: 316,
        caseVariantPlacement: 299,
        exactPlacementShaReceipt: 17,
        admittedByThisPlan: 0,
      },
      residualKeyTermBlocker: {
        count: 1,
        expectedPath: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Polynomial.swf",
        expectedSha256: null,
        candidatePresent: false,
        runtimeSwfPresent: false,
        companionFla: {
          canonicalPath: "HELP_KEYTERMS/KT/ELEMENTARY/DIG/polynomial.fla",
          bytes: 19_456,
          sha256: "4281f3dbde526f0f7e8e445efd4f61893566ad6308c0236816d07baa16a89263",
          quarantinePresent: true,
          quarantineIdentityBoundBy: {
            intakePlanPath: "private-quarantine/dig-intake-plan.json",
            intakePlanBytes: 1_975_727,
            intakePlanSha256:
              "2ab69de16a2ef27772e034bf951c53b09e28a58c1b93c88f0ec219243f2f2868",
          },
          canonicalPresent: false,
          custody: "candidate-new-source-in-private-quarantine",
        },
        flaDoesNotSubstituteForShippedRuntime: true,
        status: "required-unresolved-source",
        admittedByThisPlan: 0,
      },
    },
  };
  const sql = {
    input: {
      path: "reports/g4-sql-course-aggregate.json",
      bytes: 18_671,
      sha256: "7c8343e920cf3326125597bc905400952123942b1c77b383fd4fee07fe21e8b2",
    },
    summary: { role: "historical-aggregate-context-only" },
  };
  const rejectedV1 = {
    input: {
      path: "catalog/source-promotions/g4-runtime-dependency-successor-2026-08-04.json",
      bytes: 16_276,
      sha256: "8bd2d9a721566ec511325f6dfae4ad0e3638093b0cdf25810ad8eb3dc0d4dabf",
    },
    candidate: {
      requiredUnresolvedSources: missing.map((record) => ({
        ...record,
        expectedSha256: null,
      })),
    },
    summary: { disposition: "rejected-runtime-alignment-epoch-not-bound" },
  };
  const supersededV2 = {
    input: {
      path: "catalog/source-promotions/g4-runtime-dependency-successor-v2-2026-08-04.json",
      bytes: 20_909,
      sha256: "5b6b743fb7c317812026352f67cfc0696a060a661d6c996ad85a3bcf59dd2226",
    },
    summary: {
      disposition: "superseded-p2-polynomial-and-identity-regression-gaps",
      preservedByteForByte: true,
      reusableForPromotion: false,
      promotionRecordCount: 0,
      requiredUnresolvedSourceCount: 16,
      p2Findings: [
        "residual-Polynomial-runtime-blocker-not-explicitly-cross-validated",
        "frozen-triple-and-rejected-v1-mutation-regressions-not-covered",
      ],
      acceptanceEffect: false,
    },
  };
  return {
    frozen,
    canonical,
    predecessor,
    alignment,
    sql,
    rejectedV1,
    supersededV2,
  };
}

test("parses only explicit write or check modes", () => {
  assert.deepEqual(parseArguments(["--write"]), { help: false, mode: "write" });
  assert.deepEqual(parseArguments(["--check"]), { help: false, mode: "check" });
  assert.deepEqual(parseArguments(["--help"]), { help: true });
  assert.throws(() => parseArguments([]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--write", "--check"]), /Choose exactly one/);
  assert.throws(() => parseArguments(["--apply"]), /Unknown argument/);
});

test("frozen closure triple identity fails on receipt, manifest, sidecar, or mode mutation", () => {
  const { triple, expectedIdentities } = frozenTripleFixture();
  assert.doesNotThrow(() => validateFrozenClosureTripleIdentity({
    ...triple,
    expectedIdentities,
  }));

  const appliedReceipt = inspectedBytes(
    Buffer.concat([triple.appliedReceipt.bytes, Buffer.from(" ")]),
    0o400,
  );
  assert.throws(
    () => validateFrozenClosureTripleIdentity({
      ...triple,
      appliedReceipt,
      expectedIdentities,
    }),
    /Frozen applied receipt byte count changed/,
  );

  const recordManifest = inspectedBytes(
    Buffer.concat([triple.recordManifest.bytes, Buffer.from(" ")]),
    0o400,
  );
  assert.throws(
    () => validateFrozenClosureTripleIdentity({
      ...triple,
      recordManifest,
      expectedIdentities,
    }),
    /Frozen record manifest byte count changed/,
  );

  const appliedReceiptSidecar = inspectedBytes(
    Buffer.from(`${"0".repeat(64)}  ${expectedIdentities.appliedReceipt.name}\n`),
    0o400,
  );
  assert.throws(
    () => validateFrozenClosureTripleIdentity({
      ...triple,
      appliedReceiptSidecar,
      expectedIdentities,
    }),
    /Frozen applied-receipt sidecar SHA-256 changed/,
  );

  assert.throws(
    () => validateFrozenClosureTripleIdentity({
      ...triple,
      appliedReceipt: { ...triple.appliedReceipt, mode: 0o600 },
      expectedIdentities,
    }),
    /Frozen applied receipt mode changed/,
  );
});

test("rejected v1 identity fails on byte or SHA-256 drift", async () => {
  const bytes = await readFile(
    path.join(
      testProjectRoot,
      "catalog/source-promotions/g4-runtime-dependency-successor-2026-08-04.json",
    ),
  );
  const inspected = inspectedBytes(bytes, 0o644);
  assert.doesNotThrow(() => validateRejectedV1Identity(inspected));

  const byteDrift = inspectedBytes(
    Buffer.concat([bytes, Buffer.from(" ")]),
    0o644,
  );
  assert.throws(
    () => validateRejectedV1Identity(byteDrift),
    /Rejected v1 successor candidate byte count changed/,
  );
  assert.throws(
    () => validateRejectedV1Identity({ ...inspected, sha256: "0".repeat(64) }),
    /Rejected v1 successor candidate inspected SHA-256 does not match its bytes/,
  );
});

test("builds a deterministic plan-only artifact with 16 null expected hashes", () => {
  const fixture = fixtureEvidence();
  fixture.frozen.ledgerSha256 = new Set(
    Array.from({ length: 6_060 }, (_, index) => index.toString(16).padStart(64, "0")),
  );
  const analysis = analyzeSuccessorEvidence(fixture);
  const plan = buildPlanDocument({ ...fixture, analysis });
  assert.equal(plan.promotionRecords.length, 0);
  assert.equal(plan.requiredUnresolvedSources.length, 16);
  assert.ok(plan.requiredUnresolvedSources.every((record) => record.expectedSha256 === null));
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
  assert.equal(serializePlan(plan), serializePlan(plan));
  assert.doesNotMatch(serializePlan(plan), /\/Volumes\/|firstObserved|relativePathBytesBase64/);
});

test("fails closed when any frozen SHA-256 intersects canonical or prior Grade 4", () => {
  const fixture = fixtureEvidence();
  fixture.frozen.ledgerSha256 = new Set(
    Array.from({ length: 6_060 }, (_, index) => index.toString(16).padStart(64, "0")),
  );
  fixture.canonical.canonicalSha256.add("0".repeat(64));
  assert.throws(() => analyzeSuccessorEvidence(fixture), /canonical SHA-256 intersection is not zero/);
  fixture.canonical.canonicalSha256.delete("0".repeat(64));
  fixture.predecessor.closureSha256.add("1".padStart(64, "0"));
  assert.throws(() => analyzeSuccessorEvidence(fixture), /Grade 4 closure SHA-256 intersection is not zero/);

  const alignmentFixture = fixtureEvidence();
  alignmentFixture.frozen.ledgerSha256 = new Set(
    Array.from({ length: 6_060 }, (_, index) => index.toString(16).padStart(64, "0")),
  );
  alignmentFixture.alignment.runtimeSha256.add("4".padStart(64, "0"));
  alignmentFixture.alignment.categorySha256.presentAudio.add("4".padStart(64, "0"));
  assert.throws(
    () => analyzeSuccessorEvidence(alignmentFixture),
    /current runtime-alignment SHA-256 intersection is not zero/,
  );
});

test("filename, case, and placement metadata never admit a missing source", () => {
  const fixture = fixtureEvidence();
  fixture.frozen.ledgerSha256 = new Set(
    Array.from({ length: 6_060 }, (_, index) => index.toString(16).padStart(64, "0")),
  );
  fixture.frozen.privatePlacementMetadata.add(
    "HELP_COURSES/ELMGR4/L1/GS/L1GS01.swf",
  );
  fixture.frozen.privatePlacementMetadata.add(fixture.alignment.missing[0].canonicalPath);
  const analysis = analyzeSuccessorEvidence(fixture);
  assert.equal(analysis.requiredUnresolvedSources[0].expectedSha256, null);
  assert.equal(
    analysis.requiredUnresolvedSources[0].filenameCaseOrPlacementAdmissionUsed,
    false,
  );
  assert.equal(analysis.intersections.requiredMissingMp3ExactSha256Matches, 0);
});

test("check preflight rejects runtime-alignment and SQL-aggregate epoch drift", () => {
  const fixture = fixtureEvidence();
  assert.doesNotThrow(() => assertEpochSha256({
    runtimeAlignment: fixture.alignment.input,
    sqlAggregate: fixture.sql.input,
    rejectedV1: fixture.rejectedV1.input,
  }));
  assert.throws(
    () => assertEpochSha256({
      runtimeAlignment: { ...fixture.alignment.input, sha256: "0".repeat(64) },
      sqlAggregate: fixture.sql.input,
      rejectedV1: fixture.rejectedV1.input,
    }),
    /Runtime-alignment epoch SHA-256 changed/,
  );
  assert.throws(
    () => assertEpochSha256({
      runtimeAlignment: fixture.alignment.input,
      sqlAggregate: { ...fixture.sql.input, sha256: "0".repeat(64) },
      rejectedV1: fixture.rejectedV1.input,
    }),
    /SQL-aggregate epoch SHA-256 changed/,
  );
});

test("on-disk check validators fail before plan comparison on alignment or SQL epoch drift", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-successor-epoch-drift-"));
  try {
    await mkdir(path.join(root, "catalog", "alignments"), { recursive: true });
    await mkdir(path.join(root, "reports"), { recursive: true });
    await writeFile(
      path.join(root, "catalog", "alignments", "g4-curriculum-runtime-dependency-map-v1.json"),
      "{}\n",
    );
    await writeFile(path.join(root, "reports", "g4-sql-course-aggregate.json"), "{}\n");
    await assert.rejects(
      validateRuntimeAlignment({
        root,
        canonical: {},
        predecessor: {},
        sql: { input: fixtureEvidence().sql.input },
        rejectedV1: { input: fixtureEvidence().rejectedV1.input },
      }),
      /Runtime-alignment epoch SHA-256 changed/,
    );
    await assert.rejects(
      validateSqlAggregate({ root }),
      /SQL-aggregate epoch SHA-256 changed/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("plan safety rejects executors, promotions, invented hashes, and acceptance effects", () => {
  const fixture = fixtureEvidence();
  fixture.frozen.ledgerSha256 = new Set(
    Array.from({ length: 6_060 }, (_, index) => index.toString(16).padStart(64, "0")),
  );
  const analysis = analyzeSuccessorEvidence(fixture);
  const plan = buildPlanDocument({ ...fixture, analysis });
  const withPromotion = structuredClone(plan);
  withPromotion.promotionRecords.push({ sha256: "f".repeat(64) });
  assert.throws(() => assertPlanSafety(withPromotion), /contains promotion records/);
  const withHash = structuredClone(plan);
  withHash.requiredUnresolvedSources[0].expectedSha256 = "f".repeat(64);
  assert.throws(() => assertPlanSafety(withHash), /invents a missing-source SHA-256/);
  const withAcceptance = structuredClone(plan);
  withAcceptance.acceptanceEffects.ownerAcceptance = true;
  assert.throws(() => assertPlanSafety(withAcceptance), /must remain false/);
  const withExecutor = structuredClone(plan);
  withExecutor.controls.executorPresent = true;
  assert.throws(() => assertPlanSafety(withExecutor), /exposes an executor/);
  const withMutation = structuredClone(plan);
  withMutation.controls.sourceAssetsMutationAuthorized = true;
  assert.throws(() => assertPlanSafety(withMutation), /authorizes source-assets mutation/);
  const withPathAdmission = structuredClone(plan);
  withPathAdmission.controls.filenameBasenameCaseOrPlacementAdmissionUsed = true;
  assert.throws(() => assertPlanSafety(withPathAdmission), /non-SHA admission signal/);
  const withKeyTermAdmission = structuredClone(plan);
  withKeyTermAdmission.verifiedEvidence.runtimeAlignment.keyTermCandidateReviewHolds.admittedByThisPlan = 1;
  assert.throws(() => assertPlanSafety(withKeyTermAdmission), /admits unresolved Key Term holds/);
  const withPolynomialPathDrift = structuredClone(plan);
  withPolynomialPathDrift.verifiedEvidence.runtimeAlignment.residualKeyTermBlocker.expectedPath =
    "HELP_KEYTERMS/KT/ELEMENTARY/DIG/Other.swf";
  assert.throws(
    () => assertPlanSafety(withPolynomialPathDrift),
    /Polynomial runtime blocker changed/,
  );
  const withCompanionFlaDrift = structuredClone(plan);
  withCompanionFlaDrift.verifiedEvidence.runtimeAlignment.residualKeyTermBlocker.companionFla.sha256 =
    "0".repeat(64);
  assert.throws(
    () => assertPlanSafety(withCompanionFlaDrift),
    /Polynomial runtime blocker changed/,
  );
  const withSupersededV2Drift = structuredClone(plan);
  withSupersededV2Drift.inputs.supersededV2Candidate.sha256 = "0".repeat(64);
  assert.throws(
    () => assertPlanSafety(withSupersededV2Drift),
    /Superseded v2 candidate identity changed/,
  );
});

test("atomic writer is no-clobber, exact, and leaves no preparing file", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-successor-plan-"));
  try {
    const output = path.join(root, "plan.json");
    const first = await writeAtomicExact(output, "{\"ok\":true}\n");
    assert.equal(first.outcome, "written");
    assert.equal(await readFile(output, "utf8"), "{\"ok\":true}\n");
    assert.equal((await lstat(output)).mode & 0o777, 0o644);
    assert.deepEqual(await readdir(root), ["plan.json"]);
    const second = await writeAtomicExact(output, "{\"ok\":true}\n");
    assert.equal(second.outcome, "already-current");
    await assert.rejects(
      writeAtomicExact(output, "{\"ok\":false}\n"),
      /Refusing to overwrite a different successor plan/,
    );
  } finally {
    const info = await lstat(root);
    if ((info.mode & 0o700) !== 0o700) await chmod(root, 0o700);
    await rm(root, { recursive: true, force: true });
  }
});
