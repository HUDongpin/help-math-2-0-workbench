import assert from "node:assert/strict";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {gzipSync} from "node:zlib";
import Ajv from "ajv";

import {
  COURSE_AUDIT_IDS,
  COURSE_PILOT_IDS,
  G4_L3_LESSON_AUDIT_IDS,
  applyHostBindingResolution,
  buildCourseScenarioInventories,
  extractCourseXmlEvidence,
  extractSwfmillEvidence,
  parseArguments,
  parseScriptBundle,
  readScenarioInputSnapshot,
  selectVerifiedLessonReleaseMembers,
  summarizeFfdecTags,
} from "./build-course-scenario-inventories.mjs";

test("the G4 L3 audit allowlist covers the exact 39 pages plus shell without duplicates", () => {
  assert.equal(G4_L3_LESSON_AUDIT_IDS.length, 40);
  assert.equal(new Set(G4_L3_LESSON_AUDIT_IDS).size, 40);
  assert.equal(G4_L3_LESSON_AUDIT_IDS.at(-1), "shell-course-g04-l03-index-local");
  for (const id of G4_L3_LESSON_AUDIT_IDS) assert.equal(COURSE_AUDIT_IDS.includes(id), true, id);
});

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const G5_L4_WORK_STUDY_IDS = Object.freeze([
  "shell-course-g05-l04-index-local",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-019",
  "course-g05-l04-fq-002",
]);

