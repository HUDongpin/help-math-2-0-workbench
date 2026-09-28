#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
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
const REPORT_JSON =
  "reports/g4-l3-visible-companion-audio-candidates.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-visible-companion-audio-candidates.md";
const GENERATED_TS =
  "packages/demos/src/g4-l3-visible-companion-audio.generated.ts";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

const SOURCE_BINDINGS = Object.freeze([
  "reports/g4-l3-embedded-audio-archive.json",
  "reports/g4-l3-audio-cas-media-probe.json",
  "reports/g4-l3-natural-parent-composite-assets.json",
]);

const PAGE_SPECS = Object.freeze([
  Object.freeze({
    animationId: "course-g04-l03-vb-007",
    mainFrameDomain: "sprite-271",
    expectedVisibleCueCount: 9,
    expectedUnresolvedCueCount: 1,
  }),
  Object.freeze({
    animationId: "course-g04-l03-in-012",
    mainFrameDomain: "sprite-228",
    expectedVisibleCueCount: 6,
    expectedUnresolvedCueCount: 2,
  }),
  Object.freeze({
    animationId: "course-g04-l03-ts-007",
    mainFrameDomain: "sprite-441",
    expectedVisibleCueCount: 10,
    expectedUnresolvedCueCount: 1,
  }),
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
      `${relativePath} differs from its exact-byte binding`,
    );
  }
  return result;
}

function exactIds(actual, expected, label) {
  invariant(
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort()),
    `${label} changed`,
  );
}

function cueId(streamIndex) {
  return `embedded-stream-${String(streamIndex).padStart(4, "0")}`;
}

function outputAudioName(stream) {
  const domainSuffix = stream.ownerDomainId.replace(/^sprite-/u, "sprite-");
  return `visible-companion-${cueId(stream.streamIndex)}-${domainSuffix}.mp3`;
}

function tsLiteral(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll('"', "'")
    .replaceAll(/'([^']+)':/gu, "$1:");
}

function generatedTypeScript(pages) {
  const entries = pages.map((page) => {
    const cues = page.candidates.map((candidate) => ({
      id: `${candidate.animationId}-${candidate.sourceCueId}-visible-companion`,
      sourceCueId: candidate.sourceCueId,
      frame: candidate.firstBlockFrame,
      endFrame: candidate.endFrame,
      frameDomain: candidate.frameDomain,
      language: "en",
      scenario: "source-static-reachable-domain",
      source: candidate.publicPath,
      durationMs: candidate.durationMs,
      sha256: candidate.sha256,
      spokenLanguage: "undetermined",
    }));
    const cueEntries = cues.map(
      (cue) => `Object.freeze(${tsLiteral(cue)} as const)`,
    );
    return `  '${page.animationId}': Object.freeze([${cueEntries.join(",\n")}]),`;
  });
  return `/* Generated by scripts/materialize-g4-l3-visible-companion-audio-candidates.mjs. Do not edit. */\n` +
    `import type {AudioCue} from './contract';\n\n` +
    `export const G4_L3_VISIBLE_COMPANION_AUDIO_CANDIDATES: Readonly<Record<string, readonly AudioCue[]>> = Object.freeze({\n` +
    `${entries.join("\n")}\n` +
    `});\n\n` +
    `export function getG4L3VisibleCompanionAudioCandidates(animationId: string): readonly AudioCue[] {\n` +
    `  return G4_L3_VISIBLE_COMPANION_AUDIO_CANDIDATES[animationId] ?? Object.freeze([]);\n` +
    `}\n`;
}

