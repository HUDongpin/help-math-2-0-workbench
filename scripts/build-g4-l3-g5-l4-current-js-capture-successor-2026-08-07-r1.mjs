#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  open,
  readFile,
  readdir,
  stat,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from "./implementation-artifact-closure.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR =
  "scripts/build-g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.mjs";
const JSON_OUTPUT =
  "reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.json";
const MARKDOWN_OUTPUT =
  "reports/g4-l3-g5-l4-current-js-capture-successor-2026-08-07-r1.md";

const G4_ID = "course-g04-l03-ts-006";
const G4_CAPTURE_ROOT =
  "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r3";
const G4_REQUIREMENT_DIRECTORY =
  `${G4_CAPTURE_ROOT}/req-sprite-23-lesson-shell-natural-entry-en`;
const G5_ID = "course-g05-l04-rw-002";
const G5_CAPTURE_ROOT =
  "output/playwright/g5-l4-current-js-v1/course-g05-l04-rw-002-en-current-r1";
const G5_REQUIREMENT_DIRECTORY =
  `${G5_CAPTURE_ROOT}/req-sprite-341-lesson-shell-natural-entry-en`;
const G5_SHELL_ID = "shell-course-g05-l04-index-local";

const G4_FAILURES = Object.freeze([
  {
    attempt: "r1",
    path: "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r1/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json",
    cause: "private-preview-session-redirect-prevented-capture-stage",
    localTransportExpected: false,
    expectedHttpErrorCount: 0,
  },
  {
    attempt: "r2",
    path: "output/playwright/g4-l3-current-js-v3/course-g04-l03-ts-006-en-current-r2/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json",
    cause: "local-proxy-access-succeeded-but-production-animation-route-returned-404",
    localTransportExpected: true,
    expectedHttpErrorCount: 1,
  },
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function absolute(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required",
  );
  invariant(!path.isAbsolute(relativePath), `${relativePath}: absolute path rejected`);
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `${relativePath}: path escapes project root`,
  );
  return resolved;
}

