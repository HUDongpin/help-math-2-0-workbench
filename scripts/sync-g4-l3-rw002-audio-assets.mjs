#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {
  chmod,
  link,
  lstat,
  mkdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_RELATIVE =
  "scripts/sync-g4-l3-rw002-audio-assets.mjs";
const MANIFEST_RELATIVE =
  "public/flash-assets/courses/course-g04-l03-rw-002/audio/manifest.json";

export const RW002_AUDIO_ENTRIES = Object.freeze([
  Object.freeze({
    id: "embedded-stream-0001",
    role: "source-timeline-stream",
    source:
      "artifacts/g4-l3-embedded-audio/sha256/76/7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c.mp3",
    output:
      "public/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
    publicUrl:
      "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3",
    bytes: 319_566,
    sha256:
      "7616d349bf0b7e8122a3e82fb35da28fca538aa2907326ce5299b1e6b42ac46c",
    codec: "mp3",
    sampleRateHz: 22_050,
    channels: 1,
    durationMs: 106_522,
    languageCandidate: "en",
    languageEstablished: false,
    frameMapping: Object.freeze({
      frameDomain: "sprite-421",
      headFrame: 1,
      firstBlockFrame: 1,
      lastBlockFrame: 1289,
      sourceBlockCount: 1286,
      activation: "source-timeline",
    }),
  }),
  Object.freeze({
    id: "spanish-host-narration",
    role: "catalog-associated-host-audio",
    source:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3RW02.mp3",
    output:
      "public/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
    publicUrl:
      "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3",
    bytes: 405_888,
    sha256:
      "79d0b6504a0d8bb66e3a7a19a5156ab35a49271fdbaab40033c0dda5600a627e",
    codec: "mp3",
    sampleRateHz: 48_000,
    channels: 1,
    durationMs: 28_992,
    languageCandidate: "es",
    languageEstablished: false,
    frameMapping: Object.freeze({
      frameDomain: "sprite-421",
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

function resolveInside(root, relative, label) {
  invariant(
    typeof relative === "string" &&
      relative.length > 0 &&
      !path.isAbsolute(relative),
    `${label} must be a project-relative path`,
  );
  const absolute = path.resolve(root, relative);
  const resolvedRelative = path.relative(root, absolute);
  invariant(
    resolvedRelative &&
      !resolvedRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(resolvedRelative),
    `${label} escapes the project root`,
  );
  return absolute;
}

function validateEntry(entry) {
  invariant(
    /^[a-z0-9][a-z0-9-]*$/.test(entry?.id ?? ""),
    "audio entry id is invalid",
  );
  invariant(
    ["source-timeline-stream", "catalog-associated-host-audio"].includes(
      entry.role,
    ),
    `${entry.id}: audio role is invalid`,
  );
  invariant(
    (entry.source.startsWith("artifacts/g4-l3-embedded-audio/") ||
      entry.source.startsWith(
        "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/",
      )) &&
      entry.output.startsWith(
        "public/flash-assets/courses/course-g04-l03-rw-002/audio/",
      ) &&
      entry.publicUrl === `/${entry.output.replace(/^public\//, "")}`,
    `${entry.id}: source or output path is outside the RW002 audio contract`,
  );
  invariant(
    Number.isSafeInteger(entry.bytes) &&
      entry.bytes > 0 &&
      /^[a-f0-9]{64}$/.test(entry.sha256 ?? ""),
    `${entry.id}: byte/hash binding is invalid`,
  );
  invariant(
    entry.codec === "mp3" &&
      Number.isSafeInteger(entry.sampleRateHz) &&
      entry.sampleRateHz > 0 &&
      Number.isSafeInteger(entry.channels) &&
      entry.channels > 0 &&
      Number.isSafeInteger(entry.durationMs) &&
      entry.durationMs > 0,
    `${entry.id}: technical media facts are invalid`,
  );
  invariant(
    ["en", "es"].includes(entry.languageCandidate) &&
      entry.languageEstablished === false,
    `${entry.id}: language evidence boundary is invalid`,
  );
  invariant(
    entry.frameMapping?.frameDomain === "sprite-421",
    `${entry.id}: frame-domain binding is invalid`,
  );
  return entry;
}

async function readVerifiedRegularFile(root, descriptor, label) {
  const absolute = resolveInside(root, descriptor.path, label);
  const file = await lstat(absolute);
  invariant(
    file.isFile() && !file.isSymbolicLink(),
    `${label} must be a regular non-symlink file`,
  );
  const bytes = await readFile(absolute);
  invariant(
    bytes.length === descriptor.bytes && sha256(bytes) === descriptor.sha256,
    `${label} byte/hash binding changed`,
  );
  return {absolute, bytes};
}

async function verifyPublishedFile(root, entry) {
  const absolute = resolveInside(root, entry.output, `${entry.id} output`);
  const file = await lstat(absolute);
  invariant(
    file.isFile() && !file.isSymbolicLink(),
    `${entry.id}: public output must be a regular non-symlink file`,
  );
  invariant(
    (await stat(absolute)).nlink === 1,
    `${entry.id}: public output must have exactly one hard link`,
  );
  const bytes = await readFile(absolute);
  invariant(
    bytes.length === entry.bytes && sha256(bytes) === entry.sha256,
    `${entry.id}: public output differs from its source bytes`,
  );
  return bytes;
}

async function publishNoReplace(root, entry, bytes) {
  const output = resolveInside(root, entry.output, `${entry.id} output`);
  await mkdir(path.dirname(output), {recursive: true});
  try {
    await verifyPublishedFile(root, entry);
    return "already-present-and-verified";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${output}.pending-${randomUUID()}`;
  await writeFile(temporary, bytes, {flag: "wx", mode: 0o600});
  try {
    invariant(
      (await readFile(temporary)).equals(bytes),
      `${entry.id}: staged output verification failed`,
    );
    await link(temporary, output);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  await chmod(output, 0o444);
  await verifyPublishedFile(root, entry);
  return "published-no-replace";
}

async function publishManifestNoReplace(root, relative, bytes) {
  const output = resolveInside(root, relative, "audio manifest output");
  await mkdir(path.dirname(output), {recursive: true});
  try {
    const file = await lstat(output);
    invariant(
      file.isFile() && !file.isSymbolicLink() && (await stat(output)).nlink === 1,
      "audio manifest output must be a regular single-link file",
    );
    invariant(
      (await readFile(output)).equals(bytes),
      "audio manifest exists with different immutable bytes",
    );
    return "already-present-and-verified";
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temporary = `${output}.pending-${randomUUID()}`;
  await writeFile(temporary, bytes, {flag: "wx", mode: 0o600});
  try {
    await link(temporary, output);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  await chmod(output, 0o444);
  return "published-no-replace";
}

export async function syncRw002AudioAssets({
  root = ROOT,
  check = false,
  entries = RW002_AUDIO_ENTRIES,
  generatorRelative = GENERATOR_RELATIVE,
  manifestRelative = MANIFEST_RELATIVE,
} = {}) {
  invariant(
    Array.isArray(entries) &&
      entries.length === 2 &&
      new Set(entries.map((entry) => entry.id)).size === entries.length,
    "RW002 audio asset set must contain two unique entries",
  );
  entries.forEach(validateEntry);
  const generatorPath = resolveInside(
    root,
    generatorRelative,
    "audio generator",
  );
  const generatorBytes = await readFile(generatorPath);
  const generator = {
    path: portable(path.relative(root, generatorPath)),
    bytes: generatorBytes.length,
    sha256: sha256(generatorBytes),
  };
  const verifiedSources = [];
  for (const entry of entries) {
    const {bytes} = await readVerifiedRegularFile(
      root,
      {path: entry.source, bytes: entry.bytes, sha256: entry.sha256},
      `${entry.id} source`,
    );
    verifiedSources.push({entry, bytes});
  }
  const manifest = Object.freeze({
    schemaVersion: 1,
    reportType: "g4-l3-rw002-current-javascript-audio-assets",
    animationId: "course-g04-l03-rw-002",
    generator,
    authority:
      "Byte-identical source-audio staging and source-frame mapping only",
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
  });
  const manifestBytes = Buffer.from(stableJson(manifest));
  if (check) {
    for (const {entry} of verifiedSources) {
      await verifyPublishedFile(root, entry);
    }
    const actualManifest = await readFile(
      resolveInside(root, manifestRelative, "audio manifest output"),
    );
    invariant(
      actualManifest.equals(manifestBytes),
      "RW002 audio asset manifest is stale",
    );
    return {
      check: true,
      entries: entries.length,
      manifest: manifestRelative,
      manifestSha256: sha256(manifestBytes),
      strictAcceptanceEffect: "none",
    };
  }
  const results = [];
  for (const {entry, bytes} of verifiedSources) {
    results.push({
      id: entry.id,
      result: await publishNoReplace(root, entry, bytes),
    });
  }
  const manifestResult = await publishManifestNoReplace(
    root,
    manifestRelative,
    manifestBytes,
  );
  return {
    check: false,
    entries: entries.length,
    results,
    manifest: manifestRelative,
    manifestResult,
    manifestSha256: sha256(manifestBytes),
    strictAcceptanceEffect: "none",
  };
}

function parseArguments(argv) {
  const unknown = argv.filter((argument) => argument !== "--check");
  invariant(unknown.length === 0, `Unknown argument(s): ${unknown.join(", ")}`);
  return {check: argv.includes("--check")};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  process.stdout.write(
    `${JSON.stringify(await syncRw002AudioAssets(options), null, 2)}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
