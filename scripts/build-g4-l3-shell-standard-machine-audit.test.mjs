#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDARD_MACHINE_FILES,
  normalizeVersionRecord,
  parseArguments,
} from "./build-g4-l3-shell-standard-machine-audit.mjs";

test("standard shell audit owns only the generic machine evidence filenames", () => {
  assert.deepEqual(STANDARD_MACHINE_FILES, [
    "ffdec-header.txt",
    "ffdec-script-index.txt",
    "ffdec-scripts.txt.gz",
    "ffdec-tags.txt.gz",
    "report.json",
    "swf-frame-domain-candidates.json",
    "swfmill-summary.json",
    "swfmill.xml.gz",
  ]);
  assert.equal(STANDARD_MACHINE_FILES.some((name) => name.startsWith("g4-l3-")), false);
});

test("live tool output normalization keeps only the executed version line", () => {
  assert.equal(
    normalizeVersionRecord("ffdec", "prefix\nJPEXS Free Flash Decompiler v.26.2.1\nsuffix", /JPEXS Free Flash Decompiler v\.[^\n]+/).version,
    "JPEXS Free Flash Decompiler v.26.2.1",
  );
  assert.equal(
    normalizeVersionRecord("python3", "Python 3.13.5\r\n", /Python [^\n]+/).version,
    "Python 3.13.5",
  );
  assert.throws(() => normalizeVersionRecord("java", "unknown", /java version/), /did not match/);
});

test("CLI accepts only check/help switches", () => {
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--id", "x"]), /Unknown option/);
});
