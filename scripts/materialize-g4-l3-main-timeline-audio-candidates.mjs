#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const REPORT_JSON =
  "reports/g4-l3-current-js-main-timeline-audio-candidates.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-current-js-main-timeline-audio-candidates.md";
const GENERATED_TS =
  "packages/demos/src/g4-l3-main-timeline-audio.generated.ts";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

const SOURCE_BINDINGS = Object.freeze([
  "catalog/lesson-release-ledger.json",
  "reports/g4-l3-embedded-audio-archive.json",
  "reports/g4-l3-audio-cas-media-probe.json",
  "reports/g4-l3-catalog-audio-media-probe.json",
]);

const EXPECTED_ELIGIBLE_IDS = Object.freeze([
  "course-g04-l03-rw-002",
  "course-g04-l03-rw-003",
  "course-g04-l03-rw-004",
  "course-g04-l03-vb-002",
  "course-g04-l03-vb-003",
  "course-g04-l03-vb-004",
  "course-g04-l03-vb-005",
  "course-g04-l03-vb-006",
  "course-g04-l03-vb-007",
  "course-g04-l03-vb-008",
  "course-g04-l03-vb-009",
  "course-g04-l03-in-002",
  "course-g04-l03-in-003",
  "course-g04-l03-in-004",
  "course-g04-l03-in-005",
  "course-g04-l03-in-006",
  "course-g04-l03-in-007",
  "course-g04-l03-in-008",
  "course-g04-l03-in-009",
  "course-g04-l03-in-010",
  "course-g04-l03-in-011",
  "course-g04-l03-in-012",
  "course-g04-l03-ti-002",
  "course-g04-l03-ti-004",
  "course-g04-l03-ti-005",
  "course-g04-l03-ti-006",
  "course-g04-l03-gs-002",
  "course-g04-l03-ts-002",
  "course-g04-l03-ts-003",
  "course-g04-l03-ts-004",
  "course-g04-l03-ts-005",
  "course-g04-l03-ts-006",
  "course-g04-l03-ts-007",
  "course-g04-l03-ts-008",
]);

