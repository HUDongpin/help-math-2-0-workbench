import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  KEYFRAME_HEADERS,
  buildStructuralRows,
  canonicalJson,
  isPristineGeneratedStructuralRefresh,
  materializeLessonReleaseStructuralKeyframes,
  parseArguments,
  selectLessonRelease,
} from "./materialize-lesson-release-structural-keyframes.mjs";

const RELEASE_ID = "lesson-g04-l10-test";
const PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const HEADER = `${KEYFRAME_HEADERS.join(",")}\n`;

test("pristine structural rows may refresh only source-binding evidence", () => {
  const row = Object.fromEntries(KEYFRAME_HEADERS.map((header) => [header, ""]));
  Object.assign(row, {
    frame: "1",
    requirement_id: "req-root-en",
    frame_domain_id: "root",
    trace_id: "default-root-en",
    entry_state_sha256: "a".repeat(64),
    time_ms: "0",
    scenario: "default",
    language: "en",
    kind: "structural-specification-initial",
    expected_state: "source-root-structural-specification-only",
    trigger: "source-static-root-frame-selection-only",
    evidence_source: Array.from({length: 6}, (_, index) =>
      `evidence-${index}@sha256:${"b".repeat(64)}`).join("; "),
    notes: "acceptance-neutral structural row",
  });
  const updated = {
    ...row,
    evidence_source: Array.from({length: 6}, (_, index) =>
      `evidence-${index}@sha256:${"c".repeat(64)}`).join("; "),
  };
  const csv = (candidate) => `${HEADER}${KEYFRAME_HEADERS.map((header) =>
    candidate[header]).join(",")}\n`;
  assert.equal(isPristineGeneratedStructuralRefresh(csv(row), csv(updated)),
    true);
  assert.equal(isPristineGeneratedStructuralRefresh(csv(row), csv(row)),
    false);
  assert.equal(isPristineGeneratedStructuralRefresh(
    csv({...row, reviewer: "human"}), csv(updated)), false);
  assert.equal(isPristineGeneratedStructuralRefresh(
    csv({...row, normalized_rmse: "0.01"}), csv(updated)), false);
  assert.equal(isPristineGeneratedStructuralRefresh(
    csv({...row, requirement_id: "adopted"}), csv(updated)), false);
});

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function put(root, relativePath, value) {
  const target = path.join(root, ...relativePath.split("/"));
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, value);
  return target;
}

function sourceIdentity(member) {
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  };
}

function traceIdentity(member) {
  return {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  };
}

function indexedTraceIdentity(member) {
  const result = traceIdentity(member);
  delete result.animationId;
  return result;
}

function selectionFor(release, members, scope) {
  const identity = {
    releaseId: release.releaseId,
    scope,
    orderedMembers: members.map(sourceIdentity),
  };
  return {identity, sha256: digest(canonicalJson(identity))};
}

function requirement(language, frameCount) {
  return {
    requirementId: `req-default-root-${language}`,
    scenario: "default",
    frameDomainId: "root",
    traceId: `default-root-${language}`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState: {kind: "initial-load", language},
    entryStateSha256: digest(`entry-${language}`),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "blocked",
    capturedFrameCount: 0,
    baselineCaptureManifest: "",
    captureManifest: "",
    metricsFile: "",
    strictAcceptanceEffect: "none",
  };
}

