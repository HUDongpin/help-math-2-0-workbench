#!/usr/bin/env node

import {mkdtemp, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";
import {
  PATTERN_QUIZ_BUILD_SUPPORT as support,
} from "./build-g4-l3-in008-source-local-pattern-quiz-contract.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const ROOT = support.ROOT;

export const ANIMATION_ID = "course-g04-l03-gs-002";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/source-local-game-initial-contract.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/source-local-game-initial-contract.md`;
export const PARSER_PATH =
  "scripts/parse-swfmill-gs002-game-initial-contract.py";

const TARGET_SPRITE_ID = 321;
const ENTRY_FRAME = 427;
const COUP_INDEX = 7;
const COUP_LOCATIONS = Object.freeze([
  -177.35, -154.35, -130.35, -106.35, -82.35, -58.35, -33.35,
  -7.35, 16.65, 42.65, 67.65, 91.65, 117.65, 140.65, 166.65,
]);
const VIRUS_LOCATIONS = Object.freeze([
  -174.1, -151.1, -127.1, -103.1, -79.1, -55.1, -30.1,
  -4.1, 19.9, 45.9, 70.9, 94.9, 120.9, 143.9, 169.9,
]);
const ALLOWED_VIRUS_INDICES = Object.freeze([
  0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14,
]);

async function freshStructure({swfmill, python, parserPath, sourcePath,
  outputRoot}) {
  const xmlPath = path.join(outputRoot, "L3GS02.xml");
  const conversion = await support.run(swfmill.invokedPath,
    ["swf2xml", sourcePath, xmlPath]);
  support.invariant(!/error/i.test(`${conversion.stdout}\n${conversion.stderr}`),
    "swfmill reported a GS002 parse error");
  const parsed = await support.run(python.invokedPath, [
    parserPath, "--swfmill", xmlPath, "--object-id", String(TARGET_SPRITE_ID),
  ]);
  support.invariant(parsed.stderr.trim() === "",
    `GS002 structure parser wrote stderr: ${parsed.stderr}`);
  return JSON.parse(parsed.stdout);
}

function extractNumericArray(script, name) {
  const expression = new RegExp(`_global\\.${name} = \\[(.*?)\\];`);
  const match = script.match(expression);
  support.invariant(match, `GS002 source array changed: ${name}`);
  return [...match[1].matchAll(/"(-?\d+(?:\.\d+)?)"/g)]
    .map((item) => Number(item[1]));
}

export function validateGs002GameScript(script) {
  support.invariant(support.sha256(script) ===
    "6bb66f75b8d7f73919c82ce9ca2a5d79a3b7ae97e6695d6f41be90d2e6bf0262",
  "GS002 frame-427 ActionScript body changed");
  const coupLocations = extractNumericArray(script, "arrayCoupLocY");
  const virusLocations = extractNumericArray(script, "arrayVirusLocY");
  support.invariant(JSON.stringify(coupLocations) ===
      JSON.stringify(COUP_LOCATIONS) &&
    JSON.stringify(virusLocations) === JSON.stringify(VIRUS_LOCATIONS),
  "GS002 source location arrays changed");
  for (const statement of [
    "stop();", "_global.sec = 0;", "_global.min = 4;",
    "_global.quizSection = true;", "_global.score = 0;",
    "this.Mc_Score.txtScore.text = \"0\";",
    "Mc_Popup._visible = false;", "Mc_Popup1._visible = false;",
    "Wrong_Feed._visible = false;", "txtLocVal.restrict = \"0-9\";",
    "_loc1_.tempNum = random(_loc1_.arrayVirusLocY.length);",
    "if(_loc1_.tempNum == _loc1_.tempNumCoup)",
    "Mc_Coup._y = _global.arrayVirusLocY[7];",
    "_global.tempNumCoup = 7;", "doGetVirusRndLocY();",
    "Digi_Timer.gotoAndStop(1);", "Digi_Timer.gotoAndStop(3);",
  ]) support.invariant(script.includes(statement),
    `GS002 source game statement changed: ${statement}`);
  support.invariant((script.match(/\brandom\s*\(/g) ?? []).length === 1,
    "GS002 frame-427 random call count changed");
  return {
    coupLocations, virusLocations,
    normalizedBytes: Buffer.byteLength(script),
    normalizedSha256: support.sha256(script),
  };
}

function byNamedPlacement(structure, name) {
  const matches = structure.targetSprite.entryPlacements.filter((item) =>
    item.name === name);
  support.invariant(matches.length === 1,
    `expected one GS002 frame-427 placement named ${name}`);
  return matches[0];
}

function validateStructure(structure) {
  const sprite = structure?.targetSprite;
  support.invariant(structure?.schemaVersion === 1 &&
    structure.parser === "python-xml.etree.ElementTree" &&
    sprite?.objectId === TARGET_SPRITE_ID && sprite.declaredFrameCount === 428 &&
    sprite.observedShowFrameCount === 428 && sprite.entryFrame === ENTRY_FRAME &&
    JSON.stringify(sprite.actionFrames) === JSON.stringify([427]) &&
    JSON.stringify(sprite.stopFrameCandidates) === JSON.stringify([427]),
  "GS002 terminal game timeline identity changed");
  const counts = Object.groupBy(sprite.entryTagSequence, (tag) => tag);
  support.invariant(counts.RemoveObject2?.length === 20 &&
    counts.DoAction?.length === 1 && counts.PlaceObject2?.length === 36 &&
    counts.SoundStreamBlock?.length === 1 && counts.ShowFrame?.length === 1,
  "GS002 frame-427 tag sequence changed");
  const post = sprite.postStopFrames?.[0];
  const postCounts = Object.groupBy(post?.tagSequence ?? [], (tag) => tag);
  support.invariant(post?.frame === 428 &&
    postCounts.RemoveObject2?.length === 1 &&
    postCounts.PlaceObject2?.length === 5 &&
    postCounts.SoundStreamBlock?.length === 1 &&
    postCounts.ShowFrame?.length === 1 &&
    !postCounts.DoAction,
  "GS002 frame-428 post-stop structure changed");
  for (const [name, objectId, depth, transX, transY] of [
    ["txtSign", 137, 25, 1360, -1247],
    ["txtLocVal", 138, 26, 2720, -1247],
    ["BtnStart", 141, 194, 3146, 884],
    ["BtnPlus", 142, 200, 1543, -2816],
    ["BtnMinus", 143, 209, 2867, -2816],
    ["BtnGo", 144, 218, 5278, -1676],
    ["BtnRepeat", 146, 226, 3415, 1896],
    ["Mc_Virus", 69, 234, -1344, -82],
    ["Mc_Coup", 48, 238, -5964, -147],
    ["Mc_Dummy", 149, 268, -12706, -1468],
    ["Wrong_Feed", 158, 270, -3369, -277],
    ["Mc_Popup1", 164, 383, 7445, -6071],
  ]) {
    const item = byNamedPlacement(structure, name);
    support.invariant(item.objectId === objectId && item.depth === depth &&
      item.transform?.transX === transX && item.transform?.transY === transY,
    `GS002 placement changed: ${name}`);
  }
  support.invariant(JSON.stringify(structure.buttonObjectIds) === JSON.stringify([
    11, 17, 18, 25, 51, 54, 58, 62, 124, 141, 142, 143, 144, 146, 155, 320,
  ]), "GS002 source button inventory changed");
  const text = structure.dynamicText;
  const fonts = structure.dynamicFonts;
  support.invariant(text?.sign?.objectId === 137 && text.sign.fontRef === 101 &&
    text.sign.fontHeightTwips === 600 && text.sign.align === 2 &&
    text.sign.readOnly === true && text.sign.useOutlines === false &&
    text.location?.objectId === 138 && text.location.fontRef === 101 &&
    text.location.fontHeightTwips === 600 && text.location.align === 2 &&
    text.location.readOnly === false && text.location.hasBorder === true &&
    text.location.useOutlines === true && text.location.maxLength === 2 &&
    text.score?.objectId === 83 && text.score.fontRef === 82 &&
    text.timer?.objectId === 77 && text.feedback?.objectId === 157,
  "GS002 dynamic text definitions changed");
  support.invariant(fonts?.timer?.objectId === 76 &&
    fonts.timer.name === "Arial" && fonts.timer.bold === true &&
    fonts.timer.italic === false && fonts.timer.language === 1 &&
    fonts.timer.glyphCount === 0 && fonts.score?.objectId === 82 &&
    fonts.score.name === "Bauhaus Md BT" && fonts.score.bold === true &&
    fonts.score.italic === false && fonts.score.language === 1 &&
    fonts.score.glyphCount === 0,
  "GS002 dynamic device-font definitions changed");
  support.invariant(structure.authorityBoundary?.actionScriptExecuted === false &&
    structure.authorityBoundary.naturalRuntimeEstablished === false &&
    structure.authorityBoundary.interactionEstablished === false &&
    structure.authorityBoundary.visualParityEstablished === false &&
    structure.authorityBoundary.audioEstablished === false &&
    structure.authorityBoundary.acceptanceEffect === "none",
  "GS002 parser authority boundary changed");
  return structure;
}

export function buildGs002InitialGameState(structure) {
  return {
    entryFrame: ENTRY_FRAME,
    postStopLastFrame: 428,
    sourceStopAtEntry: true,
    sequentialPlaybackAfterEntryPermitted: false,
    livePlaybackEndFrame: ENTRY_FRAME,
    frameDomain: "sprite-321",
    coupLocations: COUP_LOCATIONS,
    virusLocations: VIRUS_LOCATIONS,
    coupIndex: COUP_INDEX,
    sourceCoupY: VIRUS_LOCATIONS[COUP_INDEX],
    allowedVirusIndices: ALLOWED_VIRUS_INDICES,
    implementationSeedMapping:
      "seed-modulo-fourteen-selects-allowed-virus-index-for-deterministic-current-javascript-only-not-injected-into-avm1",
    sourceRandomExecuted: false,
    sourceRandomRetryWhenVirusMatchesCoup: true,
    initialScore: 0,
    initialMinutes: 4,
    initialSeconds: 0,
    initialTimerDisplayText: structure.dynamicText.timer.initialText,
    initialScoreDisplayText: "0",
    quizSection: true,
    signText: "",
    locationText: "",
    locationRestrict: "0-9",
    locationMaxLength: structure.dynamicText.location.maxLength,
    virusPlacement: {
      name: "Mc_Virus", objectId: 69, functionName: "sprite69",
      matrixPrefix: [0.05, 0, 0, 0.05, -67.2],
      entryChildFrame: 0, postStopChildFrame: 1,
    },
    coupPlacement: {
      name: "Mc_Coup", objectId: 48, functionName: "sprite48",
      matrix: [0.05, 0, 0, 0.05, -298.2, VIRUS_LOCATIONS[COUP_INDEX]],
      childFrame: 0,
    },
    dynamicTextDrawing: {
      authority:
        "source-field-geometry-and-text-with-device-font-rendering-pending-original-runtime-baseline",
      timer: {
        objectId: 77,
        sourceText: structure.dynamicText.timer.initialText,
        sourceFont: structure.dynamicFonts.timer,
        sourceUsesDeviceFont: true,
        placementMatrix: [0.05, 0, 0, 0.05, 102.3, 160.45],
        nestedTextMatrix: [1.199981689453125, 0, 0,
          0.79998779296875, -780, -143],
        color: "#00ff00",
        align: "center",
        currentJsFontFamily: "Arial, sans-serif",
        currentJsFontSizePixels: 12.7998046875,
        currentJsCenterX: 102.29940490722656,
        currentJsBaselineY: 164.4998291015625,
        currentJsBaselineDisposition:
          "field-top-plus-font-height-approximation-pending-original-runtime",
        visibleFrames: [427],
      },
      score: {
        objectId: 83,
        sourceText: "0",
        sourceFont: structure.dynamicFonts.score,
        sourceUsesDeviceFont: true,
        nestedTextMatrix: [1, 0, 0, 1, -20, -809],
        color: "#ffffff",
        align: "center",
        currentJsFontFamily:
          "Bauhaus Md BT, Arial Rounded MT Bold, sans-serif",
        currentJsFontSizePixels: 17,
        currentJsGlyphFallback:
          "Arial Rounded MT Bold when Bauhaus Md BT is unavailable",
        currentJsBaselineDisposition:
          "field-top-plus-font-height-approximation-pending-original-runtime",
        framePlacements: [
          {frame: 427, placementMatrix: [0.05, 0, 0, 0.05, 241.3, 178.55],
            centerX: 268.9, baselineY: 153.1},
          {frame: 428, placementMatrix: [0.05, 0, 0, 0.05, 238.3, 196.55],
            centerX: 265.9, baselineY: 171.1},
        ],
      },
    },
    initiallyHiddenClips: [
      {
        name: "Wrong_Feed", objectId: 158, functionName: "sprite158",
        sourceStatement: "Wrong_Feed._visible = false;",
        ffdecPlacement: {
          matrix: [0.05, 0, 0, 0.05, -168.45, -13.85],
          sourceFrame: 427, expectedOccurrenceCount: 1,
        },
      },
      {
        name: "Mc_Popup1", objectId: 164, functionName: "sprite164",
        sourceStatement: "Mc_Popup1._visible = false;",
        ffdecPlacement: {
          matrix: [0.05000381469726563, 0, 0, 0.05, 372.25, -303.55],
          firstSourceFrame: 427, lastSourceFrame: 428,
          expectedOccurrenceCount: 2,
        },
      },
    ],
    ffdecTargetInternalTranslation: {x: 815.15, y: 717.2},
    postStopStaticInspectionCarriesInitializedPositions: true,
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 GS002 source-local game initial-state contract\n\n` +
    `- Animation: \`${report.animationId}\`\n` +
    `- Status: \`${report.status}\`\n` +
    `- Main domain: \`${report.initialGameState.frameDomain}\`, frames 1–428\n` +
    `- Game entry: frame 427, with a source \`stop()\`\n` +
    `- Deterministic current-JavaScript positions: ${report.initialGameState.allowedVirusIndices.length}\n\n` +
    `Frame 427 initializes the timer, score, blank sign/location fields, ship position, and a random virus position. The source timer field starts as \`${report.initialGameState.initialTimerDisplayText}\` and the frame script writes score \`${report.initialGameState.initialScoreDisplayText}\`. Both fields use device fonts with zero embedded glyphs, so the deterministic current-JavaScript drawing records its fallback font stack and remains pending an original-runtime text baseline. The deterministic current-JavaScript state maps a seed onto the fourteen legal virus positions while never executing or claiming to reproduce AVM1 random state. Frame 428 has no script and no source navigation path; it remains post-stop structural inspection only.\n\n` +
    `All buttons, input, movement, scoring, feedback, timer behavior, audio, natural random execution, parity, fresh human review, owner acceptance, and strict completion remain pending.\n`;
}

