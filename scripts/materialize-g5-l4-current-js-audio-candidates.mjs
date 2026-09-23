#!/usr/bin/env node

import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  stat,
} from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseEmbeddedAudioPayloads} from "./build-g4-l3-embedded-audio-archive.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l04-number-lines";
const EMBEDDED_AUDIO_HELPER = "scripts/build-g4-l3-embedded-audio-archive.mjs";
const STATIC_REPORT = "reports/g5-l4-audio-static-cue-reconciliation.json";
const REPORT_JSON = "reports/g5-l4-current-js-audio-candidates.json";
const REPORT_MARKDOWN = "reports/g5-l4-current-js-audio-candidates.md";
const GENERATED_DEMOS = "packages/demos/src/g5-l4-audio.generated.ts";
const GENERATED_POLICY = "apps/web/lib/g5-l4-audio-assets.generated.ts";
const SERVER_AUDIO_COURSES_ROOT =
  "apps/web/server-assets/flash-assets/courses";
const FQ_AUDIO_ANIMATION_ID = "course-g05-l04-fq-audio";
const FQ_IDS = Object.freeze([
  "course-g05-l04-fq-001",
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const IR_ID = "course-g05-l04-ir-001-a662633d";
const PAGE_COUNT = 54;
const NORMAL_PAGE_COUNT = 50;
const EXPECTED_FQ_PATH_COUNT = 180;
const EXPECTED_PRESENT_FQ_PATH_COUNT = 83;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function syncSafeInteger(bytes, offset) {
  invariant(
    offset >= 0 && offset + 4 <= bytes.length,
    "ID3 sync-safe integer is truncated",
  );
  const values = [...bytes.subarray(offset, offset + 4)];
  invariant(
    values.every((value) => (value & 0x80) === 0),
    "ID3 sync-safe integer is malformed",
  );
  return values.reduce((value, byte) => (value << 7) | byte, 0);
}

/**
 * Inventories legacy ID3 field names without copying their values into a
 * generated report. The source-exact MP3 bytes remain immutable; this scan
 * exists only to keep embedded metadata behind an explicit release review.
 */
function id3MetadataFieldNames(bytes) {
  if (bytes.length < 10 || bytes.subarray(0, 3).toString("ascii") !== "ID3") {
    return [];
  }
  const majorVersion = bytes[3];
  invariant(
    majorVersion === 3 || majorVersion === 4,
    `unsupported ID3 major version ${majorVersion}`,
  );
  const tagEnd = 10 + syncSafeInteger(bytes, 6);
  invariant(tagEnd <= bytes.length, "ID3 tag extends past the MP3 bytes");
  const fields = new Set();
  let cursor = 10;
  while (cursor + 10 <= tagEnd) {
    const frameId = bytes.subarray(cursor, cursor + 4).toString("ascii");
    if (/^\x00{4}$/u.test(frameId)) break;
    invariant(/^[A-Z0-9]{4}$/u.test(frameId), "ID3 frame id is malformed");
    const frameSize = majorVersion === 4
      ? syncSafeInteger(bytes, cursor + 4)
      : bytes.readUInt32BE(cursor + 4);
    const payloadStart = cursor + 10;
    const payloadEnd = payloadStart + frameSize;
    invariant(
      frameSize > 0 && payloadEnd <= tagEnd,
      `${frameId}: ID3 frame is truncated`,
    );
    if (frameId === "TXXX") {
      const payload = bytes.subarray(payloadStart, payloadEnd);
      invariant(payload[0] === 0, "TXXX description is not Latin-1 encoded");
      const descriptionEnd = payload.indexOf(0, 1);
      invariant(descriptionEnd > 1, "TXXX description is empty or malformed");
      fields.add(payload.subarray(1, descriptionEnd).toString("latin1"));
    } else if (frameId === "TYER" || frameId === "TDRC") {
      fields.add("date");
    } else {
      fields.add(`id3-frame:${frameId}`);
    }
    cursor = payloadEnd;
  }
  return [...fields].sort((left, right) => left.localeCompare(right));
}

function hasReproducibleAssetMode(information) {
  const mode = information.mode & 0o777;
  // Git records these files as ordinary 100644 blobs and does not preserve the
  // owner-write bit. A freshly materialized workspace is 0444; a fresh clone
  // is normally 0644. Both are non-executable and group/world non-writable.
  return mode === 0o444 || mode === 0o644;
}

function resolveInside(root, relativePath, label = relativePath) {
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `${label}: path must be project-relative`,
  );
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  invariant(
    relative &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `${label}: path escapes the project root`,
  );
  return absolute;
}

async function readBinding(root, relativePath, expected = null) {
  const absolute = resolveInside(root, relativePath);
  const before = await lstat(absolute);
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath}: expected a regular non-symlink file`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    before.dev === after.dev &&
      before.ino === after.ino &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
    `${relativePath}: changed while reading`,
  );
  const binding = {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  };
  if (expected) {
    invariant(
      binding.bytes === expected.bytes && binding.sha256 === expected.sha256,
      `${relativePath}: exact source binding changed`,
    );
  }
  return binding;
}

async function assertNoSymlinkAncestors(root, relativePath) {
  const parts = portable(relativePath).split("/");
  let cursor = root;
  for (const part of parts.slice(0, -1)) {
    cursor = path.join(cursor, part);
    const information = await lstat(cursor).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error),
    );
    invariant(!information?.isSymbolicLink(), `${relativePath}: output path contains a symlink ancestor`);
  }
}

async function publishExactAsset(root, source, outputPath, check) {
  const sourceBinding = await readBinding(root, source.path, source);
  const absolute = resolveInside(root, outputPath);
  await assertNoSymlinkAncestors(root, outputPath);
  const existing = await readFile(absolute).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (existing) {
    const information = await lstat(absolute);
    invariant(
        information.isFile() &&
        !information.isSymbolicLink() &&
        information.nlink === 1 &&
        hasReproducibleAssetMode(information) &&
        existing.length === source.bytes &&
        sha256(existing) === source.sha256 &&
        existing.equals(sourceBinding.contents),
      `${outputPath}: existing immutable asset differs from its source binding`,
    );
    return {path: outputPath, bytes: existing.length, sha256: source.sha256, state: "source-exact"};
  }
  invariant(!check, `${outputPath}: immutable asset is missing in check mode`);
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${outputPath}: output parent is not canonical`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(sourceBinding.contents);
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
  const written = await readBinding(root, outputPath, source);
  const information = await stat(absolute);
  invariant(
    information.nlink === 1 && (information.mode & 0o777) === 0o444,
    `${outputPath}: immutable output metadata changed`,
  );
  return {path: outputPath, bytes: written.bytes, sha256: written.sha256, state: "source-exact"};
}

