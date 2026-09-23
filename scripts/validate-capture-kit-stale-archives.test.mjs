import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {gzipSync} from "node:zlib";

import {canonicalJson, safeRequirementId} from "./build-course-trace-specs.mjs";
import {
  NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE,
  NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
  NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY,
  buildNaturalTraceArchiveIntegritySidecar,
  deriveNaturalTraceArchiveTreeIdentities,
} from "./scaffold-natural-trace-capture-kit.mjs";
import {
  SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE,
  SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
  SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
  SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT,
  SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
  SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
  reconstructHistoricalGeneratorDerivedTraceSpec,
} from "./scaffold-source-driven-branch-capture-kit.mjs";
import {
  APPROVED_SOURCE_DRIVEN_RUNTIME,
  SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH,
} from "./source-driven-branch-capture-contracts.mjs";
import {parseArguments, usage, validateCaptureKitStaleArchives} from "./validate-capture-kit-stale-archives.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeReadonly(candidate, bytes, mode = 0o444) {
  await mkdir(path.dirname(candidate), {recursive: true});
  await writeFile(candidate, bytes, {mode});
  await chmod(candidate, mode);
}

function fixtureInventory(files) {
  return [...files.entries()]
    .map(([file, item]) => ({file, bytes: item.bytes.length, sha256: digest(item.bytes), mode: item.mode}))
    .sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0);
}

async function writeKit(kitRoot, files) {
  for (const [file, item] of files) await writeReadonly(path.join(kitRoot, file), item.bytes, item.mode);
}

