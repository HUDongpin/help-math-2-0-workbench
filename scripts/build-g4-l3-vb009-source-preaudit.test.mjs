import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeSourcePreauditOutput,
  buildVb009SourcePreaudit,
  extractSwfmillStaticFacts,
  parseArguments,
  renderVb009SourcePreauditMarkdown,
  validateVb009SourcePreaudit,
} from "./build-g4-l3-vb009-source-preaudit.mjs";

test("swfmill projection keeps root metadata, child timelines, transforms, and masks separate", () => {
  const facts = extractSwfmillStaticFacts(`
    <swf version="6" compressed="1">
      <Header framerate="12" frames="10">
        <size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size>
        <tags>
          <SetBackgroundColor><color><Color red="184" green="216" blue="247"/></color></SetBackgroundColor>
          <FrameLabel label="begin"><flags/></FrameLabel>
          <PlaceObject2 replace="0" depth="1" objectID="2"><transform><Transform transX="4100" transY="-2405"/></transform></PlaceObject2>
          <DefineSprite objectID="5" frames="1"><tags><ShowFrame/><End/></tags></DefineSprite>
          <PlaceObject2 replace="0" depth="2" objectID="5" morph="5" name="Mc_Page_Title"><transform><Transform transX="8002" transY="868"/></transform></PlaceObject2>
          <DefineSprite objectID="24" frames="175"><tags>
            <PlaceObject2 replace="0" depth="2" objectID="7" clipDepth="11"><transform><Transform/></transform></PlaceObject2>
            <ShowFrame/><End/>
          </tags></DefineSprite>
          <PlaceObject2 replace="0" depth="4" objectID="24" morph="5" name="animation"><transform><Transform transX="8026" transY="4885"/></transform></PlaceObject2>
          <ShowFrame/><End/>
        </tags>
      </Header>
    </swf>
  `);
  assert.deepEqual(facts.stage, {
    xMinTwips: 0,
    xMaxTwips: 16_000,
    yMinTwips: 0,
    yMaxTwips: 12_000,
    width: 800,
    height: 600,
    backgroundRgb: {red: 184, green: 216, blue: 247},
    backgroundHex: "#b8d8f7",
  });
  assert.equal(facts.rootFrameCount, 10);
  assert.equal(facts.fps, 12);
  assert.deepEqual(facts.nestedDefinitions, [
    {domainId: "sprite-5", declaredFrameCount: 1},
    {domainId: "sprite-24", declaredFrameCount: 175},
  ]);
  assert.equal(facts.rootPlacements[2].name, "animation");
  assert.deepEqual(facts.rootPlacements[2].translationPixels, {x: 401.3, y: 244.25});
  assert.deepEqual(facts.displayFeatures.maskPlacements, [{characterId: 7, depth: 2, clipDepth: 11}]);
});

test("checked-in VB009 report is a deterministic source-static-only authorization", async () => {
  const [built, checkedIn] = await Promise.all([
    buildVb009SourcePreaudit(),
    readFile(new URL("../reports/g4-l3-vb009-source-preaudit.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  validateVb009SourcePreaudit(checkedIn);
  assert.deepEqual(checkedIn, built);
  assert.equal(checkedIn.identity.implementationSequencePosition, 3);
  assert.equal(checkedIn.runtimeStructure.root.frameCount, 10);
  assert.equal(checkedIn.runtimeStructure.staticallyRootReachableFrameDomainCandidates
    .find((domain) => domain.domainId === "sprite-24").declaredFrameCount, 175);
  assert.equal(checkedIn.actionScript.freshFfdecExport.fileCount, 6);
  assert.equal(checkedIn.staticScenarioCandidates.buttons.length, 4);
  assert.equal(checkedIn.currentJsEngineeringCandidate.sourceStaticCurrentJsEngineeringCandidateEligible, true);
  assert.equal(checkedIn.currentJsEngineeringCandidate.formalMigrationImplementationAuthorized, false);
  assert.equal(checkedIn.currentJsEngineeringCandidate.interactiveRendererAuthorized, false);
  assert.ok(Object.values(checkedIn.acceptance).every((value) => value === false));
  const markdown = renderVb009SourcePreauditMarkdown(checkedIn);
  assert.match(markdown, /fail-closed source-static current-JavaScript engineering candidate/);
  assert.match(markdown, /does \*\*not\*\* authorize an interactive renderer/);
  assert.match(markdown, /All acceptance fields remain false/);
});

test("validator rejects source drift and any formal, interactive, or acceptance promotion", async () => {
  const report = JSON.parse(await readFile(
    new URL("../reports/g4-l3-vb009-source-preaudit.json", import.meta.url),
    "utf8",
  ));

  const sourceDrift = structuredClone(report);
  sourceDrift.sourceBindings.files.swf.sha256 = "0".repeat(64);
  assert.throws(() => validateVb009SourcePreaudit(sourceDrift), /physical bindings changed/);

  const formalPromotion = structuredClone(report);
  formalPromotion.currentJsEngineeringCandidate.formalMigrationImplementationAuthorized = true;
  assert.throws(() => validateVb009SourcePreaudit(formalPromotion), /authorization boundary widened/);

  const interactivePromotion = structuredClone(report);
  interactivePromotion.currentJsEngineeringCandidate.interactiveRendererAuthorized = true;
  assert.throws(() => validateVb009SourcePreaudit(interactivePromotion), /authorization boundary widened/);

  const acceptancePromotion = structuredClone(report);
  acceptancePromotion.acceptance.ownerAccepted = true;
  assert.throws(() => validateVb009SourcePreaudit(acceptancePromotion), /must not promote acceptance/);
});

test("CLI and report-output boundary fail closed", async () => {
  const parsed = parseArguments(["--check", "--ffdec", "/tool/ffdec", "--swfmill", "/tool/swfmill"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.ffdec, "/tool/ffdec");
  assert.equal(parsed.swfmill, "/tool/swfmill");
  assert.throws(() => parseArguments(["--json-output"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);

  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-vb009-preaudit-output-"));
  try {
    await mkdir(path.join(root, "reports"), {recursive: true});
    const safe = path.join(root, "reports", "preaudit.json");
    assert.equal(await assertSafeSourcePreauditOutput(safe, {root, extension: ".json"}), safe);
    await writeFile(safe, "{}\n");
    assert.equal(await assertSafeSourcePreauditOutput(safe, {root, extension: ".json"}), safe);
    await assert.rejects(
      assertSafeSourcePreauditOutput(path.join(root, "source-assets", "preaudit.json"), {root, extension: ".json"}),
      /inside/,
    );
    await assert.rejects(
      assertSafeSourcePreauditOutput(path.join(root, "reports", "preaudit.md"), {root, extension: ".json"}),
      /end in/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
