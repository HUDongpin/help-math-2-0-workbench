import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, copyFile, link, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE,
  SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
  DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT,
  DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
  SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS,
  SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
  SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
  buildSourceDrivenBranchCaptureKit,
  buildSourceDrivenBranchCurrentV2Files,
  buildSourceDrivenBranchLegacyV1Files,
  buildSourceDrivenBranchPreviousV2Files,
  parseArguments,
  scaffoldSourceDrivenBranchCaptureKits,
  usage,
  validateSourceDrivenSpec,
} from "./scaffold-source-driven-branch-capture-kit.mjs";
import {canonicalJson, safeRequirementId} from "./build-course-trace-specs.mjs";
import {scenarioInventorySha256, technicalManifestSha256} from "./evidence-projections.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tiProfile = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES[0];
const irProfile = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES[1];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertExactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), label);
}

async function copyRelative(root, relative) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(repositoryRoot, relative), destination);
}

async function fixtureRuntime(root) {
  const appPath = path.join(root, "Fixture Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const bytes = Buffer.from("fixture Adobe Flash Player executable\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, bytes);
  const runtime = {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version: "32.0.0.414-test",
    requestedAppPath: appPath,
    appPath,
    executablePath,
    executableSha256: digest(bytes),
  };
  return {
    ...runtime,
    testOnlyApprovedRuntime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      executableSha256: runtime.executableSha256,
    },
  };
}

async function makeProjectFixture(specIndex = 0) {
  const root = await mkdtemp(path.join(os.tmpdir(), "source-driven-branch-kit-"));
  const specFile = tiProfile.specs[specIndex].specFile;
  const spec = JSON.parse(await readFile(path.join(repositoryRoot, specFile), "utf8"));
  const workspace = `migrations/${tiProfile.animationId}`;
  const required = [
    specFile,
    "migrations/course-shell-pilot-trace-spec-index.json",
    `${workspace}/${spec.sourceBindings.migrationManifest.path}`,
    `${workspace}/${spec.sourceBindings.fullFrameCoverage.path}`,
    `${workspace}/${spec.sourceBindings.scenarioInventory.path}`,
    spec.sourceBindings.sourceSwf.path,
    spec.sourceBindings.scheduleDerivation.generator.path,
    "scripts/build-adobe-course-host-fixtures.mjs",
    "scripts/source-driven-branch-capture-contracts.mjs",
    "migrations/course-g03-l06-ti-001/audit/audio-runtime-evidence.json",
    tiProfile.fixtureManifest,
  ];
  for (const relative of required) await copyRelative(root, relative);
  const fixture = JSON.parse(await readFile(path.join(repositoryRoot, tiProfile.fixtureManifest), "utf8"));
  const fixtureRoot = path.dirname(tiProfile.fixtureManifest);
  for (const item of fixture.generatedFileHashes) await copyRelative(root, `${fixtureRoot}/${item.path}`);
  return {root, specFile, runtime: await fixtureRuntime(root)};
}

async function writeKitFiles(root, kit, files) {
  const kitRoot = path.join(root, DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT, kit.manifest.animationId, safeRequirementId(kit.manifest.requirementId));
  await mkdir(kitRoot, {recursive: true});
  for (const [relative, descriptor] of files) {
    const destination = path.join(kitRoot, relative);
    await mkdir(path.dirname(destination), {recursive: true});
    await writeFile(destination, descriptor.content, {flag: "wx", mode: descriptor.mode});
    await chmod(destination, descriptor.mode);
  }
  return kitRoot;
}

async function makeLegacyKitFixture() {
  const fixture = await makeProjectFixture();
  const kit = await buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime});
  const legacy = buildSourceDrivenBranchLegacyV1Files(kit);
  const kitRoot = await writeKitFiles(fixture.root, kit, legacy.files);
  return {
    ...fixture,
    kit,
    legacy,
    kitRoot,
    legacyManifestHashes: {[kit.manifest.requirementId]: legacy.manifestSha256},
  };
}

async function makePreviousV2KitFixture() {
  const fixture = await makeProjectFixture();
  const kit = await buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime});
  const previousV2 = buildSourceDrivenBranchPreviousV2Files(kit);
  const kitRoot = await writeKitFiles(fixture.root, kit, previousV2.files);
  return {
    ...fixture,
    kit,
    previousV2,
    kitRoot,
    previousV2ManifestHashes: {[kit.manifest.requirementId]: previousV2.manifestSha256},
    previousV2TreeHashes: {[kit.manifest.requirementId]: previousV2.treeSha256},
  };
}

async function makeCurrentV2KitFixture() {
  const fixture = await makeProjectFixture();
  const kit = await buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime});
  const currentV2 = buildSourceDrivenBranchCurrentV2Files(kit);
  const kitRoot = await writeKitFiles(fixture.root, kit, currentV2.files);
  return {
    ...fixture,
    kit,
    currentV2,
    kitRoot,
    currentV2ManifestHashes: {[kit.manifest.requirementId]: currentV2.manifestSha256},
    currentV2TreeHashes: {[kit.manifest.requirementId]: currentV2.treeSha256},
  };
}

async function makeGeneratorDriftKitFixture() {
  const fixture = await makeProjectFixture();
  const staleKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  const staleKitRoot = await writeKitFiles(fixture.root, staleKit, staleKit.files);
  const generatorPath = path.join(fixture.root, "scripts/build-course-trace-specs.mjs");
  const previousGeneratorSha256 = digest(await readFile(generatorPath));
  const currentGeneratorBytes = Buffer.concat([
    await readFile(generatorPath),
    Buffer.from("\n// generator-drift fixture\n"),
  ]);
  await writeFile(generatorPath, currentGeneratorBytes);
  const currentGeneratorSha256 = digest(currentGeneratorBytes);

  const specPath = path.join(fixture.root, fixture.specFile);
  const currentSpec = JSON.parse(await readFile(specPath, "utf8"));
  assert.equal(currentSpec.sourceBindings.scheduleDerivation.generator.sha256, previousGeneratorSha256);
  currentSpec.sourceBindings.scheduleDerivation.generator.sha256 = currentGeneratorSha256;
  const currentSpecBytes = Buffer.from(`${JSON.stringify(currentSpec, null, 2)}\n`);
  await writeFile(specPath, currentSpecBytes);
  const currentSpecSha256 = digest(currentSpecBytes);

  const indexPath = path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json");
  const currentIndex = JSON.parse(await readFile(indexPath, "utf8"));
  const pilot = currentIndex.pilots.find(({animationId}) => animationId === tiProfile.animationId);
  const indexed = pilot.traceSpecs.filter(({requirementId}) => requirementId === staleKit.manifest.requirementId);
  assert.equal(indexed.length, 1);
  assert.equal(indexed[0].sha256, staleKit.bound.specDocument.sha256);
  indexed[0].sha256 = currentSpecSha256;
  const currentIndexBytes = Buffer.from(`${JSON.stringify(currentIndex, null, 2)}\n`);
  await writeFile(indexPath, currentIndexBytes);
  const currentIndexSha256 = digest(currentIndexBytes);
  const currentKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  return {
    ...fixture,
    staleKit,
    staleKitRoot,
    currentKit,
    previousGeneratorSha256,
    currentGeneratorSha256,
    currentSpecSha256,
    currentIndexSha256,
  };
}

