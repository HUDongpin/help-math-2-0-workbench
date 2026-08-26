#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, mkdir, readFile, realpath, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ARTIFACT_ROOT = path.join(PROJECT_ROOT, "artifacts/full-frame/g4-l3");
const DIAGNOSTIC_REPORT_RELATIVE = "evidence/derived/diagnostic-integrity-report.json";
const OBSERVATIONS_JSON_RELATIVE = "evidence/derived/runtime-observations.json";
const OBSERVATIONS_MD_RELATIVE = "evidence/derived/runtime-observations.md";
const CURRENT_CANDIDATE_MANIFEST_RELATIVE = "output/playwright/g4-l3-current-js-v2/course-g04-l03-ts-006-en-current/req-sprite-23-lesson-shell-natural-entry-en/capture-manifest.json";
const CURRENT_CANDIDATE_FRAME_RELATIVE = "output/playwright/g4-l3-current-js-v2/course-g04-l03-ts-006-en-current/req-sprite-23-lesson-shell-natural-entry-en/frame-001.png";
const EXPECTED_CURRENT_CANDIDATE_MANIFEST_SHA256 = "b1e2fdb48a3cd5d272f0b5418ee5bae3f19b68361805b5121b5573897bfc2357";
const EXPECTED_CURRENT_CANDIDATE_FRAME_SHA256 = "8a0badcbcd3944c528c31e2b42a61610613fe7f7ffda2e6e3619cf385a84ab23";
const EXPECTED_ANIMATION_ID = "course-g04-l03-ts-006";
const EXPECTED_SOURCE_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const HASH = /^[a-f0-9]{64}$/u;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(filePath, root = PROJECT_ROOT) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function within(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function readRegular(filePath, label) {
  const metadata = await lstat(filePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${label} must be a regular non-symlink file`);
  const bytes = await readFile(filePath);
  return {bytes, size: bytes.length, sha256: sha256(bytes)};
}

const RUN_SPECS = Object.freeze([
  Object.freeze({
    id: "first-natural-ts005-to-ts006-entry",
    kind: "natural-navigation",
    baseFrame: 2032,
    boundaryFrames: Object.freeze({sourceTerminal: 2030, interPageBlank: 2031}),
    phases: Object.freeze({
      checkYourWork: Object.freeze({firstVisible: 2045, fullyVisible: 2054}),
      strategiesHeading: Object.freeze({firstVisible: 2134, fullyVisible: 2140}),
      strategyList: Object.freeze({firstVisible: 2170, fullyVisible: 2176}),
      showYourWorkPulse: Object.freeze({firstVisible: 2267, firstPulseVariantA: 2271, firstPulseVariantB: 2272}),
    }),
  }),
  Object.freeze({
    id: "host-replay",
    kind: "replay",
    baseFrame: 2354,
    boundaryFrames: Object.freeze({terminalBeforeActivation: 2352, activationVisual: 2353}),
    phases: Object.freeze({
      checkYourWork: Object.freeze({firstVisible: 2367, fullyVisible: 2376}),
      strategiesHeading: Object.freeze({firstVisible: 2457, fullyVisible: 2463}),
      strategyList: Object.freeze({firstVisible: 2493, fullyVisible: 2499}),
      showYourWorkPulse: Object.freeze({firstVisible: 2590, firstPulseVariantA: 2594, firstPulseVariantB: 2595}),
    }),
  }),
  Object.freeze({
    id: "previous-to-ts005-then-next-to-ts006",
    kind: "navigation-reentry",
    baseFrame: 2989,
    boundaryFrames: Object.freeze({
      ts006TerminalBeforePrevious: 2862,
      ts005BaseAfterPrevious: 2863,
      ts005TerminalBeforeNext: 2988,
    }),
    phases: Object.freeze({
      checkYourWork: Object.freeze({firstVisible: 3002, fullyVisible: 3011}),
      strategiesHeading: Object.freeze({firstVisible: 3092, fullyVisible: 3098}),
      strategyList: Object.freeze({firstVisible: 3128, fullyVisible: 3134}),
      showYourWorkPulse: Object.freeze({firstVisible: 3225, firstPulseVariantA: 3229, firstPulseVariantB: 3230}),
    }),
  }),
]);

export function validateObservationSpec(runs = RUN_SPECS) {
  invariant(Array.isArray(runs) && runs.length === 3, "diagnostic observation set must contain three runs");
  const ids = new Set(runs.map(({id}) => id));
  invariant(ids.size === runs.length, "diagnostic observation run IDs must be unique");
  const [first, replay, reentry] = runs;
  invariant(first.kind === "natural-navigation" && replay.kind === "replay" && reentry.kind === "navigation-reentry",
    "diagnostic observation run kinds drifted");
  const phaseNames = ["checkYourWork", "strategiesHeading", "strategyList", "showYourWorkPulse"];
  for (const run of runs) {
    invariant(Number.isInteger(run.baseFrame) && run.baseFrame > 0, `${run.id} base frame is invalid`);
    for (const phaseName of phaseNames) {
      invariant(run.phases?.[phaseName], `${run.id} is missing ${phaseName}`);
      const values = Object.values(run.phases[phaseName]);
      invariant(values.every((value) => Number.isInteger(value) && value > run.baseFrame),
        `${run.id} ${phaseName} frames must follow the base frame`);
      invariant(values.every((value, index) => index === 0 || value > values[index - 1]),
        `${run.id} ${phaseName} frames must be strictly ordered`);
    }
  }
  const relative = (run, phase, key) => run.phases[phase][key] - run.baseFrame;
  invariant(runs.every((run) => relative(run, "checkYourWork", "firstVisible") === 13),
    "check-your-work first-visible offset is not repeated across all three runs");
  invariant(runs.every((run) => relative(run, "checkYourWork", "fullyVisible") === 22),
    "check-your-work full-visibility offset is not repeated across all three runs");
  invariant(relative(first, "strategiesHeading", "firstVisible") === 102
    && relative(replay, "strategiesHeading", "firstVisible") === 103
    && relative(reentry, "strategiesHeading", "firstVisible") === 103,
  "strategies first-visible offsets drifted");
  invariant(relative(first, "strategyList", "firstVisible") === 138
    && relative(replay, "strategyList", "firstVisible") === 139
    && relative(reentry, "strategyList", "firstVisible") === 139,
  "strategy-list first-visible offsets drifted");
  invariant(relative(first, "showYourWorkPulse", "firstVisible") === 235
    && relative(replay, "showYourWorkPulse", "firstVisible") === 236
    && relative(reentry, "showYourWorkPulse", "firstVisible") === 236,
  "show-your-work first-visible offsets drifted");
  return true;
}

function frameRecord(manifest, ordinal, observation) {
  const frame = manifest.frames[ordinal - 1];
  invariant(frame?.ordinal === ordinal && HASH.test(frame.sha256 ?? ""), `capture frame ${ordinal} is missing or invalid`);
  return {
    observation,
    captureFrameOrdinal: ordinal,
    relativeTimeSeconds: frame.relativeTimeSeconds,
    file: frame.file,
    bytes: frame.bytes,
    sha256: frame.sha256,
  };
}

function materializeRun(run, manifest) {
  const boundaryFrames = Object.entries(run.boundaryFrames).map(([observation, ordinal]) =>
    frameRecord(manifest, ordinal, observation));
  const phases = Object.fromEntries(Object.entries(run.phases).map(([phase, frames]) => [
    phase,
    Object.fromEntries(Object.entries(frames).map(([observation, ordinal]) => [
      observation,
      frameRecord(manifest, ordinal, `${phase}.${observation}`),
    ])),
  ]));
  return {
    id: run.id,
    kind: run.kind,
    base: frameRecord(manifest, run.baseFrame, "ts006Base"),
    boundaryFrames,
    phases,
  };
}

function renderMarkdown(report) {
  const rows = report.observedRuns.map((run) => {
    const phase = run.phases;
    return `| ${run.id} | ${run.base.captureFrameOrdinal} | ${phase.checkYourWork.firstVisible.captureFrameOrdinal}-${phase.checkYourWork.fullyVisible.captureFrameOrdinal} | ${phase.strategiesHeading.firstVisible.captureFrameOrdinal}-${phase.strategiesHeading.fullyVisible.captureFrameOrdinal} | ${phase.strategyList.firstVisible.captureFrameOrdinal}-${phase.strategyList.fullyVisible.captureFrameOrdinal} | ${phase.showYourWorkPulse.firstVisible.captureFrameOrdinal}; ${phase.showYourWorkPulse.firstPulseVariantA.captureFrameOrdinal}/${phase.showYourWorkPulse.firstPulseVariantB.captureFrameOrdinal} |`;
  }).join("\n");
  return `# TS006 EN manual-runtime diagnostic observations\n\n`
    + `Status: **repeatable visual observations from a verified diagnostic; not a promotable baseline**.\n\n`
    + `The same TS006 reveal sequence was observed after first natural navigation, host Replay, and Previous/Next re-entry. Capture ordinals are not asserted to be source SWF frame numbers.\n\n`
    + `| Run | Base | Check your work | Strategies heading | Strategy list | Show your work pulse |\n`
    + `| --- | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n`
    + `Observed English content: \`${report.content.heading}\`; \`${report.content.strategiesHeading}\`; ${report.content.strategies.join("; ")}; \`${report.content.terminalPrompt}\`.\n\n`
    + `Current-JavaScript conflict: the frozen source-static frame is one image for all 128 sprite-23 frames, says \`${report.currentJavascriptConflict.sourceStaticTextConflict}\`, and does not contain the host-observed reveal sequence. Its diagnostic full-stage normalized RMSE is ${report.currentJavascriptConflict.diagnosticFullStageRmse.base.toFixed(6)} against the observed base and ${report.currentJavascriptConflict.diagnosticFullStageRmse.terminal.toFixed(6)} against the first terminal pulse variant. These are identity-mismatch diagnostics, not acceptance metrics.\n\n`
    + `Navigation: frame ${report.navigation.previous.sourceTerminal.captureFrameOrdinal} is the TS006 terminal before Previous; frame ${report.navigation.previous.destinationBase.captureFrameOrdinal} is the TS005 base. Frame ${report.navigation.next.sourceTerminal.captureFrameOrdinal} is the TS005 terminal before Next; frame ${report.navigation.next.destinationBase.captureFrameOrdinal} is the TS006 base. No TS007 frame was observed in this capture.\n\n`
    + `Strict acceptance effect: **none**. Exact SWF/source-frame mapping, contained disposable-profile authority, Spanish, audio cue attribution, RMSE, independent review, and Owner acceptance remain pending.\n`;
}

export async function annotateDiagnostic({sessionRoot, write = true} = {}) {
  validateObservationSpec();
  const resolvedSession = path.resolve(sessionRoot ?? "");
  invariant(within(ARTIFACT_ROOT, resolvedSession), "--session-root must be a child of artifacts/full-frame/g4-l3");
  const [realArtifactRoot, realSession] = await Promise.all([realpath(ARTIFACT_ROOT), realpath(resolvedSession)]);
  invariant(within(realArtifactRoot, realSession), "session realpath escapes artifacts/full-frame/g4-l3");
  const diagnosticPath = path.join(realSession, DIAGNOSTIC_REPORT_RELATIVE);
  const candidateManifestPath = path.join(PROJECT_ROOT, CURRENT_CANDIDATE_MANIFEST_RELATIVE);
  const candidateFramePath = path.join(PROJECT_ROOT, CURRENT_CANDIDATE_FRAME_RELATIVE);
  const [diagnosticArtifact, generatorArtifact, candidateManifestArtifact, candidateFrameArtifact] = await Promise.all([
    readRegular(diagnosticPath, "diagnostic integrity report"),
    readRegular(SCRIPT_PATH, "diagnostic annotation generator"),
    readRegular(candidateManifestPath, "frozen current-JavaScript capture manifest"),
    readRegular(candidateFramePath, "frozen current-JavaScript frame"),
  ]);
  const diagnostic = JSON.parse(diagnosticArtifact.bytes);
  invariant(diagnostic.schemaVersion === 1
    && diagnostic.evidenceType === "g4-l3-ts006-manual-runtime-diagnostic-integrity-report"
    && diagnostic.status === "verified-diagnostic-not-promotion-eligible"
    && diagnostic.identity?.animationId === EXPECTED_ANIMATION_ID
    && diagnostic.identity?.language === "en",
  "diagnostic integrity report identity or status drifted");
  invariant(diagnostic.source?.sha256 === EXPECTED_SOURCE_SHA256
    && diagnostic.authority?.runtimeAuthorityClaimed === false
    && diagnostic.authority?.promotionEligible === false
    && diagnostic.authority?.strictAcceptanceEffect === "none",
  "diagnostic integrity report source or authority boundary drifted");
  const captureManifestPath = path.join(PROJECT_ROOT, diagnostic.capture.manifest.file);
  invariant(within(realSession, captureManifestPath), "capture manifest escapes the diagnostic session");
  const manifestArtifact = await readRegular(captureManifestPath, "capture manifest");
  invariant(manifestArtifact.sha256 === diagnostic.capture.manifest.sha256, "capture manifest hash differs from integrity report");
  const manifest = JSON.parse(manifestArtifact.bytes);
  invariant(Array.isArray(manifest.frames) && manifest.frames.length === diagnostic.capture.frames.count,
    "capture frame descriptors differ from the integrity report");
  invariant(manifest.frames.length >= 3230, "capture ends before the last reviewed TS006 observation");
  invariant(candidateManifestArtifact.sha256 === EXPECTED_CURRENT_CANDIDATE_MANIFEST_SHA256
    && candidateFrameArtifact.sha256 === EXPECTED_CURRENT_CANDIDATE_FRAME_SHA256,
  "frozen current-JavaScript evidence drifted");
  const candidateManifest = JSON.parse(candidateManifestArtifact.bytes);
  invariant(candidateManifest.animationId === EXPECTED_ANIMATION_ID
    && candidateManifest.frameDomainId === "sprite-23"
    && candidateManifest.scenario === "source-static-frame"
    && candidateManifest.status === "complete"
    && candidateManifest.captured?.length === 128
    && new Set(candidateManifest.captured.map(({sha256: frameSha256}) => frameSha256)).size === 1
    && candidateManifest.captured[0]?.sha256 === EXPECTED_CURRENT_CANDIDATE_FRAME_SHA256,
  "frozen current-JavaScript evidence no longer has the expected 128-frame static identity");
  const observedRuns = RUN_SPECS.map((run) => materializeRun(run, manifest));
  const report = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-manual-runtime-diagnostic-observations",
    status: "verified-repeatable-observations-not-promotion-eligible",
    identity: {
      animationId: EXPECTED_ANIMATION_ID,
      sessionId: diagnostic.identity.sessionId,
      language: "en",
    },
    inputs: {
      diagnosticIntegrityReport: {file: portable(diagnosticPath), bytes: diagnosticArtifact.size, sha256: diagnosticArtifact.sha256},
      captureManifest: {file: portable(captureManifestPath), bytes: manifestArtifact.size, sha256: manifestArtifact.sha256},
      frozenCurrentJavascriptCaptureManifest: {file: portable(candidateManifestPath), bytes: candidateManifestArtifact.size, sha256: candidateManifestArtifact.sha256},
      frozenCurrentJavascriptFrame: {file: portable(candidateFramePath), bytes: candidateFrameArtifact.size, sha256: candidateFrameArtifact.sha256},
      generator: {file: portable(SCRIPT_PATH), bytes: generatorArtifact.size, sha256: generatorArtifact.sha256},
    },
    source: diagnostic.source,
    captureFrameMeaning: {
      indexing: "one-indexed-capture-ordinal",
      sourceFrameMapping: "unresolved-in-diagnostic",
      warning: "Capture ordinals and relative timestamps are evidence-location identities, not asserted SWF root or nested timeline frame numbers.",
    },
    content: {
      pageTitle: "Negative Numbers: Practice Test",
      baseTable: [
        "1. Restate the question.",
        "2. Organize the information.",
        "3. Solve the problem.",
        "4. [blank before reveal]",
      ],
      heading: "4 Check your work.",
      tableTerminal: "4. Check your work.",
      strategiesHeading: "Strategies to try:",
      strategies: [
        "write an equation and solve it",
        "draw a picture",
        "look for a pattern",
        "systematically guess and check",
        "act it out",
        "make a table",
        "work a simpler problem",
        "work backwards",
      ],
      terminalPrompt: "Show your work.",
      terminalPromptBehavior: "After fading in, the linked words visibly alternate between two color variants.",
    },
    observedRuns,
    currentJavascriptConflict: {
      established: true,
      sourceStaticCaptureFrameCount: 128,
      sourceStaticUniqueVisualCount: 1,
      sourceStaticTextConflict: "4. Check your answer.",
      hostObservedText: "4. Check your work.",
      missingHostObservedVisuals: [
        "Check your work heading reveal",
        "Strategies to try heading reveal",
        "eight-item strategy list reveal",
        "Show your work linked prompt reveal and color pulse",
        "native Lesson Shell composition",
      ],
      diagnosticFullStageRmse: {
        method: "ImageMagick compare -metric RMSE on exact 800x600 PNGs; normalized value in parentheses",
        base: 0.304423,
        baseCaptureFrameOrdinal: 2032,
        terminal: 0.321556,
        terminalCaptureFrameOrdinal: 2272,
        acceptanceMetric: false,
        reasonNotAcceptanceMetric: "The implementation image is a child source-static candidate while the runtime image is a full Lesson Shell composite, and this original-runtime session is not promotion eligible.",
      },
      disposition: "preserve the 128-frame source-static candidate as structural evidence; implement the natural host-composited behavior as a separate fail-closed engineering candidate until controlled source-frame mapping is established",
    },
    navigation: {
      previous: {
        sourceAnimationId: EXPECTED_ANIMATION_ID,
        destinationAnimationId: "course-g04-l03-ts-005",
        sourceTerminal: frameRecord(manifest, 2862, "ts006TerminalBeforePrevious"),
        destinationBase: frameRecord(manifest, 2863, "ts005BaseAfterPrevious"),
      },
      next: {
        sourceAnimationId: "course-g04-l03-ts-005",
        destinationAnimationId: EXPECTED_ANIMATION_ID,
        sourceTerminal: frameRecord(manifest, 2988, "ts005TerminalBeforeNext"),
        destinationBase: frameRecord(manifest, 2989, "ts006BaseAfterNext"),
      },
      ts007Observed: false,
    },
    repeatedSequenceFinding: {
      established: true,
      basis: "Three separately entered runs repeat the same ordered visual phases with matching capture-ordinal offsets, allowing at most one captured-frame offset after the first phase.",
      implementationUse: "engineering-candidate timing and state specification only",
      baselinePromotionUse: false,
    },
    authority: {
      classification: "manual-current-administrator-runtime-diagnostic-observation",
      runtimeAuthorityClaimed: false,
      promotionEligible: false,
      strictAcceptanceEffect: "none",
      completionLedgerEffect: "none",
      lessonReleaseLedgerEffect: "none",
    },
    pending: [
      "exact mapping from capture ordinals to one-indexed SWF root and nested frame domains",
      "contained disposable-profile original-runtime baseline from pre-entry through terminal and Replay",
      "Spanish natural trace and independent profile",
      "audio cue attribution and listening review",
      "implementation capture and frame-aligned RMSE",
      "independent visual review and Owner acceptance",
    ],
  };
  const jsonPath = path.join(realSession, OBSERVATIONS_JSON_RELATIVE);
  const markdownPath = path.join(realSession, OBSERVATIONS_MD_RELATIVE);
  if (write) {
    await mkdir(path.dirname(jsonPath), {recursive: true});
    for (const [destination, contents] of [[jsonPath, pretty(report)], [markdownPath, renderMarkdown(report)]]) {
      const temporary = `${destination}.tmp-${process.pid}`;
      await writeFile(temporary, contents, {flag: "wx"});
      await rename(temporary, destination);
    }
  }
  return {report, jsonPath, markdownPath};
}

export function parseArguments(argv) {
  let sessionRoot = null;
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--session-root") sessionRoot = argv[++index] ?? "";
    else if (value === "--check") check = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  invariant(sessionRoot, "--session-root is required");
  return {sessionRoot, check};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await annotateDiagnostic({sessionRoot: options.sessionRoot, write: !options.check});
  if (options.check) {
    const [jsonArtifact, markdownArtifact] = await Promise.all([
      readRegular(result.jsonPath, "runtime observations JSON"),
      readRegular(result.markdownPath, "runtime observations Markdown"),
    ]);
    invariant(jsonArtifact.bytes.equals(Buffer.from(pretty(result.report))), "runtime observations JSON is stale");
    invariant(markdownArtifact.bytes.equals(Buffer.from(renderMarkdown(result.report))), "runtime observations Markdown is stale");
  }
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${portable(result.jsonPath)}\n`);
  process.stdout.write(`${options.check ? "Verified" : "Wrote"} ${portable(result.markdownPath)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
