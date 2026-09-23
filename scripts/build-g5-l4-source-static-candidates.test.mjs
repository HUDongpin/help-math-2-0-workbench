import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  G5_L4_SOURCE_STATIC_IDS,
  parseArguments,
  validateG5L4SourceStaticSpec,
} from "./build-g5-l4-source-static-candidates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("G5 L4 source-static CLI is bounded and fail-closed", () => {
  assert.deepEqual(parseArguments([]), {
    check: false,
    ffdec: "ffdec",
    ids: [...G5_L4_SOURCE_STATIC_IDS],
  });
  assert.deepEqual(parseArguments([
    "--check",
    "--id", "course-g05-l04-vb-002",
    "--ffdec", "/opt/homebrew/bin/ffdec",
  ]), {
    check: true,
    ffdec: "/opt/homebrew/bin/ffdec",
    ids: ["course-g05-l04-vb-002"],
  });
  assert.throws(
    () => parseArguments(["--id", "course-g05-l04-in-999"]),
    /unsupported animation ID/,
  );
  assert.throws(
    () => parseArguments([
      "--id", "course-g05-l04-vb-002",
      "--id", "course-g05-l04-vb-002",
    ]),
    /duplicate --id/,
  );
  assert.throws(() => parseArguments(["--publish"]), /unknown argument/);
});

