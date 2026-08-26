import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {access, mkdtemp, mkdir, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LEGACY_COVERAGE_ARCHIVE_PATH,
  LEGACY_COVERAGE_V2_PILOT_IDS,
  canonicalJson,
  deriveLegacyCoverageV2Outputs,
  parseArguments,
  parseCsv,
  sha256Text,
  upgradeLegacyPilotCoverageV2,
} from "./upgrade-legacy-pilot-coverage-v2.mjs";
import {buildCoverageV2CapturePlan} from "./capture-coverage-v2-requirements.mjs";

const LINEAR_ID = "formula-elementary-conversion-01-01";
const INTERACTIVE_ID = "keyterm-elementary-computeghgh";
const OLD_KEYFRAME_HEADER = "frame,time_ms,scenario,language,kind,expected_state,trigger,baseline_file,baseline_sha256,implementation_file,implementation_sha256,diff_file,diff_sha256,normalized_rmse,timing_result,visual_result,evidence_source,reviewer,notes";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function manifestFixture({
  id = LINEAR_ID,
  frameCount = 3,
  scenarioKind = "linear",
  sourceSha256 = "a".repeat(64),
  sourcePath = "source-assets/fixture.swf",
} = {}) {
  return {
    schemaVersion: 2,
    id,
    animationId: id,
    status: id === INTERACTIVE_ID ? "validating" : "preserved",
    source: {
      swf: sourcePath,
      swfSha256: sourceSha256,
    },
    runtime: {
      stage: {width: 8, height: 6},
      fps: 12,
      frameCount,
      durationMs: frameCount / 12 * 1000,
    },
    localization: {
      bilingualRequired: true,
      languages: ["en", "es"],
    },
    scenarios: [{
      id: "default",
      kind: scenarioKind,
      description: "fixture",
      reachable: true,
      ...(id.startsWith("formula-") ? {seed: "0"} : {}),
    }],
    implementation: {
      renderer: "fixture",
      route: `/animations/${id}`,
      captureContract: {
        captureParameter: "capture",
        deviceScaleFactor: 1,
        frameAttribute: "data-flash-frame",
        frameNumbering: "one-indexed",
        frameParameter: "frame",
        languageParameter: "lang",
        nativeStage: {width: 8, height: 6},
        scenarioParameter: "scenario",
        seedParameter: "seed",
      },
    },
    audio: {required: false, cues: []},
    acceptance: {
      engineeringReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      humanVisualReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      ownerReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      knownExceptions: [],
    },
  };
}

function coverageFixture({id = LINEAR_ID, frameCount = 3} = {}) {
  return {
    schemaVersion: 1,
    animationId: id,
    frameCount,
    scenarios: ["default"],
    languages: ["en", "es"],
    combinations: ["en", "es"].map((language) => ({
      scenario: "default",
      language,
      seed: "0",
      firstFrame: 1,
      lastFrame: frameCount,
      capturedFrameCount: frameCount,
      missingFrames: [],
      captureManifest: `evidence/legacy-capture-${language}.json`,
      captureManifestSha256: "b".repeat(64),
      metricsFile: `evidence/legacy-metrics-${language}.json`,
      metricsSha256: "c".repeat(64),
      baselineReport: `baseline/legacy-${language}.json`,
      baselineReportSha256: "d".repeat(64),
    })),
  };
}

function keyframesFixture(frameCount = 3) {
  return `${OLD_KEYFRAME_HEADER}
1,0,default,en,static,opening,load,baseline.png,${"1".repeat(64)},implementation.png,${"2".repeat(64)},diff.png,${"3".repeat(64)},0.01,pass,pass,legacy baseline,Old Reviewer,old prereview
${frameCount},${((frameCount - 1) / 12 * 1000).toFixed(3)},default,es,static,terminal,terminal,baseline-es.png,${"4".repeat(64)},implementation-es.png,${"5".repeat(64)},diff-es.png,${"6".repeat(64)},0.02,pass,pass,legacy baseline,Old Reviewer,old prereview
`;
}