async function bind(relativePath, parseJson = false) {
  const resolved = absolute(relativePath);
  const before = await lstat(resolved);
  const physical = await stat(resolved);
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${relativePath}: ordinary non-symbolic-link file required`,
  );
  invariant(physical.nlink === 1, `${relativePath}: hard link rejected`);
  const bytes = await readFile(resolved);
  const after = await lstat(resolved);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size,
    `${relativePath}: file changed while read`,
  );
  return {
    descriptor: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)},
    bytes,
    value: parseJson ? JSON.parse(bytes.toString("utf8")) : null,
  };
}

function expectedLocalCaptureTransport() {
  return {
    mode: "loopback-request-header",
    headerName: "x-helpmath-local-capture-token",
    exactOrigin: "http://127.0.0.1:3217",
    tokenSource: {
      kind: "environment-variable",
      name: "HELP_MATH_LOCAL_CAPTURE_TOKEN",
    },
    credentialRecorded: false,
  };
}

async function validateCapture({
  animationId,
  captureRoot,
  requirementDirectory,
  requirementId,
  frameDomainId,
  expectedFrameCount,
}) {
  const orchestrationPath = `${captureRoot}/capture-orchestration.json`;
  const captureManifestPath = `${requirementDirectory}/capture-manifest.json`;
  const migrationPath = `migrations/${animationId}/migration.json`;
  const [orchestration, capture, migration] = await Promise.all([
    bind(orchestrationPath, true),
    bind(captureManifestPath, true),
    bind(migrationPath, true),
  ]);
  invariant(
    orchestration.value.status ===
      "complete-non-authoritative-implementation-capture-orchestration" &&
      orchestration.value.animationId === animationId,
    `${animationId}: orchestration identity or status changed`,
  );
  invariant(
    orchestration.value.selection?.selectedRequirementCount === 1 &&
      orchestration.value.selection?.totalFrameCount === expectedFrameCount &&
      orchestration.value.selection?.requirementIds?.[0] === requirementId,
    `${animationId}: orchestration selection changed`,
  );
  invariant(
    Object.entries(orchestration.value.authority ?? {}).every(([key, value]) =>
      key === "currentJavascriptImplementationCaptureOnly" ? value === true : value === false),
    `${animationId}: orchestration authority boundary changed`,
  );
  invariant(
    canonicalJson(orchestration.value.application?.localCaptureTransport) ===
      canonicalJson(expectedLocalCaptureTransport()),
    `${animationId}: orchestration local capture transport changed`,
  );
  invariant(
    capture.value.status === "complete" &&
      capture.value.animationId === animationId &&
      capture.value.requirementId === requirementId &&
      capture.value.frameDomainId === frameDomainId &&
      capture.value.requestedFrameDomain === frameDomainId,
    `${animationId}: capture identity or status changed`,
  );
  invariant(
    canonicalJson(capture.value.localCaptureTransport) ===
      canonicalJson(expectedLocalCaptureTransport()),
    `${animationId}: capture local transport changed`,
  );
  for (const field of [
    "consoleErrors",
    "failedRequests",
    "httpErrors",
    "unexpectedRequests",
  ]) {
    invariant(
      Array.isArray(capture.value[field]) && capture.value[field].length === 0,
      `${animationId}: ${field} is not empty`,
    );
  }
  invariant(capture.value.error === null, `${animationId}: capture reports an error`);
  invariant(
    Array.isArray(capture.value.captured) &&
      capture.value.captured.length === expectedFrameCount,
    `${animationId}: captured frame count changed`,
  );
  invariant(
    implementationArtifactClosureErrors(
      capture.value.implementationArtifactClosure,
    ).length === 0,
    `${animationId}: stored implementation artifact closure is invalid`,
  );
  const currentClosure = await collectImplementationArtifactClosure({
    projectRoot: ROOT,
    workspace: absolute(`migrations/${animationId}`),
    manifest: migration.value,
  });
  const currentnessErrors = implementationArtifactClosureErrors(
    capture.value.implementationArtifactClosure,
    currentClosure,
  );
  invariant(
    currentnessErrors.length === 0,
    `${animationId}: capture implementation closure is stale (${currentnessErrors.join("; ")})`,
  );

  const expectedNames = new Set(["capture-manifest.json"]);
  const frameRows = [];
  for (let index = 0; index < expectedFrameCount; index += 1) {
    const expectedFrame = index + 1;
    const row = capture.value.captured[index];
    invariant(
      row.frame === expectedFrame && row.reportedFrame === expectedFrame,
      `${animationId}: frame ${expectedFrame} identity changed`,
    );
    invariant(
      row.width === 800 && row.height === 600 &&
        row.reportedRenderState === "ready" &&
        row.flashContextIdentityComplete === true,
      `${animationId}: frame ${expectedFrame} is not a ready native-stage capture`,
    );
    invariant(
      typeof row.file === "string" &&
        path.basename(row.file) === row.file &&
        /^frame-\d{3}\.png$/u.test(row.file) &&
        !expectedNames.has(row.file),
      `${animationId}: unsafe or duplicate frame filename`,
    );
    expectedNames.add(row.file);
    const record = await bind(`${requirementDirectory}/${row.file}`);
    invariant(
      record.descriptor.sha256 === row.sha256,
      `${animationId}: ${row.file} hash differs from capture manifest`,
    );
    frameRows.push(record.descriptor);
  }
  const entries = await readdir(absolute(requirementDirectory));
  invariant(
    entries.length === expectedNames.size &&
      entries.every((name) => expectedNames.has(name)),
    `${animationId}: capture directory contains unexpected or missing entries`,
  );
  const canonicalRows = [...frameRows].sort((left, right) =>
    left.path.localeCompare(right.path));
  const frameArchive = {
    fileCount: canonicalRows.length,
    totalBytes: canonicalRows.reduce((sum, row) => sum + row.bytes, 0),
    aggregateSha256: sha256(Buffer.from(canonicalJson(canonicalRows))),
  };
  const output = orchestration.value.outputs?.[0];
  invariant(
    output?.requirementId === requirementId &&
      output?.frameDomainId === frameDomainId &&
      output?.frameCount === expectedFrameCount &&
      canonicalJson(output.frameArchive) === canonicalJson(frameArchive) &&
      output.captureManifest?.sha256 === capture.descriptor.sha256,
    `${animationId}: orchestration output differs from rehashed capture archive`,
  );

  return {
    animationId,
    requirementId,
    frameDomainId,
    language: capture.value.language,
    scenario: capture.value.scenario,
    capturedAt: capture.value.capturedAt,
    orchestration: orchestration.descriptor,
    captureManifest: capture.descriptor,
    frameArchive,
    implementationArtifactClosure: {
      artifactCount: currentClosure.artifactCount,
      projectionCount: currentClosure.projectionCount,
      totalBytes: currentClosure.totalBytes,
      aggregateSha256: currentClosure.aggregateSha256,
      currentAtSuccessorBuild: true,
    },
    authority: orchestration.value.authority,
  };
}

async function validateFailedAttempts() {
  const results = [];
  for (const expected of G4_FAILURES) {
    const record = await bind(expected.path, true);
    invariant(
      record.value.status === "failed" &&
        record.value.animationId === G4_ID &&
        record.value.captured?.length === 0 &&
        typeof record.value.error === "string" &&
        record.value.error.includes("Timeout 30000ms exceeded") &&
        record.value.httpErrors?.length === expected.expectedHttpErrorCount,
      `${expected.attempt}: failed-attempt evidence changed`,
    );
    if (expected.localTransportExpected) {
      invariant(
        canonicalJson(record.value.localCaptureTransport) ===
          canonicalJson(expectedLocalCaptureTransport()),
        `${expected.attempt}: local capture transport changed`,
      );
    } else {
      invariant(
        record.value.localCaptureTransport === undefined,
        `${expected.attempt}: pre-transport failure must remain pre-transport`,
      );
    }
    results.push({
      attempt: expected.attempt,
      cause: expected.cause,
      captureManifest: record.descriptor,
      status: record.value.status,
      capturedFrameCount: 0,
      retained: true,
      repairedInPlace: false,
    });
  }
  return results;
}

export async function buildCurrentJsCaptureSuccessor() {
  const [
    generator,
    localAccess,
    proxy,
    animationRoute,
    keyframeCapture,
    coverageCapture,
    coverageCaptureTest,
    webAccessTest,
    strictGap,
    g4InventorySuccessor,
    g4HistoricalApproval,
    g4HistoricalAdoption,
    g5Candidate,
    g5ShellMigration,
    g5ShellCoverage,
    g4Capture,
    g5Capture,
    failedAttempts,
  ] = await Promise.all([
    bind(GENERATOR),
    bind("apps/web/lib/executive-preview-access.ts"),
    bind("apps/web/proxy.ts"),
    bind("apps/web/app/[locale]/animations/[animationId]/page.tsx"),
    bind("scripts/capture-animation-keyframes.mjs"),
    bind("scripts/capture-coverage-v2-requirements.mjs"),
    bind("scripts/capture-coverage-v2-requirements.test.mjs"),
    bind("apps/web/tests/executive-preview-access.test.ts"),
    bind("reports/g4-l3-g5-l4-strict-gap-currentness-successor-2026-08-07-r1.json", true),
    bind("reports/g4-l3-ts006-asset-inventory-currentness-successor-2026-08-07-r1.json", true),
    bind("reports/g4-l3-current-javascript-output-human-approval-page-001.json", true),
    bind("migrations/course-g04-l03-ts-006/evidence/current-javascript-implementation-capture-adoption.json", true),
    bind("migrations/course-g05-l04-rw-002/evidence/source-static-current-js-candidate.json", true),
    bind(`migrations/${G5_SHELL_ID}/migration.json`, true),
    bind(`migrations/${G5_SHELL_ID}/evidence/full-frame-coverage.json`, true),
    validateCapture({
      animationId: G4_ID,
      captureRoot: G4_CAPTURE_ROOT,
      requirementDirectory: G4_REQUIREMENT_DIRECTORY,
      requirementId: "req:sprite-23:lesson-shell-natural-entry:en",
      frameDomainId: "sprite-23",
      expectedFrameCount: 128,
    }),
    validateCapture({
      animationId: G5_ID,
      captureRoot: G5_CAPTURE_ROOT,
      requirementDirectory: G5_REQUIREMENT_DIRECTORY,
      requirementId: "req:sprite-341:lesson-shell-natural-entry:en",
      frameDomainId: "sprite-341",
      expectedFrameCount: 419,
    }),
    validateFailedAttempts(),
  ]);

  invariant(
    strictGap.value.status ===
      "current-by-successor-validation-original-runtime-human-owner-strict-and-publication-closed",
    "strict-gap successor boundary changed",
  );
  invariant(
    g4InventorySuccessor.value.status ===
      "manifest-inventory-current-historical-approval-and-capture-retained-stale-no-acceptance",
    "G4 inventory successor boundary changed",
  );
  invariant(
    g4HistoricalApproval.value.schemaVersion === 3 &&
      g4HistoricalApproval.value.decision === "accepted" &&
      g4HistoricalApproval.value.reviewer === "Dr. Peter Hu",
    "G4 historical human approval changed",
  );
  invariant(
    g4HistoricalAdoption.value.status ===
      "partial-non-authoritative-implementation-capture" &&
      g4HistoricalAdoption.value.strictAcceptanceEffect === "none",
    "G4 historical adoption boundary changed",
  );
  invariant(
    g5Candidate.value.animationId === G5_ID &&
      g5Candidate.value.status === "current-javascript-engineering-candidate-only" &&
      Object.values(g5Candidate.value.acceptanceEffects ?? {}).every(
        (value) => value === false,
      ),
    "G5 RW002 candidate acceptance boundary changed",
  );
  invariant(
    g5ShellMigration.value.animationId === G5_SHELL_ID &&
      g5ShellMigration.value.implementation?.route === "" &&
      g5ShellMigration.value.implementation?.component === "" &&
      g5ShellMigration.value.implementation?.registryModule === "" &&
      g5ShellCoverage.value.animationId === G5_SHELL_ID &&
      g5ShellCoverage.value.requirements?.length === 2,
    "G5 shell implementation blocker changed",
  );

  const captures = [g4Capture, g5Capture];
  return {
    schemaVersion: 1,
    reportType: "g4-l3-g5-l4-current-javascript-capture-successor",
    issuedOn: "2026-08-07",
    status:
      "current-javascript-captures-current-unadopted-shell-blocked-all-strict-gates-closed",
    generator: generator.descriptor,
    securityAndCaptureImplementation: {
      localCaptureAccess: localAccess.descriptor,
      proxy: proxy.descriptor,
      productionAnimationRoute: animationRoute.descriptor,
      keyframeCapture: keyframeCapture.descriptor,
      coverageCapture: coverageCapture.descriptor,
      tests: [coverageCaptureTest.descriptor, webAccessTest.descriptor],
      boundary: {
        exactLoopbackHost: "127.0.0.1",
        explicitEnableFlagRequired: true,
        strongEnvironmentTokenRequired: true,
        deploymentMarkersFailClosed: true,
        tokenOrTokenHashRecorded: false,
        requestHeaderScopedToExactLoopbackOrigin: true,
        publicPreviewBypassCreated: false,
      },
    },
    retainedFailedAttempts: failedAttempts,
    successfulCaptures: captures,
    captureSummary: {
      requirementCount: captures.length,
      frameCount: captures.reduce(
        (sum, capture) => sum + capture.frameArchive.fileCount,
        0,
      ),
      totalPngBytes: captures.reduce(
        (sum, capture) => sum + capture.frameArchive.totalBytes,
        0,
      ),
      allImplementationClosuresCurrent: captures.every(
        (capture) => capture.implementationArtifactClosure.currentAtSuccessorBuild,
      ),
      adoptionPerformed: false,
    },
    g5ShellBlocker: {
      animationId: G5_SHELL_ID,
      migration: g5ShellMigration.descriptor,
      fullFrameCoverage: g5ShellCoverage.descriptor,
      planningOutcome: "blocked-before-capture",
      exactError: "migration.implementation.route must be a non-empty string",
      implementationRoutePresent: false,
      componentPresent: false,
      registryModulePresent: false,
      fabricatedReplacementAllowed: false,
    },
    predecessorAndCurrentnessBindings: {
      strictGapSuccessor: strictGap.descriptor,
      g4AssetInventorySuccessor: g4InventorySuccessor.descriptor,
      g4HistoricalHumanApproval: g4HistoricalApproval.descriptor,
      g4HistoricalCaptureAdoption: g4HistoricalAdoption.descriptor,
      g5CurrentJavascriptCandidate: g5Candidate.descriptor,
      historicalEvidenceRewritten: false,
      historicalApprovalCurrentnessInherited: false,
      newCapturesAdopted: false,
    },
    acceptanceEffects: {
      currentJavascriptCaptureEvidenceAdded: true,
      implementationAccepted: false,
      authoritativeOriginalRuntime: false,
      fullFrameRmseAccepted: false,
      audioAccepted: false,
      interactionAccepted: false,
      replayAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    nextSteps: [
      "A separately authorized adoption or invalidation successor is required before the new current-JavaScript captures can change migration evidence files.",
      "Authoritative original-runtime natural traces and full-frame baselines remain required for Flash comparison and RMSE.",
      "G5 shell capture remains blocked until an evidence-grounded implementation route, component, and registry module exist; the product shell is not a substitute.",
      "Human visual and Owner acceptance must be separately performed and signed after authoritative comparison and audio, interaction, and Replay review.",
    ],
  };
}

function renderMarkdown(report) {
  const [g4, g5] = report.successfulCaptures;
  return `# G4 L3 and G5 L4 current-JavaScript capture successor r1\n\n` +
    `Status: **${report.status}**.\n\n` +
    `- G4 L3 TS006: ${g4.frameArchive.fileCount}/${g4.frameArchive.fileCount} English sprite-23 frames captured under a current implementation closure.\n` +
    `- G5 L4 RW002: ${g5.frameArchive.fileCount}/${g5.frameArchive.fileCount} English sprite-341 frames captured under a current implementation closure.\n` +
    `- Combined: ${report.captureSummary.frameCount} PNGs and ${report.captureSummary.totalPngBytes} bytes.\n` +
    `- The G4 r1 and r2 failures are retained; neither was repaired in place.\n` +
    `- The G5 shell remains blocked before capture: ${report.g5ShellBlocker.exactError}.\n\n` +
    `These are unadopted current-JavaScript captures only. The historical G4 human approval and capture adoption were not rewritten and do not inherit currentness. No original-runtime, RMSE, audio, interaction, Replay, human, Owner, strict-completion, release, or publication gate changes.\n`;
}

