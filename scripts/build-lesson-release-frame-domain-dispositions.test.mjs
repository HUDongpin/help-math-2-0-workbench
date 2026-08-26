import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArguments,
  toExactReleaseCoreOptions,
} from "./build-lesson-release-frame-domain-dispositions.mjs";

test("parses only explicit exact-release frame-domain operations", () => {
  assert.deepEqual(
    parseArguments([
      "--release-id",
      "lesson-g05-l04-number-lines",
      "--check",
    ]),
    {
      check: true,
      help: false,
      releaseId: "lesson-g05-l04-number-lines",
    },
  );
  assert.deepEqual(parseArguments(["--help"]), {
    check: false,
    help: true,
    releaseId: "",
  });
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id"]),
    /--release-id requires a value/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id",
      "lesson-g05-l04-number-lines",
      "--release-id",
      "lesson-g05-l05-add-subtract-negative-numbers",
    ]),
    /--release-id must not be repeated/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id",
      "lesson-g05-l04-number-lines",
      "--id",
      "course-g05-l04-rw-002",
    ]),
    /Unknown option: --id/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id",
      "lesson-g05-l04-number-lines",
      "--allowFullReleaseSelection",
    ]),
    /Unknown option: --allowFullReleaseSelection/,
  );
});

test("converts release-only input to the guarded internal full-release authority", () => {
  assert.deepEqual(
    toExactReleaseCoreOptions({
      check: true,
      releaseId: "lesson-g05-l04-number-lines",
    }),
    {
      allowFullReleaseSelection: true,
      check: true,
      ids: [],
      releaseId: "lesson-g05-l04-number-lines",
    },
  );
  assert.throws(
    () => toExactReleaseCoreOptions({check: true}),
    /exact releaseId is required/,
  );
});
