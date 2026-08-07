#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR = "scripts/build-g4-l3-current-javascript-progress.mjs";
const LESSON_CONTRACT =
  "reports/g4-l3-lesson-product-navigation-contract.json";
const PROTOTYPE_REGISTRY = "packages/demos/prototype-registry.json";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const MAIN_TIMELINE_AUDIO_CANDIDATES =
  "reports/g4-l3-current-js-main-timeline-audio-candidates.json";
const MAIN_TIMELINE_AUDIO_QA =
  "reports/g4-l3-current-js-main-timeline-audio-qa.json";
const IR001_RANDOM_AUDIO_CANDIDATE =
  "reports/g4-l3-ir001-current-js-random-audio-candidate.json";
const IR001_RANDOM_AUDIO_QA =
  "reports/g4-l3-ir001-current-js-random-audio-qa.json";
const TI003_EVENT_AUDIO_CANDIDATE =
  "reports/g4-l3-ti003-current-js-event-audio-candidate.json";
const TI003_EVENT_AUDIO_QA =
  "reports/g4-l3-ti003-current-js-event-audio-qa.json";
const REPORT_JSON = "reports/g4-l3-current-javascript-progress.json";
const REPORT_MARKDOWN = "reports/g4-l3-current-javascript-progress.md";
const CANDIDATE_REPORT_PATTERN =
  /^g4-l3-[a-z0-9-]+-current-javascript-candidate\.json$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value) {
  return sha256(stableJson(value));
}

function portable(value) {
  return value.split(path.sep).join("/");
}

export function lessonSourceAuthorityProjection(lesson) {
  return {
    schemaVersion: lesson?.schemaVersion,
    reportType: lesson?.reportType,
    activePages: lesson?.summary?.activePages,
    pages: (lesson?.pages ?? []).map((page) => ({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionPageOrdinal: page.sectionPageOrdinal,
      sectionCode: page.sectionCode,
      animationId: page.animationId,
      assetId: page.assetId,
      batchId: page.batchId,
      source: {
        sourceKind: page.source?.sourceKind,
        swf: {
          path: page.source?.swf?.path,
          bytes: page.source?.swf?.bytes,
          sha256: page.source?.swf?.sha256,
        },
      },
      acceptance: page.acceptance,
    })),
    acceptance: {
      acceptanceNeutral: lesson?.acceptance?.acceptanceNeutral,
      implementationAuthorized:
        lesson?.acceptance?.implementationAuthorized,
      routeBehaviorVerified: lesson?.acceptance?.routeBehaviorVerified,
      originalRuntimeAccepted: lesson?.acceptance?.originalRuntimeAccepted,
      audioAccepted: lesson?.acceptance?.audioAccepted,
      humanVisualAccepted: lesson?.acceptance?.humanVisualAccepted,
      ownerAccepted: lesson?.acceptance?.ownerAccepted,
      strictProductAccepted: lesson?.acceptance?.strictProductAccepted,
      lessonComplete: lesson?.acceptance?.lessonComplete,
    },
  };
}

function projectPath(relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project path is required",
  );
  invariant(!path.isAbsolute(relativePath), "project path must be relative");
  const resolved = path.resolve(ROOT, relativePath);
  invariant(
    resolved.startsWith(`${ROOT}${path.sep}`),
    `project path escapes the repository: ${relativePath}`,
  );
  return resolved;
}

async function readBound(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    value: JSON.parse(bytes.toString("utf8")),
  };
}

