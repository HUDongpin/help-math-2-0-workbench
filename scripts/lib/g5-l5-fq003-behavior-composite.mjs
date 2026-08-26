import {createHash} from "node:crypto";

const ANIMATION_ID = "course-g05-l05-fq-003";
const SETUP_PATH = "DefineSprite_830/frame_1/DoAction.as";
const RESULT_PATH = "DefineSprite_16/frame_2/DoAction.as";
const OPTION_LETTERS = Object.freeze({"1": "A", "2": "B", "3": "C", "4": "D"});
const CORRECT_RGB = Object.freeze([0, 153, 102]);
const INCORRECT_RGB = Object.freeze([255, 0, 0]);

function invariant(condition, message) {
  if (!condition) throw new Error(`${ANIMATION_ID}: ${message}`);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stable(value[key])]),
  );
}

export function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

export function withFingerprint(value) {
  const artifactFingerprintSha256 = sha256(stableJson(value));
  return Object.freeze({
    ...value,
    artifactFingerprintSha256,
    generatedMarker: `sha256:${artifactFingerprintSha256}`,
  });
}

function parseScriptBundle(text) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const scripts = new Map();
  const pattern = /===== (.*?) =====\n([\s\S]*?)(?=\n===== |$)/g;
  for (const match of normalized.matchAll(pattern)) {
    invariant(!scripts.has(match[1]), `duplicate FFDec script path: ${match[1]}`);
    scripts.set(match[1], `${match[2].replace(/\n+$/, "")}\n`);
  }
  invariant(scripts.size > 0, "FFDec script bundle is empty");
  return scripts;
}

function verifyScriptInventory(scripts, inventory) {
  invariant(Array.isArray(inventory?.scripts), "script inventory is malformed");
  invariant(
    scripts.size === inventory.scripts.length,
    `script bundle/inventory count mismatch (${scripts.size}/${inventory.scripts.length})`,
  );
  const byPath = new Map(inventory.scripts.map((entry) => [entry.sourcePath, entry]));
  for (const [sourcePath, body] of scripts) {
    const entry = byPath.get(sourcePath);
    invariant(entry, `script inventory lost ${sourcePath}`);
    invariant(
      Buffer.byteLength(body) === entry.bytes && sha256(body) === entry.sha256,
      `script bytes or SHA-256 changed: ${sourcePath}`,
    );
  }
  return byPath;
}

function requireScript(scripts, inventoryByPath, sourcePath, tokens = []) {
  const body = scripts.get(sourcePath);
  invariant(body !== undefined, `missing script ${sourcePath}`);
  for (const token of tokens) {
    invariant(body.includes(token), `${sourcePath} lost required token ${token}`);
  }
  const inventory = inventoryByPath.get(sourcePath);
  return Object.freeze({
    path: sourcePath,
    bytes: inventory.bytes,
    sha256: inventory.sha256,
  });
}

function extractAttribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
}

function definitionOpeningTag(fragment) {
  const end = fragment.indexOf(">");
  invariant(end >= 0, "definition opening tag is unterminated");
  return fragment.slice(0, end + 1);
}

function extractDefinitionXml(xml, tagName, objectId) {
  const marker = `<${tagName} objectID="${objectId}"`;
  const start = xml.indexOf(marker);
  invariant(start >= 0, `swfmill XML lost ${tagName} ${objectId}`);
  const endTag = `</${tagName}>`;
  const end = xml.indexOf(endTag, start);
  invariant(end >= 0, `swfmill XML has unterminated ${tagName} ${objectId}`);
  return xml.slice(start, end + endTag.length);
}

function extractSpriteXml(xml, objectId) {
  return extractDefinitionXml(xml, "DefineSprite", objectId);
}