async function publishExtractedAsset(root, bytes, expected, outputPath, check) {
  invariant(
    Buffer.isBuffer(bytes) &&
      bytes.length === expected.bytes &&
      sha256(bytes) === expected.sha256,
    `${outputPath}: extracted payload differs from its exact binding`,
  );
  const absolute = resolveInside(root, outputPath);
  await assertNoSymlinkAncestors(root, outputPath);
  const existing = await readFile(absolute).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (existing) {
    const information = await lstat(absolute);
    invariant(
        information.isFile() &&
        !information.isSymbolicLink() &&
        information.nlink === 1 &&
        hasReproducibleAssetMode(information) &&
        existing.equals(bytes),
      `${outputPath}: existing immutable extracted asset changed`,
    );
    return {path: outputPath, bytes: bytes.length, sha256: expected.sha256, state: "source-exact"};
  }
  invariant(!check, `${outputPath}: immutable extracted asset is missing in check mode`);
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${outputPath}: output parent is not canonical`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NOFOLLOW,
    0o600,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const written = await readFile(absolute);
  const information = await stat(absolute);
  invariant(
    written.equals(bytes) &&
      information.nlink === 1 &&
      (information.mode & 0o777) === 0o444,
    `${outputPath}: extracted asset publication failed closed`,
  );
  return {path: outputPath, bytes: bytes.length, sha256: expected.sha256, state: "source-exact"};
}

async function assertLegacyPublicAssetAbsent(root, serverAssetPath) {
  const legacyPublicPath = serverAssetPath.replace(
    /^apps\/web\/server-assets/u,
    "apps/web/public",
  );
  invariant(
    legacyPublicPath !== serverAssetPath,
    `${serverAssetPath}: server-only asset root changed`,
  );
  try {
    await lstat(resolveInside(root, legacyPublicPath));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return;
    throw error;
  }
  throw new Error(
    `${legacyPublicPath}: legacy public audio copy must be absent`,
  );
}

async function emitDerived(root, relativePath, bytes, check) {
  const absolute = resolveInside(root, relativePath);
  await assertNoSymlinkAncestors(root, relativePath);
  if (check) {
    const information = await lstat(absolute);
    invariant(
      information.isFile() &&
        !information.isSymbolicLink() &&
        information.nlink === 1 &&
        (await readFile(absolute)).equals(bytes),
      `${relativePath}: generated output is stale or unsafe`,
    );
    return;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${relativePath}: output parent is not canonical`,
  );
  const handle = await open(
    absolute,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | NOFOLLOW,
    0o600,
  );
  try {
    const information = await handle.stat();
    invariant(
      information.isFile() && information.nlink === 1,
      `${relativePath}: generated output target is unsafe`,
    );
    await handle.truncate(0);
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(0o644);
  } finally {
    await handle.close();
  }
  const [written, information] = await Promise.all([
    readFile(absolute),
    lstat(absolute),
  ]);
  invariant(
    written.equals(bytes) &&
      information.isFile() &&
      !information.isSymbolicLink() &&
      information.nlink === 1,
    `${relativePath}: generated output publication failed closed`,
  );
}

