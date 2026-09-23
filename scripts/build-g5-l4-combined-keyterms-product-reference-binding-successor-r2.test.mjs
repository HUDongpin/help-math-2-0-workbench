import assert from "node:assert/strict";
import {mkdtemp, readFile, readdir, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS,
  BROWSER_ALLOWLIST,
  CURRENT_BROWSER,
  CURRENT_G5_CALLER,
  OUTPUT_PATHS,
  PREDECESSOR_BROWSER,
  PROJECT_ROOT,
  buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2,
  inspectG5CallerDormancy,
  parseArguments,
  projectCurrentBrowserToPredecessor,
  validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2,
  writeOrCheckSuccessorPair,
} from "./build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.mjs";

const TEST_PATH = fileURLToPath(import.meta.url);
assert.equal(
  path.resolve(PROJECT_ROOT, "scripts/build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.test.mjs"),
  TEST_PATH,
);

let reportPromise;
function currentReport() {
  reportPromise ??=
    buildG5L4CombinedKeytermsProductReferenceBindingSuccessorR2();
  return reportPromise;
}

async function exists(absolutePath) {
  return readFile(absolutePath).then(() => true, () => false);
}

test("exact browser allowlist reconstructs the immutable predecessor byte-for-byte", async () => {
  const currentBytes = await readFile(path.resolve(PROJECT_ROOT, CURRENT_BROWSER.path));
  const result = projectCurrentBrowserToPredecessor(currentBytes);
  assert.deepEqual(result.projectedBinding, PREDECESSOR_BROWSER);
  assert.equal(result.projectedBytes.length, 36_303);
  assert.equal(result.netAddedBytes, 1_390);
  assert.equal(result.unexpectedDeltaBytes, 0);
  assert.equal(result.allowlist.length, 6);
  assert.deepEqual(result.allowlist, BROWSER_ALLOWLIST);

  await assert.rejects(
    async () => projectCurrentBrowserToPredecessor(
      Buffer.concat([currentBytes, Buffer.from(" ", "utf8")]),
    ),
    /unexpected browser delta remains outside the exact allowlist/,
  );

  const missingAllowlistedFragment = Buffer.from(
    currentBytes.toString("utf8").replace(
      "data-host-selection-resolution={selectionResolution}",
      "data-host-selection-resolution={selectionResolutionChanged}",
    ),
    "utf8",
  );
  assert.throws(
    () => projectCurrentBrowserToPredecessor(missingAllowlistedFragment),
    /host-selection-diagnostic-data-attributes is not present exactly once/,
  );
});

test("the current G5 caller leaves the optional G4 host-selection branch dormant", async () => {
  const callerBytes = await readFile(path.resolve(PROJECT_ROOT, CURRENT_G5_CALLER.path));
  assert.deepEqual(inspectG5CallerDormancy(callerBytes), {
    componentInvocationCount: 1,
    explicitProps: ["key", "locale", "shellCandidate"],
    selectionRequestPropPassed: false,
    optionalHostSelectionBranchDormant: true,
  });
  const activated = Buffer.from(
    callerBytes.toString("utf8").replace(
      "          shellCandidate={shellImplementation}",
      "          selectionRequest={null}\n          shellCandidate={shellImplementation}",
    ),
    "utf8",
  );
  assert.throws(
    () => inspectG5CallerDormancy(activated),
    /activates or obscures the optional selectionRequest branch/,
  );
});

test("builder validates 761 and 753 terms while preserving the missing-XML and acceptance boundaries", async () => {
  const report = await currentReport();
  assert.equal(
    validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report),
    report,
  );
  assert.equal(report.contentBoundary.englishClientTermCount, 761);
  assert.equal(report.contentBoundary.spanishClientTermCount, 753);
  assert.deepEqual(
    report.missingLessonSpecificSourceBoundary.missingBasenames,
    ["L4KTE01.xml", "L4KTS01.xml"],
  );
  assert.equal(
    report.missingLessonSpecificSourceBoundary
      .combinedReferenceSubstitutesForDeclaredLessonSources,
    false,
  );
  assert.equal(report.browserQaExecutedByThisSuccessor, false);
  assert.equal(report.predecessorBrowserObservationsInherited, false);
  assert.deepEqual(report.acceptanceEffects, ACCEPTANCE_EFFECTS);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
  assert.equal(report.acceptanceNeutral, true);
  assert.equal(report.strictAcceptanceEffect, "none");

  const promoted = structuredClone(report);
  promoted.acceptanceEffects.ownerFidelityAcceptanceEstablished = true;
  assert.throws(
    () => validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(promoted),
    /must remain false/,
  );
  const substituted = structuredClone(report);
  substituted.missingLessonSpecificSourceBoundary
    .combinedReferenceSubstitutesForDeclaredLessonSources = true;
  assert.throws(
    () => validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(substituted),
    /source gap drifted/,
  );
  const inheritedBrowserQa = structuredClone(report);
  inheritedBrowserQa.predecessorBrowserObservationsInherited = true;
  assert.throws(
    () => validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(inheritedBrowserQa),
    /invented or inherited browser observations/,
  );
});

test("immutable staged pair creates once and exact check verifies without overwrite", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "g5-l4-keyterms-r2-pair-"));
  try {
    const report = await currentReport();
    const created = await writeOrCheckSuccessorPair({projectRoot: root, report});
    assert.equal(created.action, "created");
    assert.equal(await exists(path.resolve(root, OUTPUT_PATHS.json)), true);
    assert.equal(await exists(path.resolve(root, OUTPUT_PATHS.markdown)), true);

    const checked = await writeOrCheckSuccessorPair({
      projectRoot: root,
      report,
      check: true,
    });
    assert.equal(checked.action, "verified");
    assert.deepEqual(checked.outputs, created.outputs);
    await assert.rejects(
      writeOrCheckSuccessorPair({projectRoot: root, report}),
      /already exists; immutable successor is never overwritten/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("staged pair fault injection rolls back steps 2 and 3 without residue", async () => {
  const report = await currentReport();
  for (const publishFailureAt of [2, 3]) {
    const root = await mkdtemp(path.join(tmpdir(), "g5-l4-keyterms-r2-rollback-"));
    try {
      await assert.rejects(
        writeOrCheckSuccessorPair({
          projectRoot: root,
          report,
          publishFailureAt,
        }),
        new RegExp(`injected publish failure at step ${publishFailureAt}`),
      );
      assert.equal(await exists(path.resolve(root, OUTPUT_PATHS.json)), false);
      assert.equal(await exists(path.resolve(root, OUTPUT_PATHS.markdown)), false);
      assert.deepEqual(
        (await readdir(root)).filter((name) =>
          name.startsWith(".g5-l4-keyterms-r2-stage-")
        ),
        [],
      );
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  }
});

test("CLI requires one explicit immutable build or check mode", () => {
  assert.deepEqual(parseArguments(["--build"]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments([]), /exactly one mode/);
  assert.throws(
    () => parseArguments(["--build", "--check"]),
    /exactly one mode/,
  );
});
