import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  link,
  mkdtemp,
  mkdir,
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

import {collectSwfAssetDefinitions} from "./build-g4-l3-swf-asset-definition-census.mjs";
import {
  G5_L4_RELEASE_ID,
  G5_L4_WORK_STUDY_SPECIFICATION_IDS,
  materializeG5L4WorkStudySpecificationInventories,
  renderMachineDefinitionInventory,
  selectG5L4WorkStudySpecificationMembers,
} from "./materialize-g5-l4-work-study-specification-inventories.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

function csvCandidate(template, values) {
  const headers = template.toString("utf8").trimEnd().split(",");
  return Buffer.from(
    `${headers.join(",")}\n${headers.map((header) => values[header] ?? "").join(",")}\n`,
  );
}

const assetAcceptanceEffects = Object.freeze({
  authoritativeOriginalRuntime: false,
  currentJavaScriptCandidate: false,
  implementationAuthorized: false,
  fidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

const keyframeAcceptanceEffects = Object.freeze({
  authoritativeOriginalRuntime: false,
  authoritativeBaselineKeyframes: false,
  runtimeReachabilityEstablished: false,
  interactionCausalityEstablished: false,
  audioAccepted: false,
  bilingualAccepted: false,
  currentJavaScriptAccepted: false,
  fidelityAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

function assetSuccessorReceipt(member, output) {
  const unsigned = {
    schemaVersion: 1,
    artifactType: "g5-l4-source-derived-asset-inventory-candidate-receipt",
    releaseId: G5_L4_RELEASE_ID,
    animationId: member.animationId,
    assetId: member.assetId,
    generatedBy: {
      path: "scripts/materialize-g5-l4-source-derived-asset-inventories.mjs",
      version: 1,
      bytes: 1,
      sha256: "a".repeat(64),
    },
    ownership: {
      owner: "g5-l4-source-derived-asset-inventory-materializer",
      safeToReplaceOnlyWithThisMaterializer: true,
      canonicalCandidateFile: true,
      acceptanceEvidence: false,
    },
    output: {
      assetInventory: {...output, rowCount: 1},
    },
    projection: {
      oneRowPerMachineDefinition: true,
      sourceDefinitionCandidateCount: 1,
      sharedDefinitionIndexBindingOnly: true,
      rendererAssetExportCount: 0,
      authoritativeBaselineRowCount: 0,
      runtimePlacementDispositionCount: 0,
      assetUsageDispositionCount: 0,
      visualConfirmationCount: 0,
      rendererReadyAssetCount: 0,
      finalAssetSpecificationComplete: false,
    },
    sourceAssetsChanged: false,
    migrationManifestChanged: false,
    originalRuntimeEvidenceChanged: false,
    humanReviewChanged: false,
    ownerReviewChanged: false,
    completionLedgerChanged: false,
    lessonReleaseLedgerChanged: false,
    strictAcceptanceEffect: "none",
    acceptanceEffects: assetAcceptanceEffects,
  };
  const fingerprint = sha256(Buffer.from(`${JSON.stringify(unsigned, null, 2)}\n`));
  return {
    ...unsigned,
    artifactFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

function keyframeSuccessorReceipt(release, keyframeOutputs, template) {
  const before = {
    bytes: template.length,
    sha256: sha256(template),
  };
  const unsigned = {
    schemaVersion: 1,
    receiptType: "g5-l4-source-derived-keyframe-candidate-successor-receipt",
    releaseId: G5_L4_RELEASE_ID,
    scope: {
      memberCount: 55,
      managedKeyframeCsvCount: 55,
      g4FilesChanged: 0,
      assetInventoryFilesChanged: 0,
    },
    members: release.members.map((member, index) => {
      const after = keyframeOutputs.get(member.animationId) || {
        path: `migrations/${member.animationId}/keyframes.csv`,
        bytes: 1,
        sha256: sha256(Buffer.from(`filler-${index}`)),
      };
      return {
        animationId: member.animationId,
        assetId: member.assetId,
        output: {
          path: after.path,
          before: {
            path: after.path,
            ...before,
          },
          after,
        },
        derivation: {
          rowCount: 1,
          authoritativeBaselineKeyframeCount: 0,
          observedRuntimeRowCount: 0,
        },
      };
    }),
    summary: {
      authoritativeBaselineKeyframeCount: 0,
      observedRuntimeRowCount: 0,
    },
    execution: {
      originalRuntimeSessionsExecuted: 0,
      guiApplicationsLaunched: 0,
      legacyEndpointsExecuted: 0,
    },
    predecessorPolicy: {historicalM1ReceiptsRewritten: false},
    staleCascade: {historicalArtifactsRewritten: false},
    acceptanceEffects: keyframeAcceptanceEffects,
  };
  const fingerprint = sha256(
    Buffer.from(`${JSON.stringify(stable(unsigned), null, 2)}\n`),
  );
  return {
    ...unsigned,
    receiptFingerprintSha256: fingerprint,
    generatedMarker: `sha256:${fingerprint}`,
  };
}

async function write(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  const bytes = Buffer.isBuffer(value)
    ? value
    : Buffer.from(typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  await writeFile(absolutePath, bytes);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

function minimalSwf(characterId, frameCount = 1) {
  const tail = Buffer.from([
    0x08, 0x00,
    0x00, 0x0c,
    frameCount & 0xff, (frameCount >> 8) & 0xff,
    0x82, 0x00,
    characterId & 0xff, (characterId >> 8) & 0xff,
    0x00, 0x00,
  ]);
  const bytes = Buffer.alloc(8 + tail.length);
  bytes.write("FWS", 0, "ascii");
  bytes[3] = 6;
  bytes.writeUInt32LE(bytes.length, 4);
  tail.copy(bytes, 8);
  return bytes;
}

function pendingReview() {
  return {decision: "pending", reviewer: "", reviewedAt: ""};
}

function releaseDocument(targetMembers) {
  const filler = Array.from({length: 51}, (_, index) => ({
    ordinal: index + 5,
    animationId: `filler-${String(index + 1).padStart(2, "0")}`,
    assetId: `swf-${"0".repeat(62)}${String(index % 100).padStart(2, "0")}`,
    releaseRole: "active-xml-referenced-page",
    batchId: "fixture",
    shardId: "fixture",
    source: {
      path: `fixture/filler-${index + 1}.swf`,
      sha256: `${"0".repeat(62)}${String(index % 100).padStart(2, "0")}`,
    },
  }));
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: G5_L4_RELEASE_ID,
      publicationMode: "atomic",
      expectedCounts: {members: 55},
      members: [...targetMembers, ...filler],
    }],
  };
}

function calibrationDocument() {
  return {
    schemaVersion: 1,
    calibrationSets: [{
      releaseId: G5_L4_RELEASE_ID,
      members: G5_L4_WORK_STUDY_SPECIFICATION_IDS.map((animationId) => ({animationId})),
      humanWorkStudy: {
        memberAnimationIds: [...G5_L4_WORK_STUDY_SPECIFICATION_IDS],
      },
    }],
  };
}

async function makeFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "g5-l4-specification-inventory-"));
  t.after(async () => rm(root, {recursive: true, force: true}));
  const [assetTemplate, keyframeTemplate] = await Promise.all([
    readFile(path.join(projectRoot, "templates/flash-migration/asset-inventory.csv")),
    readFile(path.join(projectRoot, "templates/flash-migration/keyframes.csv")),
  ]);
  await write(root, "templates/flash-migration/asset-inventory.csv", assetTemplate);
  await write(root, "templates/flash-migration/keyframes.csv", keyframeTemplate);

  const targetMembers = [];
  const assetCandidates = new Map();
  const keyframeCandidates = new Map();
  const keyframeOutputs = new Map();
  for (const [index, animationId] of G5_L4_WORK_STUDY_SPECIFICATION_IDS.entries()) {
    const frameCount = animationId.startsWith("shell-") ? 2 : 1;
    const shortSourcePath = `HELP_COURSES/ELMGR5/L4/fixture-${index + 1}.swf`;
    const sourcePath = `source-assets/flash/${shortSourcePath}`;
    const sourceBytes = minimalSwf(index + 1, frameCount);
    const source = await write(root, sourcePath, sourceBytes);
    const assetId = `swf-${source.sha256}`;
    const paired = index >= 2;
    let fla = null;
    if (paired) {
      fla = await write(root, `source-assets/flash/HELP_COURSES/ELMGR5/L4/fixture-${index + 1}.fla`,
        Buffer.from(`fixture-fla-${index + 1}`));
    }
    const member = {
      ordinal: index + 1,
      animationId,
      assetId,
      releaseRole: animationId.startsWith("shell-") ? "course-shell" : "active-xml-referenced-page",
      batchId: "fixture",
      shardId: "fixture",
      source: {path: shortSourcePath, sha256: source.sha256},
    };
    targetMembers.push(member);
    const workspace = `migrations/${animationId}`;
    const manifest = {
      schemaVersion: 1,
      animationId,
      assetId,
      status: "draft",
      source: {
        swf: sourcePath,
        swfSha256: source.sha256,
        fla: fla?.path || "",
        flaSha256: fla?.sha256 || "",
        pairedFlaStatus: paired ? "present" : "missing",
      },
      runtime: {
        stage: {width: 800, height: 600},
        fps: 12,
        frameCount,
      },
      scenarios: [{id: "default", kind: "linear", reachable: true}],
      localization: {languages: ["en", "es"]},
      acceptance: {
        engineeringReview: pendingReview(),
        humanVisualReview: pendingReview(),
        ownerReview: pendingReview(),
      },
    };
    await write(root, `${workspace}/migration.json`, manifest);
    const assetCandidate = csvCandidate(assetTemplate, {
      asset_id: "swf-definition-00001",
      swf_character_id: String(index + 1),
      type: "shape",
      source_file: sourcePath,
      exported_file: `${workspace}/audit/machine/swf-definition-inventory.csv`,
      sha256: source.sha256,
      format: "machine-definition",
      transformation: "none",
      confidence: "machine-extracted-definition",
      license_or_provenance: "owner-provided-source",
      notes: "candidate-only",
    });
    const keyframeCandidate = csvCandidate(keyframeTemplate, {
      frame: "1",
      requirement_id: `req-default-root-en`,
      frame_domain_id: "root",
      trace_id: "default-root-en",
      entry_state_sha256: sha256(Buffer.from(`${animationId}:en`)),
      time_ms: "0",
      scenario: "default",
      language: "en",
      kind: "source-static-candidate",
      expected_state: "pending structural anchor",
      trigger: "source-derived",
      timing_result: "pending",
      visual_result: "pending",
      evidence_source: "static-source-only",
      notes: "not observed runtime",
    });
    const assetOutput = await write(
      root,
      `${workspace}/asset-inventory.csv`,
      assetCandidate,
    );
    const keyframeOutput = await write(
      root,
      `${workspace}/keyframes.csv`,
      keyframeCandidate,
    );
    assetCandidates.set(animationId, assetCandidate);
    keyframeCandidates.set(animationId, keyframeCandidate);
    keyframeOutputs.set(animationId, keyframeOutput);
    await write(
      root,
      `${workspace}/audit/machine/g5-l4-source-derived-asset-inventory-candidate-receipt.json`,
      assetSuccessorReceipt(member, assetOutput),
    );
    await write(root, `${workspace}/audit/machine/g5-l4-source-scope-binding.json`, {
      schemaVersion: 1,
      artifactType: "g5-l4-source-scope-binding",
      releaseId: G5_L4_RELEASE_ID,
      member: {
        animationId,
        assetId,
        source: {
          swf: {path: shortSourcePath, bytes: source.bytes, sha256: source.sha256},
          fla: fla ? {path: fla.path, bytes: fla.bytes, sha256: fla.sha256} : null,
          sourceModel: paired ? "paired-fla-and-shipped-swf" : "shipped-swf-only",
        },
      },
    });
    const machineOutput = await write(root, `${workspace}/audit/machine/ffdec-header.txt`,
      `fixture-${animationId}\n`);
    await write(root, `${workspace}/audit/machine/report.json`, {
      schemaVersion: 1,
      animationId,
      source: {
        expectedSha256: source.sha256,
        observedSha256Before: source.sha256,
        observedSha256After: source.sha256,
        hashMatches: true,
      },
      outputs: [{
        path: "audit/machine/ffdec-header.txt",
        format: "text",
        bytes: machineOutput.bytes,
        sha256: machineOutput.sha256,
      }],
    });
    await write(root, `${workspace}/audit/machine/swf-frame-domain-candidates.json`, {
      schemaVersion: 1,
      artifactType: "swf-frame-domain-candidates",
      animationId,
      source: {path: sourcePath, sha256: source.sha256},
      root: {frameCount},
      summary: {
        nestedDefinitionCount: index + 1,
        unresolvedReachabilityCount: index + 1,
        completeRootReachableDomainInventory: false,
      },
    });
    await write(root, `${workspace}/audit/scenario-inventory.json`, {
      schemaVersion: 1,
      animationId,
      inventoryStatus: "static-exhaustive-runtime-unverified",
      authoritativeRuntimeEvidence: [],
      migrationStatusChanged: false,
      strictAcceptanceEffect: "none; fixture",
    });
    const requirements = ["en", "es"].map((language) => ({
      requirementId: `req-default-root-${language}`,
      scenario: "default",
      frameDomainId: "root",
      traceId: `default-root-${language}`,
      language,
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: frameCount},
      entryStateSha256: sha256(Buffer.from(`${animationId}:${language}`)),
      baselineAuthority: "unresolved",
      status: "pending",
      capturedFrameCount: 0,
      missingFrames: Array.from(
        {length: frameCount},
        (_, frameIndex) => frameIndex + 1,
      ),
      baselineCaptureManifest: "",
      baselineCaptureManifestSha256: "",
      captureManifest: "",
      captureManifestSha256: "",
      metricsFile: "",
      metricsSha256: "",
    }));
    await write(root, `${workspace}/evidence/full-frame-coverage.json`, {
      schemaVersion: 2,
      animationId,
      requirements,
    });
    await write(root, `${workspace}/audit/strict-readiness.json`, {
      schemaVersion: 3,
      evidenceKind: "course-shell-strict-readiness",
      releaseId: G5_L4_RELEASE_ID,
      animationId,
      runtimeAcquisitionReadiness: {runtimeSessionsExecuted: 0},
      implementationReadiness: {
        implementationAuthorized: false,
        currentJavaScriptCandidate: false,
        rendererSelected: false,
        routeDeclared: false,
        fullFrameComparisonAccepted: false,
      },
      review: {
        independentEngineeringReview: {...pendingReview(), signatureEnvelope: null},
        humanVisualReview: {...pendingReview(), signatureEnvelope: null},
        ownerReview: {...pendingReview(), signatureEnvelope: null},
      },
      acceptance: {
        acceptanceNeutral: true,
        originalRuntimeAccepted: false,
        audioAccepted: false,
        rmseAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
        published: false,
      },
      strictAcceptanceEffect: "none; fixture",
    });
  }
  const release = releaseDocument(targetMembers);
  await write(root, "catalog/lesson-releases.json", release);
  await write(root, "catalog/lesson-release-calibration-sets.json", calibrationDocument());
  await write(
    root,
    "reports/g5-l4-source-derived-keyframe-candidate-successor-receipt.json",
    keyframeSuccessorReceipt(release.releases[0], keyframeOutputs, keyframeTemplate),
  );
  return {
    root,
    assetTemplate,
    keyframeTemplate,
    assetCandidates,
    keyframeCandidates,
  };
}

function generatedOutputPaths(root) {
  return G5_L4_WORK_STUDY_SPECIFICATION_IDS.flatMap((animationId) => {
    const machine = path.join(root, "migrations", animationId, "audit", "machine");
    return [
      path.join(machine, "swf-asset-definition-census.json"),
      path.join(machine, "swf-definition-inventory.csv"),
      path.join(machine, "specification-inventory-readiness.json"),
    ];
  });
}

async function assertNoTransactionStages(root) {
  const entries = await readdir(path.join(root, "migrations"), {recursive: true});
  assert.equal(entries.some((entry) =>
    String(entry).includes(".desired-") || String(entry).includes(".backup-")), false);
}

test("selection is exact-release scoped and preserves the approved four-target order", () => {
  const members = G5_L4_WORK_STUDY_SPECIFICATION_IDS.map((animationId, index) => ({
    ordinal: index + 1,
    animationId,
    assetId: `swf-${String(index + 1).repeat(64).slice(0, 64)}`,
    source: {path: `${animationId}.swf`, sha256: String(index + 1).repeat(64).slice(0, 64)},
  }));
  const selected = selectG5L4WorkStudySpecificationMembers(
    releaseDocument(members),
    calibrationDocument(),
  );
  assert.deepEqual(selected.members.map(({animationId}) => animationId),
    G5_L4_WORK_STUDY_SPECIFICATION_IDS);

  const moved = releaseDocument(members);
  moved.releases[0].members[0].animationId = "moved-out";
  assert.throws(
    () => selectG5L4WorkStudySpecificationMembers(moved, calibrationDocument()),
    /is not a lesson-g05-l04-number-lines member/,
  );
});

test("machine inventory records exact static definitions without pretending they are exports", () => {
  const parsed = collectSwfAssetDefinitions(minimalSwf(7));
  const census = {
    definitions: parsed.definitions,
    fontFacts: parsed.fontFacts,
  };
  const rendered = renderMachineDefinitionInventory("source-assets/fixture.swf", census);
  const lines = rendered.trimEnd().split("\n");
  assert.equal(lines.length, 2);
  assert.match(lines[1], /swf-definition-00001,7,,shape/);
  assert.match(lines[1], /machine-extracted-definition/);
  assert.match(lines[1], /runtime reachability.*remain unresolved/);
});

test("materializer writes only machine audit outputs and preserves both canonical CSVs", async (t) => {
  const fixture = await makeFixture(t);
  const result = await materializeG5L4WorkStudySpecificationInventories({root: fixture.root});
  assert.equal(result.targetCount, 4);
  assert.equal(result.outputCount, 12);
  assert.equal(result.canonicalFilesChanged, false);
  assert.equal(result.runtimeSessionsExecuted, 0);
  assert.equal(result.implementationAuthorized, false);
  assert.equal(result.strictComplete, false);
  assert.equal(result.published, false);

  for (const animationId of G5_L4_WORK_STUDY_SPECIFICATION_IDS) {
    const workspace = path.join(fixture.root, "migrations", animationId);
    assert.deepEqual(await readFile(path.join(workspace, "asset-inventory.csv")),
      fixture.assetCandidates.get(animationId));
    assert.deepEqual(await readFile(path.join(workspace, "keyframes.csv")),
      fixture.keyframeCandidates.get(animationId));
    const receipt = JSON.parse(await readFile(
      path.join(workspace, "audit/machine/specification-inventory-readiness.json"),
      "utf8",
    ));
    assert.equal(receipt.schemaVersion, 2);
    assert.equal(receipt.canonicalFiles.assetInventory.rowCount, 1);
    assert.equal(receipt.canonicalFiles.keyframes.rowCount, 1);
    assert.equal(receipt.canonicalFiles.assetInventory.sourceDerivedCandidateOnly, true);
    assert.equal(receipt.canonicalFiles.keyframes.sourceDerivedCandidateOnly, true);
    assert.equal(receipt.canonicalFiles.assetInventory.changedByMaterializer, false);
    assert.equal(receipt.canonicalFiles.keyframes.changedByMaterializer, false);
    assert.equal(receipt.readiness.assetInventoryFinalSpecificationComplete, false);
    assert.equal(receipt.readiness.keyframesFinalSpecificationComplete, false);
    assert.ok(Object.values(receipt.acceptance).every((value) => value === false));
    assert.equal(receipt.strictAcceptanceEffect, "none");
  }

  const checked = await materializeG5L4WorkStudySpecificationInventories({
    root: fixture.root,
    check: true,
  });
  assert.equal(checked.mode, "checked");
});

test("materializer fails closed on canonical invention, promotion, and linked source input", async (t) => {
  const first = await makeFixture(t);
  const firstId = G5_L4_WORK_STUDY_SPECIFICATION_IDS[0];
  await writeFile(
    path.join(first.root, "migrations", firstId, "keyframes.csv"),
    `${first.keyframeCandidates.get(firstId).toString("utf8")}1,invented\n`,
  );
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: first.root}),
    /canonical keyframes: row .* fields|keyframe successor does not bind/,
  );

  const second = await makeFixture(t);
  const strictPath = path.join(second.root, "migrations", firstId, "audit/strict-readiness.json");
  const strict = JSON.parse(await readFile(strictPath, "utf8"));
  strict.acceptance.ownerAccepted = true;
  await writeFile(strictPath, `${JSON.stringify(strict, null, 2)}\n`);
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: second.root}),
    /strict-readiness acceptance\.ownerAccepted must remain false/,
  );

  const third = await makeFixture(t);
  const manifestPath = path.join(third.root, "migrations", firstId, "migration.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const sourcePath = path.join(third.root, manifest.source.swf);
  const externalPath = path.join(third.root, "external-source.swf");
  await writeFile(externalPath, minimalSwf(1, 2));
  await unlink(sourcePath);
  await symlink(externalPath, sourcePath);
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: third.root}),
    /physical SWF must be an ordinary file/,
  );
});

