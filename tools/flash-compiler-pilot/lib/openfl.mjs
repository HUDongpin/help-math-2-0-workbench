import {mkdir, readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  ACCEPTANCE_EFFECTS_FALSE,
  PROJECT_ROOT,
  fileIdentity,
  invariant,
  inventoryDirectory,
  portable,
  publicMemberProjection,
  runCommand,
  stableJson,
  writeExclusive,
} from "./core.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const NORMALIZER_PATH = path.resolve(
  MODULE_DIR,
  "../vendor/openfl/normalize-openfl.mjs",
);
const NORMALIZER_SHA256 = "27e4a05c0ce9602cecf4b927cfec7565e2e5a61116455535207ef89abaccbe97";
const SWF_COMMIT = "82b3aa5864030580c74316de30c9cce1fce7f377";
const SWF_RUN_N_SHA256 = "e76fe2ffaf8ef1e2111913704e44ea6a47e951ceb4fdc61815c5075b3777cbbc";
const SWF_LICENSE_SHA256 = "49782ab293716edb1d3ad110b2b870da41e0d97cbfa6ccf1442ae33c22f0ed16";
const EXPECTED_PAYLOAD_HASHES = Object.freeze({
  "course-g03-l01-fq-001": "9c7923c627efa609ea17811596d5895108b4bff9f8de4615a30b2132a78e1294",
  "course-g04-l03-vb-002": "943e7e9c10cbda9c6106ab9d5cef62448b4b6b30a4ce01f9a212df4d342b8d79",
  "course-g04-l10-vb-003": "c28404310262362fc4d385d9b6cf16e3196302c3ad35423922c02cd2b02d3436",
  "course-g05-l04-ir-001-a662633d": "1df1a0724e7e16284052b65da00c3ffaee04b088120dd2ad5a124c7abaf9d30a",
  "course-g05-l05-in-011": "44819b198004f36c0ff268d1e2eea07e1344ba163aab4ae53015d679da8dadaa",
});
const EXPECTED_FONT_WARNINGS = Object.freeze({
  "course-g03-l01-fq-001": 10,
  "course-g04-l03-vb-002": 4,
  "course-g04-l10-vb-003": 6,
  "course-g05-l04-ir-001-a662633d": 4,
  "course-g05-l05-in-011": 2,
});

