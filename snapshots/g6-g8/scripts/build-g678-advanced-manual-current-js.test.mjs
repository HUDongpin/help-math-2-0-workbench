import assert from "node:assert/strict";
import {chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ACCEPTANCE_EFFECTS,
  ADVANCED_PAGE_DEFINITIONS,
  FRAGMENT_PATH,
  canonicalExportedScriptProjection,
  extractBehaviorScriptClaims,
  freezeTree,
  hasExactFalseAcceptanceEffects,
  moduleSource,
  parseArguments,
  publishTrackedOutputs,
  timelineSource,
  verifyFrozenTree,
  verifyTrackedOutputs,
} from "./build-g678-advanced-manual-current-js.mjs";

function fixturePage(animationId = "shared-geo001-l01-p001") {
  const definition = ADVANCED_PAGE_DEFINITIONS.find((entry) =>
    entry.animationId === animationId);
  return Object.freeze({
    animationId,
    titleEnglish: "Source title",
    sourcePath: `G6-G8-shared/${animationId}.swf`,
    sourceSha256: "a".repeat(64),
    adapterFamily: definition.adapterFamily,
    rootFrameCount: 10,
    rootBeginFrame: 6,
    frameDomain: animationId === "shared-geo001-l01-p001"
      ? "sprite-142" : "sprite-260",
    frameCount: animationId === "shared-geo001-l01-p001" ? 127 : 356,
    extractedDrawingLastPlacedFrame:
      animationId === "shared-geo001-l01-p001" ? 127 : 356,
    livePlaybackEndFrame: definition.interactiveStop?.stopFrame ??
      (animationId === "shared-geo001-l01-p001" ? 127 : 356),
    interactiveStops: definition.interactiveStop
      ? [definition.interactiveStop] : [],
    interactiveSeek: definition.interactiveSeek,
    behaviorFrame: definition.behaviorFrame,
    companionDomains: definition.companionDomains,
    remainingBlockers: definition.remainingBlockers,
    behaviorIrExport: definition.behaviorIrExport,
    wrapperFactory: definition.wrapperFactory,
    behavior: Object.freeze({path: definition.behaviorFile,
      bytes: 100, sha256: "b".repeat(64)}),
    runtime: Object.freeze({path: `work/${animationId}/canvas-renderer.js`,
      bytes: 200, sha256: "c".repeat(64),
      url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS"}),
  });
}

async function publicationFixture() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(),
    "help-g678-advanced3-")));
  await Promise.all([
    mkdir(path.join(root, "work/g678-shared-page-factory"), {recursive: true}),
    mkdir(path.join(root, "packages/demos/src/timelines"), {recursive: true}),
    mkdir(path.join(root, "packages/demos/src/modules"), {recursive: true}),
    mkdir(path.join(root, "catalog/product-bridge-calibrations"), {recursive: true}),
  ]);
  const outputs = new Map([
    ["packages/demos/src/timelines/a.ts", Buffer.from("timeline\n")],
    ["packages/demos/src/modules/a.tsx", Buffer.from("module\n")],
    [FRAGMENT_PATH, Buffer.from("fragment\n")],
  ]);
  return {root, outputs};
}

test("advanced-3 scope is exact and every acceptance authority remains false", () => {
  assert.deepEqual(
    ADVANCED_PAGE_DEFINITIONS.map(({animationId}) => animationId),
    [
      "shared-geo001-l01-p001",
      "shared-nms002-l11-p030",
      "shared-dat001-l05-p040",
    ],
  );
  assert.deepEqual(
    ADVANCED_PAGE_DEFINITIONS.map(({companionDomains}) => companionDomains.length),
    [1, 9, 7],
  );
  assert.deepEqual(
    ADVANCED_PAGE_DEFINITIONS.map(({interactiveStop}) =>
      interactiveStop?.stopFrame ?? null),
    [null, 97, 238],
  );
  assert.deepEqual(
    ADVANCED_PAGE_DEFINITIONS.map(({interactiveSeek}) =>
      interactiveSeek?.id ?? null),
    ["geo-source-progress-seek", null, null],
  );
  assert.ok(Object.values(ACCEPTANCE_EFFECTS).every((value) => value === false));
  assert.equal(hasExactFalseAcceptanceEffects(ACCEPTANCE_EFFECTS), true);
  assert.equal(hasExactFalseAcceptanceEffects({}), false);
  assert.equal(hasExactFalseAcceptanceEffects({...ACCEPTANCE_EFFECTS,
    extra: false}), false);
});

