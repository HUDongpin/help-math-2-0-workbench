import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {technicalManifestSha256} from "./evidence-projections.mjs";
import {
  parseArguments,
  refreshGs002RootStructuralPins,
} from "./refresh-gs002-root-structural-inspection-pins.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const animationId = "course-g04-l09-gs-002";
const sourceSwf =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L9/GS/L9GS02.swf";
const sourceSwfSha256 = "4".repeat(64);
const migrationPath = `migrations/${animationId}/migration.json`;
const dispositionPath =
  `migrations/${animationId}/audit/bilingual-visual-source-disposition.json`;
const assetManifestPath =
  `public/flash-assets/courses/${animationId}/root-frames/manifest.json`;
const priorAssetSha256 = "1".repeat(64);
const priorDispositionSha256 = "2".repeat(64);
const acceptanceEffects = {
  authoritativeOriginalRuntimeBaseline: false,
  bilingualVisualParity: false,
  spanishTranslationAccepted: false,
  audioAcceptance: false,
  naturalOriginalRuntimeTraversal: false,
  interactionBehaviorParity: false,
  scoringParity: false,
  replayParity: false,
  fullFrameCoverage: false,
  rmseAcceptance: false,
  humanVisualReview: false,
  engineeringAcceptance: false,
  ownerAcceptance: false,
  strictMigrationCompletion: false,
};

async function writeProjectFile(root, relative, bytes) {
  const file = path.join(root, ...relative.split("/"));
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  return file;
}

function dispositionDocument() {
  return {
    schemaVersion: 1,
    evidenceType: "source-shared-bilingual-visual-disposition",
    animationId,
    status: "verified-root-source-shared-untranslated-visual",
    migrationStatusChanged: false,
    generatedFrom: {
      generator: {
        path: "scripts/build-gs002-root-bilingual-visual-disposition.mjs",
        sha256: "5".repeat(64),
      },
      sourceSwf: {path: sourceSwf, sha256: sourceSwfSha256},
      sameLessonHost: {executionClaimed: false},
      spanishAudio: {rendered: false, accepted: false},
      rootStructuralReport: {
        authority: "swf-static-root-timeline-render",
        status: "structural-baseline-only",
      },
      spriteCanvasAdapterSpec: {spanishScopeRemainsBlocked: true},
    },
    implementationDisposition: {
      rootFrameAdapter: {spanishTranslationSupplied: false},
      audioRendered: false,
      hostIntegrationStatus: "blocked-not-authoritatively-executed",
    },
    acceptanceEffects: structuredClone(acceptanceEffects),
    strictAcceptanceEffect: "none; fixture remains acceptance-neutral",
  };
}

function rootAssetDocument(dispositionSha256) {
  return {
    schemaVersion: 1,
    evidenceType: "ffdec-structural-root-frame-implementation-assets",
    animationId,
    classification: "engineering-structural-inspection-not-strict-acceptance",
    authority: {
      kind: "ffdec-static-root-timeline-structural-render",
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      naturalPlaybackClaimed: false,
    },
    generator: {
      path: "scripts/build-gs002-ffdec-root-frame-assets.mjs",
      sha256: "6".repeat(64),
    },
    source: {swf: sourceSwf, swfSha256: sourceSwfSha256},
    visualDisposition: {
      path: dispositionPath,
      sha256: dispositionSha256,
      status: "verified-root-source-shared-untranslated-visual",
      visualClassification: "source-shared-untranslated-visual",
      strictAcceptanceEffect: "none",
    },
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      frameDomain: "root",
      frameCount: 10,
      frameNumbering: "one-indexed",
      supportedLanguages: ["en", "es"],
      visualLocalizationStatus: "source-shared-untranslated-visual",
      spanishTranslationSupplied: false,
      naturalPlaybackStopFrame: 1,
    },
    frames: Array.from({length: 10}, (_, index) => ({
      frame: index + 1,
      sha256: `${index}`.padStart(64, "a"),
      width: 800,
      height: 600,
    })),
    strictAcceptanceEffect: "none",
  };
}

function migrationDocument() {
  return {
    schemaVersion: 2,
    id: animationId,
    animationId,
    assetId: `swf-${"7".repeat(64)}`,
    source: {swf: sourceSwf, swfSha256: sourceSwfSha256},
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      frameCount: 10,
    },
    localization: {bilingualRequired: true, languages: ["en", "es"]},
    scenarios: [{id: "root-standalone", kind: "linear", reachable: true}],
    audio: {
      required: true,
      languages: ["en", "es"],
      inventoryFile: "audio-inventory.csv",
      missingRequired: [],
      cues: [],
    },
    implementation: {
      rendering: "canvas",
      component: `packages/demos/src/modules/${animationId}.tsx`,
      frameDomains: [{id: "root", frameCount: 10}],
      rootStructuralInspection: {
        assetManifest: assetManifestPath,
        assetManifestSha256: priorAssetSha256,
        authority:
          "ffdec-static-root-timeline-structural-render-not-original-runtime",
        bilingualVisualDisposition:
          "audit/bilingual-visual-source-disposition.json",
        bilingualVisualDispositionSha256: priorDispositionSha256,
        frameCount: 10,
        languages: ["en", "es"],
        normalPlaybackStopFrame: 1,
        originalRuntimeBaselineComplete: false,
        spanishStatus: "source-shared-untranslated-visual",
        spanishTranslationSupplied: false,
        spriteSpanishStatus: "blocked",
        strictAcceptanceEffect: "none",
      },
    },
    acceptance: {ownerReview: {decision: "pending"}},
  };
}

