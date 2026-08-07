import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {parseArguments, stageAnimateFlaCopies} from "./stage-animate-pilot-fla-copies.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "animate-fla-copies-"));
  const source = "source-assets/flash/Test.fla";
  const bytes = Buffer.from("legacy-fla-bytes");
  const pilot = {id: "pilot-fla", fla: source, swf: "source-assets/flash/Test.swf"};
  await mkdir(path.join(root, "source-assets", "flash"), {recursive: true});
  await mkdir(path.join(root, "migrations", pilot.id), {recursive: true});
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await writeFile(path.join(root, source), bytes);
  await writeFile(path.join(root, pilot.swf), "swf");
  await writeFile(path.join(root, "scripts", "stage-animate-pilot-fla-copies.mjs"), "fixture-generator");
  await writeFile(path.join(root, "migrations", pilot.id, "migration.json"), JSON.stringify({
    source: {fla: source, flaSha256: hash(bytes)},
  }));
  return {root, pilot, bytes, outputRoot: path.join(root, "work", "animate", "read-only-fla-copies")};
}

test("parseArguments exposes only fixed staging and check controls", () => {
  const parsed = parseArguments(["--check", "--output", "/tmp/animate-copies"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.outputRoot, "/tmp/animate-copies");
  assert.throws(() => parseArguments(["--source", "/tmp/source"]), /Unknown option/);
});

test("stages byte-identical read-only copies and verifies the deterministic manifest", async () => {
  const context = await fixture();
  const result = await stageAnimateFlaCopies({...context, pilots: [context.pilot]});
  assert.equal(result.manifest.summary.copiesReady, 1);
  const entry = result.manifest.entries[0];
  assert.equal(entry.workingCopy.sha256, hash(context.bytes));
  assert.equal(entry.workingCopy.readOnly, true);
  const info = await import("node:fs/promises").then(({stat}) => stat(path.join(context.root, entry.workingCopy.file)));
  assert.equal(info.mode & 0o222, 0);
  await stageAnimateFlaCopies({...context, pilots: [context.pilot], check: true});
});

test("check mode rejects a writable or changed working copy", async () => {
  const context = await fixture();
  const {manifest} = await stageAnimateFlaCopies({...context, pilots: [context.pilot]});
  const copy = path.join(context.root, manifest.entries[0].workingCopy.file);
  await chmod(copy, 0o644);
  await assert.rejects(
    stageAnimateFlaCopies({...context, pilots: [context.pilot], check: true}),
    /working copy is writable/,
  );
  await writeFile(copy, "changed");
  await chmod(copy, 0o444);
  await assert.rejects(
    stageAnimateFlaCopies({...context, pilots: [context.pilot], check: true}),
    /working copy differs from source FLA/,
  );
});

