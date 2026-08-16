#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash, randomUUID} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const REPORT_JSON = "reports/g5-l4-current-js-audio-listening-review-v1.json";
const REPORT_MARKDOWN = "reports/g5-l4-current-js-audio-listening-review-v1.md";
const AUDIO_CANDIDATE_REPORT = "reports/g5-l4-current-js-audio-candidates.json";
const SOURCE_SCOPE = "reports/g5-l4-source-scope-freeze.json";
const RUNTIME_MAP = "packages/demos/src/g5-l4-audio.generated.ts";
const BROWSER_SPEC = "apps/web/e2e/g5-l4-audio.spec.ts";
const EXPECTED_PAGE_COUNT = 54;
const EXPECTED_REVIEWABLE_PAGE_COUNT = 53;
const EXPECTED_TRACK_COUNT = 185;
const ACCEPTANCE_KEYS = Object.freeze([
  "machineAudioIdentityVerified",
  "spokenLanguageEstablished",
  "currentJsAudibleContentAccepted",
  "currentJsTriggerAccepted",
  "currentJsSynchronizationAccepted",
  "naturalOriginalRuntimeReachabilityEstablished",
  "originalRuntimeSynchronizationEstablished",
  "humanListeningAccepted",
  "ownerAccepted",
  "strictComplete",
  "released",
  "published",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveContained(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0 &&
      !path.isAbsolute(relativePath) && !relativePath.includes("\\"),
    `${label}: path must be portable and relative`,
  );
  const resolved = path.resolve(root, relativePath);
  invariant(isWithin(root, resolved), `${label}: path escapes project root`);
  invariant(
    portable(path.relative(root, resolved)) === relativePath,
    `${label}: path is not normalized`,
  );
  return resolved;
}

async function readOrdinaryFile(root, relativePath, label = relativePath) {
  const absolute = resolveContained(root, relativePath, label);
  const before = await lstat(absolute);
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${label}: expected one ordinary non-linked file`,
  );
  const [bytes, realRoot, realFile] = await Promise.all([
    readFile(absolute),
    realpath(root),
    realpath(absolute),
  ]);
  invariant(isWithin(realRoot, realFile), `${label}: resolves outside project root`);
  const after = await lstat(absolute);
  invariant(
    after.isFile() && !after.isSymbolicLink() && after.nlink === 1 &&
      before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeMs === after.mtimeMs &&
      bytes.length === after.size,
    `${label}: changed while being read`,
  );
  return {
    relativePath,
    absolute,
    bytes,
    size: bytes.length,
    sha256: sha256(bytes),
  };
}

function descriptor(record, pathLabel = record.relativePath) {
  return {path: pathLabel, bytes: record.size, sha256: record.sha256};
}

async function mapLimit(values, concurrency, callback) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      output[index] = await callback(values[index], index);
    }
  }
  await Promise.all(
    Array.from({length: Math.min(concurrency, values.length)}, () => worker()),
  );
  return output;
}

async function ffprobeVersion() {
  const {stdout} = await execFileAsync("ffprobe", ["-version"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  const firstLine = stdout.split(/\r?\n/, 1)[0];
  invariant(/^ffprobe version \S+/.test(firstLine), "unexpected ffprobe version output");
  return firstLine;
}

async function probeAudioFile(file) {
  const {stdout} = await execFileAsync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "a:0",
      "-show_entries",
      "stream=codec_name,sample_rate,channels,channel_layout:format=format_name,duration",
      "-of", "json",
      file,
    ],
    {encoding: "utf8", maxBuffer: 4 * 1024 * 1024},
  );
  const document = JSON.parse(stdout);
  const stream = document?.streams?.[0];
  const durationSeconds = Number(document?.format?.duration);
  invariant(stream?.codec_name === "mp3", `${file}: expected MP3 audio stream`);
  invariant(Number.isFinite(durationSeconds) && durationSeconds > 0, `${file}: invalid decoded duration`);
  invariant(Number(stream.sample_rate) > 0, `${file}: invalid sample rate`);
  invariant(Number.isSafeInteger(stream.channels) && stream.channels > 0, `${file}: invalid channel count`);
  return {
    codec: stream.codec_name,
    container: document.format.format_name,
    sampleRateHz: Number(stream.sample_rate),
    channels: stream.channels,
    channelLayout: stream.channel_layout || null,
    decodedDurationMs: Math.round(durationSeconds * 1000),
  };
}

function validateCandidateReport(document) {
  invariant(
    document?.schemaVersion === 1 &&
      document?.releaseId === "lesson-g05-l04-number-lines" &&
      document?.scope === "54 active lesson-page occurrences; legacy course shell excluded",
    "audio candidate report identity changed",
  );
  invariant(
    document?.summary?.pageCount === EXPECTED_PAGE_COUNT &&
      document?.summary?.runtimeAudioCandidatePageCount === EXPECTED_REVIEWABLE_PAGE_COUNT &&
      document?.summary?.stagedAssetCount === EXPECTED_TRACK_COUNT &&
      document?.summary?.stagedAssetBytes === 21_055_023 &&
      document?.summary?.listeningAcceptedCount === 0 &&
      document?.summary?.ownerAcceptedCount === 0 &&
      document?.summary?.published === false,
    "audio candidate report summary changed",
  );
  invariant(
    document?.introductionCandidate?.outcomes?.length === 2 &&
      document?.normalCandidates?.length === 50 &&
      document?.finalQuiz?.assets?.length === 83 &&
      document?.finalQuiz?.missingPaths?.length === 97,
    "audio candidate report source groups changed",
  );
  invariant(
    Object.values(document.acceptance || {}).every((value) => value === false),
    "audio candidate report crossed an acceptance gate",
  );
}

function selectPages(sourceScope) {
  const pages = (sourceScope?.members || []).filter(
    (member) => member.role === "lesson-page",
  );
  invariant(
    pages.length === EXPECTED_PAGE_COUNT &&
      pages.every((page, index) => page.ordinal === index + 1) &&
      new Set(pages.map((page) => page.animationId)).size === EXPECTED_PAGE_COUNT,
    "G5 L4 page-only source order changed",
  );
  return pages;
}

function trackReviewTemplate() {
  return {
    reviewerIdentity: null,
    reviewerRole: null,
    reviewedAt: null,
    sourceActuallyHeard: null,
    candidateLanguageConfirmed: null,
    audibleContentMatchesVisibleInstruction: null,
    intelligibilityAccepted: null,
    noiseClippingOrTruncationAccepted: null,
    notes: null,
    decision: null,
  };
}

function pageReviewTemplate() {
  return {
    reviewerIdentity: null,
    reviewerRole: null,
    reviewedAt: null,
    currentJsTriggerAccepted: null,
    currentJsStartStopAccepted: null,
    currentJsSynchronizationAccepted: null,
    replayAccepted: null,
    pageChangeCleanupAccepted: null,
    volumeAccepted: null,
    reducedMotionFallbackAccepted: null,
    notes: null,
    decision: null,
  };
}

function assertAcceptanceEnvelope(value) {
  invariant(
    value && JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...ACCEPTANCE_KEYS].sort()),
    "acceptanceEffects keys changed",
  );
  invariant(
    value.machineAudioIdentityVerified === true &&
      ACCEPTANCE_KEYS.slice(1).every((key) => value[key] === false),
    "acceptanceEffects crossed the machine-only boundary",
  );
}

function exactTemplateKeys(template, expected, label) {
  invariant(
    JSON.stringify(Object.keys(template).sort()) === JSON.stringify([...expected].sort()),
    `${label}: key set changed`,
  );
  invariant(Object.values(template).every((value) => value === null), `${label}: must remain unsigned`);
}

export function validateListeningReview(report) {
  invariant(report?.schemaVersion === 1, "listening review schema changed");
  invariant(
    report?.artifactType === "g5-l4-current-js-audio-listening-review" &&
      report?.reviewId === "g5-l4-current-js-audio-listening-review-v1" &&
      report?.releaseId === "lesson-g05-l04-number-lines" &&
      report?.status === "unsigned-pending-human-listening-and-sync-review" &&
      report?.authority === "machine-preflight-and-unsigned-human-review-template",
    "listening review identity changed",
  );
  invariant(
    report?.summary?.pageCount === EXPECTED_PAGE_COUNT &&
      report?.summary?.reviewablePageCount === EXPECTED_REVIEWABLE_PAGE_COUNT &&
      report?.summary?.blockedPageCount === 1 &&
      report?.summary?.uniqueTrackCount === EXPECTED_TRACK_COUNT &&
      report?.summary?.trackBytes === 21_055_023 &&
      report?.summary?.machineDecodedTrackCount === EXPECTED_TRACK_COUNT &&
      report?.summary?.machineDecodeFailureCount === 0 &&
      report?.summary?.englishCandidateTrackCount === 93 &&
      report?.summary?.spanishCandidateTrackCount === 92 &&
      report?.summary?.humanReviewedTrackCount === 0 &&
      report?.summary?.humanReviewedPageCount === 0,
    "listening review summary changed",
  );
  invariant(
    report?.tracks?.length === EXPECTED_TRACK_COUNT &&
      report?.pages?.length === EXPECTED_PAGE_COUNT &&
      new Set(report.tracks.map((track) => track.id)).size === EXPECTED_TRACK_COUNT &&
      new Set(report.tracks.map((track) => track.outputPath)).size === EXPECTED_TRACK_COUNT &&
      new Set(report.tracks.map((track) => track.sha256)).size === EXPECTED_TRACK_COUNT,
    "listening review tracks are not one-to-one",
  );
  invariant(
    report.tracks.filter((track) => track.kind === "embedded-main-timeline").length === 50 &&
      report.tracks.filter((track) => track.kind === "spanish-host-narration").length === 50 &&
      report.tracks.filter((track) => track.kind === "ir-seeded-outcome").length === 2 &&
      report.tracks.filter((track) => track.kind === "fq-interactive-question").length === 15 &&
      report.tracks.filter((track) => track.kind === "fq-interactive-answer").length === 68,
    "listening review track-kind distribution changed",
  );
  for (const track of report.tracks) {
    invariant(
      /^[a-f0-9]{64}$/.test(track.sha256) && track.bytes > 0 &&
        track.machineProbe?.codec === "mp3" &&
        track.machineProbe?.decodedDurationMs > 0 &&
        track.spokenLanguageEstablished === false &&
        track.humanListeningAccepted === false,
      `${track.id}: invalid machine/listening boundary`,
    );
    exactTemplateKeys(
      track.reviewTemplate,
      [
        "reviewerIdentity", "reviewerRole", "reviewedAt", "sourceActuallyHeard",
        "candidateLanguageConfirmed", "audibleContentMatchesVisibleInstruction",
        "intelligibilityAccepted", "noiseClippingOrTruncationAccepted", "notes", "decision",
      ],
      `${track.id}.reviewTemplate`,
    );
  }
  invariant(
    report.pages.filter((page) => page.reviewStatus === "pending-human-current-js-review").length === EXPECTED_REVIEWABLE_PAGE_COUNT &&
      report.pages.filter((page) => page.reviewStatus === "blocked-no-positive-audio-trigger-evidence").length === 1 &&
      report.pages.at(-3)?.animationId === "course-g05-l04-fq-001" &&
      report.pages.at(-2)?.animationId === "course-g05-l04-fq-002" &&
      report.pages.at(-1)?.animationId === "course-g05-l04-fq-003",
    "listening review page disposition changed",
  );
  for (const page of report.pages.filter((page) => page.reviewStatus === "pending-human-current-js-review")) {
    exactTemplateKeys(
      page.reviewTemplate,
      [
        "reviewerIdentity", "reviewerRole", "reviewedAt", "currentJsTriggerAccepted",
        "currentJsStartStopAccepted", "currentJsSynchronizationAccepted", "replayAccepted",
        "pageChangeCleanupAccepted", "volumeAccepted", "reducedMotionFallbackAccepted",
        "notes", "decision",
      ],
      `${page.animationId}.reviewTemplate`,
    );
  }
  invariant(
    report?.originalRuntimeGate?.naturalListeningSessionCount === 0 &&
      report?.originalRuntimeGate?.synchronizationComparisonCount === 0 &&
      report?.originalRuntimeGate?.status === "blocked-not-provided-by-this-packet" &&
      report?.ownerGate?.decision === null &&
      report?.ownerGate?.accepted === false &&
      report?.publicationGate?.audioEnvironmentEnabled === false &&
      report?.publicationGate?.published === false,
    "listening review protected gates changed",
  );
  assertAcceptanceEnvelope(report.acceptanceEffects);
  return true;
}

function sourcePageById(pages) {
  return new Map(pages.map((page) => [page.animationId, page]));
}

function stagedAssetByPath(audioReport) {
  return new Map(audioReport.stagedAssets.map((asset) => [asset.path, asset]));
}

async function attachPhysicalAndProbe(projectRoot, track, assetIndex) {
  const staged = assetIndex.get(track.outputPath);
  invariant(staged, `${track.id}: output is not in stagedAssets`);
  invariant(
    staged.bytes === track.bytes && staged.sha256 === track.sha256 && staged.state === "source-exact",
    `${track.id}: staged-asset identity changed`,
  );
  const physical = await readOrdinaryFile(projectRoot, track.outputPath, track.id);
  invariant(
    physical.size === track.bytes && physical.sha256 === track.sha256,
    `${track.id}: committed route-served bytes changed`,
  );
  const machineProbe = await probeAudioFile(physical.absolute);
  return {
    ...track,
    machineProbe: {
      ...machineProbe,
      sourceExpectedDurationMs: track.sourceExpectedDurationMs,
      decodedVsSourceDurationDeltaMs: track.sourceExpectedDurationMs === null
        ? null
        : machineProbe.decodedDurationMs - track.sourceExpectedDurationMs,
      decodePassed: true,
    },
    spokenLanguageEstablished: false,
    humanListeningAccepted: false,
    reviewTemplate: trackReviewTemplate(),
  };
}

export async function buildListeningReview({projectRoot = DEFAULT_PROJECT_ROOT} = {}) {
  const normalizedRoot = path.resolve(projectRoot);
  const generatorRelative = portable(path.relative(normalizedRoot, SCRIPT_PATH));
  const [generator, audioRecord, scopeRecord, runtimeMap, browserSpec, probeVersion] =
    await Promise.all([
      readOrdinaryFile(normalizedRoot, generatorRelative, "generator"),
      readOrdinaryFile(normalizedRoot, AUDIO_CANDIDATE_REPORT, "audio candidate report"),
      readOrdinaryFile(normalizedRoot, SOURCE_SCOPE, "source scope"),
      readOrdinaryFile(normalizedRoot, RUNTIME_MAP, "runtime audio map"),
      readOrdinaryFile(normalizedRoot, BROWSER_SPEC, "audio browser spec"),
      ffprobeVersion(),
    ]);
  const audioReport = JSON.parse(audioRecord.bytes.toString("utf8"));
  const sourceScope = JSON.parse(scopeRecord.bytes.toString("utf8"));
  validateCandidateReport(audioReport);
  const pages = selectPages(sourceScope);
  const pageIndex = sourcePageById(pages);
  const assetIndex = stagedAssetByPath(audioReport);

  const rawTracks = [];
  for (const candidate of audioReport.normalCandidates) {
    const page = pageIndex.get(candidate.animationId);
    invariant(page, `${candidate.animationId}: not in G5 L4 page scope`);
    rawTracks.push({
      id: `${candidate.animationId}-embedded-main-timeline`,
      pageIds: [candidate.animationId],
      kind: "embedded-main-timeline",
      candidateLanguage: "en",
      sourceContainerPath: `${SOURCE_SCOPE}#members[ordinal=${page.ordinal}].source.swf`,
      sourceCueId: candidate.embedded.sourceCueId,
      outputPath: candidate.embedded.outputPath,
      route: candidate.embedded.publicPath,
      bytes: candidate.embedded.bytes,
      sha256: candidate.embedded.sha256,
      activation: "timeline-frame",
      frameDomain: candidate.frameDomain,
      startFrame: candidate.embedded.firstBlockFrame,
      endFrame: candidate.embedded.endFrame,
      sourceExpectedDurationMs: candidate.embedded.durationMs,
      currentJsSynchronizationClaim: "candidate-only",
    });
    rawTracks.push({
      id: `${candidate.animationId}-spanish-host-narration`,
      pageIds: [candidate.animationId],
      kind: "spanish-host-narration",
      candidateLanguage: "es",
      sourceContainerPath: candidate.spanish.sourcePath,
      sourceCueId: null,
      outputPath: candidate.spanish.outputPath,
      route: candidate.spanish.publicPath,
      bytes: candidate.spanish.bytes,
      sha256: candidate.spanish.sha256,
      activation: "user",
      frameDomain: candidate.frameDomain,
      startFrame: null,
      endFrame: null,
      sourceExpectedDurationMs: candidate.spanish.durationMs,
      currentJsSynchronizationClaim: "candidate-pauses-timeline-while-playing",
    });
  }
  const introductionPage = pageIndex.get(audioReport.introductionCandidate.animationId);
  invariant(introductionPage, "IR001 is not in G5 L4 page scope");
  for (const outcome of audioReport.introductionCandidate.outcomes) {
    rawTracks.push({
      id: `${audioReport.introductionCandidate.animationId}-random-audio-outcome-${outcome.outcome}`,
      pageIds: [audioReport.introductionCandidate.animationId],
      kind: "ir-seeded-outcome",
      candidateLanguage: "en",
      sourceContainerPath: `${SOURCE_SCOPE}#members[ordinal=${introductionPage.ordinal}].source.swf`,
      sourceCueId: outcome.sourceCueId,
      outputPath: outcome.outputPath,
      route: outcome.publicPath,
      bytes: outcome.bytes,
      sha256: outcome.sha256,
      activation: "timeline-frame-seed-modulo",
      frameDomain: audioReport.introductionCandidate.frameDomain,
      startFrame: audioReport.introductionCandidate.playbackRequestFrame,
      endFrame: null,
      sourceExpectedDurationMs: outcome.durationMs,
      currentJsSynchronizationClaim: "seeded-projection-candidate-only",
    });
  }
  for (const asset of audioReport.finalQuiz.assets) {
    rawTracks.push({
      id: asset.id,
      pageIds: [...audioReport.finalQuiz.sourceControlOwnerAnimationIds],
      kind: asset.kind === "question"
        ? "fq-interactive-question"
        : "fq-interactive-answer",
      candidateLanguage: asset.language,
      sourceContainerPath: asset.sourcePath,
      sourceCueId: null,
      outputPath: asset.outputPath,
      route: asset.publicPath,
      bytes: asset.bytes,
      sha256: asset.sha256,
      activation: "user-speaker-control",
      frameDomain: null,
      startFrame: null,
      endFrame: null,
      sourceExpectedDurationMs: null,
      currentJsSynchronizationClaim: "interactive-control-candidate-only",
      questionNumber: asset.questionNumber,
      option: asset.option,
    });
  }
  invariant(rawTracks.length === EXPECTED_TRACK_COUNT, "raw review track count changed");
  const tracks = await mapLimit(
    rawTracks,
    8,
    (track) => attachPhysicalAndProbe(normalizedRoot, track, assetIndex),
  );
  invariant(
    tracks.reduce((total, track) => total + track.bytes, 0) === 21_055_023,
    "review track byte total changed",
  );
  const runtimeMapText = runtimeMap.bytes.toString("utf8");
  for (const track of tracks) {
    invariant(runtimeMapText.includes(track.id), `${track.id}: absent from runtime map`);
    invariant(runtimeMapText.includes(track.sha256), `${track.id}: digest absent from runtime map`);
  }

  const trackIdsByPage = new Map();
  for (const track of tracks) {
    for (const pageId of track.pageIds) {
      const values = trackIdsByPage.get(pageId) || [];
      values.push(track.id);
      trackIdsByPage.set(pageId, values);
    }
  }
  const pageRows = pages.map((page) => {
    const isFq1 = page.animationId === audioReport.finalQuiz.unresolvedOwnerAnimationId;
    const isFq2 = page.animationId === "course-g05-l04-fq-002";
    const isFq3 = page.animationId === "course-g05-l04-fq-003";
    const isIr = page.animationId === audioReport.introductionCandidate.animationId;
    const trackIds = trackIdsByPage.get(page.animationId) || [];
    if (isFq1) {
      invariant(trackIds.length === 0, "FQ001 unexpectedly received a review track");
      return {
        ordinal: page.ordinal,
        animationId: page.animationId,
        section: page.section,
        titleEnglish: page.title.english,
        protocolId: "fq-no-positive-trigger",
        trackSelection: {kind: "none", trackCount: 0, trackIds: []},
        reviewStatus: "blocked-no-positive-audio-trigger-evidence",
        blocker:
          "Obtain source-bound natural original-runtime trigger evidence or a valid accepted-not-required decision; do not invent audio.",
        reviewTemplate: null,
      };
    }
    const sharedFq = isFq2 || isFq3;
    invariant(
      sharedFq ? trackIds.length === 83 : isIr ? trackIds.length === 2 : trackIds.length === 2,
      `${page.animationId}: unexpected review track selection`,
    );
    return {
      ordinal: page.ordinal,
      animationId: page.animationId,
      section: page.section,
      titleEnglish: page.title.english,
      protocolId: isFq2
        ? "fq-random-interactive"
        : isFq3
          ? "fq-sequential-interactive"
          : isIr
            ? "ir-seeded-current-js"
            : "ordinary-bilingual-current-js",
      trackSelection: sharedFq
        ? {kind: "shared-pool", poolId: "g5-l4-fq-interactive-assets", trackCount: 83}
        : {kind: "exact-list", trackCount: trackIds.length, trackIds},
      reviewStatus: "pending-human-current-js-review",
      blocker: null,
      reviewTemplate: pageReviewTemplate(),
    };
  });

  const countTracks = (predicate) => tracks.filter(predicate).length;
  const report = {
    schemaVersion: 1,
    artifactType: "g5-l4-current-js-audio-listening-review",
    reviewId: "g5-l4-current-js-audio-listening-review-v1",
    releaseId: "lesson-g05-l04-number-lines",
    status: "unsigned-pending-human-listening-and-sync-review",
    authority: "machine-preflight-and-unsigned-human-review-template",
    authorityBoundary:
      "The machine preflight verifies the 185 committed MP3 identities and decodability. The empty templates prepare, but do not perform, named-human current-JS listening or synchronization review. This packet contains no authoritative original-runtime listening session, human decision, Owner decision, strict completion, release, or publication authority.",
    generator: descriptor(generator, "scripts/build-g5-l4-current-js-audio-listening-review.mjs"),
    sourceBindings: {
      currentAudioCandidateReport: descriptor(audioRecord),
      pageOnlySourceScope: descriptor(scopeRecord),
      runtimeAudioMap: descriptor(runtimeMap),
      browserAudioRegression: descriptor(browserSpec),
    },
    machineProbe: {
      tool: "ffprobe",
      version: probeVersion,
      concurrency: 8,
      trackCount: tracks.length,
      decodeFailureCount: 0,
      acceptanceEffect: "machine-identity-and-decode-only",
    },
    summary: {
      pageCount: pageRows.length,
      reviewablePageCount: pageRows.filter((page) => page.reviewTemplate !== null).length,
      blockedPageCount: pageRows.filter((page) => page.reviewTemplate === null).length,
      uniqueTrackCount: tracks.length,
      trackBytes: tracks.reduce((total, track) => total + track.bytes, 0),
      machineDecodedTrackCount: tracks.length,
      machineDecodeFailureCount: 0,
      englishCandidateTrackCount: countTracks((track) => track.candidateLanguage === "en"),
      spanishCandidateTrackCount: countTracks((track) => track.candidateLanguage === "es"),
      embeddedMainTimelineTrackCount: countTracks((track) => track.kind === "embedded-main-timeline"),
      spanishHostTrackCount: countTracks((track) => track.kind === "spanish-host-narration"),
      irSeededOutcomeTrackCount: countTracks((track) => track.kind === "ir-seeded-outcome"),
      fqInteractiveTrackCount: countTracks((track) => track.kind.startsWith("fq-interactive-")),
      humanReviewedTrackCount: 0,
      humanReviewedPageCount: 0,
      listeningAcceptedPageCount: 0,
      ownerAcceptedPageCount: 0,
      publishedPageCount: 0,
    },
    reviewProtocols: [
      {
        protocolId: "ordinary-bilingual-current-js",
        pageCount: 50,
        instructions: [
          "In a controlled gate-on candidate built from the exact commit, open the page in English, Replay, and confirm the exact embedded track starts at the declared frame without overlap or restart.",
          "Use Stop, Replay, Pause/Resume, page change, volume, autoplay-recovery, and reduced-motion fallback; record every audible or state mismatch.",
          "Switch to Spanish, use the visible audio control, confirm the candidate language and instructional content, and verify that the timeline pauses only while the track sounds.",
        ],
      },
      {
        protocolId: "ir-seeded-current-js",
        pageCount: 1,
        instructions: [
          "Review both exact embedded outcomes independently by their track IDs.",
          "Review the current fixed-seed page behavior separately; do not label deterministic current-JS projection as AVM1 random parity.",
          "Check Replay and cleanup, then retain original-runtime random selection as a separate blocked comparison.",
        ],
      },
      {
        protocolId: "fq-random-interactive",
        pageCount: 1,
        instructions: [
          "For FQ002, traverse enough fresh sessions to exercise every available question and answer speaker in the shared 83-track pool.",
          "Confirm every enabled button plays only its displayed question or A-D answer; confirm missing paths remain disabled.",
          "Check Stop, ended cleanup, rapid replay, page change, language switch, volume, and Replay without claiming original random parity.",
        ],
      },
      {
        protocolId: "fq-sequential-interactive",
        pageCount: 1,
        instructions: [
          "For FQ003, traverse all 18 questions in sequence and exercise every available question and answer speaker in the shared 83-track pool.",
          "Confirm every enabled button maps to the displayed question/answer and every missing path remains disabled.",
          "Check Stop, ended cleanup, rapid replay, page change, language switch, volume, answer review, and lesson Replay.",
        ],
      },
      {
        protocolId: "fq-no-positive-trigger",
        pageCount: 1,
        instructions: [
          "Do not perform a fabricated current-JS listening review. First obtain a source-bound natural original-runtime trigger or a valid accepted-not-required decision.",
        ],
      },
    ],
    trackPools: [
      {
        poolId: "g5-l4-fq-interactive-assets",
        ownerPageIds: [...audioReport.finalQuiz.sourceControlOwnerAnimationIds],
        trackIds: tracks
          .filter((track) => track.kind.startsWith("fq-interactive-"))
          .map((track) => track.id),
        presentTrackCount: 83,
        expectedTrackCount: 180,
        missingTrackCount: 97,
        complete: false,
      },
    ],
    pages: pageRows,
    tracks,
    humanRecordTemplate: {
      recordStatus: "unsigned-template-do-not-fill-this-generated-file",
      reviewerIdentity: null,
      reviewerRole: null,
      reviewedAt: null,
      exactCommitSha256: null,
      browserAndRuntimeIdentity: null,
      orderedOperationLogDescriptor: null,
      trackDecisionRecordDescriptor: null,
      pageDecisionRecordDescriptor: null,
      overallDecision: null,
      previousRecord: null,
      requiredTrackDecisionCount: EXPECTED_TRACK_COUNT,
      requiredPageDecisionCount: EXPECTED_REVIEWABLE_PAGE_COUNT,
      instructions:
        "Create a separate append-only record outside this generated packet. A named reviewer must actually listen; automation may not fill or sign it.",
    },
    originalRuntimeGate: {
      status: "blocked-not-provided-by-this-packet",
      naturalListeningSessionCount: 0,
      synchronizationComparisonCount: 0,
      irRandomParityEstablished: false,
      fq1AudioDispositionEstablished: false,
    },
    ownerGate: {
      accepted: false,
      reviewerIdentity: null,
      reviewedAt: null,
      decision: null,
      recordDescriptor: null,
    },
    publicationGate: {
      audioEnvironmentEnabled: false,
      candidateDeployed: false,
      productionDeployed: false,
      published: false,
    },
    acceptanceEffects: Object.fromEntries(
      ACCEPTANCE_KEYS.map((key, index) => [key, index === 0]),
    ),
  };
  validateListeningReview(report);
  return report;
}