function spriteTimeline(xml, objectId) {
  const sprite = extractSpriteXml(xml, objectId);
  const placements = [];
  const frameDisplayLists = new Map();
  const displayList = new Map();
  let frame = 1;
  for (const line of sprite.split("\n")) {
    if (line.includes("<PlaceObject2 ")) {
      const objectIdAttribute = extractAttribute(line, "objectID");
      const depth = Number(extractAttribute(line, "depth"));
      const name = extractAttribute(line, "name");
      placements.push({
        frame,
        objectId: Number(objectIdAttribute),
        depth,
        name,
      });
      const prior = displayList.get(depth);
      if (objectIdAttribute !== null) {
        displayList.set(depth, {
          depth,
          objectId: Number(objectIdAttribute),
          name: name ?? null,
        });
      } else if (prior) {
        displayList.set(depth, {...prior, name: name ?? prior.name});
      }
    }
    if (line.includes("<RemoveObject2 ")) {
      displayList.delete(Number(extractAttribute(line, "depth")));
    }
    if (line.includes("<ShowFrame")) {
      frameDisplayLists.set(
        frame,
        [...displayList.values()].sort((left, right) => left.depth - right.depth),
      );
      frame += 1;
    }
  }
  return {placements, frameDisplayLists, frameCount: frame - 1};
}

function sourceFontDescriptor(xml, objectId) {
  const tagName = ["DefineFont3", "DefineFont2"].find((candidate) =>
    xml.includes(`<${candidate} objectID="${objectId}"`));
  invariant(tagName, `swfmill XML lost source font ${objectId}`);
  const fragment = extractDefinitionXml(xml, tagName, objectId);
  const opening = definitionOpeningTag(fragment);
  const glyphMaps = [...fragment.matchAll(/<Glyph map="(\d+)">/g)]
    .map((match) => Number(match[1]));
  const advanceBody = fragment.match(/<advance>([\s\S]*?)<\/advance>/)?.[1] ?? "";
  const advances = [...advanceBody.matchAll(/<Short value="(-?\d+)"\/>/g)]
    .map((match) => Number(match[1]));
  invariant(
    advances.length === 0 || glyphMaps.length === advances.length,
    `font ${objectId} glyph/advance count changed`,
  );
  return Object.freeze({
    objectId,
    functionName: `font${objectId}`,
    sourceName: extractAttribute(opening, "name"),
    unitsPerEm: tagName === "DefineFont3" ? 20480 : 1024,
    ascent: Number(extractAttribute(opening, "ascent")),
    descent: Number(extractAttribute(opening, "descent")),
    leading: Number(extractAttribute(opening, "leading")),
    bold: extractAttribute(opening, "bold") === "1",
    italic: extractAttribute(opening, "italic") === "1",
    advances: Object.fromEntries(glyphMaps.slice(0, advances.length)
      .map((codePoint, index) => [String.fromCodePoint(codePoint), advances[index]])),
  });
}

function sourceDynamicTextField(xml, objectId, fonts) {
  const fragment = extractDefinitionXml(xml, "DefineEditText", objectId);
  const opening = definitionOpeningTag(fragment);
  const rectangle = fragment.match(
    /<Rectangle left="(-?\d+)" right="(-?\d+)" top="(-?\d+)" bottom="(-?\d+)"\/>/,
  );
  const color = fragment.match(
    /<Color red="(\d+)" green="(\d+)" blue="(\d+)" alpha="(\d+)"\/>/,
  );
  invariant(rectangle && color, `dynamic text field ${objectId} geometry changed`);
  const fontObjectId = Number(extractAttribute(opening, "fontRef"));
  const font = fonts[String(fontObjectId)];
  invariant(font, `dynamic text field ${objectId} lost font ${fontObjectId}`);
  const fontHeightTwips = Number(extractAttribute(opening, "fontHeight"));
  const sourceUsesDeviceFont = extractAttribute(opening, "useOutlines") === "0";
  return Object.freeze({
    objectId,
    functionName: `text${objectId}`,
    boundsTwips: {
      left: Number(rectangle[1]),
      right: Number(rectangle[2]),
      top: Number(rectangle[3]),
      bottom: Number(rectangle[4]),
    },
    colorRgba: [
      Number(color[1]),
      Number(color[2]),
      Number(color[3]),
      Number(color[4]) / 255,
    ],
    fontObjectId,
    fontHeightTwips,
    baselineTwips: Math.round(fontHeightTwips *
      (font.ascent > 0 ? font.ascent / font.unitsPerEm : 0.95)),
    sourceUsesDeviceFont,
    expectedEmptyFunction: sourceUsesDeviceFont,
    initialText: extractAttribute(opening, "initialText") ?? "",
  });
}

