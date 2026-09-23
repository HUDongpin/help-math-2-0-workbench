#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  COURSE_CHILD_PILOT_IDS,
} from "./build-adobe-course-host-fixtures.mjs";
import {
  verifyFixtureManifest,
} from "./build-adobe-course-frame-controller-fixtures.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CONTROLLER_GENERATOR_PATH =
  path.join(PROJECT_ROOT, "scripts", "build-adobe-course-frame-controller-fixtures.mjs");
const SUPPORT_MODULE_PATH =
  path.join(PROJECT_ROOT, "scripts", "build-adobe-course-host-fixtures.mjs");
const DEFAULT_MIGRATIONS_ROOT = path.join(PROJECT_ROOT, "migrations");
const DEFAULT_REPORTS_ROOT = path.join(PROJECT_ROOT, "reports");
const DEFAULT_OUTPUT_ROOT =
  path.join(PROJECT_ROOT, "work", "adobe-course-host-fixtures-frame-controller-all");
const INDEX_BASENAME = "adobe-course-frame-controller-fixtures.json";
const REPORT_BASENAME = "adobe-course-frame-controller-fixtures.md";
const ENGINEERING_REPORT_BASENAME =
  "adobe-course-frame-controller-engineering-report.json";
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function fileSha256(candidate) {
  return sha256(await readFile(candidate));
}

function projectRelative(candidate) {
  return portable(path.relative(PROJECT_ROOT, candidate));
}

function resolveProjectFile(relative, label) {
  invariant(
    typeof relative === "string"
      && relative.length > 0
      && !path.isAbsolute(relative)
      && !relative.includes("\\")
      && path.posix.normalize(relative) === relative
      && relative !== ".."
      && !relative.startsWith("../"),
    `${label}: path must be normalized, portable, and project-relative`,
  );
  const resolved = path.resolve(PROJECT_ROOT, ...relative.split("/"));
  invariant(
    resolved.startsWith(`${PROJECT_ROOT}${path.sep}`),
    `${label}: path escapes the project root`,
  );
  return resolved;
}

function allFalse(value) {
  const values = Object.values(value || {});
  return values.length > 0 && values.every((candidate) => candidate === false);
}

