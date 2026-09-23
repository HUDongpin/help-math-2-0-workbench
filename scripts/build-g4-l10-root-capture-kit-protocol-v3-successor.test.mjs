import assert from "node:assert/strict";
import {
  chmod,
  copyFile,
  cp,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {after, before, test} from "node:test";
import {fileURLToPath} from "node:url";

import {
  assertG4L10RootCaptureKitProtocolV3Successor,
  buildG4L10RootCaptureKitProtocolV3Successor,
  parseArguments,
  usage,
} from "./build-g4-l10-root-capture-kit-protocol-v3-successor.mjs";
import {
  DEFAULT_ROOT_CAPTURE_KIT_ROOT,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  renderUnsignedTemplateFiles,
} from "./scaffold-root-capture-kit.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = await realpath(path.resolve(path.dirname(SCRIPT_PATH), ".."));
const REPORT_FILES = [
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.json",
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v1.md",
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json",
  "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.md",
];
const TOOLING_FILES = [
  "scripts/scaffold-root-capture-kit.mjs",
  "scripts/scaffold-root-capture-kit.test.mjs",
  "scripts/prepare-root-capture-candidate.mjs",
  "scripts/prepare-root-capture-candidate.test.mjs",
  "scripts/build-g4-l10-root-capture-kit-protocol-v3-successor.mjs",
  "scripts/build-g4-l10-root-capture-kit-protocol-v3-successor.test.mjs",
];
const OUTPUT_JSON =
  "reports/g4-l10-root-capture-kit-protocol-v3-successor.json";
const OUTPUT_MARKDOWN =
  "reports/g4-l10-root-capture-kit-protocol-v3-successor.md";

function clone(value) {
  return structuredClone(value);
}

async function pathExists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function copyProjectFile(root, relative) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), {recursive: true});
  await copyFile(path.join(ROOT, relative), destination);
  const sourceInfo = await lstat(path.join(ROOT, relative));
  await chmod(destination, sourceInfo.mode & 0o7777);
}

async function writeRenderedKit(root, manifest, sourceBytes) {
  const kitRoot = path.join(
    root,
    DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
    manifest.animationId,
    manifest.requirementId,
  );
  const rendered = renderUnsignedTemplateFiles({root, manifest, sourceBytes});
  for (const [relative, contents] of rendered) {
    const target = path.join(kitRoot, relative);
    await mkdir(path.dirname(target), {recursive: true});
    await writeFile(target, contents, {
      mode: relative === "launch-projector-empty.sh" ? 0o555 : 0o444,
    });
    await chmod(target,
      relative === "launch-projector-empty.sh" ? 0o555 : 0o444);
  }
}

async function createFixture() {
  const created = await mkdtemp(path.join(
    os.tmpdir(),
    "helpmath-g4-l10-root-v3-successor-",
  ));
  const root = await realpath(created);
  await Promise.all([...REPORT_FILES, ...TOOLING_FILES]
    .map((relative) => copyProjectFile(root, relative)));
  const v2Report = JSON.parse(await readFile(
    path.join(root,
      "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json"),
    "utf8",
  ));
  for (const kit of v2Report.kits) {
    const sourceV2Root = path.join(ROOT, kit.kitRoot);
    const fixtureV2Root = path.join(root, kit.kitRoot);
    await mkdir(path.dirname(fixtureV2Root), {recursive: true});
    await cp(sourceV2Root, fixtureV2Root, {
      recursive: true,
      preserveTimestamps: true,
    });

    const v2Manifest = JSON.parse(await readFile(
      path.join(sourceV2Root, "kit-manifest.json"),
      "utf8",
    ));
    await copyProjectFile(root, v2Manifest.bindings.traceSpec.file);
    await copyProjectFile(root, v2Manifest.bindings.traceSpecIndex.file);
    const liveV3Manifest = JSON.parse(await readFile(path.join(
      ROOT,
      DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
      kit.animationId,
      kit.requirementId,
      "kit-manifest.json",
    ), "utf8"));
    const sourceBytes = await readFile(
      path.join(sourceV2Root, "runtime-source/source.swf"),
    );
    assert.equal(liveV3Manifest.animationId, v2Manifest.animationId);
    assert.equal(liveV3Manifest.requirementId, v2Manifest.requirementId);
    await writeRenderedKit(root, liveV3Manifest, sourceBytes);
  }
  return {root, v2Report};
}

