import assert from "node:assert/strict";
import test from "node:test";

import {
  OUTPUTS,
  parseMode,
  privateSessionTransportDescriptor,
} from "./run-g4-l3-g5-l4-private-preview-captures-2026-08-08-r3.mjs";

test("r3 uses two new non-overlapping output roots", () => {
  assert.equal(OUTPUTS.length, 2);
  assert.equal(new Set(OUTPUTS.map((entry) => entry.outputRoot)).size, 2);
  assert.ok(OUTPUTS.every((entry) => entry.outputRoot.includes("-r7") || entry.outputRoot.includes("-r3")));
});

test("r3 transport is exact-loopback and never records a credential", () => {
  const transport = privateSessionTransportDescriptor("http://127.0.0.1:43123");
  assert.equal(transport.credentialRecorded, false);
  assert.equal(transport.publicBypassCreated, false);
  assert.throws(() => privateSessionTransportDescriptor("https://example.test"), /exact credential-free/);
});

test("r3 requires an explicit run mode", () => {
  assert.equal(parseMode(["--run"]), "run");
  assert.throws(() => parseMode([]), /exactly/);
  assert.throws(() => parseMode(["--check"]), /exactly/);
});
