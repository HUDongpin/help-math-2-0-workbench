import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {appendFile, mkdtemp, mkdir, readFile, symlink, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {
  buildCoverageV2CapturePlan,
  captureCoverageV2Requirements,
  parseArguments,
} from "./capture-coverage-v2-requirements.mjs";
import {buildCaptureUrl} from "./capture-animation-keyframes.mjs";
import {
  IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
  implementationArtifactRowsSha256,
} from "./implementation-artifact-closure.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(new URL("./capture-coverage-v2-requirements.mjs", import.meta.url));

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function entryState(value) {
  return {
    entryState: value,
    entryStateSha256: sha256(Buffer.from(canonicalJson(value))),
  };
}

function captureContract() {
  return {
    animationIdAttribute: "data-animation-id",
    frameAttribute: "data-flash-frame",
    frameDomainAttribute: "data-flash-frame-domain",
    requirementIdAttribute: "data-flash-requirement-id",
    traceAttribute: "data-flash-trace-id",
    entryStateSha256Attribute: "data-flash-entry-state-sha256",
    frameParameter: "frame",
    frameDomainParameter: "frameDomain",
    requirementIdParameter: "requirementId",
    traceParameter: "trace",
    entryStateSha256Parameter: "entryStateSha256",
    scenarioParameter: "scenario",
    languageParameter: "lang",
    seedParameter: "seed",
  };
}

async function makeFixture({animationId = "course-test-capture-001"} = {}) {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "coverage-v2-orchestrator-"));
  const workspace = path.join(projectRoot, "migrations", animationId);
  await mkdir(path.join(workspace, "evidence"), {recursive: true});
  const manifest = {
    schemaVersion: 2,
    animationId,
    runtime: {
      frameCount: 2,
      stage: {width: 4, height: 3},
      timelineDefinitions: [
        {id: "root", frameCount: 2},
        {id: "sprite-7", frameCount: 3},
      ],
    },
    implementation: {
      route: `/animations/${animationId}`,
      captureContract: captureContract(),
      frameDomains: [
        {id: "root", frameCount: 2, scenarioIds: ["root-standalone"]},
        {id: "sprite-7", frameCount: 3, scenarioIds: ["branch-1"]},
      ],
    },
  };
  const rootEntry = {
    kind: "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: "root-standalone",
    language: "en",
    seed: "17",
  };
  const rootSpanishEntry = {
    ...rootEntry,
    language: "es",
    seed: "18",
  };
  const childEnglishEntry = {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: 2,
    frameDomainId: "sprite-7",
    localEntryFrame: 1,
    scenario: "branch-1",
    language: "en",
    seed: "22",
  };
  const childEntry = {
    ...childEnglishEntry,
    language: "es",
    seed: "23",
  };
  const coverage = {
    schemaVersion: 2,
    animationId,
    requirements: [
      {
        requirementId: "req:root:root-standalone:en",
        scenario: "root-standalone",
        frameDomainId: "root",
        traceId: "trace:root:root-standalone:en:seed-17",
        language: "en",
        seed: "17",
        requiredRange: {firstFrame: 1, lastFrame: 2},
        ...entryState(rootEntry),
      },
      {
        requirementId: "req:root:root-standalone:es",
        scenario: "root-standalone",
        frameDomainId: "root",
        traceId: "trace:root:root-standalone:es:seed-18",
        language: "es",
        seed: "18",
        requiredRange: {firstFrame: 1, lastFrame: 2},
        ...entryState(rootSpanishEntry),
      },
      {
        requirementId: "req:sprite-7:branch-1:en",
        scenario: "branch-1",
        frameDomainId: "sprite-7",
        traceId: "trace:sprite-7:branch-1:en:seed-22",
        language: "en",
        seed: "22",
        requiredRange: {firstFrame: 1, lastFrame: 3},
        ...entryState(childEnglishEntry),
      },
      {
        requirementId: "req:sprite-7:branch-1:es",
        scenario: "branch-1",
        frameDomainId: "sprite-7",
        traceId: "trace:sprite-7:branch-1:es:seed-23",
        language: "es",
        seed: "23",
        requiredRange: {firstFrame: 1, lastFrame: 3},
        ...entryState(childEntry),
      },
    ],
  };
  const migrationPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  await Promise.all([
    writeFile(migrationPath, json(manifest)),
    writeFile(coveragePath, json(coverage)),
  ]);
  return {projectRoot, workspace, animationId, manifest, coverage, migrationPath, coveragePath};
}