function deriveFixture({
  id = LINEAR_ID,
  frameCount = 3,
  scenarioKind = "linear",
  manifest = manifestFixture({id, frameCount, scenarioKind}),
  coverage = coverageFixture({id, frameCount}),
  keyframes = keyframesFixture(frameCount),
  referenceDiagnostics = [],
} = {}) {
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const coverageText = `${JSON.stringify(coverage, null, 2)}\n`;
  return deriveLegacyCoverageV2Outputs({
    id,
    currentManifestText: manifestText,
    legacyManifestText: manifestText,
    currentCoverageText: coverageText,
    legacyCoverageV1Text: coverageText,
    currentKeyframesText: keyframes,
    legacyKeyframesV1Text: keyframes,
    referenceDiagnostics,
  });
}

test("CLI defaults to a read-only dry-run and requires mutually exclusive explicit modes", () => {
  assert.deepEqual(parseArguments([]).mode, "dry-run");
  assert.deepEqual(parseArguments(["--dry-run"]).mode, "dry-run");
  assert.deepEqual(parseArguments(["--check"]).mode, "check");
  assert.deepEqual(parseArguments(["--write"]).mode, "write");
  assert.deepEqual(parseArguments(["--id", LINEAR_ID, "--id", INTERACTIVE_ID, "--json"]).ids, [LINEAR_ID, INTERACTIVE_ID]);
  assert.throws(() => parseArguments(["--check", "--write"]), /mutually exclusive/);
  assert.throws(() => parseArguments(["--id", LINEAR_ID, "--id", LINEAR_ID]), /must not be repeated/);
  assert.throws(() => parseArguments(["--id", "unregistered"]), /Unknown legacy coverage-v2 pilot/);
});

test("linear root migration derives exact identities while archiving and clearing every legacy evidence field", () => {
  const diagnostics = [{
    scenario: "default",
    language: "en",
    kind: "implementation-capture",
    disposition: "archived-prereview-only-not-promoted",
  }];
  const output = deriveFixture({referenceDiagnostics: diagnostics});
  assert.equal(output.manifest.implementation.defaultFrameDomainId, "root");
  assert.deepEqual(output.manifest.runtime.timelineDefinitions, [{
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceObjectId: null,
    frameCount: 3,
    indexing: "one-indexed",
    structuralReachability: "root",
    evidence: "source-assets/fixture.swf",
  }]);
  assert.deepEqual(output.manifest.implementation.frameDomains, [{
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceInstanceId: "root",
    parentFrameDomainId: null,
    frameCount: 3,
    scenarioIds: ["default"],
    role: "root-animation",
  }]);
  assert.equal(output.manifest.implementation.captureContract.requirementIdParameter, "requirementId");
  assert.equal(output.manifest.implementation.captureContract.entryStateSha256Attribute, "data-flash-entry-state-sha256");
  assert.equal(output.coverage.schemaVersion, 2);
  assert.deepEqual(output.coverage.requirements.map(({requirementId}) => requirementId), [
    "req:root:default:en",
    "req:root:default:es",
  ]);
  for (const requirement of output.coverage.requirements) {
    assert.equal(requirement.traceId, `trace:root:default:${requirement.language}:seed-0`);
    assert.equal(requirement.entryState.kind, "original-root-frame-accurate-entry");
    assert.equal(requirement.entryStateSha256, sha256Text(canonicalJson(requirement.entryState)));
    assert.equal(requirement.baselineAuthorityRequirement, "original-runtime-frame-accurate");
    assert.equal(requirement.status, "blocked");
    assert.equal(requirement.capturedFrameCount, 0);
    assert.deepEqual(requirement.missingFrames, [1, 2, 3]);
    for (const field of [
      "baselineCaptureManifest",
      "baselineCaptureManifestSha256",
      "captureManifest",
      "captureManifestSha256",
      "metricsFile",
      "metricsSha256",
    ]) assert.equal(requirement[field], "");
    assert.equal(requirement.blockingEvidence[1].file, LEGACY_COVERAGE_ARCHIVE_PATH);
    assert.equal(requirement.blockingEvidence[1].sha256, output.archiveSha256);
  }
  assert.equal(output.archive.status, "prereview-only");
  assert.equal(output.archive.promotionAuthorized, false);
  assert.deepEqual(output.archive.legacyReferenceDiagnostics, diagnostics);
  assert.equal(output.archive.sourceInputs.coverageV1.sha256, sha256Text(`${JSON.stringify(coverageFixture(), null, 2)}\n`));
  assert.equal(output.summary.promotedLegacyEvidenceCount, 0);
  assert.deepEqual(output.summary.requirementStatuses, {blocked: 2, complete: 0});

  const keyframes = parseCsv(output.keyframesText);
  assert.ok(keyframes.headers.includes("requirement_id"));
  assert.equal(keyframes.rows[0].requirement_id, "req:root:default:en");
  assert.equal(keyframes.rows[1].requirement_id, "req:root:default:es");
  for (const row of keyframes.rows) {
    assert.equal(row.frame_domain_id, "root");
    assert.equal(row.baseline_file, "");
    assert.equal(row.implementation_file, "");
    assert.equal(row.diff_file, "");
    assert.equal(row.normalized_rmse, "");
    assert.equal(row.reviewer, "");
    assert.match(row.notes, /archived as prereview-only/);
  }
  assert.deepEqual(output.manifest.acceptance, manifestFixture().acceptance);
  assert.equal(output.manifest.status, "preserved");
});

