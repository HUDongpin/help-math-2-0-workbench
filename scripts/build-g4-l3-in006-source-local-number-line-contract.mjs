#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "course-g04-l03-in-006";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/source-local-number-line-quiz-contract.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/source-local-number-line-quiz-contract.md`;
export const PARSER_PATH =
  "scripts/parse-swfmill-in006-number-line-contract.py";

const EXPECTED_TOOLS = Object.freeze({
  ffdec: Object.freeze({
    invokedPath: "/opt/homebrew/bin/ffdec",
    versionArgs: Object.freeze(["-help"]),
    version: "JPEXS Free Flash Decompiler v.26.2.1",
    executableSha256:
      "1a242c6333aa8dba0f18f635f9ea2585a988f4131aa5164b70eb00ad9e662bab",
  }),
  swfmill: Object.freeze({
    invokedPath: "/opt/homebrew/bin/swfmill",
    versionArgs: Object.freeze(["--version"]),
    version: "swfmill 0.3.6",
    executableSha256:
      "b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311",
  }),
  python: Object.freeze({
    invokedPath: "/opt/anaconda3/bin/python3",
    versionArgs: Object.freeze(["--version"]),
    version: "Python 3.12.7",
    executableSha256:
      "14caa9d0a57ad2bceb66f778e13ad9483e79e3812ae7fa2385d2b854ce419fb5",
  }),
});

const TARGET_SPRITE_ID = 151;
const FONT_OBJECT_ID = 3;
const ENTRY_FRAME = 1054;
const EXPECTED_SOURCE_PAIRS = Object.freeze([
  "-11~-8", "-8~-15", "-15~-4", "-4~5",
  "5~9", "9~15", "15~1", "1~-6",
]);
const DRAG_CLIPS = Object.freeze([
  Object.freeze({name: "Mc1", objectId: 125, magnitude: 1}),
  Object.freeze({name: "Mc2", objectId: 130, magnitude: 2}),
  Object.freeze({name: "Mc3", objectId: 133, magnitude: 4}),
  Object.freeze({name: "Mc4", objectId: 122, magnitude: 5}),
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath, root = ROOT) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the repository: ${relativePath}`);
  return resolved;
}

async function run(command, args, options = {}) {
  try {
    return await execFile(command, args, {
      maxBuffer: 64 * 1024 * 1024,
      timeout: 180_000,
      ...options,
    });
  } catch (error) {
    const detail = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed${detail ? `:\n${detail}` : ""}`, {
      cause: error,
    });
  }
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean)
      .map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Keep looking for the exact executable requested by the caller.
    }
  }
  throw new Error(`executable not found: ${command}`);
}

async function inspectTool(command, expected, label) {
  const invokedPath = await resolveExecutable(command);
  invariant(invokedPath === expected.invokedPath,
    `${label} invoked path changed: ${invokedPath}`);
  const resolvedPath = await realpath(invokedPath);
  const [bytes, versionResult] = await Promise.all([
    readFile(resolvedPath),
    run(invokedPath, expected.versionArgs, {
      timeout: 30_000,
      maxBuffer: 8 * 1024 * 1024,
    }),
  ]);
  const versionOutput = `${versionResult.stdout}\n${versionResult.stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "").trim();
  invariant(versionOutput.includes(expected.version),
    `${label} version changed: ${versionOutput || "<empty>"}`);
  invariant(sha256(bytes) === expected.executableSha256,
    `${label} executable SHA-256 changed`);
  return {
    command,
    invokedPath,
    resolvedPath,
    executableBytes: bytes.length,
    executableSha256: sha256(bytes),
    version: expected.version,
  };
}

async function readBinding(relativePath, root = ROOT) {
  const absolute = projectPath(relativePath, root);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath} must be a regular non-symlink file`);
  invariant((await stat(absolute)).nlink === 1,
    `${relativePath} must not have multiple hard links`);
  const contents = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: contents.length,
    sha256: sha256(contents),
    contents,
  };
}