test("CLI exposes only create-exclusive build and read-only check", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /usage/u);
  assert.throws(() => parseArguments(["--check", "extra"]), /usage/u);
});

test("generated timeline binds safe runtime, behavior IR, companion domains, and false product gates", () => {
  const source = timelineSource(fixturePage());
  assert.match(source, /GEO001_L01_P001_BEHAVIOR_IR_V1/u);
  assert.match(source, /HELP_MATH_CANVAS_ASSETS/u);
  assert.match(source, /sprite-11-progress-bar/u);
  assert.match(source, /"currentJavaScriptRegistered": false/u);
  assert.match(source, /"audioLifecycleAccepted": false/u);
  assert.match(source, /"spanishBehaviorAccepted": false/u);
  assert.match(source, /"interactiveStops": \[\]/u);
  assert.match(source, /"requiresHostSeekConsumer": true/u);
  assert.match(source, /"hostSeekConsumerImplemented": true/u);
  assert.match(source,
    /"interactiveResolutionIntentContractImplemented": true/u);
  assert.match(source, /showEngineeringDisclosure/u);
});

test("canonical exportedScriptSet projection is sorted, hash-bound, and mutation-sensitive", () => {
  const rows = [
    {bytes: 2, path: "scripts/a.as", sha256: "a".repeat(64)},
    {bytes: 3, path: "scripts/b.as", sha256: "b".repeat(64)},
  ];
  const projected = canonicalExportedScriptProjection(rows);
  assert.deepEqual(projected, {
    fileCount: 2,
    totalBytes: 5,
    bytes: 222,
    sha256: "35c9f5d5965de24262f06187d2cbe42b8f6ad438f7b2d885c327134cbe1dff16",
  });
  const changed = canonicalExportedScriptProjection([
    rows[0],
    {...rows[1], bytes: 4},
  ]);
  assert.notEqual(changed.sha256, projected.sha256);
  assert.throws(() => canonicalExportedScriptProjection([...rows].reverse()),
    /path-sorted/u);
});