function buildExpectedEngineeringReport({
  manifestPath,
  manifestSha256,
  manifest,
  specification,
  specPath,
  specSha256,
  generatorSha256,
  supportSha256,
}) {
  const local = specification.timelineContract.local;
  return {
    schemaVersion: 1,
    animationId: specification.animationId,
    reportKind: "adobe-avm1-course-local-frame-controller-engineering-candidate",
    decision: "static-and-compiled-factory-passed-runtime-frame-control-not-yet-proven",
    migrationStatusChanged: false,
    reviewFieldsChanged: false,
    authority: {
      sourceChildUntouched: true,
      originalCourseShellExecuted: false,
      originalHostBehaviorClaimed: false,
      naturalPlaybackClaimed: false,
      branchTraversalClaimed: false,
      languageClaimed: false,
      audioClaimed: false,
      authoritativeBaselineClaimed: false,
      humanReviewClaimed: false,
      ownerAcceptanceClaimed: false,
    },
    factory: {
      specification: {path: projectRelative(specPath), sha256: specSha256},
      generator: {
        path: projectRelative(CONTROLLER_GENERATOR_PATH),
        sha256: generatorSha256,
      },
      supportModule: {
        path: projectRelative(SUPPORT_MODULE_PATH),
        sha256: supportSha256,
      },
      canonicalFixture: {
        targetFrame: manifest.targetFrame,
        fixtureDigest: manifest.fixtureDigest,
        manifest: projectRelative(manifestPath),
        manifestSha256,
        hostSha256: manifest.compilation.hostSha256,
        deterministicDoubleBuild: manifest.compilation.deterministicDoubleBuild,
        decompiledMarkersVerified: manifest.compilation.decompiledMarkersVerified,
      },
      verificationCommands: [
        `node scripts/build-adobe-course-frame-controller-fixtures.mjs --verify ${projectRelative(manifestPath)}`,
        "node scripts/build-adobe-course-frame-controller-fixtures.mjs --check",
        `node scripts/build-adobe-course-frame-controller-fixtures.mjs --id ${specification.animationId} --frame ${manifest.targetFrame}`,
      ],
    },
    controllerContract: {
      sourceStage: specification.source.stage,
      sourceFps: specification.source.fps,
      sourceRootFrame: specification.timelineContract.root.entryFrame,
      sourceRootLabel: specification.timelineContract.root.entryLabel,
      sourcePlacementName: specification.timelineContract.root.placementName,
      sourcePlacementObjectId: specification.timelineContract.root.placementObjectId,
      localTimeline: local.timelineId,
      localFrameDomain: {
        start: 1,
        endInclusive: local.frameCount,
        indexing: "one-indexed",
      },
      canonicalTargetFrame: manifest.targetFrame,
      canonicalSelection: specification.canonicalFrameSelection,
      actualFrameChecksBeforeReveal:
        specification.timelineContract.consecutiveActualFrameChecksBeforeReveal,
      successPresentation:
        "The untouched child is revealed with no controller pixels after three actual-frame checks pass.",
      failurePresentation:
        "The child remains hidden behind a full-stage opaque FRAME CONTROL FAILED CLOSED screen.",
      postPinInputPolicy:
        "A transparent full-stage top-depth shield blocks pointer input while root/local frame and audio checks continue.",
      audioPolicy:
        `The loaded root/local movie is held at volume zero, ${local.namedAudioClipNames.length} source-named local audio placements are explicitly stopped, and stopAllSounds is repeated.`,
    },
    staticallyProven: [
      "The root animation placement, its exact frame/label/objectId, the corresponding local sprite frameCount, source hash, native stage, and FPS are derived from the reviewed scenario inventory without basename or timeline guessing.",
      "Every source/evidence/spec/generator/support input is hash-pinned; the untouched child is copied byte-for-byte into a content-addressed fixture.",
      "The host is compiled twice from identical inputs to the same SWF hash, then decompiled and checked for fail-closed, target-frame, three-tick actual-frame, audio-suppression, and blocked-primitive markers.",
      "Sandbox syntax, fixture-local write, outside-write denial, and loopback-network denial probes pass before any GUI launch is eligible.",
      `The factory supports every one-indexed local frame 1..${local.frameCount}; the tracked canonical probe is frame ${manifest.targetFrame}.`,
    ],
    unresolvedObligations: specification.unresolvedObligations,
    runtimeProofStillRequired: [
      "Run the exact fixture through the sandbox in the authorized Adobe Flash Player only after a separate no-click GUI safety smoke is reviewed.",
      `Observe that the cover disappears only after one explicit load click and three actual-frame ticks report root ${specification.timelineContract.root.entryFrame}, local ${manifest.targetFrame}, and local frameCount ${local.frameCount}.`,
      `Record a lossless native ${specification.source.stage.width}x${specification.source.stage.height} stage capture plus a separate fixture digest, requested frame, and observed actual-frame trace record.`,
    ],
    limitations: [
      "Direct gotoAndStop is a visual engineering seek and does not reproduce elapsed-time traversal or nested timeline phase through preceding local frames.",
      "Unknown host bindings are deliberately not synthesized; frame scripts may therefore be incomplete even if a visual candidate appears.",
      "The fixture suppresses all audio and cannot support listening, identity, cue, synchronization, stop, or Replay acceptance.",
      "Interaction, branch, drag, scoring, random, Replay, language, original-shell, and external-dependency behavior remain separate blockers exactly as listed.",
      "A successful Adobe probe would establish only a controlled source-addressed visual candidate; RMSE comparison, product QA, human review, owner acceptance, and strict validation remain pending.",
    ],
    ...(specification.legacyTiCompatibility
      ? {legacyTiCompatibility: specification.legacyTiCompatibility}
      : {}),
    strictAcceptanceEffect:
      "none; retain every baseline, language, audio, behavior, product, human, owner, validator, regression, and build blocker",
  };
}