test("parses bounded scenario inventory arguments", () => {
  const options = parseArguments([
    "--check",
    "--id", COURSE_PILOT_IDS[0],
    "--id", COURSE_PILOT_IDS[1],
    "--migrations", "migrations",
    "--lesson-releases", "catalog/lesson-releases.json",
    "--release-id", "lesson-g05-l04-number-lines",
    "--python", "/usr/bin/python3",
  ]);
  assert.equal(options.check, true);
  assert.deepEqual(options.ids, COURSE_PILOT_IDS.slice(0, 2));
  assert.equal(options.migrationsRoot, path.resolve("migrations"));
  assert.equal(options.lessonReleasesPath, path.resolve("catalog/lesson-releases.json"));
  assert.equal(options.releaseId, "lesson-g05-l04-number-lines");
  assert.equal(options.python, "/usr/bin/python3");
  assert.throws(() => parseArguments(["--id"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);
});

test("selects the four G5 L4 work-study IDs only through exact lesson-release membership", async () => {
  const catalog = JSON.parse(await readFile(path.join(projectRoot, "catalog", "lesson-releases.json"), "utf8"));
  const members = selectVerifiedLessonReleaseMembers(
    catalog,
    G5_L4_WORK_STUDY_IDS,
    {releaseId: "lesson-g05-l04-number-lines"},
  );
  assert.deepEqual(members.map(({animationId}) => animationId), G5_L4_WORK_STUDY_IDS);
  assert.deepEqual(members.map(({releaseId}) => releaseId), G5_L4_WORK_STUDY_IDS.map(() => "lesson-g05-l04-number-lines"));
  assert.deepEqual(members.map(({ordinal}) => ordinal), [55, 2, 32, 53]);
  assert.equal(members.every(({assetId, source}) => assetId === `swf-${source.sha256}`), true);
  assert.equal(G5_L4_WORK_STUDY_IDS.every((id) => !COURSE_AUDIT_IDS.includes(id)), true);

  assert.throws(
    () => selectVerifiedLessonReleaseMembers(catalog, G5_L4_WORK_STUDY_IDS),
    /Exact lesson release ID is required/,
  );
  assert.throws(
    () => selectVerifiedLessonReleaseMembers(
      catalog,
      G5_L4_WORK_STUDY_IDS,
      {releaseId: "lesson-g05-l05-place-value"},
    ),
    /Unknown lesson release/,
  );
  assert.throws(
    () => selectVerifiedLessonReleaseMembers(
      catalog,
      ["course-g05-l04-not-a-member"],
      {releaseId: "lesson-g05-l04-number-lines"},
    ),
    /not verified lesson-release members/,
  );
  const tampered = structuredClone(catalog);
  const release = tampered.releases.find(({releaseId}) => releaseId === "lesson-g05-l04-number-lines");
  release.members.find(({animationId}) => animationId === G5_L4_WORK_STUDY_IDS[1]).assetId = `swf-${"0".repeat(64)}`;
  assert.throws(
    () => selectVerifiedLessonReleaseMembers(
      tampered,
      G5_L4_WORK_STUDY_IDS,
      {releaseId: "lesson-g05-l04-number-lines"},
    ),
    /assetId does not match source SHA-256/,
  );
});

test("indexes exact handlers, scoped dependencies, branches, random calls, and blocked side effects", () => {
  const source = `===== DefineButton2_7/BUTTONCONDACTION on(release).as =====
on(release){
   _global.quizTryCount++;
   if(_global.quizTryCount >= 2)
   {
      _root.showWrongFeed();
      getURL("javascript:history.back()","");
   }
}

===== DefineSprite_9/frame_12/DoAction.as =====
_global.tempQNo = random(2);
gotoAndStop("Final");
`;
  const parsed = parseScriptBundle(source, {compressedSha256: "a".repeat(64)});
  assert.equal(parsed.blocks.length, 2);
  const handler = parsed.blocks[0];
  assert.deepEqual(handler.event, ["release"]);
  assert.equal(handler.scope.objectId, "7");
  assert.equal(handler.categories.includes("wrong-outcome"), true);
  assert.equal(handler.categories.includes("side-effect"), true);
  assert.equal(handler.signals.conditionals[0].condition, "_global.quizTryCount >= 2");
  assert.deepEqual(handler.signals.sideEffects.map(({api}) => api), ["getURL", "javascript-url"]);
  assert.equal(handler.signals.sideEffects.every((item) => item.safeFixtureMode === "blocked-record-only"), true);
  assert.equal(handler.signals.scopeReferences.includes("_root.showWrongFeed"), true);
  assert.equal(parsed.blocks[1].signals.randomCalls[0].arguments, "2");
  assert.equal(parsed.blocks[1].signals.transitions[0].arguments, "\"Final\"");
  assert.equal(parsed.blocks.every((block) => block.evidence.lineStart <= block.evidence.lineEnd), true);
});

test("applies only explicit hash-evidenced intrinsic or child-self-initialized binding resolutions", () => {
  const dependencies = {
    bindings: [{
      binding: "_global.tempRandomSoundMc",
      scope: "_global",
      fixtureRequirement: "shared-state-must-be-initialized-per-scenario",
      originalDefaultStatus: "unresolved-or-multiple-runtime-values",
      safeFixture: {mode: "explicit-scenario-value-required; no guessed legacy default", originalBehaviorClaimed: false},
    }],
    flashVarsCandidates: [],
  };
  const report = {
    schemaVersion: 1,
    status: "binding-names-resolved-runtime-scenarios-pending",
    bindings: [{
      binding: "_global.tempRandomSoundMc",
      disposition: "child-self-initialized-before-use",
      fixturePolicy: "do-not-inject-or-override",
      rationale: "frame 1 assignment precedes frame 5 use",
      evidence: [{artifactId: "ffdec-scripts", line: 14}],
      strictAcceptanceEffect: "none",
    }],
    strictAcceptanceEffect: "none",
  };
  const resolved = applyHostBindingResolution(dependencies, report);
  assert.equal(resolved.bindings[0].fixtureRequirement, "none-intrinsic-or-child-self-initialized");
  assert.equal(resolved.bindings[0].safeFixture.mode, "do-not-inject-or-override");
  assert.equal(resolved.bindings[0].staticResolution.disposition, "child-self-initialized-before-use");
  assert.deepEqual(resolved.hostBindingResolution.resolvedBindings, ["_global.tempRandomSoundMc"]);
  assert.throws(() => applyHostBindingResolution(dependencies, {
    ...report,
    bindings: [{...report.bindings[0], fixturePolicy: "inject-a-guess"}],
  }), /fail closed against fixture injection/);
});

test("indexes FFDec tag offsets, definitions, labels, scripts, and exports", () => {
  const summary = summarizeFfdecTags(`00000010:    0. DefineSprite (chid: 7) tagId= 39 len= 8
00000020:      0. DoAction tagId= 12 len= 2
00000024:      1. FrameLabel (name: "Q1") tagId= 43 len= 3
0000002a:    1. ExportAssets (chid: 7, exp: "Quiz") tagId= 56 len= 8
`);
  assert.equal(summary.tagCounts.DefineSprite, 1);
  assert.deepEqual(summary.definitions[0], {
    tag: "DefineSprite",
    characterId: "7",
    evidence: {artifactId: "ffdec-tags", line: 1, byteOffset: "0x00000010"},
  });
  assert.equal(summary.scriptTags[0].tag, "DoAction");
  assert.equal(summary.frameLabels[0].name, "Q1");
  assert.equal(summary.exports[0].exportName, "Quiz");
});

test("uses XML parsers for swfmill structure and malformed legacy course XML", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "helpmath-scenario-xml-"));
  const swfmillPath = path.join(directory, "movie.xml.gz");
  const coursePath = path.join(directory, "index.xml");
  const swfmill = `<swf><Header frames="2"><tags>
    <DefineShape objectID="1"/>
    <DefineButton2 objectID="2"><buttons><Button hitTest="1" objectID="1" depth="1"><transform><Transform transX="20" transY="40"/></transform></Button></buttons><conditions><Condition pointerReleaseInside="1"/></conditions></DefineButton2>
    <DefineEditText objectID="3" readOnly="0" variableName="answer"><bounds><Rectangle left="0" right="100" top="0" bottom="40"/></bounds></DefineEditText>
    <DefineSprite objectID="4" frames="2"><tags><FrameLabel label="Q1"/><PlaceObject2 objectID="2" depth="1" name="answerButton"/><DoAction/><ShowFrame/><ShowFrame/></tags></DefineSprite>
    <PlaceObject2 objectID="4" depth="1" name="quiz"/><ShowFrame/><ShowFrame/>
  </tags></Header></swf>`;
  const course = `<Lesson><CourseName>Test & Math</CourseName><NewTitle1>Lesson</NewTitle1><LessonName>Lesson</LessonName><LessonNumber>1</LessonNumber><PageRoot>HELP_COURSES/ELMGR3/L1</PageRoot><Section SName="IN"><Title><English>Learn It</English><Spanish>Apréndelo</Spanish></Title><Page Title="A & B">IN/L1IN02.swf</Page></Section></Lesson>`;
  await writeFile(swfmillPath, gzipSync(swfmill));
  await writeFile(coursePath, course, "utf8");
  const structure = await extractSwfmillEvidence(swfmillPath);
  assert.equal(structure.timelines.length, 2);
  assert.equal(structure.timelines[1].frameLabels[0].label, "Q1");
  assert.equal(structure.timelines[1].structuralReachability, "reachable-from-root-placement-graph");
  assert.equal(structure.buttons[0].hitRecords[0].shapeObjectId, "1");
  assert.equal(structure.buttons[0].placements[0].name, "answerButton");
  assert.equal(structure.editTexts[0].attributes.variableName, "answer");
  const lesson = await extractCourseXmlEvidence(coursePath);
  assert.equal(lesson.bareAmpersandRepairs, 2);
  assert.equal(lesson.lesson.courseName, "Test & Math");
  assert.equal(lesson.sections[0].pages[0].attributes.Title, "A & B");
});