function outputRoot(fixture, suffix = "run") {
  return path.join(fixture.projectRoot, "output", "playwright", suffix);
}

function pngBytes(width, height, frame) {
  const png = new PNG({width, height});
  for (let offset = 0; offset < png.data.length; offset += 4) {
    png.data[offset] = frame * 20;
    png.data[offset + 1] = frame * 30;
    png.data[offset + 2] = frame * 40;
    png.data[offset + 3] = 255;
  }
  return PNG.sync.write(png);
}

function validImplementationArtifactClosure() {
  const artifacts = [{
    path: "packages/demos/src/modules/test-fixture.tsx",
    bytes: 1,
    sha256: "c".repeat(64),
  }];
  const projections = [];
  return {
    schemaVersion: 1,
    algorithm: IMPLEMENTATION_ARTIFACT_CLOSURE_ALGORITHM,
    artifactCount: artifacts.length,
    projectionCount: projections.length,
    totalBytes: 1,
    aggregateSha256: implementationArtifactRowsSha256(artifacts, projections),
    artifacts,
    projections,
  };
}

function fakeCaptureFactory(calls, {failAt = 0, mutate} = {}) {
  let active = false;
  return async (options) => {
    assert.equal(active, false, "capture calls must be sequential");
    active = true;
    const callNumber = calls.length + 1;
    calls.push(options);
    try {
      if (callNumber === failAt) throw new Error(`injected capture failure ${callNumber}`);
      await mkdir(options.output, {recursive: true});
      const captured = [];
      const pad = Math.max(3, String(Math.max(...options.frameList)).length);
      for (const frame of options.frameList) {
        const filename = `frame-${String(frame).padStart(pad, "0")}.png`;
        const bytes = pngBytes(options.width, options.height, frame);
        await writeFile(path.join(options.output, filename), bytes);
        captured.push({
          animationId: options.id,
          reportedAnimationId: options.id,
          frame,
          reportedFrame: frame,
          frameDomain: options.frameDomain,
          frameDomainId: options.frameDomain,
          reportedFrameDomainId: options.frameDomain,
          rootFrame: options.frameDomain === "root" ? frame : 2,
          requirementId: options.requirementId,
          traceId: options.trace,
          entryStateSha256: options.entryStateSha256,
          scenario: options.scenario,
          language: options.lang,
          seed: String(options.seed),
          flashContextIdentityComplete: true,
          reportedRenderState: "ready",
          visualTarget: {
            tagName: "canvas",
            reportedRenderState: "ready",
            animationId: options.id,
            reportedFrame: frame,
            frameDomainId: options.frameDomain,
            rootFrame: options.frameDomain === "root" ? frame : 2,
            requirementId: options.requirementId,
            traceId: options.trace,
            entryStateSha256: options.entryStateSha256,
            scenario: options.scenario,
            language: options.lang,
            seed: String(options.seed),
            flashContextIdentityComplete: true,
          },
          file: filename,
          sha256: sha256(bytes),
          width: options.width,
          height: options.height,
          url: buildCaptureUrl(options, frame).href,
        });
      }
      const manifest = {
        schemaVersion: 4,
        status: "complete",
        animationId: options.id,
        sourceUrl: options.url,
        selector: options.selector,
        reportedAnimationIdAttribute: "data-animation-id",
        reportedFrameAttribute: "data-flash-frame",
        reportedFrameDomainAttribute: "data-flash-frame-domain",
        reportedRequirementIdAttribute: "data-flash-requirement-id",
        reportedTraceAttribute: "data-flash-trace-id",
        reportedEntryStateSha256Attribute: "data-flash-entry-state-sha256",
        reportedFlashScenarioAttribute: "data-flash-scenario",
        reportedFlashLanguageAttribute: "data-flash-lang",
        reportedFlashSeedAttribute: "data-flash-seed",
        reportedScenarioAttribute: "data-runtime-scenario",
        reportedLanguageAttribute: "data-runtime-language",
        reportedSeedAttribute: "data-runtime-seed",
        flashContextIdentityComplete: true,
        captureStageAttribute: "data-capture-stage",
        reportedRenderStateAttribute: "data-render-state",
        reportedVisualTargetAttribute: "data-render-visual",
        requiredRenderState: "ready",
        frameDomainId: options.frameDomain,
        requestedFrameDomain: options.frameDomain,
        requirementId: options.requirementId,
        traceId: options.trace,
        entryStateSha256: options.entryStateSha256,
        scenario: options.scenario,
        language: options.lang,
        seed: String(options.seed),
        viewport: {
          width: options.width,
          height: options.height,
          deviceScaleFactor: options.deviceScale,
        },
        queryParameters: {
          frame: options.frameParam,
          frameDomain: options.frameDomainParam,
          requirementId: options.requirementIdParam,
          trace: options.traceParam,
          entryStateSha256: options.entryStateSha256Param,
          scenario: options.scenarioParam,
          language: options.langParam,
          seed: options.seedParam,
        },
        generatorProvenance: {
          schemaVersion: 1,
          script: {path: "scripts/capture-animation-keyframes.mjs", sha256: "a".repeat(64)},
          playwright: {
            package: "@playwright/test",
            version: "1.0.0",
            packageJsonPath: "node_modules/@playwright/test/package.json",
            packageJsonSha256: "b".repeat(64),
          },
          browser: {type: "chromium", version: "test"},
        },
        implementationArtifactClosure: validImplementationArtifactClosure(),
        captured,
        consoleErrors: [],
        failedRequests: [],
        httpErrors: [],
        unexpectedRequests: [],
        error: null,
      };
      if (mutate) mutate(manifest, options, callNumber);
      await writeFile(path.join(options.output, "capture-manifest.json"), json(manifest));
      return {output: options.output, manifest};
    } finally {
      active = false;
    }
  };
}

