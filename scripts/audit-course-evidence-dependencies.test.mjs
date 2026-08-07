import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, mkdir, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {buildEvidenceDependencyReport, parseArguments} from "./audit-course-evidence-dependencies.mjs";
import {
  CANONICAL_PROJECTION_ENCODING,
  FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  fqAudioSourceStructureSha256,
  technicalManifestSha256,
} from "./evidence-projections.mjs";

const hash = (text) => createHash("sha256").update(text).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function fixture() {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "evidence-dependencies-"));
  const id = "course-fixture";
  const workspace = path.join(projectRoot, "migrations", id);
  await mkdir(path.join(projectRoot, "scripts"), {recursive: true});
  await mkdir(path.join(workspace, "audit"), {recursive: true});
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  for (const script of [
    "build-course-strict-readiness.mjs",
    "build-course-scenario-inventories.mjs",
    "build-frame-domain-dispositions.mjs",
    "sync-pilot-frame-domains.mjs",
    "refresh-pilot-verification.mjs",
  ]) await writeFile(path.join(projectRoot, "scripts", script), "// fixture\n");
  const manifestText = json({animationId: id});
  const readinessText = json({animationId: id});
  await writeFile(path.join(workspace, "migration.json"), manifestText);
  await writeFile(path.join(workspace, "audit", "strict-readiness.json"), readinessText);
  return {projectRoot, id, workspace, manifestText, readinessText};
}

async function writeFixtureFile(projectRoot, relative, contents = "fixture\n") {
  const target = path.join(projectRoot, relative);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, contents);
  return {path: relative, sha256: hash(contents)};
}

test("reports current explicit and implicit dependency pins", async () => {
  const current = await fixture();
  const inventoryText = json({
    animationId: current.id,
    dependencies: [
      {path: "migration.json", sha256: hash(current.manifestText)},
      {path: "audit/strict-readiness.json", sha256: hash(current.readinessText)},
    ],
  });
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), inventoryText);
  await writeFile(path.join(current.workspace, "evidence", "verification.json"), json({manifestSha256: hash(current.manifestText)}));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.status, "current");
  assert.equal(report.summary.dependencyStatusCounts.current, 3);
  assert.equal(report.summary.blockedArtifactCount, 0);
});

test("technical manifest pins survive signing/status but fail on source or frame-domain drift", async () => {
  const current = await fixture();
  const manifestPath = path.join(current.workspace, "migration.json");
  const manifest = {
    schemaVersion: 2,
    id: current.id,
    animationId: current.id,
    assetId: `swf-${"a".repeat(64)}`,
    status: "preserved",
    source: {swf: "source.swf", swfSha256: "a".repeat(64)},
    runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default", kind: "linear", reachable: true}],
    implementation: {frameDomains: [{id: "root", kind: "root", sourceTimelineId: "root", frameCount: 10, scenarioIds: ["default"]}]},
  };
  await writeFile(manifestPath, json(manifest));
  const pinned = technicalManifestSha256(manifest);
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), json({
    animationId: current.id,
    evidenceIndex: [{
      artifactId: "migration-technical-contract",
      path: "migration.json",
      hashMode: CANONICAL_PROJECTION_ENCODING,
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      sha256: pinned,
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    }],
  }));

  const signed = structuredClone(manifest);
  signed.status = "complete";
  signed.acceptance = {
    humanVisualReview: {decision: "accepted", reviewer: "Named human"},
    ownerReview: {decision: "accepted", reviewer: "Named owner"},
  };
  await writeFile(manifestPath, json(signed));
  let report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  let dependency = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/scenario-inventory.json").dependencies[0];
  assert.equal(dependency.type, "migration-technical-contract");
  assert.equal(dependency.status, "current");
  assert.notEqual(dependency.observedFileSha256, dependency.observedSha256, "projection SHA must not be mistaken for file SHA");

  signed.source.swfSha256 = "b".repeat(64);
  await writeFile(manifestPath, json(signed));
  report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  dependency = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/scenario-inventory.json").dependencies[0];
  assert.equal(dependency.status, "stale");

  signed.source.swfSha256 = "a".repeat(64);
  signed.implementation.frameDomains[0].frameCount = 11;
  await writeFile(manifestPath, json(signed));
  report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  dependency = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/scenario-inventory.json").dependencies[0];
  assert.equal(dependency.status, "stale");
});