test("interactive root migration requires a natural original-runtime trace", () => {
  const output = deriveFixture({
    id: INTERACTIVE_ID,
    scenarioKind: "interactive",
  });
  for (const requirement of output.coverage.requirements) {
    assert.equal(requirement.entryState.kind, "original-root-natural-entry");
    assert.equal(requirement.baselineAuthorityRequirement, "original-runtime-natural-trace");
    assert.match(requirement.blockingReason, /natural original-runtime trace/);
  }
  assert.equal(output.manifest.status, "validating");
});

test("mismatched or incomplete legacy cartesian coverage fails closed", () => {
  const missingLanguage = coverageFixture();
  missingLanguage.languages = ["en"];
  assert.throws(() => deriveFixture({coverage: missingLanguage}), /languages differ/);

  const missingCombination = coverageFixture();
  missingCombination.combinations.pop();
  assert.throws(() => deriveFixture({coverage: missingCombination}), /missing legacy combination/);

  const partial = coverageFixture();
  partial.combinations[0].lastFrame = 2;
  assert.throws(() => deriveFixture({coverage: partial}), /does not cover the full root range/);

  const wrongSeed = coverageFixture();
  wrongSeed.combinations[0].seed = "7";
  assert.throws(() => deriveFixture({coverage: wrongSeed}), /scenario seed differs/);
});

test("pre-existing explicit domain or identity-parameter conflicts are never overwritten", () => {
  const domainConflict = manifestFixture();
  domainConflict.implementation.defaultFrameDomainId = "sprite-unsafe";
  domainConflict.implementation.frameDomains = [{
    id: "sprite-unsafe",
    kind: "nested",
    frameCount: 3,
    scenarioIds: ["default"],
  }];
  assert.throws(() => deriveFixture({manifest: domainConflict}), /defaultFrameDomainId conflicts/);

  const captureConflict = manifestFixture();
  captureConflict.implementation.captureContract.requirementIdParameter = "legacyRequirement";
  assert.throws(() => deriveFixture({manifest: captureConflict}), /captureContract\.requirementIdParameter conflicts/);

  const timelineConflict = manifestFixture();
  timelineConflict.runtime.timelineDefinitions = [{id: "root", frameCount: 999}];
  assert.throws(() => deriveFixture({manifest: timelineConflict}), /runtime\.timelineDefinitions conflict/);
});

