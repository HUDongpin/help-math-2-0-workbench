import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSafeSourcePreauditOutput,
  buildVb005SourcePreaudit,
  extractSwfmillStaticFacts,
  parseArguments,
  renderVb005SourcePreauditMarkdown,
  validateVb005SourcePreaudit,
} from "./build-g4-l3-vb005-source-preaudit.mjs";

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
          <DefineSprite objectID="53" frames="180"><tags>
            <PlaceObject2 replace="0" depth="2" objectID="7" clipDepth="11"><transform><Transform/></transform></PlaceObject2>
            <ShowFrame/><End/>
          </tags></DefineSprite>
          <PlaceObject2 replace="0" depth="4" objectID="53" morph="5" name="animation"><transform><Transform transX="8026" transY="4885"/></transform></PlaceObject2>
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
    {domainId: "sprite-53", declaredFrameCount: 180},
  ]);
  assert.equal(facts.rootPlacements[2].name, "animation");
  assert.deepEqual(facts.rootPlacements[2].translationPixels, {x: 401.3, y: 244.25});
  assert.deepEqual(facts.displayFeatures.maskPlacements, [{characterId: 7, depth: 2, clipDepth: 11}]);
});

test("checked-in VB005 report is deterministic, source-static-only, and grants no permission", async () => {
  const [built, checkedIn] = await Promise.all([
    buildVb005SourcePreaudit({python: "/opt/anaconda3/bin/python3"}),
    readFile(new URL("../reports/g4-l3-vb005-source-preaudit.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  validateVb005SourcePreaudit(checkedIn);
  assert.deepEqual(checkedIn, built);
  assert.deepEqual({
    batchOrdinal: checkedIn.identity.batchOrdinal,
    implementationSequencePosition: checkedIn.identity.implementationSequencePosition,
    complexityCompetitionRank: checkedIn.identity.complexityCompetitionRank,
  }, {batchOrdinal: 8, implementationSequencePosition: 4, complexityCompetitionRank: 4});
  assert.equal(checkedIn.runtimeStructure.root.frameCount, 10);
  assert.equal(checkedIn.runtimeStructure.staticallyRootReachableFrameDomainCandidates
    .find((domain) => domain.domainId === "sprite-53").declaredFrameCount, 180);
  assert.deepEqual(checkedIn.runtimeStructure.displayFeatures.maskPlacements,
    [{characterId: 7, depth: 2, clipDepth: 11}]);
  assert.equal(checkedIn.actionScript.freshFfdecExport.fileCount, 5);
  assert.equal(checkedIn.actionScript.exactOperationCounts.operations, 9);
  assert.equal(checkedIn.actionScript.staticSignals.pointerReleaseHandlers, 3);
  assert.deepEqual(checkedIn.staticScenarioCandidates.buttons.map((button) => ({
    characterId: button.characterId,
    keyAttribute: button.keyAttribute,
    interval: button.hitStateAndPlacementInterval.frameInterval,
    shapeObjectId: button.hitStateAndPlacementInterval.hitState.shapeObjectId,
    visibleStates: button.hitStateAndPlacementInterval.hitState.visibleStates,
  })), [
    {characterId: 11, keyAttribute: "Negative number", interval: {first: 1, lastInclusive: 180}, shapeObjectId: 10, visibleStates: {down: false, over: false, up: false}},
    {characterId: 12, keyAttribute: "Less than", interval: {first: 1, lastInclusive: 180}, shapeObjectId: 10, visibleStates: {down: false, over: false, up: false}},
    {characterId: 13, keyAttribute: "Zero", interval: {first: 1, lastInclusive: 180}, shapeObjectId: 10, visibleStates: {down: false, over: false, up: false}},
  ]);
  assert.deepEqual(checkedIn.assetsAndText.staticDefinitionCounts, {
    shape: 10, morph: 1, bitmap: 0, font: 4, text: 33, button: 3,
    sprite: 2, sound: 0, video: 0, binary: 0,
  });
  assert.equal(checkedIn.assetsAndText.directParserTagStream.definitionCount, 53);
  assert.equal(checkedIn.assetsAndText.exactTextOccurrenceCount, 36);
  assert.deepEqual({
    owner: checkedIn.audio.embedded.ownerFrameDomain,
    blocks: checkedIn.audio.embedded.blockCount,
    first: checkedIn.audio.embedded.firstBlockLocalFrame,
    last: checkedIn.audio.embedded.lastBlockLocalFrame,
    bytes: checkedIn.audio.embedded.payload.bytes,
    sha256: checkedIn.audio.embedded.payload.sha256,
  }, {
    owner: "sprite-53", blocks: 174, first: 7, last: 180, bytes: 72_020,
    sha256: "fc28d20d948520884b26babb83ac499b0d4e98f5d24bc05e8b63ac9c30bbc2af",
  });
  assert.deepEqual(checkedIn.sourceStaticCanvasPreaudit.freshExport, {
    retainedAfterAudit: false,
    targetSpriteObjectId: 53,
    targetSpriteFunction: "sprite53",
    spriteFrameCount: 180,
    exportCanvas: {width: 697, height: 382},
    exportInternalTranslation: {x: 337.25, y: 141.25},
    stageRenderOffset: {x: 64.05, y: 103},
    helper: {bytes: 52_872, sha256: "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93"},
    framesHtml: {bytes: 1_033_269, sha256: "d39cfdc1571d9d8a3bfb53545e01899e95d14f7e75f5140df84ccd7f7f6c42e5"},
  });
  assert.equal(checkedIn.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlist.length, 44);
  assert.equal(checkedIn.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlistSha256,
    "0232e490b2ad345e81e7b1a6a88eaf7ddc78cee6705abbed9e58f5515682e2aa");
  assert.deepEqual(checkedIn.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.embeddedImageVariableAllowlist, []);
  assert.equal(checkedIn.sourceBindings.preservationRecheck.physicalSourcesUnchanged, true);
  assert.equal(checkedIn.currentJsEngineeringCandidate.sourceStaticCurrentJsEngineeringCandidateEligible, true);
  assert.equal(checkedIn.currentJsEngineeringCandidate.formalMigrationImplementationAuthorized, false);
  assert.equal(checkedIn.currentJsEngineeringCandidate.interactiveRendererAuthorized, false);
  assert.ok(Object.values(checkedIn.permissions).every((value) => value === false));
  assert.ok(Object.values(checkedIn.acceptance).every((value) => value === false));
  const markdown = renderVb005SourcePreauditMarkdown(checkedIn);
  assert.match(markdown, /fail-closed source-static current-JavaScript engineering candidate/);
  assert.match(markdown, /does \*\*not\*\* authorize an interactive renderer/);
  assert.match(markdown, /All acceptance fields remain false/);
  assert.doesNotMatch(markdown, /frames 1 through 175|Pattern\/Symbol\/Set\/Rule|five source-static mask/);
});

test("validator rejects source drift and any formal, interactive, or acceptance promotion", async () => {
  const report = JSON.parse(await readFile(
    new URL("../reports/g4-l3-vb005-source-preaudit.json", import.meta.url),
    "utf8",
  ));

  const sourceDrift = structuredClone(report);
  sourceDrift.sourceBindings.files.swf.sha256 = "0".repeat(64);
  assert.throws(() => validateVb005SourcePreaudit(sourceDrift), /physical bindings changed/);

  const formalPromotion = structuredClone(report);
  formalPromotion.currentJsEngineeringCandidate.formalMigrationImplementationAuthorized = true;
  assert.throws(() => validateVb005SourcePreaudit(formalPromotion), /authorization boundary widened/);

  const interactivePromotion = structuredClone(report);
  interactivePromotion.currentJsEngineeringCandidate.interactiveRendererAuthorized = true;
  assert.throws(() => validateVb005SourcePreaudit(interactivePromotion), /authorization boundary widened/);

  const acceptancePromotion = structuredClone(report);
  acceptancePromotion.acceptance.ownerAccepted = true;
  assert.throws(() => validateVb005SourcePreaudit(acceptancePromotion), /must not promote acceptance/);

  const permissionPromotion = structuredClone(report);
  permissionPromotion.permissions.rendererPersistenceAuthorized = true;
  assert.throws(() => validateVb005SourcePreaudit(permissionPromotion), /must not grant any permission/);

  const canvasAllowlistDrift = structuredClone(report);
  canvasAllowlistDrift.sourceStaticCanvasPreaudit.safeAdapterInMemoryBuild.drawingFunctionAllowlist.pop();
  assert.throws(() => validateVb005SourcePreaudit(canvasAllowlistDrift), /Canvas preaudit facts changed/);
});

test("CLI and report-output boundary fail closed", async () => {
  const parsed = parseArguments(["--check", "--ffdec", "/tool/ffdec", "--swfmill", "/tool/swfmill", "--python", "/tool/python"]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.ffdec, "/tool/ffdec");
  assert.equal(parsed.swfmill, "/tool/swfmill");
  assert.equal(parsed.python, "/tool/python");
  assert.throws(() => parseArguments(["--json-output"]), /requires a value/);
  assert.throws(() => parseArguments(["--unknown"]), /Unknown option/);

  const root = await mkdtemp(path.join(os.tmpdir(), "help-math-vb005-preaudit-output-"));
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
