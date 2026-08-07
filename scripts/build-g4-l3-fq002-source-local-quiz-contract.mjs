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

export const ANIMATION_ID = "course-g04-l03-fq-002";
export const SPEC_PATH =
  `migrations/${ANIMATION_ID}/audit/source-static-current-js-candidate-spec.json`;
export const OUTPUT_JSON =
  `migrations/${ANIMATION_ID}/audit/source-local-quiz-contract.json`;
export const OUTPUT_MARKDOWN =
  `migrations/${ANIMATION_ID}/audit/source-local-quiz-contract.md`;
export const PARSER_PATH = "scripts/parse-swfmill-fq002-quiz-contract.py";

const REVIEW_SWF = Object.freeze({
  path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/" +
    "ELMGR4/L3/FQ/Review/L3FQ02.swf",
  bytes: 41347,
  sha256: "fca2d26467092deeabd15a8f22f8ad2f779dcc0c16f946bb20181d268aaf33bb",
});

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

const ACTIVE_SPRITE_ID = 899;
const REVIEW_SPRITE_ID = 851;
const FRAME_ONE_NORMALIZED_SHA256 =
  "a0e82ee0bfc81a5d73b76717c494f96d77a2ae0f97c0aa1f828fccba99ce08a8";
const EXPECTED_ANSWERS = Object.freeze([
  "A1Opt3", "A2Opt3", "A3Opt3", "A4Opt1", "A5Opt1",
  "A6Opt2", "A7Opt1", "A8Opt2", "A9Opt1", "A10Opt2",
  "A11Opt1", "A12Opt2", "A13Opt3", "A14Opt1", "A15Opt4",
  "A16Opt1", "A17Opt3", "A18Opt3", "A19Opt2", "A20Opt3",
  "A21Opt4", "A22Opt1", "A23Opt1", "A24Opt1", "A25Opt2",
]);
const EXPECTED_QUESTION_LABELS = Object.freeze(
  Array.from({length: 25}, (_, index) => `Q${index + 1}`),
);
const EXPECTED_REVIEW_LABELS = Object.freeze(
  Array.from({length: 25}, (_, index) => `R${index + 1}`),
);

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
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
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

async function freshBranchTimeline({python, swfmill, parserPath, sourcePath,
  objectId, outputRoot}) {
  const xmlPath = path.join(outputRoot, `sprite-${objectId}.xml`);
  const conversion = await run(swfmill.invokedPath,
    ["swf2xml", sourcePath, xmlPath]);
  const conversionOutput = `${conversion.stdout}\n${conversion.stderr}`.trim();
  invariant(!/error/i.test(conversionOutput),
    `swfmill reported an error: ${conversionOutput}`);
  const parsed = await run(python.invokedPath, [
    parserPath,
    "--swfmill", xmlPath,
    "--object-id", String(objectId),
  ]);
  invariant(parsed.stderr.trim() === "", `quiz parser wrote stderr: ${parsed.stderr}`);
  return JSON.parse(parsed.stdout);
}

function exactDomain(sourceFacts, domainId) {
  const domain = sourceFacts.frameDomains?.domains?.find((item) =>
    item.domainId === domainId);
  invariant(domain, `${domainId} is missing from the SWF structure`);
  return domain;
}

function extractAssignmentArray(script, name) {
  const marker = `_global.${name} = [`;
  const start = script.lastIndexOf(marker);
  invariant(start >= 0, `${name} array assignment is missing`);
  const arrayStart = start + marker.length - 1;
  const arrayEnd = script.indexOf("];", arrayStart);
  invariant(arrayEnd >= 0, `${name} array assignment is unterminated`);
  const value = JSON.parse(script.slice(arrayStart, arrayEnd + 1));
  invariant(Array.isArray(value) && value.every((entry) => typeof entry === "string"),
    `${name} must be a string array`);
  return value;
}

export function expectedFq002BranchLabels() {
  return [
    {frame: 1, label: "FirstSection"},
    ...EXPECTED_QUESTION_LABELS.map((label, index) => ({frame: index + 2, label})),
    {frame: 27, label: "Review"},
    ...EXPECTED_REVIEW_LABELS.map((label, index) => ({frame: index + 44, label})),
  ];
}

