import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {canonicalJson} from "./build-course-trace-specs.mjs";
import {
  materializeReleaseSourceEvidencedCoverageV2,
  parseArguments,
  validateCoveragePreimage,
} from "./materialize-release-source-evidenced-coverage-v2.mjs";

const RELEASE_ID = "lesson-fixture-source-coverage";
const SOURCE_PREFIX =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const CAPTURE_CONTRACT = {
  frameParameter: "frame",
  frameDomainParameter: "frameDomain",
  requirementIdParameter: "requirementId",
  traceParameter: "trace",
  entryStateSha256Parameter: "entryStateSha256",
  scenarioParameter: "scenario",
  languageParameter: "lang",
  seedParameter: "seed",
  frameAttribute: "data-flash-frame",
  animationIdAttribute: "data-animation-id",
  frameDomainAttribute: "data-flash-frame-domain",
  requirementIdAttribute: "data-flash-requirement-id",
  traceAttribute: "data-flash-trace-id",
  entryStateSha256Attribute: "data-flash-entry-state-sha256",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJson(file, value) {
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, pretty(value));
}

function manifestFor({id, assetId, sourcePath, sourceSha256, stage}) {
  return {
    schemaVersion: 2,
    id,
    animationId: id,
    assetId,
    status: "preserved",
    created: "2026-08-02",
    confidence: "unknown",
    classification: {},
    source: {
      placementPath: `${SOURCE_PREFIX}${sourcePath}`,
      fla: "",
      swf: `${SOURCE_PREFIX}${sourcePath}`,
      flaSha256: "",
      swfSha256: sourceSha256,
      pairedFlaStatus: "missing",
      provenance: "owner-provided",
      aliasOf: null,
      variantOf: null,
    },
    runtime: {
      swfSignature: "FWS",
      swfVersion: 6,
      declaredFileLength: 100,
      stage,
      fps: 12,
      frameCount: 10,
      durationMs: 833.3333333333334,
      backgroundColor: "#ffffff",
      actionScriptVersion: "AS1/2",
      complexity: "unknown",
      fonts: [],
      scripts: [],
      externalDependencies: [],
    },
    audit: {},
    localization: {
      bilingualRequired: true,
      languages: ["en", "es"],
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
      reasonNotRequired: "unresolved",
      languages: [],
      inventoryFile: "audio-inventory.csv",
      cues: [],
    },
    implementation: {
      rendering: "undecided",
      route: "",
      routeFile: "",
      component: "",
      registryModule: "",
      timelineModule: "",
      testFile: "",
      standalonePackage: "",
      defaultFrameDomainId: "root",
      frameDomains: [
        {
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          parentFrameDomainId: null,
          frameCount: 10,
          scenarioIds: ["default"],
        },
      ],
      captureContract: CAPTURE_CONTRACT,
    },
    evidence: {
      assetInventory: "asset-inventory.csv",
      audioInventory: "audio-inventory.csv",
      keyframeCsv: "keyframes.csv",
      fullFrameCoverageFile: "evidence/full-frame-coverage.json",
      differenceDirectory: "evidence/diffs",
      archiveDirectory: "",
    },
    fidelity: {},
    accessibility: {},
    acceptance: {
      engineeringReview: {decision: "pending", reviewer: "", reviewedAt: ""},
      humanVisualReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        scope: "all-keyframe-and-full-frame-diffs",
        record: null,
      },
      ownerReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
        reason: "",
        record: null,
      },
      knownExceptions: [],
    },
  };
}

function initialRequirement(language) {
  const entryState = {kind: "initial-load", language};
  return {
    requirementId: `req-default-root-${language}`,
    scenario: "default",
    frameDomainId: "root",
    traceId: `default-root-${language}`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 10},
    entryState,
    entryStateSha256: sha256(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: 10}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
}

function initialCoverage(id) {
  return {
    schemaVersion: 2,
    animationId: id,
    requirements: [initialRequirement("en"), initialRequirement("es")],
  };
}