async function makeMemberArtifacts({root, member, release, catalogBinding, stage}) {
  const id = member.animationId;
  const workspace = `migrations/${id}`;
  const swfPath = `${PREFIX}${member.source.path}`;
  const runtime = {stage, fps: 12, frameCount: 3};
  const migration = {
    schemaVersion: 2,
    id,
    animationId: id,
    assetId: member.assetId,
    status: "preserved",
    source: {
      swf: swfPath,
      placementPath: swfPath,
      swfSha256: member.source.sha256,
    },
    runtime,
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default"}],
    implementation: {
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        parentFrameDomainId: null,
        frameCount: 3,
      }],
    },
    baseline: {authority: "undecided"},
    acceptance: {
      humanVisualReview: {decision: "pending"},
      ownerReview: {decision: "pending"},
    },
  };
  const coverage = {
    schemaVersion: 2,
    animationId: id,
    requirements: [requirement("en", 3), requirement("es", 3)],
  };
  const scenario = {
    schemaVersion: 1,
    animationId: id,
    source: {
      swf: swfPath,
      swfSha256: member.source.sha256,
      stage,
      fps: 12,
      rootFrameCount: 3,
    },
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authoritativeRuntimeEvidence: [],
    timelineInventory: [{
      timelineId: "root",
      frameCount: 3,
      structuralReachability: "root",
      controlStates: [
        {frame: 1, reasons: ["initial-one-indexed-frame"]},
        {frame: 2, reasons: ["script-stop-state"]},
        {frame: 3, reasons: ["terminal-structural-frame"]},
      ],
      frameLabels: [{frame: 2, label: "begin"}],
      namedPlacements: [{frame: 2, name: "animation", objectId: "7"}],
    }],
    evidenceIndex: [],
    strictAcceptanceEffect:
      "none; fixture is static-only and acceptance-neutral",
  };
  const scenarioBytes = Buffer.from(json(scenario));
  const disposition = {
    schemaVersion: 1,
    animationId: id,
    migrationStatusChanged: false,
    generatedFrom: {
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        sha256: digest(scenarioBytes),
      },
      sourceSwf: {path: swfPath, sha256: member.source.sha256},
    },
    timelines: [{
      sourceTimelineId: "root",
      disposition: "declared-frame-domain",
      declaredFrameDomains: [{
        frameDomainId: "root",
        sourceTimelineId: "root",
        frameCount: 3,
      }],
    }],
  };
  const dispositionBytes = Buffer.from(json(disposition));
  await put(root, `${workspace}/migration.json`, json(migration));
  await put(root, `${workspace}/evidence/full-frame-coverage.json`, json(coverage));
  await put(root, `${workspace}/audit/scenario-inventory.json`, scenarioBytes);
  await put(root, `${workspace}/audit/frame-domain-disposition.json`, dispositionBytes);
  await put(root, `${workspace}/keyframes.csv`, HEADER);

  const archiveRoot = `artifacts/full-frame/test-baselines/${id}/ffdec-root-frames`;
  const frameBytes = [Buffer.from(`${id}-frame-1`),
    Buffer.from(`${id}-frame-2`), Buffer.from(`${id}-frame-2`)];
  const frames = [];
  for (let index = 0; index < frameBytes.length; index += 1) {
    await put(root, `${archiveRoot}/${index + 1}.png`, frameBytes[index]);
    frames.push({
      frame: index + 1,
      file: `${index + 1}.png`,
      sha256: digest(frameBytes[index]),
      bytes: frameBytes[index].length,
      width: Math.ceil(stage.width),
      height: Math.ceil(stage.height),
    });
  }
  const baseline = {
    schemaVersion: 1,
    animationId: id,
    status: "structural-baseline-only",
    authority: {
      kind: "swf-static-root-timeline-render",
      limitations: ["No ActionScript execution or runtime authority."],
    },
    source: {swf: swfPath, swfSha256: member.source.sha256},
    runtime: {
      stage,
      rasterization: {
        rule: "ceil-positive-native-stage-dimensions",
        width: Math.ceil(stage.width),
        height: Math.ceil(stage.height),
      },
      fps: 12,
      frameCount: 3,
    },
    archive: {root: archiveRoot, ignoredByGit: true},
    frames,
  };
  await put(root, `${workspace}/baseline/ffdec-root-frames.json`, json(baseline));

  const technicalSha = technicalManifestSha256(migration);
  const coverageSha = traceCoverageSha256(coverage);
  const scenarioTechnicalSha = scenarioInventorySha256(scenario);
  const releaseFingerprint = digest(canonicalJson(release));
  const traceSpecs = [];
  for (const current of coverage.requirements) {
    const spec = {
      schemaVersion: 1,
      artifactType: "course-pilot-original-runtime-trace-specification",
      animationId: id,
      requirementId: current.requirementId,
      traceSpecStatus:
        "source-frame-accurate-root-ready-for-authoritative-capture",
      identity: {
        frameDomainId: current.frameDomainId,
        traceId: current.traceId,
        entryStateSha256: current.entryStateSha256,
        scenario: current.scenario,
        language: current.language,
        seed: current.seed,
        requiredRange: current.requiredRange,
        baselineAuthorityRequirement: current.baselineAuthorityRequirement,
      },
      frameDomain: {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        frameCount: 3,
        nativeStage: stage,
        fps: 12,
      },
      entryState: current.entryState,
      sourceBindings: {
        sourceSwf: {path: swfPath, sha256: member.source.sha256},
        migrationManifest: {sha256: technicalSha},
        fullFrameCoverage: {sha256: coverageSha},
        scenarioInventory: {sha256: scenarioTechnicalSha},
        scenarioInventoryExactFile: {sha256: digest(scenarioBytes)},
        frameDomainDisposition: {sha256: digest(dispositionBytes)},
        lessonReleaseCatalog: {
          sha256: catalogBinding.sha256,
          releaseFingerprintSha256: releaseFingerprint,
        },
      },
      executionEvidence: {
        status: "not-executed-by-this-generator",
        executionReport: null,
        originalRuntimeCaptureManifest: null,
        executedSteps: [],
      },
      strictAcceptanceEffect:
        "none; planning only and no acceptance gate is satisfied",
      lessonReleaseMembership: {
        releaseId: release.releaseId,
        publicationMode: "atomic",
        expectedAtomicMemberCount: release.expectedCounts.members,
        releaseFingerprintSha256: releaseFingerprint,
        member: traceIdentity(member),
        memberIdentitySha256: digest(canonicalJson(traceIdentity(member))),
        publicationAuthorized: false,
      },
    };
    const relative =
      `${workspace}/audit/trace-specs/lesson-releases/${release.releaseId}/` +
      `${current.requirementId}.json`;
    const bytes = Buffer.from(json(spec));
    await put(root, relative, bytes);
    traceSpecs.push({
      requirementId: current.requirementId,
      traceId: current.traceId,
      frameDomainId: "root",
      scenario: "default",
      language: current.language,
      seed: "0",
      traceModel: "frame-accurate-root-exhaustive",
      status: spec.traceSpecStatus,
      file: relative,
      sha256: digest(bytes),
      expectedExecutionReport:
        `${workspace}/baseline/trace-executions/${current.requirementId}.json`,
    });
  }
  return {
    animationId: id,
    releaseMembership: indexedTraceIdentity(member),
    sourceSwfSha256: member.source.sha256,
    technicalBindings: {
      manifest: {sha256: technicalSha},
      coverage: {sha256: coverageSha},
      scenarioInventory: {sha256: scenarioTechnicalSha},
      scenarioInventoryExactFile: {
        path: "audit/scenario-inventory.json",
        sha256: digest(scenarioBytes),
      },
      frameDomainDisposition: {
        path: "audit/frame-domain-disposition.json",
        sha256: digest(dispositionBytes),
      },
    },
    traceSpecDirectory:
      `${workspace}/audit/trace-specs/lesson-releases/${release.releaseId}`,
    requirementCount: 2,
    traceSpecs,
  };
}