function markdownFor(report) {
  const pageRows = report.pages.map((page) =>
    `| ${page.ordinal} | ${page.animationId} | ${page.section} | ${page.protocolId} | ${page.trackSelection.trackCount} | ${page.reviewStatus} |`,
  );
  const trackRows = report.tracks.map((track) =>
    `| ${track.id} | ${track.candidateLanguage} | ${track.kind} | ${track.machineProbe.decodedDurationMs} | ${track.machineProbe.sampleRateHz} | ${track.machineProbe.channels} | ${track.bytes} | \`${track.sha256}\` |`,
  );
  const protocols = report.reviewProtocols.map((protocol) =>
    `### ${protocol.protocolId}\n\nPages: **${protocol.pageCount}**.\n\n${protocol.instructions.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n`,
  );
  return `# G5 L4 current-JS audio listening and synchronization review v1\n\n` +
    `Status: **${report.status}**. This generated file is not a human or Owner decision.\n\n` +
    `## Machine preflight\n\n` +
    `- Pages: **${report.summary.pageCount}**; reviewable: **${report.summary.reviewablePageCount}**; blocked: **${report.summary.blockedPageCount}**.\n` +
    `- Exact MP3 tracks decoded: **${report.summary.machineDecodedTrackCount}/${report.summary.uniqueTrackCount}**; failures: **${report.summary.machineDecodeFailureCount}**.\n` +
    `- Bytes: **${report.summary.trackBytes}**.\n` +
    `- Candidate languages EN/ES: **${report.summary.englishCandidateTrackCount}/${report.summary.spanishCandidateTrackCount}**. Spoken language remains unestablished until a person listens.\n` +
    `- Human-reviewed tracks/pages: **0/185** and **0/53**.\n` +
    `- FQ001 remains blocked because no positive audio trigger is established.\n` +
    `- FQ shared pool remains **83/180**, with 97 missing paths.\n\n` +
    `The machine probe used \`${report.machineProbe.version}\`. It proves only exact identity and decodability, not audible correctness or synchronization.\n\n` +
    `## Controlled review surface\n\n` +
    `Use a candidate built from the exact reviewed commit with both G5 animation and the independent G5 audio gate enabled. Do not enable production. Open the loopback course route \`/courses/5/4?mode=focus\` and execute the protocol for every page below. Store reviewer identity, time, exact build/runtime identity, ordered operations, cue/page decisions, and notes in a separate append-only record.\n\n` +
    `## Protocols\n\n${protocols.join("\n")}\n` +
    `## Page matrix\n\n` +
    `| Ordinal | Animation ID | Section | Protocol | Tracks | Status |\n` +
    `|---:|---|---|---|---:|---|\n${pageRows.join("\n")}\n\n` +
    `## Unique track matrix\n\n` +
    `| Track ID | Candidate lang | Kind | Decoded ms | Hz | Channels | Bytes | SHA-256 |\n` +
    `|---|---|---|---:|---:|---:|---:|---|\n${trackRows.join("\n")}\n\n` +
    `## Protected boundary\n\n` +
    `Current-JS listening/synchronization, natural original-runtime reachability/synchronization, human listening acceptance, Owner acceptance, strict completion, release, production deployment, and publication all remain **false**.\n`;
}