function nestedRequirement({
  domainId = "sprite-10",
  scenario = "source-proven-entry-unresolved",
  language,
} = {}) {
  const entryState = {
    kind: "source-proven-entry-unresolved",
    frameDomainId: domainId,
    scenario,
    language,
  };
  return {
    ...initialRequirement(language),
    requirementId: `req:${domainId}:${scenario}:${language}`,
    scenario,
    frameDomainId: domainId,
    traceId: `trace:${domainId}:${scenario}:${language}:seed-0`,
    entryState,
    entryStateSha256: sha256(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    requiredRange: {firstFrame: 1, lastFrame: 121},
    missingFrames: Array.from({length: 121}, (_, index) => index + 1),
    status: "blocked",
    blockingReason: "fixture unresolved runtime entry",
    blockingEvidence: [
      {
        file: "audit/scenario-inventory.json",
        sha256: "a".repeat(64),
      },
    ],
    strictAcceptanceEffect: "none",
    planningAuthority:
      "source-evidenced-declared-domain-only-runtime-and-acceptance-unresolved",
  };
}

function releaseFor(members) {
  return {
    releaseOrder: 1,
    releaseId: RELEASE_ID,
    releaseType: "complete-lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    queueId: "release-fixture-source-coverage",
    grade: 4,
    lesson: 10,
    titleDisplay: "Fixture",
    domain: "fixture",
    sourceLesson: {
      path: "HELP_COURSES/ELMGR4/L10/index.xml",
      bytes: 1,
      sha256: "f".repeat(64),
      sequenceAuthority: "fixture",
    },
    expectedCounts: {
      activeXmlReferencedPages: members.length,
      courseShells: 0,
      members: members.length,
      shards: 1,
    },
    scope: {collection: "course", grade: 4, lesson: 10},
    shards: [
      {
        shardId: "fixture-shard",
        batchId: "fixture-shard",
        ordinal: 1,
        parallelGroup: "fixture",
        memberCount: members.length,
        developmentPrerequisites: [],
      },
    ],
    members,
  };
}

function inventoryFor({
  id,
  manifest,
  member,
  catalogBytes,
  catalogSha256,
  release,
}) {
  return {
    schemaVersion: 1,
    animationId: id,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    authorityStatement: [],
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      fla: null,
      flaSha256: null,
      pairedFlaStatus: "missing",
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      actionScriptVersion: manifest.runtime.actionScriptVersion,
    },
    timelineInventory: [
      {
        timelineId: "root",
        objectId: null,
        frameCount: 10,
        structuralReachability: "root",
      },
      {
        timelineId: "sprite-10",
        objectId: "10",
        frameCount: 121,
        structuralReachability: "reachable-from-root-placement-graph",
      },
    ],
    coverage: {executableTraceSchedules: []},
    evidenceIndex: [
      {
        artifactId: "source-swf",
        path: manifest.source.swf,
        sha256: manifest.source.swfSha256,
      },
      {
        artifactId: "lesson-release-membership",
        path: "catalog/lesson-releases.json",
        sha256: catalogSha256,
        bytes: catalogBytes,
        releaseId: release.releaseId,
        publicationMode: "atomic",
        expectedMemberCount: release.expectedCounts.members,
        ordinal: member.ordinal,
        animationId: id,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        sourcePath: member.source.path,
        sourceSha256: member.source.sha256,
      },
      {
        artifactId: "migration-technical-contract",
        path: "migration.json",
        sha256: technicalManifestSha256(manifest),
        hashMode: CANONICAL_PROJECTION_ENCODING,
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
      },
    ],
  };
}