test("materializer rejects symlink and hardlink output targets plus a symlinked output ancestor", async (t) => {
  const first = await makeFixture(t);
  const firstId = G5_L4_WORK_STUDY_SPECIFICATION_IDS[0];
  const firstMachine = path.join(first.root, "migrations", firstId, "audit", "machine");
  const censusPath = path.join(firstMachine, "swf-asset-definition-census.json");
  const symlinkBacking = path.join(first.root, "symlink-output-backing.json");
  await writeFile(symlinkBacking, "{}\n");
  await symlink(symlinkBacking, censusPath);
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: first.root}),
    /output must be an ordinary file: .*swf-asset-definition-census\.json/,
  );

  const second = await makeFixture(t);
  const secondMachine = path.join(second.root, "migrations", firstId, "audit", "machine");
  const hardlinkBacking = path.join(second.root, "hardlink-output-backing.json");
  await writeFile(hardlinkBacking, "{}\n");
  await link(hardlinkBacking, path.join(secondMachine, "swf-asset-definition-census.json"));
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: second.root}),
    /output must not have multiple hard links: .*swf-asset-definition-census\.json/,
  );

  const third = await makeFixture(t);
  const thirdAudit = path.join(third.root, "migrations", firstId, "audit");
  await rename(path.join(thirdAudit, "machine"), path.join(thirdAudit, "machine-real"));
  await symlink("machine-real", path.join(thirdAudit, "machine"));
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({root: third.root}),
    /output parent must be a real directory: .*audit\/machine/,
  );
});

