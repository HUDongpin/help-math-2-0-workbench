import assert from "node:assert/strict";
import {access, mkdtemp, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DEFAULT_MAPPING,
  DEFAULT_PROFILE,
  parseArguments,
  runAudit,
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