async function captureFile(candidate) {
  const info = await lstat(candidate);
  return {contents: await readFile(candidate), mode: info.mode & 0o7777};
}

async function restoreFile(candidate, snapshot) {
  await unlink(candidate).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  await writeFile(candidate, snapshot.contents, {mode: snapshot.mode});
  await chmod(candidate, snapshot.mode);
}

let fixture;
let fixtureBuild;

before(async () => {
  fixture = await createFixture();
  fixtureBuild = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: fixture.root,
    persist: false,
  });
});

after(async () => {
  if (fixture?.root) await rm(fixture.root, {recursive: true, force: true});
});

test("live protocol-v3 tree is exact and persist:false writes no live report", async () => {
  const before = await Promise.all([
    pathExists(path.join(ROOT, OUTPUT_JSON)),
    pathExists(path.join(ROOT, OUTPUT_MARKDOWN)),
  ]);
  const built = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: ROOT,
    persist: false,
  });
  assert.equal(assertG4L10RootCaptureKitProtocolV3Successor(built.report), true);
  assert.equal(built.report.v2LegacyRoot.summary.totalKitBytes, 36596882);
  assert.equal(built.report.v3ParallelRoot.summary.totalKitBytes, 36974668);
  assert.equal(built.report.v3ParallelRoot.summary.exactKits, 94);
  assert.equal(built.report.v3ParallelRoot.summary.files, 1222);
  assert.equal(
    built.report.v3ParallelRoot.summary.futureRootFrameCaptureObligations,
    1020,
  );
  assert.deepEqual(
    built.report.protocol.operatorReadiness.requiredPreflights,
    [
      "external-named-operator-authorization",
      "authorized-disposable-offline-environment-preflight",
      "outside-kit-session-output-root-preflight",
      "fresh-storage-capacity-preflight",
    ],
  );
  assert.equal(
    built.report.remainingWork.freshStorageCapacityPreflightRequired,
    true,
  );
  assert.deepEqual(await Promise.all([
    pathExists(path.join(ROOT, OUTPUT_JSON)),
    pathExists(path.join(ROOT, OUTPUT_MARKDOWN)),
  ]), before);
});

test("temp-only build is deterministic and binds exact predecessors plus per-kit tree/set identities", async () => {
  const repeated = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: fixture.root,
    persist: false,
  });
  assert.equal(fixtureBuild.json.contents.equals(repeated.json.contents), true);
  assert.equal(
    fixtureBuild.markdown.contents.equals(repeated.markdown.contents),
    true,
  );
  assert.equal(fixtureBuild.report.v2LegacyRoot.summary.exactKits, 94);
  assert.equal(fixtureBuild.report.v2LegacyRoot.summary.files, 1222);
  assert.equal(fixtureBuild.report.v2LegacyRoot.summary.totalKitBytes, 36596882);
  assert.equal(fixtureBuild.report.v3ParallelRoot.summary.exactKits, 94);
  assert.equal(fixtureBuild.report.v3ParallelRoot.summary.files, 1222);
  assert.equal(fixtureBuild.report.v3ParallelRoot.summary.englishKits, 47);
  assert.equal(fixtureBuild.report.v3ParallelRoot.summary.spanishKits, 47);
  assert.equal(fixtureBuild.report.v3ParallelRoot.summary.capturePngs, 0);
  assert.equal(
    fixtureBuild.report.v3ParallelRoot.technicalIdentityContract
      .immutableV2ManifestProjectionMatched,
    true,
  );
  assert.ok(fixtureBuild.report.v3ParallelRoot.kits.every((kit) =>
    kit.technicalIdentity.immutableV2ManifestProjectionMatched === true
      && kit.technicalIdentity.currentRawTraceSpec.sha256.length === 64
      && kit.technicalIdentity.currentRawTraceSpecIndex.sha256.length === 64));
  assert.ok(fixtureBuild.report.v3ParallelRoot.kits.every((kit) =>
    kit.tree.fileCount === 13 && /^[a-f0-9]{64}$/u.test(kit.tree.sha256)));
  assert.equal(
    fixtureBuild.report.predecessors.v2.artifacts.json.sha256,
    "fb376ac734a52a848380df6b963a342a2f89be1467008a71fc425cd2b03e020a",
  );
  assert.equal(fixtureBuild.report.predecessors.v2.artifacts.json.bytes, 118100);
  assert.equal(
    fixtureBuild.report.predecessors.v2.artifacts.markdown.sha256,
    "689765536ea60ded36b0ebd5ac2f42a041354bfce7c624df6824b56ab305eeaa",
  );
  assert.equal(fixtureBuild.report.predecessors.v2.artifacts.markdown.bytes, 3375);
});