function parseArrayAssignment(body, variableName) {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(new RegExp(`${escaped}\\s*=\\s*\\[([^;]+)\\];`));
  invariant(match, `missing array assignment ${variableName}`);
  return JSON.parse(`[${match[1]}]`);
}

function parseObjectId(sourcePath) {
  const match = sourcePath.match(/PlaceObject2_(\d+)_/);
  invariant(match, `cannot parse object ID from ${sourcePath}`);
  return Number(match[1]);
}

function parseQuestionFrame(sourcePath) {
  const match = sourcePath.match(/DefineSprite_\d+\/frame_(\d+)\//);
  invariant(match, `cannot parse question frame from ${sourcePath}`);
  return Number(match[1]);
}

function sourcePlacementCount(framesHtml, functionName) {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...framesHtml.matchAll(new RegExp(`place\\("${escaped}",`, "g"))].length;
}

function sourceFunctionIsEmpty(framesHtml, functionName) {
  const marker = `function ${functionName}(ctx,ctrans,frame,ratio,time){`;
  const start = framesHtml.indexOf(marker);
  invariant(start >= 0, `FFDec export lost function ${functionName}`);
  const bodyStart = start + marker.length;
  const end = framesHtml.indexOf("\n}", bodyStart);
  invariant(end >= 0, `FFDec export has unterminated function ${functionName}`);
  return framesHtml.slice(bodyStart, end).trim().length === 0;
}

function deviceFontFamily(sourceFont) {
  if (sourceFont.sourceName === "Bauhaus Md BT") {
    return '"Bauhaus Md BT", "Arial Rounded MT Bold", sans-serif';
  }
  invariant(sourceFont.sourceName === "Arial", "device font family changed");
  return '"Arial", sans-serif';
}

function counterValues(position) {
  invariant(Number.isSafeInteger(position) && position >= 1 && position <= 26,
    `invalid quiz position ${position}`);
  return {
    total: "26",
    ordinalWithPeriod: position < 10 ? `  ${position}.` : `${position}.`,
    ordinal: position < 10 ? `  ${position}` : String(position),
  };
}