export function validateEngineeringReportExact({
  report,
  reportText,
  expected,
  animationId,
}) {
  const {
    sourceChildUntouched,
    ...authorityClaims
  } = report?.authority ?? {};
  invariant(report?.animationId === animationId, `${animationId}: report identity changed`);
  invariant(
    report.migrationStatusChanged === false
      && report.reviewFieldsChanged === false
      && sourceChildUntouched === true
      && allFalse(authorityClaims),
    `${animationId}: report authority/status boundary changed`,
  );
  invariant(
    typeof report.strictAcceptanceEffect === "string"
      && report.strictAcceptanceEffect.startsWith("none;"),
    `${animationId}: report strict-acceptance boundary changed`,
  );
  invariant(
    reportText === stableJson(expected),
    `${animationId}: controller engineering report is stale or semantically changed`,
  );
}

async function loadValidatedFixture({
  animationId,
  migrationsRoot,
  generatorSha256,
  supportSha256,
}) {
  const reportPath = path.join(
    migrationsRoot,
    animationId,
    "audit",
    ENGINEERING_REPORT_BASENAME,
  );
  const reportText = await readFile(reportPath, "utf8");
  const report = JSON.parse(reportText);
  const manifestRelative = report.factory?.canonicalFixture?.manifest;
  const manifestPath = resolveProjectFile(
    manifestRelative,
    `${animationId}: canonical fixture manifest`,
  );
  const verified = await verifyFixtureManifest(manifestPath, {migrationsRoot});
  invariant(
    verified.manifest.animationId === animationId,
    `${animationId}: verified fixture identity changed`,
  );
  const expected = buildExpectedEngineeringReport({
    manifestPath: verified.manifestPath,
    manifestSha256: verified.manifestSha256,
    manifest: verified.manifest,
    specification: verified.loaded.specification,
    specPath: verified.loaded.specPath,
    specSha256: verified.loaded.specSha256,
    generatorSha256,
    supportSha256,
  });
  validateEngineeringReportExact({
    report,
    reportText,
    expected,
    animationId,
  });
  return {
    loaded: verified.loaded,
    manifest: verified.manifest,
    manifestPath: verified.manifestPath,
    manifestSha256: verified.manifestSha256,
    reportPath,
    reportSha256: sha256(reportText),
  };
}