test("all ten checked-in course/shell scenario inventories are deterministic and fail closed", async () => {
  const results = await buildCourseScenarioInventories({check: true});
  assert.deepEqual(results.map(({id}) => id), COURSE_PILOT_IDS);
  assert.equal(results.every(({action}) => action === "verified"), true);

  const schema = JSON.parse(await readFile(path.join(projectRoot, "schemas", "course-scenario-inventory.schema.json"), "utf8"));
  const validate = new Ajv({allErrors: true}).compile(schema);
  for (const id of COURSE_PILOT_IDS) {
    const inventory = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "audit", "scenario-inventory.json"), "utf8"));
    assert.equal(validate(inventory), true, `${id}: ${JSON.stringify(validate.errors)}`);
  }
});

test("TS006 scenario inventory is deterministic and enumerates its three reachable timelines", async () => {
  const id = "course-g04-l03-ts-006";
  const [result] = await buildCourseScenarioInventories({ids: [id], check: true});
  assert.equal(result.action, "verified");
  const inventory = JSON.parse(await readFile(path.join(projectRoot, "migrations", id, "audit", "scenario-inventory.json"), "utf8"));
  assert.equal(inventory.inventoryStatus, "static-exhaustive-runtime-unverified");
  assert.deepEqual(
    inventory.timelineInventory
      .filter(({structuralReachability}) => structuralReachability === "root" || structuralReachability === "reachable-from-root-placement-graph")
      .map(({timelineId, frameCount}) => ({timelineId, frameCount})),
    [
      {timelineId: "root", frameCount: 10},
      {timelineId: "sprite-3", frameCount: 1},
      {timelineId: "sprite-23", frameCount: 128},
    ],
  );
  assert.equal(inventory.authoritativeRuntimeEvidence.length, 0);
  const readinessProjection = inventory.evidenceIndex.find(({artifactId}) => artifactId === "strict-readiness");
  assert.equal(readinessProjection.sourcePath, "audit/strict-readiness.json");
  assert.equal(readinessProjection.path, undefined);
  assert.equal(readinessProjection.hashMode, "canonical-json-v1");
  assert.equal(readinessProjection.projection, "course-scenario-readiness-inputs-v1");
  assert.deepEqual(readinessProjection.includedPaths, [
    "animationId",
    "machineAudit.observedBehaviorFromExtractedScripts",
    "branchCaptureReadiness.requiredScenarioInventory",
    "branchCaptureReadiness.missing",
  ]);
  assert.equal(inventory.strictAcceptanceEffect.startsWith("none;"), true);
});