async function hashFile(relativePath) {
  const absolutePath = projectPath(relativePath);
  const metadata = await lstat(absolutePath);
  invariant(
    metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`,
  );
  const physical = await stat(absolutePath);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolutePath);
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
}

function assertAcceptanceNeutral(candidate, relativePath) {
  invariant(
    candidate.reportType === "current-javascript-engineering-candidate",
    `${relativePath}: unsupported candidate report type`,
  );
  invariant(
    candidate.disposition?.currentJavaScriptCandidate === true &&
      candidate.disposition?.prototypeRegistryOnly === true &&
      candidate.disposition?.strictLedgerChanged === false &&
      candidate.disposition?.publicLibraryAdmitted === false &&
      candidate.disposition?.productionAdmission === false,
    `${relativePath}: candidate disposition is not acceptance-neutral`,
  );
  invariant(
    candidate.strictAcceptanceEffect === "none",
    `${relativePath}: strict acceptance effect must be none`,
  );
  const gates = Object.values(candidate.acceptance ?? {});
  invariant(
    gates.length > 0 && gates.every((value) => value === false),
    `${relativePath}: every acceptance gate must remain false`,
  );
  if (candidate.reportFingerprintSha256 !== undefined) {
    invariant(
      /^[a-f0-9]{64}$/.test(candidate.reportFingerprintSha256),
      `${relativePath}: candidate report fingerprint is malformed`,
    );
    const projected = {...candidate};
    delete projected.reportFingerprintSha256;
    invariant(
      candidate.reportFingerprintSha256 === fingerprint(projected),
      `${relativePath}: candidate report fingerprint is stale`,
    );
  }
}

async function loadCandidateReports() {
  const names = (await readdir(projectPath("reports")))
    .filter((name) => CANDIDATE_REPORT_PATTERN.test(name))
    .sort((left, right) => left.localeCompare(right, "en"));
  const byAnimationId = new Map();
  for (const name of names) {
    const relativePath = `reports/${name}`;
    const binding = await readBound(relativePath);
    const candidate = binding.value;
    assertAcceptanceNeutral(candidate, relativePath);
    invariant(
      /^course-g04-l03-[a-z0-9-]+$/.test(candidate.animationId ?? ""),
      `${relativePath}: animationId is outside G4 L3`,
    );
    invariant(
      !byAnimationId.has(candidate.animationId),
      `${candidate.animationId}: duplicate current-JavaScript candidate reports`,
    );
    byAnimationId.set(candidate.animationId, {
      binding: {
        path: binding.path,
        bytes: binding.bytes,
        sha256: binding.sha256,
      },
      value: candidate,
    });
  }
  return byAnimationId;
}

async function validateCandidateOutputs(candidate) {
  const outputs = [];
  for (const key of ["canvasRuntime", "canvasManifest"]) {
    const declared = candidate.outputs?.[key];
    if (!declared) continue;
    invariant(
      typeof declared.path === "string" &&
        Number.isSafeInteger(declared.bytes) &&
        /^[a-f0-9]{64}$/.test(declared.sha256 ?? ""),
      `${candidate.animationId}: malformed ${key} binding`,
    );
    const observed = await hashFile(declared.path);
    invariant(
      observed.bytes === declared.bytes && observed.sha256 === declared.sha256,
      `${candidate.animationId}: ${key} differs from its candidate report`,
    );
    outputs.push({kind: key, ...observed});
  }
  invariant(
    outputs.some((entry) => entry.kind === "canvasRuntime") &&
      outputs.some((entry) => entry.kind === "canvasManifest"),
    `${candidate.animationId}: candidate report lacks bound Canvas outputs`,
  );
  return outputs;
}

async function readMigrationStatus(animationId) {
  const relativePath = `migrations/${animationId}/migration.json`;
  try {
    const binding = await readBound(relativePath);
    return {
      exists: true,
      path: relativePath,
      bytes: binding.bytes,
      sha256: binding.sha256,
      status: binding.value.status ?? null,
    };
  } catch (error) {
    if (error.code === "ENOENT") return {exists: false};
    throw error;
  }
}

function renderMarkdown(report) {
  const rows = report.pages
    .map(
      (page) =>
        `| ${page.globalPageOrdinal} | \`${page.animationId}\` | ${page.disposition} | ${page.currentJavaScript.module ? "yes" : "no"} | ${page.strict.strictComplete ? "yes" : "no"} |`,
    )
    .join("\n");
  return `# G4 L3 current-JavaScript progress\n\nThis report inventories the current JavaScript engineering surface for all 39 active G4 L3 pages. It is acceptance-neutral: a prototype module is not strict completion, original-runtime parity, bilingual/audio acceptance, human visual approval, or owner acceptance.\n\n## Result\n\n- Active lesson pages: ${report.summary.activePages}\n- Current JavaScript modules: ${report.summary.currentJavaScriptModules}\n- Hash-bound source-static candidate reports: ${report.summary.hashBoundCandidateReports}\n- Current-JavaScript audio candidates: ${report.summary.currentJavaScriptAudioCandidateMembers}\n- English browser audio QA passed: ${report.summary.currentJavaScriptAudioEnglishQaPassed}\n- Spanish browser audio QA passed: ${report.summary.currentJavaScriptAudioSpanishQaPassed}\n- IR001 deterministic random-audio branch QA: ${report.summary.randomBranchAudioQaPassed}/1\n- TI003 source event-audio QA: ${report.summary.eventAudioQaPassed}/1\n- Strict-complete pages: ${report.summary.strictCompletePages}\n- Pages without a JavaScript module: ${report.summary.pagesWithoutCurrentJavaScript}\n\n| Ordinal | Animation | Disposition | JavaScript | Strict |\n|---:|---|---|---:|---:|\n${rows}\n\n## Boundary\n\nNo acceptance gate or completion ledger entry is changed by this report. The audio counts prove exact source-byte staging and current-browser playback only. Spoken language, natural random distribution, authoritative original-runtime synchronization, complete listening, Replay parity, human review, and Owner acceptance remain false. Screen-unlocked Adobe Animate authoring review, authoritative original-runtime baselines, reachable behavior, bilingual visuals, full-frame RMSE, product/accessibility QA, named human review, and owner acceptance remain separate evidence obligations.\n`;
}