test("root timeline definition is the only permitted runtime addition", () => {
  const manifest = manifestFixture();
  manifest.runtime.customPreservedField = {nested: ["keep", 17]};
  const output = deriveFixture({manifest});
  assert.deepEqual(output.manifest.runtime.customPreservedField, manifest.runtime.customPreservedField);
  const withoutDefinitions = structuredClone(output.manifest.runtime);
  delete withoutDefinitions.timelineDefinitions;
  assert.deepEqual(withoutDefinitions, manifest.runtime);
});

test("a prior v2 output is idempotent only while it remains blocked and evidence-empty", () => {
  const initial = deriveFixture();
  const second = deriveLegacyCoverageV2Outputs({
    id: LINEAR_ID,
    currentManifestText: initial.manifestText,
    legacyManifestText: Buffer.from(initial.archive.sourceInputs.migrationJson.content, "base64").toString("utf8"),
    currentCoverageText: initial.coverageText,
    legacyCoverageV1Text: Buffer.from(initial.archive.sourceInputs.coverageV1.content, "base64").toString("utf8"),
    currentKeyframesText: initial.keyframesText,
    legacyKeyframesV1Text: Buffer.from(initial.archive.sourceInputs.keyframesV1.content, "base64").toString("utf8"),
    archiveText: initial.archiveText,
  });
  assert.equal(second.manifestText, initial.manifestText);
  assert.equal(second.coverageText, initial.coverageText);
  assert.equal(second.keyframesText, initial.keyframesText);
  assert.equal(second.archiveText, initial.archiveText);

  const evidenceBearing = structuredClone(initial.coverage);
  evidenceBearing.requirements[0].captureManifest = "capture.json";
  evidenceBearing.requirements[0].captureManifestSha256 = "f".repeat(64);
  assert.throws(() => deriveLegacyCoverageV2Outputs({
    id: LINEAR_ID,
    currentManifestText: initial.manifestText,
    legacyManifestText: Buffer.from(initial.archive.sourceInputs.migrationJson.content, "base64").toString("utf8"),
    currentCoverageText: `${JSON.stringify(evidenceBearing, null, 2)}\n`,
    legacyCoverageV1Text: Buffer.from(initial.archive.sourceInputs.coverageV1.content, "base64").toString("utf8"),
    currentKeyframesText: initial.keyframesText,
    legacyKeyframesV1Text: Buffer.from(initial.archive.sourceInputs.keyframesV1.content, "base64").toString("utf8"),
    archiveText: initial.archiveText,
  }), /contains adopted evidence/);
});

async function pathExists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

