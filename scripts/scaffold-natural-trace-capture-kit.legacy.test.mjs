import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {safeRequirementId} from "./build-course-trace-specs.mjs";
import {
  DEFAULT_NATURAL_TRACE_KIT_ROOT,
  NATURAL_TRACE_TEMPLATE_STATUS,
  buildNaturalTraceCaptureKit,
  scaffoldNaturalTraceCaptureKit,
} from "./scaffold-natural-trace-capture-kit.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const animationId = "keyterm-elementary-computeghgh";
const sourceRelative =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/computeghgh.swf";
const indexRelative = "migrations/legacy-pilot-trace-spec-index.json";
const migrationFiles = [
  `migrations/${animationId}/migration.json`,
  `migrations/${animationId}/evidence/full-frame-coverage.json`,
  `migrations/${animationId}/audit/scenario-inventory.json`,
  `migrations/${animationId}/audit/trace-specs/req-root-default-en.json`,
  `migrations/${animationId}/audit/trace-specs/req-root-default-es.json`,
  indexRelative,
  sourceRelative,
  "scripts/build-legacy-trace-specs.mjs",
  "scripts/parse-swfmill-root-replay-trace.py",
];

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeJson(candidate, value) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

async function copyFixtureFile(root, relative) {
  const bytes = await readFile(path.join(repositoryRoot, relative));
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes);
}

async function createLegacyFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "computeghgh-natural-kit-"));
  for (const relative of migrationFiles) await copyFixtureFile(root, relative);
  const appPath = path.join(root, "Adobe Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const executableBytes = Buffer.from("fixture Adobe Projector executable\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, executableBytes);
  return {
    root,
    sourcePath: path.join(root, sourceRelative),
    indexPath: path.join(root, indexRelative),
    runtime: {
      runtimeId: "adobe-flash-player-projector",
      name: "Adobe Flash Player Projector",
      version: "32.0.0.465-fixture",
      requestedAppPath: appPath,
      appPath,
      executablePath,
      executableSha256: digest(executableBytes),
    },
  };
}

function specRelativeFor(language) {
  return `migrations/${animationId}/audit/trace-specs/req-root-default-${language}.json`;
}

async function mutateSpecAndRebindIndex(item, language, mutate) {
  const specRelative = specRelativeFor(language);
  const specPath = path.join(item.root, specRelative);
  const spec = JSON.parse(await readFile(specPath, "utf8"));
  mutate(spec);
  const specSha256 = await writeJson(specPath, spec);
  const index = JSON.parse(await readFile(item.indexPath, "utf8"));
  const pilot = index.pilots.find((candidate) => candidate.animationId === animationId);
  const indexed = pilot.traceSpecs.find((candidate) => candidate.language === language);
  indexed.sha256 = specSha256;
  await writeJson(item.indexPath, index);
}