function dispositionFor({
  id,
  manifest,
  member,
  catalogBytes,
  catalogSha256,
  inventorySha256,
  release,
}) {
  return {
    schemaVersion: 1,
    animationId: id,
    status: "structurally-enumerated-dispositions-unresolved",
    migrationStatusChanged: false,
    generatedFrom: {
      lessonReleaseCatalog: {
        releaseId: release.releaseId,
        path: "catalog/lesson-releases.json",
        bytes: catalogBytes,
        sha256: catalogSha256,
        schemaVersion: 1,
        member: {
          animationId: id,
          ordinal: member.ordinal,
          shardId: member.shardId,
          assetId: member.assetId,
          sourcePath: member.source.path,
          sourceSha256: member.source.sha256,
        },
        bindingStatus: "verified-exact-release-member",
      },
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        sha256: inventorySha256,
        schemaVersion: 1,
        inventoryStatus: "static-exhaustive-runtime-unverified",
      },
      migrationManifest: {
        path: "migration.json",
        hashMode: CANONICAL_PROJECTION_ENCODING,
        technicalProjection: TECHNICAL_MANIFEST_PROJECTION.id,
        technicalProjectionSha256: technicalManifestSha256(manifest),
        excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
        bindingStatus: "verified",
      },
      sourceSwf: {
        path: manifest.source.swf,
        sha256: manifest.source.swfSha256,
      },
    },
    summary: {
      inventoryTimelineCount: 2,
      enumeratedTimelineCount: 2,
      reachableChildTimelineCount: 1,
      excludedNotProvenTimelineCount: 0,
      dispositionCounts: {
        "declared-frame-domain": 1,
        "composite-child-with-parent": 0,
        "independent-required": 0,
        nonvisual: 0,
        unresolved: 1,
      },
      highRiskIndependentCandidateCount: 1,
    },
    timelines: [
      {
        timelineId: "root",
        sourceTimelineId: "root",
        sourceObjectId: null,
        frameCount: 10,
        structuralReachability: "root",
        rootPlacement: {status: "root-timeline", namedPlacementPath: []},
        declaredFrameDomains: [
          {
            frameDomainId: "root",
            kind: "root",
            sourceTimelineId: "root",
            sourceInstanceId: "",
            parentFrameDomainId: null,
            parentEntryFrame: null,
            localEntryFrame: null,
            frameCount: 10,
            role: "",
          },
        ],
        disposition: "declared-frame-domain",
        dispositionBasis: "fixture",
        riskAssessment: {
          level: "none",
          independentFrameDomainCandidate: false,
        },
      },
      {
        timelineId: "sprite-10",
        sourceTimelineId: "sprite-10",
        sourceObjectId: "10",
        frameCount: 121,
        structuralReachability: "reachable-from-root-placement-graph",
        rootPlacement: {
          status: "proven-named-placement-chain",
          namedPlacementPath: [],
        },
        declaredFrameDomains: [],
        disposition: "unresolved",
        dispositionBasis: "fixture unresolved",
        riskAssessment: {
          level: "high",
          independentFrameDomainCandidate: true,
        },
      },
    ],
  };
}

