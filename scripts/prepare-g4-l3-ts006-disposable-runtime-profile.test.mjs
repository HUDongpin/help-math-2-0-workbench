import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, readFile, readdir} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  parseArguments,
  prepareDisposableRuntimeProfile,
  validateDisposableProfileManifest,
} from "./prepare-g4-l3-ts006-disposable-runtime-profile.mjs";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function refingerprint(manifest) {
  const {manifestFingerprintSha256: _discarded, ...withoutFingerprint} = manifest;
  manifest.manifestFingerprintSha256 = sha256(stable(withoutFingerprint));
  return manifest;
}

test("TS006 disposable profile parser requires a language-bound unique session id", () => {
  assert.deepEqual(parseArguments(["--language", "en", "--session-id", "ts006-en-123e4567-e89b-12d3-a456-426614174000"]), {
    language: "en", sessionId: "ts006-en-123e4567-e89b-12d3-a456-426614174000",
  });
  assert.match(parseArguments(["--language", "es", "--new-session-id"]).sessionId, /^ts006-es-/u);
  assert.throws(() => parseArguments(["--language", "en", "--launch"]), /Unknown option/u);
  assert.throws(() => parseArguments(["--language", "en"]), /exactly one/u);
});

test("TS006 disposable profile creates only an empty isolated structure and no launcher", async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), "ts006-profile-test-"));
  const sessionId = "ts006-en-123e4567-e89b-12d3-a456-426614174000";
  const result = await prepareDisposableRuntimeProfile({language: "en", sessionId, artifactRoot});
  const manifest = validateDisposableProfileManifest(result.manifest);
  assert.equal(manifest.executionGate.projectorLaunched, false);
  assert.equal(manifest.executionGate.launchCommand, null);
  assert.equal(manifest.accountIsolation.additionalMacosAccountsCreated, 0);
  assert.equal(manifest.emptyState.sharedObjectFiles, 0);
  assert.equal(manifest.emptyState.rawCaptures, 0);
  assert.deepEqual(await readdir(path.join(result.path, "evidence/raw-captures")), []);
  const rootFiles = (await readdir(result.path)).sort();
  assert.deepEqual(rootFiles, ["evidence", "profile-manifest.json", "runtime-profile"]);
  const sandbox = await readFile(path.join(result.path, "runtime-profile/sandbox.sb"), "utf8");
  assert.match(sandbox, /\(deny network\*\)/u);
  assert.match(sandbox, /\(deny process-exec\)/u);
  assert.match(sandbox, /com\.apple\.lsd\.open/u);
  assert.match(sandbox, /\(allow mach-lookup \(global-name "com\.apple\.lsd\.modifydb"\)\)/u);
  assert.match(sandbox, /\(allow mach-lookup \(global-name "com\.apple\.lsd\.mapdb"\)\)/u);
  assert.equal(sandbox.match(/\(allow mach-lookup/gu)?.length, 2);
  assert.match(sandbox, /Flash Player/u);
  assert.equal(sandbox.includes("index_local.swf"), false);
  assert.equal(rootFiles.some((name) => /launch/iu.test(name)), false);
});

test("TS006 disposable profile validator rejects re-fingerprinted broad or reordered mach lookup policy", async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), "ts006-profile-policy-test-"));
  const result = await prepareDisposableRuntimeProfile({
    language: "en",
    sessionId: "ts006-en-123e4567-e89b-12d3-a456-426614174009",
    artifactRoot,
  });

  const broad = structuredClone(result.manifest);
  broad.sandbox.policy += "(allow mach-lookup)\n";
  broad.sandbox.bytes = Buffer.byteLength(broad.sandbox.policy);
  broad.sandbox.sha256 = sha256(broad.sandbox.policy);
  refingerprint(broad);
  assert.throws(() => validateDisposableProfileManifest(broad), /canonical exact policy/u);

  const reordered = structuredClone(result.manifest);
  const modifyDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.modifydb\"))";
  const mapDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.mapdb\"))";
  reordered.sandbox.policy = reordered.sandbox.policy
    .replace(`${modifyDbAllow}\n${mapDbAllow}\n`, "")
    .replace("(deny mach-lookup", `${modifyDbAllow}\n${mapDbAllow}\n(deny mach-lookup`);
  reordered.sandbox.bytes = Buffer.byteLength(reordered.sandbox.policy);
  reordered.sandbox.sha256 = sha256(reordered.sandbox.policy);
  refingerprint(reordered);
  assert.throws(() => validateDisposableProfileManifest(reordered), /canonical exact policy/u);
});

test("TS006 disposable profile is no-replace and language identities cannot cross", async () => {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), "ts006-profile-collision-test-"));
  const sessionId = "ts006-es-123e4567-e89b-12d3-a456-426614174001";
  await prepareDisposableRuntimeProfile({language: "es", sessionId, artifactRoot});
  await assert.rejects(() => prepareDisposableRuntimeProfile({language: "es", sessionId, artifactRoot}), /refusing to overwrite/u);
  await assert.rejects(() => prepareDisposableRuntimeProfile({language: "en", sessionId, artifactRoot}), /session id must match/u);
});