test("one audio-readiness-scenario pass keeps the FQ source projection current and has no full-artifact cycle", async () => {
  const current = await fixture();
  await writeFixtureFile(current.projectRoot, "scripts/audit-pilot-audio.mjs");
  const scenarioPath = path.join(current.workspace, "audit", "scenario-inventory.json");
  const audioPath = path.join(current.workspace, "audit", "audio-runtime-evidence.json");
  const readinessPath = path.join(current.workspace, "audit", "strict-readiness.json");
  const scenario = {
    schemaVersion: 1,
    animationId: current.id,
    source: {swf: "source-assets/fq.swf", swfSha256: "a".repeat(64)},
    courseXml: {
      artifact: {path: "source-assets/index.xml", sha256: "b".repeat(64)},
      currentPlacement: {
        sourceRelativePath: "FQ/Review/L6FQ02.swf",
        matchStatus: "basename-only-conflict",
        exactPlacement: null,
        basenameMatches: [{path: "FQ/L6FQ02.swf"}],
      },
    },
    timelineInventory: [{
      timelineId: "sprite-1168",
      frameCount: 82,
      frameLabels: [{frame: 2, label: "Q1"}],
      controlStates: [{
        frame: 2,
        evidence: [{
          artifactId: "ffdec-scripts",
          script: "DefineSprite_1168/frame_2/A/CLIPACTIONRECORD on(release).as",
          lineStart: 10,
          lineEnd: 15,
        }],
      }],
    }],
    evidenceIndex: [{artifactId: "strict-readiness", path: "audit/strict-readiness.json", sha256: "0".repeat(64)}],
    coverage: {acceptanceObligationsFromReadiness: [{statement: "initial"}]},
  };
  await writeFile(scenarioPath, json(scenario));
  const projectedSha256 = fqAudioSourceStructureSha256(scenario);
  const audioText = json({
    animationId: current.id,
    bindings: {
      childScenarioSourceStructure: {
        file: "audit/scenario-inventory.json",
        hashMode: CANONICAL_PROJECTION_ENCODING,
        projection: FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id,
        sha256: projectedSha256,
        excludedPaths: [...FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.excludedPaths],
        includedPaths: [...FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.includedPaths],
      },
    },
  });
  await writeFile(audioPath, audioText);
  const readinessText = json({
    animationId: current.id,
    audioAudit: {report: {path: "audit/audio-runtime-evidence.json", sha256: hash(audioText)}},
  });
  await writeFile(readinessPath, readinessText);
  scenario.evidenceIndex[0].sha256 = hash(readinessText);
  scenario.coverage.acceptanceObligationsFromReadiness[0].statement = "rebuilt after audio";
  const rebuiltScenarioText = json(scenario);
  await writeFile(scenarioPath, rebuiltScenarioText);

  assert.equal(fqAudioSourceStructureSha256(scenario), projectedSha256, "readiness-derived scenario fields must not invalidate audio");
  let report = await buildEvidenceDependencyReport({
    projectRoot: current.projectRoot,
    migrationsRoot: path.join(current.projectRoot, "migrations"),
    pilotIds: [current.id],
  });
  assert.equal(report.summary.status, "current");
  assert.equal(report.summary.dependencyCycleCount, 0);
  assert.deepEqual(report.dependencyCycles, []);
  const audioArtifact = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/audio-runtime-evidence.json");
  assert.equal(audioArtifact.dependencies[0].type, "fq-audio-source-structure");
  assert.equal(audioArtifact.dependencies[0].status, "current");
  assert.equal(audioArtifact.dependencies[0].projection, FQ_AUDIO_SOURCE_STRUCTURE_PROJECTION.id);

  const sourceDrift = structuredClone(scenario);
  sourceDrift.timelineInventory[0].controlStates[0].evidence[0].lineEnd += 1;
  await writeFile(scenarioPath, json(sourceDrift));
  report = await buildEvidenceDependencyReport({
    projectRoot: current.projectRoot,
    migrationsRoot: path.join(current.projectRoot, "migrations"),
    pilotIds: [current.id],
  });
  assert.equal(report.pilots[0].artifacts
    .find(({artifactRelative}) => artifactRelative === "audit/audio-runtime-evidence.json")
    .dependencies[0].status, "stale");
  await writeFile(scenarioPath, rebuiltScenarioText);

  await writeFile(audioPath, json({
    animationId: current.id,
    legacyFullFileCycle: {file: "audit/scenario-inventory.json", sha256: hash(rebuiltScenarioText)},
  }));
  report = await buildEvidenceDependencyReport({
    projectRoot: current.projectRoot,
    migrationsRoot: path.join(current.projectRoot, "migrations"),
    pilotIds: [current.id],
  });
  assert.equal(report.summary.dependencyCycleCount, 1, "the auditor must detect the old full-file audio/readiness/scenario cycle");
  assert.deepEqual(new Set(report.dependencyCycles[0].artifactPaths.map((value) => path.basename(value))), new Set([
    "audio-runtime-evidence.json",
    "scenario-inventory.json",
    "strict-readiness.json",
  ]));
});