test("later commit failure removes every earlier new output and cleans all stages", async (t) => {
  const fixture = await makeFixture(t);
  let stagedOutputCount = 0;
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({
      root: fixture.root,
      transactionHooks: {
        afterStage: async ({outputs}) => {
          stagedOutputCount = outputs.length;
          assert.equal(outputs.length, 12);
          assert.ok(outputs.every(({desiredStage}) => desiredStage.path));
          assert.ok(outputs.every(({backupStage}) => backupStage === null));
        },
        beforeCommit: async ({index}) => {
          if (index === 5) throw new Error("injected later commit failure");
        },
      },
    }),
    /injected later commit failure/,
  );
  assert.equal(stagedOutputCount, 12);
  for (const outputPath of generatedOutputPaths(fixture.root)) {
    await assert.rejects(readFile(outputPath), {code: "ENOENT"});
  }
  await assertNoTransactionStages(fixture.root);
});

test("later commit failure restores all prior bytes from pre-staged backups", async (t) => {
  const fixture = await makeFixture(t);
  await materializeG5L4WorkStudySpecificationInventories({root: fixture.root});
  const outputPaths = generatedOutputPaths(fixture.root);
  const before = new Map(await Promise.all(outputPaths.map(async (outputPath) =>
    [outputPath, await readFile(outputPath)])));
  let stagedBackupCount = 0;
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({
      root: fixture.root,
      transactionHooks: {
        afterStage: async ({outputs}) => {
          stagedBackupCount = outputs.filter(({backupStage}) => backupStage?.path).length;
          assert.equal(stagedBackupCount, 12);
        },
        beforeCommit: async ({index}) => {
          if (index === 8) throw new Error("injected ninth-output commit failure");
        },
      },
    }),
    /injected ninth-output commit failure/,
  );
  assert.equal(stagedBackupCount, 12);
  for (const outputPath of outputPaths) {
    assert.deepEqual(await readFile(outputPath), before.get(outputPath));
  }
  await assertNoTransactionStages(fixture.root);
});

