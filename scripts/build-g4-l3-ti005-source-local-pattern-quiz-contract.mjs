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

export const ANIMATION_ID = "course-g04-l03-ti-005";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/source-local-pattern-quiz-contract.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/source-local-pattern-quiz-contract.md`;
export const PARSER_PATH =
  "scripts/parse-swfmill-ti005-pattern-quiz-contract.py";

const TARGET_SPRITE_ID = 208;
const FONT_OBJECT_ID = 143;
const ENTRY_FRAME = 209;
const DIGIT_MINUS_SUPPLEMENT = Object.freeze({
  path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/flip.swf",
  bytes: 20_941,
  sha256: "208d808cb076aa27d741388db91edde9f98cbd1bea8378690c498757334fcab5",
  fontObjectId: 4,
  ttfSha256: "4b8c5b6896d18f56dfe908cec9b602e915e7ffb0dd4e83dce9d99c9d17bc3f11",
});
const COMMA_SUPPLEMENT = Object.freeze({
  path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/FQ/L1FQ01.swf",
  bytes: 27_971,
  sha256: "52eee6a5301375e63de8b38d7c13a6aa73013f40ff493f1da7f9ad5e63599b13",
  fontObjectId: 23,
  ttfSha256: "5df6029d20f2fdefbb848f477aba21e3df37cb3a340cceb9b3c521efff9439e9",
});
const PRIMARY_TTF_SHA256 =
  "375aa51f945f0742a5e7aedc83316cb2e29860471cfdefd0ca58e48a24c5b22e";

const QUESTIONS = Object.freeze([
  Object.freeze({
    label: "-3, -5, -7, -9,", answers: "-11~-13",
    feedback: "Each number decreases by 2.  Try again!", decrement: 2,
  }),
  Object.freeze({
    label: "16, 8, 0, -8,", answers: "-16~-24",
    feedback: "Each number decreases by 8.  Try again!", decrement: 8,
  }),
  Object.freeze({
    label: "20, 10, 0, -10,", answers: "-20~-30",
    feedback: "Each number decreases by 10.  Try again!", decrement: 10,
  }),
  Object.freeze({
    label: "-10, -15, -20, -25,", answers: "-30~-35",
    feedback: "Each number decreases by 5.  Try again!", decrement: 5,
  }),
  Object.freeze({
    label: "9, 6, 3, 0,", answers: "-3~-6",
    feedback: "Each number decreases by 3.  Try again!", decrement: 3,
  }),
]);

async function freshStructure({ffdec, swfmill, python, parserPath, sourcePath,
  digitPath, commaPath, outputRoot}) {
  const xmlPath = path.join(outputRoot, "L3TI05.xml");
  const [conversion, primaryTtf, digitTtf, commaTtf] = await Promise.all([
    support.run(swfmill.invokedPath, ["swf2xml", sourcePath, xmlPath]),
    support.exportOneFont(ffdec, sourcePath, FONT_OBJECT_ID,
      path.join(outputRoot, "font-primary")),
    support.exportOneFont(ffdec, digitPath, DIGIT_MINUS_SUPPLEMENT.fontObjectId,
      path.join(outputRoot, "font-digit-minus")),
    support.exportOneFont(ffdec, commaPath, COMMA_SUPPLEMENT.fontObjectId,
      path.join(outputRoot, "font-comma")),
  ]);
  support.invariant(!/error/i.test(`${conversion.stdout}\n${conversion.stderr}`),
    "swfmill reported a TI005 parse error");
  const parsed = await support.run(python.invokedPath, [
    parserPath, "--swfmill", xmlPath, "--primary-ttf", primaryTtf,
    "--digit-ttf", digitTtf, "--comma-ttf", commaTtf,
    "--object-id", String(TARGET_SPRITE_ID),
    "--font-object-id", String(FONT_OBJECT_ID),
  ]);
  support.invariant(parsed.stderr.trim() === "",
    `TI005 structure parser wrote stderr: ${parsed.stderr}`);
  return JSON.parse(parsed.stdout);
}

export function validateTi005QuizScript(script) {
  support.invariant(support.sha256(script) ===
    "24d6dd5c20cd8f8427136d51e6dc42f94185c7558dbabdadb43ebd4cffd15404",
  "TI005 frame-209 ActionScript body changed");
  const labels = support.extractArray(script, "qLableArray");
  const answers = support.extractArray(script, "qAnsArray");
  const feedback = support.extractArray(script, "qFeedBackArray");
  support.invariant(
    JSON.stringify(labels) === JSON.stringify(QUESTIONS.map((item) => item.label)) &&
    JSON.stringify(answers) === JSON.stringify(QUESTIONS.map((item) => item.answers)) &&
    JSON.stringify(feedback) === JSON.stringify(QUESTIONS.map((item) => item.feedback)),
  "TI005 source quiz arrays changed");
  for (const statement of [
    "stop();\n_global.quizSection = true;",
    "tempQNo = random(_loc1_.qLableArray.length);",
    "txtQuestion.text = _loc1_.question;",
    "_loc1_.qLableArray.splice(tempQNo,1);",
    "_loc1_.qAnsArray.splice(tempQNo,1);",
    "_loc1_.qFeedBackArray.splice(tempQNo,1);",
    "txtAns_1.text = \"\";", "txtAns_2.text = \"\";",
    "Mc_Wrong_Feed._visible = false;", "doGetRandomQuiz();",
  ]) support.invariant(script.includes(statement),
    `TI005 source quiz statement changed: ${statement}`);
  support.invariant((script.match(/\brandom\s*\(/g) ?? []).length === 1,
    "TI005 main quiz random call count changed");
  return {labels, answers, feedback, normalizedBytes: Buffer.byteLength(script),
    normalizedSha256: support.sha256(script)};
}

function validateStructure(structure) {
  const sprite = structure?.targetSprite;
  support.invariant(structure?.schemaVersion === 1 &&
    structure.parser === "python-xml.etree.ElementTree+fontTools.ttLib" &&
    sprite?.objectId === TARGET_SPRITE_ID && sprite.declaredFrameCount === 210 &&
    sprite.observedShowFrameCount === 210 && sprite.entryFrame === ENTRY_FRAME &&
    JSON.stringify(sprite.actionFrames) === JSON.stringify([1, 209]) &&
    JSON.stringify(sprite.stopFrameCandidates) === JSON.stringify([209]),
  "TI005 terminal quiz timeline identity changed");
  const counts = Object.groupBy(sprite.entryTagSequence, (tag) => tag);
  support.invariant(counts.RemoveObject2?.length === 15 &&
    counts.FrameLabel?.length === 1 && counts.DoAction?.length === 1 &&
    counts.PlaceObject2?.length === 10 && counts.SoundStreamBlock?.length === 1 &&
    counts.ShowFrame?.length === 1,
  "TI005 frame-209 tag sequence changed");
  support.invariant(JSON.stringify(sprite.postStopFrames) === JSON.stringify([{
    frame: 210, tagSequence: ["SoundStreamBlock", "ShowFrame"],
  }]), "TI005 frame-210 post-stop structure changed");
  const placements = new Map(sprite.entryPlacements.filter((item) => item.name)
    .map((item) => [`${item.depth}:${item.name}`, item]));
  for (const [key, objectId, x, y] of [
    ["11:txtQuestion", 184, -2806, 89],
    ["13:ButtonAns", 185, -8548, 1899],
    ["17:ButtonNew", 190, 1993, 1969],
    ["22:txtAns_1", 191, -106, 89],
    ["23:txtAns_2", 192, 914, 89],
    ["24:Mc_Wrong_Feed", 203, -263, -1331],
    ["35:Coach_audio_1", 205, -12539, -850],
    ["37:Coach_audio_2", 207, -12539, -42],
  ]) {
    const item = placements.get(key);
    support.invariant(item?.objectId === objectId && item.transform?.transX === x &&
      item.transform?.transY === y, `TI005 placement changed: ${key}`);
  }
  const text = structure.dynamicText;
  support.invariant(text?.question?.fontRef === 143 &&
    text.question.fontHeightTwips === 500 && text.question.align === 1 &&
    text.question.readOnly === true && text.question.notSelectable === true &&
    text.question.useOutlines === false && text.answerOne?.fontRef === 143 &&
    text.answerOne.align === 1 && text.answerOne.hasBorder === true &&
    text.answerTwo?.fontRef === 143 && text.answerTwo.align === 1 &&
    text.answerTwo.hasBorder === true && text.feedback?.fontRef === 3,
  "TI005 dynamic text definitions changed");
  const font = structure.font;
  support.invariant(font?.objectId === 143 && font.name === "Bauhaus Md BT" &&
    font.bold === true && font.swfGlyphCount === 26 && font.unitsPerEm === 1024 &&
    font.ascent === 735 && font.descent === -214 && font.primary?.bytes === 6856 &&
    font.primary.sha256 === PRIMARY_TTF_SHA256 &&
    font.digitMinusSupplement?.bytes === 7616 &&
    font.digitMinusSupplement.sha256 === DIGIT_MINUS_SUPPLEMENT.ttfSha256 &&
    font.commaSupplement?.bytes === 7012 &&
    font.commaSupplement.sha256 === COMMA_SUPPLEMENT.ttfSha256 &&
    font.comparisons?.primaryToDigit?.sharedGlyphCount === 15 &&
    font.comparisons.primaryToDigit.sharedGlyphManifestSha256 ===
      "23b05cd7870dbd49327c936d2cf2f16e84531b7f1c3195989c42c6f72b9b833b" &&
    font.comparisons.primaryToComma?.sharedGlyphCount === 13 &&
    font.comparisons.primaryToComma.sharedGlyphManifestSha256 ===
      "291554e92d5e1e479e42f6270ab8fec8d3218b6e9a98a0c33720830117f6d802" &&
    font.comparisons.digitToComma?.sharedGlyphCount === 18 &&
    font.comparisons.digitToComma.sharedGlyphManifestSha256 ===
      "855c5814df5705dc94b1310f4206a2539199faa84b22c37d5479e9865631e2af" &&
    Object.values(font.comparisons).every((item) =>
      item.sharedGlyphsEquivalent === true) &&
    JSON.stringify(Object.keys(font.glyphs).sort()) ===
      JSON.stringify([" ", ",", "-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].sort()),
  "TI005 Bauhaus source-glyph recovery changed");
  support.invariant(structure.authorityBoundary?.actionScriptExecuted === false &&
    structure.authorityBoundary.naturalRuntimeEstablished === false &&
    structure.authorityBoundary.deviceFontRuntimeEstablished === false &&
    structure.authorityBoundary.visualParityEstablished === false &&
    structure.authorityBoundary.audioEstablished === false &&
    structure.authorityBoundary.acceptanceEffect === "none",
  "TI005 parser authority boundary changed");
  return structure;
}

function round(value) {
  return Math.round(value * 100_000) / 100_000;
}

function twips(value) {
  return value / 20;
}

function placement(structure, name) {
  const matches = structure.targetSprite.entryPlacements.filter((item) =>
    item.name === name);
  support.invariant(matches.length === 1,
    `expected one TI005 placement named ${name}`);
  return matches[0];
}

export function buildTi005OverlayContract({structure, rootPlacementPixels}) {
  const questionPlace = placement(structure, "txtQuestion");
  const answerOnePlace = placement(structure, "txtAns_1");
  const answerTwoPlace = placement(structure, "txtAns_2");
  const feedbackPlace = placement(structure, "Mc_Wrong_Feed");
  const buildBox = (place, definition) => {
    const origin = {
      x: round(rootPlacementPixels.x + twips(place.transform.transX)),
      y: round(rootPlacementPixels.y + twips(place.transform.transY)),
    };
    return {
      placement: origin,
      box: {
        left: round(origin.x + twips(definition.boundsTwips.left)),
        right: round(origin.x + twips(definition.boundsTwips.right)),
        top: round(origin.y + twips(definition.boundsTwips.top)),
        bottom: round(origin.y + twips(definition.boundsTwips.bottom)),
      },
    };
  };
  const question = buildBox(questionPlace, structure.dynamicText.question);
  const answerOne = buildBox(answerOnePlace, structure.dynamicText.answerOne);
  const answerTwo = buildBox(answerTwoPlace, structure.dynamicText.answerTwo);
  const fontSize = twips(structure.dynamicText.question.fontHeightTwips);
  return {
    entryFrame: ENTRY_FRAME,
    postStopLastFrame: 210,
    sourceStopAtEntry: true,
    sequentialPlaybackAfterEntryPermitted: false,
    livePlaybackEndFrame: ENTRY_FRAME,
    frameDomain: "sprite-208",
    sourceQuestions: QUESTIONS,
    implementationSeedMapping:
      "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1",
    sourceRandomExecuted: false,
    removesSelectedQuestion: true,
    initialRemainingQuestionCount: 4,
    font: {
      name: structure.font.name,
      bold: structure.font.bold,
      unitsPerEm: structure.font.unitsPerEm,
      ascent: structure.font.ascent,
      descent: structure.font.descent,
      primaryTtfSha256: structure.font.primary.sha256,
      digitMinusSupplementTtfSha256:
        structure.font.digitMinusSupplement.sha256,
      commaSupplementTtfSha256: structure.font.commaSupplement.sha256,
      allSharedGlyphsEquivalent: Object.values(structure.font.comparisons)
        .every((item) => item.sharedGlyphsEquivalent === true),
      deviceFontRuntimeEstablished: false,
      glyphs: structure.font.glyphs,
    },
    questionText: {
      ...question,
      align: "right",
      rightGutterPixels: 2,
      fontSize,
      color: "#000000",
      baselineY: round(question.placement.y +
        fontSize * structure.font.ascent / structure.font.unitsPerEm),
    },
    answerOne: {...answerOne, align: "right", initialText: ""},
    answerTwo: {...answerTwo, align: "right", initialText: ""},
    initiallyHiddenClip: {
      name: "Mc_Wrong_Feed",
      objectId: feedbackPlace.objectId,
      functionName: "sprite203",
      depth: feedbackPlace.depth,
      placement: {
        x: round(rootPlacementPixels.x + twips(feedbackPlace.transform.transX)),
        y: round(rootPlacementPixels.y + twips(feedbackPlace.transform.transY)),
      },
      ffdecLocalPlacement: {
        matrix: [0.05, 0, 0, 0.05, -13.15, -66.55],
        frame: 208,
        expectedOccurrenceCount: 2,
      },
      sourceStatement: "Mc_Wrong_Feed._visible = false;",
    },
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 TI005 source-local pattern quiz contract\n\n` +
    `- Animation: \`${report.animationId}\`\n` +
    `- Status: \`${report.status}\`\n` +
    `- Main domain: \`${report.initialQuizState.frameDomain}\`, frames 1–210\n` +
    `- Quiz entry: frame 209, with a source \`stop()\`\n` +
    `- Source questions: ${report.initialQuizState.sourceQuestions.length}\n\n` +
    `Frame 209 initializes five pattern questions locally, chooses one with \`random(qLableArray.length)\`, removes the selected tuple, populates the question text, and stops. Frame 210 has only a silent audio-stream block plus \`ShowFrame\`; it is post-stop static inspection only.\n\n` +
    `The dynamic field requests a device-rendered bold Bauhaus font, but TI005 embeds only a partial subset. The current-JavaScript drawing fills missing digits/minus and comma from two owner-provided subsets only after proving every shared outline and advance equivalent. This does not establish the original device-font runtime. Inputs, checking, New Problem, reset, feedback, audio, natural random execution, parity, human review, owner acceptance, and strict completion remain pending.\n`;
}

