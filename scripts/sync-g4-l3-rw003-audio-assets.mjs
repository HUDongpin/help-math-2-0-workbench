#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g04-l03-rw-003";
const FRAME_DOMAIN = "sprite-49";
const GENERATOR_RELATIVE =
  "scripts/sync-g4-l3-rw003-audio-assets.mjs";
const OUTPUT_PREFIX =
  `public/flash-assets/courses/${ANIMATION_ID}/audio/`;
const MANIFEST_RELATIVE = `${OUTPUT_PREFIX}manifest.json`;
const NOFOLLOW = fsConstants.O_NOFOLLOW ?? 0;

export const RW003_AUDIO_ENTRIES = Object.freeze([
  Object.freeze({
    id: "embedded-stream-0001",
    role: "source-timeline-stream",
    source:
      "artifacts/g4-l3-embedded-audio/sha256/aa/aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2.mp3",
    output: `${OUTPUT_PREFIX}embedded-stream-0001.mp3`,
    publicUrl:
      `/flash-assets/courses/${ANIMATION_ID}/audio/embedded-stream-0001.mp3`,
    bytes: 112_190,
    sha256:
      "aab5bc0e259d399db150b266423be6a25161533bc094d081ec5729ec234af8f2",
    codec: "mp3",
    sampleRateHz: 22_050,
    channels: 1,
    durationMs: 22_438,
    languageCandidate: "en",
    languageEstablished: false,
    frameMapping: Object.freeze({
      frameDomain: FRAME_DOMAIN,
      headFrame: 1,
      firstBlockFrame: 8,
      lastBlockFrame: 278,
      sourceBlockCount: 271,
      activation: "source-timeline",
    }),
  }),
  Object.freeze({
    id: "spanish-host-narration",
    role: "catalog-associated-host-audio",
    source:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW03.mp3",
    output: `${OUTPUT_PREFIX}spanish-host-narration.mp3`,
    publicUrl:
      `/flash-assets/courses/${ANIMATION_ID}/audio/spanish-host-narration.mp3`,
    bytes: 251_328,
    sha256:
      "ea0a0922b90a9e612814a4b69ede2b687660b1e0adeadac91870e77f092f0975",
    codec: "mp3",
    sampleRateHz: 48_000,
    channels: 1,
    durationMs: 17_952,
    languageCandidate: "es",
    languageEstablished: false,
    frameMapping: Object.freeze({
      frameDomain: FRAME_DOMAIN,
      headFrame: null,
      firstBlockFrame: null,
      lastBlockFrame: null,
      sourceBlockCount: null,
      activation: "host-user-activated-candidate",
    }),
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

function validateEntry(entry, {
  animationId,
  frameDomain,
  outputPrefix,
}) {
  invariant(
    /^[a-z0-9][a-z0-9-]*$/u.test(entry?.id ?? "") &&
      ["source-timeline-stream", "catalog-associated-host-audio"]
        .includes(entry.role),
    "RW003 audio entry identity or role is invalid",
  );
  invariant(
    (entry.source.startsWith("artifacts/g4-l3-embedded-audio/") ||
      entry.source.startsWith(
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/",
      )) &&
      entry.output.startsWith(outputPrefix) &&
      entry.publicUrl === `/${entry.output.replace(/^public\//u, "")}`,
    `${entry.id}: source or output path is outside the ${animationId} contract`,
  );
  invariant(
    Number.isSafeInteger(entry.bytes) &&
      entry.bytes > 0 &&
      /^[a-f0-9]{64}$/u.test(entry.sha256 ?? "") &&
      entry.codec === "mp3" &&
      Number.isSafeInteger(entry.sampleRateHz) &&
      entry.sampleRateHz > 0 &&
      Number.isSafeInteger(entry.channels) &&
      entry.channels > 0 &&
      Number.isSafeInteger(entry.durationMs) &&
      entry.durationMs > 0,
    `${entry.id}: byte, hash, or media binding is invalid`,
  );
  invariant(
    ["en", "es"].includes(entry.languageCandidate) &&
      entry.languageEstablished === false &&
      entry.frameMapping?.frameDomain === frameDomain,
    `${entry.id}: language or frame-domain evidence boundary is invalid`,
  );
}

async function readStableRegular(root, relativePath, {
  expected,
  requireSingleLink = false,
  requireMode = null,
} = {}) {
  const absolute = resolveInside(root, relativePath, relativePath);
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${relativePath} parent is not canonical`,
  );
  const handle = await open(absolute, fsConstants.O_RDONLY | NOFOLLOW);
  let before;
  let bytes;
  let after;
  try {
    before = await handle.stat();
    invariant(before.isFile(),
      `${relativePath} must be a regular file`);
    if (requireSingleLink) {
      invariant(before.nlink === 1,
        `${relativePath} must have one hard link`);
    }
    if (requireMode !== null) {
      invariant((before.mode & 0o777) === requireMode,
        `${relativePath} mode drifted`);
    }
    bytes = await handle.readFile();
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
    `${relativePath} identity changed while reading`,
  );
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: before.mode & 0o777,
    nlink: before.nlink,
    contents: bytes,
  };
  if (expected) {
    invariant(
      binding.bytes === expected.bytes &&
        binding.sha256 === expected.sha256,
      `${relativePath} differs from its exact-byte binding`,
    );
  }
  return binding;
}

async function writeNoReplace(root, relativePath, bytes) {
  const absolute = resolveInside(root, relativePath, relativePath);
  await mkdir(path.dirname(absolute), {recursive: true});
  invariant(
    await realpath(path.dirname(absolute)) === path.dirname(absolute),
    `${relativePath} output parent is not canonical`,
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
    await handle.writeFile(bytes);
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
  return readStableRegular(root, relativePath, {
    expected: {bytes: bytes.length, sha256: sha256(bytes)},
    requireSingleLink: true,
    requireMode: 0o444,
  });
}

async function ensurePublished(root, relativePath, bytes, check) {
  try {
    return await readStableRegular(root, relativePath, {
      expected: {bytes: bytes.length, sha256: sha256(bytes)},
      requireSingleLink: true,
      requireMode: 0o444,
    });
  } catch (error) {
    if (error.code !== "ENOENT" || check) throw error;
  }
  return writeNoReplace(root, relativePath, bytes);
}

export async function syncRw003AudioAssets({
  root = ROOT,
  check = false,
  animationId = ANIMATION_ID,
  frameDomain = FRAME_DOMAIN,
  entries = RW003_AUDIO_ENTRIES,
  generatorRelative = GENERATOR_RELATIVE,
  outputPrefix =
    `public/flash-assets/courses/${animationId}/audio/`,
  manifestRelative = `${outputPrefix}manifest.json`,
} = {}) {
  invariant(
    Array.isArray(entries) &&
      entries.length === 2 &&
      new Set(entries.map(({id}) => id)).size === 2,
    "RW003 audio asset set must contain two unique entries",
  );
  entries.forEach((entry) =>
    validateEntry(entry, {animationId, frameDomain, outputPrefix})
  );
  const generatorBytes = await readFile(
    resolveInside(root, generatorRelative, "audio generator"),
  );
  const generator = {
    path: generatorRelative,
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  };
  const sources = [];
  for (const entry of entries) {
    const source = await readStableRegular(root, entry.source, {
      expected: entry,
    });
    sources.push({entry, source});
  }
  const manifest = {
    schemaVersion: 1,
    reportType: "g4-l3-rw003-current-javascript-audio-assets",
    animationId,
    generator,
    authority: "Byte-identical source-audio staging and source-frame mapping only",
    authorityBoundary:
      "This manifest does not establish spoken language, authorized original-runtime reachability or synchronization, audible quality, Replay parity, audio listening acceptance, visual parity, human review, owner acceptance, strict completion, or publication.",
    entries: entries.map((entry) => ({
      ...entry,
      sourceBytesPreserved: true,
      transcoded: false,
      authoritativeOriginalRuntimeSynchronizationEstablished: false,
      listeningAcceptanceEstablished: false,
      strictAcceptanceEffect: "none",
    })),
    acceptance: {
      audioListeningAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
  const manifestBytes = Buffer.from(stableJson(manifest));
  const outputs = [];
  for (const {entry, source} of sources) {
    outputs.push(
      await ensurePublished(
        root,
        entry.output,
        source.contents,
        check,
      ),
    );
  }
  const manifestOutput = await ensurePublished(
    root,
    manifestRelative,
    manifestBytes,
    check,
  );
  return {
    action: check ? "verified" : "synchronized",
    animationId,
    outputs: outputs.map(({path: output, bytes, sha256: hash}) => ({
      path: output,
      bytes,
      sha256: hash,
    })),
    manifest: {
      path: manifestOutput.path,
      bytes: manifestOutput.bytes,
      sha256: manifestOutput.sha256,
    },
    sourceBytesPreserved: true,
    transcoded: false,
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "Usage: node scripts/sync-g4-l3-rw003-audio-assets.mjs [--check]\n",
    );
    return;
  }
  process.stdout.write(
    stableJson(await syncRw003AudioAssets({check: options.check})),
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