test("fifty-one checked specifications preserve exact root and nested domains", async () => {
  const expected = new Map([
    ["course-g05-l04-vb-002", ["sprite-49", 186]],
    ["course-g05-l04-vb-005", ["sprite-46", 264]],
    ["course-g05-l04-vb-006", ["sprite-42", 166]],
    ["course-g05-l04-in-009", ["sprite-29", 504]],
    ["course-g05-l04-in-015", ["sprite-101", 601]],
    ["course-g05-l04-ts-006", ["sprite-12", 245]],
    ["course-g05-l04-ts-002", ["sprite-28", 324]],
    ["course-g05-l04-ts-005", ["sprite-30", 234]],
    ["course-g05-l04-vb-008", ["sprite-50", 197]],
    ["course-g05-l04-vb-009", ["sprite-51", 189]],
    ["course-g05-l04-in-020", ["sprite-37", 282]],
    ["course-g05-l04-in-012", ["sprite-48", 298]],
    ["course-g05-l04-ts-003", ["sprite-25", 227]],
    ["course-g05-l04-ts-004", ["sprite-36", 290]],
    ["course-g05-l04-rw-003", ["sprite-535", 1141]],
    ["course-g05-l04-rw-004", ["sprite-227", 506]],
    ["course-g05-l04-in-002", ["sprite-52", 765]],
    ["course-g05-l04-in-007", ["sprite-76", 654]],
    ["course-g05-l04-rw-002", ["sprite-341", 419]],
    ["course-g05-l04-in-004", ["sprite-436", 320]],
    ["course-g05-l04-in-018", ["sprite-220", 275]],
    ["course-g05-l04-in-017", ["sprite-494", 541]],
    ["course-g05-l04-in-016", ["sprite-264", 299]],
    ["course-g05-l04-in-014", ["sprite-170", 197]],
    ["course-g05-l04-in-013", ["sprite-170", 178]],
    ["course-g05-l04-in-010", ["sprite-58", 180]],
    ["course-g05-l04-in-005", ["sprite-222", 226]],
    ["course-g05-l04-in-003", ["sprite-217", 182]],
    ["course-g05-l04-vb-007", ["sprite-230", 136]],
    ["course-g05-l04-vb-010", ["sprite-228", 88]],
    ["course-g05-l04-vb-011", ["sprite-225", 81]],
    ["course-g05-l04-ts-008", ["sprite-435", 695]],
    ["course-g05-l04-ts-007", ["sprite-462", 684]],
    ["course-g05-l04-vb-003", ["sprite-95", 175]],
    ["course-g05-l04-vb-004", ["sprite-71", 257]],
    ["course-g05-l04-in-006", ["sprite-103", 464]],
    ["course-g05-l04-in-008", ["sprite-123", 195]],
    ["course-g05-l04-in-011", ["sprite-231", 428]],
    ["course-g05-l04-in-019", ["sprite-265", 274]],
    ["course-g05-l04-in-021", ["sprite-97", 288]],
    ["course-g05-l04-in-022", ["sprite-355", 475]],
    ["course-g05-l04-ti-002", ["sprite-413", 275]],
    ["course-g05-l04-ti-003", ["sprite-270", 164]],
    ["course-g05-l04-ti-004", ["sprite-299", 472]],
    ["course-g05-l04-ti-005", ["sprite-272", 363]],
    ["course-g05-l04-ti-006", ["sprite-191", 237]],
    ["course-g05-l04-ti-007", ["sprite-177", 167]],
    ["course-g05-l04-ti-008", ["sprite-160", 146]],
    ["course-g05-l04-ti-009", ["sprite-171", 114]],
    ["course-g05-l04-gs-002", ["sprite-436", 460]],
    ["course-g05-l04-ir-001-a662633d", ["sprite-53", 136]],
  ]);
  const swfOnlyPlacementNames = new Map([
    ["course-g05-l04-rw-003", "Animation"],
    ["course-g05-l04-rw-004", "Animation"],
    ["course-g05-l04-in-002", "animation"],
    ["course-g05-l04-in-007", "animation"],
    ["course-g05-l04-rw-002", "Animation"],
    ["course-g05-l04-in-004", "animation"],
    ["course-g05-l04-in-017", "animation"],
    ["course-g05-l04-ti-002", "animation"],
  ]);
  const blockedLocalFrameRanges = new Map([
    ["course-g05-l04-in-004", [{
      firstFrame: 308,
      lastFrame: 320,
      reason:
        "Frames 308..320 place source right/wrong feedback clips whose visibility and progression depend on unresolved host and ActionScript state.",
    }]],
    ["course-g05-l04-in-018", [{
      firstFrame: 218,
      lastFrame: 275,
      reason:
        "Frames 218..275 begin quiz, NewProblem, Q2/Q3, answer, and feedback states whose causal transitions depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-017", [{
      firstFrame: 374,
      lastFrame: 541,
      reason:
        "Frames 374..541 begin quiz answer, feedback, and continuation states whose causal transitions depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-016", [{
      firstFrame: 191,
      lastFrame: 299,
      reason:
        "Frames 191..299 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-014", [{
      firstFrame: 84,
      lastFrame: 197,
      reason:
        "Frames 84..197 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-013", [{
      firstFrame: 83,
      lastFrame: 178,
      reason:
        "Frames 83..178 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-010", [{
      firstFrame: 130,
      lastFrame: 180,
      reason:
        "Frames 130..180 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-005", [{
      firstFrame: 93,
      lastFrame: 226,
      reason:
        "Frames 93..226 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-003", [{
      firstFrame: 74,
      lastFrame: 182,
      reason:
        "Frames 74..182 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-vb-007", [{
      firstFrame: 53,
      lastFrame: 136,
      reason:
        "Frames 53..136 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-vb-010", [{
      firstFrame: 36,
      lastFrame: 88,
      reason:
        "Frames 36..88 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-vb-011", [{
      firstFrame: 33,
      lastFrame: 81,
      reason:
        "Frames 33..81 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ts-008", [{
      firstFrame: 273,
      lastFrame: 695,
      reason:
        "Frames 273..695 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ts-007", [{
      firstFrame: 264,
      lastFrame: 684,
      reason:
        "Frames 264..684 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-vb-003", [{
      firstFrame: 126,
      lastFrame: 175,
      reason:
        "Frames 126..175 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-vb-004", [{
      firstFrame: 209,
      lastFrame: 257,
      reason:
        "Frames 209..257 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-006", [{
      firstFrame: 414,
      lastFrame: 464,
      reason:
        "Frames 414..464 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-008", [{
      firstFrame: 122,
      lastFrame: 195,
      reason:
        "Frames 122..195 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-011", [{
      firstFrame: 342,
      lastFrame: 428,
      reason:
        "Frames 342..428 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-019", [{
      firstFrame: 221,
      lastFrame: 274,
      reason:
        "Frames 221..274 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-021", [{
      firstFrame: 287,
      lastFrame: 288,
      reason:
        "Frames 287..288 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-in-022", [{
      firstFrame: 412,
      lastFrame: 475,
      reason:
        "Frames 412..475 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-002", [{
      firstFrame: 257,
      lastFrame: 275,
      reason:
        "Frames 257..275 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-003", [{
      firstFrame: 163,
      lastFrame: 164,
      reason:
        "Frames 163..164 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-004", [{
      firstFrame: 198,
      lastFrame: 472,
      reason:
        "Frames 198..472 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-005", [{
      firstFrame: 138,
      lastFrame: 363,
      reason:
        "Frames 138..363 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-006", [{
      firstFrame: 188,
      lastFrame: 237,
      reason:
        "Frames 188..237 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-007", [{
      firstFrame: 112,
      lastFrame: 167,
      reason:
        "Frames 112..167 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-008", [{
      firstFrame: 95,
      lastFrame: 146,
      reason:
        "Frames 95..146 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-ti-009", [{
      firstFrame: 97,
      lastFrame: 114,
      reason:
        "Frames 97..114 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
    ["course-g05-l04-gs-002", [{
      firstFrame: 452,
      lastFrame: 460,
      reason:
        "Frames 452..460 begin a stop- and release-handler-controlled randomized game; question selection, scoring/timer state, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
    }]],
  ]);
  assert.deepEqual([...G5_L4_SOURCE_STATIC_IDS], [...expected.keys()]);
  for (const [animationId, [frameDomain, frameCount]] of expected) {
    const spec = validateG5L4SourceStaticSpec(JSON.parse(await readFile(
      path.join(
        ROOT,
        "migrations",
        animationId,
        "audit",
        "source-static-current-js-candidate-spec.json",
      ),
      "utf8",
    )));
    assert.equal(spec.timeline.root.frameCount, 10);
    assert.equal(spec.timeline.root.beginFrame, 6);
    if (["course-g05-l04-ts-003", "course-g05-l04-ts-004"]
      .includes(animationId)) {
      assert.equal(spec.timeline.root.preloaderStopFrame, null);
      assert.equal(spec.timeline.root.preloaderNavigationFrame, 1);
      assert.equal(
        spec.timeline.root.preloaderNavigationAction,
        '_level0.InternalPreloader.gotoAndPlay("jump_check");',
      );
    } else {
      assert.equal(spec.timeline.root.preloaderStopFrame, 1);
    }
    assert.equal(spec.timeline.local.timelineId, frameDomain);
    assert.equal(spec.timeline.local.frameCount, frameCount);
    if (swfOnlyPlacementNames.has(animationId)) {
      assert.equal(spec.source.pairedFlaStatus, "missing");
      assert.equal(spec.source.fla, null);
      assert.equal(spec.source.flaBytes, null);
      assert.equal(spec.source.flaSha256, null);
      assert.equal(
        spec.timeline.root.placementName,
        swfOnlyPlacementNames.get(animationId),
      );
    }
    assert.deepEqual(spec.runtimeContract.supportedLanguages, ["en"]);
    assert.deepEqual(
      spec.runtimeContract.blockedLocalFrameRanges,
      blockedLocalFrameRanges.get(animationId) ?? [],
    );
    assert.match(
      spec.evidence.prebindingScenarioInventory,
      /source-static-prebinding-antecedents\/scenario-inventory\.json$/,
    );
    assert.match(
      spec.evidence.prebindingFrameDomainDisposition,
      /source-static-prebinding-antecedents\/frame-domain-disposition\.json$/,
    );
    assert.equal(spec.evidence.scenarioInventory, undefined);
    assert.equal(spec.evidence.frameDomainDisposition, undefined);
    assert.equal(
      spec.runtimeContract.prebindingTargetFrameDomainDisposition,
      "unresolved",
    );
    assert.equal(
      spec.runtimeContract.currentCanonicalFrameDomainDispositionAsserted,
      false,
    );
    assert.equal(spec.strictAcceptanceEffect, "none");
  }
});

test("SWF-only specifications reject invented or mixed FLA bindings", async () => {
  const spec = JSON.parse(await readFile(path.join(
    ROOT,
    "migrations",
    "course-g05-l04-rw-003",
    "audit",
    "source-static-current-js-candidate-spec.json",
  ), "utf8"));
  for (const sourcePatch of [
    {fla: "source-assets/flash/invented.fla"},
    {flaBytes: 1},
    {flaSha256: "f".repeat(64)},
    {pairedFlaStatus: "present"},
  ]) {
    assert.throws(
      () => validateG5L4SourceStaticSpec({
        ...spec,
        source: {...spec.source, ...sourcePatch},
      }),
      /paired FLA/,
    );
  }
});

test("IR001 binds embedded audio to the exact SWF container", async () => {
  const spec = JSON.parse(await readFile(path.join(
    ROOT,
    "migrations",
    "course-g05-l04-ir-001-a662633d",
    "audit",
    "source-static-current-js-candidate-spec.json",
  ), "utf8"));
  assert.doesNotThrow(() => validateG5L4SourceStaticSpec(spec));
  assert.equal(
    spec.source.associatedAudioKind,
    "embedded-swf-stream-container",
  );
  assert.equal(spec.source.associatedAudio, spec.source.swf);
  assert.equal(spec.source.associatedAudioBytes, spec.source.swfBytes);
  assert.equal(spec.source.associatedAudioSha256, spec.source.swfSha256);
  assert.throws(
    () => validateG5L4SourceStaticSpec({
      ...spec,
      source: {
        ...spec.source,
        associatedAudioSha256: "f".repeat(64),
      },
    }),
    /embedded audio container/,
  );
});

test("generated outputs remain acceptance-neutral and cover every allowed local frame", async () => {
  for (const animationId of G5_L4_SOURCE_STATIC_IDS) {
    const [spec, manifest, report] = await Promise.all([
      readFile(path.join(
        ROOT,
        "migrations",
        animationId,
        "audit",
        "source-static-current-js-candidate-spec.json",
      ), "utf8").then(JSON.parse),
      readFile(path.join(
        ROOT,
        "public",
        "flash-assets",
        "courses",
        animationId,
        "manifest.json",
      ), "utf8").then(JSON.parse),
      readFile(path.join(
        ROOT,
        "migrations",
        animationId,
        "evidence",
        "source-static-current-js-candidate.json",
      ), "utf8").then(JSON.parse),
    ]);
    assert.equal(manifest.animationId, animationId);
    assert.equal(
      manifest.inputs.sourceFla.pairedFlaStatus,
      spec.source.pairedFlaStatus ?? "present",
    );
    if (spec.source.pairedFlaStatus === "missing") {
      assert.deepEqual(manifest.inputs.sourceFla, {
        pairedFlaStatus: "missing",
        path: null,
        bytes: null,
        sha256: null,
        authoringAuditEstablished: false,
      });
      assert.deepEqual(report.source.fla, manifest.inputs.sourceFla);
    }
    assert.equal(manifest.timeline.deterministicContentTimeline.frameCount,
      spec.timeline.local.frameCount);
    const blockedFrameCount =
      spec.runtimeContract.blockedLocalFrameRanges.reduce(
        (count, {firstFrame, lastFrame}) =>
          count + lastFrame - firstFrame + 1,
        0,
      );
    const renderableFrameCount =
      spec.timeline.local.frameCount - blockedFrameCount;
    assert.equal(manifest.browserQa.renderedFrameCount, renderableFrameCount);
    assert.equal(manifest.browserQa.blockedFrameCount, blockedFrameCount);
    assert.equal(
      manifest.browserQa.blockedRequestRejectionCount,
      blockedFrameCount * 2,
    );
    const expectedSafePrefixBoundary = spec.runtimeContract.safePrefixBoundary
      ? {
          ...spec.runtimeContract.safePrefixBoundary,
          scenarioAntecedent: {
            path: spec.evidence.prebindingScenarioInventory,
            sha256: spec.evidence.prebindingScenarioInventorySha256,
            immutable: true,
          },
          scriptInventory: {
            path: spec.evidence.boundaryScriptInventory,
            sha256: spec.evidence.boundaryScriptInventorySha256,
          },
          swfmillStructure: {
            path: spec.evidence.swfmillStructure,
            sha256: spec.evidence.swfmillStructureSha256,
          },
        }
      : undefined;
    assert.deepEqual(manifest.sourceStaticFrameContract, {
      sourceTimelineFirstFrame: 1,
      sourceTimelineLastFrame: spec.timeline.local.frameCount,
      renderableFrames: renderableFrameCount,
      blockedLocalFrameRanges:
        spec.runtimeContract.blockedLocalFrameRanges,
      ...(expectedSafePrefixBoundary
        ? {safePrefixBoundary: expectedSafePrefixBoundary}
        : {}),
    });
    assert.equal(
      manifest.inputs.associatedAudio.kind,
      spec.source.associatedAudioKind ?? "external-file",
    );
    assert.equal(
      report.source.associatedAudio.kind,
      spec.source.associatedAudioKind ?? "external-file",
    );
    if (expectedSafePrefixBoundary) {
      assert.deepEqual(
        manifest.inputs.safePrefixBoundaryEvidence,
        expectedSafePrefixBoundary,
      );
      assert.deepEqual(
        report.renderer.safePrefixBoundary,
        expectedSafePrefixBoundary,
      );
    }
    assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
    assert.equal(manifest.safety.noNetworkPrimitives, true);
    assert.equal(manifest.safety.noTimersOrAutoplay, true);
    assert.equal(
      manifest.inputs.prebindingScenarioInventory.immutableAntecedent,
      true,
    );
    assert.equal(
      manifest.inputs.prebindingFrameDomainDisposition
        .antecedentDispositionWasUnresolved,
      true,
    );
    assert.equal(
      manifest.inputs.prebindingFrameDomainDisposition
        .currentCanonicalDispositionAsserted,
      false,
    );
    assert.ok(Object.values(manifest.acceptanceEffects).every(
      (value) => value === false,
    ));
    assert.equal(report.animationId, animationId);
    assert.equal(report.renderer.rootEnabled, false);
    assert.equal(report.renderer.renderableFrameCount, renderableFrameCount);
    assert.equal(
      report.renderer.lastRenderableFrame,
      spec.runtimeContract.blockedLocalFrameRanges.length
        ? spec.runtimeContract.blockedLocalFrameRanges[0].firstFrame - 1
        : spec.timeline.local.frameCount,
    );
    assert.deepEqual(
      report.renderer.blockedLocalFrameRanges,
      spec.runtimeContract.blockedLocalFrameRanges,
    );
    assert.deepEqual(report.renderer.supportedLanguages, ["en"]);
    assert.equal(report.renderer.audioEnabled, false);
    assert.equal(report.evidenceBoundary.prebindingAntecedentUsed, true);
    assert.equal(
      report.evidenceBoundary.currentCanonicalFrameDomainDispositionAsserted,
      false,
    );
    assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false);
    assert.equal(report.evidenceBoundary.normalizedRmseComputed, false);
    assert.equal(report.strictAcceptanceEffect, "none");
  }
});

test("partial specifications fail closed if a blocked range is dropped or shifted", async () => {
  for (const animationId of [
    "course-g05-l04-in-004",
    "course-g05-l04-in-018",
    "course-g05-l04-in-017",
    "course-g05-l04-in-016",
    "course-g05-l04-in-014",
    "course-g05-l04-in-013",
    "course-g05-l04-in-010",
    "course-g05-l04-in-005",
    "course-g05-l04-in-003",
    "course-g05-l04-vb-007",
    "course-g05-l04-vb-010",
    "course-g05-l04-vb-011",
    "course-g05-l04-ts-008",
    "course-g05-l04-ts-007",
    "course-g05-l04-vb-003",
    "course-g05-l04-vb-004",
    "course-g05-l04-in-006",
    "course-g05-l04-in-008",
    "course-g05-l04-in-011",
    "course-g05-l04-in-019",
    "course-g05-l04-in-021",
    "course-g05-l04-in-022",
    "course-g05-l04-ti-002",
    "course-g05-l04-ti-003",
    "course-g05-l04-ti-004",
    "course-g05-l04-ti-005",
    "course-g05-l04-ti-006",
    "course-g05-l04-ti-007",
    "course-g05-l04-ti-008",
    "course-g05-l04-ti-009",
    "course-g05-l04-gs-002",
  ]) {
    const spec = JSON.parse(await readFile(path.join(
      ROOT,
      "migrations",
      animationId,
      "audit",
      "source-static-current-js-candidate-spec.json",
    ), "utf8"));
    assert.throws(
      () => validateG5L4SourceStaticSpec({
        ...spec,
        runtimeContract: {
          ...spec.runtimeContract,
          blockedLocalFrameRanges: [],
        },
      }),
      /fail-closed runtime contract changed/,
    );
    assert.throws(
      () => validateG5L4SourceStaticSpec({
        ...spec,
        runtimeContract: {
          ...spec.runtimeContract,
          blockedLocalFrameRanges:
            spec.runtimeContract.blockedLocalFrameRanges.map((range) => ({
              ...range,
              firstFrame: range.firstFrame + 1,
            })),
        },
      }),
      /fail-closed runtime contract changed/,
    );
  }
});