test("malformed or unknown projection descriptors fail closed", async () => {
  const current = await fixture();
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), json({
    dependency: {
      path: "migration.json",
      hashMode: "unknown-mode",
      projection: TECHNICAL_MANIFEST_PROJECTION.id,
      sha256: "a".repeat(64),
      excludedPaths: [...TECHNICAL_MANIFEST_PROJECTION.excludedPaths],
    },
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  const dependency = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/scenario-inventory.json").dependencies[0];
  assert.equal(dependency.status, "invalid-projection");
  assert.equal(report.summary.dependencyStatusCounts["invalid-projection"], 1);
});

test("fails closed and separates stale artifacts by generator availability", async () => {
  const current = await fixture();
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), json({
    animationId: current.id,
    dependencies: [{path: "migration.json", sha256: "a".repeat(64)}],
  }));
  await writeFile(path.join(current.workspace, "audit", "manual-note.json"), json({
    animationId: current.id,
    evidence: {scenarioInventory: "audit/scenario-inventory.json", scenarioInventorySha256: "b".repeat(64)},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.status, "blocked");
  assert.equal(report.summary.staleWithGeneratorCount, 1);
  assert.equal(report.summary.staleWithoutGeneratorCount, 1);
  assert.match(report.staleWithGenerator[0].path, /scenario-inventory\.json$/);
  assert.match(report.withoutGenerator[0].path, /manual-note\.json$/);
});

test("recognizes the renderer frame-domain support builder as its deterministic producer", async () => {
  const current = await fixture();
  await writeFixtureFile(current.projectRoot, "scripts/build-renderer-frame-domain-support.mjs");
  await writeFile(path.join(current.workspace, "audit", "renderer-frame-domain-support.json"), json({
    animationId: current.id,
    generatedFrom: {migrationManifest: {path: "migration.json", sha256: "a".repeat(64)}},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  const artifact = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/renderer-frame-domain-support.json");
  assert.equal(artifact.status, "blocked");
  assert.equal(artifact.generator.availability, "available");
  assert.equal(artifact.generator.script, "scripts/build-renderer-frame-domain-support.mjs");
  assert.equal(artifact.generator.deterministic, true);
});

test("does not misclassify a spec consumer as the spec producer", async () => {
  const current = await fixture();
  await writeFile(path.join(current.projectRoot, "scripts", "build-safe-ffdec-canvas-adapter.mjs"), "// consumes the spec\n");
  const inventoryText = json({animationId: current.id});
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), inventoryText);
  await writeFile(path.join(current.workspace, "audit", "canvas-adapter-spec.json"), json({
    evidence: {scenarioInventory: "audit/scenario-inventory.json", scenarioInventorySha256: "d".repeat(64)},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  const spec = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/canvas-adapter-spec.json");
  assert.equal(spec.generator.availability, "none-known");
  assert.equal(spec.knownConsumers[0].script, "scripts/build-safe-ffdec-canvas-adapter.mjs");
  assert.equal(spec.knownConsumers[0].role, "consumer-not-producer");
});

test("candidate QA audits source, runtime-manifest, public-asset, module, timeline, test, and evidence byte pins", async () => {
  const current = await fixture();
  const sourceBytes = Buffer.from([0x43, 0x57, 0x53, 0xff, 0x00, 0x80]);
  const source = await writeFixtureFile(current.projectRoot, "source-assets/course.swf", sourceBytes);
  const runtimeManifest = await writeFixtureFile(current.projectRoot, "output/runtime/capture-manifest.json", json({frameCount: 2}));
  const publicAsset = await writeFixtureFile(current.projectRoot, "public/flash-assets/course/canvas-renderer.js", "export {};\n");
  const module = await writeFixtureFile(current.projectRoot, "packages/demos/src/modules/course-fixture.tsx", "export {};\n");
  const timeline = await writeFixtureFile(current.projectRoot, "packages/demos/src/timelines/course-fixture.ts", "export {};\n");
  const testModule = await writeFixtureFile(current.projectRoot, "packages/demos/tests/course-fixture.test.ts", "export {};\n");
  const screenshot = await writeFixtureFile(current.projectRoot, "output/playwright/course-fixture/frame-001.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0xff]));
  await writeFile(path.join(current.workspace, "evidence", "nextjs-native-candidate-qa.json"), json({
    source: {swf: source.path, swfSha256: source.sha256},
    runtime: {manifest: runtimeManifest.path, manifestSha256: runtimeManifest.sha256},
    implementation: {
      asset: {path: publicAsset.path, sha256: publicAsset.sha256},
      rendererModule: {path: module.path, sha256: module.sha256},
      timelineModule: {path: timeline.path, sha256: timeline.sha256},
      testModule: {path: testModule.path, sha256: testModule.sha256},
    },
    capture: {path: screenshot.path, sha256: screenshot.sha256},
    route: {path: "/animations/course-fixture"},
  }));

  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  const qa = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "evidence/nextjs-native-candidate-qa.json");
  assert.equal(qa.status, "current");
  assert.equal(qa.dependencyCount, 7);
  assert.deepEqual(new Set(qa.dependencies.map(({type}) => type)), new Set([
    "candidate-source-asset",
    "candidate-runtime-manifest",
    "candidate-public-asset",
    "candidate-renderer-module",
    "candidate-timeline-module",
    "candidate-test-module",
    "candidate-evidence-artifact",
  ]));
  assert(!qa.dependencies.some(({declaredPath}) => declaredPath === "/animations/course-fixture"), "application routes are not filesystem dependencies");
});

test("keyterm engineering QA receives the same fail-closed byte-pin audit", async () => {
  const current = await fixture();
  const producer = await writeFixtureFile(current.projectRoot, "scripts/qa-keyterm-pilots.mjs", "// producer\n");
  const source = await writeFixtureFile(current.projectRoot, "source-assets/keyterm.swf", Buffer.from([0x43, 0x57, 0x53, 0x01]));
  const module = await writeFixtureFile(current.projectRoot, "packages/demos/src/modules/keyterm-fixture.tsx", "export {};\n");
  const screenshot = await writeFixtureFile(current.projectRoot, "output/playwright/keyterm-fixture/mobile.png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await writeFile(path.join(current.workspace, "evidence", "keyterm-engineering-qa.json"), json({
    generatedBy: {script: producer.path, scriptSha256: producer.sha256, deterministic: false},
    source: {path: source.path, sha256: source.sha256},
    implementation: [{path: module.path, sha256: module.sha256}],
    screenshot: {path: screenshot.path, sha256: screenshot.sha256},
  }));
  let report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  let qa = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "evidence/keyterm-engineering-qa.json");
  assert.equal(qa.status, "current");
  assert.equal(qa.dependencyCount, 4);
  assert.equal(qa.generator.script, producer.path);

  await writeFile(path.join(current.projectRoot, module.path), "changed\n");
  report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  qa = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "evidence/keyterm-engineering-qa.json");
  assert.equal(qa.status, "blocked");
  assert.equal(qa.dependencies.find(({resolvedPath}) => resolvedPath === module.path).status, "stale");
  assert.equal(qa.generator.availability, "available");
});

test("product QA receipts receive the same binding audit and producer attribution", async () => {
  const current = await fixture();
  const id = "course-g05-l13-rw-002";
  const workspace = path.join(current.projectRoot, "migrations", id);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  const producer = await writeFixtureFile(
    current.projectRoot,
    "scripts/qa-rw002-source-routed-spanish-audio.mjs",
    "// producer\n",
  );
  const module = await writeFixtureFile(
    current.projectRoot,
    "packages/demos/src/modules/course-g05-l13-rw-002.tsx",
    "export {};\n",
  );
  await writeFile(
    path.join(workspace, "evidence", "source-routed-spanish-audio-product-qa.json"),
    json({bindings: {module: {file: module.path, sha256: module.sha256}}}),
  );
  const report = await buildEvidenceDependencyReport({
    projectRoot: current.projectRoot,
    migrationsRoot: path.join(current.projectRoot, "migrations"),
    pilotIds: [id],
  });
  const qa = report.pilots[0].artifacts.find(
    ({artifactRelative}) =>
      artifactRelative === "evidence/source-routed-spanish-audio-product-qa.json",
  );
  assert.equal(qa.status, "current");
  assert.equal(qa.dependencyCount, 1);
  assert.equal(qa.dependencies[0].resolvedPath, module.path);
  assert.equal(qa.generator.availability, "available");
  assert.equal(qa.generator.script, producer.path);
});

test("candidate QA missing and stale pins are blocked and attributed to the correct producer", async () => {
  for (const [id, artifactRelative, producer] of [
    ["course-g03-l01-ts-008", "evidence/nextjs-native-candidate-qa.json", "qa-course-candidates.mjs"],
    ["course-g03-l06-fq-002-review", "evidence/nextjs-structural-candidate-qa.json", "qa-course-candidates.mjs"],
    ["course-g03-l06-ti-001", "evidence/nextjs-native-candidate-qa.json", "qa-course-candidates.mjs"],
    ["course-g04-l09-gs-002", "evidence/nextjs-native-candidate-qa.json", "qa-course-candidates.mjs"],
    ["course-g05-l13-rw-002", "evidence/nextjs-structural-candidate-qa.json", "qa-course-candidates.mjs"],
    ["course-g04-l01-ir-001", "evidence/nextjs-native-candidate-qa.json", "qa-ir-001-candidate.mjs"],
    ["course-g04-l03-in-009", "evidence/native-canvas-candidate-qa.json", "qa-in-009-canvas-candidate.mjs"],
  ]) {
    const current = await fixture();
    const workspace = path.join(current.projectRoot, "migrations", id);
    await mkdir(path.join(workspace, "evidence"), {recursive: true});
    await writeFixtureFile(current.projectRoot, `scripts/${producer}`);
    const module = await writeFixtureFile(current.projectRoot, `packages/demos/src/modules/${id}.tsx`, "current module\n");
    await writeFile(path.join(workspace, artifactRelative), json({
      animationId: id,
      implementation: {modulePath: module.path, moduleSha256: "a".repeat(64)},
    }));
    const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [id]});
    assert.equal(report.summary.staleWithGeneratorCount, 1);
    assert.equal(report.staleWithGenerator[0].generator.script, `scripts/${producer}`);
  }

  const current = await fixture();
  const module = await writeFixtureFile(current.projectRoot, "packages/demos/src/modules/course-fixture.tsx", "current module\n");
  await writeFile(path.join(current.workspace, "evidence", "native-canvas-candidate-qa.json"), json({
    implementation: {
      stale: {path: module.path, sha256: "b".repeat(64)},
      unpinnedTimeline: "packages/demos/src/timelines/course-fixture.ts",
    },
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.staleWithoutGeneratorCount, 1);
  assert.equal(report.withoutGenerator[0].generator.availability, "none-known");
  const qa = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "evidence/native-canvas-candidate-qa.json");
  assert.deepEqual(new Set(qa.dependencies.map(({status}) => status)), new Set(["stale", "missing-pin"]));
});

