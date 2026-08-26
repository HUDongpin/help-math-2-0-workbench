import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  KEYFRAME_HEADERS,
  RECEIPT_PATH,
  buildCandidateRows,
  materializeG5L4SourceDerivedKeyframeCandidates,
  parseArguments,
  validateSuccessorReceipt,
} from "./materialize-g5-l4-source-derived-keyframe-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const sourceSha256 = "1".repeat(64);

function fixtureMember(animationId) {
  return {
    animationId,
    assetId: `swf-${sourceSha256}`,
    source: {
      path: `source-assets/flash/${animationId}.swf`,
      sha256: sourceSha256,
    },
    workspacePath: `migrations/${animationId}`,
  };
}

function fixtureMigration(animationId, frameDomains) {
  return {
    schemaVersion: 2,
    animationId,
    id: animationId,
    assetId: `swf-${sourceSha256}`,
    status: "preserved",
    source: {swfSha256: sourceSha256},
    runtime: {fps: 12, frameCount: 10},
    implementation: {
      frameDomains,
      candidateState: {
        status: "current-javascript-engineering-candidate-only",
        originalRuntimeBaselineUsed: false,
        strictAcceptanceEffect: "none",
      },
    },
    baseline: {authority: "undecided"},
    acceptance: {
      humanVisualReview: {decision: "pending"},
      ownerReview: {decision: "pending"},
    },
  };
}

function fixtureRequirement(domain, language) {
  return {
    requirementId: `req-default-${domain.id}-${language}`,
    frameDomainId: domain.id,
    traceId: `default-${domain.id}-${language}`,
    entryStateSha256: language === "en" ? "a".repeat(64) : "b".repeat(64),
    scenario: "default",
    language,
    requiredRange: {firstFrame: 1, lastFrame: domain.frameCount},
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    baselineCaptureManifest: "",
    captureManifest: "",
    metricsFile: "",
  };
}

function fixtureCoverage(frameDomains) {
  return {
    schemaVersion: 2,
    requirements: frameDomains.flatMap((domain) => [
      fixtureRequirement(domain, "en"),
      fixtureRequirement(domain, "es"),
    ]),
  };
}

function fixtureTimeline({
  timelineId,
  frameCount,
  controlStates,
  namedPlacements = [],
  structuralReachability = "reachable-from-root-placement-graph",
}) {
  return {
    timelineId,
    frameCount,
    structuralReachability,
    controlStates,
    frameLabels: [],
    namedPlacements,
  };
}

function fixtureInventory(animationId, handlers = []) {
  return {
    schemaVersion: 1,
    animationId,
    source: {
      swfSha256: sourceSha256,
      rootFrameCount: 10,
      fps: 12,
    },
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authoritativeRuntimeEvidence: [],
    timelineInventory: [
      fixtureTimeline({
        timelineId: "root",
        frameCount: 10,
        structuralReachability: "root",
        controlStates: [
          {
            frame: 1,
            reasons: ["initial-one-indexed-frame", "script-stop-state"],
          },
          {frame: 10, reasons: ["terminal-structural-frame"]},
        ],
        namedPlacements: [
          {frame: 6, objectId: "7", depth: "1", name: "animation"},
        ],
      }),
      fixtureTimeline({
        timelineId: "sprite-7",
        frameCount: 2,
        controlStates: [
          {frame: 1, reasons: ["initial-one-indexed-frame"]},
          {frame: 2, reasons: ["terminal-structural-frame"]},
        ],
      }),
    ],
    interactions: {handlers},
  };
}

function fixtureHandler() {
  return {
    id: "script-0001",
    script: "DefineSprite_7/frame_2/DoAction.as",
    bodySha256: "c".repeat(64),
    event: ["release"],
    categories: ["navigation"],
    signals: {randomCalls: [], sideEffects: [], transitions: [{}]},
    timelineContext: {timelineId: "sprite-7", frame: 2},
    hitTarget: {placements: []},
  };
}