async function writeSourceDrivenArchive(root, {
  animationId,
  requirementId,
  fileCount,
  templateVariant,
  mutateTemplateFiles,
  mutateKitManifest,
  mutateFiles,
  mutateRecord,
  mutateSidecar,
  runtimeOverride,
  currentSchemaCaptureKitManifestSha256,
  embeddedTraceSpecOverride,
  embeddedTraceIndexOverride,
}) {
  const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  const files = new Map();
  const add = (file, bytes) => files.set(file, {bytes: Buffer.from(bytes), mode: 0o444});
  const runtime = {
    runtimeId: APPROVED_SOURCE_DRIVEN_RUNTIME.runtimeId,
    name: APPROVED_SOURCE_DRIVEN_RUNTIME.name,
    version: APPROVED_SOURCE_DRIVEN_RUNTIME.version,
    requestedAppPath: "/Applications/Fixture Flash Player.app",
    appPath: "/Applications/Fixture Flash Player.app",
    executablePath: "/Applications/Fixture Flash Player.app/Contents/MacOS/Flash Player",
    executableSha256: APPROVED_SOURCE_DRIVEN_RUNTIME.executableSha256,
    ...runtimeOverride,
  };
  const child = "runtime-tree/lesson/TI/L6TI01.swf";
  const runtimePayloads = new Map([
    ["runtime-tree/host.swf", Buffer.from("fixture host swf\n")],
    [child, Buffer.from("fixture child swf\n")],
    ["runtime-tree/fixture-spec.json", Buffer.from("{\"fixture\":true}\n")],
    ["runtime-tree/upstream-sandbox.sb", Buffer.from("(version 1)\n(deny default)\n")],
  ]);
  const runtimeTreeFiles = [
    {source: "host.swf", destination: "runtime-tree/host.swf", role: "minimal-safe-adapter-host"},
    {source: "lesson/TI/L6TI01.swf", destination: child, role: "exact-preserved-child"},
    {source: "fixture-spec.json", destination: "runtime-tree/fixture-spec.json", role: "safe-adapter-specification"},
    {source: "sandbox.sb", destination: "runtime-tree/upstream-sandbox.sb", role: "exact-upstream-sandbox-reference"},
  ].map((item) => ({...item, sha256: digest(runtimePayloads.get(item.destination)), bytes: runtimePayloads.get(item.destination).length, stagedMode: "0444"}));
  for (const [file, bytes] of runtimePayloads) add(file, bytes);
  const fixtureManifestBytes = Buffer.from("{\"fixture\":true,\"kind\":\"minimal-adapter\"}\n");
  add("runtime-tree/fixture-manifest.json", fixtureManifestBytes);
  const runtimeTree = {
    schemaVersion: 1,
    artifactType: "source-driven-branch-isolated-minimal-adapter-runtime-tree",
    status: "unsigned-empty-template-only-not-evidence",
    animationId,
    requirementId,
    fixtureManifest: {sourceFile: `work/fixtures/${animationId}/fixture-manifest.json`, sourceSha256: digest(fixtureManifestBytes), stagedFile: "runtime-tree/fixture-manifest.json"},
    files: runtimeTreeFiles,
    isolation: {minimalAdapterOnly: true, originalCourseShellIncluded: false, sourceChildUntouched: true, stagedChildReadOnly: true, networkDenied: true, externalActionsRequired: false},
    strictAcceptanceEffect: false,
  };
  const runtimeTreeBytes = jsonBytes(runtimeTree);
  add("runtime-tree-manifest.json", runtimeTreeBytes);
  const sandboxBytes = Buffer.from("(version 1)\n(deny network*)\n(deny appleevent-send)\n(deny file-write*)\n");
  add("sandbox.sb", sandboxBytes);
  add("runtime/runtime-identity.json", jsonBytes(runtime));
  add("runtime/runtime-executable-sha256.txt", `${runtime.executableSha256}\n`);
  add("README.md", "# Unsigned source-driven branch capture kit\n");
  add("OPERATOR_CARD.md", "# Source-driven branch capture operator card\n");
  add("frames/README.md", "# Empty frame directory\n");
  const embeddedTraceSpec = embeddedTraceSpecOverride ?? {
    animationId,
    requirementId,
    sourceBindings: {
      scheduleDerivation: {
        generator: {
          path: "scripts/build-course-trace-specs.mjs",
          sha256: digest("previous trace generator"),
        },
      },
      fullFrameCoverage: {
        path: "evidence/full-frame-coverage.json",
        hashMode: "canonical-json-v1",
        projection: "help-math-trace-coverage-identity-v1",
        sha256: digest("stable trace coverage projection"),
        includedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
      },
    },
  };
  const embeddedTraceSpecBytes = jsonBytes(embeddedTraceSpec);
  const embeddedTraceIndexBytes = jsonBytes(embeddedTraceIndexOverride ?? {
    artifactType: "course-shell-pilot-trace-spec-index",
    selected: {animationId, requirementId},
  });
  add("bindings/trace-spec.json", embeddedTraceSpecBytes);
  add("bindings/trace-spec-index.json", embeddedTraceIndexBytes);
  add("bindings/projection-bindings.json", "{\"projections\":true}\n");
  const capturePlanBytes = Buffer.from("{\"template\":\"capture-plan\"}\n");
  add("capture-plan.template.json", capturePlanBytes);
  const v1Templates = [
    "templates/capture-manifest.template.json",
    "templates/environment-isolation-receipt.template.json",
    "templates/frame-state-log.schema.template.jsonl",
    "templates/runtime-toolchain-receipt.template.json",
    "templates/session-attestation.template.json",
    "templates/source-driven-event-log.schema.template.jsonl",
  ];
  const v2Additional = [
    "templates/adapter-entry-log.schema.template.jsonl",
    "templates/adapter-launch-receipt.template.json",
    "templates/operation-log.schema.template.jsonl",
    "templates/random-trial-log.schema.template.jsonl",
  ];
  const templateFiles = templateVariant === "legacy-v1-23-file" ? v1Templates : [...v1Templates, ...v2Additional];
  if (templateVariant === "current-v3-causal-capture-contract") {
    const contract = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT;
    const skeleton = (fields, overrides = {}) => Object.fromEntries(fields.map((field) => [field, Object.hasOwn(overrides, field) ? overrides[field] : null]));
    const identity = {schemaVersion: 1, animationId, requirementId};
    const templateSkeletons = new Map([
      ["templates/environment-isolation-receipt.template.json", skeleton(contract.fieldContracts.environmentIsolationReceipt, {
        ...identity,
        evidenceType: contract.evidenceTypes.environmentIsolationReceipt,
      })],
      ["templates/adapter-launch-receipt.template.json", skeleton(contract.fieldContracts.launchReceipt, {
        ...identity,
        evidenceType: contract.evidenceTypes.launchReceipt,
      })],
      ["templates/runtime-toolchain-receipt.template.json", skeleton(contract.fieldContracts.toolchainReceipt, {
        schemaVersion: 1,
        evidenceType: contract.evidenceTypes.toolchainReceipt,
      })],
      ["templates/session-attestation.template.json", skeleton(contract.fieldContracts.sessionAttestation, {
        ...identity,
        evidenceType: contract.evidenceTypes.sessionAttestation,
        authority: contract.outputAuthority,
      })],
      ["templates/capture-manifest.template.json", skeleton(contract.fieldContracts.captureManifest, {
        ...identity,
        evidenceType: contract.evidenceTypes.captureManifest,
        status: "candidate-input-not-canonical",
        authority: contract.outputAuthority,
        strictAcceptanceEffect: false,
      })],
      ["templates/adapter-entry-log.schema.template.jsonl", skeleton([...contract.fieldContracts.commonRecord, ...contract.fieldContracts.adapterEntryRecord], {
        ...identity,
        evidenceType: contract.evidenceTypes.adapterEntryRecord,
      })],
      ["templates/random-trial-log.schema.template.jsonl", skeleton([...contract.fieldContracts.commonRecord, ...contract.fieldContracts.randomTrialRecord], {
        ...identity,
        evidenceType: contract.evidenceTypes.randomTrialRecord,
      })],
      ["templates/source-driven-event-log.schema.template.jsonl", skeleton([...contract.fieldContracts.commonRecord, ...contract.fieldContracts.sourceEventRecord], {
        ...identity,
        evidenceType: contract.evidenceTypes.sourceEventRecord,
      })],
      ["templates/frame-state-log.schema.template.jsonl", skeleton([...contract.fieldContracts.commonRecord, ...contract.fieldContracts.frameStateRecord], {
        ...identity,
        evidenceType: contract.evidenceTypes.frameStateRecord,
      })],
      ["templates/operation-log.schema.template.jsonl", skeleton([...contract.fieldContracts.commonRecord, ...contract.fieldContracts.operationRecord], {
        ...identity,
        evidenceType: contract.evidenceTypes.operationRecord,
      })],
    ]);
    for (const file of templateFiles) {
      const skeleton = templateSkeletons.get(file);
      add(file, file.endsWith(".jsonl") ? `${JSON.stringify(skeleton)}\n` : `${JSON.stringify(skeleton, null, 2)}\n`);
    }
  } else {
    for (const file of templateFiles) add(file, `${JSON.stringify({template: file})}\n`);
  }
  if (typeof mutateTemplateFiles === "function") mutateTemplateFiles(files);
  const templateDescriptors = templateFiles.map((file) => ({file, sha256: digest(files.get(file).bytes)}));
  let templateContract;
  if (templateVariant !== "legacy-v1-23-file") {
    templateContract = {
      schemaVersion: templateVariant === "current-v3-causal-capture-contract" ? 3 : 2,
      capturePlan: {file: "capture-plan.template.json", sha256: digest(capturePlanBytes)},
      files: templateDescriptors,
      adapterEntry: {preTraceActivationCount: 1, beginHandoffCount: 1, totalRecordCount: 2},
      randomTrials: templateVariant === "current-v3-causal-capture-contract"
        ? {acceptedSessionNaturalAttemptCount: 1, acceptedTrialCount: 1, acceptedTrialMustBeOnlyRecord: true, firstPreviousRecordSha256From: "adapterEntryLog.finalRecordSha256"}
        : {recordEveryNaturalAttempt: true, acceptedTrialCount: 1, acceptedTrialMustBeLast: true},
      unifiedOperations: templateVariant === "current-v3-causal-capture-contract"
        ? {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145, firstRecordPreviousRecordSha256From: "randomTrialLog.finalRecordSha256", everyRecordReferencesExactlyOneRawEventOrFrameRecord: true}
        : {frameStateCount: 142, sourceDrivenEventCount: 3, operatorDispatchCount: 0, totalRecordCount: 145},
    };
    if (templateVariant === "current-v3-causal-capture-contract") {
      templateContract.candidateInputContract = {
        module: {file: "scripts/source-driven-branch-capture-contracts.mjs", sha256: digest(await readFile(SOURCE_DRIVEN_BRANCH_CONTRACT_MODULE_PATH))},
        export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT",
        schemaVersion: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.schemaVersion,
        canonicalEncoding: "canonical-json-v1",
        sha256: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT_SHA256,
        exact: SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT,
      };
      templateContract.sourceEvents = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.sourceEvents;
      templateContract.frameStates = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.frameStates;
      templateContract.masterEvidenceChain = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.causalContract.masterEvidenceChain;
      templateContract.authority = SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT.outputAuthority;
    } else if (templateVariant === "current-v2-complete-capture-contract") {
      templateContract.candidateInputContract = {module: "scripts/prepare-source-driven-branch-candidate.mjs", export: "SOURCE_DRIVEN_BRANCH_CANDIDATE_INPUT_CONTRACT", schemaVersion: 1};
    }
  }
  const traceSpecBinding = {
    file: `migrations/${animationId}/audit/trace-specs/${safeRequirementId(requirementId)}.json`,
    sha256: digest(embeddedTraceSpecBytes),
  };
  const traceIndexBinding = {
    file: "migrations/course-shell-pilot-trace-spec-index.json",
    sha256: digest(embeddedTraceIndexBytes),
  };
  const fixtureBinding = {file: `work/fixtures/${animationId}/fixture-manifest.json`, sha256: digest(fixtureManifestBytes), fixtureDigest: digest(`${requirementId} fixture digest`)};
  const authority = {
    isolatedMinimalAdapterOnly: true,
    originalShellAuthority: false,
    audioOrLanguageAuthority: false,
    runtimeLaunchedByFactory: false,
    framesCapturedByFactory: 0,
    humanIdentityRecorded: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
  const kitManifest = {
    schemaVersion: 1,
    artifactType: "source-driven-natural-branch-capture-operator-kit",
    status: "unsigned-empty-template-only-not-evidence",
    animationId,
    requirementId,
    identity: {frameDomainId: "sprite-21", scenario: "sound-0", language: "en", seed: "0"},
    bindings: {schemaVersion: 1, traceSpec: traceSpecBinding, traceSpecIndex: traceIndexBinding, projections: {}, sourceSwf: {path: "source-assets/fixture.swf", sha256: digest("fixture source")}, fixtureManifest: fixtureBinding},
    scheduleContract: {sourceDrivenEventFrames: [1, 5, 142], naturallyObservedOutcome: 0, naturallyObservedBranch: "sound-0", sourceCall: "random(2)", seedInjectionAllowed: false, forcedBranchAllowed: false, operatorActionsAllowed: 0, requiredFrameCount: 142, checkpointCount: 3, terminalKind: "stopped-terminal"},
    runtime,
    runtimeTree: {file: "runtime-tree-manifest.json", sha256: digest(runtimeTreeBytes)},
    sandbox: {file: "sandbox.sb", sha256: digest(sandboxBytes), networkDenied: true, fileWritesDenied: true, launcherIncluded: false},
    ...(templateContract ? {templateContract} : {}),
    authority,
  };
  if (typeof mutateKitManifest === "function") mutateKitManifest(kitManifest);
  const kitManifestBytes = jsonBytes(kitManifest);
  add("kit-manifest.json", kitManifestBytes);
  if (typeof mutateFiles === "function") mutateFiles(files);
  assert.equal(files.size, fileCount, `${templateVariant} fixture file count`);
  const inventory = fixtureInventory(files);
  const treeSha256 = digest(Buffer.from(canonicalJson(inventory)));
  const record = {
    schemaVersion: 1,
    artifactType: "source-driven-branch-unsigned-template-stale-archive-record",
    status: "archived-current-checked-unsigned-template-only-not-evidence",
    sourceKit: `work/source-driven-branch-capture-kits/${animationId}/${safeRequirementId(requirementId)}`,
    archivedKitRoot: "kit",
    animationId,
    requirementId,
    templateVariant,
    bindings: {
      traceSpec: traceSpecBinding,
      traceSpecIndex: traceIndexBinding,
      fixtureManifest: {file: fixtureBinding.file, sha256: fixtureBinding.sha256},
      runtime,
      archivedCaptureKitManifestSha256: digest(kitManifestBytes),
      currentSchemaCaptureKitManifestSha256: currentSchemaCaptureKitManifestSha256 ?? (templateVariant === "current-v3-causal-capture-contract" ? digest(kitManifestBytes) : digest(`${requirementId} current manifest`)),
    },
    archivedTree: {algorithm: SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM, sha256: treeSha256, fileCount},
    authority: {
      runtimeLaunched: false,
      framesCaptured: 0,
      humanIdentityRecorded: false,
      humanReviewRecorded: false,
      ownerReviewRecorded: false,
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    },
    statement: "This append-only record preserves only an exactly checked empty unsigned source-driven branch capture-kit template. Atomic rename preserves its bytes; it is not runtime evidence, human review, owner acceptance, or strict completion.",
  };
  if (typeof mutateRecord === "function") mutateRecord(record);
  const recordBytes = Buffer.from(`${canonicalJson(record)}\n`);
  const sidecar = {
    schemaVersion: 1,
    artifactType: "source-driven-branch-unsigned-template-full-tree-integrity",
    status: "append-only-integrity-binding-not-evidence",
    animationId,
    requirementId,
    archiveRecord: {file: "archive-record.json", sha256: digest(recordBytes)},
    archivedKit: {root: "kit", algorithm: SOURCE_DRIVEN_BRANCH_ARCHIVE_TREE_ALGORITHM, sha256: treeSha256, fileCount, inventory},
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
  };
  if (typeof mutateSidecar === "function") mutateSidecar(sidecar);
  const slot = path.join(root, SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT, animationId, safeRequirementId(requirementId), treeSha256);
  await writeKit(path.join(slot, "kit"), files);
  await writeReadonly(path.join(slot, "archive-record.json"), recordBytes);
  await writeReadonly(path.join(slot, SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE), Buffer.from(`${canonicalJson(sidecar)}\n`));
  return {slot, files, record, sidecar};
}

function reconstructedCascadeFixture({
  animationId,
  selectedRequirementId,
  arbitraryNonSelectedPreviousHash = false,
}) {
  const previousGeneratorSha256 = digest("reconstructed cascade previous generator");
  const currentGeneratorSha256 = digest("reconstructed cascade current generator");
  const sourceSwfSha256 = digest("reconstructed cascade source SWF");
  const inventoryFileSha256 = digest("reconstructed cascade inventory file");
  const projectionSha256 = digest("reconstructed cascade stable coverage projection");
  const historicalTechnicalBindings = {
    manifest: {
      hashMode: "canonical-json-v1",
      projection: "help-math-technical-manifest-v1",
      sha256: digest("reconstructed cascade manifest projection"),
      excludedPaths: [],
    },
    coverage: {
      hashMode: "canonical-json-v1",
      projection: "help-math-trace-coverage-identity-v1",
      sha256: projectionSha256,
      excludedPaths: [],
      includedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
    },
    scenarioInventory: {
      hashMode: "canonical-json-v1",
      projection: "help-math-scenario-inventory-technical-v1",
      sha256: digest("reconstructed cascade scenario projection"),
      excludedPaths: [],
    },
  };
  const currentTechnicalBindings = structuredClone(historicalTechnicalBindings);
  currentTechnicalBindings.coverage.includedPaths = [
    ...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
  ];
  const requirements = [
    selectedRequirementId,
    "req:sprite-21:sound-1:en",
  ];
  const currentSpecs = requirements.map((requirementId) => {
    const file =
      `migrations/${animationId}/audit/trace-specs/${safeRequirementId(requirementId)}.json`;
    const value = {
      schemaVersion: 1,
      artifactType: "course-pilot-original-runtime-trace-specification",
      animationId,
      requirementId,
      sourceBindings: {
        sourceSwf: {
          path: "source-assets/fixture.swf",
          sha256: sourceSwfSha256,
        },
        migrationManifest: {
          path: "migration.json",
          ...structuredClone(currentTechnicalBindings.manifest),
        },
        fullFrameCoverage: {
          path: "evidence/full-frame-coverage.json",
          ...structuredClone(currentTechnicalBindings.coverage),
        },
        scenarioInventory: {
          path: "audit/scenario-inventory.json",
          ...structuredClone(currentTechnicalBindings.scenarioInventory),
        },
        coverageInventoryBinding: {
          status:
            "verified-current-file-at-spec-generation-not-part-of-execution-binding",
          fileSha256AtSpecGeneration: inventoryFileSha256,
          technicalProjectionSha256:
            currentTechnicalBindings.scenarioInventory.sha256,
        },
        scheduleDerivation: {
          generator: {
            path: "scripts/build-course-trace-specs.mjs",
            sha256: currentGeneratorSha256,
          },
        },
      },
    };
    const utf8 = `${JSON.stringify(value, null, 2)}\n`;
    const reconstructed = reconstructHistoricalGeneratorDerivedTraceSpec({
      currentSpecValue: value,
      previousGeneratorSha256,
      currentGeneratorSha256,
      historicalTechnicalBindings,
      currentTechnicalBindings,
      previousInventoryFileSha256AtSpecGeneration: inventoryFileSha256,
    });
    return {
      requirementId,
      file,
      value,
      utf8,
      sha256: digest(Buffer.from(utf8)),
      reconstructed,
    };
  });
  const historicalIndex = {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilots: [{
      animationId,
      sourceSwfSha256,
      technicalBindings: historicalTechnicalBindings,
      traceSpecs: currentSpecs.map((spec, index) => ({
        requirementId: spec.requirementId,
        file: spec.file,
        sha256:
          arbitraryNonSelectedPreviousHash && index === 1
            ? "a".repeat(64)
            : spec.reconstructed.sha256,
      })),
    }],
  };
  const currentIndex = structuredClone(historicalIndex);
  currentIndex.pilots[0].technicalBindings = currentTechnicalBindings;
  for (let index = 0; index < currentSpecs.length; index += 1) {
    currentIndex.pilots[0].traceSpecs[index].sha256 =
      currentSpecs[index].sha256;
  }
  const snapshots = currentSpecs
    .map((spec) => ({file: spec.file, currentSpecUtf8: spec.utf8}))
    .sort((left, right) => left.file < right.file ? -1 : left.file > right.file ? 1 : 0);
  const bundlePayload = Buffer.from(`${canonicalJson(snapshots)}\n`);
  const bundleGzip = gzipSync(bundlePayload, {level: 9, mtime: 0});
  return {
    embeddedTraceSpec: currentSpecs[0].reconstructed.value,
    embeddedTraceIndex: historicalIndex,
    currentIndexSha256: digest(
      Buffer.from(`${JSON.stringify(currentIndex, null, 2)}\n`),
    ),
    currentSpecs,
    proof: {
      kind: "allowlisted-generator-and-coverage-projection-schema-upgrade",
      path: "sourceBindings.scheduleDerivation.generator.sha256",
      generatorFile: "scripts/build-course-trace-specs.mjs",
      previousGeneratorSha256,
      currentGeneratorSha256,
      reconstructedPreviousTraceSpecSha256:
        currentSpecs[0].reconstructed.sha256,
      currentTraceSpecSha256: currentSpecs[0].sha256,
      previousTraceSpecIndexSha256: null,
      currentTraceSpecIndexSha256: digest(
        Buffer.from(`${JSON.stringify(currentIndex, null, 2)}\n`),
      ),
      indexDrift: {
        kind:
          "exact-reconstructed-generator-output-trace-spec-and-index-cascade-v2",
        changedTechnicalBindings: [{
          kind: "coverage-included-paths-v1-to-v2",
          animationId,
          binding: "technicalBindings.coverage.includedPaths",
          previousIncludedPaths: [
            ...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
          ],
          currentIncludedPaths: [
            ...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
          ],
        }],
        changedTraceSpecs: currentSpecs.map((spec, index) => ({
          animationId,
          requirementId: spec.requirementId,
          file: spec.file,
          previousSha256:
            arbitraryNonSelectedPreviousHash && index === 1
              ? "a".repeat(64)
              : spec.reconstructed.sha256,
          currentSha256: spec.sha256,
          allowlistedTransforms: spec.reconstructed.allowlistedTransforms,
          previousInventoryFileSha256AtSpecGeneration: inventoryFileSha256,
          historicalInventoryFileWitness: null,
        })),
        reconstructionBundle: {
          encoding:
            "gzip-base64-canonical-json-current-trace-spec-snapshots-v1",
          entryCount: snapshots.length,
          uncompressedSha256: digest(bundlePayload),
          gzipSha256: digest(bundleGzip),
          data: bundleGzip.toString("base64"),
        },
      },
      coverageProjectionSchemaUpgrade: {
        kind: "deterministic-trace-coverage-included-paths-v1-to-v2",
        path: "sourceBindings.fullFrameCoverage.includedPaths",
        projection: "help-math-trace-coverage-identity-v1",
        previousIncludedPaths: [
          ...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS,
        ],
        currentIncludedPaths: [
          ...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS,
        ],
        previousProjectionSha256: projectionSha256,
        currentProjectionSha256: projectionSha256,
        projectionSha256Unchanged: true,
        allOtherTraceSpecBytesReconstructedFromCurrent: true,
      },
      allOtherSelectedTraceSpecBytesReconstructedFromCurrent: true,
    },
  };
}

async function createFixture(directoryTreeAlgorithm, {rootFamily = "course"} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "capture-stale-archive-validator-"));
  const legacyRoot = rootFamily === "legacy";
  const rootAnimationId = legacyRoot
    ? "keyterm-elementary-acute-angle"
    : "course-g03-l01-ts-008";
  const rootRequirementId = legacyRoot
    ? "req:root:default:en"
    : "req:root:root-standalone:en";
  const oldTraceSpecSha256 = digest("old root trace spec");
  const currentTraceSpecSha256 = digest("current root trace spec");
  const oldTraceSpecIndexSha256 = digest("old root trace index");
  const currentTraceSpecIndexSha256 = digest("current root trace index");
  const rootTraceSpecIndexFile = legacyRoot
    ? "migrations/legacy-pilot-trace-spec-index.json"
    : "migrations/course-shell-pilot-trace-spec-index.json";
  const rootKitManifest = {
    schemaVersion: 1,
    artifactType: "root-frame-accurate-capture-operator-kit",
    animationId: rootAnimationId,
    requirementId: rootRequirementId,
    bindings: {
      traceSpec: {
        file: `migrations/${rootAnimationId}/audit/trace-specs/${safeRequirementId(rootRequirementId)}.json`,
        sha256: oldTraceSpecSha256,
      },
      traceSpecIndex: {
        file: rootTraceSpecIndexFile,
        sha256: oldTraceSpecIndexSha256,
      },
    },
  };
  const rootFiles = new Map([
    ["OPERATOR_CARD.md", {bytes: Buffer.from("root operator\n"), mode: 0o444}],
    ["kit-manifest.json", {bytes: Buffer.from(`${JSON.stringify(rootKitManifest, null, 2)}\n`), mode: 0o444}],
    ["runtime/source.swf", {bytes: Buffer.from("root source swf\n"), mode: 0o444}],
    ["launch.sh", {bytes: Buffer.from("#!/bin/sh\nexit 1\n"), mode: 0o555}],
  ]);
  const rootInventory = fixtureInventory(rootFiles);
  const rootRecordFiles = rootInventory.map(({file, bytes: size, sha256, mode}) => ({file, size, sha256, mode}));
  const oldTreeSha256 = digest(Buffer.from(canonicalJson(rootRecordFiles)));
  const replacementSha256 = digest("replacement root manifest");
  const rootRecord = {
    schemaVersion: 1,
    artifactType: "append-only-stale-unsigned-root-capture-kit",
    status: "archived-unsigned-template-only-not-evidence",
    notEvidence: true,
    sourceKit: `work/root-capture-kits/${rootAnimationId}/${safeRequirementId(rootRequirementId)}`,
    animationId: rootAnimationId,
    requirementId: rootRequirementId,
    oldTraceSpecSha256,
    currentTraceSpecSha256,
    oldTraceSpecIndexSha256,
    currentTraceSpecIndexSha256,
    oldTreeSha256,
    newCaptureKitManifestSha256: replacementSha256,
    fileCount: rootRecordFiles.length,
    files: rootRecordFiles,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
  const rootSlot = path.join(
    root,
    "work/root-capture-kit-stale-archive",
    rootAnimationId,
    safeRequirementId(rootRequirementId),
    `${oldTreeSha256}--to--${replacementSha256}`,
  );
  await writeKit(path.join(rootSlot, "kit"), rootFiles);
  await writeReadonly(path.join(rootSlot, "archive-record.json"), Buffer.from(`${JSON.stringify(rootRecord, null, 2)}\n`));

  const naturalAnimationId = "course-g05-l13-rw-002";
  const naturalRequirementId = "req:sprite-334:default:en";
  const naturalFiles = new Map([
    ["OPERATOR_CARD.md", {bytes: Buffer.from("natural operator\n"), mode: 0o444}],
    ["capture-plan.template.json", {bytes: Buffer.from("{}\n"), mode: 0o444}],
    ["launch-original-host-sandboxed.sh", {bytes: Buffer.from("#!/bin/sh\nexit 1\n"), mode: 0o555}],
  ]);
  const naturalInventory = fixtureInventory(naturalFiles);
  const identities = deriveNaturalTraceArchiveTreeIdentities(naturalInventory);
  const previousTreeSha256 = directoryTreeAlgorithm === NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT
    ? identities.currentFullInventorySha256
    : identities.legacyModeExcludedInventorySha256;
  const naturalRecord = {
    schemaVersion: 1,
    evidenceType: "natural-trace-unsigned-template-stale-archive-record",
    status: "archived-generator-produced-unsigned-template",
    animationId: naturalAnimationId,
    requirementId: naturalRequirementId,
    previousTreeSha256,
    inventory: naturalInventory,
    traceSpecIndex: {previousSha256: digest("old index"), currentSha256: digest("new index")},
    replacementCaptureKitManifestSha256: digest("replacement natural manifest"),
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
    humanReviewRecorded: false,
    ownerReviewRecorded: false,
    statement: "fixture",
  };
  const naturalRecordBytes = Buffer.from(`${canonicalJson(naturalRecord)}\n`);
  const sidecar = buildNaturalTraceArchiveIntegritySidecar({
    archiveRecordBytes: naturalRecordBytes,
    inventory: naturalInventory,
    directoryTreeAlgorithm,
    directoryTreeSha256: previousTreeSha256,
    animationId: naturalAnimationId,
    requirementId: naturalRequirementId,
  });
  const naturalSlot = path.join(
    root,
    "work/natural-trace-capture-kits/_stale-unsigned-template-archive",
    naturalAnimationId,
    safeRequirementId(naturalRequirementId),
    previousTreeSha256,
  );
  await writeKit(path.join(naturalSlot, "kit"), naturalFiles);
  await writeReadonly(path.join(naturalSlot, "archive-record.json"), naturalRecordBytes);
  await writeReadonly(path.join(naturalSlot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE), Buffer.from(`${canonicalJson(sidecar)}\n`));
  const sourceDrivenLegacy = await writeSourceDrivenArchive(root, {
    animationId: "course-g03-l06-ti-001",
    requirementId: "req:sprite-21:sound-0:en",
    fileCount: 23,
    templateVariant: "legacy-v1-23-file",
  });
  const sourceDrivenCurrent = await writeSourceDrivenArchive(root, {
    animationId: "course-g03-l06-ti-001",
    requirementId: "req:sprite-21:sound-1:en",
    fileCount: 27,
    templateVariant: "current-v2-complete-capture-contract",
  });
  const sourceDrivenPreviousV2 = await writeSourceDrivenArchive(root, {
    animationId: "course-g03-l06-ti-001-previous-v2-fixture",
    requirementId: "req:sprite-21:sound-0:en",
    fileCount: 27,
    templateVariant: "previous-v2-27-file-pre-candidate-contract-alignment",
  });
  const sourceDrivenCurrentV3 = await writeSourceDrivenArchive(root, {
    animationId: "course-g03-l06-ti-001",
    requirementId: "req:sprite-21:sound-1:en",
    fileCount: 27,
    templateVariant: "current-v3-causal-capture-contract",
  });
  return {root, naturalSlot, sourceDrivenLegacy, sourceDrivenCurrent, sourceDrivenPreviousV2, sourceDrivenCurrentV3};
}