async function makeFixture({memberCount = 2} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "coverage-v2-fixture-"));
  const migrationsRoot = path.join(root, "migrations");
  const sourceRoot = path.join(
    root,
    "source-assets",
    "flash",
    "HELP MATH_ORIGINAL FILES",
  );
  await mkdir(migrationsRoot, {recursive: true});
  await mkdir(path.join(root, "catalog"), {recursive: true});
  await mkdir(sourceRoot, {recursive: true});
  const records = [];
  const members = [];
  for (let index = 0; index < memberCount; index += 1) {
    const id = `fixture-page-${String(index + 1).padStart(3, "0")}`;
    const sourcePath = `HELP_COURSES/ELMGR4/L10/VB/FIX${index + 1}.swf`;
    const sourceBytes = Buffer.from(`fixture-source-${index + 1}`);
    const sourceSha256 = sha256(sourceBytes);
    const sourceFile = path.join(sourceRoot, ...sourcePath.split("/"));
    await mkdir(path.dirname(sourceFile), {recursive: true});
    await writeFile(sourceFile, sourceBytes);
    const member = {
      ordinal: index + 1,
      animationId: id,
      assetId: `swf-${sourceSha256}`,
      releaseRole: "active-xml-referenced-page",
      batchId: "fixture-shard",
      shardId: "fixture-shard",
      source: {path: sourcePath, sha256: sourceSha256},
      xmlOccurrence: index + 1,
    };
    members.push(member);
    records.push({id, member, sourceFile});
  }
  const release = releaseFor(members);
  const catalog = {schemaVersion: 1, generatedAt: null, releases: [release]};
  const catalogPath = path.join(root, "catalog", "lesson-releases.json");
  await writeJson(catalogPath, catalog);
  const catalogRaw = await readFile(catalogPath);
  const catalogSha256 = sha256(catalogRaw);
  for (const [index, record] of records.entries()) {
    const workspace = path.join(migrationsRoot, record.id);
    const stage = index === 0
      ? {width: 799.9, height: 599.75}
      : {width: 800, height: 600};
    const manifest = manifestFor({
      id: record.id,
      assetId: record.member.assetId,
      sourcePath: record.member.source.path,
      sourceSha256: record.member.source.sha256,
      stage,
    });
    await writeJson(path.join(workspace, "migration.json"), manifest);
    await writeJson(
      path.join(workspace, "evidence", "full-frame-coverage.json"),
      initialCoverage(record.id),
    );
    const inventory = inventoryFor({
      id: record.id,
      manifest,
      member: record.member,
      catalogBytes: catalogRaw.length,
      catalogSha256,
      release,
    });
    const inventoryPath = path.join(
      workspace,
      "audit",
      "scenario-inventory.json",
    );
    await writeJson(inventoryPath, inventory);
    const inventoryRaw = await readFile(inventoryPath);
    await writeJson(
      path.join(workspace, "audit", "frame-domain-disposition.json"),
      dispositionFor({
        id: record.id,
        manifest,
        member: record.member,
        catalogBytes: catalogRaw.length,
        catalogSha256,
        inventorySha256: sha256(inventoryRaw),
        release,
      }),
    );
    Object.assign(record, {workspace, manifest, inventory, stage});
  }
  return {
    root,
    migrationsRoot,
    catalogPath,
    catalog,
    release,
    records,
    async cleanup() {
      await rm(root, {recursive: true, force: true});
    },
  };
}

async function coverageBytes(record) {
  return readFile(
    path.join(record.workspace, "evidence", "full-frame-coverage.json"),
  );
}

