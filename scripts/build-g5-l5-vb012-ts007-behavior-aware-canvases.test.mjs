import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {gunzipSync} from "node:zlib";
import {createContext, runInContext} from "node:vm";
import {fileURLToPath} from "node:url";

import {run} from "./build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs";
import {
  CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
  CURRENT_JS_CANDIDATE_FLASH_ROOT,
} from "./current-js-candidate-paths.mjs";
import {
  deriveVb012BehaviorIr,
  sha256,
} from "./lib/g5-l5-representative-behavior-composites.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IDS = Object.freeze([
  "course-g05-l05-vb-012",
  "course-g05-l05-ts-007",
]);

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function migrationPath(id, suffix) {
  return path.join(ROOT, "migrations", id, suffix);
}

function assetPath(id, suffix) {
  return suffix.endsWith('.json')
    ? path.join(
      ROOT,
      CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
      'courses',
      id,
      'product-candidate-assets-v1',
      suffix,
    )
    : path.join(ROOT, CURRENT_JS_CANDIDATE_FLASH_ROOT, 'courses', id, suffix);
}

test("VB012 and TS007 behavior-aware artifacts are deterministic and current", async () => {
  const summary = await run({write: false});
  assert.equal(summary.mode, "check");
  assert.equal(summary.calibratedPageCount, 2);
  assert.equal(summary.otherG5L5PagesStarted, 0);
  assert.deepEqual(
    summary.pages.map(({animationId, contractId, stateCount}) => [
      animationId,
      contractId,
      stateCount,
    ]),
    [
      [
        "course-g05-l05-vb-012",
        "g5-l5-vb012-source-behavior-composite-v1",
        7,
      ],
      [
        "course-g05-l05-ts-007",
        "g5-l5-ts007-source-behavior-composite-v1",
        13,
      ],
    ],
  );
  for (const page of summary.pages) {
    assert.match(page.irFingerprintSha256, /^[a-f0-9]{64}$/);
    assert.match(page.runtimeSha256, /^[a-f0-9]{64}$/);
    assert.match(page.manifestSha256, /^[a-f0-9]{64}$/);
  }
});

test("VB012 IR binds the exact two-choice and second-wrong consequences", async () => {
  const ir = await readJson(migrationPath(
    IDS[0],
    "audit/behavior-composite-ir.json",
  ));
  assert.equal(ir.derived.behaviorKind,
    "fixed-choice-opposites-with-two-attempt-cap");
  assert.deepEqual(ir.derived.answerModel, {
    correctOption: 2,
    maximumWrongAttempts: 2,
    optionCount: 2,
  });
  assert.deepEqual(ir.derived.sourceAssignments.secondWrongCompletion, [
    "Mc_Click_Here._visible <- true",
    "Mc_Timer.frame <- 3",
  ]);
  assert.deepEqual(
    [
      ir.derived.placements.clickHere.name,
      ir.derived.placements.clickHere.objectId,
      ir.derived.placements.timer.name,
      ir.derived.placements.timer.objectId,
    ],
    ["Mc_Click_Here", 33, "Mc_Timer", 36],
  );
  assert.equal(ir.acceptanceEffects.behaviorParityAccepted, false);
  assert.equal(ir.acceptanceEffects.audioAccepted, false);
});

test("TS007 IR binds five stops, source explanation boxes, help, and option 2", async () => {
  const ir = await readJson(migrationPath(
    IDS[1],
    "audit/behavior-composite-ir.json",
  ));
  assert.equal(
    ir.derived.behaviorKind,
    "five-stop-multi-section-explanations-help-and-fixed-choice",
  );
  assert.deepEqual(ir.derived.timeline.stopFrames, [245, 384, 510, 628, 671]);
  assert.equal(ir.derived.answerModel.correctOption, 2);
  assert.deepEqual(
    [
      ir.derived.placements.section3Explanation.name,
      ir.derived.placements.section3Explanation.objectId,
      ir.derived.placements.section4Explanation.name,
      ir.derived.placements.section4Explanation.objectId,
      ir.derived.placements.helpPopup.name,
      ir.derived.placements.helpPopup.objectId,
    ],
    ["Mc_box1", 131, "Mc_box2", 154, "Mc_Popup", 181],
  );
  assert.equal(ir.derived.audio.embeddedStreamCount, 12);
  assert.equal(ir.acceptanceEffects.authoritativeOriginalRuntime, false);
});

