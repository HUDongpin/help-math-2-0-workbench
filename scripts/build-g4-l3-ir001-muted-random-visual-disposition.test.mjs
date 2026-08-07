import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";
import {
  OUTPUT_JSON,
  SPEC_PATH,
  buildIr001MutedRandomVisualDisposition,
  validateIr001MutedRandomInputs,
} from "./build-g4-l3-ir001-muted-random-visual-disposition.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_AUDIT =
  "migrations/course-g04-l03-ir-001-341242cc/audit/machine/g4-l3-source-audit.json";
const AUTHORING_AUDIT =
  "work/animate/dependency-authoring-audits/course-g04-l03-ir-001-341242cc/" +
  "runs/run-7AWuup/L3RW01.fla-authoring-audit.json";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IR/" +
  "L3RW01.swf";

const SOURCE_SCRIPTS = new Map([
  ["DefineSprite_27/frame_1/DoAction.as",
    "tempNum = random(2);\n_global.tempRandomSoundMc = \"Mc_Sound_\" + tempNum;"],
  ["DefineSprite_27/frame_5/DoAction.as",
    "eval(_global.tempRandomSoundMc).gotoAndPlay(2);"],
  ["DefineSprite_27/frame_136/DoAction.as", "stop();"],
  ["DefineSprite_9/frame_1/DoAction.as", "stop();"],
  ["DefineSprite_9/frame_135/DoAction.as", "stop();"],
  ["DefineSprite_10/frame_1/DoAction.as", "stop();"],
  ["DefineSprite_10/frame_135/DoAction.as", "stop();"],
]);

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function loadInputs() {
  const [spec, sourceAudit, authoringAudit, swf] = await Promise.all([
    readJson(SPEC_PATH),
    readJson(SOURCE_AUDIT),
    readJson(AUTHORING_AUDIT),
    readFile(path.join(ROOT, SOURCE_SWF)),
  ]);
  return {
    spec,
    sourceAudit,
    authoringAudit,
    sourceFacts: parseSwfSourceFacts(swf),
    scripts: new Map(SOURCE_SCRIPTS),
  };
}

test("IR001 source proves random selection changes audio, not the muted display list", async () => {
  const validated = validateIr001MutedRandomInputs(await loadInputs());
  assert.equal(validated.mainDomain.domainId, "sprite-27");
  assert.equal(validated.mainDomain.declaredFrameCount, 136);
  assert.deepEqual(validated.soundDomains.map(({domainId}) => domainId),
    ["sprite-9", "sprite-10"]);
  assert.deepEqual(validated.soundClips.map(({streamSoundName}) => streamSoundName),
    ["S0", "S1"]);
  assert.ok(validated.soundClips.every(({staticVisualMarker}) =>
    staticVisualMarker.durationFrames === 135));
});

test("IR001 muted-random disposition rejects script and visual-marker drift", async () => {
  const inputs = await loadInputs();
  const scripts = new Map(inputs.scripts);
  scripts.set("DefineSprite_27/frame_1/DoAction.as", "tempNum = random(3);");
  assert.throws(() => validateIr001MutedRandomInputs({...inputs, scripts}),
    /source-proven random\/audio contract/);

  const authoringAudit = structuredClone(inputs.authoringAudit);
  const soundItem = authoringAudit.library.find(({name}) => name === "Mc_Sound_1");
  const shapeLayer = soundItem.timeline.layers.find(({name}) => name === "Layer 1");
  shapeLayer.keyframes[0].duration = 134;
  assert.throws(() => validateIr001MutedRandomInputs({...inputs, authoringAudit}),
    /static visual marker duration changed/);
});

test("IR001 muted-random report is reproducible and acceptance-neutral", async () => {
  const built = await buildIr001MutedRandomVisualDisposition();
  const checkedIn = await readFile(path.join(ROOT, OUTPUT_JSON), "utf8");
  assert.equal(checkedIn, built.json);
  assert.equal(built.report.status,
    "verified-random-audio-selection-does-not-change-source-visual");
  assert.deepEqual(built.report.visualDisposition.frames,
    {first: 1, lastInclusive: 136});
  assert.equal(built.report.visualDisposition.sourceStaticMutedDrawingRenderable, true);
  assert.equal(built.report.visualDisposition.randomSelectionChangesDisplayList, false);
  assert.equal(built.report.visualDisposition.audioRenderedOrAccepted, false);
  assert.ok(Object.entries(built.report.acceptance)
    .filter(([name]) => name !== "acceptanceNeutral")
    .every(([, value]) => value === false));
  assert.equal(built.report.acceptance.acceptanceNeutral, true);
  assert.equal(built.report.strictAcceptanceEffect, "none");
});