test("parseArguments accepts exact release, repeated subset IDs, and check", () => {
  assert.deepEqual(
    parseArguments([
      "--release-id",
      RELEASE_ID,
      "--id",
      "fixture-page-001",
      "--id",
      "fixture-page-002",
      "--check",
    ]),
    {
      releaseId: RELEASE_ID,
      ids: ["fixture-page-001", "fixture-page-002"],
      check: true,
    },
  );
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("coverage preimage permits only additive requirements for newly declared nested domains", () => {
  const id = "fixture-page-001";
  const roots = [initialRequirement("en"), initialRequirement("es")];
  const nested = [
    nestedRequirement({language: "en"}),
    nestedRequirement({language: "es"}),
  ];
  const expected = {requirements: [...roots, ...nested]};
  const current = {
    schemaVersion: 2,
    animationId: id,
    materialization: {
      declaredFrameDomains: [{id: "root"}],
    },
    requirements: structuredClone(roots),
  };
  assert.doesNotThrow(() =>
    validateCoveragePreimage({id, current, expected}),
  );
});

test("coverage preimage rejects a missing root or previously materialized nested requirement", () => {
  const id = "fixture-page-001";
  const roots = [initialRequirement("en"), initialRequirement("es")];
  const nested = [
    nestedRequirement({language: "en"}),
    nestedRequirement({language: "es"}),
  ];
  const expected = {requirements: [...roots, ...nested]};
  assert.throws(
    () =>
      validateCoveragePreimage({
        id,
        expected,
        current: {
          schemaVersion: 2,
          animationId: id,
          materialization: {declaredFrameDomains: [{id: "root"}]},
          requirements: [structuredClone(roots[0])],
        },
      }),
    /missing previously required req-default-root-es/,
  );
  assert.throws(
    () =>
      validateCoveragePreimage({
        id,
        expected,
        current: {
          schemaVersion: 2,
          animationId: id,
          materialization: {
            declaredFrameDomains: [{id: "root"}, {id: "sprite-10"}],
          },
          requirements: structuredClone(roots),
        },
      }),
    /missing previously required req:sprite-10:source-proven-entry-unresolved:en/,
  );
});

test("coverage preimage rejects orphaned or promoted additive requirements", () => {
  const id = "fixture-page-001";
  const roots = [initialRequirement("en"), initialRequirement("es")];
  const nested = [
    nestedRequirement({language: "en"}),
    nestedRequirement({language: "es"}),
  ];
  const expected = {requirements: [...roots, ...nested]};
  const base = {
    schemaVersion: 2,
    animationId: id,
    materialization: {declaredFrameDomains: [{id: "root"}]},
  };
  const orphan = structuredClone(nested[0]);
  orphan.requirementId = "req:sprite-999:unknown:en";
  assert.throws(
    () =>
      validateCoveragePreimage({
        id,
        expected,
        current: {...base, requirements: [...structuredClone(roots), orphan]},
      }),
    /contains orphaned requirement/,
  );
  const promoted = structuredClone(nested[0]);
  promoted.status = "accepted";
  assert.throws(
    () =>
      validateCoveragePreimage({
        id,
        expected,
        current: {
          ...base,
          requirements: [...structuredClone(roots), promoted],
        },
      }),
    /promoted beyond pending\/blocked/,
  );
});

test("materializes only declared root domains and preserves fractional native stage", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const manifestsBefore = await Promise.all(
    fixture.records.map((record) =>
      readFile(path.join(record.workspace, "migration.json")),
    ),
  );
  const result = await materializeReleaseSourceEvidencedCoverageV2({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
  });
  assert.deepEqual(
    {
      members: result.selectedMemberCount,
      changed: result.changedMemberCount,
      requirements: result.requirementCount,
      domains: result.declaredFrameDomainCount,
      unresolved: result.excludedUnresolvedTimelineCount,
      manifestChanges: result.migrationManifestChangedCount,
      statusChanged: result.migrationStatusChanged,
      effect: result.strictAcceptanceEffect,
    },
    {
      members: 2,
      changed: 2,
      requirements: 4,
      domains: 2,
      unresolved: 2,
      manifestChanges: 0,
      statusChanged: false,
      effect: "none",
    },
  );
  for (const [index, record] of fixture.records.entries()) {
    assert.deepEqual(
      await readFile(path.join(record.workspace, "migration.json")),
      manifestsBefore[index],
    );
    const coverage = JSON.parse(await coverageBytes(record));
    assert.equal(coverage.requirements.length, 2);
    assert.equal(
      coverage.requirements.every(
        (requirement) =>
          requirement.frameDomainId === "root" &&
          requirement.status === "blocked" &&
          requirement.baselineAuthority === "unresolved" &&
          requirement.capturedFrameCount === 0 &&
          requirement.strictAcceptanceEffect === "none" &&
          requirement.blockingEvidence.length === 1 &&
          requirement.blockingEvidence[0].file ===
            "audit/scenario-inventory.json",
      ),
      true,
    );
    assert.equal(
      coverage.materialization.excludedUnresolvedTimelines.count,
      1,
    );
    assert.equal(
      coverage.materialization.excludedUnresolvedTimelines.timelines[0]
        .sourceTimelineId,
      "sprite-10",
    );
  }
  const first = JSON.parse(await coverageBytes(fixture.records[0]));
  assert.deepEqual(first.materialization.nativeStage, {
    width: 799.9,
    height: 599.75,
    preservedExactly: true,
    rasterRoundingApplied: false,
  });
  const checked = await materializeReleaseSourceEvidencedCoverageV2({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
    check: true,
  });
  assert.equal(checked.checked, true);
  const subset = await materializeReleaseSourceEvidencedCoverageV2({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
    ids: [fixture.records[0].id],
    check: true,
  });
  assert.equal(subset.selectionScope, "verified-subset");
});

test("check reports stale coverage without writing", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const before = await Promise.all(fixture.records.map(coverageBytes));
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
      check: true,
    }),
    /Stale release coverage-v2 output/,
  );
  for (const [index, record] of fixture.records.entries()) {
    assert.deepEqual(await coverageBytes(record), before[index]);
  }
});