export function deriveFq003BehaviorIr({
  scriptBundleText,
  scriptInventory,
  swfmillXml,
  bindings,
}) {
  const scripts = parseScriptBundle(scriptBundleText);
  const inventoryByPath = verifyScriptInventory(scripts, scriptInventory);
  const setupBody = scripts.get(SETUP_PATH);
  const setupScript = requireScript(scripts, inventoryByPath, SETUP_PATH, [
    "function doGetRandomQuiz()",
    "function doGetReview()",
    "Mc_Result._visible = false;",
    "Mc_Finish._visible = false;",
    "Mc_Finish.gotoAndStop(1);",
    "new LoadVars()",
  ]);
  const resultScript = requireScript(scripts, inventoryByPath, RESULT_PATH, [
    "_parent.Mc_Result.TxtScore.text = _global.CorAns;",
    "_parent.Mc_Result.TxtTotal.text = _global.TotQuiz;",
    "_parent.Mc_Result.TxtGrade.text = _global.Grade;",
    "_parent.Mc_Finish.TxtScore.text = _global.CorAns + \" / \" + _global.TotQuiz + \".\";",
    "QuizReport_URL",
  ]);
  const correctAnswers = parseArrayAssignment(setupBody, "_global.arrayAnswer");
  const questionLabels = parseArrayAssignment(setupBody, "_global.quizLabelArray");
  const reviewLabels = parseArrayAssignment(setupBody, "_global.revLabelArray");
  invariant(
    correctAnswers.length === 26 && questionLabels.length === 26 &&
      reviewLabels.length === 26,
    "question bank must contain 26 source entries",
  );
  const totalQuestions = Number(
    setupBody.match(/_global\.totalQuestionsCount\s*=\s*(\d+)/)?.[1],
  );
  invariant(totalQuestions === 26, "source selected-question count changed");
  invariant(
    setupBody.includes("Mc_Finish._visible = true;") &&
      setupBody.includes("Mc_Finish.gotoAndStop(2);") &&
      setupBody.includes("Mc_Result._visible = true;") &&
      setupBody.includes("Mc_Result.gotoAndStop(1);"),
    "terminal/review visibility or goto assignments changed",
  );
  invariant(
    setupBody.includes("myColor.setRGB(39270)") &&
      setupBody.includes("myColor.setRGB(16711680)") &&
      setupBody.includes('fldName.text = "Correct"') &&
      setupBody.includes('fldName.text = "Incorrect"'),
    "review color or feedback assignments changed",
  );

  const timeline = spriteTimeline(swfmillXml, 830);
  invariant(timeline.frameCount === 72, "sprite 830 frame count changed");
  const answerPaths = [...scripts.keys()].filter((sourcePath) =>
    /^DefineSprite_830\/frame_(?:[2-9]|1\d|2[0-7])\/PlaceObject2_/.test(sourcePath) &&
      sourcePath.endsWith("CLIPACTIONRECORD on(release).as"),
  ).sort();
  invariant(answerPaths.length === 104, "source answer-handler count changed");
  const questions = questionLabels.map((questionLabel, questionIndex) => {
    const frame = questionIndex + 2;
    const paths = answerPaths.filter((sourcePath) => parseQuestionFrame(sourcePath) === frame);
    invariant(paths.length === 4, `${questionLabel} must retain four answer handlers`);
    const framePlacements = timeline.placements.filter((item) => item.frame === frame);
    const options = paths.map((sourcePath) => {
      const objectId = parseObjectId(sourcePath);
      const placement = framePlacements.find((item) => item.objectId === objectId);
      invariant(placement?.name, `${questionLabel} object ${objectId} lost its instance name`);
      const body = scripts.get(sourcePath);
      requireScript(scripts, inventoryByPath, sourcePath, [
        "arrayResponseAnswer.push",
        "doGetRandomQuiz",
      ]);
      return {
        option: Number(placement.name.match(/Opt(\d+)$/)?.[1]),
        instanceName: placement.name,
        objectId,
        result: body.includes("arrayCorrectAnswer.push") ? "correct" : "wrong",
      };
    }).sort((left, right) => left.option - right.option);
    invariant(
      JSON.stringify(options.map(({option}) => option)) === JSON.stringify([1, 2, 3, 4]),
      `${questionLabel} option mapping changed`,
    );
    const correct = options.filter(({result}) => result === "correct");
    invariant(
      correct.length === 1 && correct[0].instanceName === correctAnswers[questionIndex],
      `${questionLabel} correct handler disagrees with arrayAnswer`,
    );
    return {
      questionNumber: questionIndex + 1,
      questionLabel,
      reviewLabel: reviewLabels[questionIndex],
      questionFrame: frame,
      reviewFrame: questionIndex + 46,
      correctOption: correct[0].option,
      correctInstanceName: correct[0].instanceName,
      options,
    };
  });

  const placementAt = (frame, instanceName) => {
    const placement = timeline.frameDisplayLists.get(frame)
      ?.find(({name}) => name === instanceName);
    invariant(placement, `frame ${frame} lost ${instanceName}`);
    return placement;
  };
  const fonts = Object.fromEntries([2, 9, 430].map((objectId) => [
    String(objectId),
    sourceFontDescriptor(swfmillXml, objectId),
  ]));
  invariant(
    fonts["2"].sourceName === "Bauhaus Md BT" &&
      fonts["9"].sourceName === "Arial" && fonts["9"].bold === true &&
      fonts["430"].sourceName === "Bauhaus Md BT" && fonts["430"].bold === true,
    "dynamic-field source fonts changed",
  );
  const dynamicFieldObjectIds = new Set();
  const dynamicFunction = (placement) => {
    dynamicFieldObjectIds.add(placement.objectId);
    return `text${placement.objectId}`;
  };
  const finishPlacement = placementAt(1, "Mc_Finish");
  invariant(finishPlacement.objectId === 16, "Mc_Finish object changed");
  const finishTimeline = spriteTimeline(swfmillXml, finishPlacement.objectId);
  invariant(finishTimeline.frameCount === 2, "Mc_Finish timeline changed");
  const finishScorePlacement = finishTimeline.frameDisplayLists.get(2)
    ?.find(({name}) => name === "TxtScore");
  invariant(finishScorePlacement?.objectId === 15, "Mc_Finish.TxtScore changed");
  const finishScoreFunction = dynamicFunction(finishScorePlacement);
  const questionVisuals = questions.map((question) => ({
    questionNumber: question.questionNumber,
    frame: question.questionFrame,
    counters: {
      total: dynamicFunction(placementAt(question.questionFrame, "TQ")),
      ordinalWithPeriod: dynamicFunction(placementAt(question.questionFrame, "QuestNo")),
      ordinal: dynamicFunction(placementAt(question.questionFrame, "CQ")),
    },
  }));
  const reviewVisuals = questions.map((question) => {
    const optionPrefix = `R${question.questionNumber}Opt`;
    const options = [1, 2, 3, 4].map((option) => {
      const placement = placementAt(question.reviewFrame, `${optionPrefix}${option}`);
      const opening = definitionOpeningTag(extractSpriteXml(swfmillXml, placement.objectId));
      invariant(Number(extractAttribute(opening, "frames")) === 1,
        `${optionPrefix}${option} sprite timeline changed`);
      return {
        option,
        instanceName: placement.name,
        objectId: placement.objectId,
        functionName: `sprite${placement.objectId}`,
      };
    });
    return {
      questionNumber: question.questionNumber,
      frame: question.reviewFrame,
      correctOption: question.correctOption,
      counters: {
        total: dynamicFunction(placementAt(question.reviewFrame, "TQ")),
        ordinalWithPeriod: dynamicFunction(placementAt(question.reviewFrame, "QuestNo")),
        ordinal: dynamicFunction(placementAt(question.reviewFrame, "CQ")),
      },
      answerSummary: {
        selected: dynamicFunction(placementAt(question.reviewFrame, "txtResAns")),
        correct: dynamicFunction(placementAt(question.reviewFrame, "txtCorAns")),
      },
      feedbackFields: Object.fromEntries([1, 2, 3, 4].map((option) => [
        String(option),
        dynamicFunction(placementAt(question.reviewFrame, `TxtFeed${option}`)),
      ])),
      options,
    };
  });
  const dynamicTextFields = Object.fromEntries(
    [...dynamicFieldObjectIds].sort((left, right) => left - right).map((objectId) => {
      const field = sourceDynamicTextField(swfmillXml, objectId, fonts);
      return [field.functionName, field];
    }),
  );
  invariant(Object.keys(dynamicTextFields).length === 263,
    "dynamic-text field set changed from the 263-field source mapping");
  const resultPlacementCount = timeline.placements
    .filter(({name}) => name === "Mc_Result").length;
  invariant(resultPlacementCount === 0,
    "sprite 830 unexpectedly gained a directly placed Mc_Result overlay");
  const hostTokens = [
    "LoadVars",
    "getURL",
    "setBookMark",
    "doCloseApp",
    "QuizReport_URL",
  ];
  for (const token of hostTokens) {
    invariant([...scripts.values()].some((body) => body.includes(token)),
      `legacy host token disappeared: ${token}`);
  }

  return withFingerprint({
    schemaVersion: 1,
    artifactType: "source-bound-behavior-composite-ir",
    animationId: ANIMATION_ID,
    sourceBindings: bindings,
    parserContract: {
      kind: "ffdec-avm1-plus-swfmill-static-assignments-v1",
      avm1Executed: false,
      unknownAssignmentDisposition: "fail-closed",
    },
    derived: {
      behaviorKind: "twenty-six-in-source-order-final-quiz-result-and-review",
      timeline: {
        objectId: 830,
        frameCount: 72,
        questionFrames: [2, 27],
        resultFrame: 45,
        reviewFrames: [46, 71],
      },
      selection: {
        bankSize: 26,
        selectedCount: 26,
        sourceOrderPreserved: true,
        randomnessInjected: false,
      },
      answerKey: questions.map(({correctOption}) => correctOption),
      questions,
      scriptAssignments: {
        initial: [
          {target: "Mc_Result._visible", value: false},
          {target: "Mc_Finish._visible", value: false},
          {target: "Mc_Finish.frame", value: 1},
        ],
        terminal: [
          {target: "Mc_Finish._visible", value: true},
          {target: "Mc_Finish.frame", value: 2},
        ],
        reviewComplete: [
          {target: "Mc_Result._visible", value: true},
          {target: "Mc_Result.frame", value: 1},
        ],
        resultText: [
          "Mc_Result.TxtScore <- CorAns",
          "Mc_Result.TxtTotal <- TotQuiz",
          "Mc_Result.TxtGrade <- Grade",
          "Mc_Finish.TxtScore <- CorAns / TotQuiz.",
        ],
        enabled: [
          "current question A*Opt1..4 <- false after final response",
          "NextBtn <- false after final review",
        ],
      },
      visualReconstruction: {
        question: {
          frames: questionVisuals,
          counterFormatting: {
            total: "26",
            singleDigitOrdinalPrefix: "  ",
            ordinalWithPeriodSuffix: ".",
          },
        },
        finish: {
          functionName: `sprite${finishPlacement.objectId}`,
          objectId: finishPlacement.objectId,
          sourceChildFrameZeroBased: 1,
          frameCount: finishTimeline.frameCount,
          scoreField: finishScoreFunction,
          scoreFormat: "{correct} / 26.",
        },
        review: {
          frames: reviewVisuals,
          optionLetters: OPTION_LETTERS,
          feedbackCopy: {correct: "Correct", incorrect: "Incorrect"},
          correctRgb: CORRECT_RGB,
          incorrectRgb: INCORRECT_RGB,
          sourceTextFieldBorderEnabled: true,
        },
        result: {
          sourceMcResultPlacementCount: resultPlacementCount,
          sourceExactResultOverlayClaimed: false,
          currentJsDisposition:
            "degraded-reuse-source-finish-panel-with-source-score-field; original-runtime and fidelity remain closed",
        },
        dynamicTextFields,
        fonts,
      },
      sourceScripts: {setup: setupScript, result: resultScript},
      legacyHostEffects: hostTokens.map((source) => ({
        source,
        disposition:
          "blocked; replace only with typed modern My Lesson memory-local intent when product code requires it",
      })),
      audio: {
        sourceCalls: ["doPlayFQQuestionAudio", "doPlayFQAnswerAudio"],
        sourceLanguages: ["EN", "SP"],
        currentJsDisposition: "disabled-pending-exact-audio-closure-and-listening-acceptance",
      },
    },
    acceptanceEffects: {
      authoritativeOriginalRuntime: false,
      behaviorParityAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      releaseEligible: false,
      published: false,
    },
  });
}

