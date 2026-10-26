import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {Script} from "node:vm";

import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import candidate, {
  SHARED_NMS002_L01_P043_ASSESSMENT,
  SHARED_NMS002_L01_P043_FEEDBACK_LABELS,
  SHARED_NMS002_L01_P043_GLOSSARY_TERMS,
} from "../src/modules/shared-nms002-l01-p043";
import {
  SHARED_NMS002_L01_P043_CONFIG,
  SHARED_NMS002_L01_P043_SOURCE,
} from "../src/timelines/shared-nms002-l01-p043";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const RUNTIME = path.join(PROJECT_ROOT, "work/g678-shared-page-factory",
  "g678-ts07-nms-l1-current-js-1-v1/members",
  "shared-nms002-l01-p043/canvas-renderer.js");
const MEMBER_MANIFEST = path.join(PROJECT_ROOT,
  "work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1",
  "members/shared-nms002-l01-p043/member-manifest.json");

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("TS07 NMS product slice binds source order, stop, feedback, and language boundary", () => {
  assert.equal(candidate.key, "shared-nms002-l01-p043");
  assert.equal(candidate.maturity, "private-current-js");
  assert.deepEqual(candidate.lessonHost, {
    capabilities: ["glossary", "practice-feedback"],
    legacyOperations: "blocked",
    auditStorage: "memory-only",
    storesPersonalData: false,
  });
  assert.deepEqual(candidate.interactiveStops, [{
    id: "shared-nms002-l01-p043-quiz-stop",
    frameDomain: "sprite-331",
    stopFrame: 757,
    resumeFrame: 758,
    resolution: "explicit-source-feedback-finished",
    completionDisposition: "blocked-while-unresolved",
    requiresHostInteractiveStop: true,
    strictAcceptanceEffect: "none",
  }]);
  assert.equal(SHARED_NMS002_L01_P043_SOURCE.deploymentScope, "local-only");
  assert.equal(SHARED_NMS002_L01_P043_SOURCE.currentJavaScriptRegistered, false);
  assert.equal(SHARED_NMS002_L01_P043_SOURCE.productCalibrationPassed, false);
  assert.deepEqual(SHARED_NMS002_L01_P043_ASSESSMENT.answers.map((answer) =>
    [answer.instanceName, answer.sourceVisualOrder, answer.label.en,
      answer.result]), [
    ["AnsBtn1", 1, "36°", "wrong"],
    ["AnsBtn2", 4, "146°", "wrong"],
    ["AnsBtn3", 3, "38°", "right"],
    ["AnsBtn4", 2, "37°", "wrong"],
  ]);
  assert.equal(SHARED_NMS002_L01_P043_GLOSSARY_TERMS.length, 3);
  assert.equal(SHARED_NMS002_L01_P043_FEEDBACK_LABELS.length, 7);

  const markup = renderToStaticMarkup(createElement(candidate.Renderer, {
    frame: 757,
    frameDomain: SHARED_NMS002_L01_P043_CONFIG.mainFrameDomain,
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    uiLanguage: "es",
  }));
  assert.match(markup, /data-source-quiz-visual-frame="758"/u);
  assert.match(markup, /data-spanish-text-parity-accepted="false"/u);
  assert.match(markup, /la paridad textual en español sigue pendiente/u);
  const positions = ["AnsBtn1", "AnsBtn4", "AnsBtn3", "AnsBtn2"]
    .map((instance) => markup.indexOf(`data-source-instance="${instance}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((left, right) => left - right), positions);
});

test("TS07 NMS runtime registers an immutable source-bound Canvas asset", async () => {
  const runtime = await readFile(RUNTIME, "utf8");
  assert.doesNotMatch(runtime,
    /fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage/u);
  const sandbox = {
    document: {
      createElement(tagName: string) {
        if (tagName === "canvas") {
          return {getContext: () => ({}), width: 0, height: 0};
        }
        if (tagName === "img") {
          return {complete: true, naturalWidth: 1, naturalHeight: 1,
            decode: async () => undefined};
        }
        throw new Error(`unexpected runtime element: ${tagName}`);
      },
    },
  } as Record<string, unknown>;
  new Script(runtime, {filename: "shared-nms002-l01-p043.js"})
    .runInNewContext(sandbox);
  const registry = sandbox.HELP_MATH_CANVAS_ASSETS as Record<string, {
    resolveFrameState(request: Readonly<{frame: number; scenario: string;
      lang: string; seed: number}>): Readonly<{localFrame: number;
        exportFrame: number; audioRendered: false}>;
  }>;
  const asset = registry["shared-nms002-l01-p043"];
  assert.ok(asset);
  const property = Object.getOwnPropertyDescriptor(registry,
    "shared-nms002-l01-p043");
  assert.equal(property?.writable, false);
  assert.equal(property?.configurable, false);
  for (const frame of [1, 757, 758, 779]) {
    const state = asset.resolveFrameState({frame,
      scenario: "source-static-frame", lang: "en", seed: 0});
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.audioRendered, false);
  }
});

test("TS07 NMS maintained labels remain bound to frozen FFDec text exports", async () => {
  const manifest = JSON.parse(await readFile(MEMBER_MANIFEST, "utf8")) as {
    interaction: {sourceTextEvidence: Array<{
      objectId: number;
      value: string;
      binding: {path: string; bytes: number; sha256: string};
    }>};
  };
  assert.equal(manifest.interaction.sourceTextEvidence.length, 13);
  for (const evidence of manifest.interaction.sourceTextEvidence) {
    const bytes = await readFile(path.join(PROJECT_ROOT, evidence.binding.path));
    assert.equal(bytes.length, evidence.binding.bytes);
    assert.equal(sha256(bytes), evidence.binding.sha256);
    assert.equal(bytes.toString("utf8")
      .replaceAll("--- RECORDSEPARATOR ---", " ")
      .replace(/\s+/gu, " ").trim(), evidence.value);
  }
});
