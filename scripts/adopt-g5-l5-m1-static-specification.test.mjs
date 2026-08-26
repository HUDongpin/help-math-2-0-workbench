import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  copyFile,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  adoptG5L5M1StaticSpecification,
  g5L5M1StaticReconciliationReceiptPath,
  parseArguments,
  readG5L5M1StaticReconciliationReceipt,
  stableJson,
  validateG5L5M1StaticReconciliationReceipt,
} from "./adopt-g5-l5-m1-static-specification.mjs";
import {
  materializeG5L5PreRuntimeSpecificationCandidates,
} from "./materialize-g5-l5-pre-runtime-specification-candidates.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const releaseId =
  "lesson-g05-l05-add-subtract-negative-numbers";

const globalCopies = [
  "catalog/lesson-releases.json",
  "reports/g5-l5-source-scope-freeze.json",
  "catalog/owner-authorizations/g5-l5-owner-governance-directive-intake-2026-07-29.json",
  "scripts/adopt-g5-l5-m1-static-specification.mjs",
  "scripts/build-g5-l5-owner-governance-directive-intake.mjs",
  "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs",
];

const acceptanceEffects = {
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
};

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeRelative(root, relativePath, bytes) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await writeFile(absolutePath, bytes);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: hash(bytes),
  };
}

async function copyRelative(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await copyFile(path.join(projectRoot, relativePath), absolutePath);
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: hash(bytes),
  };
}

