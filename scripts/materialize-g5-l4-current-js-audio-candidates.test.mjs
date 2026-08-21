import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {materializeG5L4CurrentJsAudioCandidates} from "./materialize-g5-l4-current-js-audio-candidates.mjs";

const ROOT = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const REPORT_PATH = path.join(ROOT, "reports/g5-l4-current-js-audio-candidates.json");
const MATERIALIZER_PATH = path.join(
  ROOT,
  "scripts/materialize-g5-l4-current-js-audio-candidates.mjs",
);
const DEMOS_PATH = path.join(ROOT, "packages/demos/src/g5-l4-audio.generated.ts");
const POLICY_PATH = path.join(ROOT, "apps/web/lib/g5-l4-audio-assets.generated.ts");
const SOURCE_CUSTODY_SENTINEL = path.join(
  ROOT,
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
);
const EMBEDDED_AUDIO_HELPER_PATH = path.join(
  ROOT,
  "scripts/build-g4-l3-embedded-audio-archive.mjs",
);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function assertCurrentBinding(binding) {
  const bytes = await readFile(path.join(ROOT, binding.path));
  assert.equal(binding.bytes, bytes.length, `${binding.path}: byte count`);
  assert.equal(binding.sha256, sha256(bytes), `${binding.path}: SHA-256`);
}

function expectedPublicPaths(report) {
  return [
    ...report.normalCandidates.flatMap((candidate) => [
      candidate.embedded.publicPath,
      candidate.spanish.publicPath,
    ]),
    ...report.introductionCandidate.outcomes.map(({publicPath}) => publicPath),
    ...report.finalQuiz.assets.map(({publicPath}) => publicPath),
  ];
}

test("G5 L4 committed audio assets are exact and acceptance-neutral", async (context) => {
  const sourceCustody = await lstat(SOURCE_CUSTODY_SENTINEL).catch((error) =>
    error.code === "ENOENT" ? null : Promise.reject(error),
  );
  if (sourceCustody) {
    assert.equal(sourceCustody.isFile(), true);
    assert.equal(sourceCustody.isSymbolicLink(), false);
    const check = await materializeG5L4CurrentJsAudioCandidates({root: ROOT, check: true});
    assert.deepEqual(check, {
      action: "verified",
      pageAudioCandidateCount: 53,
      stagedAssetCount: 185,
      stagedAssetBytes: 21_055_023,
      fqPresentPathCount: 83,
      fqMissingPathCount: 97,
      strictAcceptanceEffect: "none",
    });
  } else {
    context.diagnostic(
      "private canonical source custody is absent; checking committed route-served bytes and generated bindings only",
    );
  }

  const report = JSON.parse(await readFile(REPORT_PATH, "utf8"));
  const materializer = await readFile(MATERIALIZER_PATH);
  assert.deepEqual(report.generator, {
    path: "scripts/materialize-g5-l4-current-js-audio-candidates.mjs",
    bytes: materializer.length,
    sha256: sha256(materializer),
  });
  await assertCurrentBinding(report.generator);
  for (const binding of [
    ...report.generatorInputs,
    ...report.sourceBindings,
  ]) {
    await assertCurrentBinding(binding);
  }
  const embeddedAudioHelper = await readFile(EMBEDDED_AUDIO_HELPER_PATH);
  assert.deepEqual(report.generatorInputs, [{
    role: "embedded-audio-payload-parser",
    path: "scripts/build-g4-l3-embedded-audio-archive.mjs",
    bytes: embeddedAudioHelper.length,
    sha256: sha256(embeddedAudioHelper),
  }]);
  assert.deepEqual(report.summary, {
    pageCount: 54,
    normalPageCandidateCount: 50,
    irCandidateCount: 1,
    runtimeAudioCandidatePageCount: 53,
    fqInteractiveOwnerPageCount: 2,
    fqNoPositiveTriggerPageCount: 1,
    fqExpectedPathCount: 180,
    fqPresentPathCount: 83,
    fqMissingPathCount: 97,
    stagedAssetCount: 185,
    stagedAssetBytes: 21_055_023,
    strictCompleteCount: 0,
    listeningAcceptedCount: 0,
    ownerAcceptedCount: 0,
    published: false,
  });
  assert.equal(report.normalCandidates.length, 50);
  assert.equal(report.introductionCandidate.outcomes.length, 2);
  assert.deepEqual(report.finalQuiz.sourceControlOwnerAnimationIds, [
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
  ]);
  assert.equal(report.finalQuiz.unresolvedOwnerAnimationId, "course-g05-l04-fq-001");
  assert.equal(report.finalQuiz.assets.length, 83);
  assert.equal(report.finalQuiz.missingPaths.length, 97);
  assert.deepEqual(
    Object.fromEntries(["en", "es"].map((language) => [
      language,
      report.finalQuiz.assets.filter((asset) => asset.language === language).length,
    ])),
    {en: 41, es: 42},
  );
  assert.deepEqual(report.acceptance, {
    spokenLanguageEstablished: false,
    naturalOriginalRuntimeReachabilityEstablished: false,
    originalRuntimeSynchronizationEstablished: false,
    currentJsInteractionListeningAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    lessonReleased: false,
    lessonPublished: false,
  });
  assert.deepEqual(report.embeddedMetadataReview, {
    status: "pending-before-public-audio-enable",
    exactSourceBytesPreserved: true,
    rawTagValuesPersistedInReport: false,
    assets: [{
      path: "apps/web/server-assets/flash-assets/courses/course-g05-l04-ts-007/audio/spanish-host-narration.mp3",
      bytes: 119_016,
      sha256: "eba3e371fc9b1420fc3f12049b477c5226f9585c8d9d438c429edf4619492ee2",
      fieldNames: ["date", "Engineer"],
    }],
  });

  const paths = report.stagedAssets.map(({path: assetPath}) => assetPath);
  assert.equal(paths.length, 185);
  assert.equal(new Set(paths).size, 185);
  for (const asset of report.stagedAssets) {
    assert.match(
      asset.path,
      /^apps\/web\/server-assets\/flash-assets\/courses\/course-g05-l04-[a-z0-9-]+\/(?:audio\/)?[A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)*\.mp3$/u,
    );
    assert.equal(asset.state, "source-exact");
    const absolute = path.join(ROOT, asset.path);
    const [bytes, information] = await Promise.all([readFile(absolute), lstat(absolute)]);
    assert.equal(bytes.length, asset.bytes, `${asset.path}: byte count`);
    assert.equal(sha256(bytes), asset.sha256, `${asset.path}: SHA-256`);
    assert.equal(information.isFile(), true, `${asset.path}: regular file`);
    assert.equal(information.isSymbolicLink(), false, `${asset.path}: not symlink`);
    assert.equal(information.nlink, 1, `${asset.path}: no hard links`);
    assert.equal(
      [0o444, 0o644].includes(information.mode & 0o777),
      true,
      `${asset.path}: reproducible non-executable mode`,
    );
    const legacyPublicPath = asset.path.replace(
      /^apps\/web\/server-assets/u,
      "apps/web/public",
    );
    await assert.rejects(
      lstat(path.join(ROOT, legacyPublicPath)),
      (error) => error?.code === "ENOENT",
      `${legacyPublicPath}: legacy public copy must be absent`,
    );
  }
});

