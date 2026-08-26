import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertExactV15DiffArtifactSet,
  buildG4L3Ts006ExactPidImplementationComparisonV15,
  parseArguments,
  validateExactPidV15Inputs,
  validateV15CurrentBindings,
  validateV15ImplementationClosureDelta,
  writeG4L3Ts006ExactPidImplementationComparisonV15,
} from "./build-g4-l3-ts006-exact-pid-implementation-comparison-v15.mjs";

const ROOT = new URL("../", import.meta.url);

async function bytes(relativePath) {
  return readFile(new URL(relativePath, ROOT));
}

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, ROOT), "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function liveInputs() {
  const [
    analysis,
    source,
    previousReport,
    previousImplementation,
    entryState,
    implementation,
    candidate,
    assetManifest,
    workspaceBinding,
    reconciliationReceipt,
  ] = await Promise.all([
    json("reports/g4-l3-ts006-exact-pid-replay-complete-diagnostic-v10.json"),
    json(
      "artifacts/full-frame/g4-l3/" +
        "ts006-en-exact-pid-replay-complete-diagnostic-20260726T220817+0800/" +
        "capture-manifest.json",
    ),
    json("reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.json"),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/" +
        "en-diagnostic/capture-manifest.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/" +
        "diagnostic-entry-state.json",
    ),
    json(
      "output/playwright/g4-l3-ts006-exact-pid-comparison-v15/" +
        "en-diagnostic/capture-manifest.json",
    ),
    json("reports/g4-l3-ts006-current-javascript-candidate.json"),
    json("public/flash-assets/courses/course-g04-l03-ts-006/manifest.json"),
    json("reports/g4-l3-ts006-current-javascript-workspace-binding.json"),
    json(
      "reports/g4-l3-ts006-current-javascript-asset-inventory-reconciliations/" +
        "fdccc943b42f2456c5aff21d0593d627ac13be538dc2d09cd3ee1b112d731b01.json",
    ),
  ]);
  return {
    analysis,
    source,
    previousReport,
    previousImplementation,
    entryState,
    implementation,
    candidate,
    assetManifest,
    workspaceBinding,
    reconciliationReceipt,
  };
}

test("v15 binds the current candidate, public manifest, inventory, workspace report, and immutable reconciliation file", async () => {
  const inputs = await liveInputs();
  assert.equal(validateV15CurrentBindings(inputs), true);

  assert.deepEqual(
    {
      candidate: sha256(
        await bytes("reports/g4-l3-ts006-current-javascript-candidate.json"),
      ),
      publicManifest: sha256(
        await bytes(
          "public/flash-assets/courses/" +
            "course-g04-l03-ts-006/manifest.json",
        ),
      ),
      inventory: sha256(
        await bytes("migrations/course-g04-l03-ts-006/asset-inventory.csv"),
      ),
      workspace: sha256(
        await bytes(
          "reports/g4-l3-ts006-current-javascript-workspace-binding.json",
        ),
      ),
      receipt: sha256(
        await bytes(
          "reports/" +
            "g4-l3-ts006-current-javascript-asset-inventory-reconciliations/" +
            "fdccc943b42f2456c5aff21d0593d627ac13be538dc2d09cd3ee1b112d731b01.json",
        ),
      ),
    },
    {
      candidate:
        "80fbe8cf9b283a0a411477cc6602a1968e4e1af924ce02c93923794751634398",
      publicManifest:
        "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de",
      inventory:
        "c65960d0ef5abeac6a7853dcdcc4c1c94e08a5adf6a89ee3b4aa96e9d3488a76",
      workspace:
        "cca3b07fe65d4b024671dcef27641a2c1115b7ccabcf9e87e62a8a121f72ba6c",
      receipt:
        "8db62a42c6a2cd48c0a4cf6dcf45941981a8246e44923600fcb6ff918e864eca",
    },
  );

  const detachedReceipt = structuredClone(inputs);
  detachedReceipt.workspaceBinding.refreshHistory[20].immutableReconciliationReceipt.sha256 =
    "a".repeat(64);
  assert.throws(
    () => validateV15CurrentBindings(detachedReceipt),
    /application proof drifted/,
  );

  const inventedResolution = structuredClone(inputs);
  inventedResolution.reconciliationReceipt.reconciliation.conflictPreserved = false;
  assert.throws(
    () => validateV15CurrentBindings(inventedResolution),
    /receipt semantics drifted/,
  );
});