test("validates root plus legacy and current natural append-only archive identities", async (t) => {
  for (const algorithm of [NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY, NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT]) {
    await t.test(algorithm, async () => {
      const item = await createFixture(algorithm);
      try {
        const result = await validateCaptureKitStaleArchives({projectRoot: item.root});
        assert.equal(result.status, "verified-append-only-stale-unsigned-template-archives");
        assert.equal(result.rootArchiveCount, 1);
        assert.equal(result.naturalArchiveCount, 1);
        assert.equal(result.sourceDrivenBranchArchiveCount, 4);
        assert.equal(result.totalArchiveCount, 6);
        assert.equal(result.naturalArchives[0].directoryTreeAlgorithm, algorithm);
        assert.deepEqual(result.sourceDrivenBranchArchives.map(({fileCount}) => fileCount).sort((left, right) => left - right), [23, 27, 27, 27]);
        assert.equal(result.strictAcceptanceEffect, false);
        assert.equal(result.migrationStatusChanged, false);
      } finally {
        await rm(item.root, {recursive: true, force: true});
      }
    });
  }
});

test("validates a root stale archive whose immutable kit binds the legacy formula/keyterm index", async () => {
  const item = await createFixture(
    NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
    {rootFamily: "legacy"},
  );
  try {
    const result = await validateCaptureKitStaleArchives({projectRoot: item.root});
    assert.equal(result.rootArchiveCount, 1);
    assert.equal(result.rootArchives[0].animationId, "keyterm-elementary-acute-angle");
    assert.equal(result.rootArchives[0].requirementId, "req:root:default:en");
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("validates a source-driven v2 archive with pretty-printed JSON templates and a bound generator-only trace-spec drift proof", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "capture-stale-source-driven-drift-validator-"));
  const animationId = "course-g03-l06-ti-001";
  const requirementId = "req:sprite-21:sound-0:en";
  const currentTraceSpecSha256 = digest("current trace spec");
  const currentTraceSpecIndexSha256 = digest("current trace index");
  try {
    await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
    await mkdir(path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"), {recursive: true});
    const archive = await writeSourceDrivenArchive(root, {
      animationId,
      requirementId,
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      currentSchemaCaptureKitManifestSha256: digest("replacement current manifest"),
      mutateRecord: (record) => {
        record.schemaVersion = 2;
        record.traceSpecDriftProof = {
          kind: "single-allowlisted-trace-spec-field-drift",
          path: "sourceBindings.scheduleDerivation.generator.sha256",
          generatorFile: "scripts/build-course-trace-specs.mjs",
          previousGeneratorSha256: digest("previous trace generator"),
          currentGeneratorSha256: digest("current trace generator"),
          reconstructedPreviousTraceSpecSha256: record.bindings.traceSpec.sha256,
          currentTraceSpecSha256,
          previousTraceSpecIndexSha256: record.bindings.traceSpecIndex.sha256,
          currentTraceSpecIndexSha256,
          indexDrift: {
            kind: "same-index-structure-except-generator-derived-trace-spec-sha256-fields",
            changedTraceSpecs: [{
              animationId,
              requirementId,
              file: record.bindings.traceSpec.file,
              previousSha256: record.bindings.traceSpec.sha256,
              currentSha256: currentTraceSpecSha256,
            }],
          },
          allOtherSelectedTraceSpecBytesReconstructedFromCurrent: true,
        };
      },
    });
    const environmentTemplate = await readFile(path.join(archive.slot, "kit/templates/environment-isolation-receipt.template.json"), "utf8");
    assert.match(environmentTemplate, /\n  \"/);
    const result = await validateCaptureKitStaleArchives({projectRoot: root});
    assert.equal(result.sourceDrivenBranchArchiveCount, 1);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("validates the exact source-driven coverage-v1 to coverage-v2 schema-upgrade proof", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "capture-stale-source-driven-coverage-upgrade-validator-"));
  const animationId = "course-g03-l06-ti-001";
  const requirementId = "req:sprite-21:sound-0:en";
  const currentTraceSpecSha256 = digest("coverage-upgrade current trace spec");
  const currentTraceSpecIndexSha256 = digest("coverage-upgrade current trace index");
  const projectionSha256 = digest("stable trace coverage projection");
  try {
    await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
    await mkdir(path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"), {recursive: true});
    await writeSourceDrivenArchive(root, {
      animationId,
      requirementId,
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      currentSchemaCaptureKitManifestSha256: digest("coverage-upgrade replacement manifest"),
      mutateRecord: (record) => {
        record.schemaVersion = 2;
        record.traceSpecDriftProof = {
          kind: "allowlisted-generator-and-coverage-projection-schema-upgrade",
          path: "sourceBindings.scheduleDerivation.generator.sha256",
          generatorFile: "scripts/build-course-trace-specs.mjs",
          previousGeneratorSha256: digest("previous trace generator"),
          currentGeneratorSha256: digest("coverage-upgrade current trace generator"),
          reconstructedPreviousTraceSpecSha256: record.bindings.traceSpec.sha256,
          currentTraceSpecSha256,
          previousTraceSpecIndexSha256: record.bindings.traceSpecIndex.sha256,
          currentTraceSpecIndexSha256,
          indexDrift: {
            kind: "same-index-structure-except-generator-derived-trace-spec-sha256-fields",
            changedTraceSpecs: [{
              animationId,
              requirementId,
              file: record.bindings.traceSpec.file,
              previousSha256: record.bindings.traceSpec.sha256,
              currentSha256: currentTraceSpecSha256,
            }],
          },
          coverageProjectionSchemaUpgrade: {
            kind: "deterministic-trace-coverage-included-paths-v1-to-v2",
            path: "sourceBindings.fullFrameCoverage.includedPaths",
            projection: "help-math-trace-coverage-identity-v1",
            previousIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
            currentIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS],
            previousProjectionSha256: projectionSha256,
            currentProjectionSha256: projectionSha256,
            projectionSha256Unchanged: true,
            allOtherTraceSpecBytesReconstructedFromCurrent: true,
          },
          allOtherSelectedTraceSpecBytesReconstructedFromCurrent: true,
        };
      },
    });
    const result = await validateCaptureKitStaleArchives({projectRoot: root});
    assert.equal(result.sourceDrivenBranchArchiveCount, 1);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("validates a self-contained exact two-entry generator and coverage index cascade reconstruction", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "capture-stale-source-driven-reconstructed-cascade-"),
  );
  const animationId = "course-g03-l06-ti-001";
  const requirementId = "req:sprite-21:sound-0:en";
  const fixture = reconstructedCascadeFixture({
    animationId,
    selectedRequirementId: requirementId,
  });
  try {
    await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
    await mkdir(
      path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"),
      {recursive: true},
    );
    await writeSourceDrivenArchive(root, {
      animationId,
      requirementId,
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      embeddedTraceSpecOverride: fixture.embeddedTraceSpec,
      embeddedTraceIndexOverride: fixture.embeddedTraceIndex,
      currentSchemaCaptureKitManifestSha256: digest(
        "reconstructed cascade replacement manifest",
      ),
      mutateRecord: (record) => {
        fixture.proof.previousTraceSpecIndexSha256 =
          record.bindings.traceSpecIndex.sha256;
        record.schemaVersion = 2;
        record.traceSpecDriftProof = fixture.proof;
      },
    });
    const result = await validateCaptureKitStaleArchives({projectRoot: root});
    assert.equal(result.sourceDrivenBranchArchiveCount, 1);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("reconstructed cascade rejects an arbitrary non-selected historical spec hash even when the old index is rehashed", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "capture-stale-source-driven-arbitrary-old-hash-"),
  );
  const animationId = "course-g03-l06-ti-001";
  const requirementId = "req:sprite-21:sound-0:en";
  const fixture = reconstructedCascadeFixture({
    animationId,
    selectedRequirementId: requirementId,
    arbitraryNonSelectedPreviousHash: true,
  });
  try {
    await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
    await mkdir(
      path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"),
      {recursive: true},
    );
    await writeSourceDrivenArchive(root, {
      animationId,
      requirementId,
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      embeddedTraceSpecOverride: fixture.embeddedTraceSpec,
      embeddedTraceIndexOverride: fixture.embeddedTraceIndex,
      currentSchemaCaptureKitManifestSha256: digest(
        "arbitrary old hash replacement manifest",
      ),
      mutateRecord: (record) => {
        fixture.proof.previousTraceSpecIndexSha256 =
          record.bindings.traceSpecIndex.sha256;
        record.schemaVersion = 2;
        record.traceSpecDriftProof = fixture.proof;
      },
    });
    await assert.rejects(
      () => validateCaptureKitStaleArchives({projectRoot: root}),
      /previous trace-spec bytes cannot be exactly reconstructed/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("coverage schema-upgrade archive proof rejects a widened or reordered path contract", async (t) => {
  for (const [label, mutateUpgrade] of [
    [
      "widened v1 path list",
      (upgrade) => upgrade.previousIncludedPaths.push("unexpectedField"),
    ],
    [
      "reordered v2 path list",
      (upgrade) => upgrade.currentIncludedPaths.reverse(),
    ],
    [
      "changed projection digest",
      (upgrade) => {
        upgrade.currentProjectionSha256 = digest("different projection");
      },
    ],
  ]) {
    await t.test(label, async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "capture-stale-source-driven-coverage-negative-"));
      const animationId = "course-g03-l06-ti-001";
      const requirementId = "req:sprite-21:sound-0:en";
      const currentTraceSpecSha256 = digest(`current trace ${label}`);
      const projectionSha256 = digest("stable trace coverage projection");
      try {
        await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
        await mkdir(path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"), {recursive: true});
        await writeSourceDrivenArchive(root, {
          animationId,
          requirementId,
          fileCount: 27,
          templateVariant: "current-v3-causal-capture-contract",
          currentSchemaCaptureKitManifestSha256: digest(`replacement ${label}`),
          mutateRecord: (record) => {
            record.schemaVersion = 2;
            const upgrade = {
              kind: "deterministic-trace-coverage-included-paths-v1-to-v2",
              path: "sourceBindings.fullFrameCoverage.includedPaths",
              projection: "help-math-trace-coverage-identity-v1",
              previousIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V1_INCLUDED_PATHS],
              currentIncludedPaths: [...SOURCE_DRIVEN_TRACE_COVERAGE_V2_INCLUDED_PATHS],
              previousProjectionSha256: projectionSha256,
              currentProjectionSha256: projectionSha256,
              projectionSha256Unchanged: true,
              allOtherTraceSpecBytesReconstructedFromCurrent: true,
            };
            mutateUpgrade(upgrade);
            record.traceSpecDriftProof = {
              kind: "allowlisted-generator-and-coverage-projection-schema-upgrade",
              path: "sourceBindings.scheduleDerivation.generator.sha256",
              generatorFile: "scripts/build-course-trace-specs.mjs",
              previousGeneratorSha256: digest("previous trace generator"),
              currentGeneratorSha256: digest(`current generator ${label}`),
              reconstructedPreviousTraceSpecSha256: record.bindings.traceSpec.sha256,
              currentTraceSpecSha256,
              previousTraceSpecIndexSha256: record.bindings.traceSpecIndex.sha256,
              currentTraceSpecIndexSha256: digest(`current index ${label}`),
              indexDrift: {
                kind: "same-index-structure-except-generator-derived-trace-spec-sha256-fields",
                changedTraceSpecs: [{
                  animationId,
                  requirementId,
                  file: record.bindings.traceSpec.file,
                  previousSha256: record.bindings.traceSpec.sha256,
                  currentSha256: currentTraceSpecSha256,
                }],
              },
              coverageProjectionSchemaUpgrade: upgrade,
              allOtherSelectedTraceSpecBytesReconstructedFromCurrent: true,
            };
          },
        });
        await assert.rejects(
          () => validateCaptureKitStaleArchives({projectRoot: root}),
          /coverage projection schema-upgrade proof|coverage-v1 included paths|coverage-v2 included paths/,
        );
      } finally {
        await rm(root, {recursive: true, force: true});
      }
    });
  }
});

test("validates a source-driven v3 archive with a selected-spec-current global index-only drift proof", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "capture-stale-source-driven-index-only-validator-"));
  const animationId = "course-g03-l06-ti-001";
  const requirementId = "req:sprite-21:sound-0:en";
  try {
    await mkdir(path.join(root, "work/root-capture-kit-stale-archive"), {recursive: true});
    await mkdir(path.join(root, "work/natural-trace-capture-kits/_stale-unsigned-template-archive"), {recursive: true});
    await writeSourceDrivenArchive(root, {
      animationId,
      requirementId,
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      currentSchemaCaptureKitManifestSha256: digest("replacement current manifest after global index drift"),
      mutateRecord: (record) => {
        record.schemaVersion = 3;
        record.traceSpecIndexDriftProof = {
          kind: "selected-trace-spec-current-global-index-only-drift",
          selectedTraceSpec: {
            file: record.bindings.traceSpec.file,
            sha256: record.bindings.traceSpec.sha256,
            bytesUnchanged: true,
            indexEntryUnchanged: true,
          },
          previousTraceSpecIndexSha256: record.bindings.traceSpecIndex.sha256,
          currentTraceSpecIndexSha256: digest("current global trace-spec index"),
          indexDrift: {
            kind: "same-index-structure-selected-pilot-unchanged-other-pilot-approved-sha256-fields-only",
            changedOtherPilotBindings: [{
              kind: "technical-binding-sha256",
              animationId: "course-g04-l09-gs-002",
              requirementId: null,
              file: null,
              binding: "technicalBindings.manifest.sha256",
              previousSha256: digest("previous GS technical projection"),
              currentSha256: digest("current GS technical projection"),
            }, {
              kind: "trace-spec-sha256",
              animationId: "course-g04-l09-gs-002",
              requirementId: "req:root:root-standalone:en",
              file: "migrations/course-g04-l09-gs-002/audit/trace-specs/req-root-root-standalone-en.json",
              binding: "traceSpecs[].sha256",
              previousSha256: digest("previous GS root trace spec"),
              currentSha256: digest("current GS root trace spec"),
            }],
          },
          selectedPilotCanonicalJsonUnchanged: true,
          topLevelAndStructureCanonicalJsonUnchanged: true,
        };
      },
    });
    const result = await validateCaptureKitStaleArchives({projectRoot: root});
    assert.equal(result.sourceDrivenBranchArchiveCount, 1);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("fails closed for a missing integrity sidecar or changed archived kit bytes", async (t) => {
  await t.test("missing sidecar", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_LEGACY);
    try {
      await rm(path.join(item.naturalSlot, NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE));
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /ENOENT/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("changed kit bytes", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    try {
      const operatorCard = path.join(item.naturalSlot, "kit/OPERATOR_CARD.md");
      await rm(operatorCard);
      await writeReadonly(operatorCard, Buffer.from("changed natural operator\n"));
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /archived kit bytes, hashes, modes, or file set differ/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("source-driven metadata mode drift", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    try {
      await chmod(path.join(item.sourceDrivenLegacy.slot, SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE), 0o644);
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /not a read-only regular file/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("source-driven archived file mode drift", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    try {
      await chmod(path.join(item.sourceDrivenCurrent.slot, "kit/kit-manifest.json"), 0o644);
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /must have mode 0444/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("source-driven symlink", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    try {
      await symlink("kit-manifest.json", path.join(item.sourceDrivenLegacy.slot, "kit/forbidden-link"));
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /forbidden symbolic link/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("source-driven record/sidecar identity drift", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    try {
      const sidecarPath = path.join(item.sourceDrivenLegacy.slot, SOURCE_DRIVEN_BRANCH_ARCHIVE_INTEGRITY_FILE);
      const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
      sidecar.requirementId = "req:sprite-21:sound-1:en";
      await rm(sidecarPath);
      await writeReadonly(sidecarPath, Buffer.from(`${canonicalJson(sidecar)}\n`));
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /record\/sidecar identity differs/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("source-driven archived file hardlink alias", async () => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    const alias = path.join(item.root, "external-archive-alias.md");
    try {
      await link(path.join(item.sourceDrivenLegacy.slot, "kit/README.md"), alias);
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /must not be hard-linked/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("source-driven archives must contain a real variant contract, not only self-consistent hashes", async (t) => {
  const withOnlyInvalidSourceArchive = async (options) => {
    const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    await rm(path.join(item.root, SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT), {recursive: true, force: true});
    const archive = await writeSourceDrivenArchive(item.root, {
      animationId: "course-g03-l06-ti-001-invalid",
      requirementId: "req:sprite-21:sound-0:en",
      fileCount: 27,
      templateVariant: "current-v3-causal-capture-contract",
      ...options,
    });
    return {...item, archive};
  };

  await t.test("rejects a self-consistent executable launcher substituted into the kit", async () => {
    const item = await withOnlyInvalidSourceArchive({
      mutateFiles: (files) => {
        files.delete("README.md");
        files.set("launch-runtime.sh", {bytes: Buffer.from("#!/bin/sh\nexit 0\n"), mode: 0o555});
      },
    });
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /must have mode 0444/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a self-consistent wrong all-read-only file set", async () => {
    const item = await withOnlyInvalidSourceArchive({
      mutateFiles: (files) => {
        const readme = files.get("README.md");
        files.delete("README.md");
        files.set("unexpected-read-only.txt", readme);
      },
    });
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /variant-specific exact file set differs/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a v3 manifest labeled with the wrong template-contract schema", async () => {
    const item = await withOnlyInvalidSourceArchive({mutateKitManifest: (manifest) => { manifest.templateContract.schemaVersion = 2; }});
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /templateContract schema must be 3/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects conflicting v3 archived/current-schema manifest identities", async () => {
    const item = await withOnlyInvalidSourceArchive({currentSchemaCaptureKitManifestSha256: digest("different current v3 manifest")});
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /current-v3 archived\/current-schema manifest identities differ/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a self-consistent but unapproved Projector executable identity", async () => {
    const item = await withOnlyInvalidSourceArchive({runtimeOverride: {executableSha256: digest("unapproved projector")}});
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /runtime identity is invalid/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a self-consistent rewritten v3 contract/module provenance pair", async () => {
    const item = await withOnlyInvalidSourceArchive({
      mutateKitManifest: (manifest) => {
        const candidate = manifest.templateContract.candidateInputContract;
        candidate.exact = structuredClone(candidate.exact);
        candidate.exact.runtimeLaunchAuthority = "rewritten-self-consistent-authority";
        candidate.sha256 = digest(Buffer.from(canonicalJson(candidate.exact)));
        candidate.module.sha256 = digest("rewritten contract module");
      },
    });
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /not an approved immutable v3 pair/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a self-consistent fake envelope in a v3 input template", async () => {
    const fakeTemplate = Buffer.from('{"template":"fake-envelope"}\n');
    const target = "templates/environment-isolation-receipt.template.json";
    const item = await withOnlyInvalidSourceArchive({
      mutateKitManifest: (manifest) => {
        manifest.templateContract.files.find(({file}) => file === target).sha256 = digest(fakeTemplate);
      },
      mutateFiles: (files) => {
        files.set(target, {bytes: fakeTemplate, mode: 0o444});
      },
    });
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /environment receipt template fields differ/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  for (const [name, suffix] of [
    ["concatenated JSON document", "{}\n"],
    ["trailing non-whitespace after JSON", "not-json\n"],
  ]) {
    await t.test(`rejects ${name} in a self-consistent .json template`, async () => {
      const target = "templates/environment-isolation-receipt.template.json";
      const item = await withOnlyInvalidSourceArchive({
        mutateTemplateFiles: (files) => {
          const original = files.get(target);
          files.set(target, {bytes: Buffer.concat([original.bytes, Buffer.from(suffix)]), mode: original.mode});
        },
      });
      try {
        await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /exactly one complete JSON document/);
      } finally {
        await rm(item.root, {recursive: true, force: true});
      }
    });
  }

  await t.test("rejects a self-consistent multiline JSONL template", async () => {
    const target = "templates/adapter-entry-log.schema.template.jsonl";
    const item = await withOnlyInvalidSourceArchive({
      mutateTemplateFiles: (files) => {
        const original = files.get(target);
        const value = JSON.parse(original.bytes.toString("utf8"));
        files.set(target, {bytes: Buffer.from(`${JSON.stringify(value, null, 2)}\n`), mode: original.mode});
      },
    });
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /exactly one nonempty physical line/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rejects a conflicting authority field hidden beside the false acceptance flags", async () => {
    const item = await withOnlyInvalidSourceArchive({mutateRecord: (record) => { record.authority.ownerAccepted = true; }});
    try {
      await assert.rejects(() => validateCaptureKitStaleArchives({projectRoot: item.root}), /archive authority fields differ/);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("reports an absent source-driven archive root as an empty read-only summary", async () => {
  const item = await createFixture(NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
  try {
    await rm(path.join(item.root, SOURCE_DRIVEN_BRANCH_STALE_ARCHIVE_ROOT), {recursive: true, force: true});
    const result = await validateCaptureKitStaleArchives({projectRoot: item.root});
    assert.equal(result.sourceDrivenBranchArchiveCount, 0);
    assert.deepEqual(result.sourceDrivenBranchArchives, []);
    assert.equal(result.totalArchiveCount, 2);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("validator CLI is read-only and exposes only project-root selection", () => {
  const options = parseArguments(["--project-root", "/tmp/example"]);
  assert.equal(options.projectRoot, "/tmp/example");
  assert.throws(() => parseArguments(["--repair"]), /Unknown option/);
  assert.match(usage(), /never writes evidence/);
});