async function createFixture({mutateDisposition, mutateAsset} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "gs002-root-pins-"));
  const disposition = dispositionDocument();
  mutateDisposition?.(disposition);
  const dispositionText = `${JSON.stringify(disposition, null, 2)}\n`;
  const dispositionSha256 = hash(dispositionText);
  const dispositionFile = await writeProjectFile(
    root,
    dispositionPath,
    dispositionText,
  );

  const asset = rootAssetDocument(dispositionSha256);
  mutateAsset?.(asset);
  const assetText = `${JSON.stringify(asset, null, 2)}\n`;
  const assetSha256 = hash(assetText);
  const assetFile = await writeProjectFile(root, assetManifestPath, assetText);

  const migration = migrationDocument();
  const migrationText = `${JSON.stringify(migration, null, 2)}\n`;
  const migrationFile = await writeProjectFile(root, migrationPath, migrationText);
  const approvalFile = await writeProjectFile(
    root,
    "reports/approval.json",
    '{"approval":"must remain unchanged"}\n',
  );
  const coverageFile = await writeProjectFile(
    root,
    `migrations/${animationId}/evidence/full-frame-coverage.json`,
    '{"coverage":"must remain unchanged"}\n',
  );
  const contract = {
    animationId,
    migrationPath,
    assetManifestPath,
    migrationDispositionPath: "audit/bilingual-visual-source-disposition.json",
    dispositionPath,
    sourceSwf,
    sourceSwfSha256,
    expectedPriorAssetManifestSha256: priorAssetSha256,
    expectedCurrentAssetManifestSha256: assetSha256,
    expectedPriorDispositionSha256: priorDispositionSha256,
    expectedCurrentDispositionSha256: dispositionSha256,
  };
  return {
    root,
    contract,
    migration,
    migrationFile,
    assetFile,
    dispositionFile,
    approvalFile,
    coverageFile,
  };
}

test("CLI accepts only the targeted check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false, help: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true, help: false});
  assert.deepEqual(parseArguments(["--help"]), {check: false, help: true});
  assert.throws(() => parseArguments(["--write-approvals"]), /Unknown option/);
});

test("refreshes only the two GS002 pins and preserves the technical projection", async () => {
  const fixture = await createFixture();
  const approvalBefore = await readFile(fixture.approvalFile);
  const coverageBefore = await readFile(fixture.coverageFile);
  const assetBefore = await readFile(fixture.assetFile);
  const dispositionBefore = await readFile(fixture.dispositionFile);
  const projectionBefore = technicalManifestSha256(fixture.migration);

  const result = await refreshGs002RootStructuralPins({
    root: fixture.root,
    contract: fixture.contract,
  });
  assert.equal(result.action, "written");
  assert.deepEqual(result.changedFields, [
    "assetManifestSha256",
    "bilingualVisualDispositionSha256",
  ]);

  const updated = JSON.parse(await readFile(fixture.migrationFile, "utf8"));
  const expected = structuredClone(fixture.migration);
  expected.implementation.rootStructuralInspection.assetManifestSha256
    = fixture.contract.expectedCurrentAssetManifestSha256;
  expected.implementation.rootStructuralInspection
    .bilingualVisualDispositionSha256
    = fixture.contract.expectedCurrentDispositionSha256;
  assert.deepEqual(updated, expected);
  assert.equal(technicalManifestSha256(updated), projectionBefore);
  assert.equal(result.technicalManifestSha256, projectionBefore);
  assert.equal(
    result.migrationSha256,
    hash(await readFile(fixture.migrationFile)),
  );
  assert.deepEqual(await readFile(fixture.assetFile), assetBefore);
  assert.deepEqual(await readFile(fixture.dispositionFile), dispositionBefore);
  assert.deepEqual(await readFile(fixture.approvalFile), approvalBefore);
  assert.deepEqual(await readFile(fixture.coverageFile), coverageBefore);

  const checked = await refreshGs002RootStructuralPins({
    root: fixture.root,
    contract: fixture.contract,
    check: true,
  });
  assert.equal(checked.action, "verified");
  assert.equal(checked.changed, false);
});

test("check mode fails closed on stale pins without writing", async () => {
  const fixture = await createFixture();
  const before = await readFile(fixture.migrationFile);
  await assert.rejects(
    refreshGs002RootStructuralPins({
      root: fixture.root,
      contract: fixture.contract,
      check: true,
    }),
    /pins are stale/,
  );
  assert.deepEqual(await readFile(fixture.migrationFile), before);
});

test("fails closed on original-runtime or acceptance authority drift", async (t) => {
  await t.test("root manifest original-runtime baseline", async () => {
    const fixture = await createFixture({
      mutateAsset: (asset) => {
        asset.authority.originalRuntimeBaseline = true;
      },
    });
    await assert.rejects(
      refreshGs002RootStructuralPins({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /original-runtime authority must remain false/,
    );
  });

  await t.test("disposition original-host execution", async () => {
    const fixture = await createFixture({
      mutateDisposition: (disposition) => {
        disposition.generatedFrom.sameLessonHost.executionClaimed = true;
      },
    });
    await assert.rejects(
      refreshGs002RootStructuralPins({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /original-host execution authority must remain false/,
    );
  });

  await t.test("disposition owner acceptance", async () => {
    const fixture = await createFixture({
      mutateDisposition: (disposition) => {
        disposition.acceptanceEffects.ownerAcceptance = true;
      },
    });
    await assert.rejects(
      refreshGs002RootStructuralPins({
        root: fixture.root,
        contract: fixture.contract,
      }),
      /ownerAcceptance must remain false/,
    );
  });
});