test("v15 exact-PID input identity remains diagnostic and all authority flags remain false", async () => {
  const inputs = await liveInputs();
  assert.equal(validateExactPidV15Inputs(inputs), true);

  const promoted = structuredClone(inputs);
  promoted.entryState.authority.authoritativeBaseline = true;
  assert.throws(() => validateExactPidV15Inputs(promoted), /authority drifted/);

  const remapped = structuredClone(inputs);
  remapped.entryState.mapping.anchors[0].sourceCaptureOrdinal = 19;
  assert.throws(() => validateExactPidV15Inputs(remapped), /mapping/);

  const wrongViewport = structuredClone(inputs);
  wrongViewport.implementation.viewport.width = 799;
  assert.throws(
    () => validateExactPidV15Inputs(wrongViewport),
    /capture identity drifted/,
  );
});

test("v15 current implementation closure changes only the reconciled public manifest relative to v14", async () => {
  const { previousImplementation, implementation } = await liveInputs();
  assert.deepEqual(
    validateV15ImplementationClosureDelta({
      previousImplementation,
      implementation,
    }),
    {
      added: [],
      removed: [],
      changed: [
        "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
      ],
      transition: {
        path: "public/flash-assets/courses/course-g04-l03-ts-006/manifest.json",
        priorSha256:
          "6d27769d685dcb37b1177d97300311eb3f981929d1f9bbebc1f7cb430fba7063",
        currentSha256:
          "3e53077860ab9e6f9aeea22989770d2605e8ccd8b56e124342cf536a4c8200de",
        rendererChangedByV15: false,
        timelineChangedByV15: false,
        strictAcceptanceEffect: "none",
      },
    },
  );

  const rendererDrift = structuredClone(implementation);
  const renderer = rendererDrift.implementationArtifactClosure.artifacts.find(
    ({ path }) =>
      path === "packages/demos/src/modules/course-g04-l03-ts-006.tsx",
  );
  renderer.sha256 = "a".repeat(64);
  assert.throws(
    () =>
      validateV15ImplementationClosureDelta({
        previousImplementation,
        implementation: rendererDrift,
      }),
    /may differ/,
  );
});

test("v15 browser recapture is byte-identical to v14 for all ten 800x600 frames", async () => {
  const { previousImplementation, implementation } = await liveInputs();
  assert.equal(implementation.viewport.width, 800);
  assert.equal(implementation.viewport.height, 600);
  assert.equal(implementation.viewport.deviceScaleFactor, 1);
  assert.equal(implementation.captured.length, 10);
  for (let index = 0; index < implementation.captured.length; index += 1) {
    const current = implementation.captured[index];
    const previous = previousImplementation.captured[index];
    assert.equal(current.frame, previous.frame);
    assert.equal(current.sha256, previous.sha256);
    assert.equal(
      sha256(
        await bytes(
          `output/playwright/g4-l3-ts006-exact-pid-comparison-v15/` +
            `en-diagnostic/${current.file}`,
        ),
      ),
      current.sha256,
    );
  }
});