test("IR visual evidence build producer is scoped only to the IR pilot", async () => {
  const current = await fixture();
  await writeFixtureFile(current.projectRoot, "scripts/build-ir-001-candidate-visual-evidence.mjs");
  for (const id of ["course-g04-l01-ir-001", "course-other"]) {
    const workspace = path.join(current.projectRoot, "migrations", id, "evidence");
    await mkdir(workspace, {recursive: true});
    await writeFile(path.join(workspace, "nextjs-native-candidate-visual-evidence.json"), json({
      evidence: {path: "audit/scenario-inventory.json", sha256: "c".repeat(64)},
    }));
  }
  const report = await buildEvidenceDependencyReport({
    projectRoot: current.projectRoot,
    migrationsRoot: path.join(current.projectRoot, "migrations"),
    pilotIds: ["course-g04-l01-ir-001", "course-other"],
  });
  const ir = report.pilots.find(({animationId}) => animationId === "course-g04-l01-ir-001").artifacts[0];
  const other = report.pilots.find(({animationId}) => animationId === "course-other").artifacts[0];
  assert.equal(ir.generator.script, "scripts/build-ir-001-candidate-visual-evidence.mjs");
  assert.equal(ir.generator.availability, "available");
  assert.equal(other.generator.availability, "none-known");
});