function fingerprintCandidate(value) {
  const fingerprint = hash(stableJson(value));
  return {
    ...value,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

function candidateReceiptFingerprint(value) {
  const fingerprint = hash(stableJson(value));
  return {
    ...value,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

async function makeFixture(t) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "g5-l5-m1-static-reconcile-"),
  );
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const globals = Object.fromEntries(
    await Promise.all(
      globalCopies.map(async (relativePath) => [
        relativePath,
        await copyRelative(root, relativePath),
      ]),
    ),
  );
  const releaseCatalog = JSON.parse(
    await readFile(
      path.join(root, "catalog/lesson-releases.json"),
      "utf8",
    ),
  );
  const release = releaseCatalog.releases.find(
    ({releaseId: value}) => value === releaseId,
  );
  const sourceScope = JSON.parse(
    await readFile(
      path.join(root, "reports/g5-l5-source-scope-freeze.json"),
      "utf8",
    ),
  );
  const scopeById = new Map(
    sourceScope.members.map((member) => [member.animationId, member]),
  );
  const materializer =
    globals[
      "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs"
    ];
  const releaseBinding = globals["catalog/lesson-releases.json"];
  const scopeBinding =
    globals["reports/g5-l5-source-scope-freeze.json"];

  for (const member of release.members) {
    const scopeMember = scopeById.get(member.animationId);
    const workspace = `migrations/${member.animationId}`;
    const manifest = {
      schemaVersion: 2,
      id: member.animationId,
      animationId: member.animationId,
      assetId: member.assetId,
      status: "preserved",
      runtime: {
        swfSignature: scopeMember.source.swfMetadata.signature,
        swfVersion: scopeMember.source.swfMetadata.version,
        declaredFileLength: scopeMember.source.swf.bytes,
        stage: structuredClone(scopeMember.source.swfMetadata.stage),
        fps: scopeMember.source.swfMetadata.fps,
        frameCount: scopeMember.source.swfMetadata.rootFrameCount,
        durationMs: scopeMember.source.swfMetadata.durationMs,
        backgroundColor: "",
        actionScriptVersion: "unknown",
        complexity: "unknown",
        fonts: [],
        scripts: [],
        externalDependencies: [],
      },
      implementation: {
        rendering: "undecided",
        route: "",
        routeFile: "",
      },
      scenarios: [
        {
          id: "default",
          kind: "linear",
          description: "",
          reachable: true,
        },
      ],
      audio: {
        required: false,
        reasonNotRequired: "Static scaffold; audio audit pending.",
        languages: [],
        inventoryFile: "audio-inventory.csv",
        cues: [],
      },
      toolVersions: {
        ruffle: "",
        browser: "",
        ffdec: "unavailable",
        swfmill: "unavailable",
        adobeAnimate: "unavailable",
      },
    };
    const manifestBinding = await writeRelative(
      root,
      `${workspace}/migration.json`,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`),
    );
    const briefBinding = await writeRelative(
      root,
      `${workspace}/MIGRATION_BRIEF.md`,
      Buffer.from(`# ${member.animationId}\n\nTemplate brief.\n`),
    );
    const assetBinding = await writeRelative(
      root,
      `${workspace}/asset-inventory.csv`,
      Buffer.from("asset_id,source_file,sha256\n"),
    );
    const audioRows = [
      "cue_id,language,source_file,sha256,start_frame",
    ];
    if (member.ordinal === 1 || member.ordinal === 57) {
      audioRows.push(
        `embedded-0001,und,source.swf,${member.source.sha256},`,
      );
    }
    const audioBinding = await writeRelative(
      root,
      `${workspace}/audio-inventory.csv`,
      Buffer.from(`${audioRows.join("\n")}\n`),
    );
    const keyframesBinding = await writeRelative(
      root,
      `${workspace}/keyframes.csv`,
      Buffer.from("requirement_id,frame,description\n"),
    );
    const coverageBinding = await writeRelative(
      root,
      `${workspace}/evidence/full-frame-coverage.json`,
      Buffer.from("{}\n"),
    );
    const machineAudit = {
      schemaVersion: 1,
      animationId: member.animationId,
      migrationStatus: "preserved",
      migrationStatusUnchanged: true,
      findings: {},
      tools: {},
    };
    const machineAuditBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/report.json`,
      Buffer.from(stableJson(machineAudit)),
    );
    const sourceScopeRecord = {
      schemaVersion: 1,
      artifactType: "g5-l5-source-scope-binding",
      releaseId,
      scope: scopeBinding,
      member: {
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        role: scopeMember.role,
        shardId: scopeMember.shardId,
        section: scopeMember.section,
        sectionPageOrdinal: scopeMember.sectionPageOrdinal,
        source: structuredClone(scopeMember.source),
      },
      disposition: {
        runtimeReachability: "unresolved",
      },
      acceptanceEffects: {
        strictComplete: false,
        published: false,
      },
    };
    const scopeRecordBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/g5-l5-source-scope-binding.json`,
      Buffer.from(stableJson(sourceScopeRecord)),
    );

    const commonCandidate = {
      schemaVersion: 1,
      releaseId,
      animationId: member.animationId,
      assetId: member.assetId,
      generatedBy: {
        path:
          "scripts/materialize-g5-l5-pre-runtime-specification-candidates.mjs",
        version: 1,
        bytes: materializer.bytes,
        sha256: materializer.sha256,
      },
      ownership: {
        owner: "g5-l5-pre-runtime-specification-candidate-materializer",
        safeToReplaceOnlyWithThisMaterializer: true,
        canonicalFile: false,
        acceptanceEvidence: false,
      },
      acceptanceEffects,
    };
    const runtimeFacts = fingerprintCandidate({
      ...commonCandidate,
      artifactType: "g5-l5-manifest-runtime-facts-candidate",
      source: {
        model: scopeMember.source.sourceModel,
        swf: {
          path: `source-assets/flash/${scopeMember.source.swf.path}`,
          bytes: scopeMember.source.swf.bytes,
          sha256: scopeMember.source.swf.sha256,
          physicalHashVerified: true,
        },
        fla: scopeMember.source.fla
          ? {
              path: `source-assets/flash/${scopeMember.source.fla.path}`,
              bytes: scopeMember.source.fla.bytes,
              sha256: scopeMember.source.fla.sha256,
              physicalHashVerified: true,
            }
          : null,
      },
      canonicalManifestBefore: {
        actionScriptVersion: "unknown",
        backgroundColor: "",
        complexity: "unknown",
        scriptCount: 0,
        externalDependencyCount: 0,
        rendering: "undecided",
        changedByThisCandidate: false,
      },
      candidateRuntimeFacts: {
        swfSignature: scopeMember.source.swfMetadata.signature,
        swfVersion: scopeMember.source.swfMetadata.version,
        declaredUncompressedBytes: scopeMember.source.swf.bytes,
        stage: structuredClone(scopeMember.source.swfMetadata.stage),
        fps: scopeMember.source.swfMetadata.fps,
        rootFrameCount: scopeMember.source.swfMetadata.rootFrameCount,
        durationMs: scopeMember.source.swfMetadata.durationMs,
        backgroundColor: "#b8d8f7",
        actionScriptGeneration: "AS1/2",
        definitionCount: 1,
        exportedScriptFileCount: 1,
        externalCallCandidateCount: member.ordinal === 2 ? 1 : 0,
        toolVersions: {
          ffdec: {
            command: "ffdec",
            error: "",
            exitCode: 0,
            success: true,
            version: "JPEXS Free Flash Decompiler v.test",
          },
          swfmill: {
            command: "swfmill",
            error: "",
            exitCode: 0,
            success: true,
            version: "swfmill test",
          },
        },
      },
      unresolved: {
        reachableScenarios: true,
        naturalTraces: true,
        rendererSelection: true,
      },
      canonicalPatchApplied: false,
    });
    const scriptCandidate = fingerprintCandidate({
      ...commonCandidate,
      artifactType: "g5-l5-ffdec-script-inventory-candidate",
      source: {
        swf: scopeMember.source.swf.sha256,
      },
      scripts: [
        {
          scriptId: "ffdec-script-0001",
          sourcePath: "frame_1/DoAction.as",
          bytes: 8,
          lineCount: 2,
          sha256: hash("stop();\n"),
          externalApiOccurrences: [],
          naturalTrace: "unresolved",
          runtimeReachability: "unresolved",
          scenario: "unresolved",
        },
      ],
      summary: {
        canonicalManifestScriptRecordsAdded: 0,
        completeReachableScriptInventory: false,
        scriptBytes: 8,
        scriptCount: 1,
        scriptsWithExternalCallCandidates: 0,
      },
      unresolved: {
        hostAndExternalDependencySemantics: true,
        runtimeReachability: true,
        scenarioAndTraceBinding: true,
        sourceTargetSemantics: true,
      },
    });
    const hasDependency = member.ordinal === 2;
    const dependencyCandidate = fingerprintCandidate({
      ...commonCandidate,
      artifactType: "g5-l5-static-dependency-inventory-candidate",
      candidates: hasDependency
        ? [
            {
              api: "getURL",
              occurrences: 2,
              scriptIds: ["ffdec-script-0001"],
              endpointOrTarget:
                "withheld-unresolved-static-source-not-executed",
              runtimeReachability: "unresolved",
              securityDisposition: "pending-human-review",
            },
          ]
        : [],
      scanMethod:
        "Static API-name occurrence scan; no target contacted or executed.",
      noCandidateMeaning:
        "No machine candidate is not proof that runtime dependencies are absent.",
      summary: {
        apiCandidateCount: hasDependency ? 1 : 0,
        canonicalManifestDependencyRecordsAdded: 0,
        executedLegacyEndpointCount: 0,
        occurrenceCount: hasDependency ? 2 : 0,
        runtimeDependencyClearance: false,
      },
      unresolved: {
        endpointOrTarget: hasDependency,
        hostDependencyClosure: true,
        reviewedReplacementApi: true,
        runtimeReachability: true,
        securityDisposition: hasDependency,
      },
    });
    const runtimeFactsBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/manifest-runtime-facts-candidate.json`,
      Buffer.from(stableJson(runtimeFacts)),
    );
    const assetCensusBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/swf-asset-definition-census.json`,
      Buffer.from(stableJson({summary: {definitionCount: 1}})),
    );
    const definitionInventoryBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/swf-definition-inventory.csv`,
      Buffer.from("asset_id,type,source_file,sha256\n"),
    );
    const scriptCandidateBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/ffdec-script-inventory-candidate.json`,
      Buffer.from(stableJson(scriptCandidate)),
    );
    const dependencyCandidateBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/static-dependency-inventory-candidate.json`,
      Buffer.from(stableJson(dependencyCandidate)),
    );
    const briefCandidateBinding = await writeRelative(
      root,
      `${workspace}/audit/machine/migration-brief-static-prefill-candidate.md`,
      Buffer.from(`# ${member.animationId} static candidate\n`),
    );

    const receiptBase = {
      schemaVersion: 1,
      artifactType:
        "g5-l5-pre-runtime-specification-candidate-receipt",
      releaseId,
      animationId: member.animationId,
      assetId: member.assetId,
      generatedBy: commonCandidate.generatedBy,
      ownership: commonCandidate.ownership,
      inputs: {
        lessonReleaseCatalog: releaseBinding,
        sourceScopeBinding: scopeRecordBinding,
        machineAudit: machineAuditBinding,
        migrationManifest: manifestBinding,
        migrationBrief: briefBinding,
        canonicalAssetInventory: assetBinding,
        canonicalAudioInventory: audioBinding,
        canonicalKeyframes: keyframesBinding,
        canonicalCoverageV2: coverageBinding,
      },
      outputs: {
        manifestRuntimeFacts: runtimeFactsBinding,
        assetDefinitionCensus: assetCensusBinding,
        definitionInventory: definitionInventoryBinding,
        scriptInventory: {
          ...scriptCandidateBinding,
          scriptCount: 1,
        },
        dependencyInventory: {
          ...dependencyCandidateBinding,
          apiCandidateCount: hasDependency ? 1 : 0,
          occurrenceCount: hasDependency ? 2 : 0,
        },
        briefStaticPrefill: briefCandidateBinding,
      },
      canonicalFiles: {
        migrationManifest: {
          ...manifestBinding,
          changedByMaterializer: false,
        },
        migrationBrief: {
          ...briefBinding,
          changedByMaterializer: false,
        },
      },
      candidateReadiness: {},
      releaseMembership: {
        ordinal: member.ordinal,
        releaseRole: member.releaseRole,
        batchId: member.batchId,
        shardId: member.shardId,
      },
      source: {
        swf: scopeMember.source.swf,
        fla: scopeMember.source.fla,
      },
      unresolved: {
        reachableScenarios: true,
      },
      runtimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
      workspaceCanonicalFilesChanged: 0,
      sourceAssetsChanged: false,
      acceptanceEffects,
    };
    const candidateReceipt = candidateReceiptFingerprint(receiptBase);
    await writeRelative(
      root,
      `${workspace}/audit/machine/pre-runtime-specification-candidate-receipt.json`,
      Buffer.from(stableJson(candidateReceipt)),
    );
  }
  return {root, release};
}

