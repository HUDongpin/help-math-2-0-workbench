import assert from "node:assert/strict";
import {mkdtemp, mkdir, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {PNG} from "pngjs";

import {
  ffdecFrameArguments,
  inspectFrameDirectory,
  parseArguments,
  rasterDimensionsForStage,
  selectLessonReleaseBaselineMembers,
  verifyManifestReleaseBinding,
} from "./export-pilot-baselines.mjs";

test("parses bounded pilot baseline options", () => {
  const options = parseArguments([
    "--dry-run",
    "--ids", "formula-a,formula-b",
    "--archive", "artifacts/example",
    "--ffdec", "/opt/tools/ffdec",
  ]);
  assert.equal(options.dryRun, true);
  assert.deepEqual(options.ids, ["formula-a", "formula-b"]);
  assert.equal(options.archiveRoot, path.resolve("artifacts/example"));
  assert.equal(options.ffdec, "/opt/tools/ffdec");
  const releaseOptions = parseArguments(["--release-id", "lesson-g04-l10-perimeter-area"]);
  assert.equal(releaseOptions.releaseId, "lesson-g04-l10-perimeter-area");
  assert.deepEqual(releaseOptions.ids, []);
  assert.throws(() => parseArguments(["--ids"]), /requires a value/);
  assert.throws(() => parseArguments(["--ids", ",,"]), /requires at least one animation ID/);
  assert.throws(
    () => parseArguments(["--ids", "member-a", "--ids", "member-b"]),
    /must not be repeated/,
  );
  assert.throws(() => parseArguments(["--release-id"]), /requires a value/);
  assert.throws(
    () => parseArguments(["--release-id", "lesson-a", "--ids", "member-a"]),
    /mutually exclusive/,
  );
  assert.throws(
    () => parseArguments(["--release-id", "lesson-a", "--release-id", "lesson-b"]),
    /must not be repeated/,
  );
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("maps positive native stage bounds to the smallest containing PNG raster", () => {
  assert.deepEqual(rasterDimensionsForStage({width: 800, height: 600}), {width: 800, height: 600});
  assert.deepEqual(rasterDimensionsForStage({width: 799.9, height: 599.75}), {width: 800, height: 600});
  assert.throws(() => rasterDimensionsForStage({width: 0, height: 600}), /finite positive numbers/);
  assert.throws(() => rasterDimensionsForStage({width: Number.NaN, height: 600}), /finite positive numbers/);
  assert.throws(() => rasterDimensionsForStage({width: "799.9", height: 599.75}), /finite positive numbers/);
});

test("builds an exact one-indexed FFDec root-frame selection", () => {
  assert.deepEqual(ffdecFrameArguments({
    frameCount: 12,
    outputDirectory: "/tmp/output",
    swfPath: "/tmp/movie.swf",
  }), [
    "-format", "frame:png",
    "-select", "1-12",
    "-onerror", "abort",
    "-export", "frame",
    "/tmp/output",
    "/tmp/movie.swf",
  ]);
  assert.throws(() => ffdecFrameArguments({frameCount: 0}), /positive integer/);
});

test("validates native dimensions, complete frames, and stable hashes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "helpmath-ffdec-frames-"));
  for (const frame of [1, 2]) {
    const image = new PNG({width: 4, height: 3});
    image.data.fill(frame * 20);
    await writeFile(path.join(directory, `${frame}.png`), PNG.sync.write(image));
  }
  const frames = await inspectFrameDirectory(directory, {
    frameCount: 2,
    stage: {width: 4, height: 3},
  });
  assert.deepEqual(frames.map(({frame}) => frame), [1, 2]);
  assert.equal(frames.every(({sha256}) => /^[a-f0-9]{64}$/.test(sha256)), true);
  assert.equal(frames.every(({width, height}) => width === 4 && height === 3), true);
  await assert.rejects(
    inspectFrameDirectory(directory, {frameCount: 3, stage: {width: 4, height: 3}}),
    /Expected 3 root frame PNGs/,
  );
});

test("rejects a frame rendered at a non-native stage size", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "helpmath-ffdec-size-"));
  await mkdir(directory, {recursive: true});
  await writeFile(path.join(directory, "1.png"), PNG.sync.write(new PNG({width: 5, height: 3})));
  await assert.rejects(
    inspectFrameDirectory(directory, {frameCount: 1, stage: {width: 4, height: 3}}),
    /expected 4x3/,
  );
});

