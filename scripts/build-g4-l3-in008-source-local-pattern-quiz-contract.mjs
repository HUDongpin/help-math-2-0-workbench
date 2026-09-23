#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access, lstat, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {parseSwfSourceFacts} from "./build-g4-l3-machine-source-audits.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "course-g04-l03-in-008";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/source-local-pattern-quiz-contract.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/source-local-pattern-quiz-contract.md`;
export const PARSER_PATH =
  "scripts/parse-swfmill-in008-pattern-quiz-contract.py";

const TARGET_SPRITE_ID = 57;
const FONT_OBJECT_ID = 1;
const ENTRY_FRAME = 216;
const SUPPLEMENT = Object.freeze({
  path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN06.swf",
  bytes: 396126,
  sha256: "e303dcdd4dbd48a45625663f8630c546987d1212cb3750cd710da853f25d59ba",
  fontObjectId: 3,
});
const QUESTIONS = Object.freeze([
  Object.freeze({
    label: "10, 5, 0, -5,", answers: "-10~-15",
    feedback: "Each number decreases by 5. Try again!", decrement: 5,
  }),
  Object.freeze({
    label: "18, 9, 0, -9,", answers: "-18~-27",
    feedback: "Each number decreases by 9. Try again!", decrement: 9,
  }),
  Object.freeze({
    label: "7, 5, 3, 1,", answers: "-1~-3",
    feedback: "Each number decreases by 2. Try again!", decrement: 2,
  }),
  Object.freeze({
    label: "0, -10, -20, -30,", answers: "-40~-50",
    feedback: "Each number decreases by 10. Try again!", decrement: 10,
  }),
  Object.freeze({
    label: "16, 12, 8, 4,", answers: "0~-4",
    feedback: "Each number decreases by 4. Try again!", decrement: 4,
  }),
]);

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
      // Continue until the exact executable is found.
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
    run(invokedPath, expected.versionArgs, {timeout: 30_000}),
  ]);
  const output = `${versionResult.stdout}\n${versionResult.stderr}`.trim();
  invariant(output.includes(expected.version), `${label} version changed: ${output}`);
  invariant(sha256(bytes) === expected.executableSha256,
    `${label} executable SHA-256 changed`);
  return {
    command, invokedPath, resolvedPath, executableBytes: bytes.length,
    executableSha256: sha256(bytes), version: expected.version,
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
  return {path: portable(relativePath), bytes: contents.length,
    sha256: sha256(contents), contents};
}

async function readPinned(binding, label, root = ROOT) {
  invariant(binding && typeof binding.path === "string" &&
    Number.isSafeInteger(binding.bytes) && binding.bytes >= 0 &&
    /^[a-f0-9]{64}$/.test(binding.sha256 ?? ""), `${label} binding is invalid`);
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
  const result = await run(ffdec.invokedPath,
    ["-onerror", "abort", "-export", "script", outputRoot, sourcePath]);
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_TOOLS.ffdec.version),
    "fresh FFDec script export version changed");
  const scripts = new Map();
  for (const file of await walkFiles(outputRoot)) {
    if (file.endsWith(".as")) {
      scripts.set(file.replace(/^scripts\//, ""),
        normalizeScript(await readFile(path.join(outputRoot, file), "utf8")));
    }
  }
  return scripts;
}

async function exportOneFont(ffdec, sourcePath, objectId, outputRoot) {
  const result = await run(ffdec.invokedPath, [
    "-onerror", "abort", "-selectid", String(objectId), "-format", "font:ttf",
    "-export", "font", outputRoot, sourcePath,
  ]);
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_TOOLS.ffdec.version),
    `fresh FFDec font-${objectId} export version changed`);
  const fonts = (await walkFiles(outputRoot)).filter((file) => file.endsWith(".ttf"));
  invariant(fonts.length === 1,
    `expected one exported font-${objectId}, observed ${fonts.length}`);
  return path.join(outputRoot, fonts[0]);
}