test("CAS recheck detects post-staging target mutation before the first commit", async (t) => {
  const fixture = await makeFixture(t);
  await materializeG5L4WorkStudySpecificationInventories({root: fixture.root});
  let mutatedPath = "";
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({
      root: fixture.root,
      transactionHooks: {
        afterStage: async ({outputs}) => {
          mutatedPath = outputs[0].absolutePath;
          await writeFile(mutatedPath, "concurrent mutation\n");
        },
      },
    }),
    /output (identity|bytes) changed during transaction preparation/,
  );
  assert.equal((await readFile(mutatedPath, "utf8")), "concurrent mutation\n");
  await assertNoTransactionStages(fixture.root);
});

test("rollback failures are surfaced as AggregateError details", async (t) => {
  const fixture = await makeFixture(t);
  await materializeG5L4WorkStudySpecificationInventories({root: fixture.root});
  await assert.rejects(
    materializeG5L4WorkStudySpecificationInventories({
      root: fixture.root,
      transactionHooks: {
        beforeCommit: async ({index}) => {
          if (index === 2) throw new Error("injected third-output commit failure");
        },
        beforeRollback: async ({rollbackIndex}) => {
          if (rollbackIndex === 0) throw new Error("injected rollback failure");
        },
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.message, /1 rollback failure\(s\).*were surfaced/);
      assert.ok(error.errors.some((item) => /injected third-output commit failure/.test(item.message)));
      assert.ok(error.errors.some((item) =>
        /rollback failed.*staged prior-byte backup retained.*injected rollback failure/.test(item.message)));
      return true;
    },
  );
  const entries = await readdir(path.join(fixture.root, "migrations"), {recursive: true});
  assert.ok(entries.some((entry) => String(entry).includes(".backup-")));
});