test("accepts FFDec's integer PNG raster while retaining a fractional native stage contract", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "helpmath-ffdec-fractional-stage-"));
  await writeFile(path.join(directory, "1.png"), PNG.sync.write(new PNG({width: 800, height: 600})));
  const [frame] = await inspectFrameDirectory(directory, {
    frameCount: 1,
    stage: {width: 799.9, height: 599.75},
  });
  assert.equal(frame.width, 800);
  assert.equal(frame.height, 600);

  await writeFile(path.join(directory, "1.png"), PNG.sync.write(new PNG({width: 799, height: 600})));
  await assert.rejects(
    inspectFrameDirectory(directory, {
      frameCount: 1,
      stage: {width: 799.9, height: 599.75},
    }),
    /expected 800x600 by ceil-positive-native-stage-dimensions for native stage 799\.9x599\.75/,
  );
});

function releaseFixture() {
  const makeMember = (ordinal, shardId, digest) => ({
    ordinal,
    animationId: `fixture-${ordinal}`,
    assetId: `swf-${digest}`,
    releaseRole: ordinal === 2 ? "course-shell" : "active-xml-referenced-page",
    shardId,
    source: {
      path: `HELP_COURSES/FIXTURE/${ordinal}.swf`,
      sha256: digest,
    },
  });
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-fixture",
      publicationMode: "atomic",
      expectedCounts: {members: 2, shards: 1},
      shards: [{shardId: "fixture-shard", memberCount: 2}],
      members: [
        makeMember(1, "fixture-shard", "a".repeat(64)),
        makeMember(2, "fixture-shard", "b".repeat(64)),
      ],
    }],
  };
}

test("selects every exact atomic release member and rejects catalog drift", () => {
  const document = releaseFixture();
  assert.deepEqual(
    selectLessonReleaseBaselineMembers(document, {releaseId: "lesson-fixture"})
      .map(({animationId}) => animationId),
    ["fixture-1", "fixture-2"],
  );
  assert.throws(
    () => selectLessonReleaseBaselineMembers(document, {releaseId: "missing"}),
    /Unknown lesson release/,
  );
  assert.throws(
    () => selectLessonReleaseBaselineMembers(document, {releaseId: "../lesson-fixture"}),
    /Release ID is malformed/,
  );

  const duplicateRelease = structuredClone(document);
  duplicateRelease.releases.push(structuredClone(duplicateRelease.releases[0]));
  assert.throws(
    () => selectLessonReleaseBaselineMembers(duplicateRelease, {releaseId: "lesson-fixture"}),
    /Lesson release ID is duplicated/,
  );

  const nonAtomic = structuredClone(document);
  nonAtomic.releases[0].publicationMode = "partial";
  assert.throws(
    () => selectLessonReleaseBaselineMembers(nonAtomic, {releaseId: "lesson-fixture"}),
    /publicationMode must remain atomic/,
  );

  const unsafePath = structuredClone(document);
  unsafePath.releases[0].members[0].source.path = "../outside.swf";
  assert.throws(
    () => selectLessonReleaseBaselineMembers(unsafePath, {releaseId: "lesson-fixture"}),
    /source path is unsafe/,
  );

  const identityDrift = structuredClone(document);
  identityDrift.releases[0].members[0].source.sha256 = "c".repeat(64);
  assert.throws(
    () => selectLessonReleaseBaselineMembers(identityDrift, {releaseId: "lesson-fixture"}),
    /assetId does not match source SHA-256/,
  );

  const ordinalDrift = structuredClone(document);
  ordinalDrift.releases[0].members[1].ordinal = 3;
  assert.throws(
    () => selectLessonReleaseBaselineMembers(ordinalDrift, {releaseId: "lesson-fixture"}),
    /member ordinals must be the exact contiguous release order/,
  );
});

test("requires workspace identity, asset, source hash, and both source paths to match the release", () => {
  const member = releaseFixture().releases[0].members[0];
  const source = `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`;
  const manifest = {
    id: member.animationId,
    animationId: member.animationId,
    assetId: member.assetId,
    source: {
      swf: source,
      placementPath: source,
      swfSha256: member.source.sha256,
    },
  };
  assert.equal(verifyManifestReleaseBinding(manifest, member), true);

  const wrongId = structuredClone(manifest);
  wrongId.id = "different-id";
  assert.throws(() => verifyManifestReleaseBinding(wrongId, member), /workspace identity/);

  const wrongAsset = structuredClone(manifest);
  wrongAsset.assetId = `swf-${"f".repeat(64)}`;
  assert.throws(() => verifyManifestReleaseBinding(wrongAsset, member), /workspace assetId/);

  const wrongHash = structuredClone(manifest);
  wrongHash.source.swfSha256 = "f".repeat(64);
  assert.throws(() => verifyManifestReleaseBinding(wrongHash, member), /workspace SWF hash/);

  const wrongPlacement = structuredClone(manifest);
  wrongPlacement.source.placementPath = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/FIXTURE/other.swf";
  assert.throws(() => verifyManifestReleaseBinding(wrongPlacement, member), /workspace placement path/);
});
