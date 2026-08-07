import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, copyFile, link, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
import {
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {prepareRootCaptureCandidate} from "./prepare-root-capture-candidate.mjs";
import {
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  ROOT_CAPTURE_STALE_ARCHIVE_ROOT,
  ROOT_CAPTURE_TEMPLATE_STATUS,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  assertEmptyProjectorLauncher,
  buildRootCaptureKit,
  listReadyLessonReleaseRootSpecs,
  listReadyRootSpecs,
  parseArguments,
  renderUnsignedTemplateFiles,
  scaffoldRootCaptureKits,
  usage,
} from "./scaffold-root-capture-kit.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function writeJson(candidate, value) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

async function createRuntime(root) {
  const appPath = path.join(root, "runtime", "Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const bytes = Buffer.from("fixture Adobe Projector executable\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, bytes);
  await chmod(executablePath, 0o755);
  return {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version: "32.0.0.414",
    requestedAppPath: appPath,
    appPath,
    executablePath,
    executableSha256: digest(bytes),
  };
}

async function createFixture({count = 1, family = "course"} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-root-capture-kit-"));
  const runtime = await createRuntime(root);
  const legacy = family === "legacy";
  const release = family === "release";
  const releaseId = "lesson-fixture-root-capture";
  const releaseCatalog = release ? {
    path: "catalog/lesson-releases.json",
    bytes: 0,
    sha256: "",
    schemaVersion: 1,
    releaseId,
    releaseFingerprintSha256: "1".repeat(64),
    orderedMemberIdentitySha256: "2".repeat(64),
  } : null;
  if (release) {
    const catalogPath = path.join(root, releaseCatalog.path);
    const catalogBytes = Buffer.from(`${JSON.stringify({
      schemaVersion: 1,
      releases: [{releaseId}],
    }, null, 2)}\n`);
    await mkdir(path.dirname(catalogPath), {recursive: true});
    await writeFile(catalogPath, catalogBytes);
    releaseCatalog.bytes = catalogBytes.length;
    releaseCatalog.sha256 = digest(catalogBytes);
  }
  const nativeStage = legacy ? {width: 225, height: 225} : {width: 800, height: 600};
  const scenario = legacy ? "default" : "root-standalone";
  const pilots = [];
  const records = [];
  for (let offset = 0; offset < count; offset += 1) {
    const ordinal = String(offset + 1).padStart(2, "0");
    const animationId = legacy ? `keyterm-elementary-fixture-${ordinal}` : `course-fixture-${ordinal}`;
    const requirementId = legacy ? "req:root:default:en" : "req:root:root-standalone:en";
    const safeId = safeRequirementId(requirementId);
    const frameCount = 2 + (offset % 2);
    const workspace = path.join(root, "migrations", animationId);
    const sourceRelative = `source-assets/flash/HELP MATH_ORIGINAL FILES/fixture/${animationId}.swf`;
    const sourcePath = path.join(root, sourceRelative);
    const sourceBytes = Buffer.from(`fixture source SWF ${animationId}\n`);
    await mkdir(path.dirname(sourcePath), {recursive: true});
    await writeFile(sourcePath, sourceBytes);
    const sourceSha256 = digest(sourceBytes);
    const entryState = {
      kind: "original-root-frame-accurate-entry",
      rootTimelineId: "root",
      rootEntryFrame: 1,
      scenario,
      language: "en",
      seed: "0",
    };
    const entryStateSha256 = sha256Text(canonicalJson(entryState));
    const requirement = {
      requirementId,
      scenario,
      frameDomainId: "root",
      traceId: `trace:root:${scenario}:en:seed-0`,
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: frameCount},
      entryState,
      entryStateSha256,
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
      status: "blocked",
    };
    const manifest = {
      schemaVersion: 2,
      animationId,
      status: "validating",
      source: {swf: sourceRelative, swfSha256: sourceSha256},
      runtime: {stage: nativeStage, fps: 12, frameCount},
      localization: {languages: ["en"]},
      scenarios: [{id: scenario, kind: "linear", reachable: true}],
      implementation: {frameDomains: [{id: "root", kind: "root", frameCount}]},
      acceptance: {ownerReview: {decision: "pending"}},
    };
    const coverage = {schemaVersion: 2, animationId, requirements: [requirement]};
    const inventory = {
      schemaVersion: 1,
      animationId,
      migrationStatusAtGeneration: "validating",
      migrationStatusChanged: false,
      evidenceIndex: [],
      timelineInventory: [{timelineId: "root", frameCount}],
    };
    await writeJson(path.join(workspace, "migration.json"), manifest);
    await writeJson(path.join(workspace, "evidence", "full-frame-coverage.json"), coverage);
    await writeJson(path.join(workspace, "audit", "scenario-inventory.json"), inventory);
    const spec = {
      schemaVersion: 1,
      artifactType: legacy
        ? "legacy-pilot-original-runtime-trace-specification"
        : "course-pilot-original-runtime-trace-specification",
      animationId,
      requirementId,
      traceSpecStatus: "source-frame-accurate-root-ready-for-authoritative-capture",
      identity: {
        frameDomainId: "root",
        traceId: requirement.traceId,
        entryStateSha256,
        scenario: requirement.scenario,
        scenarioKind: "linear",
        language: "en",
        seed: "0",
        requiredRange: requirement.requiredRange,
        baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
      },
      traceModel: {
        kind: "frame-accurate-root-exhaustive",
        domainScope: "root",
        positioningProofModes: ["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"],
        naturalPlaybackClaimed: false,
      },
      sourceBindings: {
        sourceSwf: {path: sourceRelative, sha256: sourceSha256},
        migrationManifest: {path: "migration.json", ...projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: technicalManifestSha256(manifest),
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        })},
        fullFrameCoverage: {path: "evidence/full-frame-coverage.json", ...projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: traceCoverageSha256(coverage),
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        })},
        scenarioInventory: {path: "audit/scenario-inventory.json", ...projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: scenarioInventorySha256(inventory),
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        })},
        ...(release ? {lessonReleaseCatalog: releaseCatalog} : {}),
      },
      frameDomain: {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "root",
        parentFrameDomainId: null,
        parentEntryFrame: null,
        localEntryFrame: 1,
        frameCount,
        nativeStage,
        fps: 12,
      },
      entryState,
      schedule: {
        status: "not-required-frame-accurate-root",
        noActionsRequired: false,
        orderedSteps: [],
        stateCheckpoints: [],
        terminalSemantics: {status: "separate-natural-playback-behavior-gate-not-required-for-frame-accurate-root-baseline", expectedState: null, evidence: []},
        exhaustiveFrameCapturePlan: {indexing: "one-indexed", firstFrame: 1, lastFrame: frameCount, frameCount},
      },
      executionEvidence: {expectedExecutionReportPath: `baseline/trace-executions/${safeId}.json`},
    };
    const specRelative = release
      ? `migrations/${animationId}/audit/trace-specs/lesson-releases/${releaseId}/${safeId}.json`
      : `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
    const specSha256 = await writeJson(path.join(root, specRelative), spec);
    const indexEntry = {
      requirementId,
      traceId: requirement.traceId,
      frameDomainId: "root",
      scenario: "root-standalone",
      language: "en",
      seed: "0",
      traceModel: "frame-accurate-root-exhaustive",
      status: spec.traceSpecStatus,
      file: specRelative,
      sha256: specSha256,
      expectedExecutionReport: `migrations/${animationId}/${spec.executionEvidence.expectedExecutionReportPath}`,
    };
    pilots.push({animationId, traceSpecs: [indexEntry]});
    records.push({animationId, requirementId, safeId, workspace, sourcePath, sourceBytes, sourceSha256, specRelative});
  }
  const indexPath = release
    ? path.join(
      root,
      "migrations",
      "lesson-release-trace-spec-indexes",
      `${releaseId}.json`,
    )
    : path.join(
      root,
      "migrations",
      legacy
        ? "legacy-pilot-trace-spec-index.json"
        : "course-shell-pilot-trace-spec-index.json",
    );
  await writeJson(indexPath, release ? {
    schemaVersion: 1,
    artifactType: "lesson-release-original-runtime-trace-spec-index",
    releaseSelection: {releaseId},
    releaseCatalog,
    members: pilots,
  } : {
    schemaVersion: 1,
    artifactType: legacy
      ? "legacy-pilot-trace-spec-index"
      : "course-shell-pilot-trace-spec-index",
    pilots,
  });
  return {root, runtime, indexPath, records, first: records[0], nativeStage, family};
}

async function makeAtomicBilingualReleaseFixture(fixture, {fractionalOrdinals = []} = {}) {
  const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
  const releaseId = index.releaseSelection.releaseId;
  const fractional = new Set(fractionalOrdinals);
  for (const [memberIndex, member] of index.members.entries()) {
    const ordinal = memberIndex + 1;
    const workspace = path.join(fixture.root, "migrations", member.animationId);
    const manifestPath = path.join(workspace, "migration.json");
    const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
    const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
    const [manifest, oldCoverage, inventory, oldSpec] = await Promise.all([
      readFile(manifestPath, "utf8").then(JSON.parse),
      readFile(coveragePath, "utf8").then(JSON.parse),
      readFile(inventoryPath, "utf8").then(JSON.parse),
      readFile(path.join(fixture.root, member.traceSpecs[0].file), "utf8").then(JSON.parse),
    ]);
    const nativeStage = fractional.has(ordinal)
      ? {width: 799.9, height: 599.75}
      : {width: 800, height: 600};
    manifest.runtime.stage = nativeStage;
    manifest.localization.languages = ["en", "es"];
    const requirements = ["en", "es"].map((language) => {
      const entryState = {...oldCoverage.requirements[0].entryState, language};
      return {
        ...structuredClone(oldCoverage.requirements[0]),
        requirementId: `req-default-root-${language}`,
        traceId: `default-root-${language}`,
        language,
        entryState,
        entryStateSha256: sha256Text(canonicalJson(entryState)),
      };
    });
    const coverage = {...oldCoverage, requirements};
    await writeJson(manifestPath, manifest);
    await writeJson(coveragePath, coverage);
    const traceSpecs = [];
    for (const requirement of requirements) {
      const safeId = safeRequirementId(requirement.requirementId);
      const spec = structuredClone(oldSpec);
      spec.requirementId = requirement.requirementId;
      spec.identity = {
        ...spec.identity,
        traceId: requirement.traceId,
        entryStateSha256: requirement.entryStateSha256,
        language: requirement.language,
      };
      spec.frameDomain.nativeStage = nativeStage;
      spec.entryState = requirement.entryState;
      spec.sourceBindings.migrationManifest = {
        path: "migration.json",
        ...projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: technicalManifestSha256(manifest),
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        }),
      };
      spec.sourceBindings.fullFrameCoverage = {
        path: "evidence/full-frame-coverage.json",
        ...projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: traceCoverageSha256(coverage),
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        }),
      };
      spec.sourceBindings.scenarioInventory = {
        path: "audit/scenario-inventory.json",
        ...projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: scenarioInventorySha256(inventory),
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        }),
      };
      spec.executionEvidence.expectedExecutionReportPath = `baseline/trace-executions/${safeId}.json`;
      const specRelative = `migrations/${member.animationId}/audit/trace-specs/lesson-releases/${releaseId}/${safeId}.json`;
      const sha256 = await writeJson(path.join(fixture.root, specRelative), spec);
      traceSpecs.push({
        requirementId: requirement.requirementId,
        traceId: requirement.traceId,
        frameDomainId: "root",
        scenario: requirement.scenario,
        language: requirement.language,
        seed: "0",
        traceModel: "frame-accurate-root-exhaustive",
        status: spec.traceSpecStatus,
        file: specRelative,
        sha256,
        expectedExecutionReport: `migrations/${member.animationId}/${spec.executionEvidence.expectedExecutionReportPath}`,
      });
    }
    member.releaseMembership = {ordinal};
    member.traceSpecs = traceSpecs;
  }
  index.releaseSelection = {
    ...index.releaseSelection,
    atomicReleaseMemberCount: index.members.length,
    selectedMemberCount: index.members.length,
    fullAtomicReleaseSelected: true,
  };
  index.memberCount = index.members.length;
  index.frameAccurateRootReadyCount = index.members.length * 2;
  index.readyTraceCount = index.members.length * 2;
  await writeJson(fixture.indexPath, index);
  await mkdir(path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_ROOT), {recursive: true});
  return {...fixture, releaseId};
}

async function scaffoldThenStaleIndex(fixture, {allReady = false} = {}) {
  const selection = allReady
    ? {allReady: true}
    : {specFile: fixture.first.specRelative};
  const results = await scaffoldRootCaptureKits({
    projectRoot: fixture.root,
    runtime: fixture.runtime,
    ...selection,
  });
  const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
  index.unsignedTemplateRefreshFixtureRevision = 1;
  await writeJson(fixture.indexPath, index);
  return {results, selection};
}

async function rewriteUnsignedKitFromSyntheticManifest(kitRoot, projectRoot, mutate) {
  const manifestPath = path.join(kitRoot, "kit-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  mutate(manifest);
  const sourceBytes = await readFile(path.join(kitRoot, "runtime-source", "source.swf"));
  const files = renderUnsignedTemplateFiles({root: projectRoot, manifest, sourceBytes});
  for (const [relative, content] of files) {
    const candidate = path.join(kitRoot, relative);
    await chmod(candidate, 0o644);
    await writeFile(candidate, content);
    await chmod(candidate, relative.endsWith(".sh") ? 0o555 : 0o444);
  }
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

test("scaffolds and byte-checks a deterministic unsigned root kit without touching source or migration evidence", async () => {
  const fixture = await createFixture();
  try {
    const migrationBefore = await readFile(path.join(fixture.first.workspace, "migration.json"));
    const coverageBefore = await readFile(path.join(fixture.first.workspace, "evidence", "full-frame-coverage.json"));
    const sourceBefore = await readFile(fixture.first.sourcePath);
    const [result] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
    });
    assert.equal(result.status, "scaffolded-unsigned-template-only");
    assert.equal(result.strictAcceptanceEffect, false);
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
    assert.equal(checked.captureKitManifestSha256, result.captureKitManifestSha256);
    assert.equal(checked.stagedSourceSha256, fixture.first.sourceSha256);
    assert.match(checked.sandboxProfileSha256, /^[a-f0-9]{64}$/);
    assert.match(checked.nodeExecutableSha256, /^[a-f0-9]{64}$/);
    assert.match(checked.runtimeIdentityReceiptSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(await readFile(path.join(result.kitRoot, "runtime-source", "source.swf")), sourceBefore);
    assert.deepEqual(await readFile(path.join(fixture.first.workspace, "migration.json")), migrationBefore);
    assert.deepEqual(await readFile(path.join(fixture.first.workspace, "evidence", "full-frame-coverage.json")), coverageBefore);
    assert.deepEqual(await readFile(fixture.first.sourcePath), sourceBefore);
    const manifest = JSON.parse(await readFile(path.join(result.kitRoot, "kit-manifest.json"), "utf8"));
    assert.equal(manifest.status, ROOT_CAPTURE_TEMPLATE_STATUS);
    assert.equal(manifest.strictAcceptanceEffect, false);
    assert.equal(manifest.launchContract.protocol, ROOT_PROJECTOR_LAUNCH_PROTOCOL);
    assert.equal(manifest.launchContract.commandLineSwfArgumentProvided, false);
    assert.equal(manifest.launchContract.sourceOpen.method, ROOT_SOURCE_OPEN_METHOD);
    assert.deepEqual(manifest.launchContract.sourceOpen.menuPath, ROOT_SOURCE_OPEN_MENU_PATH);
    assert.equal(manifest.expectedEvidenceCounts.frames, 2);
    assert.deepEqual(await readdir(path.join(result.kitRoot, "frames")), ["README.md"]);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffolds a ready legacy keyterm root spec only from the exact legacy index and native stage", async () => {
  const fixture = await createFixture({family: "legacy"});
  try {
    const [result] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
    });
    const manifest = JSON.parse(await readFile(path.join(result.kitRoot, "kit-manifest.json"), "utf8"));
    assert.deepEqual(manifest.frameDomain.nativeStage, {width: 225, height: 225});
    assert.equal(
      manifest.bindings.traceSpecIndex.file,
      "migrations/legacy-pilot-trace-spec-index.json",
    );
    assert.equal(manifest.bindings.traceSpecIndex.sha256, digest(await readFile(fixture.indexPath)));
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");

    const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
    index.artifactType = "course-shell-pilot-trace-spec-index";
    await writeJson(fixture.indexPath, index);
    await assert.rejects(
      () => buildRootCaptureKit({
        projectRoot: fixture.root,
        specFile: fixture.first.specRelative,
        runtime: fixture.runtime,
      }),
      /not the exact legacy-formula-keyterm index schema/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffolds a ready lesson-release root spec only from its exact release index", async () => {
  const fixture = await createFixture({family: "release"});
  try {
    const [result] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
    });
    const manifest = JSON.parse(
      await readFile(path.join(result.kitRoot, "kit-manifest.json"), "utf8"),
    );
    assert.equal(
      manifest.bindings.traceSpecIndex.file,
      "migrations/lesson-release-trace-spec-indexes/lesson-fixture-root-capture.json",
    );
    assert.equal(
      manifest.bindings.traceSpecIndex.sha256,
      digest(await readFile(fixture.indexPath)),
    );
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");

    const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
    index.members[0].traceSpecs[0].sha256 = "0".repeat(64);
    await writeJson(fixture.indexPath, index);
    await assert.rejects(
      () => buildRootCaptureKit({
        projectRoot: fixture.root,
        specFile: fixture.first.specRelative,
        runtime: fixture.runtime,
      }),
      /not the exact current indexed ready root specification/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("lesson-release reconcile verifies existing kits and transactionally creates the exact missing bilingual scope", async () => {
  const fixture = await makeAtomicBilingualReleaseFixture(
    await createFixture({family: "release", count: 2}),
    {fractionalOrdinals: [2]},
  );
  try {
    const selection = await listReadyLessonReleaseRootSpecs({
      projectRoot: fixture.root,
      releaseId: fixture.releaseId,
    });
    assert.equal(selection.specs.length, 4);
    assert.deepEqual(selection.specs.map(({language}) => language), ["en", "es", "en", "es"]);
    for (const item of selection.specs.slice(0, 2)) {
      await scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        specFile: item.file,
        runtime: fixture.runtime,
      });
    }
    const existingManifests = await Promise.all(selection.specs.slice(0, 2).map(({animationId, requirementId}) =>
      readFile(path.join(
        fixture.root,
        DEFAULT_ROOT_CAPTURE_KIT_ROOT,
        animationId,
        safeRequirementId(requirementId),
        "kit-manifest.json",
      )),
    ));
    const results = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      reconcileMissing: true,
      runtime: fixture.runtime,
    });
    assert.equal(results.length, 4);
    assert.equal(results.filter(({status}) => status === "verified-unsigned-template-only").length, 2);
    assert.equal(results.filter(({status}) => status === "scaffolded-unsigned-template-only").length, 2);
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      check: true,
      runtime: fixture.runtime,
    });
    assert.equal(checked.length, 4);
    assert.ok(checked.every(({status}) => status === "verified-unsigned-template-only"));
    for (const [index, item] of selection.specs.slice(0, 2).entries()) {
      const manifestPath = path.join(
        fixture.root,
        DEFAULT_ROOT_CAPTURE_KIT_ROOT,
        item.animationId,
        safeRequirementId(item.requirementId),
        "kit-manifest.json",
      );
      assert.deepEqual(await readFile(manifestPath), existingManifests[index]);
    }
    const fractional = selection.specs[2];
    const fractionalRoot = path.join(
      fixture.root,
      DEFAULT_ROOT_CAPTURE_KIT_ROOT,
      fractional.animationId,
      safeRequirementId(fractional.requirementId),
    );
    const manifest = JSON.parse(await readFile(path.join(fractionalRoot, "kit-manifest.json"), "utf8"));
    assert.deepEqual(manifest.frameDomain.nativeStage, {width: 799.9, height: 599.75});
    assert.deepEqual(manifest.captureRaster, {
      rule: "ceil-positive-native-stage-dimensions",
      width: 800,
      height: 600,
    });
    assert.match(await readFile(path.join(fractionalRoot, "frames", "README.md"), "utf8"), /800×600 PNGs/u);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("lesson-release reconcile rolls back every newly owned kit and animation directory on failure", async () => {
  const fixture = await makeAtomicBilingualReleaseFixture(
    await createFixture({family: "release", count: 2}),
  );
  try {
    const selection = await listReadyLessonReleaseRootSpecs({
      projectRoot: fixture.root,
      releaseId: fixture.releaseId,
    });
    for (const item of selection.specs.slice(0, 2)) {
      await scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        specFile: item.file,
        runtime: fixture.runtime,
      });
    }
    let written = 0;
    await assert.rejects(
      () => scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        lessonRelease: fixture.releaseId,
        reconcileMissing: true,
        runtime: fixture.runtime,
        transactionHooks: {
          afterReconcileKitWritten() {
            written += 1;
            if (written === 1) throw new Error("fixture reconcile interruption");
          },
        },
      }),
      /fixture reconcile interruption/,
    );
    const missingAnimationRoot = path.join(
      fixture.root,
      DEFAULT_ROOT_CAPTURE_KIT_ROOT,
      selection.specs[2].animationId,
    );
    assert.equal(await pathExists(missingAnimationRoot), false);
    for (const item of selection.specs.slice(0, 2)) {
      const [checked] = await scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        specFile: item.file,
        runtime: fixture.runtime,
        check: true,
      });
      assert.equal(checked.status, "verified-unsigned-template-only");
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("protocol-v3 lesson-release reconcile creates and checks the complete parallel bilingual scope", async () => {
  const fixture = await makeAtomicBilingualReleaseFixture(
    await createFixture({family: "release", count: 2}),
    {fractionalOrdinals: [2]},
  );
  try {
    const v3Root = path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT);
    await mkdir(v3Root, {recursive: true});
    const results = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      reconcileMissing: true,
      protocolV3: true,
      runtime: fixture.runtime,
    });
    assert.equal(results.length, 4);
    assert.ok(results.every(({status}) => status === "scaffolded-unsigned-template-only"));
    assert.ok(results.every(({kitRoot}) => kitRoot.startsWith(v3Root + path.sep)));
    assert.deepEqual(await readdir(path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_ROOT)), []);

    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      check: true,
      protocolV3: true,
      runtime: fixture.runtime,
    });
    assert.equal(checked.length, 4);
    assert.ok(checked.every(({status}) => status === "verified-unsigned-template-only"));
    for (const result of checked) {
      const manifest = JSON.parse(await readFile(path.join(result.kitRoot, "kit-manifest.json"), "utf8"));
      assert.equal(manifest.evidenceProtocol.outputRoot, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT);
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("protocol-v3 permits initial atomic generation of a complete lesson-release scope", async () => {
  const fixture = await makeAtomicBilingualReleaseFixture(
    await createFixture({family: "release", count: 2}),
  );
  try {
    const results = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      protocolV3: true,
      runtime: fixture.runtime,
    });
    assert.equal(results.length, 4);
    assert.ok(results.every(({status}) => status === "scaffolded-unsigned-template-only"));
    assert.ok(results.every(({kitRoot}) => kitRoot.startsWith(
      path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT) + path.sep,
    )));
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      lessonRelease: fixture.releaseId,
      protocolV3: true,
      check: true,
      runtime: fixture.runtime,
    });
    assert.equal(checked.length, 4);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("lesson-release root specs fail closed for catalog drift and duplicate animation members", async () => {
  const fixture = await createFixture({family: "release"});
  try {
    await buildRootCaptureKit({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
    });
    const catalogPath = path.join(fixture.root, "catalog", "lesson-releases.json");
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    catalog.fixtureDrift = true;
    await writeJson(catalogPath, catalog);
    await assert.rejects(
      () => buildRootCaptureKit({
        projectRoot: fixture.root,
        specFile: fixture.first.specRelative,
        runtime: fixture.runtime,
      }),
      /catalog binding is stale or ambiguous/,
    );

    const restored = {schemaVersion: 1, releases: [{releaseId: "lesson-fixture-root-capture"}]};
    await writeJson(catalogPath, restored);
    const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
    index.members.push(structuredClone(index.members[0]));
    await writeJson(fixture.indexPath, index);
    await assert.rejects(
      () => buildRootCaptureKit({
        projectRoot: fixture.root,
        specFile: fixture.first.specRelative,
        runtime: fixture.runtime,
      }),
      /duplicate or invalid animation members/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("launcher starts only empty Projector and requires named-human File Open for the staged hash-bound SWF", async () => {
  const fixture = await createFixture();
  try {
    const kit = await buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime});
    const launcher = kit.files.get("launch-projector-empty.sh");
    assertEmptyProjectorLauncher(launcher, kit.runtime.executablePath);
    const execLine = launcher.split(/\r?\n/).find((line) => line.startsWith("exec "));
    assert.ok(execLine.endsWith(`'${kit.runtime.executablePath}'`));
    assert.doesNotMatch(execLine, /\.swf/i);
    assert.match(launcher, /PROCESS LAUNCH ONLY/);
    assert.match(launcher, /File -> Open File/);
    assert.match(launcher, /runtime-source\/source\.swf/);
    assert.throws(
      () => assertEmptyProjectorLauncher(`${launcher.trim()} '${path.join(fixture.root, "attacker.swf")}'\n`, kit.runtime.executablePath),
      /must exec only the bound empty Projector/,
    );
    const launchTemplate = JSON.parse(kit.files.get("templates/source-open-launch-receipt.template.json"));
    const toolchainTemplate = JSON.parse(kit.files.get("templates/runtime-toolchain-receipt.template.json"));
    const attestationTemplate = JSON.parse(kit.files.get("templates/capture-session-attestation.template.json"));
    assert.equal(launchTemplate.projectorStart.swfArgument, null);
    assert.equal(launchTemplate.sourceOpen.playerWindowObserved, null);
    assert.equal(launchTemplate.notEvidence, true);
    assert.equal(launchTemplate.schemaVersion, 2);
    assert.equal(launchTemplate.evidenceType, "named-human-hash-bound-root-source-open-receipt");
    assert.ok(Object.hasOwn(launchTemplate, "endedAt"));
    assert.equal(Object.hasOwn(launchTemplate, "finalizedAt"), false);
    assert.equal(Object.hasOwn(kit.manifest, "evidenceProtocol"), false);
    assert.equal(toolchainTemplate.captureSessionBinding.captureKitManifestSha256, kit.manifestSha256);
    assert.equal(toolchainTemplate.captureSessionBinding.launchReceiptSha256, null);
    assert.deepEqual(attestationTemplate.launchReceipt, {file: null, sha256: null});
    for (const schemaName of ["operation-log.schema.template.jsonl", "display-list-states.schema.template.jsonl"]) {
      const schema = JSON.parse(kit.files.get(`templates/${schemaName}`));
      assert.ok(schema.requiredFields.includes("captureKitManifestSha256"));
      assert.ok(schema.requiredFields.includes("launchReceiptSha256"));
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("protocol-v3 scaffolds and checks only the parallel acyclic successor root", async () => {
  const fixture = await createFixture();
  try {
    const [result] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
      protocolV3: true,
    });
    const expectedRoot = path.join(
      fixture.root,
      DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
      fixture.first.animationId,
      fixture.first.safeId,
    );
    assert.equal(result.kitRoot, expectedRoot);
    assert.equal(await pathExists(path.join(
      fixture.root,
      DEFAULT_ROOT_CAPTURE_KIT_ROOT,
      fixture.first.animationId,
      fixture.first.safeId,
    )), false);

    const manifest = JSON.parse(await readFile(path.join(result.kitRoot, "kit-manifest.json"), "utf8"));
    assert.equal(manifest.evidenceProtocol.schemaVersion, 3);
    assert.equal(manifest.evidenceProtocol.name, "acyclic-root-capture-evidence-dag-v3");
    assert.equal(manifest.evidenceProtocol.outputRoot, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT);
    assert.equal(manifest.evidenceProtocol.postHocLaunchOrToolchainReceiptsAllowed, false);
    assert.equal(manifest.evidenceProtocol.operatorReadiness.operatorReady, false);
    assert.deepEqual(manifest.evidenceProtocol.operatorReadiness.requiredPreflights, [
      "external-named-operator-authorization",
      "authorized-disposable-offline-environment-preflight",
      "outside-kit-session-output-root-preflight",
      "fresh-storage-capacity-preflight",
    ]);

    const launch = JSON.parse(await readFile(
      path.join(result.kitRoot, "templates", "source-open-launch-receipt.template.json"),
      "utf8",
    ));
    assert.equal(launch.schemaVersion, 3);
    assert.equal(launch.evidenceType, "named-human-hash-bound-root-source-open-start-receipt");
    assert.ok(Object.hasOwn(launch, "finalizedAt"));
    assert.equal(Object.hasOwn(launch, "endedAt"), false);
    const launcher = await readFile(path.join(result.kitRoot, "launch-projector-empty.sh"), "utf8");
    assert.match(launcher, /--protocol-v3/);
    assert.match(launcher, /work\/root-capture-kits-v3/);
    const card = await readFile(path.join(result.kitRoot, "OPERATOR_CARD.md"), "utf8");
    const readme = await readFile(path.join(result.kitRoot, "README.md"), "utf8");
    assert.match(card, /not operator-ready/);
    assert.match(card, /fresh storage-capacity preflight/);
    assert.match(card, /lossless PNGs, logs, manifests, comparisons, and archives/);
    assert.match(card, /Post-hoc launch\/toolchain receipts are prohibited/);
    assert.match(card, /finalizedAt <= capturedAt/);
    assert.match(readme, /one-way DAG/);
    assert.match(readme, /fresh storage capacity/);
    assert.match(readme, /immediately before every bounded session/);
    assert.match(readme, /Post-hoc receipts or receipt rewrites are prohibited/);

    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      specFile: fixture.first.specRelative,
      runtime: fixture.runtime,
      protocolV3: true,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
    assert.equal(checked.kitRoot, expectedRoot);
    await assert.rejects(
      () => scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        specFile: fixture.first.specRelative,
        runtime: fixture.runtime,
        check: true,
      }),
      /root-capture requirement kit is missing/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--all-ready generates and checks exactly the reviewed set of 18 current indexed root specs", async () => {
  const fixture = await createFixture({count: 18});
  try {
    const listed = await listReadyRootSpecs({projectRoot: fixture.root});
    assert.equal(listed.specs.length, 18);
    const results = await scaffoldRootCaptureKits({projectRoot: fixture.root, allReady: true, runtime: fixture.runtime});
    assert.equal(results.length, 18);
    assert.ok(results.every(({strictAcceptanceEffect}) => strictAcceptanceEffect === false));
    const checked = await scaffoldRootCaptureKits({projectRoot: fixture.root, allReady: true, runtime: fixture.runtime, check: true});
    assert.equal(checked.length, 18);
    assert.ok(checked.every(({status}) => status === "verified-unsigned-template-only"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--refresh-unsigned-template archives a complete old tree and atomically installs the current single-spec kit", async () => {
  const fixture = await createFixture();
  try {
    const sourceBefore = await readFile(fixture.first.sourcePath);
    const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
    const oldManifest = await readFile(path.join(old.kitRoot, "kit-manifest.json"));
    const [refreshed] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    assert.equal(refreshed.status, "refreshed-unsigned-template-only");
    assert.ok(refreshed.staleArchiveRoot.startsWith(path.join(fixture.root, ROOT_CAPTURE_STALE_ARCHIVE_ROOT)));
    assert.deepEqual(
      await readFile(path.join(refreshed.staleArchiveRoot, "kit", "kit-manifest.json")),
      oldManifest,
    );
    const archiveRecord = JSON.parse(await readFile(path.join(refreshed.staleArchiveRoot, "archive-record.json"), "utf8"));
    assert.equal(archiveRecord.oldTreeSha256, refreshed.staleArchiveTreeSha256);
    assert.equal(archiveRecord.newCaptureKitManifestSha256, refreshed.captureKitManifestSha256);
    assert.equal(archiveRecord.strictAcceptanceEffect, false);
    assert.equal(archiveRecord.fileCount, archiveRecord.files.length);
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      check: true,
      ...selection,
    });
    assert.equal(checked.length, 1);
    assert.deepEqual(await readFile(fixture.first.sourcePath), sourceBefore);
    await assert.rejects(
      () => scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        runtime: fixture.runtime,
        refreshUnsignedTemplate: true,
        ...selection,
      }),
      /at least one stale allowlisted unsigned-template binding SHA-256/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--refresh-unsigned-template accepts a synchronized technical manifest projection and trace-spec SHA cascade", async () => {
  const fixture = await createFixture();
  try {
    const selection = {specFile: fixture.first.specRelative};
    const [old] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      ...selection,
    });
    const oldKitManifest = JSON.parse(await readFile(path.join(old.kitRoot, "kit-manifest.json"), "utf8"));
    const manifestPath = path.join(fixture.first.workspace, "migration.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.implementation.rendering = "fixture-svg";
    await writeJson(manifestPath, manifest);
    const currentProjectionSha256 = technicalManifestSha256(manifest);
    assert.notEqual(currentProjectionSha256, oldKitManifest.bindings.migrationManifest.sha256);

    const specPath = path.join(fixture.root, fixture.first.specRelative);
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.sourceBindings.migrationManifest.sha256 = currentProjectionSha256;
    const currentSpecSha256 = await writeJson(specPath, spec);
    assert.notEqual(currentSpecSha256, oldKitManifest.bindings.traceSpec.sha256);
    const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
    index.pilots[0].traceSpecs[0].sha256 = currentSpecSha256;
    await writeJson(fixture.indexPath, index);

    const [refreshed] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    const archiveRecord = JSON.parse(await readFile(path.join(refreshed.staleArchiveRoot, "archive-record.json"), "utf8"));
    assert.equal(
      archiveRecord.oldMigrationManifestProjectionSha256,
      oldKitManifest.bindings.migrationManifest.sha256,
    );
    assert.equal(archiveRecord.currentMigrationManifestProjectionSha256, currentProjectionSha256);
    assert.notEqual(
      archiveRecord.oldMigrationManifestProjectionSha256,
      archiveRecord.currentMigrationManifestProjectionSha256,
    );
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      check: true,
      ...selection,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--refresh-unsigned-template accepts synchronized full-frame coverage projection and trace-spec SHA drift", async () => {
  const fixture = await createFixture();
  try {
    const selection = {specFile: fixture.first.specRelative};
    const [old] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      ...selection,
    });
    const oldKitManifest = JSON.parse(await readFile(path.join(old.kitRoot, "kit-manifest.json"), "utf8"));
    const coveragePath = path.join(fixture.first.workspace, "evidence", "full-frame-coverage.json");
    const coverage = JSON.parse(await readFile(coveragePath, "utf8"));
    coverage.requirements.push({
      ...structuredClone(coverage.requirements[0]),
      requirementId: "req:sprite:source-drawing-lead-in:en:partial-frames-1-1",
      frameDomainId: "sprite",
      traceId: "trace:sprite:source-drawing-lead-in:en:seed-0:partial-frames-1-1",
      requiredRange: {firstFrame: 1, lastFrame: 1},
    });
    await writeJson(coveragePath, coverage);
    const currentCoverageProjectionSha256 = traceCoverageSha256(coverage);
    assert.notEqual(
      currentCoverageProjectionSha256,
      oldKitManifest.bindings.fullFrameCoverage.sha256,
    );

    const specPath = path.join(fixture.root, fixture.first.specRelative);
    const spec = JSON.parse(await readFile(specPath, "utf8"));
    spec.sourceBindings.fullFrameCoverage.sha256 = currentCoverageProjectionSha256;
    const currentSpecSha256 = await writeJson(specPath, spec);
    assert.notEqual(currentSpecSha256, oldKitManifest.bindings.traceSpec.sha256);
    const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
    index.pilots[0].traceSpecs[0].sha256 = currentSpecSha256;
    await writeJson(fixture.indexPath, index);

    const [refreshed] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    const archivedManifest = JSON.parse(
      await readFile(path.join(refreshed.staleArchiveRoot, "kit", "kit-manifest.json"), "utf8"),
    );
    const refreshedManifest = JSON.parse(await readFile(path.join(refreshed.kitRoot, "kit-manifest.json"), "utf8"));
    assert.equal(
      archivedManifest.bindings.fullFrameCoverage.sha256,
      oldKitManifest.bindings.fullFrameCoverage.sha256,
    );
    assert.equal(
      refreshedManifest.bindings.fullFrameCoverage.sha256,
      currentCoverageProjectionSha256,
    );
    assert.notEqual(
      archivedManifest.bindings.fullFrameCoverage.sha256,
      refreshedManifest.bindings.fullFrameCoverage.sha256,
    );
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      check: true,
      ...selection,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--all-ready refreshes and then byte-checks the exact reviewed 18/18 root kit set", async () => {
  const fixture = await createFixture({count: 18});
  try {
    const {selection} = await scaffoldThenStaleIndex(fixture, {allReady: true});
    const refreshed = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    assert.equal(refreshed.length, 18);
    assert.equal(new Set(refreshed.map(({staleArchiveRoot}) => staleArchiveRoot)).size, 18);
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      allReady: true,
      check: true,
    });
    assert.equal(checked.length, 18);
    assert.ok(checked.every(({status}) => status === "verified-unsigned-template-only"));
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--all-ready accepts the real six-kit trace-spec/scenario/index SHA cascade and nothing broader", async () => {
  const fixture = await createFixture({count: 18});
  try {
    const {results, selection} = await scaffoldThenStaleIndex(fixture, {allReady: true});
    for (let index = 0; index < 6; index += 1) {
      await rewriteUnsignedKitFromSyntheticManifest(results[index].kitRoot, fixture.root, (manifest) => {
        manifest.bindings.traceSpec.sha256 = digest("historical trace spec " + index);
        manifest.bindings.scenarioInventory.sha256 = digest("historical scenario inventory " + index);
      });
    }
    const refreshed = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    assert.equal(refreshed.length, 18);
    for (let index = 0; index < 6; index += 1) {
      const archiveRecord = JSON.parse(await readFile(path.join(refreshed[index].staleArchiveRoot, "archive-record.json"), "utf8"));
      assert.notEqual(archiveRecord.oldTraceSpecSha256, archiveRecord.currentTraceSpecSha256);
      assert.notEqual(archiveRecord.oldScenarioInventorySha256, archiveRecord.currentScenarioInventorySha256);
      assert.notEqual(archiveRecord.oldTraceSpecIndexSha256, archiveRecord.currentTraceSpecIndexSha256);
    }
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      allReady: true,
      check: true,
    });
    assert.equal(checked.length, 18);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("refresh rejects tampering, extra frame evidence, and symbolic links before archival", async (t) => {
  await t.test("tampered generator file", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      const readme = path.join(old.kitRoot, "README.md");
      await chmod(readme, 0o644);
      await writeFile(readme, "tampered unsigned template\n");
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /not exact generator output/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("extra captured frame", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      await writeFile(path.join(old.kitRoot, "frames", "frame-001.png"), "not evidence\n");
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /session, evidence, frame, or extra files/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("symlinked placeholder", async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-refresh-symlink-"));
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      const placeholder = path.join(old.kitRoot, "frames", "README.md");
      const external = path.join(outside, "README.md");
      await writeFile(external, "outside\n");
      await rm(placeholder);
      await symlink(external, placeholder);
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /forbidden symbolic link/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("refresh rejects fully rerendered synthetic templates with non-allowlisted semantic drift", async (t) => {
  const cases = [
    ["identity", (manifest) => { manifest.identity.entryStateSha256 = "f".repeat(64); }],
    ["frame domain", (manifest) => { manifest.frameDomain.fps = 24; }],
    ["runtime", (manifest) => { manifest.runtime.version = "synthetic-runtime"; }],
    ["migration projection path", (manifest) => { manifest.bindings.migrationManifest.file = "migrations/attacker.json"; }],
    ["migration projection id", (manifest) => { manifest.bindings.migrationManifest.projection = "attacker-projection"; }],
    ["migration projection hash mode", (manifest) => { manifest.bindings.migrationManifest.hashMode = "attacker-hash-mode"; }],
    ["coverage projection path", (manifest) => { manifest.bindings.fullFrameCoverage.file = "migrations/attacker.json"; }],
    ["coverage projection id", (manifest) => { manifest.bindings.fullFrameCoverage.projection = "attacker-projection"; }],
    ["coverage projection hash mode", (manifest) => { manifest.bindings.fullFrameCoverage.hashMode = "attacker-hash-mode"; }],
    ["trace-spec path", (manifest) => { manifest.bindings.traceSpec.file = "migrations/attacker.json"; }],
    ["scenario projection", (manifest) => { manifest.bindings.scenarioInventory.projection = "attacker-projection"; }],
    ["scenario hash mode", (manifest) => { manifest.bindings.scenarioInventory.hashMode = "attacker-hash-mode"; }],
    ["unexpected schedule", (manifest) => { manifest.schedule = {status: "synthetic"}; }],
  ];
  for (const [label, mutate] of cases) {
    await t.test(label, async () => {
      const fixture = await createFixture();
      try {
        const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
        await rewriteUnsignedKitFromSyntheticManifest(old.kitRoot, fixture.root, mutate);
        await assert.rejects(
          () => scaffoldRootCaptureKits({
            projectRoot: fixture.root,
            runtime: fixture.runtime,
            refreshUnsignedTemplate: true,
            ...selection,
          }),
          /differs beyond the five allowlisted stale binding SHA-256 transforms/,
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("refresh rejects malformed or unpaired historical technical manifest projection SHA drift", async (t) => {
  await t.test("malformed technical projection SHA", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      await rewriteUnsignedKitFromSyntheticManifest(old.kitRoot, fixture.root, (manifest) => {
        manifest.bindings.migrationManifest.sha256 = "e".repeat(63);
      });
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /technical migration manifest projection SHA-256 is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("technical projection drift without trace-spec drift", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      await rewriteUnsignedKitFromSyntheticManifest(old.kitRoot, fixture.root, (manifest) => {
        manifest.bindings.migrationManifest.sha256 = "e".repeat(64);
      });
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /technical migration manifest projection SHA-256 drift requires trace-spec SHA-256 drift/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("refresh rejects malformed or unpaired historical full-frame coverage projection SHA drift", async (t) => {
  await t.test("malformed full-frame coverage projection SHA", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      await rewriteUnsignedKitFromSyntheticManifest(old.kitRoot, fixture.root, (manifest) => {
        manifest.bindings.fullFrameCoverage.sha256 = "e".repeat(63);
      });
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /full-frame coverage projection SHA-256 is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("coverage projection drift without trace-spec drift", async () => {
    const fixture = await createFixture();
    try {
      const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
      await rewriteUnsignedKitFromSyntheticManifest(old.kitRoot, fixture.root, (manifest) => {
        manifest.bindings.fullFrameCoverage.sha256 = "e".repeat(64);
      });
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /full-frame coverage projection SHA-256 drift requires trace-spec SHA-256 drift/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("refresh holds owned locks against concurrency and rejects stale CAS while retaining a reusable archive", async () => {
  const fixture = await createFixture();
  try {
    const {results: [old], selection} = await scaffoldThenStaleIndex(fixture);
    const readmePath = path.join(old.kitRoot, "README.md");
    const readme = await readFile(readmePath);
    await assert.rejects(
      () => scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        runtime: fixture.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          afterArchivesWritten: async () => {
            await chmod(readmePath, 0o644);
            await writeFile(readmePath, Buffer.concat([readme, Buffer.from("concurrent mutation\n")]));
          },
        },
        ...selection,
      }),
      /stale CAS/,
    );
    await writeFile(readmePath, readme);
    await chmod(readmePath, 0o444);
    const attempts = await Promise.allSettled([
      scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        runtime: fixture.runtime,
        refreshUnsignedTemplate: true,
        ...selection,
      }),
      scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        runtime: fixture.runtime,
        refreshUnsignedTemplate: true,
        ...selection,
      }),
    ]);
    assert.equal(attempts.filter(({status}) => status === "fulfilled").length, 1);
    assert.equal(attempts.filter(({status}) => status === "rejected").length, 1);
    const [checked] = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      check: true,
      ...selection,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("--all-ready rolls every active kit back when a swap-phase failure occurs, then safely reuses archives", async () => {
  const fixture = await createFixture({count: 18});
  try {
    const {results: oldResults, selection} = await scaffoldThenStaleIndex(fixture, {allReady: true});
    const oldManifestHashes = new Map();
    for (const result of oldResults) {
      oldManifestHashes.set(result.kitRoot, digest(await readFile(path.join(result.kitRoot, "kit-manifest.json"))));
    }
    await assert.rejects(
      () => scaffoldRootCaptureKits({
        projectRoot: fixture.root,
        runtime: fixture.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          afterSwap: async ({index}) => {
            if (index === 0) throw new Error("injected swap failure");
          },
        },
        ...selection,
      }),
      /injected swap failure/,
    );
    for (const [kitRoot, expected] of oldManifestHashes) {
      assert.equal(digest(await readFile(path.join(kitRoot, "kit-manifest.json"))), expected);
    }
    const refreshed = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      refreshUnsignedTemplate: true,
      ...selection,
    });
    assert.equal(refreshed.length, 18);
    const checked = await scaffoldRootCaptureKits({
      projectRoot: fixture.root,
      runtime: fixture.runtime,
      allReady: true,
      check: true,
    });
    assert.equal(checked.length, 18);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("fails closed for stale specification, index, source hash, and runtime identity", async (t) => {
  await t.test("stale technical projection", async () => {
    const fixture = await createFixture();
    try {
      const manifestPath = path.join(fixture.first.workspace, "migration.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      manifest.runtime.frameCount += 1;
      await writeJson(manifestPath, manifest);
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime}),
        /projection binding is stale/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("stale index hash", async () => {
    const fixture = await createFixture();
    try {
      const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
      index.pilots[0].traceSpecs[0].sha256 = "0".repeat(64);
      await writeJson(fixture.indexPath, index);
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime}),
        /not the exact current indexed ready root specification/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("stale source hash", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(fixture.first.sourcePath, "tampered source\n");
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime}),
        /source SWF SHA-256 is stale/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("wrong and stale Projector runtime", async () => {
    const fixture = await createFixture();
    try {
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: {...fixture.runtime, runtimeId: "ruffle"}}),
        /Only the approved Adobe Flash Player Projector runtime/,
      );
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: {...fixture.runtime, executableSha256: "0".repeat(64)}}),
        /Projector executable SHA-256 is stale/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects path escape and symbolic-link source/output attacks", async (t) => {
  await t.test("parent path", async () => {
    const fixture = await createFixture();
    try {
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: `../${path.basename(fixture.first.specRelative)}`, runtime: fixture.runtime}),
        /normalized portable project-relative path/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("source symlink escape", async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-source-escape-"));
    try {
      const externalSource = path.join(outside, "source.swf");
      await writeFile(externalSource, fixture.first.sourceBytes);
      await rm(fixture.first.sourcePath);
      await symlink(externalSource, fixture.first.sourcePath);
      await assert.rejects(
        () => buildRootCaptureKit({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime}),
        /forbidden symbolic-link component/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
  await t.test("requirement output symlink", async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-output-escape-"));
    try {
      const parent = path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_ROOT, fixture.first.animationId);
      await mkdir(parent, {recursive: true});
      await symlink(outside, path.join(parent, fixture.first.safeId), "dir");
      await assert.rejects(
        () => scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime}),
        /forbidden symbolic-link component/,
      );
      assert.deepEqual(await readdir(outside), []);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("check refuses edits, extra files, and session observations written into immutable templates", async () => {
  const fixture = await createFixture();
  try {
    const [result] = await scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime});
    const template = path.join(result.kitRoot, "templates", "runtime-toolchain-receipt.template.json");
    await chmod(template, 0o644);
    await writeFile(template, `${(await readFile(template, "utf8")).trim()}\n `);
    await assert.rejects(
      () => scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime, check: true}),
      /stale or edited/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("check and refresh reject hard-linked active kit files", async (t) => {
  await t.test("check", async () => {
    const fixture = await createFixture();
    try {
      const [result] = await scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime});
      await link(path.join(result.kitRoot, "README.md"), path.join(fixture.root, "readme-hardlink-alias.md"));
      await assert.rejects(
        () => scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime, check: true}),
        /must not be hard-linked/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("refresh inventory", async () => {
    const fixture = await createFixture();
    try {
      const {results: [result], selection} = await scaffoldThenStaleIndex(fixture);
      await link(path.join(result.kitRoot, "README.md"), path.join(fixture.root, "readme-hardlink-alias.md"));
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          ...selection,
        }),
        /must not be symbolic- or hard-linked/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("scaffold rollback preserves foreign children and kit-root replacements", async (t) => {
  await t.test("foreign child sentinel", async () => {
    const fixture = await createFixture();
    let sentinel;
    try {
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          specFile: fixture.first.specRelative,
          runtime: fixture.runtime,
          transactionHooks: {
            afterKitRootCreated: async ({kitRoot, hookContext}) => {
              if (hookContext !== "scaffold") return;
              const foreign = path.join(kitRoot, "foreign-child");
              await mkdir(foreign);
              sentinel = path.join(foreign, "sentinel.txt");
              await writeFile(sentinel, "preserve me\n");
              throw new Error("injected foreign-child rollback");
            },
          },
        }),
        /injected foreign-child rollback/,
      );
      assert.equal(await readFile(sentinel, "utf8"), "preserve me\n");
      assert.deepEqual(await readdir(path.dirname(sentinel)), ["sentinel.txt"]);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("kit-root replacement", async () => {
    const fixture = await createFixture();
    let sentinel;
    try {
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          specFile: fixture.first.specRelative,
          runtime: fixture.runtime,
          transactionHooks: {
            afterKitRootCreated: async ({kitRoot, hookContext}) => {
              if (hookContext !== "scaffold") return;
              await rename(kitRoot, `${kitRoot}-displaced-owned-root`);
              await mkdir(kitRoot);
              sentinel = path.join(kitRoot, "replacement-sentinel.txt");
              await writeFile(sentinel, "foreign replacement\n");
              throw new Error("injected root replacement rollback");
            },
          },
        }),
        /injected root replacement rollback/,
      );
      assert.equal(await readFile(sentinel, "utf8"), "foreign replacement\n");
      assert.deepEqual(await readdir(path.dirname(sentinel)), ["replacement-sentinel.txt"]);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("unchanged owned partial kit", async () => {
    const fixture = await createFixture();
    const kitRoot = path.join(fixture.root, DEFAULT_ROOT_CAPTURE_KIT_ROOT, fixture.first.animationId, fixture.first.safeId);
    try {
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          specFile: fixture.first.specRelative,
          runtime: fixture.runtime,
          transactionHooks: {
            afterKitFileWritten: async ({hookContext}) => {
              if (hookContext === "scaffold") throw new Error("injected owned-partial rollback");
            },
          },
        }),
        /injected owned-partial rollback/,
      );
      assert.equal(await pathExists(kitRoot), false);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("archive and refresh publication preserve foreign slot replacements", async (t) => {
  await t.test("archive-slot replacement", async () => {
    const fixture = await createFixture();
    let finalRoot;
    let sentinel;
    try {
      const {selection} = await scaffoldThenStaleIndex(fixture);
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          transactionHooks: {
            afterArchiveSlotCreated: async ({finalRoot: observed}) => {
              finalRoot = observed;
              await rename(finalRoot, `${finalRoot}-displaced-owned-slot`);
              await mkdir(finalRoot);
              sentinel = path.join(finalRoot, "replacement-sentinel.txt");
              await writeFile(sentinel, "foreign archive replacement\n");
            },
          },
          ...selection,
        }),
        /identity changed during the transaction/,
      );
      assert.equal(await readFile(sentinel, "utf8"), "foreign archive replacement\n");
      assert.deepEqual(await readdir(finalRoot), ["replacement-sentinel.txt"]);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("refresh active-slot replacement", async () => {
    const fixture = await createFixture();
    let active;
    let backup;
    let sentinel;
    try {
      const {selection} = await scaffoldThenStaleIndex(fixture);
      await assert.rejects(
        () => scaffoldRootCaptureKits({
          projectRoot: fixture.root,
          runtime: fixture.runtime,
          refreshUnsignedTemplate: true,
          transactionHooks: {
            afterOldKitMoved: async ({active: observedActive, backup: observedBackup}) => {
              active = observedActive;
              backup = observedBackup;
              await mkdir(active);
              sentinel = path.join(active, "replacement-sentinel.txt");
              await writeFile(sentinel, "foreign active replacement\n");
            },
          },
          ...selection,
        }),
        /safe rollback preserved foreign state/,
      );
      assert.equal(await readFile(sentinel, "utf8"), "foreign active replacement\n");
      assert.deepEqual(await readdir(active), ["replacement-sentinel.txt"]);
      assert.equal(await pathExists(path.join(backup, "kit-manifest.json")), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("root candidate preparer rejects scaffold templates by path and by still-blank content", async () => {
  const fixture = await createFixture();
  try {
    const [result] = await scaffoldRootCaptureKits({projectRoot: fixture.root, specFile: fixture.first.specRelative, runtime: fixture.runtime});
    const relative = (candidate) => portable(path.relative(fixture.root, candidate));
    await assert.rejects(
      () => prepareRootCaptureCandidate({
        projectRoot: fixture.root,
        spec: fixture.first.specRelative,
        operationLog: relative(path.join(result.kitRoot, "templates", "operation-log.schema.template.jsonl")),
        frames: relative(path.join(result.kitRoot, "frames")),
        displayListStates: relative(path.join(result.kitRoot, "templates", "display-list-states.schema.template.jsonl")),
        launchReceipt: relative(path.join(result.kitRoot, "templates", "source-open-launch-receipt.template.json")),
        toolchainReceipt: relative(path.join(result.kitRoot, "templates", "runtime-toolchain-receipt.template.json")),
        captureSessionAttestation: relative(path.join(result.kitRoot, "templates", "capture-session-attestation.template.json")),
        proofMode: "sequential-step-root-exhaustive",
      }),
      /real session artifact, not an unsigned template/,
    );

    const session = path.join(fixture.root, "work", "real-session-name-but-blank-bytes");
    await mkdir(path.join(session, "frames"), {recursive: true});
    await symlink(
      path.join(result.kitRoot, "templates", "operation-log.schema.template.jsonl"),
      path.join(session, "operation-log.jsonl"),
    );
    for (const [source, destination] of [
      ["display-list-states.schema.template.jsonl", "display-list-states.jsonl"],
      ["source-open-launch-receipt.template.json", "source-open-launch-receipt.json"],
      ["runtime-toolchain-receipt.template.json", "runtime-toolchain-receipt.json"],
      ["capture-session-attestation.template.json", "capture-session-attestation.json"],
    ]) await copyFile(path.join(result.kitRoot, "templates", source), path.join(session, destination));
    await assert.rejects(
      () => prepareRootCaptureCandidate({
        projectRoot: fixture.root,
        spec: fixture.first.specRelative,
        operationLog: relative(path.join(session, "operation-log.jsonl")),
        frames: relative(path.join(session, "frames")),
        displayListStates: relative(path.join(session, "display-list-states.jsonl")),
        launchReceipt: relative(path.join(session, "source-open-launch-receipt.json")),
        toolchainReceipt: relative(path.join(session, "runtime-toolchain-receipt.json")),
        captureSessionAttestation: relative(path.join(session, "capture-session-attestation.json")),
        proofMode: "sequential-step-root-exhaustive",
      }),
      /outside the unsigned root-capture kit/,
    );
    await rm(path.join(session, "operation-log.jsonl"));
    await copyFile(
      path.join(result.kitRoot, "templates", "operation-log.schema.template.jsonl"),
      path.join(session, "operation-log.jsonl"),
    );
    await assert.rejects(
      () => prepareRootCaptureCandidate({
        projectRoot: fixture.root,
        spec: fixture.first.specRelative,
        operationLog: relative(path.join(session, "operation-log.jsonl")),
        frames: relative(path.join(session, "frames")),
        displayListStates: relative(path.join(session, "display-list-states.jsonl")),
        launchReceipt: relative(path.join(session, "source-open-launch-receipt.json")),
        toolchainReceipt: relative(path.join(session, "runtime-toolchain-receipt.json")),
        captureSessionAttestation: relative(path.join(session, "capture-session-attestation.json")),
        proofMode: "sequential-step-root-exhaustive",
      }),
      /sessionId must be a UUID/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("CLI exposes exact spec, pilot, and atomic lesson-release reconcile selectors", () => {
  assert.deepEqual(parseArguments(["--spec", "migrations/a.json", "--check"]), {
    specFile: "migrations/a.json",
    allReady: false,
    lessonRelease: null,
    playerApp: "/Applications/Adobe Animate 2021/Players/Flash Player.app",
    check: true,
    reconcileMissing: false,
    refreshUnsignedTemplate: false,
    protocolV3: false,
    help: false,
  });
  assert.equal(parseArguments(["--all-ready"]).allReady, true);
  assert.equal(parseArguments(["--all-ready", "--protocol-v3"]).protocolV3, true);
  assert.equal(parseArguments(["--all-ready", "--refresh-unsigned-template"]).refreshUnsignedTemplate, true);
  assert.equal(parseArguments([
    "--lesson-release", "lesson-g04-l10-perimeter-area", "--reconcile-missing",
  ]).reconcileMissing, true);
  assert.equal(parseArguments([
    "--lesson-release", "lesson-g04-l10-perimeter-area", "--check",
  ]).check, true);
  assert.equal(parseArguments([
    "--lesson-release", "lesson-g04-l10-perimeter-area", "--protocol-v3",
  ]).protocolV3, true);
  assert.throws(() => parseArguments([]), /select exactly one/);
  assert.throws(() => parseArguments(["--all-ready", "--spec", "x"]), /select exactly one/);
  assert.throws(() => parseArguments(["--lesson-release", "lesson-x"]), /requires either --reconcile-missing or --check/);
  assert.throws(() => parseArguments(["--spec", "x", "--reconcile-missing"]), /restricted to one complete --lesson-release/);
  assert.throws(() => parseArguments(["--spec", "x", "--output", "/tmp/x"]), /Unknown option/);
  assert.throws(() => parseArguments(["--spec", "x", "--swf", "source.swf"]), /Unknown option/);
  assert.throws(() => parseArguments(["--spec", "x", "--check", "--refresh-unsigned-template"]), /mutually exclusive/);
  assert.throws(
    () => parseArguments(["--spec", "x", "--protocol-v3", "--refresh-unsigned-template"]),
    /parallel successor root and never refreshes/,
  );
  assert.match(usage(), /empty Projector/);
  assert.match(usage(), /18 ready root requirements/);
  assert.match(usage(), /complete atomic lesson-release root scope/);
  assert.match(usage(), /root-capture-kits-v3/);
  assert.match(usage(), /Post-hoc launch\/toolchain receipts are forbidden/);
});