function optionsFor(fixture, {suffix = "run", requirements = [], check = false, baseUrl = "http://localhost:3213"} = {}) {
  return {
    id: fixture.animationId,
    projectRoot: fixture.projectRoot,
    baseUrl,
    outputRoot: `output/playwright/${suffix}`,
    requirements,
    check,
  };
}

test("parseArguments supports repeatable exact requirement filters", () => {
  const options = parseArguments([
    "--id", "course-test",
    "--base-url", "http://localhost:3213",
    "--requirement", "req:a",
    "--requirement", "req:b",
    "--check",
  ]);
  assert.deepEqual(options.requirements, ["req:a", "req:b"]);
  assert.equal(options.check, true);
  assert.throws(
    () => parseArguments(["--id", "a", "--id", "b", "--base-url", "http://localhost:1"]),
    /--id may be specified only once/,
  );
});

test("--json keeps stdout machine-readable while progress goes to stderr", async () => {
  const fixture = await makeFixture();
  const {stdout, stderr} = await execFileAsync(process.execPath, [
    SCRIPT_PATH,
    "--project-root", fixture.projectRoot,
    "--id", fixture.animationId,
    "--base-url", "http://localhost:3213",
    "--output-root", "output/playwright/json-check",
    "--check",
    "--json",
  ]);
  const value = JSON.parse(stdout);
  assert.equal(value.animationId, fixture.animationId);
  assert.equal(value.selectedRequirementCount, 4);
  assert.match(stderr, /\[plan 1\/4\]/);
});

