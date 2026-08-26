import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {validateG5L4SourceStaticSpec} from
  "./build-g5-l4-source-static-candidates.mjs";
import {
  G5_L4_WAVE3_SOURCE_STATIC_IDS,
  G5_L4_WAVE3_SOURCE_STATIC_PROFILES,
  parseArguments,
} from "./materialize-g5-l4-wave3-source-static-specs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("wave3 spec materializer is bounded and read-only in check mode", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    ids: [...G5_L4_WAVE3_SOURCE_STATIC_IDS],
  });
  assert.deepEqual(parseArguments([
    "--check",
    "--id", "course-g05-l04-vb-003",
    "--ffdec", "/opt/homebrew/bin/ffdec",
  ]), {
    check: true,
    ffdec: "/opt/homebrew/bin/ffdec",
    ids: ["course-g05-l04-vb-003"],
  });
  assert.throws(
    () => parseArguments(["--id", "course-g05-l04-ir-001-a662633d"]),
    /unsupported animation ID/,
  );
  assert.throws(
    () => parseArguments([
      "--id", "course-g05-l04-vb-003",
      "--id", "course-g05-l04-vb-003",
    ]),
    /duplicate --id/,
  );
});

test("seventeen safe prefixes preserve exact static boundaries", async () => {
  assert.equal(G5_L4_WAVE3_SOURCE_STATIC_PROFILES.length, 17);
  let renderableFrames = 0;
  let blockedFrames = 0;
  for (const profile of G5_L4_WAVE3_SOURCE_STATIC_PROFILES) {
    const spec = validateG5L4SourceStaticSpec(JSON.parse(await readFile(
      path.join(
        ROOT,
        "migrations",
        profile.animationId,
        "audit",
        "source-static-current-js-candidate-spec.json",
      ),
      "utf8",
    )));
    assert.equal(
      spec.timeline.local.timelineId,
      `sprite-${profile.objectId}`,
      profile.animationId,
    );
    assert.equal(spec.timeline.local.frameCount, profile.frameCount);
    assert.deepEqual(spec.runtimeContract.blockedLocalFrameRanges, [{
      firstFrame: profile.firstBlockedFrame,
      lastFrame: profile.frameCount,
      reason: profile.reason,
    }]);
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.firstNonInitialStopFrame,
      profile.firstBlockedFrame,
    );
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.lastSafeFrame,
      profile.firstBlockedFrame - 1,
    );
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.interactionKind,
      profile.interactionKind,
    );
    assert.equal(
      spec.runtimeContract.safePrefixBoundary
        .authoritativeRuntimeReachabilityEstablished,
      false,
    );
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.behaviorReconstructed,
      false,
    );
    assert.match(
      spec.evidence.prebindingScenarioInventory,
      /source-static-prebinding-antecedents\/scenario-inventory\.json$/,
    );
    assert.match(
      spec.evidence.prebindingFrameDomainDisposition,
      /source-static-prebinding-antecedents\/frame-domain-disposition\.json$/,
    );
    renderableFrames += profile.firstBlockedFrame - 1;
    blockedFrames += profile.frameCount - profile.firstBlockedFrame + 1;
  }
  assert.equal(renderableFrames, 3_816);
  assert.equal(blockedFrames, 1_138);
});

test("TI002 remains explicit SWF-only evidence", async () => {
  const spec = JSON.parse(await readFile(path.join(
    ROOT,
    "migrations/course-g05-l04-ti-002/audit",
    "source-static-current-js-candidate-spec.json",
  ), "utf8"));
  assert.equal(spec.source.pairedFlaStatus, "missing");
  assert.equal(spec.source.fla, null);
  assert.equal(spec.source.flaBytes, null);
  assert.equal(spec.source.flaSha256, null);
});