async function pathExists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function findTemporaryFiles(root) {
  const found = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolutePath);
      else if (entry.name.includes(".g5-l5-m1.")) found.push(absolutePath);
    }
  }
  await visit(root);
  return found;
}

test("CLI modes are explicit, exclusive, and dry-run by default", () => {
  assert.deepEqual(parseArguments([]), {mode: "dry-run", help: false});
  assert.deepEqual(parseArguments(["--dry-run"]), {
    mode: "dry-run",
    help: false,
  });
  assert.deepEqual(parseArguments(["--check"]), {
    mode: "check",
    help: false,
  });
  assert.deepEqual(parseArguments(["--apply"]), {
    mode: "apply",
    help: false,
  });
  assert.deepEqual(parseArguments(["--help"]), {
    mode: "dry-run",
    help: true,
  });
  assert.deepEqual(parseArguments(["-h"]), {
    mode: "dry-run",
    help: true,
  });
  assert.throws(
    () => parseArguments(["--apply", "--check"]),
    /choose exactly one/,
  );
  assert.throws(
    () => parseArguments(["--help", "--apply"]),
    /cannot be combined/,
  );
  assert.throws(() => parseArguments(["--write"]), /unknown argument/);
});

test("real G5 L5 dry-run covers all 57 members without writing", async () => {
  const result = await adoptG5L5M1StaticSpecification({
    root: projectRoot,
    mode: "dry-run",
  });
  assert.equal(result.memberCount, 57);
  assert.equal(result.outputCount, 285);
  assert.equal(result.scriptCount, 2456);
  assert.equal(result.dependencyApiCandidateCount, 6);
  assert.equal(result.dependencyOccurrenceCount, 17);
  assert.equal(result.audioInventoryRowCount, 285);
  assert.equal(result.audioRequirementRaiseCount, 2);
  assert.equal(result.applied, false);
});

