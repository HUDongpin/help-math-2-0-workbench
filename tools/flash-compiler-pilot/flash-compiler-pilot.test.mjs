import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import test from "node:test";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  assertActiveLessonPageEligibility,
  classifyAvm1Location,
  fileIdentity,
  parseSwfmillXml,
  validateCorpus,
  validateObservedStructure,
} from "./lib/core.mjs";

const execFileAsync = promisify(execFile);

test("formal corpus is exactly five active lesson pages and zero shells", async () => {
  const validation = await validateCorpus();
  assert.equal(validation.summary.memberCount, 5);
  assert.equal(validation.summary.activeReferencedPageCount, 5);
  assert.equal(validation.summary.shellCount, 0);
  assert.equal(validation.summary.pairedFlaCount, 4);
  assert.equal(validation.summary.swfOnlyCount, 1);
  assert.equal(validation.scope.activeCoursePageOccurrenceDenominator, 1751);
  assert.equal(validation.scope.legacyCourseShellsExcluded, true);
  assert.equal(validation.scope.modernCourseUiRetained, true);
  assert.deepEqual(
    validation.members.map((member) => member.animationId),
    [
      "course-g03-l01-fq-001",
      "course-g04-l03-vb-002",
      "course-g04-l10-vb-003",
      "course-g05-l04-ir-001-a662633d",
      "course-g05-l05-in-011",
    ],
  );
  assert.equal(validation.members.at(-1).pairedFla, null);
  assert.equal(validation.members[3].source.path,
    "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf");
});

test("page-only eligibility rejects shell, variant, unreferenced, shell-like path, and missing XML", () => {
  const member = {
    animationId: "course-g03-l01-fq-001",
    source: {path: "HELP_COURSES/ELMGR3/L1/FQ/L1FQ01.swf"},
  };
  const entry = {
    flags: {referenced: true, unreferenced: false, variant: false, shell: false},
    references: {courseXml: [{occurrence: 72}]},
    classification: {collection: "course", page: {number: 1}},
  };
  assert.doesNotThrow(() => assertActiveLessonPageEligibility(member, entry));
  for (const [label, mutate, pattern] of [
    ["shell", (value) => { value.flags.shell = true; }, /legacy course shell rejected/],
    ["variant", (value) => { value.flags.variant = true; }, /variants are not allowed/],
    ["unreferenced", (value) => { value.flags.referenced = false; }, /only active referenced pages/],
    ["missing XML", (value) => { value.references.courseXml = []; }, /missing active lesson XML/],
  ]) {
    const changed = structuredClone(entry);
    mutate(changed);
    assert.throws(() => assertActiveLessonPageEligibility(member, changed), pattern, label);
  }
  const shellPath = structuredClone(member);
  shellPath.source.path = "HELP_COURSES/ELMGR3/L1/index.swf";
  assert.throws(() => assertActiveLessonPageEligibility(shellPath, entry),
    /legacy shell-like basename rejected/);
});

test("swfmill parser preserves separate root and nested frame domains", () => {
  const xml = `<?xml version="1.0"?><swf version="6" compressed="1">
    <Header framerate="12" frames="10"><size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size><tags>
      <DoAction><actions><Stop/></actions></DoAction>
      <DefineButton2 objectID="9"/>
      <SoundStreamHead sampleSize="1"></SoundStreamHead><SoundStreamBlock></SoundStreamBlock>
      <DefineSprite objectID="42" frames="339"><tags><ShowFrame/></tags></DefineSprite>
    </tags></Header></swf>`;
  const observed = parseSwfmillXml(xml);
  const member = {
    animationId: "fixture",
    expectedStructure: {
      swfVersion: 6,
      stageWidth: 800,
      stageHeight: 600,
      fps: 12,
      rootFrameCount: 10,
      scriptLocations: 1,
      buttons: 1,
      embeddedSoundTags: 2,
      nestedSprites: [{objectId: 42, frameCount: 339}],
    },
  };
  const validated = validateObservedStructure(member, observed);
  assert.deepEqual(validated.frameDomains, {
    root: {timelineId: "root", frameCount: 10},
    nested: [{timelineId: "sprite-42", objectId: 42, frameCount: 339}],
  });
  const drifted = structuredClone(member);
  drifted.expectedStructure.nestedSprites[0].frameCount = 10;
  assert.throws(() => validateObservedStructure(drifted, observed),
    /nested sprite frame domains drifted/);
});