async function assertSafeOutputTarget(relativePath) {
  const absolutePath = projectPath(relativePath);
  invariant(
    !absolutePath.startsWith(`${projectPath("source-assets")}${path.sep}`),
    "generated output cannot be placed under source-assets",
  );
  try {
    const target = await lstat(absolutePath);
    invariant(
      target.isFile() && !target.isSymbolicLink(),
      `${relativePath} is not a regular file`,
    );
    const physical = await stat(absolutePath);
    invariant(physical.nlink === 1, `${relativePath} has multiple hard links`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function emit(relativePath, expected, check) {
  const absolutePath = projectPath(relativePath);
  if (check) {
    const actual = await readFile(absolutePath);
    invariant(actual.equals(expected), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(absolutePath), {recursive: true});
  await assertSafeOutputTarget(relativePath);
  await writeFile(absolutePath, expected);
}

export function parseArguments(argv) {
  const result = {check: false};
  for (const argument of argv) {
    if (argument === "--check") result.check = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

export async function generateG4L3CurrentJavascriptProgress({check = false} = {}) {
  const [
    lesson,
    registry,
    ledger,
    generator,
    candidateReports,
    mainTimelineAudioCandidates,
    mainTimelineAudioQa,
    ir001RandomAudioCandidate,
    ir001RandomAudioQa,
    ti003EventAudioCandidate,
    ti003EventAudioQa,
  ] =
    await Promise.all([
      readBound(LESSON_CONTRACT),
      readBound(PROTOTYPE_REGISTRY),
      readBound(COMPLETION_LEDGER),
      hashFile(GENERATOR),
      loadCandidateReports(),
      readBound(MAIN_TIMELINE_AUDIO_CANDIDATES),
      readBound(MAIN_TIMELINE_AUDIO_QA),
      readBound(IR001_RANDOM_AUDIO_CANDIDATE),
      readBound(IR001_RANDOM_AUDIO_QA),
      readBound(TI003_EVENT_AUDIO_CANDIDATE),
      readBound(TI003_EVENT_AUDIO_QA),
    ]);

  invariant(
    mainTimelineAudioCandidates.value.reportType ===
      "g4-l3-current-js-main-timeline-audio-candidates" &&
      mainTimelineAudioCandidates.value.summary?.eligibleMemberCount === 34 &&
      mainTimelineAudioCandidates.value.candidates?.length === 34 &&
      mainTimelineAudioCandidates.value.summary?.stagedAssetCount === 68 &&
      mainTimelineAudioCandidates.value.strictAcceptanceEffect === "none" &&
      Object.values(mainTimelineAudioCandidates.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "main-timeline audio candidate report exceeded its acceptance-neutral boundary",
  );
  invariant(
    mainTimelineAudioQa.value.reportType ===
      "g4-l3-current-js-main-timeline-audio-browser-qa" &&
      mainTimelineAudioQa.value.summary?.memberCount === 34 &&
      mainTimelineAudioQa.value.summary?.englishPassed === 34 &&
      mainTimelineAudioQa.value.summary?.spanishPassed === 34 &&
      mainTimelineAudioQa.value.summary?.autoplayFallbackPassed === true &&
      mainTimelineAudioQa.value.summary?.pass === true &&
      mainTimelineAudioQa.value.members?.length === 34 &&
      mainTimelineAudioQa.value.members.every(
        (member) => member.english?.pass === true && member.spanish?.pass === true,
      ) &&
      mainTimelineAudioQa.value.strictAcceptanceEffect === "none" &&
      Object.values(mainTimelineAudioQa.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "main-timeline audio QA report is incomplete or exceeded its acceptance-neutral boundary",
  );
  invariant(
    mainTimelineAudioQa.value.candidateReport?.path ===
      mainTimelineAudioCandidates.path &&
      mainTimelineAudioQa.value.candidateReport?.bytes ===
        mainTimelineAudioCandidates.bytes &&
      mainTimelineAudioQa.value.candidateReport?.sha256 ===
        mainTimelineAudioCandidates.sha256,
    "main-timeline audio QA is not bound to the current candidate report",
  );
  invariant(
    ir001RandomAudioCandidate.value.reportType ===
      "g4-l3-ir001-current-js-random-audio-candidate" &&
      ir001RandomAudioCandidate.value.candidate?.animationId ===
        "course-g04-l03-ir-001-341242cc" &&
      ir001RandomAudioCandidate.value.candidate?.branches?.length === 2 &&
      ir001RandomAudioCandidate.value.summary?.stagedAssetCount === 2 &&
      ir001RandomAudioCandidate.value.strictAcceptanceEffect === "none" &&
      Object.values(ir001RandomAudioCandidate.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "IR001 random-audio candidate report exceeded its acceptance-neutral boundary",
  );
  invariant(
    ir001RandomAudioQa.value.reportType ===
      "g4-l3-ir001-current-js-random-audio-browser-qa" &&
      ir001RandomAudioQa.value.animationId ===
        "course-g04-l03-ir-001-341242cc" &&
      ir001RandomAudioQa.value.summary?.branchCount === 2 &&
      ir001RandomAudioQa.value.summary?.passedBranchCount === 2 &&
      ir001RandomAudioQa.value.summary?.replayPassedBranchCount === 2 &&
      ir001RandomAudioQa.value.summary?.wrongBranchPlayCount === 0 &&
      ir001RandomAudioQa.value.summary?.pass === true &&
      ir001RandomAudioQa.value.strictAcceptanceEffect === "none" &&
      Object.values(ir001RandomAudioQa.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "IR001 random-audio browser QA is incomplete or exceeded its acceptance-neutral boundary",
  );
  invariant(
    ir001RandomAudioQa.value.candidateReport?.path ===
      ir001RandomAudioCandidate.path &&
      ir001RandomAudioQa.value.candidateReport?.bytes ===
        ir001RandomAudioCandidate.bytes &&
      ir001RandomAudioQa.value.candidateReport?.sha256 ===
        ir001RandomAudioCandidate.sha256,
    "IR001 random-audio QA is not bound to the current candidate report",
  );
  invariant(
    ti003EventAudioCandidate.value.reportType ===
      "g4-l3-ti003-current-js-event-audio-candidate" &&
      ti003EventAudioCandidate.value.candidate?.animationId ===
        "course-g04-l03-ti-003" &&
      ti003EventAudioCandidate.value.candidate?.swfEvent?.soundId === 14 &&
      ti003EventAudioCandidate.value.candidate?.swfEvent?.localFrame === 1 &&
      ti003EventAudioCandidate.value.summary?.stagedAssetCount === 2 &&
      ti003EventAudioCandidate.value.strictAcceptanceEffect === "none" &&
      Object.values(ti003EventAudioCandidate.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "TI003 event-audio candidate exceeded its acceptance-neutral boundary",
  );
  invariant(
    ti003EventAudioQa.value.reportType ===
      "g4-l3-ti003-current-js-event-audio-browser-qa" &&
      ti003EventAudioQa.value.animationId === "course-g04-l03-ti-003" &&
      ti003EventAudioQa.value.summary?.englishPassed === true &&
      ti003EventAudioQa.value.summary?.spanishPassed === true &&
      ti003EventAudioQa.value.summary?.pass === true &&
      ti003EventAudioQa.value.strictAcceptanceEffect === "none" &&
      Object.values(ti003EventAudioQa.value.acceptance ?? {}).every(
        (value) => value === false,
      ),
    "TI003 event-audio browser QA is incomplete or exceeded its acceptance-neutral boundary",
  );
  invariant(
    ti003EventAudioQa.value.candidateReport?.path ===
      ti003EventAudioCandidate.path &&
      ti003EventAudioQa.value.candidateReport?.bytes ===
        ti003EventAudioCandidate.bytes &&
      ti003EventAudioQa.value.candidateReport?.sha256 ===
        ti003EventAudioCandidate.sha256,
    "TI003 event-audio QA is not bound to the current candidate report",
  );
  const audioCandidatesByAnimationId = new Map(
    mainTimelineAudioCandidates.value.candidates.map((candidate) => [
      candidate.animationId,
      candidate,
    ]),
  );
  const audioQaByAnimationId = new Map(
    mainTimelineAudioQa.value.members.map((member) => [
      member.animationId,
      member,
    ]),
  );
  audioCandidatesByAnimationId.set(
    ir001RandomAudioCandidate.value.candidate.animationId,
    {
      integration: "specialized-random-branch-module",
      frameDomain: "sprite-27",
      scenario: "source-static-frame",
      randomBranches: ir001RandomAudioCandidate.value.candidate.branches,
    },
  );
  audioQaByAnimationId.set(ir001RandomAudioQa.value.animationId, {
    randomBranches: ir001RandomAudioQa.value.branches,
    english: {pass: ir001RandomAudioQa.value.summary.pass},
    spanish: null,
  });
  audioCandidatesByAnimationId.set(
    ti003EventAudioCandidate.value.candidate.animationId,
    {
      integration: "specialized-event-sound-module",
      frameDomain: ti003EventAudioCandidate.value.candidate.frameDomain,
      scenario: "source-static-frame",
      eventSound: ti003EventAudioCandidate.value.candidate.swfEvent,
      authoringCue: ti003EventAudioCandidate.value.candidate.authoringCue,
      english: ti003EventAudioCandidate.value.candidate.english,
      spanish: ti003EventAudioCandidate.value.candidate.spanish,
      excludedInteractionAudio:
        ti003EventAudioCandidate.value.candidate.excludedInteractionAudio,
    },
  );
  audioQaByAnimationId.set(ti003EventAudioQa.value.animationId, {
    english: {pass: ti003EventAudioQa.value.english.pass},
    spanish: {pass: ti003EventAudioQa.value.spanish.pass},
  });

  invariant(
    lesson.value.summary?.activePages === 39 &&
      lesson.value.pages?.length === 39,
    "G4 L3 lesson contract must contain exactly 39 active pages",
  );
  const lessonProjection = lessonSourceAuthorityProjection(lesson.value);
  invariant(
    lessonProjection.reportType ===
      "g4-l3-full-lesson-product-navigation-contract" &&
      lessonProjection.pages.every((page) =>
        Object.values(page.acceptance ?? {}).every((value) => value === false)) &&
      lessonProjection.acceptance?.acceptanceNeutral === true &&
      Object.entries(lessonProjection.acceptance)
        .filter(([key]) => key !== "acceptanceNeutral")
        .every(([, value]) => value === false),
    "G4 L3 lesson contract exceeded its acceptance-neutral source boundary",
  );
  invariant(
    ledger.value.summary?.strictComplete === 0,
    "strict completion changed; update this acceptance-neutral projection deliberately",
  );

  const registryEntries = new Map(
    (registry.value.entries ?? []).map((entry) => [entry.key, entry]),
  );
  const ledgerEntries = new Map(
    (ledger.value.diagnostics ?? []).map((entry) => [entry.animationId, entry]),
  );
  const lessonIds = new Set(lesson.value.pages.map((page) => page.animationId));
  for (const animationId of candidateReports.keys()) {
    invariant(
      lessonIds.has(animationId),
      `${animationId}: candidate report is not an active G4 L3 page`,
    );
  }

  const pages = [];
  for (const page of lesson.value.pages) {
    invariant(
      Object.values(page.acceptance ?? {}).every((value) => value === false),
      `${page.animationId}: lesson product acceptance must remain false`,
    );
    const registryEntry = registryEntries.get(page.animationId) ?? null;
    const candidate = candidateReports.get(page.animationId) ?? null;
    const audioCandidate =
      audioCandidatesByAnimationId.get(page.animationId) ?? null;
    const audioQa = audioQaByAnimationId.get(page.animationId) ?? null;
    invariant(
      Boolean(audioCandidate) === Boolean(audioQa),
      `${page.animationId}: audio candidate and browser QA membership differ`,
    );
    const migration = await readMigrationStatus(page.animationId);
    let module = null;
    if (registryEntry) {
      invariant(
        registryEntry.module === `./modules/${page.animationId}` &&
          registryEntry.maturity === "legacy-prototype",
        `${page.animationId}: unexpected prototype registry entry`,
      );
      module = await hashFile(
        `packages/demos/src/modules/${page.animationId}.tsx`,
      );
    }
    const outputs = candidate
      ? await validateCandidateOutputs(candidate.value)
      : [];
    const sourceSwf = await hashFile(page.source.swf.path);
    invariant(
      sourceSwf.bytes === page.source.swf.bytes &&
        sourceSwf.sha256 === page.source.swf.sha256,
      `${page.animationId}: source SWF differs from lesson contract`,
    );
    const ledgerDiagnostic = ledgerEntries.get(page.animationId) ?? null;
    const strictComplete = false;
    const disposition = candidate
      ? module
        ? "hash-bound-current-javascript-engineering-candidate"
        : "hash-bound-candidate-artifacts-without-registered-module"
      : module
        ? migration.exists
          ? "pilot-current-javascript-prototype"
          : "current-javascript-prototype"
        : "source-only-no-current-javascript-module";
    pages.push({
      globalPageOrdinal: page.globalPageOrdinal,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: page.sectionPageOrdinal,
      animationId: page.animationId,
      assetId: page.assetId,
      batchId: page.batchId,
      source: {swf: sourceSwf, sourceKind: page.source.sourceKind},
      disposition,
      currentJavaScript: {
        module,
        registryEntry,
        candidateReport: candidate?.binding ?? null,
        candidateOutputs: outputs,
        audioEngineeringCandidate: audioCandidate
          ? audioCandidate.integration === "specialized-random-branch-module"
            ? {
                integration: audioCandidate.integration,
                frameDomain: audioCandidate.frameDomain,
                scenario: audioCandidate.scenario,
                randomBranches: audioCandidate.randomBranches.map(
                  (branch) => ({
                    outcome: branch.outcome,
                    publicPath: branch.publicPath,
                    bytes: branch.bytes,
                    sha256: branch.sha256,
                    structuralCueFrame: branch.structuralCueFrame,
                    seedModulo:
                      branch.deterministicEngineeringSeedBinding,
                  }),
                ),
                spanish: null,
                browserQa: {
                  englishPassed: audioQa.english.pass,
                  spanishPassed: null,
                  spanishStatus:
                    "not-established-no-exact-associated-candidate",
                  branchResults: audioQa.randomBranches.map(
                    ({
                      outcome,
                      pass,
                      replayPlayObserved,
                      wrongBranchPlayCount,
                    }) => ({
                      outcome,
                      pass,
                      replayPlayObserved,
                      wrongBranchPlayCount,
                    }),
                  ),
                },
                acceptance: {
                  spokenLanguageEstablished: false,
                  naturalRandomDistributionEstablished: false,
                  authoritativeOriginalRuntimeSynchronizationEstablished: false,
                  completeListeningAccepted: false,
                  replayParityAccepted: false,
                  ownerAccepted: false,
                },
              }
            : audioCandidate.integration ===
                "specialized-event-sound-module"
              ? {
                  integration: audioCandidate.integration,
                  frameDomain: audioCandidate.frameDomain,
                  scenario: audioCandidate.scenario,
                  eventSound: audioCandidate.eventSound,
                  authoringCue: audioCandidate.authoringCue,
                  embedded: {
                    publicPath: audioCandidate.english.publicPath,
                    bytes: audioCandidate.english.bytes,
                    sha256: audioCandidate.english.sha256,
                    structuralCueFrame:
                      audioCandidate.english.structuralCueFrame,
                  },
                  spanish: {
                    publicPath: audioCandidate.spanish.publicPath,
                    bytes: audioCandidate.spanish.bytes,
                    sha256: audioCandidate.spanish.sha256,
                  },
                  excludedInteractionAudio:
                    audioCandidate.excludedInteractionAudio,
                  browserQa: {
                    englishPassed: audioQa.english.pass,
                    spanishPassed: audioQa.spanish.pass,
                  },
                  acceptance: {
                    spokenLanguageEstablished: false,
                    authoritativeOriginalRuntimeSynchronizationEstablished:
                      false,
                    completeListeningAccepted: false,
                    interactionAudioAccepted: false,
                    replayParityAccepted: false,
                    ownerAccepted: false,
                  },
                }
              : {
              integration: audioCandidate.integration,
              frameDomain: audioCandidate.frameDomain,
              scenario: audioCandidate.scenario,
              embedded: {
                publicPath: audioCandidate.embedded.publicPath,
                bytes: audioCandidate.embedded.bytes,
                sha256: audioCandidate.embedded.sha256,
                structuralCueFrame: audioCandidate.embedded.firstBlockFrame,
              },
              spanish: {
                publicPath: audioCandidate.spanish.publicPath,
                bytes: audioCandidate.spanish.bytes,
                sha256: audioCandidate.spanish.sha256,
              },
              browserQa: {
                englishPassed: audioQa.english.pass,
                spanishPassed: audioQa.spanish.pass,
              },
              acceptance: {
                spokenLanguageEstablished: false,
                authoritativeOriginalRuntimeSynchronizationEstablished: false,
                completeListeningAccepted: false,
                replayParityAccepted: false,
                ownerAccepted: false,
              },
            }
          : null,
        currentOutputExists: Boolean(module),
        currentOutputApprovedByHistoricalSchemaV3Message: false,
      },
      migration,
      strict: {
        strictComplete,
        ledgerDiagnostic: ledgerDiagnostic
          ? {
              status: ledgerDiagnostic.status,
              errorCount: ledgerDiagnostic.errorCount,
              manifestSha256: ledgerDiagnostic.manifestSha256,
            }
          : null,
      },
      acceptance: {
        authoritativeOriginalRuntimeComplete: false,
        bilingualVisualParityComplete: false,
        audioAccepted: false,
        fullFrameRmseComplete: false,
        humanVisualReviewAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
      },
    });
  }

  invariant(
    pages.every((page, index) => page.globalPageOrdinal === index + 1),
    "G4 L3 page order is not the exact 1..39 source order",
  );
  const currentJavaScriptModules = pages.filter(
    (page) => page.currentJavaScript.currentOutputExists,
  ).length;
  const hashBoundCandidateReports = pages.filter(
    (page) => page.currentJavaScript.candidateReport,
  ).length;
  const registeredHashBoundCandidateModules = pages.filter(
    (page) =>
      page.currentJavaScript.candidateReport &&
      page.currentJavaScript.currentOutputExists,
  ).length;
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-current-javascript-progress-acceptance-neutral",
    generator: {
      ...generator,
      command:
        "node scripts/build-g4-l3-current-javascript-progress.mjs",
    },
    sourceBindings: {
      lessonProductContract: {
        path: lesson.path,
        bindingMode: "lesson-source-authority-projection-v1",
        targetProjectionSha256: fingerprint(lessonProjection),
        wholeReportBytesOrSha256Bound: false,
        reason:
          "Current-JavaScript inventory binds only the 39-page order, identities, source SWF hashes, and acceptance-neutral state; product-QA hashes are excluded to prevent a circular evidence dependency.",
      },
      prototypeRegistry: {
        path: registry.path,
        bytes: registry.bytes,
        sha256: registry.sha256,
      },
      completionLedger: {
        path: ledger.path,
        bytes: ledger.bytes,
        sha256: ledger.sha256,
      },
      mainTimelineAudioCandidates: {
        path: mainTimelineAudioCandidates.path,
        bytes: mainTimelineAudioCandidates.bytes,
        sha256: mainTimelineAudioCandidates.sha256,
      },
      mainTimelineAudioBrowserQa: {
        path: mainTimelineAudioQa.path,
        bytes: mainTimelineAudioQa.bytes,
        sha256: mainTimelineAudioQa.sha256,
      },
      ir001RandomAudioCandidate: {
        path: ir001RandomAudioCandidate.path,
        bytes: ir001RandomAudioCandidate.bytes,
        sha256: ir001RandomAudioCandidate.sha256,
      },
      ir001RandomAudioBrowserQa: {
        path: ir001RandomAudioQa.path,
        bytes: ir001RandomAudioQa.bytes,
        sha256: ir001RandomAudioQa.sha256,
      },
      ti003EventAudioCandidate: {
        path: ti003EventAudioCandidate.path,
        bytes: ti003EventAudioCandidate.bytes,
        sha256: ti003EventAudioCandidate.sha256,
      },
      ti003EventAudioBrowserQa: {
        path: ti003EventAudioQa.path,
        bytes: ti003EventAudioQa.bytes,
        sha256: ti003EventAudioQa.sha256,
      },
    },
    scope: {
      grade: 4,
      lesson: 3,
      activePages: 39,
      courseShellExcluded: true,
    },
    summary: {
      activePages: pages.length,
      currentJavaScriptModules,
      hashBoundCandidateReports,
      registeredHashBoundCandidateModules,
      hashBoundCandidateArtifactsAwaitingRegistry:
        hashBoundCandidateReports - registeredHashBoundCandidateModules,
      pilotPrototypeModules:
        currentJavaScriptModules - registeredHashBoundCandidateModules,
      pagesWithoutCurrentJavaScript: pages.length - currentJavaScriptModules,
      mainTimelineAudioCandidateMembers:
        mainTimelineAudioCandidates.value.summary.eligibleMemberCount,
      mainTimelineAudioEnglishQaPassed:
        mainTimelineAudioQa.value.summary.englishPassed,
      mainTimelineAudioSpanishQaPassed:
        mainTimelineAudioQa.value.summary.spanishPassed,
      autoplayFallbackQaPassed:
        mainTimelineAudioQa.value.summary.autoplayFallbackPassed,
      randomBranchAudioCandidateMembers: 1,
      randomBranchAudioQaPassed:
        ir001RandomAudioQa.value.summary.passedBranchCount === 2 ? 1 : 0,
      eventAudioCandidateMembers: 1,
      eventAudioQaPassed:
        ti003EventAudioQa.value.summary.pass === true ? 1 : 0,
      currentJavaScriptAudioCandidateMembers:
        mainTimelineAudioCandidates.value.summary.eligibleMemberCount + 2,
      currentJavaScriptAudioEnglishQaPassed:
        mainTimelineAudioQa.value.summary.englishPassed + 2,
      currentJavaScriptAudioSpanishQaPassed:
        mainTimelineAudioQa.value.summary.spanishPassed + 1,
      strictCompletePages: 0,
      historicalSchemaV3ApprovalAppliedToTheseOutputs: 0,
    },
    pages,
    acceptance: {
      acceptanceNeutral: true,
      implementationAccepted: false,
      authoritativeOriginalRuntimeAccepted: false,
      bilingualVisualParityAccepted: false,
      audioAccepted: false,
      fullFrameRmseAccepted: false,
      productAndAccessibilityQaAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonComplete: false,
      strictAcceptanceEffect: "none",
    },
  };

  const jsonBytes = Buffer.from(stableJson(report));
  const markdownBytes = Buffer.from(renderMarkdown(report));
  await Promise.all([
    emit(REPORT_JSON, jsonBytes, check),
    emit(REPORT_MARKDOWN, markdownBytes, check),
  ]);
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = parseArguments(process.argv.slice(2));
  generateG4L3CurrentJavascriptProgress(options)
    .then((report) => {
      process.stdout.write(
        `${options.check ? "verified" : "generated"} ${REPORT_JSON}: ${report.summary.currentJavaScriptModules}/${report.summary.activePages} current JavaScript, ${report.summary.strictCompletePages} strict\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
