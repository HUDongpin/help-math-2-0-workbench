#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const DEFAULT_SOURCE = "/tmp/help-math-vercel-dry-final-v4.json";
const DEFAULT_OUTPUT = resolve(
  "reports/help-math-learning-platform-upload-records-2026-08-14-v2.json",
);

const EXPECTED = Object.freeze({
  entries: 1405,
  directories: 33,
  regularFiles: 1372,
  regularBytes: 377_682_526,
  symlinks: 0,
  closureSha256:
    "2631e0dc81a3ce3ebdea7ea42a0694629c579e271d6ebca6f9744dd9d9a0e3dd",
});

const sourcePath = resolve(process.argv[2] ?? DEFAULT_SOURCE);
const outputPath = resolve(process.argv[3] ?? DEFAULT_OUTPUT);
const sidecarPath = `${outputPath.replace(/\.json$/u, "")}.sha256`;

const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

const compareUtf8Paths = (left, right) =>
  Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"));

const fail = (message) => {
  throw new Error(`upload-record generation refused: ${message}`);
};

const sourceBytes = readFileSync(sourcePath);
const source = JSON.parse(sourceBytes.toString("utf8"));

if (!Array.isArray(source.files)) {
  fail("source .files is not an array");
}

const records = source.files
  .map((entry, index) => {
    if (
      entry === null ||
      typeof entry !== "object" ||
      typeof entry.path !== "string" ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      !Number.isSafeInteger(entry.mode) ||
      entry.mode < 0 ||
      (entry.sha !== undefined &&
        (typeof entry.sha !== "string" || !/^[0-9a-f]{40}$/u.test(entry.sha)))
    ) {
      fail(`invalid .files[${index}] record`);
    }

    return {
      path: entry.path,
      size: entry.size,
      mode: entry.mode,
      sha: entry.sha ?? null,
    };
  })
  .sort(compareUtf8Paths);

const duplicatePaths = records
  .filter((entry, index) => index > 0 && entry.path === records[index - 1].path)
  .map((entry) => entry.path);
if (duplicatePaths.length > 0) {
  fail(`duplicate paths: ${duplicatePaths.join(", ")}`);
}

const directories = records.filter(
  (entry) => (entry.mode & 0o170000) === 0o040000,
);
const regularFiles = records.filter(
  (entry) => (entry.mode & 0o170000) === 0o100000,
);
const symlinks = records.filter(
  (entry) => (entry.mode & 0o170000) === 0o120000,
);
const unknownTypes = records.filter(
  (entry) =>
    ![0o040000, 0o100000, 0o120000].includes(entry.mode & 0o170000),
);
const regularBytes = regularFiles.reduce((total, entry) => total + entry.size, 0);

const summary = {
  entries: records.length,
  directories: directories.length,
  regularFiles: regularFiles.length,
  regularBytes,
  symlinks: symlinks.length,
};

for (const [key, expectedValue] of Object.entries(EXPECTED)) {
  if (key === "closureSha256") continue;
  if (summary[key] !== expectedValue) {
    fail(`${key} expected ${expectedValue}, got ${summary[key]}`);
  }
}

if (unknownTypes.length > 0) {
  fail(`encountered ${unknownTypes.length} unsupported filesystem entries`);
}

if (directories.some((entry) => entry.sha !== null)) {
  fail("a directory unexpectedly has a content digest");
}
if (regularFiles.some((entry) => entry.sha === null)) {
  fail("a regular file is missing its Vercel content digest");
}

const restrictedExactPaths = new Set([
  "All API Keys.docx",
  ".env.local",
  "apps/web/.env.local",
  "HELP MATH_ORIGINAL FILES",
]);
const restrictedDescendantRoots = [
  "design/",
  "migrations/",
  "output/",
  "outputs/",
  "private-archive/",
  "source-assets/",
];
const allowedPublicConfigTemplates = new Set(["apps/web/.env.example"]);
const sensitivePathPattern =
  /(^|\/)(?:\.env(?:\.[^/]*)?|all api keys\.docx|[^/]*(?:credential|password|secret|private[-_ ]?key)[^/]*)$/iu;

const unsafePaths = records
  .map((entry) => entry.path)
  .filter(
    (path) =>
      restrictedExactPaths.has(path) ||
      restrictedDescendantRoots.some((root) => path.startsWith(root)) ||
      (sensitivePathPattern.test(path) && !allowedPublicConfigTemplates.has(path)),
  );
if (unsafePaths.length > 0) {
  fail(`restricted or sensitive paths: ${unsafePaths.join(", ")}`);
}

const canonicalBytes = Buffer.from(JSON.stringify(records), "utf8");
const closureSha256 = sha256(canonicalBytes);
if (closureSha256 !== EXPECTED.closureSha256) {
  fail(
    `closure SHA-256 expected ${EXPECTED.closureSha256}, got ${closureSha256}`,
  );
}

// The persistent artifact is the canonical compact JSON itself. It deliberately
// contains only the four allowlisted fields and never copies source.ignored or
// any other dry-manifest metadata.
writeFileSync(outputPath, canonicalBytes, { flag: "wx", mode: 0o444 });

const artifactSha256 = sha256(canonicalBytes);
const sidecarBytes = Buffer.from(
  `${artifactSha256}  ${basename(outputPath)}\n`,
  "utf8",
);
writeFileSync(sidecarPath, sidecarBytes, { flag: "wx", mode: 0o444 });

process.stdout.write(
  `${JSON.stringify(
    {
      sourcePath,
      sourceSha256: sha256(sourceBytes),
      outputPath,
      sidecarPath,
      ...summary,
      closureSha256,
      artifactSha256,
    },
    null,
    2,
  )}\n`,
);