test("G5 L4 generated runtime and policy maps bind every exact asset URL to one digest", async () => {
  const [reportText, demosSource, policySource] = await Promise.all([
    readFile(REPORT_PATH, "utf8"),
    readFile(DEMOS_PATH, "utf8"),
    readFile(POLICY_PATH, "utf8"),
  ]);
  const report = JSON.parse(reportText);
  const publicPaths = expectedPublicPaths(report);
  assert.equal(publicPaths.length, 185);
  assert.equal(new Set(publicPaths).size, 185);

  for (const [index, publicPath] of publicPaths.entries()) {
    const digest = publicPath.match(/\?sha256=([0-9a-f]{64})$/u)?.[1];
    assert.ok(digest, `${publicPath}: exact digest query`);
    assert.equal(demosSource.includes(`'source': '${publicPath}'`), true, `${publicPath}: runtime map`);
    const policyPath = report.stagedAssets[index].path.replace(
      /^apps\/web\/server-assets\/flash-assets\/courses\//u,
      "",
    );
    assert.equal(
      policySource.includes(`'${policyPath}': '${report.stagedAssets[index].sha256}'`),
      true,
      `${policyPath}: policy map`,
    );
  }

  assert.equal(
    (demosSource.match(/^  'course-g05-l04-[^']+': Object\.freeze\(\{/gmu) ?? []).length,
    51,
  );
  assert.equal(demosSource.includes("'course-g05-l04-fq-001': Object.freeze({"), false);
  assert.equal(demosSource.includes("'course-g05-l04-fq-002': Object.freeze({"), false);
  assert.equal(demosSource.includes("'course-g05-l04-fq-003': Object.freeze({"), false);
  assert.equal(
    (policySource.match(/^  'course-g05-l04-[^']+': '[0-9a-f]{64}',$/gmu) ?? []).length,
    185,
  );
});