export function validateFq002ScriptContract(script) {
  invariant(sha256(script) === FRAME_ONE_NORMALIZED_SHA256,
    "FQ002 frame-1 ActionScript body changed");
  const answers = extractAssignmentArray(script, "arrayAnswer");
  const questionLabels = extractAssignmentArray(script, "quizLabelArray");
  const reviewLabels = extractAssignmentArray(script, "revLabelArray");
  invariant(JSON.stringify(answers) === JSON.stringify(EXPECTED_ANSWERS),
    "FQ002 correct-answer array changed");
  invariant(JSON.stringify(questionLabels) === JSON.stringify(EXPECTED_QUESTION_LABELS),
    "FQ002 question-label array changed");
  invariant(JSON.stringify(reviewLabels) === JSON.stringify(EXPECTED_REVIEW_LABELS),
    "FQ002 review-label array changed");

  const required = [
    "_global.totQuizCount = 0;",
    "_global.reviewCount = 0;",
    "_global.arrayResponseAnswer = new Array();",
    "_global.arrayReview = new Array();",
    "_global.totalQuestionsCount = 10;",
    "_global.tempQNo = random(_global.quizLabelArray.length);",
    "_global.qLabelName = _global.quizLabelArray[_global.tempQNo];",
    "_global.arrayReview.push(_global.revLabelArray[_global.tempQNo]);",
    "_global.quizLabelArray.splice(_global.tempQNo,1);",
    "_global.revLabelArray.splice(_global.tempQNo,1);",
    "gotoAndStop(_global.qLabelName);",
    "if(_global.reviewCount > parseInt(_global.totalQuestionsCount))",
    "getURL(strURL,\"\");",
  ];
  for (const statement of required) {
    invariant(script.includes(statement),
      `FQ002 source contract statement changed: ${statement}`);
  }
  invariant((script.match(/\brandom\s*\(/g) ?? []).length === 1,
    "FQ002 random call count changed");
  invariant((script.match(/\bgetURL\s*\(/g) ?? []).length === 1,
    "FQ002 sprite getURL call count changed");
  const initializationStart = script.lastIndexOf("Mc_Result._visible = false;");
  invariant(initializationStart >= 0, "FQ002 initialization block is missing");
  const initialization = script.slice(initializationStart);
  invariant(!initialization.includes("_root."),
    "FQ002 initial selection acquired a host dependency");
  invariant(initialization.trimEnd().endsWith("doGetRandomQuiz();"),
    "FQ002 no longer starts its first random question locally");
  return {
    normalizedBytes: Buffer.byteLength(script),
    normalizedSha256: sha256(script),
    answers,
    questionLabels,
    reviewLabels,
    totalQuestionsSelected: 10,
    randomSelectionWithoutReplacement: true,
    questionReviewPairingUsesSameRandomIndex: true,
    initialSelectionReadsHostState: false,
    terminalReviewPathUsesHostState: true,
  };
}

export function validateFq002BranchTimeline(timeline, objectId) {
  invariant(timeline?.schemaVersion === 1 &&
    timeline.parser === "python-xml.etree.ElementTree" &&
    timeline.targetSprite?.objectId === objectId &&
    timeline.targetSprite.declaredFrameCount === 68 &&
    timeline.targetSprite.observedShowFrameCount === 68,
  `FQ002 sprite-${objectId} timeline identity changed`);
  invariant(JSON.stringify(timeline.targetSprite.labels) ===
    JSON.stringify(expectedFq002BranchLabels()),
  `FQ002 sprite-${objectId} frame-label atlas changed`);
  invariant(JSON.stringify(timeline.targetSprite.actionFrames) ===
    JSON.stringify([1, 27, 43]),
  `FQ002 sprite-${objectId} ActionScript frames changed`);
  invariant(timeline.targetSprite.tagCounts.FrameLabel === 52 &&
    timeline.targetSprite.tagCounts.DoAction === 3 &&
    timeline.targetSprite.tagCounts.ShowFrame === 68 &&
    timeline.targetSprite.tagCounts.End === 1,
  `FQ002 sprite-${objectId} timeline tag counts changed`);
  invariant(timeline.authorityBoundary?.actionScriptExecuted === false &&
    timeline.authorityBoundary.naturalRuntimeEstablished === false &&
    timeline.authorityBoundary.visualParityEstablished === false &&
    timeline.authorityBoundary.audioEstablished === false &&
    timeline.authorityBoundary.acceptanceEffect === "none",
  `FQ002 sprite-${objectId} parser authority boundary changed`);
  return timeline.targetSprite;
}

function projectDomain(domain) {
  return {
    domainId: domain.domainId,
    declaredFrameCount: domain.declaredFrameCount,
    observedShowFrameCount: domain.observedShowFrameCount,
    staticallyRootReachable: domain.staticallyRootReachable,
    parentDomainIds: domain.parentDomainIds,
    tagCounts: domain.tagCounts,
    scriptTagCount: domain.scriptTagCount,
    domainFingerprintSha256: domain.domainFingerprintSha256,
  };
}

export function validateFq002SourceLocalQuizInputs({
  spec,
  sourceAudit,
  activeFacts,
  reviewFacts,
  activeScripts,
  reviewScripts,
  activeTimeline,
  reviewTimeline,
}) {
  invariant(spec.animationId === ANIMATION_ID &&
    spec.timeline?.local?.frameDomain === "sprite-899" &&
    spec.timeline.local.frameCount === 68 &&
    spec.ffdec?.targetSpriteObjectId === ACTIVE_SPRITE_ID,
  "FQ002 candidate target timeline changed");
  invariant(sourceAudit.artifactType === "g4-l3-workspace-source-audit" &&
    sourceAudit.identity?.animationId === ANIMATION_ID &&
    sourceAudit.provenance?.source?.swf?.sha256 === spec.source.swf.sha256 &&
    sourceAudit.machineFindings?.runtime?.structureFingerprintSha256 ===
      activeFacts.structureFingerprintSha256,
  "FQ002 source audit identity or structure changed");
  const random = sourceAudit.machineFindings?.scripts?.random;
  const external = sourceAudit.machineFindings?.scripts?.externalApiCandidates;
  invariant(random?.occurrences === 1 && random.files?.length === 1 &&
    random.files[0].path === "DefineSprite_899/frame_1/DoAction.as" &&
    external?.length === 1 && external[0].id === "getURL" &&
    external[0].occurrences === 2 &&
    JSON.stringify(external[0].files.map(({path: file, occurrences}) =>
      ({file, occurrences}))) === JSON.stringify([
      {file: "DefineButton2_12/BUTTONCONDACTION on(release).as", occurrences: 1},
      {file: "DefineSprite_899/frame_1/DoAction.as", occurrences: 1},
    ]),
  "FQ002 random or external-call source inventory changed");

  const activeFrameOne = activeScripts.get(
    "DefineSprite_899/frame_1/DoAction.as",
  );
  const reviewFrameOne = reviewScripts.get(
    "DefineSprite_851/frame_1/DoAction.as",
  );
  invariant(activeFrameOne && reviewFrameOne && activeFrameOne === reviewFrameOne,
    "active and Review FQ002 frame-1 scripts differ");
  invariant(activeScripts.get("DefineSprite_899/frame_27/DoAction.as") ===
    "_global.quizSection = false;" &&
    reviewScripts.get("DefineSprite_851/frame_27/DoAction.as") ===
      "_global.quizSection = false;" &&
    activeScripts.get("DefineSprite_899/frame_43/DoAction.as") === "stop();" &&
    reviewScripts.get("DefineSprite_851/frame_43/DoAction.as") === "stop();",
  "active and Review FQ002 transition scripts changed");
  const scriptContract = validateFq002ScriptContract(activeFrameOne);

  const activeDomain = exactDomain(activeFacts, "sprite-899");
  const reviewDomain = exactDomain(reviewFacts, "sprite-851");
  for (const domain of [activeDomain, reviewDomain]) {
    invariant(domain.declaredFrameCount === 68 &&
      domain.observedShowFrameCount === 68 &&
      domain.scriptTagCount === 3 &&
      domain.tagCounts.FrameLabel === 52,
    `${domain.domainId} source branch domain changed`);
  }
  const activeBranch = validateFq002BranchTimeline(activeTimeline, ACTIVE_SPRITE_ID);
  const reviewBranch = validateFq002BranchTimeline(reviewTimeline, REVIEW_SPRITE_ID);
  invariant(JSON.stringify(activeBranch.labels) === JSON.stringify(reviewBranch.labels) &&
    JSON.stringify(activeBranch.actionFrames) ===
      JSON.stringify(reviewBranch.actionFrames),
  "active and Review FQ002 branch atlases differ");

  return {
    scriptContract,
    activeFrameOne,
    exactSourceScripts: [
      ["active", "DefineSprite_899/frame_1/DoAction.as", activeFrameOne],
      ["active", "DefineSprite_899/frame_27/DoAction.as",
        activeScripts.get("DefineSprite_899/frame_27/DoAction.as")],
      ["active", "DefineSprite_899/frame_43/DoAction.as",
        activeScripts.get("DefineSprite_899/frame_43/DoAction.as")],
      ["review", "DefineSprite_851/frame_1/DoAction.as", reviewFrameOne],
      ["review", "DefineSprite_851/frame_27/DoAction.as",
        reviewScripts.get("DefineSprite_851/frame_27/DoAction.as")],
      ["review", "DefineSprite_851/frame_43/DoAction.as",
        reviewScripts.get("DefineSprite_851/frame_43/DoAction.as")],
    ].map(([source, file, body]) => ({
      source,
      file,
      normalizedBytes: Buffer.byteLength(body),
      normalizedSha256: sha256(body),
    })),
    activeDomain: projectDomain(activeDomain),
    reviewDomain: projectDomain(reviewDomain),
    activeBranch,
    reviewBranch,
  };
}

export function renderMarkdown(report) {
  return `# G4 L3 FQ002 source-local quiz contract\n\n` +
    `- Animation: \`${report.animationId}\`\n` +
    `- Status: \`${report.status}\`\n` +
    `- Active domain: \`${report.branchAtlas.frameDomain}\`, frames 1–68\n` +
    `- Question labels: Q1–Q25 at frames 2–26\n` +
    `- Review transition: frames 27–43; frame 43 is \`stop()\`\n` +
    `- Review labels: R1–R25 at frames 44–68\n` +
    `- Natural contract: choose 10 of 25 questions without replacement, retaining each matching review label.\n\n` +
    `The active SWF initializes the answer, question, review, count, and response arrays inside sprite-899 before calling \`doGetRandomQuiz()\`. Initial question selection is therefore source-local, not host-initialized. Terminal reporting/close behavior, answer interaction, score state, dynamic feedback, audio, and host navigation remain disabled.\n\n` +
    `Frames 1–68 may be inspected only as a static source branch atlas. They are not a natural 1→68 playback sequence; live playback is capped at frame 1. This evidence executes no ActionScript and grants no fidelity, parity, human, owner, or strict acceptance.\n`;
}

export async function buildFq002SourceLocalQuizContract({
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
  const [activeSwf, activeFla, reviewSwf, sourceAudit, authoringAudit,
    ffdecTool, swfmillTool, pythonTool] = await Promise.all([
    readPinned(spec.source.swf, "active source SWF", root),
    readPinned(spec.source.fla, "active source FLA", root),
    readPinned(REVIEW_SWF, "Review source SWF", root),
    readPinned(spec.evidence.sourceAudit, "source audit", root),
    readPinned(spec.evidence.authoringAudit, "authoring audit", root),
    inspectTool(ffdec, EXPECTED_TOOLS.ffdec, "FFDec"),
    inspectTool(swfmill, EXPECTED_TOOLS.swfmill, "swfmill"),
    inspectTool(python, EXPECTED_TOOLS.python, "Python"),
  ]);
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(),
    "help-math-g4-l3-fq002-source-local-"));
  try {
    const [activeScripts, reviewScripts, activeTimeline, reviewTimeline] =
      await Promise.all([
        freshScripts(ffdecTool, projectPath(spec.source.swf.path, root),
          path.join(temporaryRoot, "active-scripts")),
        freshScripts(ffdecTool, projectPath(REVIEW_SWF.path, root),
          path.join(temporaryRoot, "review-scripts")),
        freshBranchTimeline({
          python: pythonTool,
          swfmill: swfmillTool,
          parserPath: projectPath(PARSER_PATH, root),
          sourcePath: projectPath(spec.source.swf.path, root),
          objectId: ACTIVE_SPRITE_ID,
          outputRoot: temporaryRoot,
        }),
        freshBranchTimeline({
          python: pythonTool,
          swfmill: swfmillTool,
          parserPath: projectPath(PARSER_PATH, root),
          sourcePath: projectPath(REVIEW_SWF.path, root),
          objectId: REVIEW_SPRITE_ID,
          outputRoot: temporaryRoot,
        }),
      ]);
    const activeFacts = parseSwfSourceFacts(activeSwf.contents);
    const reviewFacts = parseSwfSourceFacts(reviewSwf.contents);
    const validated = validateFq002SourceLocalQuizInputs({
      spec,
      sourceAudit: JSON.parse(sourceAudit.contents),
      activeFacts,
      reviewFacts,
      activeScripts,
      reviewScripts,
      activeTimeline,
      reviewTimeline,
    });
    const authoring = JSON.parse(authoringAudit.contents);
    invariant(authoring.evidenceKind === "adobe-animate-authoring-audit" &&
      /without saving/.test(authoring.authority ?? "") &&
      authoring.document?.width === 800 && authoring.document.height === 600 &&
      authoring.document.frameRate === 12,
    "FQ002 work-only authoring evidence changed");

    const report = {
      schemaVersion: 1,
      evidenceType: "g4-l3-fq002-source-local-quiz-contract",
      animationId: ANIMATION_ID,
      status: "verified-source-local-random-question-contract-static-branch-atlas-only",
      authorityStatement:
        "Fresh hash-bound active and Review SWF structure, exact FFDec-exported AVM1, and XML-library-parsed swfmill labels prove that the active sprite initializes its quiz arrays and selects ten paired question/review labels without replacement. This permits static branch-atlas drawing inspection only; it does not establish a natural interactive trace, runtime behavior, dynamic answer feedback, audio, parity, or acceptance.",
      generator: withoutContents(generatorBinding),
      parser: withoutContents(parserBinding),
      source: {
        activeSwf: withoutContents(activeSwf),
        activeFla: withoutContents(activeFla),
        reviewSwf: withoutContents(reviewSwf),
        sourceAudit: withoutContents(sourceAudit),
        authoringAudit: withoutContents(authoringAudit),
        activeStructureFingerprintSha256: activeFacts.structureFingerprintSha256,
        reviewStructureFingerprintSha256: reviewFacts.structureFingerprintSha256,
      },
      toolchain: {
        ffdec: ffdecTool,
        swfmill: swfmillTool,
        python: pythonTool,
      },
      exactSourceScripts: validated.exactSourceScripts,
      sourceLocalInitialization: {
        answerCount: validated.scriptContract.answers.length,
        questionLabelCount: validated.scriptContract.questionLabels.length,
        reviewLabelCount: validated.scriptContract.reviewLabels.length,
        totalQuestionsSelected: validated.scriptContract.totalQuestionsSelected,
        randomSelectionWithoutReplacement:
          validated.scriptContract.randomSelectionWithoutReplacement,
        questionReviewPairingUsesSameRandomIndex:
          validated.scriptContract.questionReviewPairingUsesSameRandomIndex,
        initialSelectionReadsHostState:
          validated.scriptContract.initialSelectionReadsHostState,
        terminalReviewPathUsesHostState:
          validated.scriptContract.terminalReviewPathUsesHostState,
        questionLabels: validated.scriptContract.questionLabels,
        reviewLabels: validated.scriptContract.reviewLabels,
        correctAnswers: validated.scriptContract.answers,
      },
      branchAtlas: {
        frameDomain: "sprite-899",
        frameCount: 68,
        firstSection: {firstFrame: 1, lastFrame: 1},
        questions: {firstFrame: 2, lastFrame: 26, labels: "Q1..Q25"},
        reviewTransition: {firstFrame: 27, lastFrame: 43, stopFrame: 43},
        reviews: {firstFrame: 44, lastFrame: 68, labels: "R1..R25"},
        labelCount: validated.activeBranch.labels.length,
        labelManifestSha256: sha256(stableJson(validated.activeBranch.labels)),
        activeDomain: validated.activeDomain,
        reviewDomain: validated.reviewDomain,
        activeAndReviewBranchAtlasesEquivalent: true,
        sourceStaticDrawingFrames: {first: 1, lastInclusive: 68},
        sourceStaticBranchAtlasRenderable: true,
        sequentialPlaybackPermitted: false,
        livePlaybackEndFrame: 1,
        naturalRuntimeTraceEstablished: false,
        dynamicAnswerFeedbackRendered: false,
        scoringBehaviorRendered: false,
        pointerInteractionRendered: false,
        hostNavigationRendered: false,
      },
      unresolved: [
        "No authorized original runtime has executed or captured any random ten-question sequence.",
        "Answer selection, score accumulation, correct/incorrect coloring and text, review navigation, terminal reporting, unload/close behavior, and the separate button getURL remain disabled.",
        "The static branch atlas is not a natural 1-through-68 playback trace; live playback is capped at frame 1.",
        "All shared audio, bilingual behavior, root/host reachability, Replay/reset, authoritative baseline, full-frame RMSE, product/accessibility review, human review of changed output, owner acceptance, and strict completion remain pending.",
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
      validation: {activeFrameOne: validated.activeFrameOne},
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
      "node scripts/build-g4-l3-fq002-source-local-quiz-contract.mjs " +
      "[--check] [--ffdec <command>] [--swfmill <command>] [--python <command>]\n",
    );
    return;
  }
  const built = await buildFq002SourceLocalQuizContract(options);
  await Promise.all([
    emit(OUTPUT_JSON, built.json, options.check),
    emit(OUTPUT_MARKDOWN, built.markdown, options.check),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: ${OUTPUT_JSON}; ` +
    "25 question/review pairs source-local; 68-frame static branch atlas only; " +
    "strict acceptance effect none.\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