async function writeEndToEndWorkspace({
  root,
  migrationsRoot,
  id = LINEAR_ID,
  frameCount = 3,
}) {
  const workspace = path.join(migrationsRoot, id);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  await mkdir(path.join(workspace, "baseline"), {recursive: true});
  await mkdir(path.join(root, "source-assets"), {recursive: true});
  const sourceRelative = `source-assets/${id}.swf`;
  const swfBytes = Buffer.from(`fixture-swf:${id}`);
  await writeFile(path.join(root, sourceRelative), swfBytes);
  const manifest = manifestFixture({
    id,
    frameCount,
    scenarioKind: id === INTERACTIVE_ID ? "interactive" : "linear",
    sourceSha256: sha256(swfBytes),
    sourcePath: sourceRelative,
  });
  const coverage = coverageFixture({id, frameCount});
  for (const combination of coverage.combinations) {
    const capture = {
      schemaVersion: 2,
      status: "complete",
      scenario: combination.scenario,
      language: combination.language,
      seed: combination.seed,
    };
    const metrics = {
      schemaVersion: 1,
      animationId: id,
      scenario: combination.scenario,
      language: combination.language,
      seed: combination.seed,
    };
    const baseline = {
      schemaVersion: 1,
      animationId: id,
      frameCount,
    };
    const captureText = `${JSON.stringify(capture, null, 2)}\n`;
    const metricsText = `${JSON.stringify(metrics, null, 2)}\n`;
    const baselineText = `${JSON.stringify(baseline, null, 2)}\n`;
    await writeFile(path.join(workspace, combination.captureManifest), captureText);
    await writeFile(path.join(workspace, combination.metricsFile), metricsText);
    await writeFile(path.join(workspace, combination.baselineReport), baselineText);
    combination.captureManifestSha256 = sha256(captureText);
    combination.metricsSha256 = sha256(metricsText);
    combination.baselineReportSha256 = sha256(baselineText);
  }
  const files = {
    manifest: path.join(workspace, "migration.json"),
    coverage: path.join(workspace, "evidence", "full-frame-coverage.json"),
    keyframes: path.join(workspace, "keyframes.csv"),
    archive: path.join(workspace, LEGACY_COVERAGE_ARCHIVE_PATH),
  };
  await writeFile(files.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(files.coverage, `${JSON.stringify(coverage, null, 2)}\n`);
  await writeFile(files.keyframes, keyframesFixture(frameCount));
  return {workspace, files, sourceRelative};
}

async function createEndToEndFixture(t, {ids = [LINEAR_ID]} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-legacy-v2-"));
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const migrationsRoot = path.join(root, "migrations");
  await mkdir(migrationsRoot, {recursive: true});
  const workspaces = new Map();
  for (const id of ids) {
    workspaces.set(id, await writeEndToEndWorkspace({root, migrationsRoot, id}));
  }
  const selected = workspaces.get(ids[0]);
  return {
    root,
    migrationsRoot,
    workspaces,
    workspace: selected.workspace,
    files: selected.files,
    sourceRelative: selected.sourceRelative,
  };
}

test("dry-run is byte-for-byte read-only; explicit write is bounded and check detects drift", async (t) => {
  const fixture = await createEndToEndFixture(t);
  const before = {
    manifest: await readFile(fixture.files.manifest, "utf8"),
    coverage: await readFile(fixture.files.coverage, "utf8"),
    keyframes: await readFile(fixture.files.keyframes, "utf8"),
  };
  const dryRun = await upgradeLegacyPilotCoverageV2({
    ids: [LINEAR_ID],
    migrationsRoot: fixture.migrationsRoot,
    mode: "dry-run",
  });
  assert.equal(dryRun.wrote, false);
  assert.equal(dryRun.promotedLegacyEvidenceCount, 0);
  assert.equal(await pathExists(fixture.files.archive), false);
  assert.equal(await readFile(fixture.files.manifest, "utf8"), before.manifest);
  assert.equal(await readFile(fixture.files.coverage, "utf8"), before.coverage);
  assert.equal(await readFile(fixture.files.keyframes, "utf8"), before.keyframes);

  const written = await upgradeLegacyPilotCoverageV2({
    ids: [LINEAR_ID],
    migrationsRoot: fixture.migrationsRoot,
    mode: "write",
  });
  assert.equal(written.wrote, true);
  assert.equal(await pathExists(fixture.files.archive), true);
  assert.equal(JSON.parse(await readFile(fixture.files.coverage, "utf8")).schemaVersion, 2);
  assert.equal(JSON.parse(await readFile(fixture.files.archive, "utf8")).promotionAuthorized, false);
  assert.deepEqual(
    JSON.parse(Buffer.from(JSON.parse(await readFile(fixture.files.archive, "utf8")).sourceInputs.coverageV1.content, "base64").toString("utf8")),
    JSON.parse(before.coverage),
  );

  const beforeCheck = await Promise.all([
    readFile(fixture.files.archive, "utf8"),
    readFile(fixture.files.manifest, "utf8"),
    readFile(fixture.files.coverage, "utf8"),
    readFile(fixture.files.keyframes, "utf8"),
  ]);
  const checked = await upgradeLegacyPilotCoverageV2({
    ids: [LINEAR_ID],
    migrationsRoot: fixture.migrationsRoot,
    mode: "check",
  });
  assert.equal(checked.mode, "check");
  assert.deepEqual(await Promise.all([
    readFile(fixture.files.archive, "utf8"),
    readFile(fixture.files.manifest, "utf8"),
    readFile(fixture.files.coverage, "utf8"),
    readFile(fixture.files.keyframes, "utf8"),
  ]), beforeCheck);

  const staleCoverage = JSON.parse(await readFile(fixture.files.coverage, "utf8"));
  staleCoverage.requirements[0].blockingReason = "hand edited";
  const staleCoverageText = `${JSON.stringify(staleCoverage, null, 2)}\n`;
  await writeFile(fixture.files.coverage, staleCoverageText);
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      ids: [LINEAR_ID],
      migrationsRoot: fixture.migrationsRoot,
      mode: "check",
    }),
    /Stale legacy coverage-v2 outputs/,
  );
  assert.equal(await readFile(fixture.files.coverage, "utf8"), staleCoverageText);
});