export async function buildTi005SourceLocalPatternQuizContract({
  root = ROOT, ffdec = "ffdec", swfmill = "swfmill",
  python = "/opt/anaconda3/bin/python3",
} = {}) {
  const [specBinding, generatorBinding, parserBinding] = await Promise.all([
    support.readBinding(SPEC_PATH, root),
    support.readBinding(support.portable(path.relative(root, scriptPath)), root),
    support.readBinding(PARSER_PATH, root),
  ]);
  const spec = JSON.parse(specBinding.contents);
  const [sourceSwf, sourceFla, digitSwf, commaSwf, sourceAudit, authoringAudit,
    ffdecTool, swfmillTool, pythonTool] = await Promise.all([
    support.readPinned(spec.source.swf, "TI005 source SWF", root),
    support.readPinned(spec.source.fla, "TI005 source FLA", root),
    support.readPinned(DIGIT_MINUS_SUPPLEMENT,
      "matching Bauhaus digit/minus supplement SWF", root),
    support.readPinned(COMMA_SUPPLEMENT,
      "matching Bauhaus comma supplement SWF", root),
    support.readPinned(spec.evidence.sourceAudit, "TI005 source audit", root),
    support.readPinned(spec.evidence.authoringAudit, "TI005 authoring audit", root),
    support.inspectTool(ffdec, support.EXPECTED_TOOLS.ffdec, "FFDec"),
    support.inspectTool(swfmill, support.EXPECTED_TOOLS.swfmill, "swfmill"),
    support.inspectTool(python, support.EXPECTED_TOOLS.python, "Python"),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-ti005-source-local-"));
  try {
    const [scripts, structure] = await Promise.all([
      support.freshScripts(ffdecTool, support.projectPath(spec.source.swf.path, root),
        path.join(temporaryRoot, "scripts")),
      freshStructure({
        ffdec: ffdecTool, swfmill: swfmillTool, python: pythonTool,
        parserPath: support.projectPath(PARSER_PATH, root),
        sourcePath: support.projectPath(spec.source.swf.path, root),
        digitPath: support.projectPath(DIGIT_MINUS_SUPPLEMENT.path, root),
        commaPath: support.projectPath(COMMA_SUPPLEMENT.path, root),
        outputRoot: temporaryRoot,
      }),
    ]);
    support.invariant(spec.animationId === ANIMATION_ID &&
      spec.timeline?.local?.frameDomain === "sprite-208" &&
      spec.timeline.local.frameCount === 210 &&
      spec.ffdec?.targetSpriteObjectId === TARGET_SPRITE_ID,
    "TI005 candidate target timeline changed");
    const sourceFacts = parseSwfSourceFacts(sourceSwf.contents);
    const audit = JSON.parse(sourceAudit.contents);
    support.invariant(audit.artifactType === "g4-l3-workspace-source-audit" &&
      audit.identity?.animationId === ANIMATION_ID &&
      audit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256 &&
      audit.machineFindings?.runtime?.structureFingerprintSha256 ===
        sourceFacts.structureFingerprintSha256 &&
      audit.machineFindings?.scripts?.random?.occurrences === 2 &&
      audit.machineFindings.scripts.random.files.some((file) =>
        file.path === "DefineSprite_208/frame_209/DoAction.as" &&
        file.occurrences === 1) &&
      audit.machineFindings?.scripts?.externalApiCandidates?.length === 0,
    "TI005 source audit identity or behavior inventory changed");
    const domain = sourceFacts.frameDomains?.domains?.find((item) =>
      item.domainId === "sprite-208");
    support.invariant(domain?.declaredFrameCount === 210 &&
      domain.observedShowFrameCount === 210 && domain.staticallyRootReachable === true,
    "TI005 source frame domain changed");
    const main = support.exactScript(scripts,
      "DefineSprite_208/frame_209/DoAction.as");
    const scriptContract = validateTi005QuizScript(main);
    support.invariant(!scripts.has("DefineSprite_208/frame_210/DoAction.as"),
      "TI005 frame 210 acquired a source script");
    const checkButton = support.exactScript(scripts,
      "DefineButton2_185/BUTTONCONDACTION on(release).as");
    const newButton = support.exactScript(scripts,
      "DefineButton2_190/BUTTONCONDACTION on(release).as");
    const resetButton = support.exactScript(scripts,
      "DefineButton2_200/BUTTONCONDACTION on(release).as");
    const hyperlinkButton = support.exactScript(scripts,
      "DefineButton2_147/BUTTONCONDACTION on(release).as");
    const randomAudio = support.exactScript(scripts,
      "DefineSprite_205/frame_2/DoAction.as");
    support.invariant(checkButton.includes("txtAns_1.text == _global.AnswerFirst") &&
      checkButton.includes("txtAns_2.text == _global.AnswerSecond") &&
      checkButton.includes("Coach_audio_2.gotoAndPlay(2);") &&
      checkButton.includes("Coach_audio_1.gotoAndPlay(2);") &&
      checkButton.includes("Mc_Wrong_Feed._visible = true;") &&
      newButton.includes("doGetRandomQuiz();") &&
      resetButton.includes("_parent.ButtonAns.enabled = true;") &&
      resetButton.includes("_parent.ButtonNew.enabled = true;") &&
      hyperlinkButton.includes("_global.KeyAttribute = \"Decimal\";") &&
      hyperlinkButton.includes("_root.DoHyperLinks();") &&
      randomAudio.includes("tempInt = random(_global.rndAudio.length);") &&
      randomAudio.includes("gotoAndPlay(tempLabel);"),
    "TI005 button or random-audio behavior contract changed");
    const allScripts = [...scripts.values()].join("\n");
    support.invariant(!/\bnextFrame\s*\(/.test(allScripts) &&
      !/gotoAnd(?:Play|Stop)\s*\(\s*210\s*\)/.test(allScripts),
    "TI005 frame 210 acquired a source navigation path");
    const validatedStructure = validateStructure(structure);
    const authoring = JSON.parse(authoringAudit.contents);
    support.invariant(authoring.evidenceKind === "adobe-animate-authoring-audit" &&
      /without saving/.test(authoring.authority ?? "") &&
      authoring.document?.width === 800 && authoring.document.height === 600 &&
      authoring.document.frameRate === 12,
    "TI005 work-only authoring evidence changed");
    const overlay = buildTi005OverlayContract({
      structure: validatedStructure,
      rootPlacementPixels: spec.timeline.root.placementPixels,
    });
    const sourceScripts = [
      ["DefineSprite_208/frame_209/DoAction.as", main],
      ["DefineSprite_205/frame_2/DoAction.as", randomAudio],
      ["DefineButton2_185/BUTTONCONDACTION on(release).as", checkButton],
      ["DefineButton2_190/BUTTONCONDACTION on(release).as", newButton],
      ["DefineButton2_200/BUTTONCONDACTION on(release).as", resetButton],
      ["DefineButton2_147/BUTTONCONDACTION on(release).as", hyperlinkButton],
    ].map(([file, body]) => ({file, normalizedBytes: Buffer.byteLength(body),
      normalizedSha256: support.sha256(body)}));
    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-ti005-source-local-pattern-quiz-contract",
      animationId: ANIMATION_ID,
      status:
        "verified-source-local-pattern-quiz-initial-state-and-post-stop-static-frame",
      authorityStatement:
        "Fresh hash-bound SWF structure, exact FFDec-exported AVM1, swfmill placements, and pairwise-equivalent owner-source Bauhaus glyph subsets prove the frame-209 current-JavaScript initial pattern-quiz drawing state. They authorize only a deterministic initial-state drawing and frame-210 post-stop static inspection; they do not establish the source device-font runtime, original runtime behavior, interaction, audio, parity, review, or acceptance.",
      generator: support.withoutContents(generatorBinding),
      parser: support.withoutContents(parserBinding),
      source: {
        swf: support.withoutContents(sourceSwf),
        fla: support.withoutContents(sourceFla),
        sourceAudit: support.withoutContents(sourceAudit),
        authoringAudit: support.withoutContents(authoringAudit),
        structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
        glyphSupplements: {
          digitMinus: {
            swf: support.withoutContents(digitSwf),
            fontObjectId: DIGIT_MINUS_SUPPLEMENT.fontObjectId,
            ttfSha256: DIGIT_MINUS_SUPPLEMENT.ttfSha256,
          },
          comma: {
            swf: support.withoutContents(commaSwf),
            fontObjectId: COMMA_SUPPLEMENT.fontObjectId,
            ttfSha256: COMMA_SUPPLEMENT.ttfSha256,
          },
        },
      },
      toolchain: {ffdec: ffdecTool, swfmill: swfmillTool, python: pythonTool},
      exactSourceScripts: sourceScripts,
      sourceContract: {
        questionCount: scriptContract.labels.length,
        randomQuestionCallCount: 1,
        randomFeedbackAudioCallCount: 1,
        randomSelectionWithoutReplacementUntilReset: true,
        answerFieldCount: 2,
        checkingUsesExactStringEquality: true,
        correctStartsCoachAudioTwo: true,
        incorrectStartsCoachAudioOneAndShowsFeedback: true,
        newProblemCallsLocalSelector: true,
        resetReenablesInputsAndButtons: true,
        hyperlinkDelegatesToRootDoHyperLinks: true,
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
        font: validatedStructure.font,
      },
      initialQuizState: overlay,
      unresolved: [
        "No authorized original runtime has captured a naturally selected TI005 question or the frame-209 initialized display list.",
        "The deterministic implementation seed selects one source tuple by modulo five; it is not injected into or claimed to reproduce AVM1 random state.",
        "The source requests a device-rendered bold Bauhaus font. Pairwise-equivalent owner-source subsets recover required outlines, but the original device-font runtime remains unestablished.",
        "Input, answer checking, New Problem, reset, correct/incorrect feedback, feedback visibility, and hyperlink behavior remain disabled and unvalidated.",
        "Frame 210 is post-stop static inspection only and is excluded from natural live playback.",
        "Embedded and associated audio, bilingual behavior, root/host reachability, companion timelines, Replay, authoritative baseline, RMSE, product/accessibility QA, fresh human review, owner acceptance, strict completion, and lesson release remain pending.",
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
    return {report, json: support.stableJson(report), markdown: renderMarkdown(report)};
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
      "node scripts/build-g4-l3-ti005-source-local-pattern-quiz-contract.mjs " +
      "[--check] [--ffdec <command>] [--swfmill <command>] [--python <command>]\n");
    return;
  }
  const built = await buildTi005SourceLocalPatternQuizContract(options);
  await Promise.all([
    support.emit(OUTPUT_JSON, built.json, options.check),
    support.emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "frame 209 source-local initial state; frame 210 post-stop static only; " +
    "strict acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