test("accepts an acceptance-neutral requirement subset when declared domains expand", async (t) => {
  const fixture = await makeFixture({memberCount: 1});
  t.after(() => fixture.cleanup());
  const [record] = fixture.records;
  const manifestPath = path.join(record.workspace, "migration.json");
  const inventoryPath = path.join(
    record.workspace,
    "audit",
    "scenario-inventory.json",
  );
  const dispositionPath = path.join(
    record.workspace,
    "audit",
    "frame-domain-disposition.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.scenarios.push({
    id: "source-domain-entry-unresolved",
    kind: "source-proven-structural-entry-runtime-unresolved",
    description: "fixture",
    reachable: true,
  });
  manifest.implementation.frameDomains.push({
    id: "sprite-10",
    kind: "nested",
    sourceTimelineId: "sprite-10",
    parentFrameDomainId: "root",
    frameCount: 121,
    scenarioIds: ["source-domain-entry-unresolved"],
  });
  await writeJson(manifestPath, manifest);
  const inventory = JSON.parse(await readFile(inventoryPath));
  inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "migration-technical-contract",
  ).sha256 = technicalManifestSha256(manifest);
  await writeJson(inventoryPath, inventory);
  const inventoryRaw = await readFile(inventoryPath);
  const disposition = dispositionFor({
    id: record.id,
    manifest,
    member: record.member,
    catalogBytes: Buffer.byteLength(pretty(fixture.catalog)),
    catalogSha256: sha256(Buffer.from(pretty(fixture.catalog))),
    inventorySha256: sha256(inventoryRaw),
    release: fixture.release,
  });
  disposition.summary.dispositionCounts["declared-frame-domain"] = 2;
  disposition.summary.dispositionCounts.unresolved = 0;
  disposition.summary.highRiskIndependentCandidateCount = 0;
  disposition.timelines[1].declaredFrameDomains = [{
    frameDomainId: "sprite-10",
    kind: "nested",
    sourceTimelineId: "sprite-10",
    sourceInstanceId: "",
    parentFrameDomainId: "root",
    parentEntryFrame: null,
    localEntryFrame: null,
    frameCount: 121,
    role: "",
  }];
  disposition.timelines[1].disposition = "declared-frame-domain";
  disposition.timelines[1].riskAssessment = {
    level: "none",
    independentFrameDomainCandidate: false,
  };
  await writeJson(dispositionPath, disposition);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
      check: true,
    }),
    /Stale release coverage-v2 output/,
  );
  const result = await materializeReleaseSourceEvidencedCoverageV2({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
  });
  assert.equal(result.changedMemberCount, 1);
  assert.equal(result.declaredFrameDomainCount, 2);
  assert.equal(result.requirementCount, 4);
  const coverage = JSON.parse(await coverageBytes(record));
  assert.deepEqual(
    coverage.requirements.map(({requirementId}) => requirementId),
    [
      "req-default-root-en",
      "req-default-root-es",
      "req:sprite-10:source-domain-entry-unresolved:en",
      "req:sprite-10:source-domain-entry-unresolved:es",
    ],
  );
  assert(coverage.requirements.every(({status}) => status === "blocked"));
});

test("all-member preflight prevents an earlier write when a later source drifts", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const before = await Promise.all(fixture.records.map(coverageBytes));
  await writeFile(fixture.records[1].sourceFile, "drifted-source");
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
    }),
    /physical source SWF hash differs/,
  );
  for (const [index, record] of fixture.records.entries()) {
    assert.deepEqual(await coverageBytes(record), before[index]);
  }
});