test("all six registered pilots write idempotently, pass factory check, and satisfy the capture orchestrator plan", async (t) => {
  const fixture = await createEndToEndFixture(t, {ids: LEGACY_COVERAGE_V2_PILOT_IDS});
  const originalRuntimeById = new Map();
  for (const id of LEGACY_COVERAGE_V2_PILOT_IDS) {
    const manifest = JSON.parse(await readFile(fixture.workspaces.get(id).files.manifest, "utf8"));
    originalRuntimeById.set(id, structuredClone(manifest.runtime));
  }
  const written = await upgradeLegacyPilotCoverageV2({
    migrationsRoot: fixture.migrationsRoot,
    mode: "write",
  });
  assert.equal(written.pilots.length, 6);
  assert.ok(written.pilots.every(({requirementCount, promotedLegacyEvidenceCount}) =>
    requirementCount === 2 && promotedLegacyEvidenceCount === 0));

  for (const id of LEGACY_COVERAGE_V2_PILOT_IDS) {
    const workspace = fixture.workspaces.get(id);
    const manifest = JSON.parse(await readFile(workspace.files.manifest, "utf8"));
    const originalRuntime = originalRuntimeById.get(id);
    const runtimeWithoutDefinitions = structuredClone(manifest.runtime);
    delete runtimeWithoutDefinitions.timelineDefinitions;
    assert.deepEqual(runtimeWithoutDefinitions, originalRuntime);
    assert.deepEqual(manifest.runtime.timelineDefinitions, [{
      id: "root",
      kind: "root",
      sourceTimelineId: "root",
      sourceObjectId: null,
      frameCount: originalRuntime.frameCount,
      indexing: "one-indexed",
      structuralReachability: "root",
      evidence: manifest.source.swf,
    }]);
    const plan = await buildCoverageV2CapturePlan({
      id,
      projectRoot: fixture.root,
      baseUrl: "http://127.0.0.1:3213",
    });
    assert.equal(plan.animationId, id);
    assert.equal(plan.selectedRequirementCount, 2);
    assert.equal(plan.totalFrameCount, originalRuntime.frameCount * 2);
  }

  const checked = await upgradeLegacyPilotCoverageV2({
    migrationsRoot: fixture.migrationsRoot,
    mode: "check",
  });
  assert.equal(checked.pilots.length, 6);
  const repeatedWrite = await upgradeLegacyPilotCoverageV2({
    migrationsRoot: fixture.migrationsRoot,
    mode: "write",
  });
  assert.ok(repeatedWrite.pilots.every(({changedFiles}) => changedFiles.length === 0));
});