async function readIfPresent(relativePath) {
  try {
    return await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function parseMode(argv) {
  const allowed = new Set(["--json", "--check", "--write-no-clobber"]);
  invariant(
    argv.length === 1 && allowed.has(argv[0]),
    "choose exactly one explicit mode",
  );
  return argv[0].slice(2);
}

async function writeExclusive(relativePath, bytes) {
  const candidate = absolute(relativePath);
  const handle = await open(candidate, "wx", 0o444);
  let complete = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    complete = true;
  } finally {
    await handle.close();
    if (!complete) await unlink(candidate).catch(() => {});
  }
  await chmod(candidate, 0o444);
}

async function emit(mode, report) {
  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  if (mode === "json") {
    process.stdout.write(jsonBytes);
    return;
  }
  if (mode === "check") {
    const [actualJson, actualMarkdown] = await Promise.all([
      readIfPresent(JSON_OUTPUT),
      readIfPresent(MARKDOWN_OUTPUT),
    ]);
    invariant(actualJson?.equals(jsonBytes), `${JSON_OUTPUT} is stale or missing`);
    invariant(
      actualMarkdown?.equals(markdownBytes),
      `${MARKDOWN_OUTPUT} is stale or missing`,
    );
    process.stdout.write("G4/G5 current-JS capture successor: PASS\n");
    return;
  }
  invariant(mode === "write-no-clobber", `unsupported mode: ${mode}`);
  invariant(!(await readIfPresent(JSON_OUTPUT)), `${JSON_OUTPUT} already exists`);
  invariant(
    !(await readIfPresent(MARKDOWN_OUTPUT)),
    `${MARKDOWN_OUTPUT} already exists`,
  );
  let jsonWritten = false;
  try {
    await writeExclusive(JSON_OUTPUT, jsonBytes);
    jsonWritten = true;
    await writeExclusive(MARKDOWN_OUTPUT, markdownBytes);
  } catch (error) {
    if (jsonWritten) await unlink(absolute(JSON_OUTPUT)).catch(() => {});
    throw error;
  }
  process.stdout.write(`wrote ${JSON_OUTPUT} and ${MARKDOWN_OUTPUT}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  buildCurrentJsCaptureSuccessor()
    .then((report) => emit(parseMode(process.argv.slice(2)), report))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