function parseCsv(text) {
  const records = [];
  let record = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === "\"" && text[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else if (character === "\"") {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === "\"") {
      quoted = true;
    } else if (character === ",") {
      record.push(cell);
      cell = "";
    } else if (character === "\n") {
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  assert.equal(quoted, false, "CSV quote must be closed");
  const [headers, ...rows] = records;
  assert.deepEqual(headers, KEYFRAME_HEADERS);
  return rows.map((values) => Object.fromEntries(
    headers.map((header, index) => [header, values[index]]),
  ));
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function assetInventorySnapshot() {
  const scope = JSON.parse(await readFile(
    path.join(projectRoot, "reports/g5-l4-source-scope-freeze.json"),
    "utf8",
  ));
  return Object.fromEntries(await Promise.all(scope.members.map(async (member) => {
    const relativePath = `${member.workspacePath}/asset-inventory.csv`;
    const absolutePath = path.join(projectRoot, relativePath);
    const [stats, bytes] = await Promise.all([
      lstat(absolutePath),
      readFile(absolutePath),
    ]);
    return [relativePath, {
      dev: stats.dev,
      ino: stats.ino,
      mode: stats.mode,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      sha256: digest(bytes),
    }];
  })));
}

test("CLI defaults to dry-run and rejects ambiguous or authority options", () => {
  assert.deepEqual(parseArguments([]), {mode: "dry-run"});
  assert.deepEqual(parseArguments(["--apply"]), {mode: "apply"});
  assert.deepEqual(parseArguments(["--check"]), {mode: "check"});
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /choose exactly one/u,
  );
  assert.throws(() => parseArguments(["--accept"]), /unknown option/u);
});

test("product-only child facts stay at a declared root anchor without becoming runtime terminal evidence", () => {
  const animationId = "course-g05-l04-fq-002";
  const rootDomain = {
    id: "root",
    sourceTimelineId: "root",
    frameCount: 10,
  };
  const result = buildCandidateRows({
    member: fixtureMember(animationId),
    migration: fixtureMigration(animationId, [rootDomain]),
    coverage: fixtureCoverage([rootDomain]),
    scenarioInventory: fixtureInventory(animationId),
  });
  assert.equal(result.candidateClass,
    "product-question-atlas-structural-candidate");
  assert.equal(result.rows.length, 6);
  const anchorRows = result.rows.filter(({frame}) => frame === "6");
  assert.equal(anchorRows.length, 2);
  assert.ok(anchorRows.every(({frame_domain_id}) => frame_domain_id === "root"));
  assert.ok(anchorRows.every(({kind}) => kind === "static"));
  assert.ok(anchorRows.every(({expected_state}) =>
    expected_state.includes("directReasons=none") &&
    expected_state.includes("controlStates=2")));
  assert.ok(anchorRows.every(({notes}) =>
    notes.includes("not an observed runtime frame") &&
    notes.includes("Product/structural candidate boundary")));

  const withHandler = buildCandidateRows({
    member: fixtureMember(animationId),
    migration: fixtureMigration(animationId, [rootDomain]),
    coverage: fixtureCoverage([rootDomain]),
    scenarioInventory: fixtureInventory(animationId, [fixtureHandler()]),
  });
  assert.ok(withHandler.rows
    .filter(({frame}) => frame === "6")
    .every(({kind, trigger}) =>
      kind === "interaction" &&
      trigger === "static-source-interaction-obligation"));
});

test("a declared nested domain retains its own source-static frame identities", () => {
  const animationId = "course-g05-l04-rw-999";
  const domains = [
    {id: "root", sourceTimelineId: "root", frameCount: 10},
    {id: "sprite-7", sourceTimelineId: "sprite-7", frameCount: 2},
  ];
  const result = buildCandidateRows({
    member: fixtureMember(animationId),
    migration: fixtureMigration(animationId, domains),
    coverage: fixtureCoverage(domains),
    scenarioInventory: fixtureInventory(animationId),
  });
  assert.equal(result.candidateClass,
    "manifest-bound-source-static-candidate");
  const nested = result.rows.filter(
    ({frame_domain_id}) => frame_domain_id === "sprite-7",
  );
  assert.deepEqual([...new Set(nested.map(({frame}) => frame))], ["1", "2"]);
  assert.ok(nested.filter(({frame}) => frame === "1")
    .every(({kind}) => kind === "structural-initial"));
  assert.ok(nested.filter(({frame}) => frame === "2")
    .every(({kind, time_ms}) =>
      kind === "structural-terminal" && time_ms === "83.333333"));
});

test("real dry-run derives the exact acceptance-neutral G5 L4 successor without asset-inventory writes", async () => {
  const before = await assetInventorySnapshot();
  const result = await materializeG5L4SourceDerivedKeyframeCandidates({
    root: projectRoot,
    mode: "dry-run",
  });
  const after = await assetInventorySnapshot();
  assert.deepEqual(after, before);
  assert.equal(result.changed, false);
  assert.equal(result.memberCount, 55);
  assert.equal(result.requirementCount, 212);
  assert.equal(result.rowCount, 802);
  assert.equal(result.mappedControlStateCount, 2188);
  assert.equal(result.unmappedControlStateCount, 492);
  assert.equal(result.mappedHandlerCount, 874);
  assert.equal(result.unmappedHandlerCount, 44);
  assert.equal(result.authoritativeBaselineKeyframeCount, 0);
  assert.equal(result.observedRuntimeRowCount, 0);
  assert.ok(Object.values(result.acceptanceEffects).every(
    (value) => value === false,
  ));
});

test("checked-in successor validates and special product members remain root-only candidates", async () => {
  const result = await materializeG5L4SourceDerivedKeyframeCandidates({
    root: projectRoot,
    mode: "check",
  });
  assert.equal(result.changed, false);
  for (const animationId of [
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
    "shell-course-g05-l04-index-local",
  ]) {
    const rows = parseCsv(await readFile(
      path.join(projectRoot, `migrations/${animationId}/keyframes.csv`),
      "utf8",
    ));
    assert.ok(rows.length > 0);
    assert.ok(rows.every(({frame_domain_id}) => frame_domain_id === "root"));
    assert.ok(rows.every((row) =>
      row.baseline_file === "" &&
      row.baseline_sha256 === "" &&
      row.implementation_file === "" &&
      row.implementation_sha256 === "" &&
      row.diff_file === "" &&
      row.diff_sha256 === "" &&
      row.normalized_rmse === "" &&
      row.reviewer === "" &&
      row.timing_result === "pending-authoritative-original-runtime" &&
      row.visual_result === "pending-authoritative-original-runtime" &&
      row.notes.includes("not an observed runtime frame") &&
      row.notes.includes("Product/structural candidate boundary")));
  }
});

test("successor receipt validates its fingerprint and rejects acceptance promotion", async () => {
  const receipt = JSON.parse(await readFile(
    path.join(projectRoot, RECEIPT_PATH),
    "utf8",
  ));
  assert.equal(validateSuccessorReceipt(receipt), true);

  const promoted = structuredClone(receipt);
  promoted.acceptanceEffects.ownerAccepted = true;
  assert.throws(
    () => validateSuccessorReceipt(promoted),
    /candidate-only authority boundary/u,
  );

  const drifted = structuredClone(receipt);
  drifted.summary.rowCount += 1;
  assert.throws(
    () => validateSuccessorReceipt(drifted),
    /fingerprint drifted/u,
  );
});