async function writeIndex({root, catalogBinding, release, allEntries, members}) {
  const scope = members.length === release.members.length
    ? "complete-atomic-release" : "verified-subset";
  const selection = selectionFor(release, members, scope);
  const index = {
    schemaVersion: 1,
    artifactType: "lesson-release-original-runtime-trace-spec-index",
    status: "blocked-by-unresolved-frame-domain-dispositions",
    releaseCatalog: {
      path: "catalog/lesson-releases.json",
      bytes: catalogBinding.bytes,
      sha256: catalogBinding.sha256,
      schemaVersion: 1,
      releaseId: release.releaseId,
      releaseFingerprintSha256: digest(canonicalJson(release)),
      orderedMemberIdentitySha256: digest(canonicalJson(
        release.members.map(sourceIdentity),
      )),
    },
    releaseSelection: {
      ...selection.identity,
      selectionSha256: selection.sha256,
      atomicReleaseMemberCount: release.expectedCounts.members,
      selectedMemberCount: members.length,
      fullAtomicReleaseSelected: scope === "complete-atomic-release",
    },
    memberCount: members.length,
    requirementCount: members.length * 2,
    members: members.map((member) =>
      allEntries.find(({animationId}) => animationId === member.animationId)),
    strictAcceptanceEffect:
      "none; trace planning index has no acceptance effect",
  };
  const suffix = scope === "complete-atomic-release"
    ? "" : `--subset-${selection.sha256}`;
  await put(root,
    `migrations/lesson-release-trace-spec-indexes/${release.releaseId}${suffix}.json`,
    json(index));
}