const SPECIALIZED_IDS = new Set([
  "course-g04-l03-rw-002",
  "course-g04-l03-rw-003",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveInside(root, relativePath, label) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath) &&
      path.posix.normalize(relativePath) === relativePath &&
      !relativePath.includes("\\") &&
      !relativePath.split("/").includes(".."),
    `${label} must be a normalized project-relative path`,
  );
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  invariant(
    relative &&
      !path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`),
    `${label} escapes the project root`,
  );
  return absolute;
}

async function readBinding(root, relativePath, expected = null) {
  const absolute = resolveInside(root, relativePath, relativePath);
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  let before;
  let contents;
  let after;
  try {
    before = await handle.stat();
    invariant(before.isFile(), `${relativePath} must be a regular file`);
    contents = await handle.readFile();
    after = await handle.stat();
  } finally {
    await handle.close();
  }
  const atPath = await lstat(absolute);
  invariant(
    atPath.isFile() &&
      !atPath.isSymbolicLink() &&
      before.dev === after.dev &&
      before.ino === after.ino &&
      before.dev === atPath.dev &&
      before.ino === atPath.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
    `${relativePath} changed while reading`,
  );
  const result = {
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
  if (expected) {
    invariant(
      result.bytes === expected.bytes && result.sha256 === expected.sha256,
      `${relativePath} differs from its exact-byte source binding`,
    );
  }
  return result;
}

function mediaDurationMs(probe, label) {
  invariant(
    probe?.probe?.status === "ffprobe-parsed-ffmpeg-decode-check-passed" &&
      probe.probe.ffmpegDecodeToNull?.decodeCheckPassed === true &&
      Number.isFinite(probe.probe.media?.timing?.durationSeconds) &&
      probe.probe.media.timing.durationSeconds > 0,
    `${label}: media probe did not pass`,
  );
  return Math.round(probe.probe.media.timing.durationSeconds * 1_000);
}

function exactIdSet(ids, expected, label) {
  invariant(
    JSON.stringify([...ids].sort()) === JSON.stringify([...expected].sort()),
    `${label} changed`,
  );
}

export function deriveG4L3MainTimelineAudioCandidates({
  release,
  migrations,
  embeddedArchive,
  embeddedProbe,
  catalogProbe,
}) {
  invariant(
    release?.releaseId === RELEASE_ID &&
      release.expectedMemberCount === 40 &&
      Array.isArray(release.members),
    "G4 L3 release identity changed",
  );
  const catalogByPath = new Map(
    catalogProbe.probes.map((entry) => [entry.source.path, entry]),
  );
  const embeddedProbeById = new Map(
    embeddedProbe.itemReferences.map((entry) => [entry.animationId, entry]),
  );
  const embeddedById = new Map(
    embeddedArchive.items.map((entry) => [entry.animationId, entry]),
  );
  const candidates = [];
  const exclusions = [];
  for (const member of release.members) {
    const animationId = member.animationId;
    if (!animationId.startsWith("course-g04-l03-")) {
      exclusions.push({
        animationId,
        reason: "lesson-shell-has-complex-multi-domain-audio",
      });
      continue;
    }
    const migration = migrations.get(animationId);
    invariant(
      migration?.catalogEvidence?.animationId === animationId,
      `${animationId}: migration workspace binding is missing`,
    );
    const defaultFrameDomainId = migration.implementation?.defaultFrameDomainId;
    const streams =
      embeddedById.get(animationId)?.embeddedAudio?.soundStreams ?? [];
    const associations = migration.audio?.catalogExactAssociations ?? [];
    const probeUnits = embeddedProbeById.get(animationId)?.units ?? [];
    const defaultDomainStreams = streams.filter(
      (stream) =>
        stream.ownerDomainId === defaultFrameDomainId &&
        stream.blockCount > 0,
    );
    const structurallyEligible =
      defaultDomainStreams.length === 1 &&
      defaultDomainStreams[0].head?.format === "mp3" &&
      defaultDomainStreams[0].payload?.physicalHashVerified === true &&
      associations.length === 1;
    if (!structurallyEligible) {
      exclusions.push({
        animationId,
        reason:
          streams.length === 0
            ? "no-embedded-audio"
            : defaultDomainStreams.length === 0
              ? "no-nonempty-default-domain-embedded-audio"
              : defaultDomainStreams.length > 1
                ? "multiple-default-domain-embedded-audio"
                : associations.length !== 1
                  ? "associated-audio-is-not-one-exact-match"
                  : "unsupported-or-unverified-audio-source",
        embeddedStreamCount: streams.length,
        nonemptyDefaultDomainStreamCount: defaultDomainStreams.length,
        associatedExactMatchCount: associations.length,
      });
      continue;
    }
    const stream = defaultDomainStreams[0];
    invariant(
      Array.isArray(stream.blocks) &&
        stream.blocks.length === stream.blockCount &&
        stream.blocks.length > 0,
      `${animationId}: embedded stream block inventory is invalid`,
    );
    const firstBlockFrame = stream.blocks[0].localFrame;
    const lastBlockFrame = stream.blocks.at(-1).localFrame;
    invariant(
      Number.isSafeInteger(firstBlockFrame) &&
        Number.isSafeInteger(lastBlockFrame) &&
        firstBlockFrame >= 1 &&
        lastBlockFrame >= firstBlockFrame &&
        stream.blocks.every(
          (block, index) =>
            index === 0 ||
            block.localFrame >= stream.blocks[index - 1].localFrame,
        ),
      `${animationId}: embedded stream frame order is invalid`,
    );
    const domain = migration.implementation.frameDomains.find(
      ({id}) => id === defaultFrameDomainId,
    );
    invariant(
      domain &&
        migration.runtime?.fps === 12 &&
        Number.isSafeInteger(domain.frameCount) &&
        lastBlockFrame <= domain.frameCount &&
        Array.isArray(domain.scenarioIds) &&
        domain.scenarioIds.length === 1 &&
        typeof domain.scenarioIds[0] === "string" &&
        domain.scenarioIds[0].length > 0,
      `${animationId}: audio frame range exceeds its declared frame domain`,
    );
    const unit = probeUnits.find(
      (entry) =>
        entry.unitKind === "SoundStream" &&
        entry.streamIndex === stream.streamIndex,
    );
    invariant(
      unit?.technicalProbe?.probeStatus ===
        "ffprobe-parsed-ffmpeg-decode-check-passed" &&
        unit.technicalProbe.ffmpegDecodeCheckPassed === true &&
        unit.payload.sha256 === stream.payload.sha256 &&
        unit.payload.byteLength === stream.payload.byteLength,
      `${animationId}: embedded media probe or payload binding is invalid`,
    );
    const association = associations[0];
    const spanishProbe = catalogByPath.get(association.sourceFile);
    invariant(
      spanishProbe?.source?.sha256 === association.sha256 &&
        spanishProbe.source.bytes === association.bytes &&
        spanishProbe.source.normalizedLanguageCandidate === "es" &&
        spanishProbe.source.physicalHashVerifiedBeforeProbe === true &&
        spanishProbe.source.physicalHashVerifiedAfterProbe === true &&
        spanishProbe.source.unchangedByProbe === true,
      `${animationId}: associated Spanish candidate binding is invalid`,
    );
    const publicPrefix =
      `public/flash-assets/courses/${animationId}/audio/`;
    candidates.push({
      animationId,
      integration:
        SPECIALIZED_IDS.has(animationId)
          ? "specialized-module-already-wired"
          : animationId === "course-g04-l03-ts-006"
            ? "specialized-module-generated-english-cue"
            : "shared-source-static-module-generated",
      frameDomain: defaultFrameDomainId,
      scenario: domain.scenarioIds[0],
      fps: migration.runtime.fps,
      sourceEmbeddedStreamCount: streams.length,
      excludedCompanionStreamCount:
        streams.filter(
          (candidate) =>
            candidate.ownerDomainId !== defaultFrameDomainId &&
            candidate.blockCount > 0,
        ).length,
      embedded: {
        sourcePath: stream.payload.archivePath,
        outputPath: `${publicPrefix}embedded-stream-0001.mp3`,
        publicPath:
          `/flash-assets/courses/${animationId}/audio/embedded-stream-0001.mp3`,
        bytes: stream.payload.byteLength,
        sha256: stream.payload.sha256,
        headFrame: stream.headLocalFrame,
        firstBlockFrame,
        lastBlockFrame,
        endFrame: lastBlockFrame + 1,
        blockCount: stream.blockCount,
        durationMs: Math.round(unit.technicalProbe.durationSeconds * 1_000),
        spokenLanguage: "undetermined",
      },
      spanish: {
        sourcePath: association.sourceFile,
        outputPath: `${publicPrefix}spanish-host-narration.mp3`,
        publicPath:
          `/flash-assets/courses/${animationId}/audio/spanish-host-narration.mp3`,
        bytes: association.bytes,
        sha256: association.sha256,
        durationMs: mediaDurationMs(
          spanishProbe,
          `${animationId}: associated Spanish audio`,
        ),
        normalizedLanguageCandidate: "es",
        spokenLanguageEstablished: false,
      },
      authority: {
        exactSourceBytesPreserved: true,
        transcoded: false,
        sourceFrameMappingStructuralOnly: true,
        languageEstablished: false,
        naturalRuntimeReachabilityEstablished: false,
        originalRuntimeSynchronizationEstablished: false,
        listeningAcceptanceEstablished: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
        lessonPublished: false,
        strictAcceptanceEffect: "none",
      },
    });
  }
  candidates.sort((left, right) =>
    left.animationId.localeCompare(right.animationId),
  );
  exclusions.sort((left, right) =>
    left.animationId.localeCompare(right.animationId),
  );
  exactIdSet(
    candidates.map(({animationId}) => animationId),
    EXPECTED_ELIGIBLE_IDS,
    "eligible single-main-timeline audio set",
  );
  return {candidates, exclusions};
}

function tsLiteral(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll('"', "'")
    .replaceAll(/'([^']+)':/gu, "$1:");
}

function generatedTypeScript(candidates) {
  const integrated = candidates.filter(
    ({integration}) => integration !== "specialized-module-already-wired",
  );
  const entries = integrated.map((candidate) => {
    const cue = {
      id: `${candidate.animationId}-embedded-stream-0001`,
      sourceCueId: "embedded-stream-0001",
      frame: candidate.embedded.firstBlockFrame,
      endFrame: candidate.embedded.endFrame,
      frameDomain: candidate.frameDomain,
      language: "en",
      scenario: candidate.scenario,
      source: candidate.embedded.publicPath,
      durationMs: candidate.embedded.durationMs,
      sha256: candidate.embedded.sha256,
      spokenLanguage: "undetermined",
    };
    const track = {
      id: `${candidate.animationId}-spanish-host-narration`,
      language: "es",
      label: "Audio en español",
      source: candidate.spanish.publicPath,
      durationMs: candidate.spanish.durationMs,
      sha256: candidate.spanish.sha256,
      activation: "user",
      visibleWhen: ["es"],
      frameDomains: [candidate.frameDomain],
      timelineBehavior: "pause-while-playing",
    };
    return `  '${candidate.animationId}': Object.freeze({\n` +
      `    audioCues: Object.freeze([Object.freeze(${tsLiteral(cue)} as const)]),\n` +
      `    audioTracks: Object.freeze([Object.freeze(${tsLiteral(track)} as const)]),\n` +
      `  }),`;
  });
  return `/* Generated by scripts/materialize-g4-l3-main-timeline-audio-candidates.mjs. Do not edit. */\n` +
    `import type {AudioCue, AudioTrack} from './contract';\n\n` +
    `export interface G4L3MainTimelineAudioCandidate {\n` +
    `  readonly audioCues: readonly AudioCue[];\n` +
    `  readonly audioTracks: readonly AudioTrack[];\n` +
    `}\n\n` +
    `export const G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES: Readonly<Record<string, G4L3MainTimelineAudioCandidate>> = Object.freeze({\n` +
    `${entries.join("\n")}\n` +
    `});\n\n` +
    `export function getG4L3MainTimelineAudioCandidate(animationId: string): G4L3MainTimelineAudioCandidate | undefined {\n` +
    `  return G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[animationId];\n` +
    `}\n`;
}

function reportMarkdown(report) {
  const rows = report.candidates
    .map(
      (entry) =>
        `| \`${entry.animationId}\` | \`${entry.frameDomain}\` | ${entry.embedded.firstBlockFrame}–${entry.embedded.lastBlockFrame} | ${entry.embedded.durationMs} | ${entry.spanish.durationMs} | ${entry.integration} |`,
    )
    .join("\n");
  return `# G4 L3 current-JavaScript main-timeline audio candidates\n\n` +
    `Exactly ${report.summary.eligibleMemberCount}/40 members have exactly one non-empty MP3 stream owned by the declared default frame domain plus one exact associated Spanish-audio candidate. Other companion-domain streams remain unmapped and disabled. These are current-JavaScript engineering candidates only.\n\n` +
    `| Member | Domain | Source blocks | EN ms | ES ms | Integration |\n` +
    `|---|---|---:|---:|---:|---|\n${rows}\n\n` +
    `The remaining ${report.summary.excludedMemberCount} members are not auto-wired because they have no embedded stream, no unique non-empty stream in the declared default domain, no exact associated Spanish candidate, or the Lesson Shell's complex audio graph. Language, companion-domain cue mapping, authorized original-runtime reachability and synchronization, listening acceptance, human review, owner acceptance, strict completion, and publication remain pending.\n`;
}