test("captures every exact coverage identity sequentially and writes a deterministic non-authoritative manifest", async () => {
  const fixture = await makeFixture();
  const calls = [];
  const lines = [];
  const result = await captureCoverageV2Requirements(optionsFor(fixture), {
    capture: fakeCaptureFactory(calls),
    collectCurrentArtifactClosure: async () => validImplementationArtifactClosure(),
    logger: (line) => lines.push(line),
  });
  assert.equal(calls.length, 4);
  assert.deepEqual(calls[0].frameList, [1, 2]);
  assert.deepEqual(calls[3].frameList, [1, 2, 3]);
  assert.equal(calls[0].url, `http://localhost:3213/en/animations/${fixture.animationId}`);
  assert.equal(calls[3].url, `http://localhost:3213/es/animations/${fixture.animationId}`);
  assert.equal(calls[0].lang, "en");
  assert.equal(calls[3].lang, "es");
  assert.equal(calls[0].scenario, "root-standalone");
  assert.equal(calls[3].scenario, "branch-1");
  assert.equal(calls[0].seed, "17");
  assert.equal(calls[3].seed, "23");
  assert.equal(calls[0].trace, fixture.coverage.requirements[0].traceId);
  assert.equal(calls[3].trace, fixture.coverage.requirements[3].traceId);
  assert.equal(calls[0].entryStateSha256, fixture.coverage.requirements[0].entryStateSha256);
  assert.equal(calls[3].entryStateSha256, fixture.coverage.requirements[3].entryStateSha256);
  assert.deepEqual(
    calls.map(({width, height, deviceScale}) => ({width, height, deviceScale})),
    Array.from({length: 4}, () => ({width: 4, height: 3, deviceScale: 1})),
  );
  assert.equal(result.manifest.status, "complete-non-authoritative-implementation-capture-orchestration");
  assert.equal(result.manifest.selection.totalFrameCount, 10);
  assert.equal(result.manifest.outputs.length, 4);
  assert.equal(result.manifest.authority.currentJavascriptImplementationCaptureOnly, true);
  for (const field of [
    "originalRuntimeBaseline",
    "visualOrBehavioralParity",
    "rmseAcceptance",
    "audioAcceptance",
    "humanVisualReview",
    "ownerAcceptance",
    "migrationCompletion",
  ]) assert.equal(result.manifest.authority[field], false);
  assert.ok(lines.some((line) => line.startsWith("[capture 1/4]")));
  assert.ok(lines.some((line) => line.startsWith("[captured 4/4]")));
  assert.ok(lines.some((line) => line.startsWith("[orchestration complete]")));

  const secondFixture = await makeFixture({animationId: fixture.animationId});
  const second = await captureCoverageV2Requirements(optionsFor(secondFixture), {
    capture: fakeCaptureFactory([]),
    collectCurrentArtifactClosure: async () => validImplementationArtifactClosure(),
    logger: () => {},
  });
  assert.deepEqual(second.manifest, result.manifest);
});

test("--check plans only and an exact requirement filter intentionally omits other requirements", async () => {
  const fixture = await makeFixture();
  const calls = [];
  const selected = fixture.coverage.requirements[3].requirementId;
  const result = await captureCoverageV2Requirements(optionsFor(fixture, {
    requirements: [selected],
    check: true,
  }), {
    capture: fakeCaptureFactory(calls),
    logger: () => {},
  });
  assert.equal(calls.length, 0);
  assert.equal(result.mode, "check");
  assert.equal(result.plan.selectedAllRequirements, false);
  assert.equal(result.plan.selectedRequirementCount, 1);
  assert.equal(result.plan.totalFrameCount, 3);
  assert.deepEqual(result.plan.requirements.map(({requirementId}) => requirementId), [selected]);
  await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
});