export function expandFq003BehaviorComposite(ir, framesHtml) {
  invariant(ir?.artifactType === "source-bound-behavior-composite-ir",
    "behavior IR type changed");
  const visual = ir.derived?.visualReconstruction;
  invariant(
    ir.derived?.behaviorKind ===
      "twenty-six-in-source-order-final-quiz-result-and-review" &&
      ir.derived.selection?.selectedCount === 26 &&
      visual?.finish?.functionName === "sprite16" &&
      visual.finish.sourceChildFrameZeroBased === 1 &&
      visual.finish.scoreField === "text15" &&
      visual.result?.sourceMcResultPlacementCount === 0 &&
      visual.question?.frames?.length === 26 && visual.review?.frames?.length === 26,
    "source visual reconstruction boundary changed",
  );
  const dynamicAllowedValues = new Map();
  const addDynamic = (overrides, functionName, value) => {
    invariant(visual.dynamicTextFields[functionName],
      `missing source dynamic field ${functionName}`);
    invariant(overrides[functionName] === undefined,
      `duplicate override for ${functionName}`);
    overrides[functionName] = value;
    const textValue = typeof value === "string" ? value : value.value;
    const allowed = dynamicAllowedValues.get(functionName) ?? new Set();
    allowed.add(textValue);
    dynamicAllowedValues.set(functionName, allowed);
  };
  const addCounters = (overrides, frame, position) => {
    const values = counterValues(position);
    addDynamic(overrides, frame.counters.total, values.total);
    addDynamic(overrides, frame.counters.ordinalWithPeriod, values.ordinalWithPeriod);
    addDynamic(overrides, frame.counters.ordinal, values.ordinal);
  };
  const common = ({hiddenFinish, allowedLocalFrames}) => ({
    allowedLocalFrames,
    hiddenFunctions: hiddenFinish ? [visual.finish.functionName] : [],
    forceOpaqueFunctions: [],
    frameOverrides: hiddenFinish
      ? {}
      : {[visual.finish.functionName]: visual.finish.sourceChildFrameZeroBased},
    translationOverrides: {},
  });
  const states = [];
  for (const frame of visual.question.frames) {
    const dynamicTextOverrides = {};
    addCounters(dynamicTextOverrides, frame, frame.questionNumber);
    states.push({
      stateId: `question-n${frame.questionNumber}`,
      ...common({hiddenFinish: true, allowedLocalFrames: [frame.frame]}),
      dynamicTextOverrides,
      rgbOverrides: {},
    });
  }
  for (let correct = 0; correct <= 26; correct += 1) {
    const dynamicTextOverrides = {};
    addDynamic(dynamicTextOverrides, visual.finish.scoreField, `${correct} / 26.`);
    states.push({
      stateId: `result-score${correct}`,
      ...common({hiddenFinish: false, allowedLocalFrames: [45]}),
      dynamicTextOverrides,
      rgbOverrides: {},
    });
  }
  for (const frame of visual.review.frames) {
    for (let selectedOption = 1; selectedOption <= 4; selectedOption += 1) {
      const correctOption = frame.correctOption;
      const selectedCorrect = selectedOption === correctOption;
      const selectedColor = selectedCorrect ? CORRECT_RGB : INCORRECT_RGB;
      const dynamicTextOverrides = {};
      const rgbOverrides = {};
      addCounters(dynamicTextOverrides, frame, frame.questionNumber);
      addDynamic(dynamicTextOverrides, frame.answerSummary.selected, {
        value: OPTION_LETTERS[String(selectedOption)],
        colorRgba: [...selectedColor, 1],
      });
      addDynamic(dynamicTextOverrides, frame.answerSummary.correct, {
        value: OPTION_LETTERS[String(correctOption)],
        colorRgba: [...CORRECT_RGB, 1],
      });
      addDynamic(dynamicTextOverrides, frame.feedbackFields[String(selectedOption)], {
        value: selectedCorrect ? "Correct" : "Incorrect",
        colorRgba: [...selectedColor, 1],
        borderColorRgba: [...selectedColor, 1],
      });
      if (!selectedCorrect) {
        addDynamic(dynamicTextOverrides, frame.feedbackFields[String(correctOption)], {
          value: "Correct",
          colorRgba: [...CORRECT_RGB, 1],
          borderColorRgba: [...CORRECT_RGB, 1],
        });
      }
      const selectedVisual = frame.options.find(({option}) => option === selectedOption);
      const correctVisual = frame.options.find(({option}) => option === correctOption);
      invariant(selectedVisual && correctVisual,
        `review question ${frame.questionNumber} option visuals changed`);
      rgbOverrides[selectedVisual.functionName] = selectedColor;
      rgbOverrides[correctVisual.functionName] = CORRECT_RGB;
      states.push({
        stateId: `review-q${frame.questionNumber}-selected${selectedOption}`,
        ...common({hiddenFinish: true, allowedLocalFrames: [frame.frame]}),
        dynamicTextOverrides,
        rgbOverrides,
      });
    }
  }
  invariant(states.length === 157, `generated state count changed (${states.length})`);
  invariant(new Set(states.map(({stateId}) => stateId)).size === states.length,
    "generated duplicate state ID");

  const functionEvidence = {
    [visual.finish.functionName]: {
      objectId: visual.finish.objectId,
      frameCount: visual.finish.frameCount,
      expectedPlacementCount: sourcePlacementCount(framesHtml, visual.finish.functionName),
    },
  };
  for (const frame of visual.review.frames) {
    for (const option of frame.options) {
      functionEvidence[option.functionName] = {
        objectId: option.objectId,
        frameCount: 1,
        expectedPlacementCount: sourcePlacementCount(framesHtml, option.functionName),
      };
    }
  }
  const dynamicTextFields = Object.fromEntries(
    [...dynamicAllowedValues.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "en", {numeric: true}))
      .map(([functionName, values]) => {
        const field = visual.dynamicTextFields[functionName];
        const sourceFont = visual.fonts[String(field.fontObjectId)];
        invariant(sourceFont, `${functionName} source font changed`);
        const allowedValues = [...values];
        const sourceEmbeddedGlyphCoverageCompleteForAllowedValues =
          allowedValues.every((value) => [...value].every((character) =>
            Object.hasOwn(sourceFont.advances, character)));
        const font = {
          objectId: sourceFont.objectId,
          functionName: sourceFont.functionName,
          sourceName: sourceFont.sourceName,
          unitsPerEm: sourceFont.unitsPerEm,
          heightTwips: field.fontHeightTwips,
          baselineTwips: field.baselineTwips,
          colorRgba: field.colorRgba,
          ...(field.sourceUsesDeviceFont
            ? {
                renderingMode:
                  "source-device-font-reconstruction-pending-original-runtime",
                currentJsFontFamily: deviceFontFamily(sourceFont),
                currentJsFontWeight: sourceFont.bold ? "bold" : "normal",
                currentJsFontSizeTwips: field.fontHeightTwips,
                sourceEmbeddedGlyphCoverageCompleteForAllowedValues,
              }
            : {
                advances: Object.fromEntries(
                  [...new Set(allowedValues.flatMap((value) => [...value]))]
                    .map((character) => {
                      const advance = sourceFont.advances[character];
                      invariant(Number.isFinite(advance) && advance > 0,
                        `${functionName} lost source glyph ${character}`);
                      return [character, advance];
                    }),
                ),
              }),
        };
        return [functionName, {
          objectId: field.objectId,
          expectedPlacementCount: sourcePlacementCount(framesHtml, functionName),
          expectedEmptyFunction: sourceFunctionIsEmpty(framesHtml, functionName),
          boundsTwips: field.boundsTwips,
          sourceUsesDeviceFont: field.sourceUsesDeviceFont,
          sourceInitialText: field.initialText,
          font,
          allowedValues,
        }];
      }),
  );
  invariant(Object.keys(dynamicTextFields).length === 263,
    "expanded dynamic-text field set changed");
  invariant(Object.values(functionEvidence).every(({expectedPlacementCount}) =>
    expectedPlacementCount > 0), "behavior function lost all FFDec placements");
  invariant(Object.values(dynamicTextFields).every(({expectedPlacementCount}) =>
    expectedPlacementCount > 0), "dynamic text function lost all FFDec placements");

  return Object.freeze({
    contractId: "g5-l5-fq003-source-behavior-composite-v1",
    sourceContractFingerprintSha256: ir.artifactFingerprintSha256,
    requiredByCandidateSession: true,
    states,
    functionEvidence,
    dynamicTextFields,
    degradation: {
      avm1Executed: false,
      sourceMcResultPlacementCount: 0,
      resultSurface:
        "source Mc_Finish panel only; no exact Mc_Result visual is claimed",
      audioRendered: false,
      legacyNetworkExecuted: false,
      originalRuntimeAccepted: false,
      visualFidelityAccepted: false,
    },
  });
}