async function writeAtomic(projectRoot, relativePath, bytes) {
  const absolute = resolveContained(projectRoot, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  const existing = await readFile(absolute).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (existing?.equals(bytes)) return;
  if (existing && relativePath.endsWith(".json")) {
    invariant(
      JSON.parse(existing.toString("utf8"))?.artifactType ===
        "g5-l4-current-js-audio-listening-review",
      `${relativePath}: refusing to replace an unmanaged file`,
    );
  }
  const temporary = `${absolute}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, bytes, {flag: "wx", mode: 0o644});
    await rename(temporary, absolute);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}

export async function writeOrCheckListeningReview({
  projectRoot = DEFAULT_PROJECT_ROOT,
  check = true,
} = {}) {
  const report = await buildListeningReview({projectRoot});
  const outputs = [
    {path: REPORT_JSON, bytes: Buffer.from(stableJson(report))},
    {path: REPORT_MARKDOWN, bytes: Buffer.from(markdownFor(report))},
  ];
  if (check) {
    for (const output of outputs) {
      const actual = await readFile(resolveContained(projectRoot, output.path));
      invariant(actual.equals(output.bytes), `${output.path}: generated output is stale`);
    }
  } else {
    for (const output of outputs) await writeAtomic(projectRoot, output.path, output.bytes);
  }
  return report;
}

export function parseArguments(argv) {
  let check = true;
  let explicitMode = false;
  for (const argument of argv) {
    if (argument === "--check" || argument === "--write") {
      invariant(!explicitMode, "choose exactly one mode");
      explicitMode = true;
      check = argument === "--check";
    } else if (argument === "--help") {
      return {help: true, check};
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return {help: false, check};
}

function usage() {
  return `Usage: node scripts/build-g5-l4-current-js-audio-listening-review.mjs [--check|--write]\n\nDefault mode is --check. The command probes committed MP3 files and generates an unsigned review packet. It cannot fill a reviewer identity, accept audio, authorize original-runtime claims, deploy, or publish.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(`${usage()}\n`);
  else {
    await writeOrCheckListeningReview(options);
    process.stdout.write(
      `G5 L4 current-JS audio listening review ${options.check ? "check" : "write"}: 185 decoded tracks; humanReviewed=0\n`,
    );
  }
}