function buildGlobalIndex({fixtures, generatorSha256, supportSha256}) {
  return {
    schemaVersion: 1,
    reportKind: "nine-course-adobe-local-frame-controller-factory-index",
    generatedBy: {
      path: projectRelative(CONTROLLER_GENERATOR_PATH),
      sha256: generatorSha256,
    },
    supportModule: {
      path: projectRelative(SUPPORT_MODULE_PATH),
      sha256: supportSha256,
    },
    fixtureCount: fixtures.length,
    courseShellExcluded: true,
    fixtures: fixtures.map(({
      loaded,
      manifest,
      manifestPath,
      manifestSha256,
      reportPath,
      reportSha256,
    }) => ({
      animationId: manifest.animationId,
      sourceSha256: manifest.source.sha256,
      stage: manifest.source.stage,
      fps: manifest.source.fps,
      rootEntryFrame: manifest.timelineContract.root.entryFrame,
      rootEntryLabel: manifest.timelineContract.root.entryLabel,
      rootPlacementObjectId: manifest.timelineContract.root.placementObjectId,
      localTimeline: manifest.timelineContract.local.timelineId,
      localFrameCount: manifest.timelineContract.local.frameCount,
      canonicalTargetFrame: manifest.targetFrame,
      canonicalSelectionStrategy: loaded.specification.canonicalFrameSelection.strategy,
      visualNonEmptyClaimed: false,
      unresolvedHostBindingCount:
        loaded.specification.unresolvedObligations.hostBindings.length,
      randomObligationCount:
        loaded.specification.unresolvedObligations.randomObligationCount,
      fixtureDigest: manifest.fixtureDigest,
      manifest: projectRelative(manifestPath),
      manifestSha256,
      report: projectRelative(reportPath),
      reportSha256,
      hostSha256: manifest.compilation.hostSha256,
      deterministicDoubleBuild: manifest.compilation.deterministicDoubleBuild,
      decompiledMarkersVerified: manifest.compilation.decompiledMarkersVerified,
      staticVerification: {
        sourceAndEvidenceHashesVerified: true,
        sandboxSyntaxSmokeTest: manifest.sandbox.syntaxSmokeTest,
        insideWriteAllowed: manifest.sandbox.insideWriteAllowed,
        outsideWriteDenied: manifest.sandbox.outsideWriteDenied,
        loopbackNetworkDenied: manifest.sandbox.localTcpDenied,
        networkDeniedByLaunchProfile: manifest.sandbox.networkDenied,
      },
      runtimeVerification: manifest.runtimeVerification.status,
      strictAcceptanceEffect: "none",
    })),
    authority:
      "static source-derived specification, deterministic compilation, decompiled marker verification, and sandbox probes only; no Adobe GUI action, runtime frame proof, baseline, status, review, or acceptance change",
    strictAcceptanceEffect: "none",
  };
}

function renderGlobalMarkdown(index) {
  const rows = index.fixtures.map(
    (item) =>
      `| ${item.animationId} | ${item.rootEntryLabel}@${item.rootEntryFrame} | ${item.localTimeline} | ${item.localFrameCount} | ${item.canonicalTargetFrame} | ${item.unresolvedHostBindingCount} | ${item.randomObligationCount} |`,
  ).join("\n");
  return `# Nine-course Adobe local-frame controller factory

This report covers the nine course-child pilots only; the course shell is excluded. Every specification is derived from the reviewed \`scenario-inventory.json\`: the unique root \`animation\` placement, its frame/label/objectId, corresponding local sprite frame count, source hash, native stage, and 12 FPS metadata.

| Animation | Root entry | Local timeline | Local frames | Canonical probe | Host-binding blockers | Random blockers |
|---|---:|---:|---:|---:|---:|---:|
${rows}

All ${index.fixtureCount} canonical fixtures were compiled twice to identical hashes, decompiled for controller/safety markers, and passed sandbox syntax, local-write, outside-write-denial, and loopback-network-denial probes. No Adobe GUI was launched.

The canonical selection is structural only. It prefers the first audited local frame label after frame 1, then a nonterminal stop/action state, then an audited terminal state. It does not claim the selected frame is visually non-empty. Runtime confirmation must separately prove requested/actual frame equality for three ticks and preserve a lossless native-stage capture.

These fixtures mute and stop all audio and do not synthesize unknown host bindings. They cannot prove natural playback, nested phase, interaction branches, random outcomes, scoring, Replay, English/Spanish behavior, audio, RMSE, product QA, human review, or owner acceptance. Strict acceptance effect: **none**.

The earlier TI-only specification/report and output directory remain byte-preserved and are referenced by hash from the new TI compatibility record; this factory uses separate filenames and a separate output namespace.
`;
}

async function writeOrCheck(candidate, expected, check, label) {
  if (check) {
    invariant(await readFile(candidate, "utf8") === expected, `${label} is stale`);
    return;
  }
  await mkdir(path.dirname(candidate), {recursive: true});
  await writeFile(candidate, expected, "utf8");
}

