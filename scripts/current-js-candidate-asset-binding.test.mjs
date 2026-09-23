import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CURRENT_JS_CANDIDATE_PROFILE_PATH,
  resolveCurrentJsCandidateAssetBinding,
} from "./current-js-candidate-asset-binding.mjs";

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function write(root, relativePath, value) {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, value);
  return filePath;
}

async function fixture() {
  const projectRoot = await mkdtemp(path.join(
    os.tmpdir(),
    "current-js-candidate-binding-",
  ));
  const version = "candidate-v1";
  const assetPath = "courses/course-fixture/canvas-renderer.js";
  const logicalPath = `public/flash-assets/${assetPath}`;
  const bytes = Buffer.from("candidate canvas bytes\n");
  const entry = {
    assetPath,
    relativePath: "course-fixture/canvas-renderer.js",
    storageRoot: "candidate",
    releaseId: "lesson-fixture-page-only",
    bytes: bytes.length,
    sha256: digest(bytes),
  };
  const profile = {
    schemaVersion: 1,
    profileId: "current-js-candidate-assets-v1",
    version,
    generatedBy: "fixture",
    candidateReleaseIds: [entry.releaseId],
    counts: {runtime: 1, evidence: 0},
    authority: {
      productionApproved: false,
      releaseEligible: false,
      published: false,
    },
    entries: [entry],
  };
  await write(
    projectRoot,
    CURRENT_JS_CANDIDATE_PROFILE_PATH,
    `${JSON.stringify(profile, null, 2)}\n`,
  );
  await write(
    projectRoot,
    `apps/web/candidate-assets/flash-assets/${version}/${assetPath}`,
    bytes,
  );
  return {projectRoot, version, assetPath, logicalPath, bytes, entry};
}

test("resolves a missing workbench-public identity through one exact private candidate profile record", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const result = await resolveCurrentJsCandidateAssetBinding({
    projectRoot: input.projectRoot,
    logicalPath: input.logicalPath,
    expectedBytes: input.entry.bytes,
    expectedSha256: input.entry.sha256,
  });
  assert.equal(result.kind, "candidate-profile");
  assert.equal(result.logicalPath, input.logicalPath);
  assert.equal(
    result.relativePath,
    `apps/web/candidate-assets/flash-assets/${input.version}/${input.assetPath}`,
  );
  assert.deepEqual(result.record, input.entry);
  assert.deepEqual(result.profile.authority, {
    productionApproved: false,
    releaseEligible: false,
    published: false,
  });
});

test("preserves an existing workbench-public file without consulting candidate storage", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  await write(input.projectRoot, input.logicalPath, "legacy bytes\n");
  const result = await resolveCurrentJsCandidateAssetBinding({
    projectRoot: input.projectRoot,
    logicalPath: input.logicalPath,
  });
  assert.equal(result.kind, "legacy-workbench-public");
  assert.equal(result.relativePath, input.logicalPath);
  assert.equal(result.profile, null);
});

test("fails closed on a declared digest mismatch or candidate byte drift", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  await assert.rejects(
    resolveCurrentJsCandidateAssetBinding({
      projectRoot: input.projectRoot,
      logicalPath: input.logicalPath,
      expectedSha256: "0".repeat(64),
    }),
    /profile SHA-256 does not match the declared binding/u,
  );
  await write(
    input.projectRoot,
    `apps/web/candidate-assets/flash-assets/${input.version}/${input.assetPath}`,
    "drifted bytes\n",
  );
  await assert.rejects(
    resolveCurrentJsCandidateAssetBinding({
      projectRoot: input.projectRoot,
      logicalPath: input.logicalPath,
      expectedSha256: input.entry.sha256,
    }),
    /candidate asset byte count differs from its profile/u,
  );
});

test("rejects a symbolic-link component in the candidate physical path", async (t) => {
  const input = await fixture();
  t.after(() => rm(input.projectRoot, {recursive: true, force: true}));
  const courses = path.join(
    input.projectRoot,
    "apps/web/candidate-assets/flash-assets",
    input.version,
    "courses",
  );
  await rm(courses, {recursive: true});
  const outside = await write(input.projectRoot, "outside/canvas-renderer.js",
    input.bytes);
  await symlink(path.dirname(outside), courses);
  await assert.rejects(
    resolveCurrentJsCandidateAssetBinding({
      projectRoot: input.projectRoot,
      logicalPath: input.logicalPath,
      expectedSha256: input.entry.sha256,
    }),
    /symbolic link/u,
  );
});