async function freshStructure({ffdec, swfmill, python, parserPath, sourcePath,
  supplementPath, outputRoot}) {
  const xmlPath = path.join(outputRoot, "L3IN08.xml");
  const conversion = await run(swfmill.invokedPath, ["swf2xml", sourcePath, xmlPath]);
  invariant(!/error/i.test(`${conversion.stdout}\n${conversion.stderr}`),
    "swfmill reported an IN008 parse error");
  const [primaryTtf, supplementTtf] = await Promise.all([
    exportOneFont(ffdec, sourcePath, FONT_OBJECT_ID,
      path.join(outputRoot, "font-primary")),
    exportOneFont(ffdec, supplementPath, SUPPLEMENT.fontObjectId,
      path.join(outputRoot, "font-supplement")),
  ]);
  const parsed = await run(python.invokedPath, [
    parserPath, "--swfmill", xmlPath, "--primary-ttf", primaryTtf,
    "--supplement-ttf", supplementTtf, "--object-id", String(TARGET_SPRITE_ID),
    "--font-object-id", String(FONT_OBJECT_ID),
  ]);
  invariant(parsed.stderr.trim() === "",
    `IN008 structure parser wrote stderr: ${parsed.stderr}`);
  return JSON.parse(parsed.stdout);
}

function exactScript(scripts, file) {
  const body = scripts.get(file);
  invariant(typeof body === "string", `missing exact IN008 script: ${file}`);
  return body;
}

function extractArray(script, name) {
  const marker = `_global.${name} = [`;
  const start = script.lastIndexOf(marker);
  invariant(start >= 0, `${name} source array is missing`);
  const arrayStart = start + marker.length - 1;
  const arrayEnd = script.indexOf("];", arrayStart);
  invariant(arrayEnd >= 0, `${name} source array is unterminated`);
  const result = JSON.parse(script.slice(arrayStart, arrayEnd + 1));
  invariant(Array.isArray(result) && result.every((item) => typeof item === "string"),
    `${name} source array is invalid`);
  return result;
}