test("apply is all-member, acceptance-neutral, checkable, and survives candidate refresh", async (t) => {
  const {root, release} = await makeFixture(t);
  const before = new Map();
  for (const member of release.members) {
    const manifestPath = path.join(
      root,
      "migrations",
      member.animationId,
      "migration.json",
    );
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    before.set(member.animationId, {
      bytes: await readFile(manifestPath),
      status: manifest.status,
      languages: structuredClone(manifest.audio.languages),
      cues: structuredClone(manifest.audio.cues),
    });
  }
  const dryRun = await adoptG5L5M1StaticSpecification({
    root,
    mode: "dry-run",
  });
  assert.equal(dryRun.memberCount, 57);
  assert.equal(dryRun.outputCount, 285);
  assert.equal(dryRun.changedOutputCount, 285);
  assert.equal(dryRun.audioRequirementRaiseCount, 2);
  for (const member of release.members) {
    assert.equal(
      await pathExists(
        path.join(
          root,
          g5L5M1StaticReconciliationReceiptPath(member.animationId),
        ),
      ),
      false,
    );
  }

  const applied = await adoptG5L5M1StaticSpecification({
    root,
    mode: "apply",
  });
  assert.equal(applied.applied, true);
  assert.equal(applied.changedOutputCount, 285);
  let raised = 0;
  for (const member of release.members) {
    const workspace = path.join(root, "migrations", member.animationId);
    const manifest = JSON.parse(
      await readFile(path.join(workspace, "migration.json"), "utf8"),
    );
    assert.equal(manifest.status, before.get(member.animationId).status);
    assert.equal(manifest.runtime.backgroundColor, "#b8d8f7");
    assert.equal(manifest.runtime.actionScriptVersion, "AS1/2");
    assert.equal(manifest.runtime.complexity, "unknown");
    assert.equal(manifest.runtime.scripts.length, 1);
    assert.equal(
      manifest.runtime.scripts[0].completeReachableInventory,
      false,
    );
    assert.equal(
      manifest.runtime.scripts[0].runtimeReachability,
      "unresolved",
    );
    assert.deepEqual(manifest.runtime.externalDependencies, []);
    assert.equal(manifest.implementation.rendering, "undecided");
    assert.equal(manifest.implementation.route, "");
    assert.equal(manifest.implementation.routeFile, "");
    assert.ok(
      manifest.scenarios.every(({description}) => description === ""),
    );
    assert.deepEqual(
      manifest.audio.languages,
      before.get(member.animationId).languages,
    );
    assert.deepEqual(
      manifest.audio.cues,
      before.get(member.animationId).cues,
    );
    if (manifest.audio.required) {
      raised += 1;
      assert.equal(manifest.audio.reasonNotRequired, "");
    }
    assert.equal(
      manifest.toolVersions.ffdec,
      "JPEXS Free Flash Decompiler v.test",
    );
    assert.equal(manifest.toolVersions.swfmill, "swfmill test");

    const scriptInventory = JSON.parse(
      await readFile(path.join(workspace, "audit/script-inventory.json")),
    );
    const dependencyInventory = JSON.parse(
      await readFile(
        path.join(workspace, "audit/dependency-inventory.json"),
      ),
    );
    assert.equal(
      scriptInventory.summary.completeReachableScriptInventory,
      false,
    );
    assert.equal(
      scriptInventory.summary.runtimeReachabilityResolved,
      false,
    );
    assert.equal(
      dependencyInventory.summary.runtimeDependencyClearance,
      false,
    );
    assert.equal(dependencyInventory.unresolved.endpointOrTarget, true);
    assert.equal(dependencyInventory.unresolved.securityDisposition, true);
    assert.equal(
      dependencyInventory.execution.legacyEndpointsExecuted,
      0,
    );
    assert.ok(
      Object.values(scriptInventory.acceptanceEffects).every(
        (value) => value === false,
      ),
    );
    assert.ok(
      Object.values(dependencyInventory.acceptanceEffects).every(
        (value) => value === false,
      ),
    );

    const receiptRecord =
      await readG5L5M1StaticReconciliationReceipt({
        root,
        animationId: member.animationId,
        member,
      });
    validateG5L5M1StaticReconciliationReceipt(
      receiptRecord.receipt,
      member,
    );
    assert.equal(
      receiptRecord.receipt.inputBindingSemantics.candidateArtifacts,
      "historical-at-adoption-do-not-require-current-path-byte-identity",
    );
    assert.equal(Object.keys(receiptRecord.postOutputs).length, 4);
  }
  assert.equal(raised, 2);

  const checked = await adoptG5L5M1StaticSpecification({
    root,
    mode: "check",
  });
  assert.equal(checked.changedOutputCount, 0);
  assert.equal(checked.audioRequirementRaiseCount, 2);
  const historicalCandidates =
    await materializeG5L5PreRuntimeSpecificationCandidates({
      root,
      check: true,
    });
  assert.equal(historicalCandidates.mode, "checked-historical");
  assert.equal(historicalCandidates.summary.memberCount, 57);
  assert.equal(historicalCandidates.summary.outputCount, 399);
  assert.equal(historicalCandidates.summary.staticReconciliationCount, 57);
  await assert.rejects(
    materializeG5L5PreRuntimeSpecificationCandidates({root}),
    /immutable historical pre-adoption evidence/,
  );

  const refreshedMember = release.members[0];
  const machine = path.join(
    root,
    "migrations",
    refreshedMember.animationId,
    "audit/machine",
  );
  for (const filename of [
    "pre-runtime-specification-candidate-receipt.json",
    "manifest-runtime-facts-candidate.json",
    "ffdec-script-inventory-candidate.json",
    "static-dependency-inventory-candidate.json",
    "migration-brief-static-prefill-candidate.md",
  ]) {
    await writeFile(
      path.join(machine, filename),
      Buffer.from(`refreshed downstream candidate: ${filename}\n`),
    );
  }
  const checkedAfterRefresh = await adoptG5L5M1StaticSpecification({
    root,
    mode: "check",
  });
  assert.equal(checkedAfterRefresh.changedOutputCount, 0);
  await assert.rejects(
    materializeG5L5PreRuntimeSpecificationCandidates({
      root,
      check: true,
    }),
    /historical .* differs from its static reconciliation receipt/,
  );
});

