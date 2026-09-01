import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {access, mkdir, mkdtemp, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_MAPPING,
  DEFAULT_PROFILE,
  parseArguments,
  runAudit,
  verifySourceWitnesses,
} from "./audit-shared-source.mjs";

test("CLI defaults to a non-mutating check and reports missing private source gracefully", async () => {
  const options = parseArguments(["--check"]);
  assert.equal(options.mode, "check");
  assert.equal(options.profile, DEFAULT_PROFILE);
  assert.equal(options.mapping, DEFAULT_MAPPING);
  const result = await runAudit(options);
  assert.equal(result.status, "blocked");
  assert.equal(result.code, "BLOCKED_EXTERNAL_SOURCE_ROOT_MISSING");
});

test("CLI rejects conflicting modes and unsafe write invocation", () => {
  assert.throws(() => parseArguments(["--check", "--write"]), /exactly one/u);
  assert.throws(() => parseArguments(["--write"]), /--write requires --output/u);
  assert.throws(() => parseArguments(["--write", "--output", "/tmp/out.json"]), /--write requires --source-root/u);
});

test("CLI write fails closed when the private source root is unavailable", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-cli-fixture-"));
  const output = path.join(root, "catalog.json");
  try {
    const source = path.join(root, "missing-source");
    const writeOptions = parseArguments(["--write", "--source-root", source, "--output", output]);
    await assert.rejects(() => runAudit(writeOptions), /BLOCKED_EXTERNAL_SOURCE_ROOT_MISSING/u);
    assert.equal(await access(output).then(() => true).catch(() => false), false);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("strict source audit discovers and verifies sibling classification witnesses", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-witness-fixture-"));
  const shared = path.join(root, "G6-G8-shared");
  await mkdir(shared, {recursive: true});
  const contents = {
    "README.md": "readme\n",
    "classification-summary.json": "{}\n",
    "classification-manifest.jsonl": "{\"path\":\"fixture\"}\n",
    "conflicts.jsonl": "",
    "missing-dependencies.jsonl": "",
  };
  const witnesses = {};
  for (const [name, value] of Object.entries(contents)) {
    await writeFile(path.join(root, name), value);
    witnesses[name] = createHash("sha256").update(value).digest("hex");
  }
  t.after(() => rm(root, {recursive: true, force: true}));
  const verified = await verifySourceWitnesses({
    sourceRoot: shared,
    profile: {witnesses},
    options: {strictCounts: true, requireSource: true, classificationManifest: null, dependencyManifest: null},
  });
  assert.equal(Object.keys(verified).length, 5);
  assert.equal(verified["classification-manifest.jsonl"].sha256, witnesses["classification-manifest.jsonl"]);
});

test("strict source audit rejects a missing or drifted required witness", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "g678-witness-drift-"));
  const shared = path.join(root, "G6-G8-shared");
  await mkdir(shared, {recursive: true});
  const profile = {witnesses: {
    "classification-manifest.jsonl": "a".repeat(64),
    "missing-dependencies.jsonl": "b".repeat(64),
  }};
  await writeFile(path.join(root, "classification-manifest.jsonl"), "drift\n");
  t.after(() => rm(root, {recursive: true, force: true}));
  await assert.rejects(
    () => verifySourceWitnesses({
      sourceRoot: shared,
      profile,
      options: {strictCounts: true, requireSource: true, classificationManifest: null, dependencyManifest: null},
    }),
    /G678_WITNESS_HASH_DRIFT|G678_WITNESS_REQUIRED/u,
  );
});