test("implementation-only frame-domain contracts can plan non-authoritative captures", async () => {
  const fixture = await makeFixture();
  delete fixture.manifest.runtime.timelineDefinitions;
  await writeFile(fixture.migrationPath, json(fixture.manifest));
  const result = await captureCoverageV2Requirements(optionsFor(fixture, {check: true}), {
    logger: () => {},
  });
  assert.equal(result.mode, "check");
  assert.equal(result.plan.selectedRequirementCount, 4);
  assert.equal(result.plan.totalFrameCount, 10);

  fixture.manifest.runtime.timelineDefinitions = [];
  await writeFile(fixture.migrationPath, json(fixture.manifest));
  await assert.rejects(
    buildCoverageV2CapturePlan(optionsFor(fixture)),
    /declared migration\.runtime\.timelineDefinitions must be a non-empty array/,
  );
});

test("rejects non-loopback or ambiguous base URLs", async () => {
  const fixture = await makeFixture();
  for (const baseUrl of [
    "https://localhost:3213",
    "http://example.com:3213",
    "http://user@localhost:3213",
    "http://localhost:3213/path",
    "http://localhost:3213/?query=1",
  ]) {
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture, {baseUrl})),
      /base-url/,
    );
  }
});

test("rejects output traversal and locations outside output/playwright", async () => {
  const fixture = await makeFixture();
  await assert.rejects(
    buildCoverageV2CapturePlan({...optionsFor(fixture), outputRoot: "output/playwright/../escape"}),
    /traversal/,
  );
  await assert.rejects(
    buildCoverageV2CapturePlan({...optionsFor(fixture), outputRoot: path.join(fixture.projectRoot, "elsewhere")}),
    /child of output\/playwright/,
  );
});

test("rejects existing nonempty requirement output before invoking capture", async () => {
  const fixture = await makeFixture();
  const root = outputRoot(fixture);
  const requirementOutput = path.join(root, "req-root-root-standalone-en");
  await mkdir(requirementOutput, {recursive: true});
  await writeFile(path.join(requirementOutput, "old.png"), "do not overwrite");
  const calls = [];
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: fakeCaptureFactory(calls),
      logger: () => {},
    }),
    /existing requirement output .* is nonempty/,
  );
  assert.equal(calls.length, 0);
  assert.equal(await readFile(path.join(requirementOutput, "old.png"), "utf8"), "do not overwrite");
});

test("rejects symbolic links in inputs and output requirement paths", async (t) => {
  await t.test("coverage input symlink", async () => {
    const fixture = await makeFixture();
    const realCoverage = path.join(fixture.workspace, "evidence", "coverage-real.json");
    await writeFile(realCoverage, json(fixture.coverage));
    await unlink(fixture.coveragePath);
    await symlink(realCoverage, fixture.coveragePath);
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture)),
      /symbolic-link component/,
    );
  });

  await t.test("requirement output symlink", async () => {
    const fixture = await makeFixture();
    const root = outputRoot(fixture);
    const external = path.join(fixture.projectRoot, "external-empty");
    await Promise.all([mkdir(root, {recursive: true}), mkdir(external)]);
    await symlink(external, path.join(root, "req-root-root-standalone-en"));
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture)),
      /forbidden symbolic link/,
    );
  });
});

