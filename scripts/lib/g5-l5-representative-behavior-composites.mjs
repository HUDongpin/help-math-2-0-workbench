import {createHash} from "node:crypto";

const VB012_ID = "course-g05-l05-vb-012";
const TS007_ID = "course-g05-l05-ts-007";

function invariant(animationId, condition, message) {
  if (!condition) throw new Error(`${animationId}: ${message}`);
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

function withFingerprint(value) {
  const artifactFingerprintSha256 = sha256(stableJson(value));
  return Object.freeze({
    ...value,
    artifactFingerprintSha256,
    generatedMarker: `sha256:${artifactFingerprintSha256}`,
  });
}

function parseScriptBundle(animationId, text) {
  const scripts = new Map();
  const normalized = text.replace(/\r\n?/g, "\n");
  const pattern = /===== (.*?) =====\n([\s\S]*?)(?=\n===== |$)/g;
  for (const match of normalized.matchAll(pattern)) {
    invariant(animationId, !scripts.has(match[1]),
      `duplicate FFDec script path: ${match[1]}`);
    scripts.set(match[1], `${match[2].replace(/\n+$/, "")}\n`);
  }
  invariant(animationId, scripts.size > 0, "FFDec script bundle is empty");
  return scripts;
}

function verifyScriptInventory(animationId, scripts, inventory) {
  invariant(animationId, Array.isArray(inventory?.scripts),
    "script inventory is malformed");
  invariant(
    animationId,
    scripts.size === inventory.scripts.length,
    `script bundle/inventory count mismatch (${scripts.size}/${inventory.scripts.length})`,
  );
  const byPath = new Map(inventory.scripts.map((entry) => [entry.sourcePath, entry]));
  for (const [sourcePath, body] of scripts) {
    const entry = byPath.get(sourcePath);
    invariant(animationId, entry, `script inventory lost ${sourcePath}`);
    invariant(
      animationId,
      Buffer.byteLength(body) === entry.bytes && sha256(body) === entry.sha256,
      `script bytes or SHA-256 changed: ${sourcePath}`,
    );
  }
  return byPath;
}

function requireScript(animationId, scripts, inventory, sourcePath, tokens) {
  const body = scripts.get(sourcePath);
  invariant(animationId, body !== undefined, `missing script ${sourcePath}`);
  for (const token of tokens) {
    invariant(animationId, body.includes(token),
      `${sourcePath} lost required token ${token}`);
  }
  const entry = inventory.get(sourcePath);
  return Object.freeze({path: sourcePath, bytes: entry.bytes, sha256: entry.sha256});
}

function extractAttribute(tag, name) {
  return tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;
}

function extractDefinitionXml(animationId, xml, tagName, objectId) {
  const marker = `<${tagName} objectID="${objectId}"`;
  const start = xml.indexOf(marker);
  invariant(animationId, start >= 0, `swfmill XML lost ${tagName} ${objectId}`);
  const endTag = `</${tagName}>`;
  const end = xml.indexOf(endTag, start);
  invariant(animationId, end >= 0,
    `swfmill XML has unterminated ${tagName} ${objectId}`);
  return xml.slice(start, end + endTag.length);
}

function spriteTimeline(animationId, xml, objectId) {
  const sprite = extractDefinitionXml(animationId, xml, "DefineSprite", objectId);
  const opening = sprite.slice(0, sprite.indexOf(">") + 1);
  const declaredFrameCount = Number(extractAttribute(opening, "frames"));
  const frameDisplayLists = new Map();
  const placements = [];
  const displayList = new Map();
  let frame = 1;
  for (const line of sprite.split("\n")) {
    if (line.includes("<PlaceObject2 ")) {
      const objectIdAttribute = extractAttribute(line, "objectID");
      const depth = Number(extractAttribute(line, "depth"));
      const name = extractAttribute(line, "name");
      const prior = displayList.get(depth);
      if (objectIdAttribute !== null) {
        const placement = {
          frame,
          depth,
          objectId: Number(objectIdAttribute),
          name: name ?? null,
        };
        placements.push(placement);
        displayList.set(depth, placement);
      } else if (prior) {
        displayList.set(depth, {...prior, frame, name: name ?? prior.name});
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
  invariant(animationId, frame - 1 === declaredFrameCount,
    `sprite ${objectId} frame count changed (${frame - 1}/${declaredFrameCount})`);
  return Object.freeze({
    objectId,
    frameCount: declaredFrameCount,
    placements,
    frameDisplayLists,
  });
}

function namedPlacement(animationId, timeline, frame, name, expectedObjectId) {
  const matches = (timeline.frameDisplayLists.get(frame) ?? [])
    .filter((placement) => placement.name === name);
  invariant(animationId, matches.length === 1,
    `${name} must have one placement at frame ${frame} (observed ${matches.length})`);
  invariant(animationId, matches[0].objectId === expectedObjectId,
    `${name} object ID changed (${matches[0].objectId}/${expectedObjectId})`);
  return Object.freeze({
    frame,
    depth: matches[0].depth,
    name,
    objectId: expectedObjectId,
    functionName: `sprite${expectedObjectId}`,
  });
}

function definitionFrameCount(animationId, xml, objectId) {
  const sprite = extractDefinitionXml(animationId, xml, "DefineSprite", objectId);
  const opening = sprite.slice(0, sprite.indexOf(">") + 1);
  const count = Number(extractAttribute(opening, "frames"));
  invariant(animationId, Number.isSafeInteger(count) && count > 0,
    `sprite ${objectId} has invalid frame count`);
  return count;
}

function sourcePlacementCount(animationId, framesHtml, functionName) {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = [...framesHtml.matchAll(new RegExp(`place\\("${escaped}",`, "g"))]
    .length;
  invariant(animationId, count > 0,
    `FFDec export lost all placements of ${functionName}`);
  return count;
}

function functionEvidence(animationId, xml, framesHtml, objectIds) {
  return Object.fromEntries([...new Set(objectIds)]
    .sort((left, right) => left - right)
    .map((objectId) => {
      const functionName = `sprite${objectId}`;
      return [functionName, {
        objectId,
        frameCount: definitionFrameCount(animationId, xml, objectId),
        expectedPlacementCount:
          sourcePlacementCount(animationId, framesHtml, functionName),
      }];
    }));
}

function acceptanceEffects() {
  return Object.freeze({
    authoritativeOriginalRuntime: false,
    behaviorParityAccepted: false,
    visualFidelityAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictComplete: false,
    releaseEligible: false,
    published: false,
  });
}

function state(stateId, allowedLocalFrames, {
  hidden = [],
  opaque = [],
  frames = {},
} = {}) {
  return Object.freeze({
    stateId,
    allowedLocalFrames,
    hiddenFunctions: [...hidden],
    forceOpaqueFunctions: [...opaque],
    frameOverrides: {...frames},
    translationOverrides: {},
    dynamicTextOverrides: {},
    rgbOverrides: {},
  });
}

export function deriveVb012BehaviorIr({
  scriptBundleText,
  scriptInventory,
  swfmillXml,
  bindings,
}) {
  const scripts = parseScriptBundle(VB012_ID, scriptBundleText);
  const inventory = verifyScriptInventory(VB012_ID, scripts, scriptInventory);
  const requiredScripts = [
    requireScript(VB012_ID, scripts, inventory,
      "DefineSprite_234/frame_81/DoAction.as", [
        "_global.quizSection = true;",
        "_global.quizTryCount = 0;",
        "Mc_Click_Here._visible = false;",
      ]),
    requireScript(VB012_ID, scripts, inventory,
      "DefineButton2_38/BUTTONCONDACTION on(release).as", [
        "_global.quizTryCount++;",
        "_root.showWrongFeed();",
        "Try again.",
      ]),
    requireScript(VB012_ID, scripts, inventory,
      "DefineButton2_39/BUTTONCONDACTION on(release).as", [
        "Mc_Timer.gotoAndStop(1);",
        "_root.showRightFeed();",
      ]),
    requireScript(VB012_ID, scripts, inventory,
      "DefineButton2_58/BUTTONCONDACTION on(release).as", [
        "_parent.gotoAndPlay(23);",
        "_parent.NMHBtn.enabled = false;",
      ]),
  ];
  const wrongFeedback = [62, 80, 94, 106].map((objectId) =>
    requireScript(VB012_ID, scripts, inventory,
      `DefineSprite_${objectId}/frame_${definitionFrameCount(VB012_ID, swfmillXml, objectId)}/DoAction.as`, [
        "_root.enableQuizButton();",
        "_parent.Mc_Click_Here._visible = true;",
        "_parent.Mc_Timer.gotoAndStop(3);",
      ]));
  const rightFeedback = [140, 152, 180, 194, 233].map((objectId) =>
    requireScript(VB012_ID, scripts, inventory,
      `DefineSprite_${objectId}/frame_${definitionFrameCount(VB012_ID, swfmillXml, objectId)}/DoAction.as`, [
        "_root.disableQuizButton();",
        "_global.quizSection = false;",
        "_parent.play();",
      ]));
  const timeline = spriteTimeline(VB012_ID, swfmillXml, 234);
  invariant(VB012_ID, timeline.frameCount === 196,
    "source child frame count changed");
  const placements = {
    clickHere: namedPlacement(VB012_ID, timeline, 81, "Mc_Click_Here", 33),
    timer: namedPlacement(VB012_ID, timeline, 81, "Mc_Timer", 36),
    answer1: namedPlacement(VB012_ID, timeline, 81, "AnsBtn1", 38),
    answer2: namedPlacement(VB012_ID, timeline, 81, "AnsBtn2", 39),
    wrongFeedback: [
      ["Mc_Wrong_Feed2", 62],
      ["Mc_Wrong_Feed3", 80],
      ["Mc_Wrong_Feed4", 94],
      ["Mc_Wrong_Feed1", 106],
    ].map(([name, objectId]) =>
      namedPlacement(VB012_ID, timeline, 81, name, objectId)),
    rightFeedback: [
      ["Mc_Right_Feed1", 140],
      ["Mc_Right_Feed4", 152],
      ["Mc_Right_Feed3", 180],
      ["Mc_Right_Feed2", 194],
      ["Mc_Right_Feed5", 233],
    ].map(([name, objectId]) =>
      namedPlacement(VB012_ID, timeline, 81, name, objectId)),
  };
  const finalDisplayList = timeline.frameDisplayLists.get(196) ?? [];
  invariant(VB012_ID,
    finalDisplayList.filter(({name}) => name !== null).length === 0,
    "terminal frame unexpectedly retained a named interaction placement");

  return withFingerprint({
    schemaVersion: 1,
    artifactType: "source-bound-behavior-composite-ir",
    animationId: VB012_ID,
    sourceBindings: bindings,
    parserContract: {
      kind: "ffdec-avm1-plus-swfmill-static-assignments-v1",
      avm1Executed: false,
      unknownAssignmentDisposition: "fail-closed",
    },
    derived: {
      behaviorKind: "fixed-choice-opposites-with-two-attempt-cap",
      timeline: {objectId: 234, frameCount: 196, questionFrame: 81, completeFrame: 196},
      answerModel: {optionCount: 2, correctOption: 2, maximumWrongAttempts: 2},
      placements,
      sourceAssignments: {
        initial: ["Mc_Click_Here._visible <- false", "quizTryCount <- 0"],
        secondWrongCompletion: [
          "Mc_Click_Here._visible <- true",
          "Mc_Timer.frame <- 3",
        ],
        correctCompletion: ["parent.play()"],
      },
      sourceScripts: {required: [...requiredScripts, ...wrongFeedback, ...rightFeedback]},
      legacyHostEffects: [
        "disableQuizButton",
        "enableQuizButton",
        "showWrongFeed",
        "showRightFeed",
        "DoHyperLinks",
      ].map((source) => ({
        source,
        disposition:
          "not executed; typed modern My Lesson companion owns the bounded interaction effect",
      })),
      audio: {
        currentJsDisposition:
          "disabled-pending-original-runtime-traversal-listening-and-audio-acceptance",
      },
    },
    acceptanceEffects: acceptanceEffects(),
  });
}

export function expandVb012BehaviorComposite(ir, framesHtml, swfmillXml) {
  const animationId = VB012_ID;
  invariant(animationId,
    ir?.derived?.behaviorKind === "fixed-choice-opposites-with-two-attempt-cap",
    "behavior IR kind changed");
  const visual = ir.derived.placements;
  const feedbackFunctions = [
    ...visual.wrongFeedback,
    ...visual.rightFeedback,
  ].map(({functionName}) => functionName);
  const click = visual.clickHere.functionName;
  const timer = visual.timer.functionName;
  const quiet = [click, ...feedbackFunctions];
  const states = [
    state("intro", Array.from({length: 80}, (_, index) => index + 1)),
    state("question-idle", [81], {hidden: quiet, frames: {[timer]: 0}}),
    state("question-wrong-attempt1", [81], {hidden: quiet, frames: {[timer]: 0}}),
    state("question-retry-attempt1", [81], {hidden: quiet, frames: {[timer]: 0}}),
    state("question-correct", [81], {hidden: quiet, frames: {[timer]: 0}}),
    state("question-wrong-attempt2", [81], {
      hidden: feedbackFunctions,
      opaque: [click],
      frames: {[timer]: 2},
    }),
    state("complete", [196]),
  ];
  return Object.freeze({
    contractId: "g5-l5-vb012-source-behavior-composite-v1",
    sourceContractFingerprintSha256: ir.artifactFingerprintSha256,
    requiredByCandidateSession: true,
    states,
    functionEvidence: functionEvidence(
      animationId,
      swfmillXml,
      framesHtml,
      [33, 36, 62, 80, 94, 106, 140, 152, 180, 194, 233],
    ),
    dynamicTextFields: {},
    degradation: {
      avm1Executed: false,
      sourceFeedbackClipsRendered: false,
      feedbackSurface:
        "typed modern My Lesson companion; source feedback selection and animation await original-runtime evidence",
      audioRendered: false,
      originalRuntimeAccepted: false,
      visualFidelityAccepted: false,
    },
  });
}

export function deriveTs007BehaviorIr({
  scriptBundleText,
  scriptInventory,
  swfmillXml,
  bindings,
}) {
  const scripts = parseScriptBundle(TS007_ID, scriptBundleText);
  const inventory = verifyScriptInventory(TS007_ID, scripts, scriptInventory);
  const required = [
    ["DefineSprite_439/frame_245/DoAction.as", ["stop();", "quizSection = true"]],
    ["DefineSprite_439/frame_384/DoAction.as", ["stop();", "quizSection = true"]],
    ["DefineSprite_439/frame_510/DoAction.as", [
      "Mc_box1._visible = false;", "NMHBtn._visible = false;",
    ]],
    ["DefineSprite_439/frame_510/PlaceObject2_48_80/CLIPACTIONRECORD on(release).as", [
      "_parent.Mc_box1._visible = true;", "_parent.NMHBtn._visible = true;",
    ]],
    ["DefineSprite_439/frame_628/DoAction.as", [
      "Mc_box2._visible = false;", "NMHBtn._visible = false;",
    ]],
    ["DefineSprite_439/frame_628/PlaceObject2_48_80/CLIPACTIONRECORD on(release).as", [
      "_parent.Mc_box2._visible = true;", "_parent.NMHBtn._visible = true;",
    ]],
    ["DefineSprite_439/frame_671/DoAction.as", [
      "_global.quizTryCount = 0;", "Mc_Popup._visible = false;",
    ]],
    ["DefineButton2_14/BUTTONCONDACTION on(release).as", [
      "Mc_Popup._visible = true;", "_root.disableQuizButton();",
    ]],
    ["DefineButton2_426/BUTTONCONDACTION on(release).as", [
      "this._visible = false;", "_parent.enablebutton();",
    ]],
    ["DefineButton2_157/BUTTONCONDACTION on(release).as", ["showWrongFeed"]],
    ["DefineButton2_158/BUTTONCONDACTION on(release).as", ["showRightFeed"]],
    ["DefineButton2_159/BUTTONCONDACTION on(release).as", ["showWrongFeed"]],
    ["DefineButton2_160/BUTTONCONDACTION on(release).as", ["showWrongFeed"]],
    ["DefineSprite_439/frame_672/DoAction.as", ["quizSection = false"]],
    ["DefineSprite_439/frame_690/DoAction.as", ["stop();"]],
  ].map(([sourcePath, tokens]) =>
    requireScript(TS007_ID, scripts, inventory, sourcePath, tokens));
  const timeline = spriteTimeline(TS007_ID, swfmillXml, 439);
  invariant(TS007_ID, timeline.frameCount === 690,
    "source child frame count changed");
  const placements = {
    section3Explanation: namedPlacement(TS007_ID, timeline, 510, "Mc_box1", 131),
    section4Explanation: namedPlacement(TS007_ID, timeline, 628, "Mc_box2", 154),
    helpPopup: namedPlacement(TS007_ID, timeline, 671, "Mc_Popup", 181),
    stoppedPopup: namedPlacement(TS007_ID, timeline, 671, "Mc_PopUp", 437),
    wrongFeedback: [
      ["Mc_Wrong_Feed3", 191],
      ["Mc_Wrong_Feed2", 209],
      ["Mc_Wrong_Feed1", 223],
      ["Mc_Wrong_Feed4", 251],
    ].map(([name, objectId]) =>
      namedPlacement(TS007_ID, timeline, 671, name, objectId)),
    rightFeedback: [
      ["Mc_Right_Feed5", 282],
      ["Mc_Right_Feed4", 322],
      ["Mc_Right_Feed2", 348],
      ["Mc_Right_Feed3", 380],
      ["Mc_Right_Feed1", 413],
    ].map(([name, objectId]) =>
      namedPlacement(TS007_ID, timeline, 671, name, objectId)),
    carryForwardFeedback:
      namedPlacement(TS007_ID, timeline, 628, "Mc_Wrong_Feed1", 91),
  };
  const optionObjectIds = [157, 158, 159, 160];
  const optionPlacements = optionObjectIds.map((objectId, index) =>
    namedPlacement(TS007_ID, timeline, 671, `AnsBtn${index + 1}`, objectId));
  const finalDisplayList = timeline.frameDisplayLists.get(690) ?? [];
  invariant(TS007_ID, finalDisplayList.length > 0,
    "terminal source display list unexpectedly became empty");

  return withFingerprint({
    schemaVersion: 1,
    artifactType: "source-bound-behavior-composite-ir",
    animationId: TS007_ID,
    sourceBindings: bindings,
    parserContract: {
      kind: "ffdec-avm1-plus-swfmill-static-assignments-v1",
      avm1Executed: false,
      unknownAssignmentDisposition: "fail-closed",
    },
    derived: {
      behaviorKind: "five-stop-multi-section-explanations-help-and-fixed-choice",
      timeline: {
        objectId: 439,
        frameCount: 690,
        stopFrames: [245, 384, 510, 628, 671],
        continuationFrame: 672,
        completeFrame: 690,
      },
      answerModel: {
        optionCount: 4,
        correctOption: 2,
        maximumWrongAttempts: 2,
        optionPlacements,
      },
      placements,
      sourceAssignments: {
        section3Initial: ["Mc_box1._visible <- false", "NMHBtn._visible <- false"],
        section3Reveal: ["Mc_box1._visible <- true", "Mc_box1.gotoAndPlay(1)"],
        section4Initial: ["Mc_box2._visible <- false", "NMHBtn._visible <- false"],
        section4Reveal: ["Mc_box2._visible <- true", "Mc_box2.gotoAndPlay(1)"],
        questionInitial: ["Mc_Popup._visible <- false", "quizTryCount <- 0"],
        helpOpen: ["Mc_Popup._visible <- true", "quiz controls <- disabled"],
        correctCompletion: ["showRightFeed()", "right feedback parent.play()"],
      },
      sourceScripts: {required},
      legacyHostEffects: [
        "disableQuizButton",
        "enableQuizButton",
        "showWrongFeed",
        "showRightFeed",
        "DoHyperLinks",
      ].map((source) => ({
        source,
        disposition:
          "not executed; typed modern My Lesson companion owns the bounded interaction effect",
      })),
      audio: {
        embeddedStreamCount: 12,
        currentJsDisposition:
          "disabled-pending-original-runtime-traversal-listening-and-audio-acceptance",
      },
    },
    acceptanceEffects: acceptanceEffects(),
  });
}

export function expandTs007BehaviorComposite(ir, framesHtml, swfmillXml) {
  const animationId = TS007_ID;
  invariant(
    animationId,
    ir?.derived?.behaviorKind ===
      "five-stop-multi-section-explanations-help-and-fixed-choice",
    "behavior IR kind changed",
  );
  const visual = ir.derived.placements;
  const section3 = visual.section3Explanation.functionName;
  const section4 = visual.section4Explanation.functionName;
  const help = visual.helpPopup.functionName;
  const stoppedPopup = visual.stoppedPopup.functionName;
  const carryForward = visual.carryForwardFeedback.functionName;
  const feedback = [
    ...visual.wrongFeedback,
    ...visual.rightFeedback,
  ].map(({functionName}) => functionName);
  const quietQuestion = [help, ...feedback];
  const questionFrames = {[stoppedPopup]: 0};
  const states = [
    state("section-1", Array.from({length: 245}, (_, index) => index + 1)),
    state("section-2-stop", [384]),
    state("section-3-idle", [510], {
      hidden: [section3],
      frames: {[carryForward]: 0},
    }),
    state("section-3-explanation", [510], {
      opaque: [section3],
      frames: {[section3]: 0, [carryForward]: 0},
    }),
    state("section-4-idle", [628], {
      hidden: [section4],
      frames: {[carryForward]: 0},
    }),
    state("section-4-explanation", [628], {
      opaque: [section4],
      frames: {[section4]: 0, [carryForward]: 0},
    }),
    state("question-idle", [671], {hidden: quietQuestion, frames: questionFrames}),
    state("question-help-open", [671], {
      hidden: feedback,
      opaque: [help],
      frames: {...questionFrames, [help]: 0},
    }),
    state("question-wrong-attempt1", [671], {
      hidden: quietQuestion,
      frames: questionFrames,
    }),
    state("question-retry-attempt1", [671], {
      hidden: quietQuestion,
      frames: questionFrames,
    }),
    state("question-wrong-attempt2", [671], {
      hidden: quietQuestion,
      frames: questionFrames,
    }),
    state("question-correct", [671], {
      hidden: quietQuestion,
      frames: questionFrames,
    }),
    state("complete", [690]),
  ];
  return Object.freeze({
    contractId: "g5-l5-ts007-source-behavior-composite-v1",
    sourceContractFingerprintSha256: ir.artifactFingerprintSha256,
    requiredByCandidateSession: true,
    states,
    functionEvidence: functionEvidence(
      animationId,
      swfmillXml,
      framesHtml,
      [91, 131, 154, 181, 191, 209, 223, 251, 282, 322, 348, 380, 413, 437],
    ),
    dynamicTextFields: {},
    degradation: {
      avm1Executed: false,
      explanationChildPlayback:
        "source first frame only; natural child playback awaits original-runtime evidence",
      sourceFeedbackClipsRendered: false,
      feedbackSurface:
        "typed modern My Lesson companion; source feedback selection and animation await original-runtime evidence",
      audioRendered: false,
      originalRuntimeAccepted: false,
      visualFidelityAccepted: false,
    },
  });
}