function migrationScenario(migration, animationId) {
  const domainId = migration.implementation?.defaultFrameDomainId;
  const domain = migration.implementation?.frameDomains?.find(({id}) => id === domainId);
  invariant(
    typeof domainId === "string" &&
      domainId !== "root" &&
      domain?.scenarioIds?.length === 1 &&
      domain.scenarioIds[0] === "source-static-frame" &&
      migration.runtime?.fps === 12,
    `${animationId}: default audio frame-domain binding changed`,
  );
  return {domainId, domain, scenario: domain.scenarioIds[0]};
}

function sourceFromCandidate(candidate) {
  return {
    path: candidate.physicalSource.path,
    bytes: candidate.physicalSource.bytes,
    sha256: candidate.physicalSource.sha256,
  };
}

function assertAcceptanceNeutralCue(candidate) {
  const boundary = candidate.evidenceBoundary;
  invariant(
    boundary &&
      JSON.stringify(Object.keys(boundary).sort()) === JSON.stringify([
        "audibleContentEstablished",
        "listeningAccepted",
        "ownerAccepted",
        "published",
        "runtimeReachabilityEstablished",
        "spokenLanguageEstablished",
        "strictComplete",
        "synchronizationEstablished",
      ]) &&
      Object.values(boundary).every((value) => value === false),
    `${candidate.cueCandidateId}: acceptance-neutral audio boundary changed`,
  );
}

async function extractStream(root, member, cue) {
  const source = await readBinding(root, member.source.path, member.source);
  const parsed = parseEmbeddedAudioPayloads(source.contents);
  const stream = parsed.soundStreams.find(
    ({streamIndex}) => streamIndex === cue.machineEvidence.streamIndex,
  );
  invariant(stream, `${cue.cueCandidateId}: embedded stream was not reparsed`);
  invariant(
    stream.head?.format === "mp3" &&
      stream.blockCount === cue.machineEvidence.blockCount &&
      stream.blocks[0]?.localFrame === cue.machineEvidence.firstBlockFrame &&
      stream.blocks.at(-1)?.localFrame === cue.machineEvidence.lastBlockFrame &&
      Buffer.isBuffer(stream._payloadBytes) &&
      stream._payloadBytes.length === stream.payload.byteLength &&
      sha256(stream._payloadBytes) === stream.payload.sha256,
    `${cue.cueCandidateId}: direct SWF payload extraction changed`,
  );
  return {parsed, stream};
}

function browserAudioPath(outputPath, digest) {
  const publicPath = outputPath.replace(/^apps\/web\/server-assets/u, "");
  invariant(
    publicPath.startsWith("/flash-assets/courses/"),
    `${outputPath}: unexpected browser audio route root`,
  );
  invariant(/^[0-9a-f]{64}$/u.test(digest), `${outputPath}: invalid SHA-256 digest`);
  return `${publicPath}?sha256=${digest}`;
}

function normalPageCandidate(animationId, domainId, scenario, embeddedCue, stream, externalCue) {
  const prefix = `${SERVER_AUDIO_COURSES_ROOT}/${animationId}/audio`;
  const embeddedOutput = `${prefix}/embedded-main-timeline.mp3`;
  const spanishOutput = `${prefix}/spanish-host-narration.mp3`;
  const embedded = {
    sourceCueId: embeddedCue.inventory.cueId,
    sourcePath: embeddedCue.physicalSource.path,
    outputPath: embeddedOutput,
    publicPath: browserAudioPath(embeddedOutput, stream.payload.sha256),
    bytes: stream.payload.byteLength,
    sha256: stream.payload.sha256,
    streamIndex: stream.streamIndex,
    sourceDomain: stream.ownerDomainId,
    firstBlockFrame: embeddedCue.machineEvidence.firstBlockFrame,
    lastBlockFrame: embeddedCue.machineEvidence.lastBlockFrame,
    endFrame: embeddedCue.machineEvidence.lastBlockFrame + 1,
    blockCount: stream.blockCount,
    durationMs: embeddedCue.machineEvidence.durationMs,
  };
  const spanishSource = sourceFromCandidate(externalCue);
  const spanish = {
    sourcePath: spanishSource.path,
    outputPath: spanishOutput,
    publicPath: browserAudioPath(spanishOutput, spanishSource.sha256),
    bytes: spanishSource.bytes,
    sha256: spanishSource.sha256,
    durationMs: externalCue.machineEvidence.durationMs,
  };
  return {
    animationId,
    kind: "single-main-timeline-plus-spanish-host-track",
    frameDomain: domainId,
    scenario,
    embedded,
    spanish,
    runtimeProjection: {
      english: "automatic-current-js-main-timeline-cue",
      spanish: "user-activated-host-track-pauses-current-js-timeline",
    },
  };
}