test("G5 L4 FQ001 binds only scenario-consumed readiness fields", async () => {
  const id = "course-g05-l04-fq-001";
  const [result] = await buildCourseScenarioInventories({
    ids: [id],
    releaseId: "lesson-g05-l04-number-lines",
    check: true,
  });
  assert.equal(result.action, "verified");
  const inventory = JSON.parse(
    await readFile(
      path.join(projectRoot, "migrations", id, "audit", "scenario-inventory.json"),
      "utf8",
    ),
  );
  const readinessProjection = inventory.evidenceIndex.find(
    ({artifactId}) => artifactId === "strict-readiness",
  );
  assert.equal(readinessProjection.sourcePath, "audit/strict-readiness.json");
  assert.equal(readinessProjection.path, undefined);
  assert.equal(readinessProjection.hashMode, "canonical-json-v1");
  assert.equal(readinessProjection.projection, "course-scenario-readiness-inputs-v1");
  assert.deepEqual(readinessProjection.includedPaths, [
    "animationId",
    "machineAudit.observedBehaviorFromExtractedScripts",
    "branchCaptureReadiness.requiredScenarioInventory",
    "branchCaptureReadiness.missing",
  ]);
  assert.equal(inventory.strictAcceptanceEffect.startsWith("none;"), true);
});

test("preflights every selected pilot before writing when a later dependency is stale", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-scenario-transaction-"));
  const first = COURSE_PILOT_IDS[0];
  const second = COURSE_PILOT_IDS[1];
  const firstWorkspace = path.join(root, first);
  const firstOutput = path.join(firstWorkspace, "audit", "scenario-inventory.json");
  const sentinel = "first inventory must remain byte-for-byte unchanged\n";
  await mkdir(path.dirname(firstOutput), {recursive: true});
  await writeFile(firstOutput, sentinel, "utf8");

  await assert.rejects(
    buildCourseScenarioInventories({
      migrationsRoot: root,
      ids: [first, second],
      inventoryBuilder: async (id) => {
        if (id === second) throw new Error(`${second}: later dependency SHA is stale`);
        return {workspace: firstWorkspace, inventory: {animationId: first, generated: true}};
      },
    }),
    /later dependency SHA is stale/,
  );

  assert.equal(await readFile(firstOutput, "utf8"), sentinel);
});