test("FFDec binds launcher, JAR/classpath, Java, live versions, argv, and environment", async () => {
  const source = await readFile(new URL(
    "./build-g678-advanced-manual-current-js.mjs", import.meta.url), "utf8");
  assert.match(source, /absoluteOrdinaryFileBinding/u);
  assert.match(source, /FFDec launcher/u);
  assert.match(source, /FFDec JAR/u);
  assert.match(source, /versionOutput/u);
  assert.match(source, /versionProbe/u);
  assert.match(source, /criticalVariables/u);
  assert.match(source, /manifestClassPath/u);
  assert.match(source, /classPathChecksumSetSha256/u);
  assert.match(source, /resolvePathExecutable\("java"\)/u);
  assert.match(source, /effective Java version probe/u);
  assert.match(source, /ffdecToolchainBindingSha256/u);
  assert.match(source, /execution: "direct-bound-java"/u);
  assert.match(source, /JAVA_TOOL_OPTIONS/u);
  assert.match(source, /JDK_JAVA_OPTIONS/u);
  assert.match(source, /_JAVA_OPTIONS/u);
  assert.match(source, /CLASSPATH/u);
  assert.match(source, /FFDec\/Java\/classpath toolchain changed during advanced extraction/u);
  assert.doesNotMatch(source,
    /const ffdec = context\.ffdecToolchain\.launcher\.realPath/u);
  assert.doesNotMatch(source,
    /ffdec:\s*"JPEXS Free Flash Decompiler v/u);
});

test("JSON inputs are parsed from one stat-stable read", async () => {
  const source = await readFile(new URL(
    "./build-g678-advanced-manual-current-js.mjs", import.meta.url), "utf8");
  assert.match(source, /parseJson \? \{value: JSON\.parse\(bytes\.toString/u);
  assert.match(source, /const inputValues = \{\}/u);
  assert.match(source, /if \("value" in current\) inputValues\[key\] = current\.value/u);
  assert.doesNotMatch(source,
    /JSON\.parse\(\(await readFile\(projectPath\(relativePath\)\)\)/u);
});

test("source custody is canonical, anchored, recursively read-only, and stat-stable", async () => {
  const source = await readFile(new URL(
    "./build-g678-advanced-manual-current-js.mjs", import.meta.url), "utf8");
  assert.match(source, /canonicalSourceRelativePath/u);
  assert.match(source, /sourceRoot\.sharedAbsolute/u);
  assert.match(source, /requireReadOnlySources === true/u);
  assert.match(source, /segments\.slice\(0, -1\)/u);
  assert.match(source, /mtimeNs/u);
  assert.match(source, /lstat\(absolute, \{bigint: true\}\)/u);
  assert.match(source, /source path\/stat\/read\/hash custody drifted/u);
});

test("all 17 path-bound behavior script claims crosswalk to structural export rows", async () => {
  const report = JSON.parse(await readFile(new URL(
    "../work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json",
    import.meta.url), "utf8"));
  const files = [
    ["shared-geo001-l01-p001",
      "../packages/demos/src/g678-advanced-manual/geo001-l01-p001.ts", 7],
    ["shared-nms002-l11-p030",
      "../packages/demos/src/g678-advanced-manual/nms002-l11-p030.ts", 8],
    ["shared-dat001-l05-p040",
      "../packages/demos/src/g678-advanced-manual/dat001-l05-p040.ts", 2],
  ];
  let total = 0;
  for (const [animationId, relativePath, expectedCount] of files) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    const claims = extractBehaviorScriptClaims(source, relativePath);
    assert.equal(claims.length, expectedCount, animationId);
    total += claims.length;
    const placement = report.placements.find((entry) =>
      entry.placementId === animationId);
    const exported = new Map(placement.structural.exportedScripts.files
      .map((row) => [row.path, row]));
    for (const claim of claims) {
      assert.deepEqual(exported.get(claim.path), claim,
        `${animationId}: ${claim.path}`);
    }
  }
  assert.equal(total, 17);
});

test("check rebuilds runtime from raw XML, frames, helper, and adapter spec", async () => {
  const source = await readFile(new URL(
    "./build-g678-advanced-manual-current-js.mjs", import.meta.url), "utf8");
  assert.match(source, /rebuildMemberRuntime/u);
  assert.match(source, /runtime does not rebuild from XML\/frames\/helper\/spec/u);
  assert.match(source, /compiler subtree inventory drifted/u);
  assert.match(source, /output root entry set drifted/u);
  assert.match(source, /behavior script claim crosswalk drifted/u);
  assert.match(source, /staged compiler SWF changed during extraction/u);
});

test("generated modules use only the maintained advanced wrappers and never register themselves", () => {
  const geo = moduleSource(fixturePage());
  const nms = moduleSource(fixturePage("shared-nms002-l11-p030"));
  assert.match(geo, /createGeo001AdvancedManualCandidate/u);
  assert.match(geo, /interactiveSeek:/u);
  assert.match(nms, /createNms002AdvancedManualCandidate/u);
  assert.doesNotMatch(geo, /animation-registry|generate-registry|upsert/u);
  assert.doesNotMatch(nms, /animation-registry|generate-registry|upsert/u);
  assert.match(geo, /export default candidate\.module/u);
});

test("maintained React wrappers expose seek, drag/drop, source-host feedback, and typed stop resolution", async () => {
  const source = await readFile(new URL(
    "../packages/demos/src/g678-advanced-manual/current-js-wrappers.tsx",
    import.meta.url), "utf8");
  assert.match(source, /type="range"/u);
  assert.match(source, /draggable=/u);
  assert.match(source, /onDragStart=/u);
  assert.match(source, /onDrop=/u);
  assert.match(source, /<button/u);
  assert.match(source, /selectHostFeedback/u);
  assert.match(source, /source-host-selected-/u);
  assert.match(source, /onInteractiveStopResolved/u);
  assert.match(source, /maintained-source-derived-interaction/u);
  assert.match(source, /Reset interaction/u);
  assert.match(source, /onSeekIntent/u);
  assert.match(source, /Local frame preview only/u);
  assert.doesNotMatch(source, />Replay<\/button>/u);
  assert.match(source, /resolve-feedback-domain/u);
});

test("tracked publication is create-exclusive and verifies exact single-link bytes", async (t) => {
  const fixture = await publicationFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await publishTrackedOutputs(fixture.outputs, {root: fixture.root});
  assert.equal(result.published, 3);
  await verifyTrackedOutputs(fixture.outputs, {root: fixture.root});
  for (const [relativePath, expected] of fixture.outputs) {
    const absolute = path.join(fixture.root, relativePath);
    assert.deepEqual(await readFile(absolute), expected);
    assert.equal((await lstat(absolute)).nlink, 1);
  }
  await assert.rejects(
    () => publishTrackedOutputs(fixture.outputs, {root: fixture.root}),
    /create-exclusive/u,
  );
});

test("tracked publication rolls every created target back after an injected late failure", async (t) => {
  const fixture = await publicationFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(
    () => publishTrackedOutputs(fixture.outputs, {
      root: fixture.root,
      failAfterCopies: 2,
    }),
    /rolled back/u,
  );
  for (const relativePath of fixture.outputs.keys()) {
    await assert.rejects(() => lstat(path.join(fixture.root, relativePath)),
      /ENOENT/u);
  }
  const residues = (await readdir(path.join(fixture.root,
    "work/g678-shared-page-factory")))
    .filter((name) => name.startsWith(".g678-advanced3-publication-"));
  assert.deepEqual(residues, []);
});

test("rollback refuses to delete a concurrently replaced publication target", async (t) => {
  const fixture = await publicationFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  let replacedTarget = null;
  await assert.rejects(
    () => publishTrackedOutputs(fixture.outputs, {
      root: fixture.root,
      failAfterCopies: 1,
      afterCopy: async ({target, journalPath}) => {
        replacedTarget = target;
        const journal = JSON.parse(await readFile(journalPath, "utf8"));
        assert.equal(journal.state, "provisional-created");
        assert.equal(journal.target.sha256,
          "b37d7faa66b50a0fff002fdfbef096df2fb69cb8e3c9d5285b85bc1b44f1535d");
        const replacement = `${target}.concurrent-replacement`;
        await writeFile(replacement, "concurrent owner bytes\n", {flag: "wx"});
        await rename(replacement, target);
      },
    }),
    /rollback is incomplete.*rollback target changed after publication/u,
  );
  assert.ok(replacedTarget);
  assert.equal(await readFile(replacedTarget, "utf8"),
    "concurrent owner bytes\n");
});

test("copy-success before identity capture is provisional and never unlinked", async (t) => {
  const fixture = await publicationFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  let provisionalTarget = null;
  await assert.rejects(
    () => publishTrackedOutputs(fixture.outputs, {
      root: fixture.root,
      afterRawCopy: async ({target}) => {
        provisionalTarget = target;
        throw new Error("injected pre-identity failure");
      },
    }),
    /rollback is incomplete.*provisional publication identity is incomplete/u,
  );
  assert.ok(provisionalTarget);
  assert.equal(await readFile(provisionalTarget, "utf8"), "timeline\n");
  const residues = (await readdir(path.join(fixture.root,
    "work/g678-shared-page-factory")))
    .filter((name) => name.startsWith(".g678-advanced3-publication-"));
  assert.equal(residues.length, 1);
});

test("runtime freeze enforces recursive 0555 directories and 0444 single-link files", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "help-g678-freeze-"));
  t.after(async () => {
    await chmod(root, 0o755).catch(() => {});
    await chmod(path.join(root, "nested"), 0o755).catch(() => {});
    await rm(root, {recursive: true, force: true});
  });
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "nested/runtime.js"), "runtime\n");
  await freezeTree(root);
  await verifyFrozenTree(root);
  assert.equal((await lstat(root)).mode & 0o777, 0o555);
  assert.equal((await lstat(path.join(root, "nested"))).mode & 0o777, 0o555);
  assert.equal((await lstat(path.join(root, "nested/runtime.js"))).mode & 0o777,
    0o444);
  await chmod(path.join(root, "nested/runtime.js"), 0o644);
  await assert.rejects(() => verifyFrozenTree(root), /mode-0444/u);
});