function irCandidate(animationId, domainId, scenario, cuesAndStreams) {
  const outcomes = cuesAndStreams.map(({cue, stream}, index) => {
    const outputPath = `${SERVER_AUDIO_COURSES_ROOT}/${animationId}/audio/random-audio-outcome-${index}.mp3`;
    return {
      outcome: index,
      sourceCueId: cue.inventory.cueId,
      sourceDomain: stream.ownerDomainId,
      outputPath,
      publicPath: browserAudioPath(outputPath, stream.payload.sha256),
      bytes: stream.payload.byteLength,
      sha256: stream.payload.sha256,
      durationMs: cue.machineEvidence.durationMs,
      sourceBlockRange: [
        cue.machineEvidence.firstBlockFrame,
        cue.machineEvidence.lastBlockFrame,
      ],
    };
  });
  return {
    animationId,
    kind: "seeded-current-js-projection-of-source-random-two-way-audio",
    frameDomain: domainId,
    scenario,
    playbackRequestFrame: 5,
    outcomes,
    runtimeProjection: {
      currentJsSeedModulo: 2,
      descriptorSeed: 0,
      exactAvm1RandomOutcomeParityEstablished: false,
      replayRandomizationEstablished: false,
    },
  };
}

function fqAsset(entry) {
  const optionSuffix = entry.kind === "answer" ? entry.option : "question";
  const id = `g5-l4-fq-${entry.language}-q${String(entry.questionNumber).padStart(2, "0")}-${optionSuffix.toLowerCase()}`;
  const languageDirectory = entry.language === "en" ? "EA" : "SA";
  const filename = entry.kind === "question"
    ? `Q${entry.questionNumber}.mp3`
    : `Q${entry.questionNumber}${entry.option}.mp3`;
  const outputPath = `${SERVER_AUDIO_COURSES_ROOT}/${FQ_AUDIO_ANIMATION_ID}/audio/${languageDirectory}/${filename}`;
  return {
    id,
    language: entry.language,
    questionNumber: entry.questionNumber,
    kind: entry.kind,
    option: entry.option,
    sourcePath: entry.source.path,
    outputPath,
    publicPath: browserAudioPath(outputPath, entry.source.sha256),
    bytes: entry.source.bytes,
    sha256: entry.source.sha256,
  };
}

function tsLiteral(value, indent = 0) {
  const text = JSON.stringify(value, null, 2)
    .replaceAll("'", "\\'")
    .replaceAll('"', "'");
  if (!indent) return text;
  const pad = " ".repeat(indent);
  return text.split("\n").map((line, index) => index ? `${pad}${line}` : line).join("\n");
}

