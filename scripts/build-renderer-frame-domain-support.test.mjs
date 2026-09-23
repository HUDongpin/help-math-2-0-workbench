import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {
  buildProbeRequests,
  buildRendererFrameDomainSupport,
  buildRendererSupportReport,
  parseArguments,
  PILOT_RENDERER_AUDIT_IDS,
} from "./build-renderer-frame-domain-support.mjs";
import {COURSE_PILOT_IDS} from "./build-course-scenario-inventories.mjs";
import { validateRendererFrameDomainSupport } from "../skills/flash-to-js/scripts/validate_migration.mjs";
import { technicalManifestSha256 } from "./evidence-projections.mjs";

const sha = "a".repeat(64);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function manifest() {
  return {
    animationId: PILOT_RENDERER_AUDIT_IDS[0],
    status: "preserved",
    implementation: {
      frameDomains: [
        {id: "root", frameCount: 2, scenarioIds: ["root-standalone"]},
        {id: "sprite-7", frameCount: 3, scenarioIds: ["default", "blocked"]},
      ],
    },
  };
}

function sourceHashes() {
  return {
    prototypeManifest: sha,
    animationRegistry: sha,
    contract: sha,
    builder: sha,
    auditContract: sha,
    probe: sha,
    module: {path: "module.tsx", sha256: sha},
    timeline: {path: "timeline.ts", sha256: sha},
  };
}

test("builds deterministic first/last probes for every domain, scenario, and language", () => {
  const requests = buildProbeRequests(manifest());
  assert.equal(requests.length, 12);
  assert.deepEqual(requests.slice(0, 4), [
    {requestId: "root::root-standalone::en::1", frameDomain: "root", frame: 1, scenario: "root-standalone", language: "en", seed: 0},
    {requestId: "root::root-standalone::en::2", frameDomain: "root", frame: 2, scenario: "root-standalone", language: "en", seed: 0},
    {requestId: "root::root-standalone::es::1", frameDomain: "root", frame: 1, scenario: "root-standalone", language: "es", seed: 0},
    {requestId: "root::root-standalone::es::2", frameDomain: "root", frame: 2, scenario: "root-standalone", language: "es", seed: 0},
  ]);
});

test("never counts blocked states as renderable and exposes identity fallback", () => {
  const fixture = manifest();
  const requests = buildProbeRequests(fixture);
  const probe = {
    animationId: fixture.animationId,
    prototypeKey: "conversion-1-1",
    prototypeRuntime: {frameCount: 2, frameDomains: [{id: "sprite-7", frameCount: 3}]},
    module: {key: "conversion-1-1", maturity: "legacy-prototype", scenarios: ["default", "blocked"]},
    results: requests.map((request) => {
      const isRoot = request.frameDomain === "root";
      const blocked = request.scenario === "blocked";
      return {
        requestId: request.requestId,
        moduleScenarioDeclared: !isRoot,
        actual: {
          frameDomain: isRoot ? "sprite-7" : request.frameDomain,
          frame: request.frame,
          scenario: isRoot ? "default" : request.scenario,
          language: request.language,
          status: blocked ? "blocked" : "ready",
          blocker: blocked ? "unresolved" : null,
        },
        error: null,
      };
    }),
  };
  const report = buildRendererSupportReport({
    animationId: fixture.animationId,
    manifest: fixture,
    technicalManifestSha256: technicalManifestSha256(fixture),
    probe,
    sourceHashes: sourceHashes(),
  });
  assert.equal(report.status, "renderer-frame-domain-support-incomplete");
  assert.equal(report.summary.probeCount, 12);
  assert.equal(report.summary.renderableCount, 4);
  assert.equal(report.summary.blockedCount, 4);
  assert.equal(report.summary.outcomeCounts["identity-mismatch"], 4);
  assert.equal(report.summary.outcomeCounts["blocked-not-renderable"], 4);
  assert.equal(report.domainSupport.find(({frameDomain}) => frameDomain === "root").fullyRenderable, false);
  assert.equal(report.probes.every(({request, actual}) => request.frame === actual.frame), true);
  const signed = structuredClone(fixture);
  signed.status = "complete";
  signed.acceptance = { ownerReview: { decision: "accepted" } };
  const signedReport = buildRendererSupportReport({
    animationId: signed.animationId,
    manifest: signed,
    technicalManifestSha256: technicalManifestSha256(signed),
    probe,
    sourceHashes: sourceHashes(),
  });
  assert.deepEqual(signedReport, report, "status/acceptance signing must not stale deterministic renderer audit bytes");
});