test("all 57 members preflight before any output is written", async (t) => {
  const {root, release} = await makeFixture(t);
  const first = release.members[0];
  const last = release.members.at(-1);
  const firstManifest = path.join(
    root,
    "migrations",
    first.animationId,
    "migration.json",
  );
  const before = await readFile(firstManifest);
  await writeFile(
    path.join(
      root,
      "migrations",
      last.animationId,
      "audit/machine/manifest-runtime-facts-candidate.json",
    ),
    "{}\n",
  );
  await assert.rejects(
    adoptG5L5M1StaticSpecification({root, mode: "apply"}),
    /candidate fingerprint is invalid|identity drifted|binding does not match current bytes/,
  );
  assert.deepEqual(await readFile(firstManifest), before);
  for (const member of release.members) {
    assert.equal(
      await pathExists(
        path.join(
          root,
          g5L5M1StaticReconciliationReceiptPath(member.animationId),
        ),
      ),
      false,
    );
  }
});

test("symlinks, hardlinks, and symlink ancestors fail closed", async (t) => {
  const {root, release} = await makeFixture(t);
  const first = release.members[0];
  const second = release.members[1];
  const firstMachine = path.join(
    root,
    "migrations",
    first.animationId,
    "audit/machine",
  );
  const firstCandidate = path.join(
    firstMachine,
    "manifest-runtime-facts-candidate.json",
  );
  const firstBrief = path.join(
    firstMachine,
    "migration-brief-static-prefill-candidate.md",
  );
  await unlink(firstBrief);
  await symlink(
    "manifest-runtime-facts-candidate.json",
    firstBrief,
  );
  await assert.rejects(
    adoptG5L5M1StaticSpecification({root, mode: "dry-run"}),
    /ordinary single-link file/,
  );
  await unlink(firstBrief);
  await writeFile(firstBrief, `# ${first.animationId} static candidate\n`);

  const secondCandidate = path.join(
    root,
    "migrations",
    second.animationId,
    "audit/machine/manifest-runtime-facts-candidate.json",
  );
  await unlink(secondCandidate);
  await link(firstCandidate, secondCandidate);
  await assert.rejects(
    adoptG5L5M1StaticSpecification({root, mode: "dry-run"}),
    /ordinary single-link file/,
  );
  await unlink(secondCandidate);
  await copyFile(
    path.join(
      projectRoot,
      "migrations",
      second.animationId,
      "audit/machine/manifest-runtime-facts-candidate.json",
    ),
    secondCandidate,
  ).catch(async () => {
    await writeFile(secondCandidate, "{}\n");
  });

  const last = release.members.at(-1);
  const lastWorkspace = path.join(
    root,
    "migrations",
    last.animationId,
  );
  const audit = path.join(lastWorkspace, "audit");
  const auditReal = path.join(lastWorkspace, "audit-real");
  await rename(audit, auditReal);
  await symlink("audit-real", audit);
  await assert.rejects(
    adoptG5L5M1StaticSpecification({root, mode: "dry-run"}),
    /ancestor must be an ordinary directory/,
  );
});