test("VB012 parser fails closed if the source-hidden click-through changes", async () => {
  const root = path.join(ROOT, "migrations", IDS[0]);
  const [bundleGzip, inventory, swfmillGzip] = await Promise.all([
    readFile(path.join(root, "audit/machine/ffdec-scripts.txt.gz")),
    readJson(path.join(root, "audit/script-inventory.json")),
    readFile(path.join(root, "audit/machine/swfmill.xml.gz")),
  ]);
  const original = gunzipSync(bundleGzip).toString("utf8");
  const changed = original.replace(
    "Mc_Click_Here._visible = false;",
    "Mc_Click_Here._visible = true;",
  );
  assert.notEqual(changed, original);
  const pattern =
    /===== DefineSprite_234\/frame_81\/DoAction\.as =====\n([\s\S]*?)(?=\n===== |$)/;
  const changedBody = `${changed.match(pattern)[1].replace(/\n+$/, "")}\n`;
  const changedInventory = structuredClone(inventory);
  const entry = changedInventory.scripts.find(
    ({sourcePath}) => sourcePath === "DefineSprite_234/frame_81/DoAction.as",
  );
  entry.bytes = Buffer.byteLength(changedBody);
  entry.sha256 = sha256(changedBody);
  assert.throws(
    () => deriveVb012BehaviorIr({
      scriptBundleText: changed,
      scriptInventory: changedInventory,
      swfmillXml: gunzipSync(swfmillGzip).toString("utf8"),
      bindings: {},
    }),
    /lost required token Mc_Click_Here\._visible = false/,
  );
});

test("generated composites expose only exact state and frame contracts", async () => {
  const [vbSpec, vbManifest, tsSpec, tsManifest] = await Promise.all([
    readJson(assetPath(IDS[0], "adapter-spec.json")),
    readJson(assetPath(IDS[0], "manifest.json")),
    readJson(assetPath(IDS[1], "adapter-spec.json")),
    readJson(assetPath(IDS[1], "manifest.json")),
  ]);
  const vb = vbSpec.runtimeContract.sourceBehaviorComposite;
  const ts = tsSpec.runtimeContract.sourceBehaviorComposite;
  assert.deepEqual(vb.states.map(({stateId}) => stateId), [
    "intro",
    "question-idle",
    "question-wrong-attempt1",
    "question-retry-attempt1",
    "question-correct",
    "question-wrong-attempt2",
    "complete",
  ]);
  assert.deepEqual(
    vb.states.find(({stateId}) => stateId === "question-wrong-attempt2")
      .frameOverrides,
    {sprite36: 2},
  );
  assert.deepEqual(
    vb.states.find(({stateId}) => stateId === "question-wrong-attempt2")
      .forceOpaqueFunctions,
    ["sprite33"],
  );
  assert.equal(
    ts.states.find(({stateId}) => stateId === "section-3-idle")
      .hiddenFunctions.includes("sprite131"),
    true,
  );
  assert.equal(
    ts.states.find(({stateId}) => stateId === "section-3-explanation")
      .forceOpaqueFunctions.includes("sprite131"),
    true,
  );
  assert.equal(
    ts.states.find(({stateId}) => stateId === "question-help-open")
      .forceOpaqueFunctions.includes("sprite181"),
    true,
  );
  for (const manifest of [vbManifest, tsManifest]) {
    assert.equal(manifest.candidateScope.legacyCourseShellExcluded, true);
    assert.equal(manifest.candidateScope.otherG5L5PagesStartedByThisTransaction, 0);
    assert.equal(manifest.acceptanceEffects.strictComplete, false);
    assert.equal(manifest.acceptanceEffects.published, false);
  }
});

test("VB012 runtime rejects wrong contract, state, and state-frame pairing", async () => {
  const [runtime, spec] = await Promise.all([
    readFile(assetPath(IDS[0], "canvas-renderer.js"), "utf8"),
    readJson(assetPath(IDS[0], "adapter-spec.json")),
  ]);
  const sandbox = {
    document: {
      createElement(kind) {
        if (kind === "img") return {complete: true, naturalWidth: 1, src: ""};
        if (kind === "canvas") {
          return {width: 800, height: 600, getContext() { return {}; }};
        }
        throw new Error(`unexpected element ${kind}`);
      },
    },
  };
  sandbox.globalThis = sandbox;
  createContext(sandbox);
  runInContext(runtime, sandbox, {filename: "vb012-canvas-renderer.js"});
  const asset = sandbox.HELP_MATH_CANVAS_ASSETS[IDS[0]];
  assert.equal(typeof asset.renderComposite, "function");
  assert.equal(asset.metadata.sourceBehaviorComposite.stateIds.length, 7);
  const canvas = {
    width: 800,
    height: 600,
    getContext() { throw new Error("late draw"); },
  };
  const request = {
    frame: 81,
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    behaviorCompositeContractId:
      spec.runtimeContract.sourceBehaviorComposite.contractId,
    behaviorCompositeState: "question-idle",
  };
  assert.throws(
    () => asset.render(canvas, request),
    /behavior-composite fields require renderComposite/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {
      ...request,
      behaviorCompositeContractId: "wrong-contract-v1",
    }),
    /behavior-composite contract changed/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {
      ...request,
      behaviorCompositeState: "unknown-state",
    }),
    /unsupported behavior-composite state/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {...request, frame: 80}),
    /does not allow local frame 80/,
  );
});
