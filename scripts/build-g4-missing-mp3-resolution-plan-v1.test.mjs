import assert from "node:assert/strict";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  OUTPUT_PREFIX,
  buildResolutionPlan,
  parseArguments,
  renderMarkdown,
  stableJson,
  validateResolutionPlan,
  writeNoClobberOrCheck,
} from "./build-g4-missing-mp3-resolution-plan-v1.mjs";

let planPromise;
function buildOnce() {
  planPromise ||= buildResolutionPlan();
  return planPromise;
}

function clone(value) {
  return structuredClone(value);
}

async function withTemporaryRoot(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g4-missing-mp3-plan-test-"));
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

test("requires an explicit write-no-clobber or read-only check mode", () => {
  assert.deepEqual(parseArguments(["--write"]), {help: false, mode: "write"});
  assert.deepEqual(parseArguments(["--check"]), {help: false, mode: "check"});
  assert.deepEqual(parseArguments(["--help"]), {help: true, mode: null});
  assert.throws(() => parseArguments([]), /choose exactly one/);
  assert.throws(
    () => parseArguments(["--write", "--check"]),
    /choose exactly one/,
  );
  assert.throws(() => parseArguments(["--apply"]), /Unknown option/);
});

test("binds the exact current alignment, successor, catalog, quarantine, freeze, and aggregate historical evidence", async () => {
  const plan = validateResolutionPlan(await buildOnce());
  const bindings = plan.sourceBindings;
  assert.deepEqual(
    {
      alignment: {
        bytes: bindings.runtimeAlignment.bytes,
        sha256: bindings.runtimeAlignment.sha256,
      },
      successor: {
        bytes: bindings.successorV3.bytes,
        sha256: bindings.successorV3.sha256,
      },
      catalog: {
        bytes: bindings.currentSourceCatalog.bytes,
        sha256: bindings.currentSourceCatalog.sha256,
      },
      quarantine: {
        readmeSha256: bindings.quarantine20260802.readme.sha256,
        receiptSha256: bindings.quarantine20260802.intakeReceipt.sha256,
        manifestSha256: bindings.quarantine20260802.grade4Manifest.sha256,
        fileCount: bindings.quarantine20260802.grade4Manifest.fileCount,
      },
      frozen: {
        sha256: bindings.frozenV7V8Closure.sha256,
        v7: bindings.frozenV7V8Closure.v7ObjectCount,
        v8: bindings.frozenV7V8Closure.v8ObjectCount,
        union: bindings.frozenV7V8Closure.uniqueSha256Count,
      },
      historical: {
        sha256: bindings.historicalTechnicalCrosswalk.sha256,
        files: bindings.historicalTechnicalCrosswalk.technicalFileCount,
        audio: bindings.historicalTechnicalCrosswalk.audioFileCount,
      },
    },
    {
      alignment: {
        bytes: 2272953,
        sha256:
          "05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b",
      },
      successor: {
        bytes: 23456,
        sha256:
          "789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f",
      },
      catalog: {
        bytes: 1894761,
        sha256:
          "c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29",
      },
      quarantine: {
        readmeSha256:
          "fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e",
        receiptSha256:
          "3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4",
        manifestSha256:
          "27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c",
        fileCount: 5209,
      },
      frozen: {
        sha256:
          "fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751",
        v7: 5793,
        v8: 267,
        union: 6060,
      },
      historical: {
        sha256:
          "43f7d983a0b81b85e3f4e0ff682cae876936409f3a65ae58e3a5bfa49a70f1e4",
        files: 1455,
        audio: 933,
      },
    },
  );
  assert.equal(
    bindings.historicalTechnicalCrosswalk.currentSourceCatalogCheckedSeparately,
    true,
  );
  assert.equal(
    bindings.historicalTechnicalCrosswalk.priorSourceCatalogMatchStatusesReused,
    false,
  );
  assert.equal("path" in bindings.historicalTechnicalCrosswalk, false);
});

test("preserves the 16 equals 8 English FQ plus 8 Spanish ordinary and L2 14 L6 1 L8 1 contract", async () => {
  const plan = await buildOnce();
  assert.equal(plan.obligations.length, 16);
  assert.equal(
    plan.obligations.filter((record) =>
      record.language === "en" &&
      record.audioBindingKind === "final-quiz-question-answer").length,
    8,
  );
  assert.equal(
    plan.obligations.filter((record) =>
      record.language === "es" &&
      record.audioBindingKind === "ordinary-spanish-page").length,
    8,
  );
  assert.deepEqual(plan.distribution, {
    byLesson: {L2: 14, L6: 1, L8: 1},
    byBindingAndLanguage: {
      englishFinalQuizQuestionAnswer: 8,
      spanishOrdinaryPage: 8,
    },
  });
});

test("keeps all unknown SHA obligations unselected and records 14 observed versus 2 unobserved basenames", async () => {
  const plan = await buildOnce();
  assert.ok(plan.obligations.every((record) =>
    record.expectedSha256 === null &&
    record.expectedBytes === null &&
    record.exactSha256CandidateCount === 0 &&
    record.selectedCandidate === null &&
    record.exactTargetPathAbsence.currentCanonicalCatalogCount === 0 &&
    record.exactTargetPathAbsence.grade4QuarantineManifestCount === 0 &&
    record.exactTargetPathAbsence.historicalTechnicalCrosswalkCount === 0));
  assert.equal(
    plan.obligations.filter((record) => record.basenameDiscoveryOnly.observed).length,
    14,
  );
  assert.deepEqual(
    plan.obligations
      .filter((record) => !record.basenameDiscoveryOnly.observed)
      .map((record) => path.posix.basename(record.canonicalPath)),
    ["L6GS03.mp3", "L8GS03.mp3"],
  );
});

test("records ambiguity counts without exposing candidate hashes or historical paths", async () => {
  const plan = await buildOnce();
  const byBasename = new Map(plan.obligations.map((record) => [
    path.posix.basename(record.canonicalPath),
    record,
  ]));
  const q22a = byBasename.get("Q22A.mp3").basenameDiscoveryOnly;
  assert.deepEqual(q22a.currentCanonicalCatalog, {
    recordCount: 24,
    distinctSha256Count: 23,
    observedGrades: [3, 4, 5],
  });
  assert.deepEqual(q22a.grade4QuarantineManifest, {
    recordCount: 23,
    distinctSha256Count: 22,
  });
  assert.deepEqual(q22a.historicalTechnicalCrosswalk, {
    recordCount: 8,
    distinctSha256Count: 8,
    rawPathsEmitted: 0,
  });

  const l2in21 = byBasename.get("L2IN21.mp3").basenameDiscoveryOnly;
  assert.deepEqual(l2in21.currentCanonicalCatalog, {
    recordCount: 2,
    distinctSha256Count: 2,
    observedGrades: [3, 5],
  });
  assert.equal(l2in21.grade4QuarantineManifest.recordCount, 0);
  assert.equal(l2in21.historicalTechnicalCrosswalk.recordCount, 0);
  assert.equal(l2in21.admissionAllowed, false);
  assert.equal(l2in21.filenameInferenceUsed, false);

  const serialized = stableJson(plan);
  assert.doesNotMatch(serialized, /historicalPath|private-archive\/|\/Volumes\//);
  assert.doesNotMatch(
    serialized,
    /firstObservedSource|firstObservedDriveRootRelativePath/,
  );
  assert.doesNotMatch(
    serialized,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
});

test("fixes the four-state recovery protocol while leaving every acceptance effect false", async () => {
  const plan = await buildOnce();
  assert.deepEqual(
    plan.recoveryProtocol.map(({order, state, promotionEffect}) => ({
      order,
      state,
      promotionEffect,
    })),
    [
      {order: 1, state: "blocked-expected-identity-unknown", promotionEffect: false},
      {order: 2, state: "blocked-exact-bytes-not-found-in-checked-scopes", promotionEffect: false},
      {order: 3, state: "candidate-only-pending-provenance-review", promotionEffect: false},
      {order: 4, state: "eligible-for-new-successor-plan", promotionEffect: false},
    ],
  );
  assert.deepEqual(plan.promotionRecords, []);
  assert.equal(plan.controls.executable, false);
  assert.equal(plan.controls.executorPresent, false);
  assert.equal(plan.controls.writeOrApplySupported, false);
  assert.ok(Object.values(plan.acceptanceEffects).every((value) => value === false));
});

test("validator rejects unknown-identity admission, filename inference, acceptance expansion, and protocol drift", async () => {
  const plan = await buildOnce();

  const admittedUnknown = clone(plan);
  admittedUnknown.obligations[0].expectedSha256 = "a".repeat(64);
  admittedUnknown.obligations[0].selectedCandidate = {sha256: "a".repeat(64)};
  assert.throws(
    () => validateResolutionPlan(admittedUnknown),
    /unknown identity or filename candidate was admitted/,
  );

  const filenameInference = clone(plan);
  filenameInference.obligations[0].basenameDiscoveryOnly.admissionAllowed = true;
  assert.throws(
    () => validateResolutionPlan(filenameInference),
    /unknown identity or filename candidate was admitted/,
  );

  const acceptanceExpansion = clone(plan);
  acceptanceExpansion.acceptanceEffects.audioCorrectnessOrAcceptance = true;
  assert.throws(
    () => validateResolutionPlan(acceptanceExpansion),
    /must remain false/,
  );

  const protocolDrift = clone(plan);
  protocolDrift.recoveryProtocol[3].promotionEffect = true;
  assert.throws(
    () => validateResolutionPlan(protocolDrift),
    /recovery protocol changed/,
  );
});

test("renders privacy-safe Markdown and write mode creates once, then refuses to clobber", async () => {
  const plan = await buildOnce();
  const markdown = renderMarkdown(plan);
  assert.match(markdown, /all 16 required runtime sources remain unresolved/);
  assert.match(markdown, /Selected candidates: 0; promotion records: 0/);
  assert.doesNotMatch(markdown, /historicalPath|private-archive\/|\/Volumes\//);

  await withTemporaryRoot(async (projectRoot) => {
    const first = await writeNoClobberOrCheck({
      plan,
      projectRoot,
      outputPrefix: OUTPUT_PREFIX,
      mode: "write",
    });
    assert.equal(first.action, "written-new-files");
    const jsonBefore = await readFile(first.outputs.json, "utf8");
    const markdownBefore = await readFile(first.outputs.markdown, "utf8");
    assert.equal(jsonBefore, stableJson(plan));
    assert.equal(markdownBefore, markdown);

    const checked = await writeNoClobberOrCheck({
      plan,
      projectRoot,
      outputPrefix: OUTPUT_PREFIX,
      mode: "check",
    });
    assert.equal(checked.action, "verified");

    await assert.rejects(
      writeNoClobberOrCheck({
        plan,
        projectRoot,
        outputPrefix: OUTPUT_PREFIX,
        mode: "write",
      }),
      /write-no-clobber refused/,
    );
    assert.equal(await readFile(first.outputs.json, "utf8"), jsonBefore);
    assert.equal(await readFile(first.outputs.markdown, "utf8"), markdownBefore);

    await writeFile(first.outputs.markdown, "stale\n", "utf8");
    await assert.rejects(
      writeNoClobberOrCheck({
        plan,
        projectRoot,
        outputPrefix: OUTPUT_PREFIX,
        mode: "check",
      }),
      /Markdown output is stale/,
    );
  });
});