async function resolveToolchain(toolchainRoot) {
  invariant(toolchainRoot, "OpenFL backend requires --openfl-toolchain <pinned root>");
  const toolchainDir = path.join(toolchainRoot, "toolchain");
  const haxeDirectories = (await readdir(toolchainDir, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("haxe_"))
    .map((entry) => path.join(toolchainDir, entry.name));
  invariant(haxeDirectories.length === 1,
    "OpenFL toolchain must contain exactly one pinned Haxe directory");
  const haxeDir = haxeDirectories[0];
  const nekoDir = path.join(toolchainDir, "neko-2.4.1-osx-arm64");
  const haxelibRoot = path.join(toolchainRoot, "haxelib");
  const repository = path.join(toolchainRoot, "repos/openfl-swf");
  const identities = {
    haxe: await fileIdentity(path.join(haxeDir, "haxe")),
    haxelib: await fileIdentity(path.join(haxeDir, "haxelib")),
    neko: await fileIdentity(path.join(nekoDir, "neko")),
    swfRunN: await fileIdentity(path.join(repository, "run.n")),
    swfLicense: await fileIdentity(path.join(repository, "LICENSE.md")),
  };
  invariant(identities.swfRunN.sha256 === SWF_RUN_N_SHA256,
    "OpenFL SWF run.n does not match pinned build");
  invariant(identities.swfLicense.sha256 === SWF_LICENSE_SHA256,
    "OpenFL SWF license file drifted");
  const env = {
    PATH: `${haxeDir}:${nekoDir}:${process.env.PATH || ""}`,
    HAXELIB_PATH: haxelibRoot,
    NEKOPATH: `${nekoDir}:${path.join(haxelibRoot, "lime/8,3,2/ndll/MacArm64")}`,
  };
  return {
    toolchainRoot,
    haxeDir,
    nekoDir,
    haxelibRoot,
    repository,
    env,
    identities,
  };
}

async function runPreflight({backendRoot, toolchain, projectRoot}) {
  const logRoot = path.join(backendRoot, "tool-logs");
  await mkdir(logRoot, {recursive: true});
  const commands = {};
  const specs = [
    ["haxeVersion", path.join(toolchain.haxeDir, "haxe"), ["--version"]],
    ["nekoVersion", path.join(toolchain.nekoDir, "neko"), ["-version"]],
    ["haxelibVersion", path.join(toolchain.haxeDir, "haxelib"), ["version"]],
    ["haxelibList", path.join(toolchain.haxeDir, "haxelib"), ["list"]],
    ["repositoryCommit", "git", ["-C", toolchain.repository, "rev-parse", "HEAD"]],
  ];
  for (const [label, command, args] of specs) {
    commands[label] = await runCommand({
      command,
      args,
      cwd: projectRoot,
      stdoutPath: path.join(logRoot, `${label}.stdout.txt`),
      stderrPath: path.join(logRoot, `${label}.stderr.txt`),
      timeoutMs: 60_000,
      env: toolchain.env,
    });
    invariant(commands[label].success, `OpenFL toolchain preflight failed: ${label}`);
  }
  const commit = (await readFile(path.join(logRoot, "repositoryCommit.stdout.txt"), "utf8")).trim();
  invariant(commit === SWF_COMMIT, "OpenFL SWF repository commit drifted");
  const haxeVersion = (await readFile(path.join(logRoot, "haxeVersion.stdout.txt"), "utf8")).trim();
  const haxelibList = await readFile(path.join(logRoot, "haxelibList.stdout.txt"), "utf8");
  invariant(haxeVersion === "4.3.7", "OpenFL pilot requires Haxe 4.3.7");
  for (const required of ["format: [3.8.0]", "hxp: [1.3.1]", "lime: [8.3.2]", "openfl: [9.5.2]"]) {
    invariant(haxelibList.includes(required), `OpenFL toolchain missing ${required}`);
  }
  return commands;
}

async function runOne({member, runRoot, toolchain, projectRoot, label}) {
  const memberRoot = path.join(runRoot, member.animationId);
  const archivePath = path.join(memberRoot, `${member.animationId}.zip`);
  const extractedRoot = path.join(memberRoot, "extracted");
  const normalizedPath = path.join(memberRoot, "normalized.json");
  const logRoot = path.join(memberRoot, "logs");
  await Promise.all([
    mkdir(memberRoot, {recursive: true}),
    mkdir(extractedRoot, {recursive: true}),
    mkdir(logRoot, {recursive: true}),
  ]);
  const convert = await runCommand({
    command: path.join(toolchain.haxeDir, "haxelib"),
    args: [
      "run", "swf", "process",
      member.physical.swfPath,
      archivePath,
      "-nocolor", "-verbose",
    ],
    cwd: projectRoot,
    stdoutPath: path.join(logRoot, `${label}-convert.stdout.txt`),
    stderrPath: path.join(logRoot, `${label}-convert.stderr.txt`),
    timeoutMs: 180_000,
    env: toolchain.env,
  });
  invariant(convert.success, `${member.animationId}: OpenFL SWF conversion failed`);
  const unzip = await runCommand({
    command: "unzip",
    args: ["-q", archivePath, "-d", extractedRoot],
    cwd: projectRoot,
    stdoutPath: path.join(logRoot, `${label}-unzip.stdout.txt`),
    stderrPath: path.join(logRoot, `${label}-unzip.stderr.txt`),
    timeoutMs: 60_000,
  });
  invariant(unzip.success, `${member.animationId}: OpenFL archive extraction failed`);
  const normalize = await runCommand({
    command: process.execPath,
    args: [
      NORMALIZER_PATH,
      path.join(extractedRoot, "data.json"),
      path.join(projectRoot, "catalog/animations.json"),
      member.animationId,
      normalizedPath,
    ],
    cwd: projectRoot,
    stdoutPath: path.join(logRoot, `${label}-normalize.stdout.txt`),
    stderrPath: path.join(logRoot, `${label}-normalize.stderr.txt`),
    timeoutMs: 60_000,
  });
  invariant(normalize.success, `${member.animationId}: OpenFL normalization failed`);
  const normalized = JSON.parse(await readFile(normalizedPath, "utf8"));
  invariant(normalized.identity.animationId === member.animationId &&
    normalized.identity.sourceSha256 === member.source.sha256 &&
    normalized.identity.sourcePath === member.source.path &&
    normalized.identity.pageOnly === true && normalized.identity.shell === false,
  `${member.animationId}: normalized OpenFL identity drifted`);
  invariant(normalized.document.stage.width === member.expectedStructure.stageWidth &&
    normalized.document.stage.height === member.expectedStructure.stageHeight &&
    normalized.document.fps === member.expectedStructure.fps &&
    normalized.document.rootFrameCount === member.expectedStructure.rootFrameCount,
  `${member.animationId}: normalized OpenFL document facts drifted`);
  invariant(normalized.audit.scriptSourceCount === 0,
    `${member.animationId}: unexpected OpenFL scriptSource semantics`);
  invariant(normalized.audit.soundLikeFieldCount === 0,
    `${member.animationId}: unexpected OpenFL sound semantics`);
  invariant(normalized.deterministicPayloadSha256 === EXPECTED_PAYLOAD_HASHES[member.animationId],
    `${member.animationId}: normalized OpenFL payload drifted`);
  const sourceLog = await readFile(path.join(logRoot, `${label}-convert.stdout.txt`), "utf8");
  const warningCount = [...sourceLog.matchAll(/excess bytes: 2, Tag: DefineFont2/g)].length;
  invariant(warningCount === EXPECTED_FONT_WARNINGS[member.animationId],
    `${member.animationId}: OpenFL warning count drifted`);
  return {normalized, commands: {convert, unzip, normalize}, warningCount};
}

function countSymbolTypes(symbols) {
  const counts = {};
  for (const symbol of symbols) counts[symbol.type] = (counts[symbol.type] || 0) + 1;
  return counts;
}

function summarizeFramesAndOperations(symbols) {
  const sprites = symbols.filter((symbol) => symbol.type === "sprite");
  const frameDomains = sprites.map((symbol) => ({
    symbolId: symbol.id,
    frameCount: symbol.frames?.length || 0,
  }));
  let operationCount = 0;
  for (const symbol of sprites) {
    for (const frame of symbol.frames || []) operationCount += frame.objects?.length || 0;
  }
  return {
    frameDomains,
    totalSpriteFrames: frameDomains.reduce((sum, item) => sum + item.frameCount, 0),
    maximumNestedFrameCount: Math.max(0, ...frameDomains
      .filter((item) => item.symbolId !== "root")
      .map((item) => item.frameCount)),
    displayListOperationCount: operationCount,
  };
}

export async function buildOpenflBackend({
  corpusValidation,
  outputRoot,
  projectRoot = PROJECT_ROOT,
  toolchainRoot,
}) {
  const backendRoot = path.join(outputRoot, "openfl");
  await mkdir(backendRoot, {recursive: false});
  invariant((await fileIdentity(NORMALIZER_PATH)).sha256 === NORMALIZER_SHA256,
    "OpenFL normalizer changed without updating its frozen identity");
  const toolchain = await resolveToolchain(toolchainRoot);
  const preflightCommands = await runPreflight({backendRoot, toolchain, projectRoot});
  const sourceBefore = new Map();
  for (const member of corpusValidation.members) {
    sourceBefore.set(member.animationId, await fileIdentity(member.physical.swfPath));
  }
  const runARoot = path.join(backendRoot, "run-a");
  const runBRoot = path.join(backendRoot, "run-b");
  await Promise.all([mkdir(runARoot), mkdir(runBRoot)]);
  const runA = [];
  const runB = [];
  for (const member of corpusValidation.members) {
    runA.push(await runOne({member, runRoot: runARoot, toolchain, projectRoot, label: "run-a"}));
    runB.push(await runOne({member, runRoot: runBRoot, toolchain, projectRoot, label: "run-b"}));
  }
  const manifestsRoot = path.join(backendRoot, "manifests");
  await mkdir(manifestsRoot, {recursive: true});
  const manifests = [];
  for (let index = 0; index < corpusValidation.members.length; index += 1) {
    const member = corpusValidation.members[index];
    const first = runA[index];
    const repeat = runB[index];
    invariant(first.normalized.deterministicPayloadSha256 ===
      repeat.normalized.deterministicPayloadSha256,
    `${member.animationId}: OpenFL normalized payload is nondeterministic`);
    const before = sourceBefore.get(member.animationId);
    const after = await fileIdentity(member.physical.swfPath);
    invariant(before.bytes === after.bytes && before.sha256 === after.sha256,
      `${member.animationId}: source changed during OpenFL run`);
    const normalized = first.normalized;
    const symbolTypeCounts = countSymbolTypes(normalized.symbols);
    const timeline = summarizeFramesAndOperations(normalized.symbols);
    const dangling = normalized.audit.danglingReferenceCount;
    const missingSymbolIds = [...new Set((normalized.audit.unsupported
      .find((item) => item.code === "dangling-symbol-reference")?.details || [])
      .map((item) => item.missingSymbolId))].sort((left, right) => left - right);
    const status = dangling === 0
      ? "structurally-normalized-visual-ir"
      : "morph-blocked-incomplete-ir";
    const manifest = {
      schemaVersion: 1,
      backend: {
        id: "openfl-swf-animate-ir",
        family: "swf-to-animate-json-visual-timeline-ir",
        repository: "https://github.com/openfl/swf",
        license: "MIT",
        commit: SWF_COMMIT,
        versions: {haxe: "4.3.7", neko: "2.4.1", openfl: "9.5.2", lime: "8.3.2", swf: "3.4.0"},
        runNSha256: SWF_RUN_N_SHA256,
        normalizerSha256: NORMALIZER_SHA256,
        visualRuntimeDependency: "OpenFL consumer/application not generated by this exporter",
        retainsOriginalSwfAtRuntime: false,
      },
      status,
      member: publicMemberProjection(member, projectRoot),
      sourceCustody: {before, after, unchanged: true},
      generatedIr: {
        deterministicPayloadSha256: normalized.deterministicPayloadSha256,
        repeatDeterministicPayloadSha256: repeat.normalized.deterministicPayloadSha256,
        deterministicAcrossTwoRuns: true,
        sourceUuidDiscardedAsNondeterministic: true,
        symbolCount: normalized.symbols.length,
        symbolTypeCounts,
        ...timeline,
        warningCount: first.warningCount,
        danglingReferenceCount: dangling,
        missingSymbolIds,
      },
      compilerEffects: {
        structureIrGenerated: true,
        ordinaryVisualTimelineIrComplete: dangling === 0,
        renderableVisualArtifactGenerated: false,
        morphShapesRetained: missingSymbolIds.length === 0,
        buttonVisualStatesRetained: (symbolTypeCounts.button || 0) > 0,
        buttonBehaviorRetained: false,
        avm1BehaviorCompiled: false,
        streamAudioRetained: false,
        externalAudioBound: false,
        stageAndBackgroundEmittedByBackend: false,
        modernMyLessonHostAdapterGenerated: false,
      },
      unsupportedLedger: normalized.audit.unsupported,
      evidenceBoundary: {
        normalizedStructureIrEvidenceOnly: true,
        rendererExecutionClaim: false,
        runtimeReachabilityClaim: false,
        visualFidelityClaim: false,
        audioSynchronizationClaim: false,
        currentJavaScriptImplementationClaim: false,
      },
      acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
    };
    await writeExclusive(path.join(manifestsRoot, `${member.animationId}.json`), stableJson(manifest));
    manifests.push(manifest);
  }
  const summary = {
    schemaVersion: 1,
    backendId: "openfl-swf-animate-ir",
    pilotId: corpusValidation.pilotId,
    memberCount: manifests.length,
    normalizedIrCount: manifests.length,
    structurallyUnblockedCount: manifests.filter((item) =>
      item.status === "structurally-normalized-visual-ir").length,
    morphBlockedCount: manifests.filter((item) =>
      item.status === "morph-blocked-incomplete-ir").length,
    renderableVisualArtifactCount: manifests.filter((item) =>
      item.compilerEffects.renderableVisualArtifactGenerated).length,
    behaviorCompiledCount: manifests.filter((item) =>
      item.compilerEffects.avm1BehaviorCompiled).length,
    streamAudioRetainedCount: manifests.filter((item) =>
      item.compilerEffects.streamAudioRetained).length,
    shellCount: 0,
    toolchain: {
      versions: {haxe: "4.3.7", neko: "2.4.1", haxelib: "4.1.1", openfl: "9.5.2", lime: "8.3.2", swf: "3.4.0"},
      swfCommit: SWF_COMMIT,
      runNSha256: SWF_RUN_N_SHA256,
      licenseSha256: SWF_LICENSE_SHA256,
      identities: toolchain.identities,
      preflightCommands,
    },
    outputInventory: await inventoryDirectory(backendRoot, {exclude: ["summary.json"]}),
    acceptanceEffects: {...ACCEPTANCE_EFFECTS_FALSE},
  };
  await writeExclusive(path.join(backendRoot, "summary.json"), stableJson(summary));
  return {backendRoot, manifests, summary};
}