async function makeFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "structural-keyframes-"));
  t.after(async () => rm(root, {recursive: true, force: true}));
  await put(root, "templates/flash-migration/keyframes.csv", HEADER);
  await mkdir(path.join(root, "migrations"), {recursive: true});
  const memberDefinitions = [
    ["course-g04-l10-test-001", "HELP_COURSES/ELMGR4/L10/TS/Test1.swf",
      Buffer.from("fixture-swf-one")],
    ["course-g04-l10-test-002", "HELP_COURSES/ELMGR4/L10/TI/Test2.swf",
      Buffer.from("fixture-swf-two")],
  ];
  const members = [];
  for (const [index, [animationId, sourcePath, bytes]] of
    memberDefinitions.entries()) {
    const sourceSha256 = digest(bytes);
    const member = {
      ordinal: index + 1,
      animationId,
      assetId: `swf-${sourceSha256}`,
      releaseRole: "active-xml-referenced-page",
      shardId: "test-shard",
      source: {path: sourcePath, sha256: sourceSha256},
    };
    members.push(member);
    await put(root, `${PREFIX}${sourcePath}`, bytes);
  }
  const release = {
    releaseId: RELEASE_ID,
    publicationMode: "atomic",
    expectedCounts: {members: 2, shards: 1},
    shards: [{shardId: "test-shard", ordinal: 1, memberCount: 2}],
    members,
  };
  const catalog = {schemaVersion: 1, releases: [release]};
  const catalogBytes = Buffer.from(json(catalog));
  await put(root, "catalog/lesson-releases.json", catalogBytes);
  const catalogBinding = {
    bytes: catalogBytes.length,
    sha256: digest(catalogBytes),
  };
  const entries = [];
  for (const [index, member] of members.entries()) {
    entries.push(await makeMemberArtifacts({
      root,
      member,
      release,
      catalogBinding,
      stage: index === 0 ? {width: 800, height: 600} :
        {width: 799.9, height: 599.75},
    }));
  }
  await writeIndex({root, catalogBinding, release, allEntries: entries, members});
  for (const member of members) {
    await writeIndex({
      root,
      catalogBinding,
      release,
      allEntries: entries,
      members: [member],
    });
  }
  return {root, release, members};
}

async function snapshot(root, relativePaths) {
  return Object.fromEntries(await Promise.all(relativePaths.map(async (relative) => {
    const bytes = await readFile(path.join(root, ...relative.split("/")));
    const info = await lstat(path.join(root, ...relative.split("/")));
    return [relative, {sha256: digest(bytes), mode: info.mode, size: info.size}];
  })));
}

test("CLI and release selection require one exact atomic release and preserve subset order", () => {
  assert.deepEqual(parseArguments(["--release-id", RELEASE_ID]), {
    mode: "dry-run", releaseId: RELEASE_ID, ids: [], json: false,
  });
  assert.deepEqual(parseArguments([
    "--release-id", RELEASE_ID, "--id", "course-g04-l10-test-002",
    "--apply", "--json",
  ]), {
    mode: "apply", releaseId: RELEASE_ID,
    ids: ["course-g04-l10-test-002"], json: true,
  });
  assert.throws(() => parseArguments([]), /--release-id is required/u);
  assert.throws(() => parseArguments([
    "--release-id", RELEASE_ID, "--apply", "--check",
  ]), /Choose exactly one/u);

  const members = [1, 2].map((ordinal) => ({
    ordinal,
    animationId: `course-g04-l10-test-00${ordinal}`,
    assetId: `swf-${String(ordinal).repeat(64)}`,
    releaseRole: "page",
    shardId: "test-shard",
    source: {path: `A/Test${ordinal}.swf`, sha256: String(ordinal).repeat(64)},
  }));
  const catalog = {schemaVersion: 1, releases: [{
    releaseId: RELEASE_ID,
    publicationMode: "atomic",
    expectedCounts: {members: 2, shards: 1},
    shards: [{shardId: "test-shard", ordinal: 1, memberCount: 2}],
    members,
  }]};
  const selected = selectLessonRelease(catalog, {
    releaseId: RELEASE_ID,
    ids: [members[1].animationId],
  });
  assert.equal(selected.selectionIdentity.scope, "verified-subset");
  assert.deepEqual(selected.members.map(({animationId}) => animationId),
    [members[1].animationId]);
  assert.throws(() => selectLessonRelease(catalog, {
    releaseId: RELEASE_ID,
    ids: ["course-g04-l10-absent"],
  }), /not verified release members/u);
});

