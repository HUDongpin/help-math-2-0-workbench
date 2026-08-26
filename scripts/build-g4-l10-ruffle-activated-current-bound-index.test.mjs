import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {PNG} from "pngjs";

import {
  FIXED_CAPTURE_WITNESS,
  FIXED_BASE_URL,
  FIXED_LANGUAGES,
  FIXED_MEMBER_COUNT,
  FIXED_POST_ACTIVATION_MS,
  FIXED_PRE_ACTIVATION_MS,
  FIXED_RELEASE_ID,
  FIXED_RUN_COUNT,
  FIXED_RUN_ID,
  validateActivatedCurrentBoundIndex,
  verifyExactReadOnlyOutput,
  writeExclusiveOrVerifyExact,
  writeExclusiveOutputSet,
} from "./build-g4-l10-ruffle-activated-current-bound-index.mjs";

const EXPECTED_STATUS = "observed-after-explicit-activation-with-blocked-network-attempts";
const RUN_ROOT = `output/playwright/lesson-ruffle-activated-natural-playback-diagnostics/${FIXED_RELEASE_ID}/${FIXED_RUN_ID}`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function writeFixtureFile(root, relativePath, bytes) {
  const absolute = path.join(root, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
  const value = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return {path: portable(relativePath), bytes: value.length, sha256: sha256(value)};
}

async function writeFixtureJson(root, relativePath, value) {
  return writeFixtureFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

const pngFixtureCache = new Map();

function minimalPng(width, height, rgba = [184, 216, 247, 255]) {
  const key = `${width}x${height}:${rgba.join(",")}`;
  if (pngFixtureCache.has(key)) return pngFixtureCache.get(key);
  const data = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = rgba[0];
    data[offset + 1] = rgba[1];
    data[offset + 2] = rgba[2];
    data[offset + 3] = rgba[3];
  }
  const bytes = PNG.sync.write({width, height, data});
  pngFixtureCache.set(key, bytes);
  return bytes;
}

function playbackState({playing, playOverlayVisible}) {
  return {
    observedAtPerformanceMs: playing ? 2 : 1,
    publicElementIsPlaying: playing,
    ruffleV1IsPlaying: playing,
    ruffleV1Available: true,
    playApiAvailable: true,
    readyState: 2,
    metadata: {width: 800, height: 600, frameRate: 12, numFrames: 10, swfVersion: 6},
    overlays: {
      play: {present: true, visible: playOverlayVisible},
      unmute: {present: true, visible: false},
      hardwareAcceleration: {present: true, visible: false},
    },
  };
}

function runAcceptance() {
  return {
    acceptanceNeutral: true,
    strictAcceptanceEffect: false,
    originalRuntimeAuthority: false,
    deterministicFrameEvidence: false,
    swfEnglishOrSpanishStateEvidence: false,
    audioEvidence: false,
    fidelityOrRmseEvidence: false,
    humanReview: false,
    ownerReview: false,
    statement: "This diagnostic does not establish original-runtime authority, an exact or deterministic frame, English/Spanish SWF state, audio cue correctness or audibility, fidelity, RMSE, human review, owner review, strict completion, publication, or a current-JavaScript renderer.",
  };
}

async function buildFixture() {
  const created = await mkdtemp(path.join(os.tmpdir(), "g4-l10-ruffle-index-"));
  const root = await realpath(created);
  const context = {
    activatedProbePath: "tools/activated-probe.mjs",
    routeProbePath: "tools/route-probe.mjs",
    rufflePackageRoot: "vendor/ruffle",
    toolBoundaryPaths: [
      "tools/activated-probe.mjs",
      "tools/route-probe.mjs",
      "tools/legacy-response-helper.mjs",
      "package-lock.json",
      "vendor/ruffle/package.json",
      "vendor/ruffle/ruffle.js.map",
    ],
    fixedWitness: null,
    predecessorReports: [],
    requireFrozenRunArtifacts: false,
  };
  const toolBindings = new Map();
  for (const toolPath of context.toolBoundaryPaths) {
    toolBindings.set(toolPath, await writeFixtureFile(root, toolPath, `fixture:${toolPath}\n`));
  }
  await writeFixtureFile(root, "vendor/ruffle/ruffle.js", "fixture ruffle loader\n");

  const releaseCatalog = await writeFixtureJson(root, "catalog/lesson-releases.json", {schemaVersion: 1, fixture: true});
  const animationCatalog = await writeFixtureJson(root, "catalog/animations.json", {schemaVersion: 1, fixture: true});
  const catalogs = {lessonReleases: releaseCatalog, animations: animationCatalog};
  const outputSeparation = {
    routeLoadRoot: "output/playwright/lesson-ruffle-reference-diagnostics",
    activatedNaturalPlaybackRoot: "output/playwright/lesson-ruffle-activated-natural-playback-diagnostics",
    independentRunDirectory: true,
    routeLoadArtifactsAreNeverReadOrWritten: true,
  };
  const toolchain = {
    activatedPlaybackProbe: toolBindings.get(context.activatedProbePath),
    reusedExactReleasePlannerAndNetworkGuard: toolBindings.get(context.routeProbePath),
  };
  const networkingBoundary = {rufflePackageVersion: "0.4.1", fixture: true};
  const members = [];
  const runs = [];
  const batchRuns = [];

  for (let ordinal = 1; ordinal <= FIXED_MEMBER_COUNT; ordinal += 1) {
    const animationId = ordinal === FIXED_MEMBER_COUNT
      ? "shell-course-g04-l10-fixture-local"
      : `course-g04-l10-fixture-${String(ordinal).padStart(3, "0")}`;
    const sourceBytes = Buffer.from(`fixture SWF ${ordinal}\n`);
    const sourceSha = sha256(sourceBytes);
    const assetId = `swf-${sourceSha}`;
    const memberDirectory = `${String(ordinal).padStart(2, "0")}-${animationId}`;
    const workspace = `migrations/${animationId}`;
    const manifestPath = `${workspace}/migration.json`;
    const machinePath = `${workspace}/audit/machine/report.json`;
    const sourcePath = `source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/FI/${animationId}.swf`;
    const manifest = await writeFixtureJson(root, manifestPath, {
      id: animationId,
      animationId,
      assetId,
      source: {swfSha256: sourceSha, swf: sourcePath, placementPath: sourcePath},
      runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 10, swfVersion: 6},
    });
    const machineAudit = await writeFixtureJson(root, machinePath, {schemaVersion: 1, animationId});
    const source = await writeFixtureFile(root, sourcePath, sourceBytes);
    const member = {
      ordinal,
      animationId,
      assetId,
      releaseRole: ordinal === FIXED_MEMBER_COUNT ? "course-shell" : "active-xml-referenced-page",
      source,
      stage: {width: 800, height: 600},
      workspace,
      manifest,
      machineAudit,
      outputMemberDirectory: memberDirectory,
    };
    members.push(member);

    for (const language of FIXED_LANGUAGES) {
      const outputRelative = `${RUN_ROOT}/${memberDirectory}/${language}`;
      const output = path.join(root, outputRelative);
      const pageUrl = `${FIXED_BASE_URL}${language === "es" ? "/es" : ""}/reference/${animationId}`;
      const sourceUrl = `${FIXED_BASE_URL}/api/reference/${animationId}`;
      const run = {
        ...member,
        language,
        pageUrl,
        sourceUrl,
        output,
        nativeStage: {width: 800, height: 600},
        rasterStage: {width: 800, height: 600},
      };
      runs.push(run);
      const beforePath = `${outputRelative}/before-explicit-activation-stage.png`;
      const afterPath = `${outputRelative}/activated-natural-playback-stage.png`;
      const before = await writeFixtureFile(root, beforePath, minimalPng(800, 600));
      const afterBytes = minimalPng(800, 600, [ordinal, language === "en" ? 1 : 2, 0, 255]);
      const after = await writeFixtureFile(root, afterPath, afterBytes);
      const stopped = playbackState({playing: false, playOverlayVisible: true});
      const playing = playbackState({playing: true, playOverlayVisible: false});
      const blockedRequest = {
        url: `${FIXED_BASE_URL}/blocked-prefetch`,
        method: "GET",
        resourceType: "fetch",
        allowed: false,
        kind: "blocked-local-unallowlisted-get",
      };
      const requests = [
        {url: pageUrl, method: "GET", resourceType: "document", allowed: true, kind: "allowed-exact-page-get"},
        {url: `${FIXED_BASE_URL}/api/ruffle/ruffle.js`, method: "GET", resourceType: "script", allowed: true, kind: "allowed-ruffle-api-get"},
        {url: sourceUrl, method: "GET", resourceType: "fetch", allowed: true, kind: "allowed-exact-swf-api-get"},
        blockedRequest,
      ];
      const reportPath = `${outputRelative}/activated-natural-playback-diagnostic.json`;
      const diagnostic = {
        schemaVersion: 1,
        reportType: "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic",
        generatedAt: "2026-08-03T00:00:00.000Z",
        runId: FIXED_RUN_ID,
        releaseId: FIXED_RELEASE_ID,
        releaseOrdinal: ordinal,
        animationId,
        assetId,
        releaseRole: member.releaseRole,
        localizedRouteLanguage: language,
        status: EXPECTED_STATUS,
        baseUrl: FIXED_BASE_URL,
        pageUrl,
        sourceUrl,
        outputSeparation,
        toolchain,
        exactReleaseBinding: {
          lessonReleases: catalogs.lessonReleases,
          animations: catalogs.animations,
          workspace,
          manifest,
          machineAudit,
          source,
          nativeStage: run.nativeStage,
          rasterStage: run.rasterStage,
          physicalSourceHashPathBytesAndStageVerifiedBeforeBrowser: true,
        },
        sourceDiagnostic: {
          status: 200,
          contentType: "application/x-shockwave-flash",
          cacheControl: "no-store",
          contentSecurityPolicy: "default-src 'none'",
          bytes: source.bytes,
          sha256: source.sha256,
          exactSourceBytesVerified: true,
        },
        playbackDiagnostic: {
          probeConfiguration: {
            autoplay: "off",
            unmuteOverlay: "visible",
            reason: "Force an explicit-start diagnostic opportunity before natural Ruffle playback; this is probe configuration, not evidence of the normal route autoplay state.",
          },
          fixedDelayBeforeActivationMs: FIXED_PRE_ACTIVATION_MS,
          fixedDelayAfterActivationMs: FIXED_POST_ACTIVATION_MS,
          activationCompletedAt: "2026-08-03T00:00:00.000Z",
          preActivationState: stopped,
          activation: {
            userActivationPreferred: true,
            userActivationAttempted: true,
            userActivationUsed: true,
            playerPlayApiUsed: false,
            primaryTrigger: "ruffle-shadow-play-button",
            steps: [{method: "playwright-user-click", target: "ruffle-shadow-play-button", outcome: "delivered", activation: true, playerPlayApi: false}],
            before: stopped,
            afterPrimary: playing,
            after: playing,
          },
          postFixedDelayState: playing,
          postCaptureOverlaysClear: true,
          exactSourceFrameObserved: null,
          deterministicFrameSelectionSupported: false,
          normalRouteAutoplayBehaviorProven: false,
          languageFlashVarSelectionSupported: false,
          localizedRouteLanguageIsNotSwfLanguageState: true,
          audioCueOrAudibilityObserved: false,
          naturalPlaybackBoundary: "The post-activation image is a nondeterministic Ruffle observation after an explicit start trigger.",
        },
        geometry: {
          viewport: {scrollX: 0, scrollY: 0, innerWidth: 1280, innerHeight: 1600},
          stage: {x: 90, y: 300, width: 804, height: 604},
          host: {x: 92, y: 302, width: 800, height: 600},
          player: {x: 92, y: 302, width: 800, height: 600},
          stickySiteHeader: {x: 0, y: 0, width: 1280, height: 100},
          stickyHeaderBottom: 100,
          captureRectangleRole: "reference-player-host-only",
          nativeCssStage: run.nativeStage,
          rasterPngStage: run.rasterStage,
          fractionalNativeStagePreservedSeparatelyFromCeilRaster: true,
        },
        networkDiagnostic: {
          enforcement: "real-playwright-browser-context-route-and-websocket-interception",
          expectedOrigin: FIXED_BASE_URL,
          allowlist: [
            "exact reference page GET",
            "exact hash-bound SWF API GET",
            "same-origin /_next GET",
            "same-origin /api/ruffle GET",
          ],
          everyOtherHttpRequestAbortedAndRecorded: true,
          everyWebSocketAbortedAndRecorded: true,
          blockedRequestsReachedServer: false,
          requests,
          blockedRequests: [blockedRequest],
          blockedWebSockets: [],
          responses: requests.filter(({allowed}) => allowed).map(({url, method, kind}) => ({url, method, status: 200, disposition: kind})),
        },
        ruffleNetworkingBoundary: networkingBoundary,
        browserDiagnostic: {
          product: "Playwright Chromium",
          version: "fixture",
          viewport: {scrollX: 0, scrollY: 0, innerWidth: 1280, innerHeight: 1600, deviceScaleFactor: 1},
          consoleMessages: [],
          pageErrors: [],
          messagesAreRecordedDiagnosticsNotAcceptance: true,
        },
        screenshots: {
          beforeExplicitActivation: {
            ...before,
            width: 800,
            height: 600,
            nativeCssStage: run.nativeStage,
            rasterPngStage: run.rasterStage,
            role: "nondeterministic-ruffle-before-explicit-activation-diagnostic-only",
            sourceFrameBinding: null,
            requirementTraceEntryStateBinding: null,
          },
          afterExplicitActivationAndFixedDelay: {
            ...after,
            width: 800,
            height: 600,
            nativeCssStage: run.nativeStage,
            rasterPngStage: run.rasterStage,
            role: "nondeterministic-ruffle-post-explicit-activation-natural-playback-diagnostic-only",
            sourceFrameBinding: null,
            requirementTraceEntryStateBinding: null,
          },
        },
        acceptance: runAcceptance(),
      };
      await writeFixtureJson(root, reportPath, diagnostic);
      batchRuns.push({ordinal, animationId, language, status: EXPECTED_STATUS, report: reportPath});
    }
  }

  const release = {
    releaseId: FIXED_RELEASE_ID,
    titleDisplay: "Fixture",
    grade: 4,
    lesson: 10,
    publicationMode: "atomic",
    totalMemberCount: FIXED_MEMBER_COUNT,
    selectedMemberCount: FIXED_MEMBER_COUNT,
    selection: "complete-exact-release",
  };
  const plan = {
    root,
    releaseId: FIXED_RELEASE_ID,
    runId: FIXED_RUN_ID,
    release,
    baseUrl: FIXED_BASE_URL,
    languages: [...FIXED_LANGUAGES],
    preActivationMs: FIXED_PRE_ACTIVATION_MS,
    postActivationMs: FIXED_POST_ACTIVATION_MS,
    catalogs,
    outputSeparation,
    members,
    runs,
  };
  const batchRelativePath = `${RUN_ROOT}/batch-activated-natural-playback-diagnostic.json`;
  await writeFixtureJson(root, batchRelativePath, {
    schemaVersion: 1,
    reportType: "lesson-release-ruffle-explicitly-activated-natural-playback-diagnostic-batch",
    generatedAt: "2026-08-03T00:00:00.000Z",
    runId: FIXED_RUN_ID,
    release,
    languages: [...FIXED_LANGUAGES],
    baseUrl: FIXED_BASE_URL,
    catalogs,
    outputSeparation,
    toolchain,
    runCount: FIXED_RUN_COUNT,
    observedCount: FIXED_RUN_COUNT,
    failedCount: 0,
    runs: batchRuns,
    ruffleNetworkingBoundary: networkingBoundary,
    acceptance: {
      acceptanceNeutral: true,
      strictAcceptanceEffect: false,
      statement: "This batch cannot create deterministic frame or original-runtime evidence.",
    },
  });
  return {root, batchRelativePath, plan, networkingBoundary, context};
}