async function makeGeneratorCoverageSchemaDriftKitFixture({mutateHistoricalSpec} = {}) {
  const fixture = await makeProjectFixture();
  const fixtureIndexPath = path.join(
    fixture.root,
    "migrations/course-shell-pilot-trace-spec-index.json",
  );
  const fixtureIndex = JSON.parse(await readFile(fixtureIndexPath, "utf8"));
  const fixturePilot = fixtureIndex.pilots.find(
    ({animationId}) => animationId === tiProfile.animationId,
  );
  const selectedFixtureEntries = fixturePilot.traceSpecs.filter(
    ({file}) => file === fixture.specFile,
  );
  assert.equal(selectedFixtureEntries.length, 1);
  fixturePilot.traceSpecs = selectedFixtureEntries;
  fixturePilot.requirementCount = 1;
  fixturePilot.unresolvedCount = 0;
  fixturePilot.frameAccurateRootReadyCount = 0;
  fixturePilot.naturalScheduleReadyCount = 1;
  await writeFile(fixtureIndexPath, `${JSON.stringify(fixtureIndex, null, 2)}\n`);
  const initialKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  const generatorPath = path.join(fixture.root, "scripts/build-course-trace-specs.mjs");
  const previousGeneratorSha256 = digest(await readFile(generatorPath));
  assert.equal(
    initialKit.bound.specDocument.value.sourceBindings.scheduleDerivation.generator.sha256,
    previousGeneratorSha256,
  );
  assert.deepEqual(
    initialKit.bound.specDocument.value.sourceBindings.fullFrameCoverage.includedPaths,
    SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
  );

  const historicalSpec = structuredClone(initialKit.bound.specDocument.value);
  historicalSpec.sourceBindings.fullFrameCoverage.includedPaths = [
    ...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
  ];
  if (typeof mutateHistoricalSpec === "function") mutateHistoricalSpec(historicalSpec);
  const historicalSpecBytes = Buffer.from(`${JSON.stringify(historicalSpec, null, 2)}\n`);
  const historicalSpecSha256 = digest(historicalSpecBytes);
  const historicalIndex = structuredClone(initialKit.bound.indexDocument.value);
  const historicalPilot = historicalIndex.pilots.find(
    ({animationId}) => animationId === tiProfile.animationId,
  );
  historicalPilot.technicalBindings.coverage.includedPaths = [
    ...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
  ];
  const historicalEntries = historicalPilot.traceSpecs.filter(
    ({requirementId}) => requirementId === initialKit.manifest.requirementId,
  );
  assert.equal(historicalEntries.length, 1);
  historicalEntries[0].sha256 = historicalSpecSha256;
  const historicalIndexBytes = Buffer.from(`${JSON.stringify(historicalIndex, null, 2)}\n`);
  const historicalIndexSha256 = digest(historicalIndexBytes);
  const historicalBound = {
    ...initialKit.bound,
    specDocument: {
      value: historicalSpec,
      bytes: historicalSpecBytes,
      sha256: historicalSpecSha256,
    },
    indexDocument: {
      value: historicalIndex,
      bytes: historicalIndexBytes,
      sha256: historicalIndexSha256,
    },
  };
  const staleKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
    historicalBound,
  });
  const staleKitRoot = await writeKitFiles(fixture.root, staleKit, staleKit.files);

  const currentGeneratorBytes = Buffer.concat([
    await readFile(generatorPath),
    Buffer.from("\n// generator-and-coverage-schema-drift fixture\n"),
  ]);
  await writeFile(generatorPath, currentGeneratorBytes);
  const currentGeneratorSha256 = digest(currentGeneratorBytes);
  const currentSpec = structuredClone(initialKit.bound.specDocument.value);
  currentSpec.sourceBindings.scheduleDerivation.generator.sha256 = currentGeneratorSha256;
  const currentSpecBytes = Buffer.from(`${JSON.stringify(currentSpec, null, 2)}\n`);
  await writeFile(path.join(fixture.root, fixture.specFile), currentSpecBytes);
  const currentSpecSha256 = digest(currentSpecBytes);
  const currentIndex = structuredClone(initialKit.bound.indexDocument.value);
  const currentPilot = currentIndex.pilots.find(
    ({animationId}) => animationId === tiProfile.animationId,
  );
  const currentEntries = currentPilot.traceSpecs.filter(
    ({requirementId}) => requirementId === initialKit.manifest.requirementId,
  );
  assert.equal(currentEntries.length, 1);
  currentEntries[0].sha256 = currentSpecSha256;
  const currentIndexBytes = Buffer.from(`${JSON.stringify(currentIndex, null, 2)}\n`);
  await writeFile(
    path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json"),
    currentIndexBytes,
  );
  const currentIndexSha256 = digest(currentIndexBytes);
  const currentKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  return {
    ...fixture,
    staleKit,
    staleKitRoot,
    currentKit,
    previousGeneratorSha256,
    currentGeneratorSha256,
    historicalSpecSha256,
    historicalIndexSha256,
    currentSpecSha256,
    currentIndexSha256,
  };
}

async function makeIndexOnlyDriftKitFixture() {
  const fixture = await makeProjectFixture();
  const staleKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  const staleKitRoot = await writeKitFiles(fixture.root, staleKit, staleKit.files);
  const indexPath = path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json");
  const currentIndex = JSON.parse(await readFile(indexPath, "utf8"));
  const otherPilot = currentIndex.pilots.find((pilot) =>
    pilot.animationId === "course-g04-l09-gs-002" &&
    pilot.technicalBindings?.manifest?.sha256 &&
    pilot.technicalBindings?.scenarioInventory?.sha256 &&
    pilot.traceSpecs?.[0]?.file
  );
  assert.ok(otherPilot, "fixture index must contain the current GS technical pilot");

  const otherManifestRelative = `migrations/${otherPilot.animationId}/migration.json`;
  const otherInventoryRelative = `migrations/${otherPilot.animationId}/audit/scenario-inventory.json`;
  const otherSpecRelative = otherPilot.traceSpecs[0].file;
  for (const relative of [otherManifestRelative, otherInventoryRelative, otherSpecRelative]) {
    await copyRelative(fixture.root, relative);
  }

  const manifestPath = path.join(fixture.root, otherManifestRelative);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.implementation.rendering = `${manifest.implementation.rendering} (index-only drift fixture)`;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const currentManifestProjectionSha256 = technicalManifestSha256(manifest);
  otherPilot.technicalBindings.manifest.sha256 = currentManifestProjectionSha256;

  const inventoryPath = path.join(fixture.root, otherInventoryRelative);
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  inventory.indexOnlyDriftFixtureRevision = 1;
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
  const currentScenarioInventoryProjectionSha256 = scenarioInventorySha256(inventory);
  otherPilot.technicalBindings.scenarioInventory.sha256 = currentScenarioInventoryProjectionSha256;

  const otherSpecPath = path.join(fixture.root, otherSpecRelative);
  const otherSpec = JSON.parse(await readFile(otherSpecPath, "utf8"));
  otherSpec.indexOnlyDriftFixtureRevision = 1;
  const otherSpecBytes = Buffer.from(`${JSON.stringify(otherSpec, null, 2)}\n`);
  await writeFile(otherSpecPath, otherSpecBytes);
  const currentOtherSpecSha256 = digest(otherSpecBytes);
  otherPilot.traceSpecs[0].sha256 = currentOtherSpecSha256;

  const currentIndexBytes = Buffer.from(`${JSON.stringify(currentIndex, null, 2)}\n`);
  await writeFile(indexPath, currentIndexBytes);
  const currentIndexSha256 = digest(currentIndexBytes);
  const currentKit = await buildSourceDrivenBranchCaptureKit({
    projectRoot: fixture.root,
    specFile: fixture.specFile,
    runtime: fixture.runtime,
  });
  assert.equal(currentKit.bound.specDocument.sha256, staleKit.bound.specDocument.sha256);
  assert.notEqual(currentKit.bound.indexDocument.sha256, staleKit.bound.indexDocument.sha256);
  return {
    ...fixture,
    staleKit,
    staleKitRoot,
    currentKit,
    currentIndexSha256,
    otherPilotAnimationId: otherPilot.animationId,
    otherSpecRelative,
    currentOtherSpecSha256,
    currentManifestProjectionSha256,
    currentScenarioInventoryProjectionSha256,
  };
}