test("fails closed on omitted or inconsistent coverage identities", async (t) => {
  await t.test("missing trace", async () => {
    const fixture = await makeFixture();
    delete fixture.coverage.requirements[0].traceId;
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(buildCoverageV2CapturePlan(optionsFor(fixture)), /traceId must be a non-empty string/);
  });

  await t.test("incomplete domain range", async () => {
    const fixture = await makeFixture();
    fixture.coverage.requirements[3].requiredRange.lastFrame = 2;
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(buildCoverageV2CapturePlan(optionsFor(fixture)), /only supports the full 1\.\.frameCount range/);
  });

  await t.test("entry-state hash mismatch", async () => {
    const fixture = await makeFixture();
    fixture.coverage.requirements[1].entryStateSha256 = "0".repeat(64);
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(buildCoverageV2CapturePlan(optionsFor(fixture)), /does not match the canonical entryState/);
  });

  await t.test("reserved capture query parameter", async () => {
    const fixture = await makeFixture();
    fixture.manifest.implementation.captureContract.seedParameter = "capture";
    await writeFile(fixture.migrationPath, json(fixture.manifest));
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture)),
      /must not use the reserved capture query parameter/,
    );
  });

  await t.test("safe output-name collision", async () => {
    const fixture = await makeFixture();
    const clone = structuredClone(fixture.coverage.requirements[0]);
    clone.requirementId = "req_root_root_standalone_en";
    clone.traceId = "trace:other";
    fixture.coverage.requirements.push(clone);
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(buildCoverageV2CapturePlan(optionsFor(fixture)), /collide after safe output-name normalization/);
  });

  await t.test("omitted domain scenario language requirement", async () => {
    const fixture = await makeFixture();
    fixture.coverage.requirements.pop();
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture)),
      /does not enumerate every declared domain\/scenario\/language requirement: missing sprite-7\/branch-1\/es/,
    );
  });

  await t.test("overlapping supplemental group selections", async () => {
    const fixture = await makeFixture();
    const first = {
      ...structuredClone(fixture.coverage.requirements[0]),
      requirementId: "req:root:root-standalone:en:partial-a",
      traceId: "trace:root:root-standalone:en:partial-a",
      requirementSchemaVersion: 2,
      coverageRole: "partial-path",
      coverageGroupId: "coverage-group:root:root-standalone:en:seed-17",
      requiredRange: {firstFrame: 1, lastFrame: 1},
      strictAcceptanceEffect: "none",
    };
    first.selectionSha256 = selectionSha256(first, 2);
    const second = {
      ...structuredClone(first),
      requirementId: "req:root:root-standalone:en:partial-b",
      traceId: "trace:root:root-standalone:en:partial-b",
    };
    fixture.coverage.requirements.push(first, second);
    await writeFile(fixture.coveragePath, json(fixture.coverage));
    await assert.rejects(
      buildCoverageV2CapturePlan(optionsFor(fixture)),
      /overlapping physical frame 1/,
    );
  });
});

test("schema-v2 supplemental capture uses the exact normalized physical selection and binds it in orchestration", async () => {
  const fixture = await makeFixture();
  const supplemental = {
    ...structuredClone(fixture.coverage.requirements[0]),
    requirementId: "req:root:root-standalone:en:partial-frame-1",
    traceId: "trace:root:root-standalone:en:seed-17:partial-frame-1",
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:root:root-standalone:en:seed-17",
    requiredRange: {firstFrame: 1, lastFrame: 1},
    strictAcceptanceEffect: "none",
  };
  supplemental.selectionSha256 = selectionSha256(supplemental, 2);
  fixture.coverage.requirements.push(supplemental);
  await writeFile(fixture.coveragePath, json(fixture.coverage));

  const calls = [];
  const result = await captureCoverageV2Requirements(optionsFor(fixture, {
    suffix: "supplemental",
    requirements: [supplemental.requirementId],
  }), {
    capture: fakeCaptureFactory(calls),
    collectCurrentArtifactClosure: async () => validImplementationArtifactClosure(),
    logger: () => {},
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].frameList, [1]);
  assert.equal(result.manifest.schemaVersion, 2);
  assert.equal(result.manifest.selection.schemaVersion, 2);
  assert.equal(result.manifest.selection.totalFrameCount, 1);
  assert.deepEqual(result.manifest.selection.requirementIds, [supplemental.requirementId]);
  assert.deepEqual(result.manifest.selection.requirements[0].selectedPhysicalFrames, [1]);
  assert.equal(result.manifest.selection.requirements[0].coverageRole, "partial-path");
  assert.equal(result.manifest.selection.requirements[0].coverageGroupId, supplemental.coverageGroupId);
  assert.equal(result.manifest.selection.requirements[0].selectionSha256, supplemental.selectionSha256);
  assert.deepEqual(result.manifest.outputs[0].selectedPhysicalFrames, [1]);
  assert.equal(result.manifest.outputs[0].frameCount, 1);
  assert.equal(result.manifest.outputs[0].domainFrameCount, 2);
});