export async function buildGs002SourceLocalGameContract({
  root = ROOT, ffdec = "ffdec", swfmill = "swfmill",
  python = "/opt/anaconda3/bin/python3",
} = {}) {
  const [specBinding, generatorBinding, parserBinding] = await Promise.all([
    support.readBinding(SPEC_PATH, root),
    support.readBinding(support.portable(path.relative(root, scriptPath)), root),
    support.readBinding(PARSER_PATH, root),
  ]);
  const spec = JSON.parse(specBinding.contents);
  const [sourceSwf, sourceFla, sourceAudit, authoringAudit,
    ffdecTool, swfmillTool, pythonTool] = await Promise.all([
    support.readPinned(spec.source.swf, "GS002 source SWF", root),
    support.readPinned(spec.source.fla, "GS002 source FLA", root),
    support.readPinned(spec.evidence.sourceAudit, "GS002 source audit", root),
    support.readPinned(spec.evidence.authoringAudit, "GS002 authoring audit", root),
    support.inspectTool(ffdec, support.EXPECTED_TOOLS.ffdec, "FFDec"),
    support.inspectTool(swfmill, support.EXPECTED_TOOLS.swfmill, "swfmill"),
    support.inspectTool(python, support.EXPECTED_TOOLS.python, "Python"),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-gs002-source-local-"));
  try {
    const [scripts, structure] = await Promise.all([
      support.freshScripts(ffdecTool,
        support.projectPath(spec.source.swf.path, root),
        path.join(temporaryRoot, "scripts")),
      freshStructure({
        swfmill: swfmillTool, python: pythonTool,
        parserPath: support.projectPath(PARSER_PATH, root),
        sourcePath: support.projectPath(spec.source.swf.path, root),
        outputRoot: temporaryRoot,
      }),
    ]);
    support.invariant(spec.animationId === ANIMATION_ID &&
      spec.timeline?.local?.frameDomain === "sprite-321" &&
      spec.timeline.local.frameCount === 428 &&
      spec.ffdec?.targetSpriteObjectId === TARGET_SPRITE_ID,
    "GS002 candidate target timeline changed");
    const sourceFacts = parseSwfSourceFacts(sourceSwf.contents);
    const audit = JSON.parse(sourceAudit.contents);
    support.invariant(audit.artifactType === "g4-l3-workspace-source-audit" &&
      audit.identity?.animationId === ANIMATION_ID &&
      audit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256 &&
      audit.machineFindings?.runtime?.structureFingerprintSha256 ===
        sourceFacts.structureFingerprintSha256 &&
      audit.machineFindings?.scripts?.random?.occurrences === 1 &&
      audit.machineFindings.scripts.random.files.some((file) =>
        file.path === "DefineSprite_321/frame_427/DoAction.as" &&
        file.occurrences === 1) &&
      audit.machineFindings?.scripts?.externalApiCandidates?.length === 0,
    "GS002 source audit identity or behavior inventory changed");
    const domain = sourceFacts.frameDomains?.domains?.find((item) =>
      item.domainId === "sprite-321");
    support.invariant(domain?.declaredFrameCount === 428 &&
      domain.observedShowFrameCount === 428 &&
      domain.staticallyRootReachable === true,
    "GS002 source frame domain changed");
    const main = support.exactScript(scripts,
      "DefineSprite_321/frame_427/DoAction.as");
    const scriptContract = validateGs002GameScript(main);
    support.invariant(!scripts.has("DefineSprite_321/frame_428/DoAction.as"),
      "GS002 frame 428 acquired a source script");
    const selectedButtons = [141, 142, 143, 144, 146, 320].map((objectId) => {
      const file = `DefineButton2_${objectId}/BUTTONCONDACTION on(release).as`;
      const body = support.exactScript(scripts, file);
      return {objectId, file, body};
    });
    const buttonBodies = new Map(selectedButtons.map((item) =>
      [item.objectId, item.body]));
    support.invariant(buttonBodies.get(141).includes('gotoAndPlay("Start_Game")') &&
      buttonBodies.get(142).includes('txtSign.text = "+";') &&
      buttonBodies.get(143).includes('txtSign.text = "-";') &&
      buttonBodies.get(144).includes("Mc_Dummy.gotoAndPlay(2);") &&
      buttonBodies.get(146).includes("Mc_Popup1._visible = true;") &&
      buttonBodies.get(320).includes('gotoAndPlay("Start_Game")'),
    "GS002 source control behavior changed");
    const allScripts = [...scripts.values()].join("\n");
    support.invariant(!/\bnextFrame\s*\(/.test(allScripts) &&
      !/gotoAnd(?:Play|Stop)\s*\(\s*428\s*\)/.test(allScripts),
    "GS002 frame 428 acquired a source navigation path");
    const validatedStructure = validateStructure(structure);
    const authoring = JSON.parse(authoringAudit.contents);
    support.invariant(authoring.evidenceKind === "adobe-animate-authoring-audit" &&
      /without saving/.test(authoring.authority ?? "") &&
      authoring.document?.width === 800 && authoring.document.height === 600 &&
      authoring.document.frameRate === 12,
    "GS002 work-only authoring evidence changed");
    const sourceScripts = [
      {file: "DefineSprite_321/frame_427/DoAction.as", body: main},
      ...selectedButtons,
    ].map(({file, body}) => ({file,
      normalizedBytes: Buffer.byteLength(body),
      normalizedSha256: support.sha256(body)}));
    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-gs002-source-local-game-initial-contract",
      animationId: ANIMATION_ID,
      status:
        "verified-source-local-game-initial-state-and-post-stop-static-frame",
      authorityStatement:
        "Fresh hash-bound SWF structure and exact FFDec-exported AVM1 prove the frame-427 game initial-state inputs for a deterministic current-JavaScript drawing. They authorize only the initial drawing and frame-428 post-stop structural inspection; they do not establish original random execution, interaction, audio, parity, review, or acceptance.",
      generator: support.withoutContents(generatorBinding),
      parser: support.withoutContents(parserBinding),
      source: {
        swf: support.withoutContents(sourceSwf),
        fla: support.withoutContents(sourceFla),
        sourceAudit: support.withoutContents(sourceAudit),
        authoringAudit: support.withoutContents(authoringAudit),
        structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
      },
      toolchain: {ffdec: ffdecTool, swfmill: swfmillTool, python: pythonTool},
      exactSourceScripts: sourceScripts,
      sourceContract: {
        sourceRandomCallCount: 1,
        randomRetryExcludesCoupIndex: true,
        timerInitializedToFourMinutes: true,
        scoreInitializedToZero: true,
        inputRestrictedToDigits: true,
        sourceButtonCount: validatedStructure.buttonObjectIds.length,
        sourceButtonsWithExportedActions: 15,
        startAndReplayUseStartGameLabel: true,
        plusMinusSetSignText: true,
        goValidatesAndStartsDummyMovement: true,
        repeatShowsPopup: true,
        sourceFrame428NavigationEstablished: false,
      },
      structuralEvidence: {
        domain: {
          domainId: domain.domainId,
          declaredFrameCount: domain.declaredFrameCount,
          observedShowFrameCount: domain.observedShowFrameCount,
          staticallyRootReachable: domain.staticallyRootReachable,
          parentDomainIds: domain.parentDomainIds,
          tagCounts: domain.tagCounts,
          scriptTagCount: domain.scriptTagCount,
          domainFingerprintSha256: domain.domainFingerprintSha256,
        },
        entryTagSequence: validatedStructure.targetSprite.entryTagSequence,
        postStopFrames: validatedStructure.targetSprite.postStopFrames,
        dynamicText: validatedStructure.dynamicText,
        dynamicFonts: validatedStructure.dynamicFonts,
        buttonObjectIds: validatedStructure.buttonObjectIds,
      },
      exactScriptArrays: {
        coupLocations: scriptContract.coupLocations,
        virusLocations: scriptContract.virusLocations,
      },
      initialGameState: buildGs002InitialGameState(validatedStructure),
      unresolved: [
        "No authorized original runtime has captured the naturally selected GS002 virus position or initialized frame-427 display list.",
        "The deterministic implementation seed selects one legal source position by modulo fourteen; it is not injected into or claimed to reproduce AVM1 random state.",
        "Frame 428 has no source script or established navigation path, is excluded from natural live playback, and is available only as post-stop structural inspection carrying the initialized positions.",
        "The timer and score use source-declared device fonts with zero embedded glyphs. Current JavaScript draws the source text in the source field geometry with recorded fallback stacks; exact glyph metrics and baselines remain pending an authorized original-runtime baseline.",
        "All source buttons, text input, movement, scoring, timer progression, feedback, popups, and replay behavior remain disabled and unvalidated.",
        "Embedded and associated audio, bilingual behavior, root/host reachability, companion timelines, authoritative baseline, RMSE, product/accessibility QA, fresh human review, owner acceptance, strict completion, and lesson release remain pending.",
      ],
      acceptance: {
        acceptanceNeutral: true, implementationAccepted: false,
        authoritativeOriginalRuntimeAccepted: false,
        naturalRuntimeTraceAccepted: false, audioAccepted: false,
        behaviorAccepted: false, bilingualVisualParityAccepted: false,
        rmseAccepted: false, humanVisualReviewAccepted: false,
        ownerAccepted: false, strictMigrationComplete: false,
      },
      strictAcceptanceEffect: "none",
    };
    return {report, json: support.stableJson(report),
      markdown: renderMarkdown(report)};
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", swfmill: "swfmill",
    python: "/opt/anaconda3/bin/python3"};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--ffdec", "--swfmill", "--python"].includes(argument)) {
      const value = argv[++index];
      support.invariant(value && !value.startsWith("--"),
        `${argument} requires a value`);
      options[argument.slice(2)] = value;
    } else if (argument === "-h" || argument === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(
      "node scripts/build-g4-l3-gs002-source-local-game-contract.mjs " +
      "[--check] [--ffdec <command>] [--swfmill <command>] [--python <command>]\n");
    return;
  }
  const built = await buildGs002SourceLocalGameContract(options);
  await Promise.all([
    support.emit(OUTPUT_JSON, built.json, options.check),
    support.emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "frame 427 source-local initial state; frame 428 post-stop static only; " +
    "strict acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