function reportMarkdown(report) {
  const rows = report.pages.flatMap((page) =>
    page.candidates.map((candidate) =>
      `| \`${page.animationId}\` | \`${candidate.sourceCueId}\` | \`${candidate.frameDomain}\` | ${candidate.firstBlockFrame}–${candidate.lastBlockFrame} | ${candidate.durationMs} | \`${candidate.sha256}\` |`,
    )
  ).join("\n");
  const exclusions = report.pages.flatMap((page) =>
    page.unresolvedCompanionStreams.map((stream) =>
      `| \`${page.animationId}\` | \`${stream.sourceCueId}\` | \`${stream.frameDomain}\` | ${stream.reason} |`,
    )
  ).join("\n");
  return `# G4 L3 source-visible companion audio candidates\n\n` +
    `This acceptance-neutral report stages ${report.summary.visibleCompanionCueCount} exact MP3 payloads whose owning frame domains are already source-position-observable Current-JS companion candidates for VB007, IN012, and TS007. It does not infer the timing of nested or nonvisual streams.\n\n` +
    `| Page | Source cue | Frame domain | Local blocks | Duration ms | SHA-256 |\n` +
    `|---|---|---|---:|---:|---|\n${rows}\n\n` +
    `## Unresolved companion streams\n\n` +
    `| Page | Source cue | Owner domain | Reason |\n` +
    `|---|---|---|---|\n${exclusions}\n\n` +
    `The existing three main-domain audio candidates remain separate. Spoken content/language, natural runtime reachability, parent-domain synchronization, complete listening, Replay parity, human review, Owner acceptance, strict completion, and publication remain pending.\n`;
}