test("partial capture failure leaves no orchestration manifest labeled complete", async () => {
  const fixture = await makeFixture();
  const calls = [];
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: fakeCaptureFactory(calls, {failAt: 2}),
      logger: () => {},
    }),
    /injected capture failure 2/,
  );
  assert.equal(calls.length, 2);
  const manifestPath = path.join(outputRoot(fixture), "capture-orchestration.json");
  await assert.rejects(readFile(manifestPath), {code: "ENOENT"});
  assert.ok(await readFile(path.join(
    outputRoot(fixture),
    "req-root-root-standalone-en",
    "capture-manifest.json",
  )));
});

test("rejects a complete child capture with an omitted identity or unexpected output file", async (t) => {
  await t.test("identity omission", async () => {
    const fixture = await makeFixture();
    await assert.rejects(
      captureCoverageV2Requirements(optionsFor(fixture), {
        capture: fakeCaptureFactory([], {
          mutate(manifest, _options, callNumber) {
            if (callNumber === 1) delete manifest.traceId;
          },
        }),
        logger: () => {},
      }),
      /capture\.traceId differs from the planned coverage identity/,
    );
    await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
  });

  await t.test("unexpected file", async () => {
    const fixture = await makeFixture();
    const fake = fakeCaptureFactory([]);
    await assert.rejects(
      captureCoverageV2Requirements(optionsFor(fixture), {
        capture: async (options) => {
          await fake(options);
          await writeFile(path.join(options.output, "unexpected.txt"), "unexpected");
        },
        logger: () => {},
      }),
      /unexpected or missing files/,
    );
    await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
  });
});

test("rejects child captures made from different implementation artifact closures", async () => {
  const fixture = await makeFixture();
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: fakeCaptureFactory([], {
        mutate(manifest, _options, callNumber) {
          if (callNumber === 2) {
            const closure = manifest.implementationArtifactClosure;
            closure.artifacts[0].sha256 = "d".repeat(64);
            closure.aggregateSha256 = implementationArtifactRowsSha256(closure.artifacts, closure.projections);
          }
        },
      }),
      logger: () => {},
    }),
    /implementation artifact closure differs between requirement outputs/,
  );
  await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
});

test("recomputes the current implementation closure after the final child and fails stale", async () => {
  const fixture = await makeFixture();
  const staleCurrent = validImplementationArtifactClosure();
  staleCurrent.artifacts[0].sha256 = "e".repeat(64);
  staleCurrent.aggregateSha256 = implementationArtifactRowsSha256(staleCurrent.artifacts, staleCurrent.projections);
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: fakeCaptureFactory([]),
      collectCurrentArtifactClosure: async () => staleCurrent,
      logger: () => {},
    }),
    /implementation artifact closure is stale after capture orchestration/,
  );
  await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
});

test("revalidates earlier child outputs immediately before writing the orchestration manifest", async () => {
  const fixture = await makeFixture();
  const fake = fakeCaptureFactory([]);
  let firstManifestPath;
  let callNumber = 0;
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: async (options) => {
        callNumber += 1;
        await fake(options);
        if (callNumber === 1) firstManifestPath = path.join(options.output, "capture-manifest.json");
        if (callNumber === 4) await appendFile(firstManifestPath, "\n");
      },
      collectCurrentArtifactClosure: async () => validImplementationArtifactClosure(),
      logger: () => {},
    }),
    /capture output changed before orchestration finalization/,
  );
  await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
});

test("rejects malformed schema-v4 generator provenance before orchestration completion", async () => {
  const fixture = await makeFixture();
  await assert.rejects(
    captureCoverageV2Requirements(optionsFor(fixture), {
      capture: fakeCaptureFactory([], {
        mutate(manifest, _options, callNumber) {
          if (callNumber === 1) manifest.generatorProvenance.playwright.version = "not-semver";
        },
      }),
      logger: () => {},
    }),
    /capture generator provenance is invalid/,
  );
  await assert.rejects(readFile(path.join(outputRoot(fixture), "capture-orchestration.json")), {code: "ENOENT"});
});