test("rejects stale technical-manifest projection before any write", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const before = await Promise.all(fixture.records.map(coverageBytes));
  const manifestPath = path.join(
    fixture.records[1].workspace,
    "migration.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.runtime.fps = 13;
  await writeJson(manifestPath, manifest);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
    }),
    /scenario inventory source\/runtime binding is stale|technical-manifest binding is stale/,
  );
  for (const [index, record] of fixture.records.entries()) {
    assert.deepEqual(await coverageBytes(record), before[index]);
  }
});

test("rejects path traversal in an exact release catalog", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const before = await coverageBytes(fixture.records[0]);
  const catalog = structuredClone(fixture.catalog);
  catalog.releases[0].members[0].source.path = "../escaped.swf";
  await writeJson(fixture.catalogPath, catalog);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
    }),
    /release source path is not a safe catalog SWF path/,
  );
  assert.deepEqual(await coverageBytes(fixture.records[0]), before);
});

test("rejects a symlinked coverage target before any write", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const firstBefore = await coverageBytes(fixture.records[0]);
  const target = path.join(
    fixture.records[1].workspace,
    "evidence",
    "full-frame-coverage.json",
  );
  const moved = `${target}.ordinary`;
  await rename(target, moved);
  await symlink(moved, target);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
    }),
    /must be an ordinary non-symlink file/,
  );
  assert.deepEqual(await coverageBytes(fixture.records[0]), firstBefore);
});

test("rolls back every committed member when a transaction hook fails", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const before = await Promise.all(fixture.records.map(coverageBytes));
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
      testHooks: {
        afterCommit({index}) {
          if (index === 0) throw new Error("injected commit failure");
        },
      },
    }),
    /injected commit failure/,
  );
  for (const [index, record] of fixture.records.entries()) {
    assert.deepEqual(await coverageBytes(record), before[index]);
  }
});

test("refuses adopted capture evidence instead of erasing it", async (t) => {
  const fixture = await makeFixture({memberCount: 1});
  t.after(() => fixture.cleanup());
  const coveragePath = path.join(
    fixture.records[0].workspace,
    "evidence",
    "full-frame-coverage.json",
  );
  const coverage = JSON.parse(await readFile(coveragePath));
  coverage.requirements[0].capturedFrameCount = 1;
  coverage.requirements[0].missingFrames = coverage.requirements[0].missingFrames.slice(1);
  coverage.requirements[0].captureManifest =
    "output/playwright/fixture/capture-manifest.json";
  coverage.requirements[0].captureManifestSha256 = "a".repeat(64);
  await writeJson(coveragePath, coverage);
  const before = await readFile(coveragePath);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
    }),
    /capture\/metric field capturedFrameCount is not acceptance-neutral|non-refreshable requirement field capturedFrameCount drifted/,
  );
  assert.deepEqual(await readFile(coveragePath), before);
});

test("check detects a refreshed output drift while preserving bytes", async (t) => {
  const fixture = await makeFixture({memberCount: 1});
  t.after(() => fixture.cleanup());
  await materializeReleaseSourceEvidencedCoverageV2({
    projectRoot: fixture.root,
    releaseId: RELEASE_ID,
  });
  const coveragePath = path.join(
    fixture.records[0].workspace,
    "evidence",
    "full-frame-coverage.json",
  );
  const coverage = JSON.parse(await readFile(coveragePath));
  coverage.requirements[0].status = "pending";
  await writeJson(coveragePath, coverage);
  const drifted = await readFile(coveragePath);
  await assert.rejects(
    materializeReleaseSourceEvidencedCoverageV2({
      projectRoot: fixture.root,
      releaseId: RELEASE_ID,
      check: true,
    }),
    /Stale release coverage-v2 output/,
  );
  assert.deepEqual(await readFile(coveragePath), drifted);
});