async function readPinned(binding, label, root = ROOT) {
  invariant(binding && typeof binding.path === "string" &&
    Number.isSafeInteger(binding.bytes) && binding.bytes >= 0 &&
    /^[a-f0-9]{64}$/.test(binding.sha256 ?? ""),
  `${label} binding is invalid`);
  const observed = await readBinding(binding.path, root);
  invariant(observed.bytes === binding.bytes && observed.sha256 === binding.sha256,
    `${label} differs from its pinned identity`);
  return observed;
}

function withoutContents(binding) {
  const {contents, ...rest} = binding;
  return rest;
}

async function walkFiles(directory, relative = "") {
  const entries = await readdir(path.join(directory, relative), {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"))) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(directory, child));
    else if (entry.isFile()) files.push(portable(child));
  }
  return files;
}

function normalizeScript(value) {
  return value.replace(/\r\n?/g, "\n");
}

async function freshScripts(ffdec, sourcePath, outputRoot) {
  const result = await run(ffdec.invokedPath, [
    "-onerror", "abort",
    "-export", "script",
    outputRoot,
    sourcePath,
  ]);
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_TOOLS.ffdec.version),
    "fresh FFDec script export version changed");
  const scripts = new Map();
  for (const file of await walkFiles(outputRoot)) {
    if (!file.endsWith(".as")) continue;
    scripts.set(file.replace(/^scripts\//, ""),
      normalizeScript(await readFile(path.join(outputRoot, file), "utf8")));
  }
  return scripts;
}

async function freshStructure({ffdec, swfmill, python, parserPath, sourcePath,
  outputRoot}) {
  const xmlPath = path.join(outputRoot, "L3IN06.xml");
  const conversion = await run(swfmill.invokedPath,
    ["swf2xml", sourcePath, xmlPath]);
  invariant(!/error/i.test(`${conversion.stdout}\n${conversion.stderr}`),
    "swfmill reported an error while parsing IN006");

  const fontDirectory = path.join(outputRoot, "font");
  const fontExport = await run(ffdec.invokedPath, [
    "-onerror", "abort",
    "-selectid", String(FONT_OBJECT_ID),
    "-format", "font:ttf",
    "-export", "font",
    fontDirectory,
    sourcePath,
  ]);
  invariant(`${fontExport.stdout}\n${fontExport.stderr}`
    .includes(EXPECTED_TOOLS.ffdec.version),
  "fresh FFDec font exporter version changed");
  const fontFiles = (await walkFiles(fontDirectory))
    .filter((file) => file.endsWith(".ttf"));
  invariant(fontFiles.length === 1,
    `expected one exported IN006 TTF, observed ${fontFiles.length}`);
  const ttfPath = path.join(fontDirectory, fontFiles[0]);
  const parsed = await run(python.invokedPath, [
    parserPath,
    "--swfmill", xmlPath,
    "--ttf", ttfPath,
    "--object-id", String(TARGET_SPRITE_ID),
    "--font-object-id", String(FONT_OBJECT_ID),
  ]);
  invariant(parsed.stderr.trim() === "",
    `IN006 structure parser wrote stderr: ${parsed.stderr}`);
  return JSON.parse(parsed.stdout);
}

export function parseIn006SourcePairs(script) {
  const matches = [...script.matchAll(/arr = new Array\(([^\n]+)\);/g)];
  invariant(matches.length === 2,
    `IN006 quiz pair initialization count changed: ${matches.length}`);
  const arrays = matches.map((match) => JSON.parse(`[${match[1]}]`));
  for (const pairs of arrays) {
    invariant(JSON.stringify(pairs) === JSON.stringify(EXPECTED_SOURCE_PAIRS),
      "IN006 source question pairs changed");
  }
  return arrays[0];
}