test("scaffolds and checks exact EN/ES computeghgh legacy root natural-Replay kits as empty unsigned templates", async () => {
  const item = await createLegacyFixture();
  try {
    const immutableBefore = await Promise.all([
      readFile(item.sourcePath),
      readFile(item.indexPath),
      ...["en", "es"].map((language) => readFile(path.join(item.root, specRelativeFor(language)))),
    ]);
    for (const language of ["en", "es"]) {
      const specRelative = specRelativeFor(language);
      const first = await buildNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: specRelative,
        runtime: item.runtime,
      });
      const second = await buildNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: specRelative,
        runtime: item.runtime,
      });
      assert.deepEqual([...second.files], [...first.files]);
      assert.equal(first.bound.family.id, "legacy-formula-keyterm");
      assert.equal(first.bound.indexRelative, indexRelative);
      assert.equal(first.bound.spec.frameDomain.nativeStage.width, 225);
      assert.equal(first.bound.spec.frameDomain.nativeStage.height, 225);
      assert.equal(first.bound.spec.frameDomain.fps, 12);
      assert.equal(first.bound.spec.frameDomain.frameCount, 35);
      assert.equal(first.bound.runtimeTreeFiles.length, 1);
      assert.equal(first.bound.runtimeHost.sourceProjectPath, sourceRelative);
      assert.equal(first.bound.originalHostPath, first.bound.sourcePath);
      assert.equal(first.bound.originalHostSha256, first.bound.sourceSha256);

      const result = await scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: specRelative,
        runtime: item.runtime,
      });
      const checked = await scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: specRelative,
        runtime: item.runtime,
        check: true,
      });
      assert.equal(result.status, "scaffolded-unsigned-template-only");
      assert.equal(result.strictAcceptanceEffect, false);
      assert.equal(result.migrationStatusChanged, false);
      assert.equal(checked.status, "verified-unsigned-template-only");
      assert.equal(checked.strictAcceptanceEffect, false);
      assert.equal(checked.migrationStatusChanged, false);

      const safeId = safeRequirementId(`req:root:default:${language}`);
      const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, animationId, safeId);
      const manifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
      const plan = JSON.parse(await readFile(path.join(kitRoot, "capture-plan.template.json"), "utf8"));
      const runtimeTree = JSON.parse(await readFile(path.join(kitRoot, "runtime-tree-manifest.json"), "utf8"));
      const attestation = JSON.parse(
        await readFile(path.join(kitRoot, "templates", "capture-session-attestation.template.json"), "utf8"),
      );
      const launchReceipt = JSON.parse(
        await readFile(path.join(kitRoot, "templates", "original-host-launch-receipt.template.json"), "utf8"),
      );
      assert.equal(manifest.artifactType, "legacy-root-natural-trace-capture-operator-kit");
      assert.equal(manifest.status, NATURAL_TRACE_TEMPLATE_STATUS);
      assert.equal(manifest.strictAcceptanceEffect, false);
      assert.equal(manifest.migrationStatusChanged, false);
      assert.equal(manifest.humanReviewRecorded, false);
      assert.equal(manifest.ownerReviewRecorded, false);
      assert.equal(manifest.identity.language, language);
      assert.equal(manifest.bindings.traceSpec.file, specRelative);
      assert.equal(manifest.bindings.traceSpec.sha256, digest(await readFile(path.join(item.root, specRelative))));
      assert.equal(manifest.bindings.traceSpecIndex.file, indexRelative);
      assert.equal(manifest.bindings.traceSpecIndex.sha256, digest(await readFile(item.indexPath)));
      assert.deepEqual(manifest.bindings.sourceSwf, {
        file: sourceRelative,
        sha256: "fc5c79792530092fa98d450ac00622f5f107c598bf2f313b69fe3b524a6d62e8",
      });
      assert.deepEqual(manifest.bindings.originalHostSwf, manifest.bindings.sourceSwf);
      assert.equal(manifest.originalHostLaunch.hostKind, "standalone-source-swf-is-original-runtime-host");
      assert.equal(manifest.originalHostLaunch.launcherStartsEmptyProjector, true);
      assert.equal(manifest.originalHostLaunch.commandLineSwfArgumentProvided, false);
      assert.equal(manifest.expectedEvidenceCounts.frames, 35);
      assert.equal(manifest.expectedEvidenceCounts.orderedSteps, 1);
      assert.equal(manifest.expectedEvidenceCounts.checkpoints, 3);
      assert.equal(manifest.expectedEvidenceCounts.terminalPostActionStateObservations, 1);
      assert.equal(manifest.expectedEvidenceCounts.totalStateObservations, 36);
      assert.equal(plan.templateStatus, NATURAL_TRACE_TEMPLATE_STATUS);
      assert.equal(plan.notEvidence, true);
      assert.equal(plan.observations.capturedFrameCount, 0);
      assert.equal(plan.observations.terminalObserved, false);
      assert.equal(plan.observations.terminalPostActionObservationRecorded, false);
      assert.equal(plan.orderedSteps.length, 1);
      assert.deepEqual(plan.orderedSteps[0].action.pointer, {x: 184.85, y: 200});
      assert.equal(plan.orderedSteps[0].sourceTarget.buttonObjectId, 14);
      assert.equal(plan.orderedSteps[0].sourceTarget.selectedHitShapeObjectId, 6);
      assert.equal(plan.orderedSteps[0].sourceTarget.depth, 28);
      assert.equal(runtimeTree.artifactType, "unsigned-hash-bound-standalone-source-runtime-tree");
      assert.equal(runtimeTree.fileCount, 1);
      assert.equal(runtimeTree.notEvidence, true);
      assert.equal(runtimeTree.files[0].sourcePath, sourceRelative);
      assert.equal(runtimeTree.files[0].sha256, manifest.bindings.sourceSwf.sha256);
      assert.equal(attestation.operator.fullName, "");
      assert.equal(attestation.startedAt, null);
      assert.equal(attestation.signedAt, null);
      assert.equal(attestation.attestationSha256, null);
      assert.equal(attestation.frameSet.frames.length, 0);
      assert.equal(attestation.terminalPostActionStateEvidence.observedState, null);
      assert.equal(attestation.terminalPostActionStateEvidence.screenshotSha256, null);
      assert.equal(launchReceipt.operator.fullName, "");
      assert.equal(launchReceipt.projectorStart.swfArgument, null);
      assert.equal(launchReceipt.hostOpen.openedAt, null);
      assert.equal(launchReceipt.hostOpen.playerWindowObserved, null);

      const frameFiles = await readdir(path.join(kitRoot, "frames"));
      assert.deepEqual(frameFiles, ["README.md"]);
      assert.equal(frameFiles.some((file) => file.endsWith(".png")), false);
      const stagedSource = path.join(kitRoot, runtimeTree.files[0].stagedFile);
      assert.equal(digest(await readFile(stagedSource)), manifest.bindings.sourceSwf.sha256);
      assert.equal((await stat(stagedSource)).mode & 0o777, 0o444);
      assert.equal((await stat(path.join(kitRoot, "kit-manifest.json"))).mode & 0o777, 0o444);
      assert.equal((await stat(path.join(kitRoot, "launch-original-host-sandboxed.sh"))).mode & 0o777, 0o555);
      const launcher = await readFile(path.join(kitRoot, "launch-original-host-sandboxed.sh"), "utf8");
      assert.match(launcher, /--check/);
      assert.match(launcher, /PROCESS LAUNCH ONLY — NOT HOST-OPEN EVIDENCE/);
      const execLine = launcher.split(/\r?\n/).find((line) => line.startsWith("exec /usr/bin/sandbox-exec "));
      assert.ok(execLine);
      assert.equal(execLine.includes(".swf"), false);
      const allText = [...first.files.values()].map((value) => Buffer.from(value).toString("utf8")).join("\n");
      assert.equal(allText.includes('"fullName":"Dr. Peter Hu"'), false);
      assert.equal(allText.includes('"status":"pass"'), false);
      assert.equal(allText.includes('"status":"complete"'), false);
    }
    const immutableAfter = await Promise.all([
      readFile(item.sourcePath),
      readFile(item.indexPath),
      ...["en", "es"].map((language) => readFile(path.join(item.root, specRelativeFor(language)))),
    ]);
    assert.deepEqual(immutableAfter, immutableBefore);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("computeghgh natural-kit family selection fails closed for wrong index family, wrong stage, and tampered Replay schedule", async (t) => {
  await t.test("wrong-family-index", async () => {
    const item = await createLegacyFixture();
    try {
      const index = JSON.parse(await readFile(item.indexPath, "utf8"));
      index.artifactType = "course-shell-pilot-trace-spec-index";
      await writeJson(item.indexPath, index);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: specRelativeFor("en"),
          runtime: item.runtime,
        }),
        /not the exact legacy-formula-keyterm index schema/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("wrong-native-stage", async () => {
    const item = await createLegacyFixture();
    try {
      await mutateSpecAndRebindIndex(item, "en", (spec) => {
        spec.frameDomain.nativeStage = {width: 800, height: 600};
      });
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: specRelativeFor("en"),
          runtime: item.runtime,
        }),
        /approved legacy-formula-keyterm native stage .*225x225/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("tampered-event-schedule", async () => {
    const item = await createLegacyFixture();
    try {
      await mutateSpecAndRebindIndex(item, "en", (spec) => {
        spec.schedule.orderedSteps[0].action.pointer.x = 185;
      });
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: specRelativeFor("en"),
          runtime: item.runtime,
        }),
        /Replay action schedule differs from the locked source-derived contract/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("unknown-artifact-family", async () => {
    const item = await createLegacyFixture();
    try {
      await mutateSpecAndRebindIndex(item, "en", (spec) => {
        spec.artifactType = "invented-natural-trace-specification";
      });
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: specRelativeFor("en"),
          runtime: item.runtime,
        }),
        /artifact type is not an approved root-capture family/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});