test("AVM1 location classifier is mutually exclusive and never emits arbitrary eval", () => {
  const cases = [
    ["frame_1/DoAction.as", "", "empty"],
    ["frame_6/DoAction.as", "stop();\r\n", "pure-stop"],
    ["frame_1/DoAction.as", '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n', "legacy-preloader-boilerplate"],
    ["DefineButton2_11/BUTTONCONDACTION on(release).as", 'on(release){\r\n   _global.KeyAttribute = "Number line";\r\n   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n', "button-modern-host-binding"],
    ["DefineSprite_53/frame_1/DoAction.as", 'tempNum = random(2);\r\n_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;\r\n', "page-specific-dynamic-sound-selection"],
    ["DefineSprite_53/frame_5/DoAction.as", "eval(_global.tempRandomSoundMc).gotoAndPlay(2);\r\n", "page-specific-dynamic-sound-selection"],
  ];
  for (const [filePath, source, expected] of cases) {
    const classification = classifyAvm1Location(filePath, Buffer.from(source));
    assert.equal(classification.category, expected);
    if (source.includes("eval")) {
      assert.equal(classification.payload.arbitraryEvalPermitted, false);
    }
  }
  assert.equal(
    classifyAvm1Location("mystery.as", Buffer.from("eval(userInput);"))
      .category,
    "unsupported-unclassified-script",
  );
});

test("acceptance effects remain an exact all-false boundary", () => {
  assert.deepEqual(ACCEPTANCE_EFFECTS_FALSE, {
    sourceCustodyChanged: false,
    modernCourseUiChanged: false,
    legacyCourseShellConverted: false,
    currentJavaScriptRegistered: false,
    originalRuntimeAccepted: false,
    visualFidelityAccepted: false,
    behaviorAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    released: false,
    published: false,
  });
});

test("vendored wrappers match the audited prototypes", async () => {
  const next2d = await fileIdentity(path.join(
    PROJECT_ROOT,
    "tools/flash-compiler-pilot/vendor/next2d/next2d-headless-extract.mjs",
  ));
  const openfl = await fileIdentity(path.join(
    PROJECT_ROOT,
    "tools/flash-compiler-pilot/vendor/openfl/normalize-openfl.mjs",
  ));
  assert.equal(next2d.sha256,
    "bb49570a3ecaa4c625aeb8d2e7d431b15ab59c87537264a6c7d5b700c95651c1");
  assert.equal(openfl.sha256,
    "27e4a05c0ce9602cecf4b927cfec7565e2e5a61116455535207ef89abaccbe97");
});

test("CLI refuses output outside the ignored compiler-pilot work root", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(PROJECT_ROOT, "tools/flash-compiler-pilot/run.mjs"),
      "build",
      "--output", "/tmp/not-allowed",
      "--backend", "ffdec",
    ], {cwd: PROJECT_ROOT}),
    (error) => {
      assert.match(`${error.stdout || ""}${error.stderr || ""}`,
        /--output must be below work\/flash-compiler-pilot/);
      return true;
    },
  );
});

test("formal report, when present, cannot promote machine evidence", async (context) => {
  const reportPath = path.join(PROJECT_ROOT, "reports/flash-compiler-pilot/summary.json");
  let report;
  try {
    report = JSON.parse(await readFile(reportPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      context.skip("formal report is created after backend execution");
      return;
    }
    throw error;
  }
  assert.equal(report.scope.activeLessonPageMembers, 5);
  assert.equal(report.scope.legacyCourseShellMembers, 0);
  assert.equal(report.avm1PilotLongTail.locationCount, 50);
  assert.equal(report.avm1PilotLongTail.pageSpecificDynamicLocations, 2);
  assert.ok(Object.values(report.acceptanceEffects).every((value) => value === false));
});