function generatedDemos(normalCandidates, ir, fqAssets) {
  const pageEntries = [ir, ...normalCandidates]
    .sort((left, right) => left.animationId.localeCompare(right.animationId))
    .map((candidate) => {
      if (candidate.kind.startsWith("seeded-")) {
        const cues = candidate.outcomes.map((outcome) => ({
          id: `${candidate.animationId}-random-audio-outcome-${outcome.outcome}`,
          sourceCueId: outcome.sourceCueId,
          frame: candidate.playbackRequestFrame,
          frameDomain: candidate.frameDomain,
          language: "en",
          scenario: candidate.scenario,
          seedModulo: {divisor: 2, remainder: outcome.outcome},
          source: outcome.publicPath,
          durationMs: outcome.durationMs,
          sha256: outcome.sha256,
          spokenLanguage: "undetermined",
        }));
        return `  '${candidate.animationId}': Object.freeze({\n` +
          `    audioCues: Object.freeze(${tsLiteral(cues, 4)} as const),\n` +
          `    audioTracks: Object.freeze([]),\n` +
          `  }),`;
      }
      const cue = {
        id: `${candidate.animationId}-embedded-main-timeline`,
        sourceCueId: candidate.embedded.sourceCueId,
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
        `    audioCues: Object.freeze([Object.freeze(${tsLiteral(cue, 4)} as const)]),\n` +
        `    audioTracks: Object.freeze([Object.freeze(${tsLiteral(track, 4)} as const)]),\n` +
        `  }),`;
    });
  const fqEntries = fqAssets.map((asset) => `  Object.freeze(${tsLiteral({
    id: asset.id,
    language: asset.language,
    questionNumber: asset.questionNumber,
    kind: asset.kind,
    option: asset.option,
    source: asset.publicPath,
    sha256: asset.sha256,
  }, 2)} as const),`);
  return `/* Generated by scripts/materialize-g5-l4-current-js-audio-candidates.mjs. Do not edit. */\n` +
    `import type {AudioCue, AudioTrack, InteractiveAudioAsset} from './contract';\n\n` +
    `export interface G5L4PageAudioCandidate {\n` +
    `  readonly audioCues: readonly AudioCue[];\n` +
    `  readonly audioTracks: readonly AudioTrack[];\n` +
    `}\n\n` +
    `export interface G5L4FqInteractiveAudioAsset extends InteractiveAudioAsset {\n` +
    `  readonly questionNumber: number;\n` +
    `  readonly kind: 'question' | 'answer';\n` +
    `  readonly option: 'A' | 'B' | 'C' | 'D' | null;\n` +
    `}\n\n` +
    `export const G5_L4_PAGE_AUDIO_CANDIDATES: Readonly<Record<string, G5L4PageAudioCandidate>> = Object.freeze({\n` +
    `${pageEntries.join("\n")}\n` +
    `});\n\n` +
    `export const G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS: readonly G5L4FqInteractiveAudioAsset[] = Object.freeze([\n` +
    `${fqEntries.join("\n")}\n` +
    `]);\n\n` +
    `export function getG5L4PageAudioCandidate(animationId: string): G5L4PageAudioCandidate | undefined {\n` +
    `  return G5_L4_PAGE_AUDIO_CANDIDATES[animationId];\n` +
    `}\n\n` +
    `export function getG5L4FqInteractiveAudioAsset(\n` +
    `  language: 'en' | 'es',\n` +
    `  questionNumber: number,\n` +
    `  option: 'A' | 'B' | 'C' | 'D' | null,\n` +
    `): G5L4FqInteractiveAudioAsset | undefined {\n` +
    `  return G5_L4_FQ_INTERACTIVE_AUDIO_ASSETS.find((asset) =>\n` +
    `    asset.language === language &&\n` +
    `    asset.questionNumber === questionNumber &&\n` +
    `    asset.option === option\n` +
    `  );\n` +
    `}\n`;
}

function generatedPolicy(assetBindings) {
  const entries = assetBindings
    .sort((left, right) => left.policyPath.localeCompare(right.policyPath))
    .map(({policyPath, sha256: digest}) => `  '${policyPath}': '${digest}',`);
  return `/* Generated by scripts/materialize-g5-l4-current-js-audio-candidates.mjs. Do not edit. */\n` +
    `export const G5_L4_AUDIO_ASSET_SHA256: Readonly<Record<string, string>> = Object.freeze({\n` +
    `${entries.join("\n")}\n` +
    `});\n\n` +
    `export function getExactG5L4AudioAssetSha256(\n` +
    `  animationId: string,\n` +
    `  remainder: readonly string[],\n` +
    `): string | null {\n` +
    `  return G5_L4_AUDIO_ASSET_SHA256[[animationId, ...remainder].join('/')] ?? null;\n` +
    `}\n`;
}

function markdown(report) {
  return `# G5 L4 current-JavaScript audio candidates\n\n` +
    `This page-only materialization stages exact canonical source bytes and generates product mappings without promoting any fidelity or acceptance gate.\n\n` +
    `- Active lesson pages: **${report.summary.pageCount}/54**.\n` +
    `- Ordinary main-timeline pages mapped: **${report.summary.normalPageCandidateCount}/50**.\n` +
    `- IR seeded two-outcome candidate: **${report.summary.irCandidateCount}/1**.\n` +
    `- FQ interactive source paths staged: **${report.summary.fqPresentPathCount}/180**; **${report.summary.fqMissingPathCount} remain absent from canonical source custody**.\n` +
    `- FQ source-control owners: FQ002 and FQ003. FQ001 remains unimplemented because no positive audio-control trigger is established.\n` +
    `- Hash-bound route-served audio files: **${report.summary.stagedAssetCount}**, ${report.summary.stagedAssetBytes} bytes.\n\n` +
    `- Embedded metadata review: **${report.embeddedMetadataReview.assets.length}** exact asset remains pending before public audio enablement; the report records field names only, never tag values.\n\n` +
    `The English embedded streams and Spanish host tracks remain language candidates until listening establishes spoken content. The IR seed projection does not establish AVM1 random parity. The FQ map is incomplete while 97 expected paths remain outside canonical custody. Original-runtime reachability and synchronization, listening acceptance, Owner acceptance, strict completion, release, and publication all remain false.\n`;
}

export async function materializeG5L4CurrentJsAudioCandidates({
  root = ROOT,
  check = false,
} = {}) {
  const canonicalRoot = await realpath(root);
  const scriptRelative = portable(path.relative(canonicalRoot, SCRIPT_PATH));
  const [generator, embeddedAudioHelper, staticBinding] = await Promise.all([
    readBinding(canonicalRoot, scriptRelative),
    readBinding(canonicalRoot, EMBEDDED_AUDIO_HELPER),
    readBinding(canonicalRoot, STATIC_REPORT),
  ]);
  const staticReport = JSON.parse(staticBinding.contents);
  invariant(
    staticReport.releaseId === RELEASE_ID &&
      staticReport.status === "machine-static-reconciliation-complete-runtime-evidence-unresolved" &&
      staticReport.members?.length === 55 &&
      staticReport.summary?.fqExpectedPathCount === EXPECTED_FQ_PATH_COUNT &&
      staticReport.summary?.fqPresentCandidateCount === EXPECTED_PRESENT_FQ_PATH_COUNT,
    "G5 L4 static audio reconciliation identity changed",
  );
  const pages = staticReport.members.slice(0, PAGE_COUNT);
  invariant(
    pages.length === PAGE_COUNT &&
      pages.every(({ordinal, releaseRole}, index) =>
        ordinal === index + 1 && releaseRole === "active-xml-referenced-page"),
    "G5 L4 page-only member sequence changed",
  );
  const migrationBindings = new Map();
  const migrations = new Map();
  for (const page of pages.slice(0, 51)) {
    const relativePath = `migrations/${page.animationId}/migration.json`;
    const binding = await readBinding(canonicalRoot, relativePath);
    const migration = JSON.parse(binding.contents);
    invariant(
      migration.catalogEvidence?.animationId === page.animationId,
      `${page.animationId}: migration binding changed`,
    );
    migrationBindings.set(page.animationId, binding);
    migrations.set(page.animationId, migration);
  }

  const normalCandidates = [];
  const extractedPayloads = new Map();
  for (const page of pages.slice(1, 51)) {
    const external = page.cueCandidates.filter(({origin}) => origin === "external");
    const mainStreams = page.cueCandidates.filter((candidate) =>
      candidate.origin === "embedded-stream" &&
      candidate.staticPlacementGraph?.frameDomainDisposition === "declared-frame-domain",
    );
    invariant(
      external.length === 1 && mainStreams.length === 1,
      `${page.animationId}: expected one page host track and one declared-domain stream`,
    );
    assertAcceptanceNeutralCue(external[0]);
    assertAcceptanceNeutralCue(mainStreams[0]);
    invariant(
      external[0].classification === "external-page-host-path-hash-bound-candidate" &&
        external[0].machineEvidence.associationStatus === "exact-basename-association" &&
        external[0].machineEvidence.startSemantics === "host-user-activated" &&
        external[0].physicalSource.physicallyHashVerified === true &&
        external[0].hostDependency?.trigger === "host-user-activated" &&
        external[0].hostDependency?.spokenLanguageEstablished === false,
      `${page.animationId}: external host-audio candidate boundary changed`,
    );
    const migration = migrations.get(page.animationId);
    const {domainId, scenario} = migrationScenario(migration, page.animationId);
    invariant(
      mainStreams[0].staticPlacementGraph.declaredFrameDomainIds?.length === 1 &&
        mainStreams[0].staticPlacementGraph.declaredFrameDomainIds[0] === domainId,
      `${page.animationId}: static stream/domain association changed`,
    );
    const {stream} = await extractStream(canonicalRoot, page, mainStreams[0]);
    invariant(stream.ownerDomainId === domainId, `${page.animationId}: reparsed stream is not owned by the default domain`);
    extractedPayloads.set(page.animationId, stream._payloadBytes);
    normalCandidates.push(
      normalPageCandidate(page.animationId, domainId, scenario, mainStreams[0], stream, external[0]),
    );
  }
  invariant(normalCandidates.length === NORMAL_PAGE_COUNT, "G5 L4 ordinary audio candidate count changed");

  const irPage = pages[0];
  invariant(irPage.animationId === IR_ID, "G5 L4 IR page identity changed");
  const irMigration = migrations.get(IR_ID);
  const irRuntime = migrationScenario(irMigration, IR_ID);
  const irCues = irPage.cueCandidates.filter(({origin}) => origin === "embedded-stream");
  invariant(irCues.length === 2, "G5 L4 IR must retain exactly two embedded stream candidates");
  const irStreams = [];
  for (const cue of irCues) {
    assertAcceptanceNeutralCue(cue);
    const {stream} = await extractStream(canonicalRoot, irPage, cue);
    irStreams.push({cue, stream});
  }
  irStreams.sort((left, right) => left.stream.streamIndex - right.stream.streamIndex);
  const ir = irCandidate(IR_ID, irRuntime.domainId, irRuntime.scenario, irStreams);

  const presentFqEntries = staticReport.finalQuizStaticRoute.expectedPaths.filter(({source}) => source !== null);
  invariant(
    presentFqEntries.length === EXPECTED_PRESENT_FQ_PATH_COUNT &&
      new Set(presentFqEntries.map(({source}) => source.path)).size === presentFqEntries.length,
    "G5 L4 canonical FQ path set changed",
  );
  for (const entry of presentFqEntries) {
    invariant(
      entry.status === "hash-bound-canonical-path-candidate-not-promoted" &&
        entry.sourceFile === entry.source.path &&
        entry.candidateId === `audio-${entry.source.sha256}` &&
        JSON.stringify(entry.staticPositiveOwnerCandidateIds) ===
          JSON.stringify(FQ_IDS.slice(1)) &&
        entry.cuePromoted === false &&
        entry.runtimeReachabilityEstablished === false &&
        entry.audibleContentEstablished === false &&
        entry.spokenLanguageEstablished === false &&
        entry.synchronizationEstablished === false,
      `${entry.expectedPathId}: FQ source-control or acceptance boundary changed`,
    );
  }
  const missingFqEntries = staticReport.finalQuizStaticRoute.expectedPaths.filter(({source}) => source === null);
  invariant(
    missingFqEntries.length === EXPECTED_FQ_PATH_COUNT - EXPECTED_PRESENT_FQ_PATH_COUNT &&
      missingFqEntries.every((entry) =>
        entry.status === "missing-source" &&
        entry.candidateId === null &&
        entry.staticPositiveOwnerCandidateIds.length === 0 &&
        entry.cuePromoted === false &&
        entry.runtimeReachabilityEstablished === false &&
        entry.audibleContentEstablished === false &&
        entry.spokenLanguageEstablished === false &&
        entry.synchronizationEstablished === false
      ),
    "G5 L4 missing FQ path boundary changed",
  );
  const fqAssets = presentFqEntries.map(fqAsset).sort((left, right) => left.id.localeCompare(right.id));
  invariant(new Set(fqAssets.map(({id}) => id)).size === fqAssets.length, "G5 L4 FQ audio ids are not unique");

  const stagedAssets = [];
  for (const candidate of normalCandidates) {
    stagedAssets.push(await publishExtractedAsset(
      canonicalRoot,
      extractedPayloads.get(candidate.animationId),
      candidate.embedded,
      candidate.embedded.outputPath,
      check,
    ));
    stagedAssets.push(await publishExactAsset(
      canonicalRoot,
      {path: candidate.spanish.sourcePath, bytes: candidate.spanish.bytes, sha256: candidate.spanish.sha256},
      candidate.spanish.outputPath,
      check,
    ));
  }
  for (const [index, outcome] of ir.outcomes.entries()) {
    stagedAssets.push(await publishExtractedAsset(
      canonicalRoot,
      irStreams[index].stream._payloadBytes,
      outcome,
      outcome.outputPath,
      check,
    ));
  }
  for (const asset of fqAssets) {
    stagedAssets.push(await publishExactAsset(
      canonicalRoot,
      {path: asset.sourcePath, bytes: asset.bytes, sha256: asset.sha256},
      asset.outputPath,
      check,
    ));
  }
  invariant(stagedAssets.length === 185, "G5 L4 staged audio asset count changed");
  for (const asset of stagedAssets) {
    await assertLegacyPublicAssetAbsent(canonicalRoot, asset.path);
  }

  const embeddedMetadataAssets = [];
  for (const asset of stagedAssets) {
    const fieldNames = id3MetadataFieldNames(
      await readFile(resolveInside(canonicalRoot, asset.path)),
    );
    if (fieldNames.length > 0) {
      embeddedMetadataAssets.push({
        path: asset.path,
        bytes: asset.bytes,
        sha256: asset.sha256,
        fieldNames,
      });
    }
  }
  invariant(
    JSON.stringify(embeddedMetadataAssets) === JSON.stringify([{
      path: "apps/web/server-assets/flash-assets/courses/course-g05-l04-ts-007/audio/spanish-host-narration.mp3",
      bytes: 119_016,
      sha256: "eba3e371fc9b1420fc3f12049b477c5226f9585c8d9d438c429edf4619492ee2",
      fieldNames: ["date", "Engineer"],
    }]),
    "G5 L4 embedded MP3 metadata review inventory changed",
  );

  const policyBindings = stagedAssets.map((asset) => ({
    policyPath: asset.path.replace(/^apps\/web\/server-assets\/flash-assets\/courses\//u, ""),
    sha256: asset.sha256,
  }));
  invariant(
    new Set(policyBindings.map(({policyPath}) => policyPath)).size === policyBindings.length,
    "G5 L4 route-served audio policy paths are not unique",
  );

  const report = {
    schemaVersion: 1,
    reportType: "g5-l4-current-js-audio-candidates",
    releaseId: RELEASE_ID,
    scope: "54 active lesson-page occurrences; legacy course shell excluded",
    generator: {path: generator.path, bytes: generator.bytes, sha256: generator.sha256},
    generatorInputs: [
      {
        role: "embedded-audio-payload-parser",
        path: embeddedAudioHelper.path,
        bytes: embeddedAudioHelper.bytes,
        sha256: embeddedAudioHelper.sha256,
      },
    ],
    sourceBindings: [
      {path: staticBinding.path, bytes: staticBinding.bytes, sha256: staticBinding.sha256},
      ...[...migrationBindings.values()].map(({path: sourcePath, bytes, sha256: digest}) => ({
        path: sourcePath,
        bytes,
        sha256: digest,
      })),
    ],
    authority: "Exact-byte staging plus source-structural current-JavaScript audio projection only",
    authorityBoundary: "This report does not establish spoken language, natural original-runtime reachability or synchronization, random parity, listening acceptance, Owner acceptance, strict completion, release, or publication.",
    selectionRules: {
      ordinaryPages: "exactly one non-empty MP3 stream owned by the declared default frame domain plus one exact-basename Spanish host candidate",
      introduction: "two exact embedded MP3 streams projected through deterministic seed modulo two; original random outcome parity unresolved",
      finalQuiz: "only canonical paths with positive FQ002/FQ003 static source-control evidence; missing paths stay disabled",
      fq001: "no positive source audio-control pattern observed; no audio invented or assigned",
    },
    embeddedMetadataReview: {
      status: "pending-before-public-audio-enable",
      exactSourceBytesPreserved: true,
      rawTagValuesPersistedInReport: false,
      assets: embeddedMetadataAssets,
    },
    summary: {
      pageCount: PAGE_COUNT,
      normalPageCandidateCount: normalCandidates.length,
      irCandidateCount: 1,
      runtimeAudioCandidatePageCount: 53,
      fqInteractiveOwnerPageCount: 2,
      fqNoPositiveTriggerPageCount: 1,
      fqExpectedPathCount: EXPECTED_FQ_PATH_COUNT,
      fqPresentPathCount: fqAssets.length,
      fqMissingPathCount: EXPECTED_FQ_PATH_COUNT - fqAssets.length,
      stagedAssetCount: stagedAssets.length,
      stagedAssetBytes: stagedAssets.reduce((sum, {bytes}) => sum + bytes, 0),
      strictCompleteCount: 0,
      listeningAcceptedCount: 0,
      ownerAcceptedCount: 0,
      published: false,
    },
    normalCandidates,
    introductionCandidate: ir,
    finalQuiz: {
      audioAnimationId: FQ_AUDIO_ANIMATION_ID,
      sourceControlOwnerAnimationIds: FQ_IDS.slice(1),
      unresolvedOwnerAnimationId: FQ_IDS[0],
      assets: fqAssets,
      missingPaths: staticReport.finalQuizStaticRoute.expectedPaths
        .filter(({source}) => source === null)
        .map(({sourceFile, language, questionNumber, kind, option}) => ({
          sourceFile,
          language,
          questionNumber,
          kind,
          option,
        })),
    },
    stagedAssets,
    acceptance: {
      spokenLanguageEstablished: false,
      naturalOriginalRuntimeReachabilityEstablished: false,
      originalRuntimeSynchronizationEstablished: false,
      currentJsInteractionListeningAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonReleased: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  const outputs = [
    [REPORT_JSON, Buffer.from(stableJson(report))],
    [REPORT_MARKDOWN, Buffer.from(markdown(report))],
    [GENERATED_DEMOS, Buffer.from(generatedDemos(normalCandidates, ir, fqAssets))],
    [GENERATED_POLICY, Buffer.from(generatedPolicy(policyBindings))],
  ];
  for (const [relativePath, bytes] of outputs) {
    await emitDerived(canonicalRoot, relativePath, bytes, check);
  }
  return {
    action: check ? "verified" : "materialized",
    pageAudioCandidateCount: report.summary.runtimeAudioCandidatePageCount,
    stagedAssetCount: report.summary.stagedAssetCount,
    stagedAssetBytes: report.summary.stagedAssetBytes,
    fqPresentPathCount: report.summary.fqPresentPathCount,
    fqMissingPathCount: report.summary.fqMissingPathCount,
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
  materializeG5L4CurrentJsAudioCandidates(parseArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