test("missing hash pins and missing targets are distinct failures", async () => {
  const current = await fixture();
  await writeFile(path.join(current.workspace, "audit", "manual-note.json"), json({
    noPin: {path: "audit/scenario-inventory.json"},
    noTarget: {path: "evidence/full-frame-coverage.json", sha256: "c".repeat(64)},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.dependencyStatusCounts["missing-pin"], 1);
  assert.equal(report.summary.dependencyStatusCounts["missing-target"], 1);
});

test("deduplicates repeated pins while retaining JSON references", async () => {
  const current = await fixture();
  const inventoryText = json({animationId: current.id});
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), inventoryText);
  await writeFile(path.join(current.workspace, "audit", "frame-domain-disposition.json"), json({
    timelines: [0, 1, 2].map(() => ({sourceEvidence: {scenarioInventoryPath: "audit/scenario-inventory.json", scenarioInventorySha256: hash(inventoryText)}})),
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  const disposition = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/frame-domain-disposition.json");
  assert.equal(disposition.dependencies.length, 1);
  assert.equal(disposition.dependencies[0].references.length, 3);
});

test("excludes an exactly hash-bound formally invalidated artifact", async () => {
  const current = await fixture();
  const inventoryText = json({animationId: current.id});
  await writeFile(path.join(current.workspace, "audit", "scenario-inventory.json"), inventoryText);
  const staleText = json({
    animationId: current.id,
    evidence: {scenarioInventory: "audit/scenario-inventory.json", scenarioInventorySha256: "e".repeat(64)},
  });
  await writeFile(path.join(current.workspace, "audit", "old-prereview.json"), staleText);
  await writeFile(path.join(current.workspace, "audit", "old-prereview.invalidated.json"), json({
    schemaVersion: 1,
    evidenceKind: "formal-evidence-invalidation",
    animationId: current.id,
    status: "invalidated",
    invalidates: {path: "audit/old-prereview.json", sha256: hash(staleText)},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.status, "current");
  assert.equal(report.summary.formallyInvalidatedArtifactCount, 1);
  assert.equal(report.summary.stale, undefined);
  const target = report.pilots[0].artifacts.find(({artifactRelative}) => artifactRelative === "audit/old-prereview.json");
  assert.equal(target.status, "excluded-invalidated");
});

test("fails closed when an invalidation sidecar target hash drifts", async () => {
  const current = await fixture();
  await writeFile(path.join(current.workspace, "audit", "old-prereview.json"), json({animationId: current.id}));
  await writeFile(path.join(current.workspace, "audit", "old-prereview.invalidated.json"), json({
    schemaVersion: 1,
    evidenceKind: "formal-evidence-invalidation",
    animationId: current.id,
    status: "invalidated",
    invalidates: {path: "audit/old-prereview.json", sha256: "f".repeat(64)},
  }));
  const report = await buildEvidenceDependencyReport({projectRoot: current.projectRoot, migrationsRoot: path.join(current.projectRoot, "migrations"), pilotIds: [current.id]});
  assert.equal(report.summary.status, "blocked");
  assert.equal(report.summary.invalidInvalidationCount, 1);
});

test("argument parser supports report and fail-closed modes", () => {
  assert.deepEqual(parseArguments(["--id", "a", "--id", "b", "--migrations", "tmp", "--output", "report.json", "--json", "--check"]), {
    check: true,
    ids: ["a", "b"],
    json: true,
    output: "report.json",
    migrations: "tmp",
  });
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown argument/);
});