export function validateIn008QuizScript(script) {
  invariant(sha256(script) ===
    "67e102691dec2ee138bf22e41a8751a1272cbc9d37fd16af12f93f8c0c3b519c",
  "IN008 frame-216 ActionScript body changed");
  const labels = extractArray(script, "qLableArray");
  const answers = extractArray(script, "qAnsArray");
  const feedback = extractArray(script, "qFeedBackArray");
  invariant(JSON.stringify(labels) === JSON.stringify(QUESTIONS.map((item) => item.label)) &&
    JSON.stringify(answers) === JSON.stringify(QUESTIONS.map((item) => item.answers)) &&
    JSON.stringify(feedback) === JSON.stringify(QUESTIONS.map((item) => item.feedback)),
  "IN008 source quiz arrays changed");
  for (const statement of [
    "stop();\n_global.quizSection = true;",
    "tempQNo = random(_loc1_.qLableArray.length);",
    "txtQuestion.text = _loc1_.question;",
    "_loc1_.qLableArray.splice(tempQNo,1);",
    "_loc1_.qAnsArray.splice(tempQNo,1);",
    "_loc1_.qFeedBackArray.splice(tempQNo,1);",
    "txtAns_1.text = \"\";", "txtAns_2.text = \"\";",
    "Mc_Wrong_Feed._visible = false;", "doGetRandomQuiz();",
  ]) invariant(script.includes(statement),
    `IN008 source quiz statement changed: ${statement}`);
  invariant((script.match(/\brandom\s*\(/g) ?? []).length === 1,
    "IN008 main quiz random call count changed");
  return {labels, answers, feedback, normalizedBytes: Buffer.byteLength(script),
    normalizedSha256: sha256(script)};
}

function validateStructure(structure) {
  const sprite = structure?.targetSprite;
  invariant(structure?.schemaVersion === 1 &&
    structure.parser === "python-xml.etree.ElementTree+fontTools.ttLib" &&
    sprite?.objectId === TARGET_SPRITE_ID && sprite.declaredFrameCount === 217 &&
    sprite.observedShowFrameCount === 217 && sprite.entryFrame === ENTRY_FRAME &&
    JSON.stringify(sprite.actionFrames) === JSON.stringify([1, 216, 217]) &&
    JSON.stringify(sprite.stopFrameCandidates) === JSON.stringify([216, 217]),
  "IN008 terminal quiz timeline identity changed");
  const counts = Object.groupBy(sprite.entryTagSequence, (tag) => tag);
  invariant(counts.RemoveObject2?.length === 16 && counts.FrameLabel?.length === 1 &&
    counts.DoAction?.length === 1 && counts.PlaceObject2?.length === 12 &&
    counts.SoundStreamBlock?.length === 1 && counts.ShowFrame?.length === 1,
  "IN008 frame-216 tag sequence changed");
  invariant(JSON.stringify(sprite.postStopFrames) === JSON.stringify([{
    frame: 217, tagSequence: ["DoAction", "SoundStreamBlock", "ShowFrame"],
  }]), "IN008 frame-217 post-stop structure changed");
  const placements = new Map(sprite.entryPlacements.filter((item) => item.name)
    .map((item) => [`${item.depth}:${item.name}`, item]));
  for (const [key, objectId, x, y] of [
    ["1:ButtonAns", 35, -2751, 2414], ["4:ButtonNew", 37, 2461, 2414],
    ["33:txtQuestion", 38, -4899, -184], ["36:txtAns_1", 39, -710, -148],
    ["37:txtAns_2", 40, 870, -148], ["38:Mc_Wrong_Feed", 52, -263, -1331],
  ]) {
    const item = placements.get(key);
    invariant(item?.objectId === objectId && item.transform?.transX === x &&
      item.transform?.transY === y, `IN008 placement changed: ${key}`);
  }
  const text = structure.dynamicText;
  invariant(text?.question?.fontRef === 1 && text.question.fontHeightTwips === 600 &&
    text.question.align === 1 && text.question.readOnly === true &&
    text.question.useOutlines === false && text.answerOne?.fontRef === 1 &&
    text.answerOne.align === 2 && text.answerOne.hasBorder === true &&
    text.answerTwo?.fontRef === 1 && text.answerTwo.align === 2 &&
    text.answerTwo.hasBorder === true && text.feedback?.fontRef === 1,
  "IN008 dynamic text definitions changed");
  const font = structure.font;
  invariant(font?.objectId === 1 && font.name === "Bauhaus Md BT" &&
    font.swfGlyphCount === 38 && font.unitsPerEm === 1024 && font.ascent === 729 &&
    font.descent === -242 && font.primary?.bytes === 9284 &&
    font.primary.sha256 ===
      "e56576cfc2c17204e624b1478586982ccc037ee8d117a7d169755ec8c0d690d8" &&
    font.sameLessonSupplement?.bytes === 11164 &&
    font.sameLessonSupplement.sha256 === SUPPLEMENT_FONT_SHA256 &&
    font.sameLessonSupplement.sharedGlyphCount === 34 &&
    font.sameLessonSupplement.sharedGlyphsEquivalent === true &&
    font.sameLessonSupplement.sharedGlyphManifestSha256 ===
      "703f20320ef10387222cb15de7a12b034ee6b910222bc7fd5edb96e0836b5add" &&
    JSON.stringify(Object.keys(font.glyphs).sort()) ===
      JSON.stringify([" ", ",", "-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].sort()),
  "IN008 Bauhaus source-glyph recovery changed");
  invariant(structure.authorityBoundary?.actionScriptExecuted === false &&
    structure.authorityBoundary.naturalRuntimeEstablished === false &&
    structure.authorityBoundary.visualParityEstablished === false &&
    structure.authorityBoundary.audioEstablished === false &&
    structure.authorityBoundary.acceptanceEffect === "none",
  "IN008 parser authority boundary changed");
  return structure;
}

const SUPPLEMENT_FONT_SHA256 =
  "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee";

function round(value) {
  return Math.round(value * 100_000) / 100_000;
}

function twips(value) {
  return value / 20;
}

function placement(structure, name) {
  const matches = structure.targetSprite.entryPlacements.filter((item) =>
    item.name === name);
  invariant(matches.length === 1, `expected one IN008 placement named ${name}`);
  return matches[0];
}

export function buildIn008OverlayContract({structure, rootPlacementPixels}) {
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
    postStopLastFrame: 217,
    sourceStopAtEntry: true,
    sequentialPlaybackAfterEntryPermitted: false,
    livePlaybackEndFrame: ENTRY_FRAME,
    frameDomain: "sprite-57",
    sourceQuestions: QUESTIONS,
    implementationSeedMapping:
      "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1",
    sourceRandomExecuted: false,
    removesSelectedQuestion: true,
    initialRemainingQuestionCount: 4,
    font: {
      name: structure.font.name,
      unitsPerEm: structure.font.unitsPerEm,
      ascent: structure.font.ascent,
      descent: structure.font.descent,
      primaryTtfSha256: structure.font.primary.sha256,
      sameLessonSupplementTtfSha256:
        structure.font.sameLessonSupplement.sha256,
      sharedGlyphsEquivalent:
        structure.font.sameLessonSupplement.sharedGlyphsEquivalent,
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
    answerOne: {...answerOne, align: "center", initialText: ""},
    answerTwo: {...answerTwo, align: "center", initialText: ""},
    initiallyHiddenClip: {
      name: "Mc_Wrong_Feed",
      objectId: feedbackPlace.objectId,
      functionName: "sprite52",
      depth: feedbackPlace.depth,
      placement: {
        x: round(rootPlacementPixels.x + twips(feedbackPlace.transform.transX)),
        y: round(rootPlacementPixels.y + twips(feedbackPlace.transform.transY)),
      },
      sourceStatement: "Mc_Wrong_Feed._visible = false;",
    },
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 IN008 source-local pattern quiz contract\n\n` +
    `- Animation: \`${report.animationId}\`\n` +
    `- Status: \`${report.status}\`\n` +
    `- Main domain: \`${report.initialQuizState.frameDomain}\`, frames 1–217\n` +
    `- Quiz entry: frame 216, with a source \`stop()\`\n` +
    `- Source questions: ${report.initialQuizState.sourceQuestions.length}\n\n` +
    `Frame 216 initializes five pattern questions locally, chooses one with \`random(qLableArray.length)\`, removes the selected tuple, populates the question text, and stops. Frame 217 contains a second \`stop()\` plus an audio-stream block and is post-stop static inspection only.\n\n` +
    `The IN008 dynamic field declares device-font rendering and its embedded subset omits some required digits. The current-JavaScript drawing therefore supplements only the missing glyphs from the same lesson's IN006 Bauhaus subset after proving all 34 shared glyph outlines and advances equivalent. This is source-derived current-JavaScript evidence, not an authoritative original-runtime baseline. Inputs, checking, New Problem, reset, feedback, audio, hyperlink behavior, natural random execution, parity, human review, owner acceptance, and strict completion remain pending.\n`;
}

export async function buildIn008SourceLocalPatternQuizContract({
  root = ROOT, ffdec = "ffdec", swfmill = "swfmill",
  python = "/opt/anaconda3/bin/python3",
} = {}) {
  const [specBinding, generatorBinding, parserBinding] = await Promise.all([
    readBinding(SPEC_PATH, root),
    readBinding(portable(path.relative(root, scriptPath)), root),
    readBinding(PARSER_PATH, root),
  ]);
  const spec = JSON.parse(specBinding.contents);
  const [sourceSwf, sourceFla, supplementSwf, sourceAudit, authoringAudit,
    ffdecTool, swfmillTool, pythonTool] = await Promise.all([
    readPinned(spec.source.swf, "IN008 source SWF", root),
    readPinned(spec.source.fla, "IN008 source FLA", root),
    readPinned(SUPPLEMENT, "same-lesson IN006 supplement SWF", root),
    readPinned(spec.evidence.sourceAudit, "IN008 source audit", root),
    readPinned(spec.evidence.authoringAudit, "IN008 authoring audit", root),
    inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec"),
    inspectTool(swfmill, EXPECTED_TOOLS.swfmill, "swfmill"),
    inspectTool(python, EXPECTED_TOOLS.python, "Python"),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-in008-source-local-"));
  try {
    const [scripts, structure] = await Promise.all([
      freshScripts(ffdecTool, projectPath(spec.source.swf.path, root),
        path.join(temporaryRoot, "scripts")),
      freshStructure({
        ffdec: ffdecTool, swfmill: swfmillTool, python: pythonTool,
        parserPath: projectPath(PARSER_PATH, root),
        sourcePath: projectPath(spec.source.swf.path, root),
        supplementPath: projectPath(SUPPLEMENT.path, root), outputRoot: temporaryRoot,
      }),
    ]);
    invariant(spec.animationId === ANIMATION_ID &&
      spec.timeline?.local?.frameDomain === "sprite-57" &&
      spec.timeline.local.frameCount === 217 &&
      spec.ffdec?.targetSpriteObjectId === TARGET_SPRITE_ID,
    "IN008 candidate target timeline changed");
    const sourceFacts = parseSwfSourceFacts(sourceSwf.contents);
    const audit = JSON.parse(sourceAudit.contents);
    invariant(audit.artifactType === "g4-l3-workspace-source-audit" &&
      audit.identity?.animationId === ANIMATION_ID &&
      audit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256 &&
      audit.machineFindings?.runtime?.structureFingerprintSha256 ===
        sourceFacts.structureFingerprintSha256 &&
      audit.machineFindings?.scripts?.random?.occurrences === 2 &&
      audit.machineFindings.scripts.random.files.some((file) =>
        file.path === "DefineSprite_57/frame_216/DoAction.as" &&
        file.occurrences === 1) &&
      audit.machineFindings?.scripts?.externalApiCandidates?.length === 0,
    "IN008 source audit identity or behavior inventory changed");
    const domain = sourceFacts.frameDomains?.domains?.find((item) =>
      item.domainId === "sprite-57");
    invariant(domain?.declaredFrameCount === 217 &&
      domain.observedShowFrameCount === 217 && domain.staticallyRootReachable === true,
    "IN008 source frame domain changed");
    const main = exactScript(scripts, "DefineSprite_57/frame_216/DoAction.as");
    const scriptContract = validateIn008QuizScript(main);
    invariant(exactScript(scripts, "DefineSprite_57/frame_217/DoAction.as") ===
      "stop();\n", "IN008 frame-217 source stop changed");
    const checkButton = exactScript(scripts,
      "DefineButton2_35/BUTTONCONDACTION on(release).as");
    const newButton = exactScript(scripts,
      "DefineButton2_37/BUTTONCONDACTION on(release).as");
    const resetButton = exactScript(scripts,
      "DefineButton2_49/BUTTONCONDACTION on(release).as");
    const hyperlinkButton = exactScript(scripts,
      "DefineButton2_19/BUTTONCONDACTION on(release).as");
    invariant(checkButton.includes("txtAns_1.text == _global.AnswerFirst") &&
      checkButton.includes("txtAns_2.text == _global.AnswerSecond") &&
      checkButton.includes("Coach_audio_2.gotoAndPlay(2);") &&
      checkButton.includes("Coach_audio_1.gotoAndPlay(2);") &&
      checkButton.includes("Mc_Wrong_Feed._visible = true;") &&
      newButton.includes("doGetRandomQuiz();") &&
      resetButton.includes("_parent.ButtonAns.enabled = true;") &&
      resetButton.includes("_parent.ButtonNew.enabled = true;") &&
      hyperlinkButton.includes("_global.KeyAttribute = \"Pattern\";") &&
      hyperlinkButton.includes("_root.DoHyperLinks();"),
    "IN008 button behavior contract changed");
    const allScripts = [...scripts.values()].join("\n");
    invariant(!/\bnextFrame\s*\(/.test(allScripts) &&
      !/gotoAnd(?:Play|Stop)\s*\(\s*217\s*\)/.test(allScripts),
    "IN008 frame 217 acquired a source navigation path");
    const validatedStructure = validateStructure(structure);
    const authoring = JSON.parse(authoringAudit.contents);
    invariant(authoring.evidenceKind === "adobe-animate-authoring-audit" &&
      /without saving/.test(authoring.authority ?? "") &&
      authoring.document?.width === 800 && authoring.document.height === 600 &&
      authoring.document.frameRate === 12,
    "IN008 work-only authoring evidence changed");
    const overlay = buildIn008OverlayContract({
      structure: validatedStructure,
      rootPlacementPixels: spec.timeline.root.placementPixels,
    });
    const sourceScripts = [
      ["DefineSprite_57/frame_216/DoAction.as", main],
      ["DefineSprite_57/frame_217/DoAction.as",
        exactScript(scripts, "DefineSprite_57/frame_217/DoAction.as")],
      ["DefineButton2_35/BUTTONCONDACTION on(release).as", checkButton],
      ["DefineButton2_37/BUTTONCONDACTION on(release).as", newButton],
      ["DefineButton2_49/BUTTONCONDACTION on(release).as", resetButton],
      ["DefineButton2_19/BUTTONCONDACTION on(release).as", hyperlinkButton],
    ].map(([file, body]) => ({file, normalizedBytes: Buffer.byteLength(body),
      normalizedSha256: sha256(body)}));
    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-in008-source-local-pattern-quiz-contract",
      animationId: ANIMATION_ID,
      status:
        "verified-source-local-pattern-quiz-initial-state-and-post-stop-static-frame",
      authorityStatement:
        "Fresh hash-bound SWF structure, exact FFDec-exported AVM1, swfmill placements, and cross-subset-equivalent same-lesson Bauhaus glyphs prove the frame-216 initial pattern-quiz drawing state. They authorize only a deterministic current-JavaScript initial-state drawing and frame-217 post-stop static inspection; they do not establish original runtime behavior, interaction, audio, parity, review, or acceptance.",
      generator: withoutContents(generatorBinding),
      parser: withoutContents(parserBinding),
      source: {
        swf: withoutContents(sourceSwf), fla: withoutContents(sourceFla),
        sourceAudit: withoutContents(sourceAudit),
        authoringAudit: withoutContents(authoringAudit),
        structureFingerprintSha256: sourceFacts.structureFingerprintSha256,
        sameLessonGlyphSupplement: {
          swf: withoutContents(supplementSwf), fontObjectId: SUPPLEMENT.fontObjectId,
          ttfSha256: SUPPLEMENT_FONT_SHA256,
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
        "No authorized original runtime has captured a naturally selected IN008 question or the frame-216 initialized display list.",
        "The deterministic implementation seed selects one source tuple by modulo five; it is not injected into or claimed to reproduce AVM1 random state.",
        "Input, answer checking, New Problem, reset, correct/incorrect feedback, feedback visibility, and hyperlink behavior remain disabled and unvalidated.",
        "Frame 217 is post-stop static inspection only and is excluded from natural live playback.",
        "Four embedded streams, associated Spanish audio, bilingual behavior, root/host reachability, companion timelines, Replay, authoritative baseline, RMSE, product/accessibility QA, fresh human review, owner acceptance, strict completion, and lesson release remain pending.",
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
    return {report, json: stableJson(report), markdown: renderMarkdown(report)};
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

// Shared, read-only helpers for the narrowly related TI005 pattern-quiz audit.
// Keeping these exact implementations in one place preserves the same path,
// hash, toolchain, and temporary-workspace safety checks without weakening the
// animation-specific evidence validators above.
export const PATTERN_QUIZ_BUILD_SUPPORT = Object.freeze({
  EXPECTED_TOOLS,
  ROOT,
  emit,
  exactScript,
  exportOneFont,
  extractArray,
  freshScripts,
  inspectTool,
  invariant,
  normalizeScript,
  portable,
  projectPath,
  readBinding,
  readPinned,
  run,
  sha256,
  stableJson,
  withoutContents,
});

async function emit(relativePath, contents, check, root = ROOT) {
  const absolute = projectPath(relativePath, root);
  if (check) {
    invariant(await readFile(absolute, "utf8") === contents,
      `${relativePath} is stale`);
  } else await writeFile(absolute, contents);
}

function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", swfmill: "swfmill",
    python: "/opt/anaconda3/bin/python3"};
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
      "node scripts/build-g4-l3-in008-source-local-pattern-quiz-contract.mjs " +
      "[--check] [--ffdec <command>] [--swfmill <command>] [--python <command>]\n");
    return;
  }
  const built = await buildIn008SourceLocalPatternQuizContract(options);
  await Promise.all([
    emit(OUTPUT_JSON, built.json, options.check),
    emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "frame 216 source-local initial state; frame 217 post-stop static only; " +
    "strict acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