async function withFixture(callback) {
  const fixture = await buildFixture();
  try {
    return await callback(fixture);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
}

async function withOutputRoot(callback) {
  const created = await mkdtemp(path.join(os.tmpdir(), "g4-l10-ruffle-output-"));
  const root = await realpath(created);
  await mkdir(path.join(root, "reports"));
  try {
    return await callback(root);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
}

async function validateFixture(fixture) {
  return validateActivatedCurrentBoundIndex(fixture);
}

test("builds a deterministic fail-closed 47xEN/ES fixed evidence closure with downgraded claims", async () => {
  await withFixture(async (fixture) => {
    const report = await validateFixture(fixture);
    assert.equal(report.schemaVersion, 2);
    assert.equal(report.verification.probeReportCount, 94);
    assert.equal(report.verification.probeReportsRecordExplicitUiActivationCount, 94);
    assert.equal(report.verification.probeReportsRecordPlayerPlayApiFallbackCount, 0);
    assert.equal(report.verification.beforeAfterPngCount, 188);
    assert.equal(report.verification.currentReleaseCatalogWorkspaceSourceBindingValid, true);
    assert.equal(report.verification.enumeratedToolSubsetBindingValid, true);
    assert.equal(report.verification.fullBrowserRuntimeInputBindingValid, false);
    assert.equal(report.verification.serverResponseBodyClosureComplete, false);
    assert.equal(report.verification.independentUiCausalityEstablished, false);
    assert.equal(report.verification.currentActivatedNaturalPlaybackObserved, false);
    assert.equal(report.verification.playerIsPlayingFlagsDoNotProveVisibleContentOrNaturalTrace, true);
    assert.equal(report.verification.formalJavascriptRendererCount, 0);
    assert.equal(report.verification.strictAcceptanceEffect, "none");
    assert.equal(report.verification.originalRuntimeAuthority, false);
    assert.equal(report.artifactClosures.diagnosticJson.count, 94);
    assert.equal(report.artifactClosures.allBeforeAfterPng.count, 188);
    assert.equal(report.artifactClosures.allDiagnosticJsonAndPng.count, 282);
    assert.equal(report.postActivationVisualCensus.fullPngDecodeAndCrcValidationCount, 94);
  });
});

test("fails closed on a duplicated run key", async () => {
  await withFixture(async (fixture) => {
    const batchPath = path.join(fixture.root, fixture.batchRelativePath);
    const batch = JSON.parse(await readFile(batchPath, "utf8"));
    batch.runs[1] = {...batch.runs[0]};
    await writeFile(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
    await assert.rejects(validateFixture(fixture), /duplicates run/);
  });
});

test("fails closed on a missing run", async () => {
  await withFixture(async (fixture) => {
    const batchPath = path.join(fixture.root, fixture.batchRelativePath);
    const batch = JSON.parse(await readFile(batchPath, "utf8"));
    batch.runs.pop();
    await writeFile(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
    await assert.rejects(validateFixture(fixture), /must have 94 run pointers/);
  });
});

test("fails closed on browser artifact tampering", async () => {
  await withFixture(async (fixture) => {
    const screenshot = path.join(
      fixture.root,
      RUN_ROOT,
      "01-course-g04-l10-fixture-001",
      "en",
      "before-explicit-activation-stage.png",
    );
    const bytes = await readFile(screenshot);
    await writeFile(screenshot, Buffer.concat([bytes, Buffer.from([0])]));
    await assert.rejects(validateFixture(fixture), /PNG hash\/bytes drifted/);
  });
});

test("fails closed when a current manifest drifts after plan binding", async () => {
  await withFixture(async (fixture) => {
    const manifestPath = path.join(fixture.root, fixture.plan.members[0].manifest.path);
    await writeFile(manifestPath, `${await readFile(manifestPath, "utf8")} `);
    await assert.rejects(validateFixture(fixture), /current manifest hash\/bytes drifted/);
  });
});

test("fails closed on any acceptance promotion or extra acceptance field", async () => {
  await withFixture(async (fixture) => {
    const reportPath = path.join(fixture.plan.runs[0].output, "activated-natural-playback-diagnostic.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    report.acceptance.strictComplete = true;
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await assert.rejects(validateFixture(fixture), /acceptance keys drifted/);
  });
});

test("fails closed when the hard-coded capture witness does not match instead of rebasing", async () => {
  await withFixture(async (fixture) => {
    const context = {
      ...fixture.context,
      fixedWitness: {
        ...FIXED_CAPTURE_WITNESS,
        batch: {...FIXED_CAPTURE_WITNESS.batch, sha256: "0".repeat(64)},
      },
    };
    await assert.rejects(
      validateActivatedCurrentBoundIndex({...fixture, context}),
      /fixed batch witness drifted/,
    );
  });
});

test("fails closed when production-like frozen-run verification sees writable directories", async () => {
  await withFixture(async (fixture) => {
    const context = {...fixture.context, requireFrozenRunArtifacts: true};
    await assert.rejects(
      validateActivatedCurrentBoundIndex({...fixture, context}),
      /fixed run directory must be mode 0555/,
    );
  });
});

test("fully decodes PNG bytes and rejects an IHDR-only stub even when its declared binding is updated", async () => {
  await withFixture(async (fixture) => {
    const run = fixture.plan.runs[0];
    const screenshotPath = path.join(run.output, "before-explicit-activation-stage.png");
    const stub = Buffer.alloc(24);
    Buffer.from("89504e470d0a1a0a", "hex").copy(stub, 0);
    stub.writeUInt32BE(13, 8);
    stub.write("IHDR", 12, 4, "ascii");
    stub.writeUInt32BE(800, 16);
    stub.writeUInt32BE(600, 20);
    await writeFile(screenshotPath, stub);
    const reportPath = path.join(run.output, "activated-natural-playback-diagnostic.json");
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    report.screenshots.beforeExplicitActivation.bytes = stub.length;
    report.screenshots.beforeExplicitActivation.sha256 = sha256(stub);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await assert.rejects(validateFixture(fixture), /failed full PNG decode\/CRC validation/);
  });
});

test("exclusively creates a read-only report and exact verification preserves write metadata", async () => {
  await withOutputRoot(async (root) => {
    const relativePath = "reports/evidence-v2.json";
    const expected = "{\"fixed\":true}\n";
    const first = await writeExclusiveOrVerifyExact({root, relativePath, expected, label: "fixture report"});
    assert.equal(first.created, true);
    const absolute = path.join(root, relativePath);
    const before = await lstat(absolute);
    assert.equal(before.mode & 0o7777, 0o444);
    const beforeStable = {
      ino: before.ino,
      mode: before.mode,
      nlink: before.nlink,
      size: before.size,
      mtimeMs: before.mtimeMs,
      ctimeMs: before.ctimeMs,
    };
    await verifyExactReadOnlyOutput({root, relativePath, expected, label: "fixture report"});
    const second = await writeExclusiveOrVerifyExact({root, relativePath, expected, label: "fixture report"});
    assert.equal(second.created, false);
    const after = await lstat(absolute);
    assert.deepEqual({
      ino: after.ino,
      mode: after.mode,
      nlink: after.nlink,
      size: after.size,
      mtimeMs: after.mtimeMs,
      ctimeMs: after.ctimeMs,
    }, beforeStable);
  });
});

test("exclusive output-set preflight refuses stale or writable reports without creating missing siblings", async () => {
  await withOutputRoot(async (root) => {
    const stalePath = path.join(root, "reports/stale.md");
    await writeFile(stalePath, "stale\n", {mode: 0o444});
    await assert.rejects(
      writeExclusiveOutputSet({
        root,
        outputs: [
          {relativePath: "reports/missing.json", expected: "fresh\n", label: "missing sibling"},
          {relativePath: "reports/stale.md", expected: "fresh\n", label: "stale sibling"},
        ],
      }),
      /never overwritten or rebased/,
    );
    await assert.rejects(lstat(path.join(root, "reports/missing.json")), {code: "ENOENT"});

    const writablePath = path.join(root, "reports/writable.json");
    await writeFile(writablePath, "exact\n", {mode: 0o644});
    await assert.rejects(
      verifyExactReadOnlyOutput({root, relativePath: "reports/writable.json", expected: "exact\n", label: "writable report"}),
      /must be mode 0444/,
    );
    await chmod(writablePath, 0o444);
  });
});

test("exclusive report creation refuses a symlink target and read-only check refuses absence", async () => {
  await withOutputRoot(async (root) => {
    await writeFile(path.join(root, "reports/target.txt"), "exact\n");
    await symlink("target.txt", path.join(root, "reports/link.json"));
    await assert.rejects(
      writeExclusiveOrVerifyExact({root, relativePath: "reports/link.json", expected: "exact\n", label: "symlink report"}),
      /regular non-symlink file/,
    );
    await assert.rejects(
      verifyExactReadOnlyOutput({root, relativePath: "reports/absent.json", expected: "exact\n", label: "absent report"}),
      /is missing/,
    );
  });
});