export function validateIn006MainScript(script) {
  invariant(sha256(script) ===
    "4810e7cde4e772ad4f36bb07e396d4dd48de98a4b133b0d8c51d9489d31a5e45",
  "IN006 frame-1054 ActionScript body changed");
  const pairs = parseIn006SourcePairs(script);
  const required = [
    "stop();\n_global.quizSection = true;",
    "rnd = random(arr.length);",
    "if(temp == rnd)",
    "_loc1_.sp = arr[rnd].split(\"~\");",
    "txtQuestion.text = _loc1_.sp[0] + \" to \" + _loc1_.sp[1];",
    "_loc1_.movement = 16 + Number(_loc1_.sp[0]);",
    "xy = _loc1_.movement;",
    "vx = -370.9;",
    "vy = 39.1;",
    "diff = 22.5;",
    "_global.vxs = vx - 5;",
    "while(i < 16)",
    "numbering.duplicateMovieClip(\"numbering_\" + j,j + 3999);",
    "eval(\"numbering_\" + j).txt.text = i;",
    "dornd();",
  ];
  for (const statement of required) {
    invariant(script.includes(statement),
      `IN006 source contract statement changed: ${statement}`);
  }
  invariant((script.match(/\brandom\s*\(/g) ?? []).length === 2,
    "IN006 question random call count changed");
  invariant(!script.includes("arr.splice"),
    "IN006 question array unexpectedly became without-replacement");
  return {
    normalizedBytes: Buffer.byteLength(script),
    normalizedSha256: sha256(script),
    pairs,
    randomCallCount: 2,
    conditionalSingleRedraw: true,
    removesSelectedPair: false,
    stopAtEntry: true,
    initialMovementOffset: 16,
    numberLine: {
      minimum: -15,
      maximum: 15,
      labelCount: 31,
      vxInitial: -370.9,
      vy: 39.1,
      spacing: 22.5,
      dropOriginX: -375.9,
    },
  };
}

function exactScript(scripts, file) {
  const body = scripts.get(file);
  invariant(typeof body === "string", `missing exact IN006 script: ${file}`);
  return body;
}

function validateDragContract(scripts) {
  const scriptsUsed = [];
  for (const clip of DRAG_CLIPS) {
    const prefix = `DefineSprite_151/frame_1054/PlaceObject2_${clip.objectId}_`;
    const matching = [...scripts.entries()].filter(([file]) =>
      file.startsWith(prefix));
    invariant(matching.length === 3,
      `${clip.name} exact clip-event script count changed`);
    const press = matching.find(([file]) => file.endsWith("on(press).as"));
    const release = matching.find(([file]) =>
      file.endsWith("on(releaseOutside,release).as"));
    const load = matching.find(([file]) => file.endsWith("onClipEvent(load).as"));
    invariant(press && release && load, `${clip.name} clip events changed`);
    invariant(press[1].includes("this.startDrag();") &&
      press[1].includes("this.duplicateMovieClip(\"Mc_\""),
    `${clip.name} drag-start contract changed`);
    invariant(load[1].includes("ox = _X;") && load[1].includes("oy = _Y;"),
      `${clip.name} origin capture changed`);
    invariant(release[1].includes("this.stopDrag();") &&
      release[1].includes("if(eval(_droptarget) == _parent.mctarget)") &&
      release[1].includes(`_global.movement -= ${clip.magnitude};`) &&
      release[1].includes(`_global.movement += ${clip.magnitude};`) &&
      release[1].includes("_global.selectedmc = this._name;") &&
      release[1].includes("_parent.txtAnswer.text =") &&
      release[1].includes("Correct_FB.gotoAndPlay(2)"),
    `${clip.name} drop/equation/correctness contract changed`);

    const childFrameTwo = exactScript(scripts,
      `DefineSprite_${clip.objectId}/frame_2/DoAction.as`);
    const childFrameThree = exactScript(scripts,
      `DefineSprite_${clip.objectId}/frame_3/DoAction.as`);
    invariant(childFrameTwo.includes(`_global.movement -= ${clip.magnitude * 2};`) &&
      childFrameThree.includes(`_global.movement += ${clip.magnitude * 2};`),
    `${clip.name} direction-flip delta changed`);
    scriptsUsed.push(...matching, [
      `DefineSprite_${clip.objectId}/frame_2/DoAction.as`, childFrameTwo,
    ], [
      `DefineSprite_${clip.objectId}/frame_3/DoAction.as`, childFrameThree,
    ]);
  }
  const arrow = [...scripts.entries()].find(([file]) =>
    file.startsWith("DefineSprite_151/frame_1054/PlaceObject2_142_") &&
    file.endsWith("on(release).as"));
  invariant(arrow && arrow[1].includes("_global.selectedmc") &&
    arrow[1].includes("gotoAndStop(3);") &&
    arrow[1].includes("gotoAndStop(1);") &&
    arrow[1].includes("gotoAndStop(2);"),
  "IN006 arrow direction contract changed");
  scriptsUsed.push(arrow);
  return scriptsUsed;
}

function validateStructure(structure) {
  const sprite = structure?.targetSprite;
  invariant(structure?.schemaVersion === 1 &&
    structure.parser === "python-xml.etree.ElementTree+fontTools.ttLib" &&
    sprite?.objectId === TARGET_SPRITE_ID &&
    sprite.declaredFrameCount === 1057 &&
    sprite.observedShowFrameCount === 1057 &&
    sprite.entryFrame === ENTRY_FRAME &&
    JSON.stringify(sprite.actionFrames) === JSON.stringify([1, ENTRY_FRAME]) &&
    JSON.stringify(sprite.stopFrameCandidates) === JSON.stringify([ENTRY_FRAME]),
  "IN006 terminal quiz timeline identity changed");
  const entryCounts = Object.groupBy(sprite.entryTagSequence, (tag) => tag);
  invariant(entryCounts.RemoveObject2?.length === 71 &&
    entryCounts.DoAction?.length === 1 &&
    entryCounts.PlaceObject2?.length === 43 &&
    entryCounts.SoundStreamBlock?.length === 1 &&
    entryCounts.ShowFrame?.length === 1,
  "IN006 frame-1054 tag sequence changed");
  invariant(JSON.stringify(sprite.postStopFrames) === JSON.stringify([
    {frame: 1055, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
    {frame: 1056, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
    {frame: 1057, tagSequence: ["SoundStreamBlock", "ShowFrame"]},
  ]), "IN006 post-stop frame structure changed");
  invariant(sprite.numberingTemplate?.objectId === 15 &&
    sprite.numberingTemplate.name === "numbering" &&
    sprite.numberingTemplate.depth === 11 &&
    sprite.numberingTemplate.transform?.transX === -11212 &&
    sprite.numberingTemplate.transform?.transY === 549,
  "IN006 numbering template placement changed");
  const expectedPlacements = new Map([
    ["Mc1", [125, -3016, 2327]],
    ["Mc2", [130, -2206, 2363]],
    ["Mc3", [133, -931, 2355]],
    ["Mc4", [122, 1279, 2301]],
    ["mctarget", [135, -132, -560]],
    ["ButtonNew", [138, -3469, 3555]],
    ["txtQuestion", [139, -6701, -1606]],
    ["txtAnswer", [140, 2499, -1606]],
    ["arrowdirection", [142, -912, 2959]],
    ["Coach_audio_1", [144, -14427, -194]],
    ["Coach_audio_2", [146, -14461, 486]],
    ["Correct_FB", [150, 253, 991]],
  ]);
  for (const [name, [objectId, transX, transY]] of expectedPlacements) {
    const placement = sprite.entryPlacements.find((item) => item.name === name);
    invariant(placement?.objectId === objectId &&
      placement.transform?.transX === transX &&
      placement.transform?.transY === transY,
    `IN006 ${name} placement changed`);
  }
  invariant(sprite.entryPlacements.filter((item) =>
    /^McNum_\d+$/.test(item.name ?? "")).length === 30,
  "IN006 hidden authored number-placeholder count changed");

  const text = structure.dynamicText;
  invariant(text?.numberLabel?.objectId === 14 &&
    text.numberLabel.fontRef === 3 && text.numberLabel.fontHeightTwips === 280 &&
    text.numberLabel.align === 2 &&
    text.question?.objectId === 139 && text.question.fontRef === 3 &&
    text.question.fontHeightTwips === 400 && text.question.align === 2 &&
    text.answer?.objectId === 140 && text.answer.fontRef === 3 &&
    text.answer.fontHeightTwips === 400 && text.answer.align === 0,
  "IN006 dynamic text contract changed");
  invariant(structure.font?.objectId === FONT_OBJECT_ID &&
    structure.font.name === "Bauhaus Md BT" &&
    structure.font.glyphCount === 47 &&
    structure.font.ttfBytes === 11164 &&
    structure.font.ttfSha256 ===
      "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee" &&
    structure.font.unitsPerEm === 1024 && structure.font.ascent === 730 &&
    structure.font.descent === -242,
  "IN006 embedded Bauhaus font export changed");
  invariant(structure.authorityBoundary?.actionScriptExecuted === false &&
    structure.authorityBoundary.naturalRuntimeEstablished === false &&
    structure.authorityBoundary.visualParityEstablished === false &&
    structure.authorityBoundary.audioEstablished === false &&
    structure.authorityBoundary.acceptanceEffect === "none",
  "IN006 structure parser authority boundary changed");
  return structure;
}

function placementByName(structure, name) {
  const placement = structure.targetSprite.entryPlacements.find((item) =>
    item.name === name);
  invariant(placement, `IN006 placement missing: ${name}`);
  return placement;
}

function twipsToPixels(value) {
  return value / 20;
}

function round(value) {
  return Math.round(value * 100_000) / 100_000;
}

export function buildIn006OverlayContract({scriptContract, structure,
  rootPlacementPixels}) {
  const question = placementByName(structure, "txtQuestion");
  const answer = placementByName(structure, "txtAnswer");
  const font = structure.font;
  const questionDefinition = structure.dynamicText.question;
  const answerDefinition = structure.dynamicText.answer;
  const labelDefinition = structure.dynamicText.numberLabel;
  const questionPlacement = {
    x: round(rootPlacementPixels.x + twipsToPixels(question.transform.transX)),
    y: round(rootPlacementPixels.y + twipsToPixels(question.transform.transY)),
  };
  const answerPlacement = {
    x: round(rootPlacementPixels.x + twipsToPixels(answer.transform.transX)),
    y: round(rootPlacementPixels.y + twipsToPixels(answer.transform.transY)),
  };
  const questionSize = twipsToPixels(questionDefinition.fontHeightTwips);
  const labelSize = twipsToPixels(labelDefinition.fontHeightTwips);
  const labelInstanceY = rootPlacementPixels.y + scriptContract.numberLine.vy;
  const labelTextLocalY = twipsToPixels(301);
  return {
    entryFrame: ENTRY_FRAME,
    postStopLastFrame: 1057,
    sourceStopAtEntry: true,
    sequentialPlaybackAfterEntryPermitted: false,
    livePlaybackEndFrame: ENTRY_FRAME,
    frameDomain: "sprite-151",
    sourcePairs: scriptContract.pairs,
    implementationSeedMapping:
      "seed-modulo-eight-for-deterministic-current-javascript-only-not-injected-into-avm1",
    sourceRandomExecuted: false,
    font: {
      functionName: "font3",
      objectId: font.objectId,
      name: font.name,
      unitsPerEm: font.unitsPerEm,
      ascent: font.ascent,
      descent: font.descent,
      advances: font.advances,
      ttfSha256: font.ttfSha256,
    },
    numberLine: {
      minimum: scriptContract.numberLine.minimum,
      maximum: scriptContract.numberLine.maximum,
      labelCount: scriptContract.numberLine.labelCount,
      firstTickX: round(rootPlacementPixels.x +
        scriptContract.numberLine.vxInitial + scriptContract.numberLine.spacing),
      lastTickX: round(rootPlacementPixels.x +
        scriptContract.numberLine.vxInitial +
        scriptContract.numberLine.spacing * scriptContract.numberLine.labelCount),
      tickY: round(labelInstanceY),
      tickLength: round(twipsToPixels(199)),
      tickWidth: round(twipsToPixels(40)),
      tickColor: "#0000cc",
      spacing: scriptContract.numberLine.spacing,
      labelFontSize: labelSize,
      labelColor: "#890101",
      labelBaselineY: round(labelInstanceY + labelTextLocalY +
        twipsToPixels(-40) + labelSize * font.ascent / font.unitsPerEm),
      dropFirstX: round(rootPlacementPixels.x +
        scriptContract.numberLine.dropOriginX + scriptContract.numberLine.spacing),
      dropLastX: round(rootPlacementPixels.x +
        scriptContract.numberLine.dropOriginX +
        scriptContract.numberLine.spacing * scriptContract.numberLine.labelCount),
    },
    questionText: {
      placement: questionPlacement,
      box: {
        left: round(questionPlacement.x +
          twipsToPixels(questionDefinition.boundsTwips.left)),
        right: round(questionPlacement.x +
          twipsToPixels(questionDefinition.boundsTwips.right)),
        top: round(questionPlacement.y +
          twipsToPixels(questionDefinition.boundsTwips.top)),
        bottom: round(questionPlacement.y +
          twipsToPixels(questionDefinition.boundsTwips.bottom)),
      },
      align: "center",
      fontSize: questionSize,
      color: "#000000",
      baselineY: round(questionPlacement.y +
        twipsToPixels(questionDefinition.boundsTwips.top) +
        twipsToPixels(40) + questionSize * font.ascent / font.unitsPerEm),
    },
    answerText: {
      placement: answerPlacement,
      box: {
        left: round(answerPlacement.x +
          twipsToPixels(answerDefinition.boundsTwips.left)),
        right: round(answerPlacement.x +
          twipsToPixels(answerDefinition.boundsTwips.right)),
        top: round(answerPlacement.y +
          twipsToPixels(answerDefinition.boundsTwips.top)),
        bottom: round(answerPlacement.y +
          twipsToPixels(answerDefinition.boundsTwips.bottom)),
      },
      align: "left",
      fontSize: twipsToPixels(answerDefinition.fontHeightTwips),
      color: "#000000",
      initialText: "",
    },
  };
}

export function validateIn006SourceLocalInputs({spec, sourceAudit, sourceFacts,
  scripts, structure}) {
  invariant(spec.animationId === ANIMATION_ID &&
    spec.timeline?.local?.frameDomain === "sprite-151" &&
    spec.timeline.local.frameCount === 1057 &&
    spec.ffdec?.targetSpriteObjectId === TARGET_SPRITE_ID,
  "IN006 candidate target timeline changed");
  invariant(sourceAudit.artifactType === "g4-l3-workspace-source-audit" &&
    sourceAudit.identity?.animationId === ANIMATION_ID &&
    sourceAudit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256 &&
    sourceAudit.machineFindings?.runtime?.structureFingerprintSha256 ===
      sourceFacts.structureFingerprintSha256,
  "IN006 source audit identity or structure changed");
  const random = sourceAudit.machineFindings?.scripts?.random;
  invariant(random?.occurrences === 3 && random.files?.length === 2 &&
    random.files.some((file) =>
      file.path === "DefineSprite_151/frame_1054/DoAction.as" &&
      file.occurrences === 2) &&
    sourceAudit.machineFindings?.scripts?.externalApiCandidates?.length === 0,
  "IN006 random or external-call source inventory changed");
  const domain = sourceFacts.frameDomains?.domains?.find((item) =>
    item.domainId === "sprite-151");
  invariant(domain?.declaredFrameCount === 1057 &&
    domain.observedShowFrameCount === 1057 &&
    domain.staticallyRootReachable === true,
  "IN006 source frame domain changed");

  const mainScript = exactScript(scripts,
    "DefineSprite_151/frame_1054/DoAction.as");
  const scriptContract = validateIn006MainScript(mainScript);
  const dragScripts = validateDragContract(scripts);
  const clearButton = exactScript(scripts,
    "DefineButton2_120/BUTTONCONDACTION on(release).as");
  const newButton = exactScript(scripts,
    "DefineButton2_138/BUTTONCONDACTION on(release).as");
  invariant(clearButton.trim() === "on(release){\n   clearfun();\n}" &&
    newButton.includes("dornd();") &&
    newButton.includes("ButtonNew.enabled = false;"),
  "IN006 Clear/New Number button contract changed");
  const validatedStructure = validateStructure(structure);
  const exactEntries = [
    ["DefineSprite_151/frame_1054/DoAction.as", mainScript],
    ["DefineButton2_120/BUTTONCONDACTION on(release).as", clearButton],
    ["DefineButton2_138/BUTTONCONDACTION on(release).as", newButton],
    ...dragScripts,
  ];
  const uniqueEntries = [...new Map(exactEntries).entries()];
  return {
    scriptContract,
    structure: validatedStructure,
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
    exactSourceScripts: uniqueEntries.map(([file, body]) => ({
      file,
      normalizedBytes: Buffer.byteLength(body),
      normalizedSha256: sha256(body),
    })),
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 IN006 source-local number-line quiz contract\n\n` +
    `- Animation: \`${report.animationId}\`\n` +
    `- Status: \`${report.status}\`\n` +
    `- Main domain: \`${report.initialQuizState.frameDomain}\`, frames 1–1057\n` +
    `- Quiz entry: frame 1054, with a source \`stop()\`\n` +
    `- Source questions: ${report.initialQuizState.sourcePairs.length} ordered start/target pairs\n` +
    `- Number line: ${report.initialQuizState.numberLine.minimum} through ${report.initialQuizState.numberLine.maximum}, ${report.initialQuizState.numberLine.labelCount} generated labels\n\n` +
    `The source initializes the number-line quiz locally at frame 1054. It duplicates 31 tick/label clips, chooses one of eight question pairs with \`random(arr.length)\`, and stops. Frames 1055–1057 contain only audio-stream blocks plus \`ShowFrame\`; they are not naturally reached after the source stop.\n\n` +
    `The current-JavaScript renderer may use the recorded embedded font outlines and metrics to draw the deterministic initial question and number labels. Its capture seed maps to one implementation branch by modulo eight only; that seed is not injected into untouched AVM1 and is not authoritative random-runtime evidence. Drag/drop, direction changes, equation updates, feedback, audio, New Number, Clear, natural runtime, parity, review, and acceptance remain pending.\n`;
}

export async function buildIn006SourceLocalNumberLineContract({
  root = ROOT,
  ffdec = "ffdec",
  swfmill = "swfmill",
  python = "/opt/anaconda3/bin/python3",
} = {}) {
  const [specBinding, generatorBinding, parserBinding] = await Promise.all([
    readBinding(SPEC_PATH, root),
    readBinding(portable(path.relative(root, scriptPath)), root),
    readBinding(PARSER_PATH, root),
  ]);
  const spec = JSON.parse(specBinding.contents);
  const [sourceSwf, sourceFla, sourceAudit, authoringAudit,
    ffdecTool, swfmillTool, pythonTool] = await Promise.all([
    readPinned(spec.source.swf, "IN006 source SWF", root),
    readPinned(spec.source.fla, "IN006 source FLA", root),
    readPinned(spec.evidence.sourceAudit, "IN006 source audit", root),
    readPinned(spec.evidence.authoringAudit, "IN006 authoring audit", root),
    inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec"),
    inspectTool(swfmill, EXPECTED_TOOLS.swfmill, "swfmill"),
    inspectTool(python, EXPECTED_TOOLS.python, "Python"),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-in006-source-local-"));
  try {
    const [scripts, structure] = await Promise.all([
      freshScripts(ffdecTool, projectPath(spec.source.swf.path, root),
        path.join(temporaryRoot, "scripts")),
      freshStructure({
        ffdec: ffdecTool,
        swfmill: swfmillTool,
        python: pythonTool,
        parserPath: projectPath(PARSER_PATH, root),
        sourcePath: projectPath(spec.source.swf.path, root),
        outputRoot: temporaryRoot,
      }),
    ]);
    const sourceFacts = parseSwfSourceFacts(sourceSwf.contents);
    const validated = validateIn006SourceLocalInputs({
      spec,
      sourceAudit: JSON.parse(sourceAudit.contents),
      sourceFacts,
      scripts,
      structure,
    });
    const authoring = JSON.parse(authoringAudit.contents);
    invariant(authoring.evidenceKind === "adobe-animate-authoring-audit" &&
      /without saving/.test(authoring.authority ?? "") &&
      authoring.document?.width === 800 && authoring.document.height === 600 &&
      authoring.document.frameRate === 12,
    "IN006 work-only authoring evidence changed");
    const overlay = buildIn006OverlayContract({
      scriptContract: validated.scriptContract,
      structure: validated.structure,
      rootPlacementPixels: spec.timeline.root.placementPixels,
    });

    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-in006-source-local-number-line-quiz-contract",
      animationId: ANIMATION_ID,
      status:
        "verified-source-local-number-line-quiz-initial-state-and-post-stop-static-frames",
      authorityStatement:
        "Fresh hash-bound SWF structure, exact FFDec-exported AVM1, XML-library-parsed swfmill placements, and the exact exported embedded-font metrics prove the local frame-1054 initial number-line quiz state. They authorize only a deterministic current-JavaScript initial-state drawing candidate and static inspection of the three post-stop frames; they do not prove natural random behavior, interaction, audio, parity, review, or acceptance.",
      generator: withoutContents(generatorBinding),
      parser: withoutContents(parserBinding),
      source: {
        swf: withoutContents(sourceSwf),
        fla: withoutContents(sourceFla),
        sourceAudit: withoutContents(sourceAudit),
        authoringAudit: withoutContents(authoringAudit),
        structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
      },
      toolchain: {
        ffdec: ffdecTool,
        swfmill: swfmillTool,
        python: pythonTool,
      },
      exactSourceScripts: validated.exactSourceScripts,
      sourceContract: {
        questionRandomCallCount: validated.scriptContract.randomCallCount,
        conditionalSingleRedraw: validated.scriptContract.conditionalSingleRedraw,
        removesSelectedPair: validated.scriptContract.removesSelectedPair,
        randomSeedControllableByUntouchedAvm1: false,
        dragClips: DRAG_CLIPS,
        clearButtonCalls: "clearfun",
        newNumberButtonCalls: "dornd",
        arrowTogglesSelectedClipDirection: true,
        correctDropStartsFeedbackAndDisablesControls: true,
      },
      structuralEvidence: {
        domain: validated.domain,
        entryTagSequence: validated.structure.targetSprite.entryTagSequence,
        postStopFrames: validated.structure.targetSprite.postStopFrames,
        numberingTemplate: validated.structure.targetSprite.numberingTemplate,
        dynamicText: validated.structure.dynamicText,
        font: validated.structure.font,
      },
      initialQuizState: overlay,
      unresolved: [
        "No authorized original runtime has captured any naturally selected IN006 question or the frame-1054 initialized display list.",
        "The deterministic implementation seed selects one of the eight source pairs by modulo only; it is not injected into or claimed to reproduce AVM1 random state.",
        "Drag/drop, direction flipping, cumulative equation text, correctness feedback, feedback audio, Clear, New Number, disabled/enabled controls, and complete reset behavior remain unimplemented and unvalidated.",
        "Frames 1055 through 1057 are post-stop static visual inspection frames only and are excluded from natural live playback.",
        "Root/host reachability, companion timelines, five embedded streams, associated Spanish audio, bilingual visuals/audio, Replay, authoritative baseline, full-frame RMSE, product/accessibility QA, fresh human review, owner acceptance, strict completion, and lesson release remain pending.",
      ],
      acceptance: {
        acceptanceNeutral: true,
        implementationAccepted: false,
        authoritativeOriginalRuntimeAccepted: false,
        naturalRuntimeTraceAccepted: false,
        audioAccepted: false,
        behaviorAccepted: false,
        bilingualVisualParityAccepted: false,
        rmseAccepted: false,
        humanVisualReviewAccepted: false,
        ownerAccepted: false,
        strictMigrationComplete: false,
      },
      strictAcceptanceEffect: "none",
    };
    return {
      report,
      json: stableJson(report),
      markdown: renderMarkdown(report),
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

async function emit(relativePath, contents, check, root = ROOT) {
  const absolute = projectPath(relativePath, root);
  if (check) {
    const observed = await readFile(absolute, "utf8");
    invariant(observed === contents, `${relativePath} is stale`);
  } else {
    await writeFile(absolute, contents);
  }
}

function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    swfmill: "swfmill",
    python: "/opt/anaconda3/bin/python3",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--ffdec", "--swfmill", "--python"].includes(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
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
      "node scripts/build-g4-l3-in006-source-local-number-line-contract.mjs " +
      "[--check] [--ffdec <command>] [--swfmill <command>] [--python <command>]\n",
    );
    return;
  }
  const built = await buildIn006SourceLocalNumberLineContract(options);
  await Promise.all([
    emit(OUTPUT_JSON, built.json, options.check),
    emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "frame 1054 source-local initial state; frames 1055-1057 post-stop static only; " +
    "strict acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