export async function buildControllerAggregateOnly({
  migrationsRoot = DEFAULT_MIGRATIONS_ROOT,
  reportsRoot = DEFAULT_REPORTS_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  check = false,
} = {}) {
  migrationsRoot = path.resolve(migrationsRoot);
  reportsRoot = path.resolve(reportsRoot);
  outputRoot = path.resolve(outputRoot);
  const [generatorSha256, supportSha256] = await Promise.all([
    fileSha256(CONTROLLER_GENERATOR_PATH),
    fileSha256(SUPPORT_MODULE_PATH),
  ]);
  invariant(SHA256.test(generatorSha256), "controller generator SHA-256 is invalid");
  invariant(SHA256.test(supportSha256), "controller support SHA-256 is invalid");

  const fixtures = [];
  for (const animationId of COURSE_CHILD_PILOT_IDS) {
    fixtures.push(await loadValidatedFixture({
      animationId,
      migrationsRoot,
      generatorSha256,
      supportSha256,
    }));
  }
  invariant(
    fixtures.length === 9
      && fixtures.every(({manifest}, index) =>
        manifest.animationId === COURSE_CHILD_PILOT_IDS[index]),
    "aggregate requires the exact ordered nine-course canonical set",
  );

  const index = buildGlobalIndex({fixtures, generatorSha256, supportSha256});
  const indexText = stableJson(index);
  const markdownText = renderGlobalMarkdown(index);
  const indexPath = path.join(reportsRoot, INDEX_BASENAME);
  const markdownPath = path.join(reportsRoot, REPORT_BASENAME);
  const outputIndexPath = path.join(outputRoot, "manifest.json");
  await Promise.all([
    writeOrCheck(indexPath, indexText, check, "global course controller index"),
    writeOrCheck(markdownPath, markdownText, check, "global course controller report"),
    writeOrCheck(
      outputIndexPath,
      indexText,
      check,
      "ignored course controller fixture index",
    ),
  ]);
  return {
    mode: check ? "check" : "write",
    status: check
      ? "canonical-nine-course-controller-aggregate-checked"
      : "canonical-nine-course-controller-aggregate-written",
    fixtureCount: fixtures.length,
    perIdArtifactsWritten: 0,
    index: {
      path: projectRelative(indexPath),
      sha256: sha256(indexText),
    },
    report: {
      path: projectRelative(markdownPath),
      sha256: sha256(markdownText),
    },
    ignoredIndex: {
      path: projectRelative(outputIndexPath),
      sha256: sha256(indexText),
    },
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {
    check: false,
    migrationsRoot: DEFAULT_MIGRATIONS_ROOT,
    reportsRoot: DEFAULT_REPORTS_ROOT,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--migrations", "--reports", "--output"].includes(value)) {
      const next = argv[index + 1];
      invariant(next && !next.startsWith("--"), `${value} requires a value`);
      if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--reports") options.reportsRoot = path.resolve(next);
      else options.outputRoot = path.resolve(next);
      index += 1;
    } else {
      throw new Error(
        `Unknown option: ${value}; aggregate-only mode forbids per-ID build/compile/verify options`,
      );
    }
  }
  return options;
}

function usage() {
  return `Usage: node scripts/build-adobe-course-frame-controller-aggregate.mjs [options]

Options:
  --check                   Validate all nine current per-ID specs, fixture manifests,
                            generated files, and engineering reports, then verify only
                            the three aggregate outputs
  --migrations <directory>  Migration root (default: migrations)
  --reports <directory>     Tracked aggregate root (default: reports)
  --output <directory>      Ignored fixture root (default: work/...controller-all)
  --help                    Show this help

Write mode validates all nine current per-ID artifacts first, then writes only the
tracked JSON index, tracked Markdown report, and ignored mirror index. It never
rewrites a per-ID specification, fixture, engineering report, source, status,
review, approval, or acceptance field. Strict acceptance effect: none.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) return process.stdout.write(`${usage()}\n`);
    const result = await buildControllerAggregateOnly(options);
    process.stdout.write(stableJson(result));
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