test("explicit verified release members retain all-input preflight before output writes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-scenario-transaction-"));
  const [first, second] = G5_L4_WORK_STUDY_IDS;
  const firstWorkspace = path.join(root, first);
  const firstOutput = path.join(firstWorkspace, "audit", "scenario-inventory.json");
  const sentinel = "verified release member output must remain unchanged\n";
  await mkdir(path.dirname(firstOutput), {recursive: true});
  await writeFile(firstOutput, sentinel, "utf8");
  try {
    await assert.rejects(
      buildCourseScenarioInventories({
        migrationsRoot: root,
        ids: [first, second],
        releaseId: "lesson-g05-l04-number-lines",
        inventoryBuilder: async (id, {releaseMembership}) => {
          assert.equal(releaseMembership.animationId, id);
          if (id === second) throw new Error(`${second}: later verified input is stale`);
          return {workspace: firstWorkspace, inventory: {animationId: first, generated: true}};
        },
      }),
      /later verified input is stale/,
    );
    assert.equal(await readFile(firstOutput, "utf8"), sentinel);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("explicit verified release members write only audit/scenario-inventory.json", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-scenario-output-"));
  try {
    const results = await buildCourseScenarioInventories({
      migrationsRoot: root,
      ids: G5_L4_WORK_STUDY_IDS,
      releaseId: "lesson-g05-l04-number-lines",
      inventoryBuilder: async (id, {releaseMembership}) => {
        assert.equal(releaseMembership.animationId, id);
        assert.equal(releaseMembership.releaseId, "lesson-g05-l04-number-lines");
        assert.match(releaseMembership.catalogBinding.sha256, /^[a-f0-9]{64}$/);
        return {
          workspace: path.join(root, id),
          inventory: {
            animationId: id,
            inventoryStatus: "static-exhaustive-runtime-unverified",
            migrationStatusChanged: false,
          },
        };
      },
    });
    assert.deepEqual(results.map(({id, action}) => ({id, action})), G5_L4_WORK_STUDY_IDS.map((id) => ({id, action: "written"})));
    for (const id of G5_L4_WORK_STUDY_IDS) {
      const workspace = path.join(root, id);
      assert.deepEqual(await readdir(workspace), ["audit"]);
      assert.deepEqual(await readdir(path.join(workspace, "audit")), ["scenario-inventory.json"]);
      const inventory = JSON.parse(await readFile(path.join(workspace, "audit", "scenario-inventory.json"), "utf8"));
      assert.equal(inventory.animationId, id);
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("--release-id without --id selects every exact member in ordinal order", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "helpmath-release-scenario-all-members-"),
  );
  try {
    const catalog = JSON.parse(
      await readFile(
        path.join(projectRoot, "catalog", "lesson-releases.json"),
        "utf8",
      ),
    );
    const release = catalog.releases.find(
      ({releaseId}) => releaseId === "lesson-g05-l04-number-lines",
    );
    const expectedIds = release.members.map(({animationId}) => animationId);
    const results = await buildCourseScenarioInventories({
      migrationsRoot: root,
      releaseId: release.releaseId,
      inventoryBuilder: async (id, {releaseMembership}) => ({
        workspace: path.join(root, id),
        inventory: {
          animationId: id,
          ordinal: releaseMembership.ordinal,
          inventoryStatus: "static-exhaustive-runtime-unverified",
          migrationStatusChanged: false,
        },
      }),
    });
    assert.deepEqual(results.map(({id}) => id), expectedIds);
    assert.equal(results.length, 55);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("verified lesson-release membership does not invent missing strict-readiness inputs", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-scenario-missing-readiness-"));
  const id = G5_L4_WORK_STUDY_IDS[0];
  const workspace = path.join(root, id);
  await mkdir(workspace, {recursive: true});
  await writeFile(path.join(workspace, "migration.json"), "{}\n", "utf8");
  try {
    await assert.rejects(
      buildCourseScenarioInventories({
        migrationsRoot: root,
        ids: [id],
        releaseId: "lesson-g05-l04-number-lines",
      }),
      /required evidence is missing: .*audit\/strict-readiness\.json/,
    );
    await assert.rejects(
      readFile(path.join(workspace, "audit", "scenario-inventory.json"), "utf8"),
      /ENOENT/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("explicit non-legacy members fail closed without an exact release ID", async () => {
  await assert.rejects(
    buildCourseScenarioInventories({
      ids: [G5_L4_WORK_STUDY_IDS[0]],
      inventoryBuilder: async () => {
        throw new Error("must not reach the inventory builder");
      },
    }),
    /require --release-id/,
  );
});

test("scenario output transaction rejects symbolic-link and hard-link targets", async () => {
  for (const linkKind of ["symbolic", "hard"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), `helpmath-scenario-${linkKind}-`));
    const id = COURSE_PILOT_IDS[0];
    const workspace = path.join(root, id);
    const outputPath = path.join(workspace, "audit", "scenario-inventory.json");
    const protectedPath = path.join(root, `${linkKind}-protected.json`);
    const sentinel = `${linkKind} protected bytes\n`;
    try {
      await mkdir(path.dirname(outputPath), {recursive: true});
      await writeFile(protectedPath, sentinel, "utf8");
      if (linkKind === "symbolic") await symlink(protectedPath, outputPath);
      else await link(protectedPath, outputPath);
      await assert.rejects(
        buildCourseScenarioInventories({
          migrationsRoot: root,
          ids: [id],
          inventoryBuilder: async () => ({
            workspace,
            inventory: {animationId: id, generated: true},
          }),
        }),
        /ordinary, non-linked file/,
      );
      assert.equal(await readFile(protectedPath, "utf8"), sentinel);
    } finally {
      await rm(root, {recursive: true, force: true});
    }
  }
});

test("scenario input snapshots reject symlink ancestors and hard links", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "helpmath-scenario-input-links-"),
  );
  const inputDirectory = path.join(root, "inputs");
  const realDirectory = path.join(root, "inputs-real");
  const inputPath = path.join(inputDirectory, "evidence.json");
  try {
    await mkdir(inputDirectory);
    await writeFile(inputPath, "{}\n");
    await rename(inputDirectory, realDirectory);
    await symlink("inputs-real", inputDirectory);
    await assert.rejects(
      readScenarioInputSnapshot(inputPath, {
        containmentRoot: root,
        label: "scenario linked-ancestor input",
      }),
      /ancestor must be a real directory/,
    );
    await unlink(inputDirectory);
    await rename(realDirectory, inputDirectory);

    const hardLink = path.join(root, "hard-linked-evidence.json");
    await link(inputPath, hardLink);
    await assert.rejects(
      readScenarioInputSnapshot(inputPath, {
        containmentRoot: root,
        label: "scenario hard-linked input",
      }),
      /ordinary single-link file/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("scenario input CAS drift rolls back earlier committed outputs", async () => {
  const root = await mkdtemp(
    path.join(os.tmpdir(), "helpmath-scenario-input-cas-"),
  );
  const ids = COURSE_PILOT_IDS.slice(0, 2);
  const inputPath = path.join(root, "stable-input.json");
  const sentinels = new Map(
    ids.map((id) => [id, `${id} original bytes\n`]),
  );
  try {
    await writeFile(inputPath, "{\"stable\":true}\n");
    const snapshot = await readScenarioInputSnapshot(inputPath, {
      containmentRoot: root,
      label: "scenario transaction input",
    });
    for (const id of ids) {
      const outputPath = path.join(
        root,
        id,
        "audit",
        "scenario-inventory.json",
      );
      await mkdir(path.dirname(outputPath), {recursive: true});
      await writeFile(outputPath, sentinels.get(id));
    }
    await assert.rejects(
      buildCourseScenarioInventories({
        migrationsRoot: root,
        ids,
        inventoryBuilder: async (id) => ({
          workspace: path.join(root, id),
          inventory: {animationId: id, generated: true},
          inputSnapshots: [snapshot],
        }),
        transactionHooks: {
          async beforeCommit({index}) {
            if (index === 1) {
              await writeFile(inputPath, "{\"stable\":false}\n");
            }
          },
        },
      }),
      /changed after preflight/,
    );
    for (const id of ids) {
      assert.equal(
        await readFile(
          path.join(root, id, "audit", "scenario-inventory.json"),
          "utf8",
        ),
        sentinels.get(id),
      );
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("scenario output transaction rolls back an earlier commit when a later commit fails", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-scenario-rollback-"));
  const ids = COURSE_PILOT_IDS.slice(0, 2);
  const sentinels = new Map(ids.map((id) => [id, `${id} original bytes\n`]));
  try {
    for (const id of ids) {
      const outputPath = path.join(root, id, "audit", "scenario-inventory.json");
      await mkdir(path.dirname(outputPath), {recursive: true});
      await writeFile(outputPath, sentinels.get(id), "utf8");
    }
    await assert.rejects(
      buildCourseScenarioInventories({
        migrationsRoot: root,
        ids,
        inventoryBuilder: async (id) => ({
          workspace: path.join(root, id),
          inventory: {animationId: id, generated: true},
        }),
        transactionHooks: {
          beforeCommit: ({index}) => {
            if (index === 1) throw new Error("injected second-target commit failure");
          },
        },
      }),
      /injected second-target commit failure/,
    );
    for (const id of ids) {
      assert.equal(
        await readFile(path.join(root, id, "audit", "scenario-inventory.json"), "utf8"),
        sentinels.get(id),
      );
      assert.deepEqual(await readdir(path.join(root, id, "audit")), ["scenario-inventory.json"]);
    }
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