test("v15 report deterministically preserves v14 metrics with fixed registration and zero mask or resampling", async () => {
  const first = await buildG4L3Ts006ExactPidImplementationComparisonV15();
  const second = await buildG4L3Ts006ExactPidImplementationComparisonV15();
  assert.deepEqual(first, second);
  assert.equal(first.report.comparisons.length, 10);
  assert.equal(first.diffArtifacts.length, 10);
  assert.equal(first.report.strictAcceptanceEffect, "none");
  assert.equal(first.report.authority.authoritativeBaselineClaimed, false);
  assert.equal(first.report.authority.implementationCandidatePromoted, false);
  assert.equal(first.report.authority.audioAccepted, false);
  assert.equal(first.report.authority.spanishTraceAccepted, false);
  assert.equal(
    first.report.authority.independentHumanVisualReviewComplete,
    false,
  );
  assert.equal(first.report.authority.ownerAcceptanceComplete, false);
  assert.deepEqual(
    {
      full: first.report.summary.regions.full.mean,
      header: first.report.summary.regions.header.mean,
      body: first.report.summary.regions.body.mean,
      footer: first.report.summary.regions.footer.mean,
    },
    {
      full: 0.075683230305,
      header: 0.04588487381,
      body: 0.080463607541,
      footer: 0.074742635343,
    },
  );
  for (const region of ["full", "header", "body", "footer"]) {
    assert.equal(first.report.v14Delta.regions[region].absoluteReduction, 0);
    assert.equal(first.report.v14Delta.regions[region].nonRegressed, true);
    assert.equal(
      first.report.v14Delta.regions[region].pixelIdenticalMetric,
      true,
    );
  }
  assert.equal(first.report.summary.nonRegressionFrames, 10);
  assert.equal(first.report.summary.allTenFramesNonRegressed, true);
  assert.equal(
    first.report.summary.allTenImplementationFramesPixelIdenticalToV14,
    true,
  );
  assert.equal(first.report.summary.fixedRegistrationVerified, true);
  assert.equal(first.report.summary.zeroMaskVerified, true);
  assert.equal(first.report.summary.zeroResamplingVerified, true);
  assert.equal(
    first.report.summary.currentImplementationArtifactClosureVerified,
    true,
  );
  assert.equal(first.report.summary.implementationBrowserCaptureClean, true);
});

test("checked-in v15 report and ten full-stage diffs reproduce exactly", async () => {
  await writeG4L3Ts006ExactPidImplementationComparisonV15({ check: true });
  const report = await json(
    "reports/g4-l3-ts006-exact-pid-implementation-comparison-v15.json",
  );
  const diffNames = report.comparisons.map(({ fullFrameDiff }) =>
    fullFrameDiff.file.split("/").at(-1),
  );
  assert.equal(
    assertExactV15DiffArtifactSet(
      diffNames,
      report.comparisons.map(({ fullFrameDiff }) => fullFrameDiff),
    ),
    true,
  );
  assert.equal(
    report.bindings.implementationCaptureManifest.sha256,
    "1b38b0007c5f273ccc30d6c1a788412404c4d82940ed8b35115b814d7ef381eb",
  );
  assert.equal(
    report.bindings.diagnosticEntryState.sha256,
    "a14e060d9f13b7e9f31991c1c24d79beacf4869802df897f9fdbb2eeed2f47d6",
  );
});

test("v15 work leaves the immutable v14 report, capture, entry state, and generator bytes unchanged", async () => {
  assert.deepEqual(
    {
      report: sha256(
        await bytes(
          "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.json",
        ),
      ),
      markdown: sha256(
        await bytes(
          "reports/g4-l3-ts006-exact-pid-implementation-comparison-v14.md",
        ),
      ),
      entry: sha256(
        await bytes(
          "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/" +
            "diagnostic-entry-state.json",
        ),
      ),
      capture: sha256(
        await bytes(
          "output/playwright/g4-l3-ts006-exact-pid-comparison-v14/" +
            "en-diagnostic/capture-manifest.json",
        ),
      ),
      generator: sha256(
        await bytes(
          "scripts/" +
            "build-g4-l3-ts006-exact-pid-implementation-comparison-v14.mjs",
        ),
      ),
    },
    {
      report:
        "5344271d59900cbca05da573b5d1c80170f1e776b02d08245c85447a20d3009c",
      markdown:
        "caaa632ff88be6567f2ddb0eeee582d79d2c5cd171c27b3ae8f43248ce9ce354",
      entry: "df4d451158585f3497d51b438ca0bf803c1e6a18297b39974f10946c67533d2f",
      capture:
        "c719c18f57b89d2f797a2feca24e96fba3c3805fcc75b6731afaf8191c133547",
      generator:
        "6d957a6fd98cdf988b4cc868a6daff13f700111661b96779793e8aeb61f1eedd",
    },
  );
});

test("v15 CLI remains build/check only and rejects promotion modes", () => {
  assert.deepEqual(parseArguments([]), { check: false });
  assert.deepEqual(parseArguments(["--check"]), { check: true });
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--adopt"]), /Unknown option/);
  assert.throws(() => parseArguments(["--release"]), /Unknown option/);
});