test("validator fails closed on count, arithmetic, protocol, operatorReady, preflight, acceptance, and set-hash drift", () => {
  const count = clone(fixtureBuild.report);
  count.v3ParallelRoot.summary.exactKits = 93;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(count),
    /47\/94\/1222\/1020 arithmetic/u,
  );
  const arithmetic = clone(fixtureBuild.report);
  arithmetic.v3ParallelRoot.summary.futureRootFrameCaptureObligations = 1000;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(arithmetic),
    /47\/94\/1222\/1020 arithmetic/u,
  );
  const protocol = clone(fixtureBuild.report);
  protocol.protocol.name = "cyclic-v2";
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(protocol),
    /acyclic protocol/u,
  );
  const ready = clone(fixtureBuild.report);
  ready.protocol.operatorReadiness.operatorReady = true;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(ready),
    /acyclic protocol/u,
  );
  const preflight = clone(fixtureBuild.report);
  preflight.protocol.operatorReadiness.requiredPreflights.pop();
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(preflight),
    /acyclic protocol/u,
  );
  const acceptance = clone(fixtureBuild.report);
  acceptance.acceptanceEffects.originalRuntimeEvidence = true;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(acceptance),
    /acceptance or safety boundary advanced/u,
  );
  const remainingWork = clone(fixtureBuild.report);
  delete remainingWork.remainingWork.freshStorageCapacityPreflightRequired;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(remainingWork),
    /acceptance or safety boundary advanced/u,
  );
  const safety = clone(fixtureBuild.report);
  safety.safety.sourceAssetsWritten = true;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(safety),
    /acceptance or safety boundary advanced/u,
  );
  const publication = clone(fixtureBuild.report);
  publication.publication.partialExistingPairRejected = false;
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(publication),
    /append-only publication\/check contract drifted/u,
  );
  const setHash = clone(fixtureBuild.report);
  setHash.v3ParallelRoot.kitSetSha256 = "0".repeat(64);
  assert.throws(
    () => assertG4L10RootCaptureKitProtocolV3Successor(setHash),
    /kit-set SHA-256 drifted/u,
  );
});

test("temp-only inspection rejects missing and extra v3 files", async () => {
  const kitRoot = path.join(
    fixture.root,
    DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
    fixture.v2Report.kits[0].animationId,
    fixture.v2Report.kits[0].requirementId,
  );
  const readme = path.join(kitRoot, "README.md");
  const held = path.join(fixture.root, "held-v3-readme.md");
  await rename(readme, held);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /missing or extra file/u,
  );
  await rename(held, readme);

  const extra = path.join(kitRoot, "unexpected.bin");
  await writeFile(extra, "unexpected\n", {mode: 0o444});
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /missing or extra file/u,
  );
  await unlink(extra);
});

test("temp-only inspection rejects symbolic links and hard links", async () => {
  const kitRoot = path.join(
    fixture.root,
    DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
    fixture.v2Report.kits[0].animationId,
    fixture.v2Report.kits[0].requirementId,
  );
  const readme = path.join(kitRoot, "README.md");
  const card = path.join(kitRoot, "OPERATOR_CARD.md");
  const snapshot = await captureFile(readme);
  await unlink(readme);
  await symlink("OPERATOR_CARD.md", readme);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /symbolic link/u,
  );
  await restoreFile(readme, snapshot);

  await unlink(readme);
  await link(card, readme);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /single-link file/u,
  );
  await unlink(readme);
  await restoreFile(readme, snapshot);
});