export function deriveVisibleCompanionAudioCandidates({
  embeddedArchive,
  embeddedProbe,
  naturalAssetReport,
  assetManifests,
}) {
  invariant(
    naturalAssetReport?.reportType ===
      "g4-l3-natural-parent-composite-generated-assets" &&
      naturalAssetReport.summary?.assetCount === 9 &&
      naturalAssetReport.summary?.sourceVisibleDomainCount === 30 &&
      naturalAssetReport.summary?.nonvisualDomainCount === 2 &&
      naturalAssetReport.strictAcceptanceEffect === "none",
    "Natural parent-composite asset report changed",
  );
  const expectedPageIds = PAGE_SPECS.map(({animationId}) => animationId);
  exactIds(
    new Set(naturalAssetReport.assets.map(({animationId}) => animationId)),
    expectedPageIds,
    "Natural asset page set",
  );
  const archiveById = new Map(
    embeddedArchive.items.map((item) => [item.animationId, item]),
  );
  const probeById = new Map(
    embeddedProbe.itemReferences.map((item) => [item.animationId, item]),
  );
  const pages = [];
  for (const spec of PAGE_SPECS) {
    const visibleDomains = new Map();
    for (const asset of naturalAssetReport.assets.filter(
      ({animationId}) => animationId === spec.animationId,
    )) {
      const manifest = assetManifests.get(asset.manifest.path);
      invariant(
        manifest?.animationId === spec.animationId &&
          manifest.assetKey === asset.assetKey &&
          manifest.strictAcceptanceEffect === "none",
        `${spec.animationId}/${asset.assetKey}: asset manifest binding changed`,
      );
      for (const domain of manifest.browserEvidence?.domains ?? []) {
        if (domain.sourcePositionObservableAtAnchor !== true) continue;
        const existing = visibleDomains.get(domain.frameDomainId);
        invariant(
          !existing || existing.frameCount === domain.frameCount,
          `${spec.animationId}/${domain.frameDomainId}: visible domain count conflicts`,
        );
        visibleDomains.set(domain.frameDomainId, {
          frameCount: domain.frameCount,
          manifest: asset.manifest.path,
        });
      }
    }
    invariant(
      !visibleDomains.has(spec.mainFrameDomain),
      `${spec.animationId}: companion evidence unexpectedly includes the main domain`,
    );
    const streams = archiveById.get(spec.animationId)?.embeddedAudio
      ?.soundStreams ?? [];
    const probeUnits = probeById.get(spec.animationId)?.units ?? [];
    const candidates = [];
    const unresolvedCompanionStreams = [];
    for (const stream of streams) {
      invariant(
        stream.kind === "SoundStream" &&
          stream.head?.format === "mp3" &&
          stream.blockCount > 0 &&
          stream.payload?.physicalHashVerified === true &&
          stream.payload?.archiveWritten === true,
        `${spec.animationId}/${cueId(stream.streamIndex)}: embedded stream is not an exact MP3 archive`,
      );
      if (stream.ownerDomainId === spec.mainFrameDomain) continue;
      const sourceCueId = cueId(stream.streamIndex);
      const visible = visibleDomains.get(stream.ownerDomainId);
      if (!visible) {
        unresolvedCompanionStreams.push({
          sourceCueId,
          frameDomain: stream.ownerDomainId,
          reason:
            "owner domain is not a source-position-observable Current-JS companion domain; parent/root synchronization is unresolved",
        });
        continue;
      }
      invariant(
        Array.isArray(stream.blocks) &&
          stream.blocks.length === stream.blockCount &&
          stream.blocks.length > 0,
        `${spec.animationId}/${sourceCueId}: stream block inventory is invalid`,
      );
      const firstBlockFrame = stream.blocks[0].localFrame;
      const lastBlockFrame = stream.blocks.at(-1).localFrame;
      invariant(
        Number.isSafeInteger(firstBlockFrame) &&
          Number.isSafeInteger(lastBlockFrame) &&
          firstBlockFrame >= 1 &&
          lastBlockFrame >= firstBlockFrame &&
          lastBlockFrame <= visible.frameCount &&
          stream.blocks.every(
            (block, index) =>
              index === 0 ||
              block.localFrame >= stream.blocks[index - 1].localFrame,
          ),
        `${spec.animationId}/${sourceCueId}: stream frames exceed the visible companion domain`,
      );
      const probe = probeUnits.find(
        (unit) =>
          unit.unitKind === "SoundStream" &&
          unit.streamIndex === stream.streamIndex,
      );
      invariant(
        probe?.technicalProbe?.probeStatus ===
          "ffprobe-parsed-ffmpeg-decode-check-passed" &&
          probe.technicalProbe.ffmpegDecodeCheckPassed === true &&
          Number.isFinite(probe.technicalProbe.durationSeconds) &&
          probe.technicalProbe.durationSeconds > 0 &&
          probe.payload?.sha256 === stream.payload.sha256 &&
          probe.payload?.byteLength === stream.payload.byteLength,
        `${spec.animationId}/${sourceCueId}: media probe binding is invalid`,
      );
      const outputName = outputAudioName(stream);
      candidates.push({
        animationId: spec.animationId,
        sourceCueId,
        streamIndex: stream.streamIndex,
        frameDomain: stream.ownerDomainId,
        firstBlockFrame,
        lastBlockFrame,
        endFrame: lastBlockFrame + 1,
        blockCount: stream.blockCount,
        durationMs: Math.round(probe.technicalProbe.durationSeconds * 1_000),
        channels: stream.head.channels,
        sampleRateHz: stream.head.sampleRateHz,
        sourcePath: stream.payload.archivePath,
        outputPath: `public/flash-assets/courses/${spec.animationId}/audio/${outputName}`,
        publicPath: `/flash-assets/courses/${spec.animationId}/audio/${outputName}`,
        bytes: stream.payload.byteLength,
        sha256: stream.payload.sha256,
        visibleDomainManifest: visible.manifest,
        language: "undetermined",
        cueMappingAuthority: "source-local-frame-domain-structural-only",
        originalRuntimeSynchronizationEstablished: false,
        listeningAcceptanceEstablished: false,
        strictAcceptanceEffect: "none",
      });
    }
    candidates.sort((left, right) => left.streamIndex - right.streamIndex);
    unresolvedCompanionStreams.sort((left, right) =>
      left.sourceCueId.localeCompare(right.sourceCueId),
    );
    invariant(
      candidates.length === spec.expectedVisibleCueCount,
      `${spec.animationId}: visible companion cue count changed`,
    );
    invariant(
      unresolvedCompanionStreams.length === spec.expectedUnresolvedCueCount,
      `${spec.animationId}: unresolved companion cue count changed`,
    );
    pages.push({
      animationId: spec.animationId,
      mainFrameDomain: spec.mainFrameDomain,
      sourceVisibleCompanionDomainCount: visibleDomains.size,
      candidates,
      unresolvedCompanionStreams,
      acceptance: {
        spokenLanguageEstablished: false,
        naturalRuntimeReachabilityEstablished: false,
        originalRuntimeSynchronizationEstablished: false,
        completeListeningAccepted: false,
        humanReviewAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
      },
      strictAcceptanceEffect: "none",
    });
  }
  invariant(
    pages.reduce((sum, page) => sum + page.candidates.length, 0) === 25 &&
      pages.reduce(
        (sum, page) => sum + page.unresolvedCompanionStreams.length,
        0,
      ) === 4,
    "Visible/unresolved companion audio totals changed",
  );
  return pages;
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

export async function materializeG4L3VisibleCompanionAudioCandidates({
  root = ROOT,
  check = false,
} = {}) {
  const canonicalRoot = await realpath(root);
  const scriptRelative = portable(path.relative(canonicalRoot, SCRIPT_PATH));
  const [generator, ...sourceBindings] = await Promise.all([
    readBinding(canonicalRoot, scriptRelative),
    ...SOURCE_BINDINGS.map((item) => readBinding(canonicalRoot, item)),
  ]);
  const [embeddedArchive, embeddedProbe, naturalAssetReport] =
    sourceBindings.map(({contents}) => JSON.parse(contents));
  const manifestBindings = await Promise.all(
    naturalAssetReport.assets.map(({manifest}) =>
      readBinding(canonicalRoot, manifest.path, manifest),
    ),
  );
  const assetManifests = new Map(
    manifestBindings.map((binding) => [
      binding.path,
      JSON.parse(binding.contents),
    ]),
  );
  const pages = deriveVisibleCompanionAudioCandidates({
    embeddedArchive,
    embeddedProbe,
    naturalAssetReport,
    assetManifests,
  });
  const stagedAssets = [];
  for (const candidate of pages.flatMap(({candidates}) => candidates)) {
    stagedAssets.push(
      await writeAssetNoReplace(canonicalRoot, candidate, check),
    );
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-visible-companion-audio-candidates",
    authority:
      "Exact-byte companion audio staging and source-local frame-domain structural mapping only",
    authorityBoundary:
      "No spoken language/content, natural runtime reachability, parent/root synchronization, listening acceptance, Replay parity, human review, Owner acceptance, strict completion, or publication authority.",
    generator: {
      path: generator.path,
      bytes: generator.bytes,
      sha256: generator.sha256,
    },
    sourceBindings: [...sourceBindings, ...manifestBindings].map(
      ({path: sourcePath, bytes, sha256: hash}) => ({
        path: sourcePath,
        bytes,
        sha256: hash,
      }),
    ),
    selectionRule: {
      ownerDomainMustBeSourcePositionObservable: true,
      owningDomainLocalFrameMappingOnly: true,
      mainTimelineAudioRemainsSeparate: true,
      nestedOrNonvisualParentSynchronizationMayNotBeInferred: true,
      exactArchivedMp3PayloadAndPassingDecodeProbeRequired: true,
    },
    summary: {
      pageCount: pages.length,
      visibleCompanionCueCount: pages.reduce(
        (sum, page) => sum + page.candidates.length,
        0,
      ),
      unresolvedCompanionCueCount: pages.reduce(
        (sum, page) => sum + page.unresolvedCompanionStreams.length,
        0,
      ),
      stagedAssetCount: stagedAssets.length,
      exactSourceBytesPreserved: true,
      transcoded: false,
      acceptedCueCount: 0,
      strictCompleteCount: 0,
      published: false,
    },
    pages,
    stagedAssets: stagedAssets.map(
      ({path: outputPath, bytes, sha256: hash}) => ({
        path: outputPath,
        bytes,
        sha256: hash,
        state: "present-exact-immutable",
      }),
    ),
    acceptance: {
      spokenLanguageEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      completeListeningAccepted: false,
      replayParityAccepted: false,
      visualParityAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  await Promise.all([
    emitDerived(
      canonicalRoot,
      REPORT_JSON,
      Buffer.from(stableJson(report)),
      check,
    ),
    emitDerived(
      canonicalRoot,
      REPORT_MARKDOWN,
      Buffer.from(reportMarkdown(report)),
      check,
    ),
    emitDerived(
      canonicalRoot,
      GENERATED_TS,
      Buffer.from(generatedTypeScript(pages)),
      check,
    ),
  ]);
  return {
    check,
    pageCount: pages.length,
    visibleCompanionCueCount: report.summary.visibleCompanionCueCount,
    unresolvedCompanionCueCount: report.summary.unresolvedCompanionCueCount,
    stagedAssetCount: stagedAssets.length,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  let check = false;
  for (const value of argv) {
    if (value === "--check") check = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return {check};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materializeG4L3VisibleCompanionAudioCandidates(
    parseArguments(process.argv.slice(2)),
  )
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
