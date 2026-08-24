import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {gunzipSync} from "node:zlib";
import {createContext, runInContext} from "node:vm";
import {fileURLToPath} from "node:url";

import {run} from "./build-g5-l5-fq003-behavior-aware-canvas.mjs";
import {
  CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
  CURRENT_JS_CANDIDATE_FLASH_ROOT,
} from "./current-js-candidate-paths.mjs";
import {
  deriveFq003BehaviorIr,
  sha256,
} from "./lib/g5-l5-fq003-behavior-composite.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ANIMATION_ID = "course-g05-l05-fq-003";
const MIGRATION_ROOT = path.join(ROOT, "migrations", ANIMATION_ID);
const ASSET_ROOT = path.join(
  ROOT,
  CURRENT_JS_CANDIDATE_FLASH_ROOT,
  "courses",
  ANIMATION_ID,
);
const EVIDENCE_ROOT = path.join(
  ROOT,
  CURRENT_JS_CANDIDATE_EVIDENCE_ROOT,
  "courses",
  ANIMATION_ID,
  "product-candidate-assets-v1",
);
const ANSWER_KEY = Object.freeze([
  2, 4, 3, 1, 1, 1, 4, 3, 2, 4, 3, 4, 3,
  3, 2, 1, 3, 4, 3, 2, 3, 1, 1, 1, 2, 2,
]);

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

test("FQ003 behavior-aware artifacts are deterministic and current", async () => {
  const summary = await run({write: false});
  assert.equal(summary.contractId, "g5-l5-fq003-source-behavior-composite-v1");
  assert.equal(summary.stateCount, 157);
  assert.equal(summary.dynamicTextFieldCount, 263);
  assert.match(summary.irFingerprintSha256, /^[a-f0-9]{64}$/);
  assert.match(summary.runtimeSha256, /^[a-f0-9]{64}$/);
});

test("FQ003 IR binds the exact source order and source-script assignments", async () => {
  const ir = await readJson(path.join(MIGRATION_ROOT, "audit/behavior-composite-ir.json"));
  assert.deepEqual(ir.derived.answerKey, ANSWER_KEY);
  assert.deepEqual(ir.derived.selection, {
    bankSize: 26,
    randomnessInjected: false,
    selectedCount: 26,
    sourceOrderPreserved: true,
  });
  assert.deepEqual(ir.derived.scriptAssignments.initial, [
    {target: "Mc_Result._visible", value: false},
    {target: "Mc_Finish._visible", value: false},
    {target: "Mc_Finish.frame", value: 1},
  ]);
  assert.deepEqual(ir.derived.scriptAssignments.terminal, [
    {target: "Mc_Finish._visible", value: true},
    {target: "Mc_Finish.frame", value: 2},
  ]);
  assert.equal(ir.derived.visualReconstruction.result.sourceMcResultPlacementCount, 0);
  assert.equal(ir.derived.audio.currentJsDisposition,
    "disabled-pending-exact-audio-closure-and-listening-acceptance");
  assert.equal(ir.acceptanceEffects.strictComplete, false);
  assert.equal(ir.acceptanceEffects.ownerAccepted, false);
});

test("FQ003 parser fails closed if a source visibility assignment changes", async () => {
  const [bundleGzip, inventory, swfmillGzip] = await Promise.all([
    readFile(path.join(MIGRATION_ROOT, "audit/machine/ffdec-scripts.txt.gz")),
    readJson(path.join(MIGRATION_ROOT, "audit/script-inventory.json")),
    readFile(path.join(MIGRATION_ROOT, "audit/machine/swfmill.xml.gz")),
  ]);
  const original = gunzipSync(bundleGzip).toString("utf8");
  const changed = original.replace(
    "Mc_Finish._visible = false;",
    "Mc_Finish._visible = true;",
  );
  assert.notEqual(changed, original);
  const setupPattern = /===== DefineSprite_830\/frame_1\/DoAction\.as =====\n([\s\S]*?)(?=\n===== |$)/;
  const changedBody = `${changed.match(setupPattern)[1].replace(/\n+$/, "")}\n`;
  const changedInventory = structuredClone(inventory);
  const setup = changedInventory.scripts.find(
    ({sourcePath}) => sourcePath === "DefineSprite_830/frame_1/DoAction.as",
  );
  setup.bytes = Buffer.byteLength(changedBody);
  setup.sha256 = sha256(changedBody);
  assert.throws(
    () => deriveFq003BehaviorIr({
      scriptBundleText: changed,
      scriptInventory: changedInventory,
      swfmillXml: gunzipSync(swfmillGzip).toString("utf8"),
      bindings: {},
    }),
    /lost required token Mc_Finish\._visible = false/,
  );
});

test("generated runtime separates ordinary rendering from exact composite states", async () => {
  const [runtime, spec, manifest] = await Promise.all([
    readFile(path.join(ASSET_ROOT, "canvas-renderer.js"), "utf8"),
    readJson(path.join(EVIDENCE_ROOT, "adapter-spec.json")),
    readJson(path.join(EVIDENCE_ROOT, "manifest.json")),
  ]);
  const composite = spec.runtimeContract.sourceBehaviorComposite;
  assert.equal(composite.states.length, 157);
  assert.equal(composite.states[0].stateId, "question-n1");
  assert.equal(composite.states.at(-1).stateId, "review-q26-selected4");
  assert.equal(composite.states.find(({stateId}) => stateId === "question-n1")
    .hiddenFunctions.includes("sprite16"), true);
  assert.equal(composite.states.find(({stateId}) => stateId === "result-score26")
    .frameOverrides.sprite16, 1);
  assert.equal(manifest.acceptanceEffects.visualFidelityAccepted, false);
  assert.equal(manifest.candidateScope.otherG5L5PagesStartedByThisTransaction, 0);

  const sandbox = {
    document: {
      createElement(kind) {
        if (kind === "img") {
          return {complete: true, naturalWidth: 1, src: ""};
        }
        if (kind === "canvas") {
          return {width: 800, height: 600, getContext() { return {}; }};
        }
        throw new Error(`unexpected element ${kind}`);
      },
    },
  };
  sandbox.globalThis = sandbox;
  createContext(sandbox);
  runInContext(runtime, sandbox, {filename: "fq003-canvas-renderer.js"});
  const asset = sandbox.HELP_MATH_CANVAS_ASSETS[ANIMATION_ID];
  assert.equal(typeof asset.render, "function");
  assert.equal(typeof asset.renderComposite, "function");
  assert.equal(asset.metadata.sourceBehaviorComposite.stateIds.length, 157);
  const canvas = {width: 800, height: 600, getContext() { throw new Error("late draw"); }};
  assert.throws(
    () => asset.render(canvas, {
      frame: 2,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: composite.contractId,
      behaviorCompositeState: "question-n1",
    }),
    /behavior-composite fields require renderComposite/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {
      frame: 2,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: "wrong-contract-v1",
      behaviorCompositeState: "question-n1",
    }),
    /behavior-composite contract changed/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {
      frame: 2,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: composite.contractId,
      behaviorCompositeState: "unknown-state",
    }),
    /unsupported behavior-composite state/,
  );
  assert.throws(
    () => asset.renderComposite(canvas, {
      frame: 3,
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
      behaviorCompositeContractId: composite.contractId,
      behaviorCompositeState: "question-n1",
    }),
    /does not allow local frame 3/,
  );
});