test("temp-only inspection rejects v3 render tamper, v2 tree tamper, and immutable predecessor hash drift", async () => {
  const first = fixture.v2Report.kits[0];
  const v3Card = path.join(
    fixture.root,
    DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
    first.animationId,
    first.requirementId,
    "OPERATOR_CARD.md",
  );
  const v3CardSnapshot = await captureFile(v3Card);
  await chmod(v3Card, 0o644);
  await writeFile(v3Card, Buffer.concat([
    v3CardSnapshot.contents,
    Buffer.from("tamper\n"),
  ]));
  await chmod(v3Card, 0o444);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /deterministic render/u,
  );
  await restoreFile(v3Card, v3CardSnapshot);

  const v3KitRoot = path.dirname(v3Card);
  const v3ManifestFile = path.join(v3KitRoot, "kit-manifest.json");
  const originalV3Manifest = JSON.parse(await readFile(
    v3ManifestFile,
    "utf8",
  ));
  const coherentlyWrongManifest = clone(originalV3Manifest);
  coherentlyWrongManifest.bindings.traceSpec.sha256 = "0".repeat(64);
  const stagedSource = await readFile(path.join(
    v3KitRoot,
    "runtime-source/source.swf",
  ));
  await rm(v3KitRoot, {recursive: true, force: true});
  await writeRenderedKit(fixture.root, coherentlyWrongManifest, stagedSource);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /full technical projection differs from immutable v2 manifest/u,
  );
  await rm(v3KitRoot, {recursive: true, force: true});
  await writeRenderedKit(fixture.root, originalV3Manifest, stagedSource);

  const v2Source = path.join(
    fixture.root,
    DEFAULT_ROOT_CAPTURE_KIT_ROOT,
    first.animationId,
    first.requirementId,
    "runtime-source/source.swf",
  );
  const v2SourceSnapshot = await captureFile(v2Source);
  await chmod(v2Source, 0o644);
  await writeFile(v2Source, Buffer.concat([
    v2SourceSnapshot.contents,
    Buffer.from("tamper"),
  ]));
  await chmod(v2Source, 0o444);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /immutable tree descriptor drifted/u,
  );
  await restoreFile(v2Source, v2SourceSnapshot);

  const v2Receipt = path.join(
    fixture.root,
    "reports/g4-l10-root-capture-kit-reconcile-receipt-v2.json",
  );
  const receiptSnapshot = await captureFile(v2Receipt);
  await writeFile(v2Receipt, Buffer.concat([
    receiptSnapshot.contents,
    Buffer.from(" "),
  ]));
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: false,
    }),
    /immutable bytes or SHA-256 drifted/u,
  );
  await restoreFile(v2Receipt, receiptSnapshot);
});

test("temp-only append publication/check is exact and fails on tooling hash drift or a partial pair", async () => {
  const published = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: fixture.root,
    persist: true,
  });
  assert.deepEqual(published.persistence, {json: "written", markdown: "written"});
  const checked = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: fixture.root,
    persist: true,
    check: true,
  });
  assert.deepEqual(checked.persistence, {json: "checked", markdown: "checked"});

  const tooling = path.join(
    fixture.root,
    "scripts/prepare-root-capture-candidate.test.mjs",
  );
  const toolingSnapshot = await captureFile(tooling);
  await writeFile(tooling, Buffer.concat([
    toolingSnapshot.contents,
    Buffer.from("\n"),
  ]));
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: true,
      check: true,
    }),
    /outputs are missing or stale/u,
  );
  await restoreFile(tooling, toolingSnapshot);
  const rechecked = await buildG4L10RootCaptureKitProtocolV3Successor({
    root: fixture.root,
    persist: true,
    check: true,
  });
  assert.deepEqual(rechecked.persistence, {json: "checked", markdown: "checked"});

  const markdown = path.join(fixture.root, OUTPUT_MARKDOWN);
  const markdownSnapshot = await captureFile(markdown);
  await unlink(markdown);
  await assert.rejects(
    () => buildG4L10RootCaptureKitProtocolV3Successor({
      root: fixture.root,
      persist: true,
    }),
    /partial successor publication exists/u,
  );
  await restoreFile(markdown, markdownSnapshot);
});

test("CLI parser permits only help or one exact check flag", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.deepEqual(parseArguments(["-h"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--check", "--check"]),
    /Unknown or incompatible arguments/u);
  assert.throws(() => parseArguments(["--root", ROOT]),
    /Unknown or incompatible arguments/u);
  assert.match(usage(), /protocol-v3 successor/u);
  assert.match(usage(), /operator-ready/u);
});