test("pure row builder selects structural boundaries, binds EN/ES, and preserves a fractional stage", () => {
  const migration = {
    animationId: "course-g04-l10-test-002",
    runtime: {stage: {width: 799.9, height: 599.75}, fps: 12, frameCount: 4},
  };
  const requirements = [requirement("en", 4), requirement("es", 4)];
  const traceSpecByRequirement = new Map(requirements.map((item) => [
    item.requirementId,
    {path: `trace/${item.requirementId}.json`, sha256: "a".repeat(64)},
  ]));
  const result = buildStructuralRows({
    migration,
    requirements,
    rootTimeline: {
      controlStates: [
        {frame: 1, reasons: ["initial-one-indexed-frame"]},
        {frame: 3, reasons: ["script-stop-state"]},
        {frame: 4, reasons: ["terminal-structural-frame"]},
      ],
      frameLabels: [{frame: 3, label: "begin"}],
      namedPlacements: [{frame: 3, name: "animation"}],
    },
    baselineFrames: [
      {sha256: "1".repeat(64)},
      {sha256: "2".repeat(64)},
      {sha256: "2".repeat(64)},
      {sha256: "3".repeat(64)},
    ],
    evidence: {
      scenarioSha256: "3".repeat(64),
      baselineSha256: "4".repeat(64),
      coverageSha256: "5".repeat(64),
      traceSpecByRequirement,
      traceIndexPath: "trace-index.json",
      traceIndexSha256: "6".repeat(64),
      dispositionSha256: "7".repeat(64),
    },
  });
  assert.deepEqual(result.frames, [1, 2, 3, 4]);
  assert.equal(result.rows.length, 8);
  assert.deepEqual(result.rows.map(({language}) => language),
    ["en", "es", "en", "es", "en", "es", "en", "es"]);
  assert.ok(result.rows.every(({expected_state}) =>
    expected_state.includes("nativeStage=799.9x599.75") &&
    expected_state.includes("runtimeReachability=unresolved")));
  assert.equal(result.rows.find(({frame, language}) =>
    frame === "2" && language === "en").time_ms, "83.333333");
  for (const row of result.rows) {
    for (const field of ["baseline_file", "baseline_sha256",
      "implementation_file", "implementation_sha256", "diff_file",
      "diff_sha256", "normalized_rmse", "timing_result", "visual_result",
      "reviewer"]) assert.equal(row[field], "");
    assert.match(row.notes, /strictAcceptanceEffect=none/u);
    assert.match(row.notes, /Audio cue content.*remain unresolved/u);
  }
});