test("argument parser exposes only non-launching scaffold/check switches", () => {
  assert.deepEqual(parseArguments([]), {
    specFiles: [],
    playerApp: "/Applications/Adobe Animate 2021/Players/Flash Player.app",
    check: false,
    archiveCurrentUnsignedTemplate: false,
    previousTraceSpecGeneratorSha256: null,
    help: false,
  });
  assert.deepEqual(parseArguments(["--spec", tiProfile.specs[0].specFile, "--check"]).specFiles, [tiProfile.specs[0].specFile]);
  assert.equal(parseArguments(["--archive-current-unsigned-template"]).archiveCurrentUnsignedTemplate, true);
  const previousGeneratorSha256 = "a".repeat(64);
  assert.equal(parseArguments([
    "--archive-current-unsigned-template",
    "--previous-trace-spec-generator-sha256", previousGeneratorSha256,
  ]).previousTraceSpecGeneratorSha256, previousGeneratorSha256);
  assert.throws(() => parseArguments(["--check", "--archive-current-unsigned-template"]), /mutually exclusive/);
  assert.throws(
    () => parseArguments(["--previous-trace-spec-generator-sha256", previousGeneratorSha256]),
    /requires --archive-current-unsigned-template/,
  );
  assert.throws(
    () => parseArguments(["--archive-current-unsigned-template", "--previous-trace-spec-generator-sha256", "ABC"]),
    /lowercase SHA-256/,
  );
  assert.throws(() => parseArguments(["--launch"]), /Unknown option/);
  assert.throws(() => parseArguments(["--test-only-approved-runtime", "anything"]), /Unknown option/);
  assert.throws(() => parseArguments(["--spec", tiProfile.specs[0].specFile, "--spec", tiProfile.specs[0].specFile]), /duplicate/);
  assert.match(usage(), /never launches a runtime/);
  assert.match(usage(), /IR fixture is explicitly blocked/);
  assert.match(usage(), /--previous-trace-spec-generator-sha256/);
});

