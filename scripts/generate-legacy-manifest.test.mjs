import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { generateLegacyManifest } from "./generate-legacy-manifest.mjs";

test("writes deterministic CSV, JSON, and SHA256 inventories without changing source files", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-legacy-manifest-"));
  const source = path.join(temporaryRoot, "HELP MATH_ORIGINAL FILES");
  const output = path.join(temporaryRoot, "manifest");

  try {
    await mkdir(path.join(source, "nested"), { recursive: true });
    const firstPath = path.join(source, "alpha,one.fla");
    const secondPath = path.join(source, "nested", 'beta"two.swf');
    await writeFile(firstPath, "original FLA bytes");
    await writeFile(secondPath, "original SWF bytes");
    const sourceBefore = {
      first: await readFile(firstPath),
      second: await readFile(secondPath),
      firstMtime: (await stat(firstPath)).mtimeMs,
      secondMtime: (await stat(secondPath)).mtimeMs,
    };

    const result = await generateLegacyManifest({
      source,
      csv: `${output}.csv`,
      json: `${output}.json`,
      sha256: `${output}.sha256`,
      concurrency: 2,
      generatedAt: "2026-07-21T00:00:00.000Z",
    });

    assert.equal(result.fileCount, 2);
    assert.equal(result.totalBytes, sourceBefore.first.length + sourceBefore.second.length);
    assert.deepEqual(result.files.map((file) => file.path), ["alpha,one.fla", 'nested/beta"two.swf']);

    const firstHash = createHash("sha256").update(sourceBefore.first).digest("hex");
    const secondHash = createHash("sha256").update(sourceBefore.second).digest("hex");
    assert.equal(
      await readFile(`${output}.sha256`, "utf8"),
      `${firstHash}  alpha,one.fla\n${secondHash}  nested/beta"two.swf\n`,
    );

    const json = JSON.parse(await readFile(`${output}.json`, "utf8"));
    assert.equal(json.schemaVersion, 1);
    assert.equal(json.generatedAt, "2026-07-21T00:00:00.000Z");
    assert.equal(json.sourceDirectory, "HELP MATH_ORIGINAL FILES");
    assert.equal(json.fileCount, 2);
    assert.match(json.checksumSetSha256, /^[a-f0-9]{64}$/);
    assert.equal(json.files[0].sha256, firstHash);

    const csv = await readFile(`${output}.csv`, "utf8");
    assert.match(csv, /^path,bytes,sha256\n/);
    assert.match(csv, /"alpha,one\.fla",18,/);
    assert.match(csv, /"nested\/beta""two\.swf",18,/);

    assert.deepEqual(await readFile(firstPath), sourceBefore.first);
    assert.deepEqual(await readFile(secondPath), sourceBefore.second);
    assert.equal((await stat(firstPath)).mtimeMs, sourceBefore.firstMtime);
    assert.equal((await stat(secondPath)).mtimeMs, sourceBefore.secondMtime);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("refuses to write generated files inside the legacy source directory", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-legacy-boundary-"));
  const source = path.join(temporaryRoot, "HELP MATH_ORIGINAL FILES");

  try {
    await mkdir(source, { recursive: true });
    await writeFile(path.join(source, "evidence.fla"), "untouched");

    await assert.rejects(
      generateLegacyManifest({ source, json: path.join(source, "manifest.json") }),
      /Refusing to write a manifest inside the legacy source directory/,
    );
    await assert.rejects(
      generateLegacyManifest({ source, csv: "same", json: "same" }),
      /must use different paths/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("safely follows a top-level source alias but rejects output through that alias", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-legacy-alias-"));
  const actualSource = path.join(temporaryRoot, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const sourceAlias = path.join(temporaryRoot, "HELP MATH_ORIGINAL FILES");

  try {
    await mkdir(actualSource, { recursive: true });
    await writeFile(path.join(actualSource, "evidence.swf"), "FWS evidence");
    await symlink(actualSource, sourceAlias, "dir");

    const result = await generateLegacyManifest({
      source: sourceAlias,
      json: path.join(temporaryRoot, "manifest.json"),
    });
    assert.equal(result.fileCount, 1);
    assert.equal(result.sourceRoot, sourceAlias);
    assert.equal(result.resolvedSourceRoot, await realpath(actualSource));

    await assert.rejects(
      generateLegacyManifest({ source: sourceAlias, json: path.join(sourceAlias, "nested", "manifest.json") }),
      /Refusing to write a manifest inside the legacy source directory/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