test("full-release apply changes only keyframes, is idempotent, and check verifies exact bytes", async (t) => {
  const fixture = await makeFixture(t);
  const protectedPaths = fixture.members.flatMap((member) => [
    `migrations/${member.animationId}/migration.json`,
    `migrations/${member.animationId}/evidence/full-frame-coverage.json`,
    `migrations/${member.animationId}/audit/scenario-inventory.json`,
    `migrations/${member.animationId}/audit/frame-domain-disposition.json`,
    `migrations/${member.animationId}/baseline/ffdec-root-frames.json`,
  ]);
  const before = await snapshot(fixture.root, protectedPaths);
  await assert.rejects(materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "check",
  }), /specifications are stale/u);
  const applied = await materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "apply",
  });
  assert.equal(applied.changedMemberCount, 2);
  assert.equal(applied.rowCount, 12);
  assert.deepEqual(applied.languageRows, {en: 6, es: 6});
  assert.deepEqual(applied.members[1].stage, {width: 799.9, height: 599.75});
  const after = await snapshot(fixture.root, protectedPaths);
  assert.deepEqual(after, before);
  for (const member of fixture.members) {
    const keyframes = await readFile(path.join(fixture.root, "migrations",
      member.animationId, "keyframes.csv"), "utf8");
    assert.equal(keyframes.trimEnd().split("\n").length, 7);
    assert.match(keyframes, /source-root-structural-specification-only/u);
    const leftovers = (await readdir(path.join(fixture.root, "migrations",
      member.animationId))).filter((name) => name.includes(".tmp") ||
      name.includes(".bak"));
    assert.deepEqual(leftovers, []);
  }
  const checked = await materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "check",
  });
  assert.equal(checked.currentMemberCount, 2);
  const again = await materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "apply",
  });
  assert.equal(again.changedMemberCount, 0);
});

test("verified subset uses its selection-bound index and writes no unselected member", async (t) => {
  const fixture = await makeFixture(t);
  const selected = fixture.members[1];
  const result = await materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
    ids: [selected.animationId],
    mode: "apply",
  });
  assert.equal(result.selectionScope, "verified-subset");
  assert.equal(result.selectedMemberCount, 1);
  assert.match(result.traceSpecIndex.path, /--subset-[a-f0-9]{64}\.json$/u);
  assert.equal(await readFile(path.join(fixture.root, "migrations",
    fixture.members[0].animationId, "keyframes.csv"), "utf8"), HEADER);
  assert.notEqual(await readFile(path.join(fixture.root, "migrations",
    selected.animationId, "keyframes.csv"), "utf8"), HEADER);
});

test("noncurrent nonempty keyframe evidence is protected from overwrite", async (t) => {
  const fixture = await makeFixture(t);
  const target = path.join(fixture.root, "migrations",
    fixture.members[0].animationId, "keyframes.csv");
  const adopted = `${HEADER}1,adopted\n`;
  await writeFile(target, adopted);
  await assert.rejects(materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "apply",
  }), /refusing to overwrite nonempty or adopted/u);
  assert.equal(await readFile(target, "utf8"), adopted);
  assert.equal(await readFile(path.join(fixture.root, "migrations",
    fixture.members[1].animationId, "keyframes.csv"), "utf8"), HEADER);
});

test("symlinked inputs fail all-member preflight before any output changes", async (t) => {
  const fixture = await makeFixture(t);
  const workspace = path.join(fixture.root, "migrations",
    fixture.members[1].animationId);
  const target = path.join(workspace, "audit", "scenario-inventory.json");
  const realCopy = path.join(workspace, "audit", "scenario-inventory-copy.json");
  await writeFile(realCopy, await readFile(target));
  await unlink(target);
  await symlink(realCopy, target);
  await assert.rejects(materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root, releaseId: RELEASE_ID, mode: "apply",
  }), /ordinary single-link file/u);
  for (const member of fixture.members) {
    assert.equal(await readFile(path.join(fixture.root, "migrations",
      member.animationId, "keyframes.csv"), "utf8"), HEADER);
  }
});

test("a mid-commit fault rolls every keyframe back and removes transaction files", async (t) => {
  const fixture = await makeFixture(t);
  await assert.rejects(materializeLessonReleaseStructuralKeyframes({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
    mode: "apply",
    testFailAfterInstall: 1,
  }), /Injected transaction failure/u);
  for (const member of fixture.members) {
    const workspace = path.join(fixture.root, "migrations", member.animationId);
    assert.equal(await readFile(path.join(workspace, "keyframes.csv"), "utf8"),
      HEADER);
    const leftovers = (await readdir(workspace)).filter((name) =>
      name.includes(".tmp") || name.includes(".bak"));
    assert.deepEqual(leftovers, []);
  }
  await assert.rejects(lstat(path.join(fixture.root,
    ".lesson-release-structural-keyframes.lock")),
  (error) => error?.code === "ENOENT");
});