async function writeAssetNoReplace(root, candidate, check) {
  const source = await readBinding(root, candidate.sourcePath, candidate);
  const absolute = resolveInside(root, candidate.outputPath, candidate.outputPath);
  try {
    const existing = await readBinding(root, candidate.outputPath, candidate);
    const existingStat = await stat(absolute);
    invariant(
      existingStat.nlink === 1 && (existingStat.mode & 0o777) === 0o444,
      `${candidate.outputPath} immutable output metadata changed`,
    );
    return {...existing, result: "verified-existing"};
  } catch (error) {
    if (error.code !== "ENOENT" || check) throw error;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${candidate.outputPath} output parent is not canonical`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY |
      fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(source.contents);
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directory = await open(path.dirname(absolute), fsConstants.O_RDONLY);
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
  const written = await readBinding(root, candidate.outputPath, candidate);
  const writtenStat = await stat(absolute);
  invariant(
    writtenStat.nlink === 1 && (writtenStat.mode & 0o777) === 0o444,
    `${candidate.outputPath} was not published immutably`,
  );
  return {...written, result: "published-no-replace"};
}

async function emitDerived(root, relativePath, bytes, check) {
  const absolute = resolveInside(root, relativePath, relativePath);
  if (check) {
    invariant(
      (await readFile(absolute)).equals(bytes),
      `${relativePath} is stale`,
    );
    return;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  await writeFile(absolute, bytes);
}

export async function materializeG4L3MainTimelineAudioCandidates({
  root = ROOT,
  check = false,
} = {}) {
  const canonicalRoot = await realpath(root);
  const scriptRelative = portable(path.relative(canonicalRoot, SCRIPT_PATH));
  const [generator, ...sourceBindings] = await Promise.all([
    readBinding(canonicalRoot, scriptRelative),
    ...SOURCE_BINDINGS.map((item) => readBinding(canonicalRoot, item)),
  ]);
  const [releaseLedger, embeddedArchive, embeddedProbe, catalogProbe] =
    sourceBindings.map(({contents}) => JSON.parse(contents));
  const release = releaseLedger.releases.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  const pageMembers = release.members.filter(({animationId}) =>
    animationId.startsWith("course-g04-l03-")
  );
  const migrations = new Map(
    await Promise.all(
      pageMembers.map(async ({animationId}) => [
        animationId,
        JSON.parse(
          (
            await readBinding(
              canonicalRoot,
              `migrations/${animationId}/migration.json`,
            )
          ).contents,
        ),
      ]),
    ),
  );
  const {candidates, exclusions} =
    deriveG4L3MainTimelineAudioCandidates({
      release,
      migrations,
      embeddedArchive,
      embeddedProbe,
      catalogProbe,
    });
  const stagedAssets = [];
  for (const candidate of candidates) {
    stagedAssets.push(
      await writeAssetNoReplace(canonicalRoot, candidate.embedded, check),
    );
    stagedAssets.push(
      await writeAssetNoReplace(canonicalRoot, candidate.spanish, check),
    );
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-current-js-main-timeline-audio-candidates",
    releaseId: RELEASE_ID,
    generator: {
      path: generator.path,
      bytes: generator.bytes,
      sha256: generator.sha256,
    },
    sourceBindings: sourceBindings.map(({path: sourcePath, bytes, sha256: hash}) => ({
      path: sourcePath,
      bytes,
      sha256: hash,
    })),
    authority:
      "Exact-byte audio staging and conservative source-structural main-timeline candidate mapping only",
    authorityBoundary:
      "This report does not establish spoken language, authorized original-runtime reachability or synchronization, listening acceptance, Replay parity, visual parity, human review, owner acceptance, strict completion, or publication.",
    selectionRule: {
      nonemptyDefaultDomainStreamCount: 1,
      embeddedCodec: "mp3",
      exactlyOneNonemptyStreamOwnedByDeclaredDefaultFrameDomain: true,
      otherNondefaultDomainStreamsRemainUnmappedAndDisabled: true,
      associatedAudioExactMatchCount: 1,
      bothMediaProbesMustPass: true,
      complexOrBranchedAudioExcluded: true,
    },
    summary: {
      expectedMemberCount: 40,
      eligibleMemberCount: candidates.length,
      generatedRuntimeCandidateCount: candidates.filter(
        ({integration}) => integration !== "specialized-module-already-wired",
      ).length,
      specializedAlreadyWiredCount: candidates.filter(
        ({integration}) => integration === "specialized-module-already-wired",
      ).length,
      excludedMemberCount: exclusions.length,
      stagedAssetCount: stagedAssets.length,
      exactSourceBytesPreserved: true,
      transcoded: false,
      strictCompleteCount: 0,
      published: false,
    },
    candidates,
    exclusions,
    stagedAssets: stagedAssets.map(
      ({path: outputPath, bytes, sha256: hash}) => ({
        path: outputPath,
        bytes,
        sha256: hash,
        state: "present-exact-immutable",
      }),
    ),
    acceptance: {
      languageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      listeningAccepted: false,
      replayParityAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  const json = Buffer.from(stableJson(report));
  const markdown = Buffer.from(reportMarkdown(report));
  const generated = Buffer.from(generatedTypeScript(candidates));
  await emitDerived(canonicalRoot, REPORT_JSON, json, check);
  await emitDerived(canonicalRoot, REPORT_MARKDOWN, markdown, check);
  await emitDerived(canonicalRoot, GENERATED_TS, generated, check);
  return {
    action: check ? "verified" : "materialized",
    eligibleMemberCount: candidates.length,
    generatedRuntimeCandidateCount:
      report.summary.generatedRuntimeCandidateCount,
    stagedAssetCount: stagedAssets.length,
    report: REPORT_JSON,
    generatedTypeScript: GENERATED_TS,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materializeG4L3MainTimelineAudioCandidates(
    parseArguments(process.argv.slice(2)),
  )
    .then((result) =>
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    )
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