test("late transaction failure rolls every member back", async (t) => {
  const {root, release} = await makeFixture(t);
  const preimages = new Map();
  for (const member of release.members) {
    const workspace = path.join(root, "migrations", member.animationId);
    preimages.set(member.animationId, {
      migration: await readFile(path.join(workspace, "migration.json")),
      brief: await readFile(path.join(workspace, "MIGRATION_BRIEF.md")),
    });
  }
  await assert.rejects(
    adoptG5L5M1StaticSpecification({
      root,
      mode: "apply",
      transactionHooks: {
        afterCommit({index}) {
          if (index === 280) {
            throw new Error("injected late commit failure");
          }
        },
      },
    }),
    /injected late commit failure/,
  );
  for (const member of release.members) {
    const workspace = path.join(root, "migrations", member.animationId);
    assert.deepEqual(
      await readFile(path.join(workspace, "migration.json")),
      preimages.get(member.animationId).migration,
    );
    assert.deepEqual(
      await readFile(path.join(workspace, "MIGRATION_BRIEF.md")),
      preimages.get(member.animationId).brief,
    );
    for (const relativePath of [
      "audit/script-inventory.json",
      "audit/dependency-inventory.json",
      `audit/machine/${path.basename(
        g5L5M1StaticReconciliationReceiptPath(member.animationId),
      )}`,
    ]) {
      assert.equal(
        await pathExists(path.join(workspace, relativePath)),
        false,
      );
    }
  }
  assert.deepEqual(await findTemporaryFiles(root), []);
});