test("parses bounded audit arguments", () => {
  assert.deepEqual(parseArguments(["--check"]), {
    check: true,
    migrationsRoot: path.join(projectRoot, "migrations"),
    indexPath: path.join(projectRoot, "migrations", "course-shell-pilot-renderer-frame-domain-support-index.json"),
    ids: [],
  });
  assert.throws(() => parseArguments(["--migrations"]), /requires a value/);
  assert.throws(() => parseArguments(["--index"]), /requires a value/);
  assert.deepEqual(parseArguments(["--id", COURSE_PILOT_IDS[0]]).ids, [COURSE_PILOT_IDS[0]]);
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--id", "../escape"]), /safe animation ID/);
});

test("strict renderer audit validation rehashes sources and rejects blocked or wrong-domain requirement endpoints", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "renderer-domain-validator-"));
  const workspace = path.join(root, "migrations", COURSE_PILOT_IDS[0]);
  const animationId = COURSE_PILOT_IDS[0];
  const value = {
    animationId,
    status: "validating",
    runtime: { stage: { width: 800, height: 600 }, fps: 12, frameCount: 2 },
    localization: { languages: ["en", "es"] },
    scenarios: [{ id: "default" }],
    implementation: {
      registryModule: `./modules/${animationId}`,
      timelineModule: `packages/demos/src/timelines/${animationId}.ts`,
      defaultFrameDomainId: "root",
      frameDomains: [{ id: "root", frameCount: 2, scenarioIds: ["default"] }],
    },
    evidence: { fullFrameCoverageFile: "evidence/full-frame-coverage.json" },
  };
  const files = {
    prototypeManifest: "packages/demos/src/prototype-manifest.ts",
    animationRegistry: "packages/demos/src/animation-registry.ts",
    contract: "packages/demos/src/contract.ts",
    builder: "scripts/build-renderer-frame-domain-support.mjs",
    auditContract: "scripts/evidence-projections.mjs",
    probe: "scripts/probe-renderer-frame-domain-support.ts",
    module: `packages/demos/src/modules/${animationId}.tsx`,
    timeline: value.implementation.timelineModule,
  };
  const hashes = {};
  try {
    for (const [id, relativePath] of Object.entries(files)) {
      const bytes = Buffer.from(`fixture ${id}\n`);
      await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
      await writeFile(path.join(root, relativePath), bytes);
      hashes[id] = digest(bytes);
    }
    await mkdir(path.join(workspace, "evidence"), { recursive: true });
    await writeFile(path.join(workspace, "evidence", "full-frame-coverage.json"), `${JSON.stringify({
      schemaVersion: 2,
      animationId,
      requirements: [
        { requirementId: "req-root-en", frameDomainId: "root", scenario: "default", language: "en" },
        { requirementId: "req-root-es", frameDomainId: "root", scenario: "default", language: "es" },
      ],
    })}\n`);
    const manifestBytes = `${JSON.stringify(value, null, 2)}\n`;
    await writeFile(path.join(workspace, "migration.json"), manifestBytes);
    const requests = buildProbeRequests(value, animationId);
    const report = buildRendererSupportReport({
      animationId,
      manifest: value,
      technicalManifestSha256: technicalManifestSha256(value),
      probe: {
        animationId,
        prototypeKey: animationId,
        prototypeRuntime: { frameCount: 2 },
        module: { key: animationId, maturity: "strict-complete", scenarios: ["default"] },
        results: requests.map((request) => ({
          requestId: request.requestId,
          moduleScenarioDeclared: true,
          actual: { frameDomain: request.frameDomain, frame: request.frame, scenario: request.scenario, language: request.language, status: "ready", blocker: null },
          error: null,
        })),
      },
      sourceHashes: {
        prototypeManifest: hashes.prototypeManifest,
        animationRegistry: hashes.animationRegistry,
        contract: hashes.contract,
        builder: hashes.builder,
        auditContract: hashes.auditContract,
        probe: hashes.probe,
        module: { path: files.module, sha256: hashes.module },
        timeline: { path: files.timeline, sha256: hashes.timeline },
      },
    });
    const auditPath = path.join(workspace, "audit", "renderer-frame-domain-support.json");
    await mkdir(path.dirname(auditPath), { recursive: true });
    await writeFile(auditPath, `${JSON.stringify(report, null, 2)}\n`);

    const validErrors = [];
    const valid = await validateRendererFrameDomainSupport({ root: workspace, manifest: value, errors: validErrors, evidenceProjectRoot: root });
    assert.equal(valid.ok, true, validErrors.join("\n"));
    assert.match(valid.reportSha256, /^[a-f0-9]{64}$/);

    const signed = structuredClone(value);
    signed.status = "complete";
    signed.acceptance = { ownerReview: { decision: "accepted", reviewer: "Owner", reviewedAt: "2026-07-22" } };
    await writeFile(path.join(workspace, "migration.json"), `${JSON.stringify(signed, null, 2)}\n`);
    const signingErrors = [];
    const signingStable = await validateRendererFrameDomainSupport({ root: workspace, manifest: signed, errors: signingErrors, evidenceProjectRoot: root });
    assert.equal(signingStable.ok, true, signingErrors.join("\n"));

    report.probes[0].actual.frameDomain = "sprite-7";
    report.probes[0].actual.status = "blocked";
    report.probes[0].actual.blocker = "unresolved";
    await writeFile(auditPath, `${JSON.stringify(report, null, 2)}\n`);
    const stateErrors = [];
    const invalidState = await validateRendererFrameDomainSupport({ root: workspace, manifest: signed, errors: stateErrors, evidenceProjectRoot: root });
    assert.equal(invalidState.ok, false);
    assert.ok(stateErrors.some((error) => error.includes("does not prove exact state frameDomain/frame/scenario/language identity")));
    assert.ok(stateErrors.some((error) => error.includes("blocked and therefore not renderable")));
    assert.ok(stateErrors.some((error) => error.includes("requirement req-root-en has no renderable-exact first frame state")));

    await writeFile(path.join(root, files.timeline), "changed timeline\n");
    const sourceErrors = [];
    await validateRendererFrameDomainSupport({ root: workspace, manifest: signed, errors: sourceErrors, evidenceProjectRoot: root });
    assert.ok(sourceErrors.some((error) => error.includes("pureTimeline SHA-256 differs from the current source")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("all sixteen checked-in renderer frame-domain audits are deterministic and preserve incomplete pilots fail closed", async () => {
  const {index, results} = await buildRendererFrameDomainSupport({check: true});
  assert.equal(index.scope, "all-16-pilots");
  assert.equal(index.pilotCount, 16);
  assert.deepEqual(results.map(({animationId}) => animationId), PILOT_RENDERER_AUDIT_IDS);
  assert.equal(index.fullyRenderablePilotCount, results.filter(({report}) => report.status === "fully-renderable").length);
  assert.equal(index.fullyRenderablePilotCount >= 1, true);
  assert.equal(index.fullyRenderablePilotCount < index.pilotCount, true);
  assert.equal(results.find(({animationId}) => animationId === "course-g03-l06-ti-001")?.report.status, "fully-renderable");
  assert.equal(index.totalRenderableCount < index.totalProbeCount, true);
  assert.equal(index.totalBlockedCount > 0, true);
  for (const {report} of results) {
    assert.equal(report.migrationStatusChanged, false);
    assert.equal(report.strictAcceptanceEffect.startsWith("none;"), true);
    assert.equal(report.probes.every(({renderable, blocked}) => !(renderable && blocked)), true);
  }
});
