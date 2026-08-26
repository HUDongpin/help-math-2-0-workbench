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
const ANIMATION_ID = "course-g04-l03-ir-001-341242cc";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const REPORT_JSON =
  "reports/g4-l3-ir001-current-js-random-audio-candidate.json";
const REPORT_MARKDOWN =
  "reports/g4-l3-ir001-current-js-random-audio-candidate.md";
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

const SOURCE_BINDINGS = Object.freeze([
  "catalog/lesson-release-ledger.json",
  "reports/g4-l3-embedded-audio-archive.json",
  "reports/g4-l3-audio-cas-media-probe.json",
  "migrations/course-g04-l03-ir-001-341242cc/audit/muted-random-visual-disposition.json",
  "migrations/course-g04-l03-ir-001-341242cc/migration.json",
  "packages/demos/src/modules/course-g04-l03-ir-001-341242cc.tsx",
  "packages/demos/src/source-static-canvas-candidate.tsx",
  "packages/demos/src/contract.ts",
  "packages/demos/src/runtime.ts",
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

function deriveCandidate({
  releaseLedger,
  embeddedArchive,
  embeddedProbe,
  visualDisposition,
  migration,
}) {
  const release = releaseLedger.releases.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    release?.expectedMemberCount === 40 &&
      release.members.some(({animationId}) => animationId === ANIMATION_ID),
    "G4 L3 release membership changed",
  );
  invariant(
    migration.animationId === ANIMATION_ID &&
      migration.source?.swfSha256 ===
        "2af6431db3ed786d9b48feec5a649887af92fb219a04e5dbd42e7e4b04087df4" &&
      migration.implementation?.defaultFrameDomainId === "sprite-27",
    "IR001 migration binding changed",
  );
  invariant(
    visualDisposition.animationId === ANIMATION_ID &&
      visualDisposition.status ===
        "verified-random-audio-selection-does-not-change-source-visual" &&
      visualDisposition.visualDisposition?.randomSelectionAffectsStreamAudio ===
        true &&
      visualDisposition.visualDisposition?.randomSelectionChangesDisplayList ===
        false &&
      visualDisposition.visualDisposition?.naturalRandomOutcomeObserved ===
        false &&
      Object.values(visualDisposition.acceptance ?? {}).every(
        (value) => value === false || value === true,
      ) &&
      visualDisposition.acceptance?.audioAccepted === false &&
      visualDisposition.acceptance?.strictMigrationComplete === false,
    "IR001 muted-random disposition changed",
  );
  const archiveItem = embeddedArchive.items.find(
    ({animationId}) => animationId === ANIMATION_ID,
  );
  const probeItem = embeddedProbe.itemReferences.find(
    ({animationId}) => animationId === ANIMATION_ID,
  );
  const streams = archiveItem?.embeddedAudio?.soundStreams ?? [];
  const units = probeItem?.units ?? [];
  invariant(
    streams.length === 2 &&
      units.length === 2 &&
      probeItem.audioUnitReferenceCount === 2 &&
      probeItem.ffmpegDecodeCheckPassedReferenceCount === 2,
    "IR001 exact two-stream audio set changed",
  );
  const expected = [
    {
      outcome: 0,
      streamIndex: 1,
      ownerDomainId: "sprite-9",
      sha256:
        "9b5b7659bda9ce6d22df5e3b927e9e56a87ef9a5405b55a46a8af2fff94e87ff",
    },
    {
      outcome: 1,
      streamIndex: 2,
      ownerDomainId: "sprite-10",
      sha256:
        "d90d924f11f549a10218a6689b21b5d73aa19208ffab07c5f5725110e7b5d420",
    },
  ];
  const branches = expected.map((definition) => {
    const stream = streams.find(
      ({streamIndex}) => streamIndex === definition.streamIndex,
    );
    const unit = units.find(
      ({streamIndex}) => streamIndex === definition.streamIndex,
    );
    invariant(
      stream?.ownerDomainId === definition.ownerDomainId &&
        stream.headLocalFrame === 1 &&
        stream.head?.format === "mp3" &&
        stream.blockCount === 135 &&
        stream.blocks?.[0]?.localFrame === 1 &&
        stream.blocks?.at(-1)?.localFrame === 135 &&
        stream.payload?.physicalHashVerified === true &&
        stream.payload.sha256 === definition.sha256 &&
        stream.payload.byteLength === 67_080 &&
        unit?.ownerDomainId === definition.ownerDomainId &&
        unit.payload?.path === stream.payload.archivePath &&
        unit.payload.sha256 === definition.sha256 &&
        unit.payload.byteLength === 67_080 &&
        unit.technicalProbe?.probeStatus ===
          "ffprobe-parsed-ffmpeg-decode-check-passed" &&
        unit.technicalProbe.ffmpegDecodeCheckPassed === true &&
        unit.technicalProbe.durationSeconds === 11.18,
      `IR001 random audio outcome ${definition.outcome} source binding changed`,
    );
    return {
      outcome: definition.outcome,
      sourceMovieClip: `Mc_Sound_${definition.outcome}`,
      ownerDomainId: definition.ownerDomainId,
      sourceStreamIndex: definition.streamIndex,
      sourcePath: stream.payload.archivePath,
      outputPath:
        `public/flash-assets/courses/${ANIMATION_ID}/audio/` +
        `random-audio-outcome-${definition.outcome}.mp3`,
      publicPath:
        `/flash-assets/courses/${ANIMATION_ID}/audio/` +
        `random-audio-outcome-${definition.outcome}.mp3`,
      bytes: stream.payload.byteLength,
      sha256: stream.payload.sha256,
      durationMs: 11_180,
      structuralCueFrame: 5,
      runtimeFrameDomain: "sprite-27",
      scenario: "source-static-frame",
      language: "en",
      spokenLanguage: "undetermined",
      deterministicEngineeringSeedBinding: {
        method: "seed-modulo",
        divisor: 2,
        remainder: definition.outcome,
      },
    };
  });
  return {
    animationId: ANIMATION_ID,
    sourceRandomExpression: "random(2)",
    sourceSelectionFrame: 1,
    sourcePlaybackDispatchFrame: 5,
    branches,
  };
}

async function writeAssetNoReplace(root, branch, check) {
  const source = await readBinding(root, branch.sourcePath, branch);
  const absolute = resolveInside(root, branch.outputPath, branch.outputPath);
  try {
    const existing = await readBinding(root, branch.outputPath, branch);
    const metadata = await stat(absolute);
    invariant(
      metadata.nlink === 1 && (metadata.mode & 0o777) === 0o444,
      `${branch.outputPath} immutable output metadata changed`,
    );
    return {...existing, result: "verified-existing"};
  } catch (error) {
    if (error.code !== "ENOENT" || check) throw error;
  }
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${branch.outputPath} output parent is not canonical`,
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
  } finally {
    await handle.close();
  }
  await chmod(absolute, 0o444);
  const written = await readBinding(root, branch.outputPath, branch);
  const metadata = await stat(absolute);
  invariant(
    metadata.nlink === 1 && (metadata.mode & 0o777) === 0o444,
    `${branch.outputPath} was not staged immutably`,
  );
  return {...written, result: "published-no-replace"};
}

function renderMarkdown(report) {
  const rows = report.candidate.branches
    .map(
      (branch) =>
        `| ${branch.outcome} | \`${branch.ownerDomainId}\` | ` +
        `\`${branch.sha256}\` | ${branch.durationMs} | ` +
        `${branch.deterministicEngineeringSeedBinding.remainder} |`,
    )
    .join("\n");
  return `# G4 L3 IR001 current-JavaScript random-audio candidate\n\n` +
    `Two exact embedded MP3 streams are staged without transcoding. The source ` +
    `AVM1 selects one branch with \`random(2)\` and starts it at parent frame 5; ` +
    `the JavaScript engineering candidate uses seed parity only to make both ` +
    `branches reproducible for QA.\n\n` +
    `| Outcome | Source domain | SHA-256 | Duration ms | Seed remainder |\n` +
    `|---:|---|---|---:|---:|\n${rows}\n\n` +
    `This does not establish spoken language, the original runtime's random ` +
    `distribution or call order, authoritative synchronization, listening ` +
    `acceptance, Replay parity, human or Owner acceptance, strict completion, ` +
    `or publication.\n`;
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

export async function materializeG4L3Ir001RandomAudioCandidate({
  root = ROOT,
  check = false,
} = {}) {
  const canonicalRoot = await realpath(root);
  const generatorPath = portable(path.relative(canonicalRoot, SCRIPT_PATH));
  const [generator, ...bindings] = await Promise.all([
    readBinding(canonicalRoot, generatorPath),
    ...SOURCE_BINDINGS.map((item) => readBinding(canonicalRoot, item)),
  ]);
  const [
    releaseLedger,
    embeddedArchive,
    embeddedProbe,
    visualDisposition,
    migration,
  ] = bindings.slice(0, 5).map(({contents}) => JSON.parse(contents));
  const candidate = deriveCandidate({
    releaseLedger,
    embeddedArchive,
    embeddedProbe,
    visualDisposition,
    migration,
  });
  const assets = [];
  for (const branch of candidate.branches) {
    assets.push(await writeAssetNoReplace(canonicalRoot, branch, check));
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ir001-current-js-random-audio-candidate",
    releaseId: RELEASE_ID,
    generator: {
      path: generator.path,
      bytes: generator.bytes,
      sha256: generator.sha256,
    },
    sourceBindings: bindings.map(
      ({path: bindingPath, bytes, sha256: bindingSha256}) => ({
        path: bindingPath,
        bytes,
        sha256: bindingSha256,
      }),
    ),
    authority:
      "Exact-byte source staging plus source-static deterministic engineering branch mapping only",
    authorityBoundary:
      "No spoken-language, natural random distribution, authoritative original-runtime synchronization, listening acceptance, Replay parity, human review, owner acceptance, strict completion, or publication authority.",
    candidate,
    stagedAssets: assets.map(
      ({path: assetPath, bytes, sha256: assetSha256}) => ({
        path: assetPath,
        bytes,
        sha256: assetSha256,
        state: "present-exact-immutable",
      }),
    ),
    summary: {
      candidateMemberCount: 1,
      branchCount: candidate.branches.length,
      stagedAssetCount: assets.length,
      exactSourceBytesPreserved: true,
      transcoded: false,
      browserQaPassed: false,
      strictCompleteCount: 0,
      published: false,
    },
    acceptance: {
      spokenLanguageEstablished: false,
      naturalRandomDistributionEstablished: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      completeListeningAccepted: false,
      replayParityAccepted: false,
      humanReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  await emitDerived(
    canonicalRoot,
    REPORT_JSON,
    Buffer.from(stableJson(report)),
    check,
  );
  await emitDerived(
    canonicalRoot,
    REPORT_MARKDOWN,
    Buffer.from(renderMarkdown(report)),
    check,
  );
  return {
    action: check ? "verified" : "materialized",
    animationId: ANIMATION_ID,
    branchCount: candidate.branches.length,
    stagedAssetCount: assets.length,
    report: REPORT_JSON,
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
  materializeG4L3Ir001RandomAudioCandidate(
    parseArguments(process.argv.slice(2)),
  )
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