test("multi-pilot write rolls back every committed file after an injected mid-transaction failure", async (t) => {
  const fixture = await createEndToEndFixture(t, {ids: LEGACY_COVERAGE_V2_PILOT_IDS});
  const before = new Map();
  for (const id of LEGACY_COVERAGE_V2_PILOT_IDS) {
    const files = fixture.workspaces.get(id).files;
    before.set(id, {
      manifest: await readFile(files.manifest, "utf8"),
      coverage: await readFile(files.coverage, "utf8"),
      keyframes: await readFile(files.keyframes, "utf8"),
    });
  }
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      migrationsRoot: fixture.migrationsRoot,
      mode: "write",
      testHooks: {
        beforeReplace({committedCount}) {
          if (committedCount === 1) throw new Error("injected transaction failure");
        },
      },
    }),
    /injected transaction failure/,
  );
  for (const id of LEGACY_COVERAGE_V2_PILOT_IDS) {
    const files = fixture.workspaces.get(id).files;
    const original = before.get(id);
    assert.equal(await readFile(files.manifest, "utf8"), original.manifest);
    assert.equal(await readFile(files.coverage, "utf8"), original.coverage);
    assert.equal(await readFile(files.keyframes, "utf8"), original.keyframes);
    assert.equal(await pathExists(files.archive), false);
  }
  assert.equal(await pathExists(path.join(fixture.migrationsRoot, ".legacy-coverage-v2-upgrade.lock")), false);
});

test("source hash drift fails before any write", async (t) => {
  const fixture = await createEndToEndFixture(t);
  await writeFile(path.join(fixture.root, fixture.sourceRelative), "changed");
  const before = await readFile(fixture.files.coverage, "utf8");
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      ids: [LINEAR_ID],
      migrationsRoot: fixture.migrationsRoot,
      mode: "write",
    }),
    /source\.swf SHA-256 differs/,
  );
  assert.equal(await readFile(fixture.files.coverage, "utf8"), before);
  assert.equal(await pathExists(fixture.files.archive), false);
});

test("symlinked source and archive targets are rejected before any write", async (t) => {
  const sourceFixture = await createEndToEndFixture(t);
  const sourcePath = path.join(sourceFixture.root, sourceFixture.sourceRelative);
  const sourceTarget = path.join(sourceFixture.root, "source-assets", "source-target.swf");
  await writeFile(sourceTarget, "fixture-swf");
  await rm(sourcePath);
  await symlink(sourceTarget, sourcePath);
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      ids: [LINEAR_ID],
      migrationsRoot: sourceFixture.migrationsRoot,
      mode: "write",
    }),
    /source\.swf must be a regular non-symlink file/,
  );
  assert.equal(await pathExists(sourceFixture.files.archive), false);

  const archiveFixture = await createEndToEndFixture(t);
  const archiveTarget = path.join(archiveFixture.root, "archive-target.json");
  await writeFile(archiveTarget, "{}\n");
  await symlink(archiveTarget, archiveFixture.files.archive);
  const coverageBefore = await readFile(archiveFixture.files.coverage, "utf8");
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      ids: [LINEAR_ID],
      migrationsRoot: archiveFixture.migrationsRoot,
      mode: "write",
    }),
    /prereview archive must be a regular non-symlink file/,
  );
  assert.equal(await readFile(archiveFixture.files.coverage, "utf8"), coverageBefore);
  assert.equal(await readFile(archiveTarget, "utf8"), "{}\n");
});

test("legacy evidence references that escape the fixture project root are rejected", async (t) => {
  const fixture = await createEndToEndFixture(t);
  const outside = path.join(os.tmpdir(), `help-math-outside-${process.pid}-${Date.now()}.json`);
  t.after(async () => {
    await rm(outside, {force: true});
  });
  await writeFile(outside, "{}\n");
  const coverage = JSON.parse(await readFile(fixture.files.coverage, "utf8"));
  coverage.combinations[0].captureManifest = outside;
  coverage.combinations[0].captureManifestSha256 = sha256("{}\n");
  await writeFile(fixture.files.coverage, `${JSON.stringify(coverage, null, 2)}\n`);
  const manifestBefore = await readFile(fixture.files.manifest, "utf8");
  await assert.rejects(
    upgradeLegacyPilotCoverageV2({
      ids: [LINEAR_ID],
      migrationsRoot: fixture.migrationsRoot,
      mode: "write",
    }),
    /Legacy evidence reference escapes the project root/,
  );
  assert.equal(await readFile(fixture.files.manifest, "utf8"), manifestBefore);
  assert.equal(await pathExists(fixture.files.archive), false);
});