test("builder rejects an unapproved Projector and forbids test-only approval at the repository root", async () => {
  const fixture = await makeProjectFixture();
  try {
    const {testOnlyApprovedRuntime, ...unapprovedRuntime} = fixture.runtime;
    await assert.rejects(
      buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: unapprovedRuntime}),
      /source-driven approved Projector runtime is stale or mismatched/,
    );
    await assert.rejects(
      buildSourceDrivenBranchCaptureKit({
        projectRoot: repositoryRoot,
        specFile: fixture.specFile,
        runtime: unapprovedRuntime,
        testOnlyApprovedRuntime,
      }),
      /test-only source-driven runtime approval is forbidden for the repository root/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("source-driven schedule validator rejects seed injection, forcing, operator steps, wrong events, and ES", async () => {
  const expected = tiProfile.specs[0];
  const original = JSON.parse(await readFile(path.join(repositoryRoot, expected.specFile), "utf8"));
  assert.doesNotThrow(() => validateSourceDrivenSpec(original, tiProfile, expected));
  const cases = [
    ["seed injection", (value) => { value.sourceBindings.scheduleDerivation.naturalRandomPolicy.seedInjectionAllowed = true; }],
    ["forced branch", (value) => { value.sourceBindings.scheduleDerivation.naturalRandomPolicy.forcedBranchAllowed = true; }],
    ["operator action", (value) => { value.schedule.orderedSteps.push({order: 1}); }],
    ["wrong event", (value) => { value.schedule.sourceDrivenEvents[1].trigger.frame = 6; }],
    ["ES", (value) => { value.identity.language = "es"; }],
  ];
  for (const [label, mutate] of cases) {
    const candidate = structuredClone(original);
    mutate(candidate);
    assert.throws(() => validateSourceDrivenSpec(candidate, tiProfile, expected), undefined, label);
  }
});

test("builder creates deterministic exact v3 causal templates in a temp root and keeps IR capture-ineligible", async () => {
  const fixture = await makeProjectFixture();
  try {
    const first = await buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime});
    const second = await buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime});
    assert.deepEqual([...first.files].map(([file, descriptor]) => [file, descriptor.mode, digest(descriptor.content)]), [...second.files].map(([file, descriptor]) => [file, descriptor.mode, digest(descriptor.content)]));
    const kit = first;
    const contract = kit.manifest.templateContract;
    assert.equal(kit.manifest.status, SOURCE_DRIVEN_BRANCH_TEMPLATE_STATUS);
    assert.equal(kit.manifest.scheduleContract.seedInjectionAllowed, false);
    assert.equal(kit.manifest.scheduleContract.forcedBranchAllowed, false);
    assert.equal(kit.manifest.scheduleContract.operatorActionsAllowed, 0);
    assert.equal(kit.manifest.authority.runtimeLaunchedByFactory, false);
    assert.equal(kit.manifest.authority.framesCapturedByFactory, 0);
    assert.equal(kit.manifest.authority.humanReviewRecorded, false);
    assert.equal(kit.manifest.authority.ownerReviewRecorded, false);
    assert.equal(kit.files.has("launch-sandboxed.sh"), false);
    assert.equal(kit.files.size, 27);
    assert.equal(contract.schemaVersion, 3);
    assert.equal(contract.candidateInputContract.module.file, "scripts/source-driven-branch-capture-contracts.mjs");
    assert.equal(contract.candidateInputContract.module.sha256, digest(await readFile(path.join(fixture.root, "scripts/source-driven-branch-capture-contracts.mjs"))));
    assert.equal(contract.candidateInputContract.export, "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT");
    assert.equal(contract.candidateInputContract.schemaVersion, 2);
    assert.equal(contract.candidateInputContract.sha256, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256);
    assert.equal(contract.candidateInputContract.sha256, digest(Buffer.from(canonicalJson(SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT))));
    assert.deepEqual(contract.candidateInputContract.exact, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT);
    assert.deepEqual(contract.files.map(({file}) => file).sort(), Object.values(SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.inputTemplatePaths).filter((file) => file !== "frames").sort());
    assert.deepEqual(contract.randomTrials, {acceptedSessionNaturalAttemptCount: 1, acceptedTrialCount: 1, acceptedTrialMustBeOnlyRecord: true, firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256"});
    assert.deepEqual(contract.sourceEvents.map(({causalPredecessorRecordSha256From}) => causalPredecessorRecordSha256From), [
      "randomTrialLog.finalRecordSha256", "frameStateLog.frame-0004.recordSha256", "frameStateLog.frame-0141.recordSha256",
    ]);
    assert.deepEqual(contract.frameStates.precedingSourceEventRecordSha256AtFrames, {
      "1": "sourceEventLog.event-1.recordSha256",
      "5": "sourceEventLog.event-2.recordSha256",
      "142": "sourceEventLog.event-3.recordSha256",
    });
    assert.equal(contract.unifiedOperations.totalRecordCount, 145);
    assert.equal(contract.unifiedOperations.operatorDispatchCount, 0);
    assert.equal(contract.unifiedOperations.firstRecordPreviousRecordSha256From, "randomTrialLog.finalRecordSha256");
    assert.equal(contract.unifiedOperations.everyRecordReferencesExactlyOneRawEventOrFrameRecord, true);
    assert.deepEqual(contract.authority, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority);
    assert.equal(contract.authority.candidateOnly, true);
    const capturePlan = JSON.parse(kit.files.get("capture-plan.template.json").content);
    assert.deepEqual(capturePlan.capturedFrames, []);
    assert.equal(capturePlan.randomTrialLog.expectedCount, 1);
    assert.equal(capturePlan.randomTrialLog.acceptedSessionNaturalAttemptCount, 1);
    const environment = JSON.parse(kit.files.get("templates/environment-isolation-receipt.template.json").content);
    const launch = JSON.parse(kit.files.get("templates/adapter-launch-receipt.template.json").content);
    const toolchain = JSON.parse(kit.files.get("templates/runtime-toolchain-receipt.template.json").content);
    const adapter = JSON.parse(kit.files.get("templates/adapter-entry-log.schema.template.jsonl").content);
    const random = JSON.parse(kit.files.get("templates/random-trial-log.schema.template.jsonl").content);
    const events = JSON.parse(kit.files.get("templates/source-driven-event-log.schema.template.jsonl").content);
    const frames = JSON.parse(kit.files.get("templates/frame-state-log.schema.template.jsonl").content);
    const operations = JSON.parse(kit.files.get("templates/operation-log.schema.template.jsonl").content);
    const attestation = JSON.parse(kit.files.get("templates/session-attestation.template.json").content);
    const captureManifest = JSON.parse(kit.files.get("templates/capture-manifest.template.json").content);
    const fields = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.fieldContracts;
    const recordFields = (specific) => [...fields.commonRecord, ...specific];
    assertExactKeys(environment, fields.environmentIsolationReceipt, "environment template must itself be the strict preparer input shape");
    assert.equal(environment.evidenceType, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.environmentIsolationReceipt);
    assertExactKeys(environment.operatingSystem, ["productVersion", "buildVersion", "architecture"]);
    assertExactKeys(environment.account, ["userName", "uid", "homeDirectory", "realOsAccount", "dedicatedToCapture"]);
    assertExactKeys(environment.profile, ["identifier", "createdForSession", "reused", "normalSharedObjectReadWriteSemantics", "resetOrDestroyedAfterSession"]);
    assertExactKeys(environment.preflight, ["runningFlashProcessCount", "sharedObjectFileCount", "unexpectedFiles"]);
    assertExactKeys(environment.postflight, ["unexpectedWrites", "unexpectedNetworkEvents", "profileResetOrDestroyed"]);
    assertExactKeys(environment.operator, fields.namedHuman);
    assert.equal(environment.receiptSha256, null);
    assertExactKeys(launch, fields.launchReceipt, "launch template must itself be the strict preparer input shape");
    assert.equal(launch.evidenceType, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.launchReceipt);
    assertExactKeys(launch.captureKit, ["file", "sha256"]);
    assertExactKeys(launch.environmentIsolation, ["file", "sha256"]);
    assertExactKeys(launch.sandboxProfile, ["file", "sha256"]);
    assertExactKeys(launch.runtime, ["runtimeId", "name", "version", "executableSha256"]);
    assertExactKeys(launch.adapter, ["file", "sha256", "readOnly", "minimalAdapterOnly"]);
    assertExactKeys(launch.projectorStart, ["executablePath", "processId", "startedAt", "launchedByNamedHuman", "launchedByCandidatePreparer"]);
    assertExactKeys(launch.adapterOpen, ["file", "sha256", "openedAt", "playerWindowObserved", "sandboxProfileApplied", "networkDenied"]);
    assertExactKeys(launch.operator, fields.namedHuman);
    assert.equal(launch.receiptSha256, null);
    assertExactKeys(toolchain, fields.toolchainReceipt, "toolchain template must itself be the strict preparer input shape");
    assert.equal(toolchain.evidenceType, SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.evidenceTypes.toolchainReceipt);
    assertExactKeys(toolchain.runtime, ["runtimeId", "name", "version"]);
    assertExactKeys(toolchain.captureSessionBinding, [
      "sessionId", "traceSpecSha256", "traceSpecIndexSha256", "sourceSwfSha256", "captureKitManifestSha256",
      "sandboxProfileSha256", "environmentIsolationReceiptSha256", "launchReceiptSha256",
    ]);
    assert.equal(toolchain.identityArtifacts.length, 1);
    assertExactKeys(toolchain.identityArtifacts[0], ["kind", "file", "sha256"]);
    assertExactKeys(attestation, fields.sessionAttestation, "session template must itself be the strict preparer input shape");
    assertExactKeys(captureManifest, fields.captureManifest, "capture template must itself be the strict preparer input shape");
    assertExactKeys(adapter, recordFields(fields.adapterEntryRecord), "adapter JSONL template must itself be one strict record skeleton");
    assertExactKeys(random, recordFields(fields.randomTrialRecord), "random JSONL template must itself be one strict record skeleton");
    assertExactKeys(events, recordFields(fields.sourceEventRecord), "event JSONL template must itself be one strict record skeleton");
    assertExactKeys(frames, recordFields(fields.frameStateRecord), "frame JSONL template must itself be one strict record skeleton");
    assertExactKeys(operations, recordFields(fields.operationRecord), "operation JSONL template must itself be one strict record skeleton");
    for (const record of [adapter, random, events, frames, operations]) assertExactKeys(record.operator, fields.namedHuman);
    assert.equal(adapter.previousRecordSha256, null);
    assert.equal(random.attemptId, "attempt-0001");
    assert.equal(random.previousRecordSha256, null);
    assert.equal(events.causalPredecessorRecordSha256, null);
    assert.equal(frames.precedingSourceEventRecordSha256, null);
    assert.equal(operations.previousRecordSha256, null);
    assertExactKeys(attestation.adapterEntry, [
      "fixtureManifestSha256", "adapterHostSha256", "childSwfSha256", "childLoadTrigger", "childLoadTriggerCount",
      "traceStartedAfterOnLoadInit", "beginHandoff", "beginHandoffCount", "rootFrame", "frameDomainId", "localFrame",
      "operatorActionsAfterTraceStart", "directSeekUsed", "frameStepUsed", "completeOriginalCourseShellClaimed",
    ]);
    assertExactKeys(attestation.naturalRandomObservation, [
      "sourceCall", "allowedMethod", "identitySeed", "identitySeedInjectedIntoAvm1", "seedInjected", "forcedBranch",
      "randomOverridden", "branchVariableWrittenByAdapter", "attempts", "acceptedAttemptId",
    ]);
    assertExactKeys(attestation.naturalRandomObservation.attempts[0], ["attemptId", "sequence", "observedOutcome", "selectedInstanceName", "selectedObjectId", "disposition"]);
    assertExactKeys(attestation.frameSet, ["algorithm", "frameCount", "frames", "sha256"]);
    assert.equal(attestation.frameSet.frames.length, 142);
    assertExactKeys(attestation.frameSet.frames[0], ["frame", "file", "sha256"]);
    assert.equal(captureManifest.frames.length, 142);
    assertExactKeys(captureManifest.frames[0], ["frame", "file", "sha256", "width", "height", "stateRecordSha256"]);
    assert.deepEqual(attestation.masterEvidenceChain, captureManifest.masterEvidenceChain);
    assert.equal(attestation.masterEvidenceChain.root.sha256, null);
    assert.equal(attestation.masterEvidenceChain.final.sha256, null);
    assert.equal(attestation.masterEvidenceChain.intermediates.length, 10);
    assert.ok(attestation.masterEvidenceChain.intermediates.every(({sha256}) => sha256 === null));
    assert.match(kit.files.get("OPERATOR_CARD.md").content.toString(), /exactly one natural random attempt/);
    assert.match(kit.files.get("OPERATOR_CARD.md").content.toString(), /pending candidate/);
    assert.equal(irProfile.captureEligible, false);
    const unspecifiedEligibility = structuredClone(tiProfile);
    delete unspecifiedEligibility.captureEligible;
    await assert.rejects(
      buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: fixture.specFile, runtime: fixture.runtime, profiles: [unspecifiedEligibility]}),
      /not explicitly capture-eligible/,
    );
    await assert.rejects(
      buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: irProfile.specs[0].specFile, runtime: fixture.runtime}),
      /capture kit blocked/,
    );
    await assert.rejects(
      buildSourceDrivenBranchCaptureKit({projectRoot: fixture.root, specFile: "migrations/course-g03-l06-ti-001/audit/trace-specs/req-sprite-21-sound-0-es.json", runtime: fixture.runtime}),
      /not one of the four allowlisted EN/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffold/check is byte-, mode-, tree-, and template-fail-closed", async () => {
  const fixture = await makeProjectFixture();
  try {
    const [created] = await scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime});
    assert.equal(created.status, "verified-unsigned-empty-template-only");
    const kitRoot = path.join(fixture.root, DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT, tiProfile.animationId, "req-sprite-21-sound-0-en");
    const child = path.join(kitRoot, `runtime-tree/${tiProfile.childRuntimePath}`);
    assert.equal((await stat(child)).mode & 0o777, 0o444);
    await scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, check: true});

    const template = path.join(kitRoot, "capture-plan.template.json");
    await chmod(template, 0o644);
    await assert.rejects(scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, check: true}), /mode drift/);
    await chmod(template, 0o444);

    const extra = path.join(kitRoot, "unexpected.txt");
    await writeFile(extra, "unexpected\n");
    await assert.rejects(scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, check: true}), /file set/);
    await rm(extra);

    await chmod(template, 0o644);
    await writeFile(template, "filled\n");
    await chmod(template, 0o444);
    await assert.rejects(scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, check: true}), /stale, edited, or filled/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffold check rejects a byte-identical hard-linked kit file", async () => {
  const fixture = await makeProjectFixture();
  try {
    await scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime});
    const kitRoot = path.join(fixture.root, DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT, tiProfile.animationId, "req-sprite-21-sound-0-en");
    await link(path.join(kitRoot, "README.md"), path.join(fixture.root, "readme-hardlink-alias.md"));
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, check: true}),
      /must not be hard-linked/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffold rollback preserves a concurrent foreign subdirectory and sentinel", async () => {
  const fixture = await makeProjectFixture();
  let kitRoot;
  let sentinel;
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        transactionHooks: {
          afterKitRootCreated: async ({kitRoot: createdRoot}) => {
            kitRoot = createdRoot;
            const foreign = path.join(createdRoot, "bindings");
            sentinel = path.join(foreign, "foreign-sentinel.txt");
            await mkdir(foreign, {recursive: false});
            await writeFile(sentinel, "do not delete\n");
          },
        },
      }),
      /EEXIST|file already exists/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "do not delete\n");
    assert.deepEqual(await readdir(path.dirname(sentinel)), ["foreign-sentinel.txt"]);
    assert.equal((await lstat(kitRoot)).isDirectory(), true);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffold rollback never deletes a concurrent kit-root replacement", async () => {
  const fixture = await makeProjectFixture();
  let displaced;
  let sentinel;
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        transactionHooks: {
          afterKitRootCreated: async ({kitRoot}) => {
            displaced = `${kitRoot}.owned-but-displaced`;
            sentinel = path.join(kitRoot, "replacement-sentinel.txt");
            await rename(kitRoot, displaced);
            await mkdir(kitRoot, {recursive: false});
            await writeFile(sentinel, "foreign replacement\n");
          },
        },
      }),
      /identity changed during the transaction/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign replacement\n");
    assert.deepEqual(await readdir(path.dirname(sentinel)), ["replacement-sentinel.txt"]);
    assert.deepEqual(await readdir(displaced), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("scaffold rollback removes only its own unchanged partial kit", async () => {
  const fixture = await makeProjectFixture();
  let kitRoot;
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        transactionHooks: {
          afterKitFileWritten: async ({kitRoot: createdRoot}) => {
            kitRoot = createdRoot;
            throw new Error("injected scaffold rollback");
          },
        },
      }),
      /injected scaffold rollback/,
    );
    await assert.rejects(() => lstat(kitRoot), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current verifies and atomically preserves the pinned legacy-v1 tree with full mode integrity", async () => {
  const fixture = await makeLegacyKitFixture();
  try {
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
      legacyManifestHashes: fixture.legacyManifestHashes,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "legacy-v1-23-file");
    assert.equal(archived.archivedFileCount, 23);
    await assert.rejects(lstat(fixture.kitRoot), /ENOENT/);
    assert.equal((await lstat(archived.archiveRoot)).isDirectory(), true);
    const recordBytes = await readFile(archived.archiveRecord);
    const record = JSON.parse(recordBytes);
    const integrity = JSON.parse(await readFile(archived.archiveIntegrity));
    assert.equal(record.templateVariant, "legacy-v1-23-file");
    assert.equal(record.bindings.archivedCaptureKitManifestSha256, fixture.legacy.manifestSha256);
    assert.equal(record.authority.runtimeLaunched, false);
    assert.equal(record.authority.framesCaptured, 0);
    assert.equal(integrity.archiveRecord.sha256, digest(recordBytes));
    assert.equal(integrity.archivedKit.algorithm, SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM);
    assert.equal(integrity.archivedKit.fileCount, 23);
    assert.equal(integrity.archivedKit.sha256, digest(Buffer.from(canonicalJson(integrity.archivedKit.inventory))));
    assert.ok(integrity.archivedKit.inventory.every(({mode}) => mode === 0o444));
    assert.equal((await stat(archived.archiveRecord)).mode & 0o777, 0o444);
    assert.equal((await stat(path.join(archived.archivedKitRoot, `runtime-tree/${tiProfile.childRuntimePath}`))).mode & 0o777, 0o444);
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        legacyManifestHashes: fixture.legacyManifestHashes,
      }),
      /kit is missing/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current labels the current temp-root contract as causal v3", async () => {
  const fixture = await makeProjectFixture();
  try {
    await scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime});
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
    });
    assert.equal(archived.templateVariant, "current-v3-causal-capture-contract");
    assert.equal(archived.archivedFileCount, 27);
    const record = JSON.parse(await readFile(archived.archiveRecord));
    assert.equal(record.templateVariant, "current-v3-causal-capture-contract");
    assert.equal(record.bindings.archivedCaptureKitManifestSha256, record.bindings.currentSchemaCaptureKitManifestSha256);
    assert.equal(record.authority.runtimeLaunched, false);
    assert.equal(record.authority.strictAcceptanceEffect, false);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current proves generator-only trace-spec drift, archives the exact stale empty tree, and permits a separate current scaffold", async () => {
  const fixture = await makeGeneratorDriftKitFixture();
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        check: true,
      }),
      /stale, edited, or filled/,
    );
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
      previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "current-v3-causal-capture-contract");
    assert.equal(archived.traceSpecSha256, fixture.staleKit.bound.specDocument.sha256);
    assert.equal(archived.replacementTraceSpecSha256, fixture.currentSpecSha256);
    assert.equal(archived.traceSpecIndexSha256, fixture.staleKit.bound.indexDocument.sha256);
    assert.equal(archived.replacementTraceSpecIndexSha256, fixture.currentIndexSha256);
    await assert.rejects(lstat(fixture.staleKitRoot), /ENOENT/);
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec.json")),
      fixture.staleKit.bound.specDocument.bytes,
    );
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec-index.json")),
      fixture.staleKit.bound.indexDocument.bytes,
    );
    const record = JSON.parse(await readFile(archived.archiveRecord, "utf8"));
    assert.equal(record.schemaVersion, 2);
    assert.equal(record.bindings.traceSpec.sha256, fixture.staleKit.bound.specDocument.sha256);
    assert.equal(record.bindings.traceSpecIndex.sha256, fixture.staleKit.bound.indexDocument.sha256);
    assert.equal(
      record.bindings.archivedCaptureKitManifestSha256,
      digest(fixture.staleKit.files.get("kit-manifest.json").content),
    );
    assert.equal(
      record.bindings.currentSchemaCaptureKitManifestSha256,
      digest(fixture.currentKit.files.get("kit-manifest.json").content),
    );
    assert.notEqual(
      record.bindings.archivedCaptureKitManifestSha256,
      record.bindings.currentSchemaCaptureKitManifestSha256,
    );
    const proof = record.traceSpecDriftProof;
    assert.deepEqual(proof, archived.traceSpecDriftProof);
    assert.equal(proof.path, "sourceBindings.scheduleDerivation.generator.sha256");
    assert.equal(proof.previousGeneratorSha256, fixture.previousGeneratorSha256);
    assert.equal(proof.currentGeneratorSha256, fixture.currentGeneratorSha256);
    assert.equal(proof.reconstructedPreviousTraceSpecSha256, fixture.staleKit.bound.specDocument.sha256);
    assert.equal(proof.currentTraceSpecSha256, fixture.currentSpecSha256);
    assert.equal(proof.previousTraceSpecIndexSha256, fixture.staleKit.bound.indexDocument.sha256);
    assert.equal(proof.currentTraceSpecIndexSha256, fixture.currentIndexSha256);
    assert.equal(proof.allOtherSelectedTraceSpecBytesReconstructedFromCurrent, true);
    assert.equal(
      proof.indexDrift.kind,
      "exact-reconstructed-generator-output-trace-spec-and-index-cascade-v2",
    );
    assert.deepEqual(proof.indexDrift.changedTechnicalBindings, []);
    assert.deepEqual(proof.indexDrift.changedTraceSpecs, [{
      animationId: tiProfile.animationId,
      requirementId: fixture.staleKit.manifest.requirementId,
      file: fixture.specFile,
      previousSha256: fixture.staleKit.bound.specDocument.sha256,
      currentSha256: fixture.currentSpecSha256,
      allowlistedTransforms: ["trace-spec-generator-sha256"],
      previousInventoryFileSha256AtSpecGeneration:
        fixture.currentKit.bound.specDocument.value.sourceBindings
          .coverageInventoryBinding.fileSha256AtSpecGeneration,
      historicalInventoryFileWitness: null,
    }]);
    assert.equal(proof.indexDrift.reconstructionBundle.entryCount, 1);
    assert.equal(
      proof.indexDrift.reconstructionBundle.encoding,
      "gzip-base64-canonical-json-current-trace-spec-snapshots-v1",
    );
    assert.equal(record.authority.runtimeLaunched, false);
    assert.equal(record.authority.framesCaptured, 0);
    assert.equal(record.authority.humanReviewRecorded, false);
    assert.equal(record.authority.ownerReviewRecorded, false);

    const [replacement] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
    });
    assert.equal(replacement.status, "verified-unsigned-empty-template-only");
    assert.equal(replacement.traceSpecSha256, fixture.currentSpecSha256);
    assert.equal(replacement.traceSpecIndexSha256, fixture.currentIndexSha256);
    await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      check: true,
    });
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current proves only the deterministic coverage-v1 to coverage-v2 descriptor upgrade alongside generator drift", async () => {
  const fixture = await makeGeneratorCoverageSchemaDriftKitFixture();
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        check: true,
      }),
      /stale, edited, or filled/,
    );
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
      previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "current-v3-causal-capture-contract");
    assert.equal(archived.traceSpecSha256, fixture.historicalSpecSha256);
    assert.equal(archived.replacementTraceSpecSha256, fixture.currentSpecSha256);
    assert.equal(archived.traceSpecIndexSha256, fixture.historicalIndexSha256);
    assert.equal(archived.replacementTraceSpecIndexSha256, fixture.currentIndexSha256);
    const proof = archived.traceSpecDriftProof;
    assert.equal(
      proof.kind,
      "allowlisted-generator-and-coverage-projection-schema-upgrade",
    );
    assert.equal(
      proof.path,
      "sourceBindings.scheduleDerivation.generator.sha256",
    );
    assert.deepEqual(proof.coverageProjectionSchemaUpgrade, {
      kind: "deterministic-trace-coverage-included-paths-v1-to-v2",
      path: "sourceBindings.fullFrameCoverage.includedPaths",
      projection: "help-math-trace-coverage-identity-v1",
      previousIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
      currentIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS],
      previousProjectionSha256:
        fixture.staleKit.bound.specDocument.value.sourceBindings.fullFrameCoverage.sha256,
      currentProjectionSha256:
        fixture.currentKit.bound.specDocument.value.sourceBindings.fullFrameCoverage.sha256,
      projectionSha256Unchanged: true,
      allOtherTraceSpecBytesReconstructedFromCurrent: true,
    });
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec.json")),
      fixture.staleKit.bound.specDocument.bytes,
    );
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec-index.json")),
      fixture.staleKit.bound.indexDocument.bytes,
    );
    const record = JSON.parse(await readFile(archived.archiveRecord, "utf8"));
    assert.equal(record.schemaVersion, 2);
    assert.deepEqual(record.traceSpecDriftProof, proof);
    assert.equal(record.authority.runtimeLaunched, false);
    assert.equal(record.authority.framesCaptured, 0);
    assert.equal(record.authority.humanIdentityRecorded, false);
    assert.equal(record.authority.humanReviewRecorded, false);
    assert.equal(record.authority.ownerReviewRecorded, false);
    assert.equal(record.authority.strictAcceptanceEffect, false);
    assert.equal(record.authority.migrationStatusChanged, false);

    const [replacement] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
    });
    assert.equal(replacement.traceSpecSha256, fixture.currentSpecSha256);
    assert.equal(replacement.traceSpecIndexSha256, fixture.currentIndexSha256);
    await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      check: true,
    });
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("coverage projection schema-upgrade archival rejects every non-allowlisted historical byte", async (t) => {
  const cases = [
    [
      "coverage included-path extension",
      (spec) => {
        spec.sourceBindings.fullFrameCoverage.includedPaths.push("unexpectedField");
      },
    ],
    [
      "coverage descriptor semantic drift",
      (spec) => {
        spec.sourceBindings.fullFrameCoverage.hashMode = "tampered-encoding";
      },
    ],
    [
      "unrelated trace-spec semantic drift",
      (spec) => {
        spec.executionEvidence.status = "tampered-execution-status";
      },
    ],
  ];
  for (const [label, mutateHistoricalSpec] of cases) {
    await t.test(label, async () => {
      const fixture = await makeGeneratorCoverageSchemaDriftKitFixture({
        mutateHistoricalSpec,
      });
      try {
        await assert.rejects(
          scaffoldSourceDrivenBranchCaptureKits({
            projectRoot: fixture.root,
            specFiles: [fixture.specFile],
            runtime: fixture.runtime,
            archiveCurrentUnsignedTemplate: true,
            previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
          }),
          /does not reconstruct the active kit trace specification/,
        );
        assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("coverage projection schema-upgrade archive rolls back the exact stale tree after an interrupted move", async () => {
  const fixture = await makeGeneratorCoverageSchemaDriftKitFixture();
  const activeManifestPath = path.join(fixture.staleKitRoot, "kit-manifest.json");
  const activeManifestSha256 = digest(await readFile(activeManifestPath));
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
        transactionHooks: {
          afterKitMove: async () => {
            throw new Error("injected coverage-schema archive rollback");
          },
        },
      }),
      /injected coverage-schema archive rollback/,
    );
    assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    assert.equal(digest(await readFile(activeManifestPath)), activeManifestSha256);
    assert.equal((await stat(activeManifestPath)).mode & 0o777, 0o444);
    const archiveParent = path.join(
      fixture.root,
      DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT,
      "_stale-unsigned-template-archive",
      fixture.staleKit.manifest.animationId,
      safeRequirementId(fixture.staleKit.manifest.requirementId),
    );
    assert.deepEqual(await readdir(archiveParent), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current proves selected-spec-current global index-only drift, preserves the exact empty tree, and permits current res scaffolding", async () => {
  const fixture = await makeIndexOnlyDriftKitFixture();
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        check: true,
      }),
      /stale, edited, or filled/,
    );
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "current-v3-causal-capture-contract");
    assert.equal(archived.traceSpecSha256, fixture.staleKit.bound.specDocument.sha256);
    assert.equal(archived.replacementTraceSpecSha256, fixture.currentKit.bound.specDocument.sha256);
    assert.equal(archived.traceSpecSha256, archived.replacementTraceSpecSha256);
    assert.equal(archived.traceSpecIndexSha256, fixture.staleKit.bound.indexDocument.sha256);
    assert.equal(archived.replacementTraceSpecIndexSha256, fixture.currentIndexSha256);
    assert.equal(archived.traceSpecDriftProof, null);
    await assert.rejects(lstat(fixture.staleKitRoot), /ENOENT/);
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec.json")),
      fixture.staleKit.bound.specDocument.bytes,
    );
    assert.deepEqual(
      await readFile(path.join(archived.archivedKitRoot, "bindings/trace-spec-index.json")),
      fixture.staleKit.bound.indexDocument.bytes,
    );
    const record = JSON.parse(await readFile(archived.archiveRecord, "utf8"));
    assert.equal(record.schemaVersion, 3);
    assert.equal(record.traceSpecDriftProof, undefined);
    const proof = record.traceSpecIndexDriftProof;
    assert.deepEqual(proof, archived.traceSpecIndexDriftProof);
    assert.equal(proof.kind, "selected-trace-spec-current-global-index-only-drift");
    assert.deepEqual(proof.selectedTraceSpec, {
      file: fixture.specFile,
      sha256: fixture.staleKit.bound.specDocument.sha256,
      bytesUnchanged: true,
      indexEntryUnchanged: true,
    });
    assert.equal(proof.previousTraceSpecIndexSha256, fixture.staleKit.bound.indexDocument.sha256);
    assert.equal(proof.currentTraceSpecIndexSha256, fixture.currentIndexSha256);
    assert.equal(proof.selectedPilotCanonicalJsonUnchanged, true);
    assert.equal(proof.topLevelAndStructureCanonicalJsonUnchanged, true);
    assert.deepEqual(
      new Set(proof.indexDrift.changedOtherPilotBindings.map(({binding}) => binding)),
      new Set([
        "technicalBindings.manifest.sha256",
        "technicalBindings.scenarioInventory.sha256",
        "traceSpecs[].sha256",
      ]),
    );
    assert.ok(proof.indexDrift.changedOtherPilotBindings.every(({animationId}) => animationId === fixture.otherPilotAnimationId));
    assert.equal(record.authority.runtimeLaunched, false);
    assert.equal(record.authority.framesCaptured, 0);
    assert.equal(record.authority.humanIdentityRecorded, false);
    assert.equal(record.authority.humanReviewRecorded, false);
    assert.equal(record.authority.ownerReviewRecorded, false);
    assert.equal(record.authority.strictAcceptanceEffect, false);
    assert.equal(record.authority.migrationStatusChanged, false);

    const [replacement] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
    });
    assert.equal(replacement.traceSpecSha256, fixture.staleKit.bound.specDocument.sha256);
    assert.equal(replacement.traceSpecIndexSha256, fixture.currentIndexSha256);
    await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      check: true,
    });
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("index-only archival fails closed for witness misuse, selected-pilot drift, disallowed other-pilot drift, tampering, and filled templates", async (t) => {
  await t.test("generator witness is forbidden when selected spec remains current", async () => {
    const fixture = await makeIndexOnlyDriftKitFixture();
    try {
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: "a".repeat(64),
        }),
        /must be omitted when the active selected trace specification is current/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("selected pilot cannot drift even when selected requirement hash is unchanged", async () => {
    const fixture = await makeIndexOnlyDriftKitFixture();
    try {
      const indexPath = path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json");
      const index = JSON.parse(await readFile(indexPath, "utf8"));
      const selectedPilot = index.pilots.find(({animationId}) => animationId === tiProfile.animationId);
      const otherSelectedEntry = selectedPilot.traceSpecs.find(({requirementId}) => requirementId !== fixture.staleKit.manifest.requirementId);
      otherSelectedEntry.sha256 = "c".repeat(64);
      await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
        }),
        /selected pilot must remain byte-semantically current/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("other-pilot non-SHA semantic drift is rejected", async () => {
    const fixture = await makeIndexOnlyDriftKitFixture();
    try {
      const indexPath = path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json");
      const index = JSON.parse(await readFile(indexPath, "utf8"));
      const otherPilot = index.pilots.find(({animationId}) => animationId === fixture.otherPilotAnimationId);
      otherPilot.traceSpecs[0].status = "tampered-status";
      await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
        }),
        /differs outside approved technical\/spec SHA-256 fields/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("embedded historical index bytes remain hash-bound", async () => {
    const fixture = await makeIndexOnlyDriftKitFixture();
    try {
      const embedded = path.join(fixture.staleKitRoot, "bindings/trace-spec-index.json");
      await chmod(embedded, 0o644);
      await writeFile(embedded, "{}\n");
      await chmod(embedded, 0o444);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
        }),
        /embedded trace-spec index SHA-256 differs/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("filled template cannot be archived", async () => {
    const fixture = await makeIndexOnlyDriftKitFixture();
    try {
      const template = path.join(fixture.staleKitRoot, "capture-plan.template.json");
      await chmod(template, 0o644);
      await writeFile(template, "{\"filled\":true}\n");
      await chmod(template, 0o444);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
        }),
        /stale, edited, or filled|neither current-v3|expected manifest reconstruction does not match its explicit pin/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("generator-drift archival fails closed without an exact witness or exact empty historical bytes", async (t) => {
  await t.test("missing witness", async () => {
    const fixture = await makeGeneratorDriftKitFixture();
    try {
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
        }),
        /previous-trace-spec-generator-sha256 is required/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("incorrect witness", async () => {
    const fixture = await makeGeneratorDriftKitFixture();
    try {
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: "b".repeat(64),
        }),
        /does not reconstruct the active kit trace specification/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("embedded historical index byte drift", async () => {
    const fixture = await makeGeneratorDriftKitFixture();
    try {
      const indexPath = path.join(fixture.staleKitRoot, "bindings/trace-spec-index.json");
      await chmod(indexPath, 0o644);
      await writeFile(indexPath, "{}\n");
      await chmod(indexPath, 0o444);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
        }),
        /embedded trace-spec index SHA-256 differs/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("filled template", async () => {
    const fixture = await makeGeneratorDriftKitFixture();
    try {
      const template = path.join(fixture.staleKitRoot, "capture-plan.template.json");
      await chmod(template, 0o644);
      await writeFile(template, "{\"filled\":true}\n");
      await chmod(template, 0o444);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({
          projectRoot: fixture.root,
          specFiles: [fixture.specFile],
          runtime: fixture.runtime,
          archiveCurrentUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: fixture.previousGeneratorSha256,
        }),
        /stale, edited, or filled|neither current-v3|legacy-v1 expected manifest reconstruction/,
      );
      assert.equal((await lstat(fixture.staleKitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("generator-drift witness is rejected for an already-current empty kit", async () => {
  const fixture = await makeProjectFixture();
  try {
    await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
    });
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        previousTraceSpecGeneratorSha256: "a".repeat(64),
      }),
      /must be omitted when the active kit trace specification is current/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current strictly identifies and atomically preserves the pinned previous-v2 27-file tree", async () => {
  const fixture = await makePreviousV2KitFixture();
  try {
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
      previousV2ManifestHashes: fixture.previousV2ManifestHashes,
      previousV2TreeHashes: fixture.previousV2TreeHashes,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "previous-v2-27-file-pre-candidate-contract-alignment");
    assert.equal(archived.archivedFileCount, 27);
    assert.equal(archived.archivedTreeSha256, fixture.previousV2.treeSha256);
    await assert.rejects(lstat(fixture.kitRoot), /ENOENT/);
    const recordBytes = await readFile(archived.archiveRecord);
    const record = JSON.parse(recordBytes);
    const integrity = JSON.parse(await readFile(archived.archiveIntegrity));
    assert.equal(record.templateVariant, "previous-v2-27-file-pre-candidate-contract-alignment");
    assert.equal(record.bindings.archivedCaptureKitManifestSha256, fixture.previousV2.manifestSha256);
    assert.equal(record.archivedTree.sha256, fixture.previousV2.treeSha256);
    assert.equal(integrity.archiveRecord.sha256, digest(recordBytes));
    assert.equal(integrity.archivedKit.fileCount, 27);
    assert.equal(integrity.archivedKit.sha256, fixture.previousV2.treeSha256);
    assert.deepEqual(integrity.archivedKit.inventory, fixture.previousV2.inventory);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current strictly identifies and atomically preserves the archive-derived current-v2 27-file tree", async () => {
  const fixture = await makeCurrentV2KitFixture();
  try {
    const [archived] = await scaffoldSourceDrivenBranchCaptureKits({
      projectRoot: fixture.root,
      specFiles: [fixture.specFile],
      runtime: fixture.runtime,
      archiveCurrentUnsignedTemplate: true,
      currentV2ManifestHashes: fixture.currentV2ManifestHashes,
      currentV2TreeHashes: fixture.currentV2TreeHashes,
    });
    assert.equal(archived.status, "archived-current-unsigned-template-only");
    assert.equal(archived.templateVariant, "current-v2-complete-capture-contract");
    assert.equal(archived.archivedFileCount, 27);
    assert.equal(archived.archivedTreeSha256, fixture.currentV2.treeSha256);
    await assert.rejects(lstat(fixture.kitRoot), /ENOENT/);
    const recordBytes = await readFile(archived.archiveRecord);
    const record = JSON.parse(recordBytes);
    const integrity = JSON.parse(await readFile(archived.archiveIntegrity));
    assert.equal(record.templateVariant, "current-v2-complete-capture-contract");
    assert.equal(record.bindings.archivedCaptureKitManifestSha256, fixture.currentV2.manifestSha256);
    assert.equal(record.archivedTree.sha256, fixture.currentV2.treeSha256);
    assert.equal(integrity.archiveRecord.sha256, digest(recordBytes));
    assert.equal(integrity.archivedKit.fileCount, 27);
    assert.equal(integrity.archivedKit.sha256, fixture.currentV2.treeSha256);
    assert.deepEqual(integrity.archivedKit.inventory, fixture.currentV2.inventory);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current refuses a byte-drifted previous-v2 tree before moving the active kit", async () => {
  const fixture = await makePreviousV2KitFixture();
  try {
    const template = path.join(fixture.kitRoot, "templates/adapter-entry-log.schema.template.jsonl");
    await chmod(template, 0o644);
    await writeFile(template, "{\"tampered\":true}\n");
    await chmod(template, 0o444);
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        previousV2ManifestHashes: fixture.previousV2ManifestHashes,
        previousV2TreeHashes: fixture.previousV2TreeHashes,
      }),
      /pinned previous-v2 source-driven branch kit file is stale, edited, or filled/,
    );
    assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current refuses mode, index, and runtime drift before moving an active kit", async (t) => {
  await t.test("mode drift", async () => {
    const fixture = await makeLegacyKitFixture();
    try {
      await chmod(path.join(fixture.kitRoot, "capture-plan.template.json"), 0o644);
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, archiveCurrentUnsignedTemplate: true, legacyManifestHashes: fixture.legacyManifestHashes}),
        /mode drift/,
      );
      assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("trace-spec index drift", async () => {
    const fixture = await makeLegacyKitFixture();
    try {
      await writeFile(path.join(fixture.root, "migrations/course-shell-pilot-trace-spec-index.json"), "{}\n");
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, archiveCurrentUnsignedTemplate: true, legacyManifestHashes: fixture.legacyManifestHashes}),
        /trace-spec index must contain one animation entry/,
      );
      assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("runtime executable drift", async () => {
    const fixture = await makeLegacyKitFixture();
    try {
      await writeFile(fixture.runtime.executablePath, "tampered runtime\n");
      await assert.rejects(
        scaffoldSourceDrivenBranchCaptureKits({projectRoot: fixture.root, specFiles: [fixture.specFile], runtime: fixture.runtime, archiveCurrentUnsignedTemplate: true, legacyManifestHashes: fixture.legacyManifestHashes}),
        /Projector executable SHA-256 is stale/,
      );
      assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("archive-current rolls an atomic displacement back when installation is interrupted", async () => {
  const fixture = await makeLegacyKitFixture();
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        legacyManifestHashes: fixture.legacyManifestHashes,
        transactionHooks: {afterKitMove: async () => { throw new Error("injected post-move failure"); }},
      }),
      /injected post-move failure/,
    );
    assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    assert.equal((await stat(path.join(fixture.kitRoot, "kit-manifest.json"))).mode & 0o777, 0o444);
    assert.equal(digest(await readFile(path.join(fixture.kitRoot, "kit-manifest.json"))), fixture.legacy.manifestSha256);
    const archiveParent = path.join(
      fixture.root,
      DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT,
      "_stale-unsigned-template-archive",
      fixture.kit.manifest.animationId,
      safeRequirementId(fixture.kit.manifest.requirementId),
    );
    const entries = await import("node:fs/promises").then(({readdir}) => readdir(archiveParent));
    assert.deepEqual(entries, []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current refuses a preoccupied empty final hash slot without moving the active kit", async () => {
  const fixture = await makeLegacyKitFixture();
  const legacyTreeSha256 = digest(Buffer.from(canonicalJson([...fixture.legacy.files.entries()].map(([file, descriptor]) => ({
    file,
    bytes: descriptor.content.length,
    sha256: digest(descriptor.content),
    mode: descriptor.mode,
  })).sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0))));
  const archiveSlot = path.join(
    fixture.root,
    DEFAULT_SOURCE_DRIVEN_BRANCH_CAPTURE_KIT_ROOT,
    "_stale-unsigned-template-archive",
    fixture.kit.manifest.animationId,
    safeRequirementId(fixture.kit.manifest.requirementId),
    legacyTreeSha256,
  );
  try {
    await mkdir(archiveSlot, {recursive: true});
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        legacyManifestHashes: fixture.legacyManifestHashes,
      }),
      /EEXIST|file already exists/,
    );
    assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    assert.deepEqual(await readdir(archiveSlot), []);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current detects a final-slot swap and preserves the replacement sentinel", async () => {
  const fixture = await makeLegacyKitFixture();
  let displacedSlot;
  let sentinel;
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        legacyManifestHashes: fixture.legacyManifestHashes,
        transactionHooks: {
          beforeKitMove: async ({archiveSlot}) => {
            displacedSlot = `${archiveSlot}.owned-but-displaced`;
            sentinel = path.join(archiveSlot, "replacement-sentinel.txt");
            await rename(archiveSlot, displacedSlot);
            await mkdir(archiveSlot, {recursive: false});
            await writeFile(sentinel, "foreign replacement\n");
          },
        },
      }),
      /identity changed during the transaction/,
    );
    assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    assert.equal(await readFile(sentinel, "utf8"), "foreign replacement\n");
    assert.deepEqual((await readdir(displacedSlot)).sort(), [SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE, "archive-record.json"]);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive-current rollback restores the active kit but preserves a foreign slot sentinel", async () => {
  const fixture = await makeLegacyKitFixture();
  let archiveSlot;
  let sentinel;
  try {
    await assert.rejects(
      scaffoldSourceDrivenBranchCaptureKits({
        projectRoot: fixture.root,
        specFiles: [fixture.specFile],
        runtime: fixture.runtime,
        archiveCurrentUnsignedTemplate: true,
        legacyManifestHashes: fixture.legacyManifestHashes,
        transactionHooks: {
          afterKitMove: async ({archiveSlot: slot}) => {
            archiveSlot = slot;
            sentinel = path.join(slot, "foreign-sentinel.txt");
            await writeFile(sentinel, "preserve me\n");
            throw new Error("injected rollback with foreign sentinel");
          },
        },
      }),
      /injected rollback with foreign sentinel/,
    );
    assert.equal((await lstat(fixture.kitRoot)).isDirectory(), true);
    assert.equal(await readFile(sentinel, "utf8"), "preserve me\n");
    assert.deepEqual(await readdir(archiveSlot), ["foreign-sentinel.txt"]);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
