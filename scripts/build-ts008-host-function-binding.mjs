#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {
  access,
  mkdir,
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
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  scenarioInventorySha256,
} from "./evidence-projections.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

const ANIMATION_ID = "course-g03-l01-ts-008";
const OUTPUT_PATH = `migrations/${ANIMATION_ID}/audit/host-function-binding.json`;
const INVENTORY_PATH = `migrations/${ANIMATION_ID}/audit/scenario-inventory.json`;
const CHILD_SCRIPT_BUNDLE_PATH =
  `migrations/${ANIMATION_ID}/audit/machine/ffdec-scripts.txt.gz`;
const CHILD_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/TS/L1TS08.swf";
const HOST_SWF_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/index_local.swf";
const COURSE_XML_PATH =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L1/index.xml";
const SOURCE_CATALOG_PATH = "catalog/source-files.json";

const EXPECTED = Object.freeze({
  childSwfSha256: "9749ae5f4d533379aa58531e541ffd5da1624bc8fcea38660d54d0f5d3ddc29b",
  hostSwfSha256: "69d0f39b3e7b4e93f7354f7096a2c38f2335277aec116b8d9bf35d740a571a8f",
  courseXmlSha256: "f803cd0f01016385e8fd6d2ad11ee2b5379c82f252015999c62727c7fd581443",
  ffdecVersion: "JPEXS Free Flash Decompiler v.26.2.1",
  ffdecJarSha256: "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f",
});

const HOST_FUNCTIONS = Object.freeze([
  Object.freeze({
    name: "showWrongFeed",
    requiredTokens: Object.freeze([
      "random(3)",
      "Mc_Wrong_Feed",
      "gotoAndPlay(2)",
      "_global.gSound.setVolume(_global.volLevel)",
    ]),
  }),
  Object.freeze({
    name: "showRightFeed",
    requiredTokens: Object.freeze([
      "random(4)",
      "Mc_Right_Feed",
      "gotoAndPlay(2)",
      "_global.gSound.setVolume(_global.volLevel)",
    ]),
  }),
  Object.freeze({
    name: "disableQuizButton",
    requiredTokens: Object.freeze([
      "while(i <= 25)",
      "AnsBtn",
      ".enabled = false",
      "NMHBtn.enabled = false",
    ]),
  }),
  Object.freeze({
    name: "enableQuizButton",
    requiredTokens: Object.freeze([
      "while(i <= 25)",
      "AnsBtn",
      ".enabled = true",
      "NMHBtn.enabled = true",
    ]),
  }),
  Object.freeze({
    name: "DoHyperLinks",
    requiredTokens: Object.freeze([
      '_loc2_.CompClick = "HyperLink"',
      "_loc2_.KeyAttribute += \"~English\"",
      "_loc1_.m_c.doGetSubLink(_loc2_.KeyAttribute)",
    ]),
  }),
  Object.freeze({
    name: "doCheckSpanishAudio",
    requiredTokens: Object.freeze([
      '_loc1_.dtfSPANISH.text = "ON"',
      "_loc2_.sectionNumber == 7",
      '_loc2_.tempURL + "/TS/L1TS01.swf"',
      "_loc1_.SA._visible = true",
      "_loc1_.EA._visible = true",
    ]),
  }),
  Object.freeze({
    name: "doPlaySpanishAudio",
    requiredTokens: Object.freeze([
      '"/SA/"',
      "_global.gSound.loadSound",
      "_root.animation_mc.animation.stop()",
      "_global.gSound.onSoundComplete",
    ]),
  }),
]);

const HOST_EVENT_SCRIPTS = Object.freeze([
  Object.freeze({
    role: "shell-replay-release",
    relativePath: "DefineButton2_244/BUTTONCONDACTION on(release).as",
    requiredTokens: Object.freeze([
      "_global.quizSection = false",
      "_global.gSound.stop()",
      "_root.loadSWFMovie()",
    ]),
  }),
]);

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort(compareText)
      .map((key) => [key, stable(value[key])]),
  );
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function run(command, args, {cwd = defaultRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {...process.env, LC_ALL: "C"},
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolve({stdout, stderr});
      else reject(new Error(`${command} exited ${code ?? signal}: ${(stderr || stdout).trim()}`));
    });
  });
}

async function resolveFfdec(command) {
  const {stdout, stderr} = await run(command, ["-help"], {timeoutMs: 30_000});
  const help = (stdout || stderr).replace(/\u001b\[[0-9;]*m/g, "");
  const version = help
    .split(/\r?\n/)
    .find((line) => line.startsWith("JPEXS Free Flash Decompiler v."));
  invariant(
    version === EXPECTED.ffdecVersion,
    `FFDec version changed: expected ${EXPECTED.ffdecVersion}, observed ${version || "unknown"}`,
  );
  let executableCandidate = command;
  if (!path.isAbsolute(command) && !command.includes(path.sep)) {
    executableCandidate = "";
    for (const directory of (process.env.PATH || "").split(path.delimiter)) {
      if (!directory) continue;
      const candidate = path.join(directory, command);
      try {
        await access(candidate);
        executableCandidate = candidate;
        break;
      } catch {
        // Keep searching the explicit process PATH.
      }
    }
    invariant(executableCandidate, `FFDec executable was not found on PATH: ${command}`);
  }
  const executable = await realpath(executableCandidate);
  const jarPath = path.join(path.dirname(executable), "ffdec.jar");
  invariant(await exists(jarPath), `FFDec jar is missing next to ${executable}`);
  const jarSha256 = await sha256File(jarPath);
  invariant(
    jarSha256 === EXPECTED.ffdecJarSha256,
    `FFDec jar hash changed: expected ${EXPECTED.ffdecJarSha256}, observed ${jarSha256}`,
  );
  return {executable, version, jarSha256};
}

async function listFiles(root, current = root) {
  const result = [];
  for (const entry of (await readdir(current, {withFileTypes: true})).sort((a, b) =>
    compareText(a.name, b.name)
  )) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) result.push(...(await listFiles(root, absolute)));
    else if (entry.isFile()) {
      result.push({absolute, relativePath: portable(path.relative(root, absolute))});
    } else {
      throw new Error(`FFDec export contains unsupported entry ${absolute}`);
    }
  }
  return result;
}

function normalizeActionScript(raw) {
  return `${raw.toString("utf8").replace(/\r\n?/g, "\n").replace(/\n*$/g, "")}\n`;
}

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  invariant(start >= 0, `host ActionScript does not contain ${marker}`);
  const openingBrace = source.indexOf("{", start);
  invariant(openingBrace >= 0, `${name} has no opening brace`);
  let depth = 0;
  let end = -1;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }
  invariant(end > openingBrace, `${name} has no balanced closing brace`);
  return `${source.slice(start, end).replace(/\n*$/g, "")}\n`;
}

function excerptRecord({role, artifact, text, requiredTokens}) {
  const missingTokens = requiredTokens.filter((token) => !text.includes(token));
  return {
    role,
    artifact,
    normalization: "CRLF-or-CR-to-LF; exact balanced function/event block; one terminal LF",
    bytes: Buffer.byteLength(text, "utf8"),
    sha256: sha256(Buffer.from(text, "utf8")),
    text,
    requiredTokens: [...requiredTokens],
    missingTokens,
    exact: missingTokens.length === 0,
  };
}

async function exportHostScripts({root, ffdec}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "helpmath-ts008-host-functions-"));
  invariant(
    path.dirname(temporaryRoot) === path.resolve(os.tmpdir()),
    `unsafe temporary path ${temporaryRoot}`,
  );
  try {
    await run(
      ffdec.executable,
      ["-onerror", "abort", "-export", "script", temporaryRoot, path.join(root, HOST_SWF_PATH)],
      {cwd: root},
    );
    const scriptsRoot = path.join(temporaryRoot, "scripts");
    const files = await listFiles(scriptsRoot);
    const byPath = new Map(
      await Promise.all(
        files.map(async ({absolute, relativePath}) => [
          relativePath,
          await readFile(absolute),
        ]),
      ),
    );
    const frame35Raw = byPath.get("frame_35/DoAction.as");
    invariant(frame35Raw, "FFDec export is missing frame_35/DoAction.as");
    const frame35 = normalizeActionScript(frame35Raw);
    const functions = HOST_FUNCTIONS.map((definition) =>
      excerptRecord({
        role: `host-function-${definition.name}`,
        artifact: "frame_35/DoAction.as",
        text: extractFunction(frame35, definition.name),
        requiredTokens: definition.requiredTokens,
      })
    );
    const events = HOST_EVENT_SCRIPTS.map((definition) => {
      const raw = byPath.get(definition.relativePath);
      invariant(raw, `FFDec export is missing ${definition.relativePath}`);
      return excerptRecord({
        role: definition.role,
        artifact: definition.relativePath,
        text: normalizeActionScript(raw),
        requiredTokens: definition.requiredTokens,
      });
    });
    const index = await Promise.all(
      files.map(async ({absolute, relativePath}) => {
        const bytes = await readFile(absolute);
        return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
      }),
    );
    return {
      fileCount: index.length,
      indexHashMode: "stable-key-sorted-pretty-json-array-v1",
      indexSha256: sha256(Buffer.from(stableJson(index), "utf8")),
      functions,
      events,
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: false});
  }
}

async function verifiedFile(root, relativePath, expectedSha256, role) {
  const absolute = path.join(root, relativePath);
  const info = await stat(absolute);
  invariant(info.isFile(), `${role} is not a regular file`);
  const observedSha256 = await sha256File(absolute);
  invariant(
    observedSha256 === expectedSha256,
    `${role} hash changed: expected ${expectedSha256}, observed ${observedSha256}`,
  );
  return {role, path: relativePath, bytes: info.size, sha256: observedSha256};
}

async function verifyFrozenCatalog(root, files) {
  const catalogRaw = await readFile(path.join(root, SOURCE_CATALOG_PATH));
  const catalog = JSON.parse(catalogRaw);
  const byPath = new Map(catalog.files.map((entry) => [entry.path, entry]));
  for (const file of files) {
    const archivePath = file.path.replace(
      "source-assets/flash/HELP MATH_ORIGINAL FILES/",
      "",
    );
    const record = byPath.get(archivePath);
    invariant(record, `${file.role} is missing from ${SOURCE_CATALOG_PATH}`);
    invariant(record.sha256 === file.sha256, `${file.role} catalog hash differs`);
    invariant(record.bytes === file.bytes, `${file.role} catalog byte size differs`);
  }
  return {
    path: SOURCE_CATALOG_PATH,
    sha256: sha256(catalogRaw),
    checksumSetSha256: catalog.checksumSetSha256,
  };
}

function findHandler(inventory, script) {
  const matches = (inventory.interactions?.handlers || []).filter(
    (handler) => handler.script === script,
  );
  invariant(matches.length === 1, `expected one inventory handler for ${script}`);
  return matches[0];
}

export function deriveTs008HostBinding({
  inventory,
  inventoryRaw,
  childScriptBundle,
  hostExport,
  sources,
  sourceCatalog,
  ffdec,
  scriptRaw,
}) {
  invariant(inventory.animationId === ANIMATION_ID, "scenario inventory animationId changed");
  invariant(inventory.source?.swfSha256 === EXPECTED.childSwfSha256, "inventory source hash changed");
  invariant(
    inventory.courseXml?.currentPlacement?.matchStatus === "exact-active-page",
    "active course placement is no longer exact",
  );
  invariant(
    inventory.courseXml.currentPlacement.sourceRelativePath === "TS/L1TS08.swf",
    "active course placement no longer targets TS/L1TS08.swf",
  );

  const childHandlers = [
    "DefineButton2_145/BUTTONCONDACTION on(release).as",
    "DefineButton2_146/BUTTONCONDACTION on(release).as",
    "DefineButton2_147/BUTTONCONDACTION on(release).as",
    "DefineButton2_148/BUTTONCONDACTION on(release).as",
  ].map((script) => {
    const handler = findHandler(inventory, script);
    return {
      id: handler.id,
      script,
      bodySha256: handler.bodySha256,
      categories: handler.categories,
      calls: (handler.signals?.calls || []).map(({target}) => target),
    };
  });

  const qualificationIssues = [
    ...hostExport.functions.flatMap((record) =>
      record.missingTokens.map((token) => `${record.role} lacks ${JSON.stringify(token)}`)
    ),
    ...hostExport.events.flatMap((record) =>
      record.missingTokens.map((token) => `${record.role} lacks ${JSON.stringify(token)}`)
    ),
  ];
  const right = hostExport.functions.find(({role}) => role === "host-function-showRightFeed");
  const wrong = hostExport.functions.find(({role}) => role === "host-function-showWrongFeed");
  const glossary = hostExport.functions.find(({role}) => role === "host-function-DoHyperLinks");
  const replay = hostExport.events.find(({role}) => role === "shell-replay-release");

  return {
    schemaVersion: 1,
    evidenceType: "ts008-static-host-function-binding",
    animationId: ANIMATION_ID,
    status: qualificationIssues.length
      ? "blocked-source-contract-drift"
      : "source-contract-proven-runtime-state-unresolved",
    scope: "read-only-static-child-to-same-lesson-host-function-chain",
    generatedBy: {
      script: "scripts/build-ts008-host-function-binding.mjs",
      sha256: sha256(scriptRaw),
      ffdec,
    },
    sourceCatalog,
    sources,
    scenarioInventory: {
      path: INVENTORY_PATH,
      fullFileSha256: sha256(inventoryRaw),
      hashMode: CANONICAL_PROJECTION_ENCODING,
      projection: SCENARIO_INVENTORY_PROJECTION.id,
      excludedPaths: [...SCENARIO_INVENTORY_PROJECTION.excludedPaths],
      technicalSha256: scenarioInventorySha256(inventory),
    },
    childActionScript: {
      path: CHILD_SCRIPT_BUNDLE_PATH,
      sha256: sha256(childScriptBundle),
      uncompressedSha256: sha256(gunzipSync(childScriptBundle)),
      handlers: childHandlers,
    },
    hostActionScript: hostExport,
    sourceContracts: {
      correctAnswer: {
        childCalls: "_root.showRightFeed",
        hostFunctionSha256: right.sha256,
        feedbackVariantCount: 4,
        randomExpression: "random(4) + 1",
        deterministicVariantMappingResolved: false,
      },
      wrongAnswer: {
        childCalls: "_root.showWrongFeed",
        hostFunctionSha256: wrong.sha256,
        feedbackVariantCount: 3,
        randomExpression: "random(3) + 1",
        deterministicVariantMappingResolved: false,
      },
      quizButtons: {
        answerButtonRange: "AnsBtn1..AnsBtn25",
        enableDisableFunctionsSourceProven: true,
        naturalVisibilityAndEnabledStateResolved: false,
      },
      glossary: {
        childSetsKeyAttributeBeforeCall: true,
        hostFunctionSha256: glossary.sha256,
        hostSuffixObserved: "~English",
        spanishGlossaryProtocolResolved: false,
      },
      replay: {
        hostEventSha256: replay.sha256,
        observedOperation: "_root.loadSWFMovie()",
        fullStateResetResolved: false,
      },
      spanishAudio: {
        availabilityCheckFunctionSha256: hostExport.functions.find(
          ({role}) => role === "host-function-doCheckSpanishAudio",
        ).sha256,
        playbackFunctionSha256: hostExport.functions.find(
          ({role}) => role === "host-function-doPlaySpanishAudio",
        ).sha256,
        siblingSaPathConstructionSourceProven: true,
        naturalPlaybackAndSynchronizationResolved: false,
      },
    },
    qualificationIssues,
    authority: {
      childToHostFunctionNamesSourceProven: qualificationIssues.length === 0,
      hostFunctionBodiesSourceProven: qualificationIssues.length === 0,
      originalRuntimeExecutionObserved: false,
      randomOutcomeMappingResolved: false,
      retryAndForcedContinuationResolved: false,
      glossaryVisualStateResolved: false,
      spanishGlossaryProtocolResolved: false,
      scoringResolved: false,
      terminalStateResolved: false,
      replayFullStateResetResolved: false,
      audioExecutedOrAccepted: false,
      visualParityClaimed: false,
      humanOrOwnerAcceptance: false,
      strictAcceptanceEffect: "none",
      migrationStatusChanged: false,
    },
    limitations: [
      "This report binds static ActionScript function names and bodies only; it is not an authorized original-runtime trace.",
      "The right/wrong feedback functions choose random host MovieClips. Their seed-to-variant mapping and natural display-list state remain unresolved.",
      "The child retry counter, second-attempt continuation, score effects, terminal state, and complete Replay reset require natural host execution.",
      "The host glossary function appends an English suffix. No Spanish glossary visual or audio protocol is inferred.",
      "No JavaScript renderer scenario is unblocked by this report alone; baseline, RMSE, audio, human, owner, parity, and completion gates remain unchanged.",
    ],
  };
}

export function parseArguments(args) {
  const options = {root: defaultRoot, ffdec: "ffdec", check: false};
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--root" || value === "--ffdec") {
      const next = args[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--root") options.root = path.resolve(next);
      else options.ffdec = next;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

export async function buildTs008HostFunctionBinding({
  root = defaultRoot,
  ffdec: ffdecCommand = "ffdec",
  check = false,
} = {}) {
  const [
    scriptRaw,
    inventoryRaw,
    childScriptBundle,
    child,
    host,
    courseXml,
    ffdec,
  ] = await Promise.all([
    readFile(scriptPath),
    readFile(path.join(root, INVENTORY_PATH)),
    readFile(path.join(root, CHILD_SCRIPT_BUNDLE_PATH)),
    verifiedFile(root, CHILD_SWF_PATH, EXPECTED.childSwfSha256, "target-child-swf"),
    verifiedFile(root, HOST_SWF_PATH, EXPECTED.hostSwfSha256, "same-lesson-host-swf"),
    verifiedFile(root, COURSE_XML_PATH, EXPECTED.courseXmlSha256, "same-lesson-course-xml"),
    resolveFfdec(ffdecCommand),
  ]);
  const sources = {child, host, courseXml};
  const [sourceCatalog, hostExport] = await Promise.all([
    verifyFrozenCatalog(root, Object.values(sources)),
    exportHostScripts({root, ffdec}),
  ]);
  const inventory = JSON.parse(inventoryRaw);
  const report = deriveTs008HostBinding({
    inventory,
    inventoryRaw,
    childScriptBundle,
    hostExport,
    sources,
    sourceCatalog,
    ffdec: {
      version: ffdec.version,
      jarSha256: ffdec.jarSha256,
    },
    scriptRaw,
  });
  const desired = Buffer.from(stableJson(report), "utf8");
  const output = path.join(root, OUTPUT_PATH);
  if (check) {
    invariant(await exists(output), `${OUTPUT_PATH} is missing`);
    const observed = await readFile(output);
    invariant(
      observed.equals(desired),
      `${OUTPUT_PATH} is stale; expected ${sha256(desired)}, observed ${sha256(observed)}`,
    );
  } else {
    const resolvedOutput = path.resolve(output);
    invariant(isInside(resolvedOutput, path.resolve(root)), "output must stay inside project root");
    await mkdir(path.dirname(resolvedOutput), {recursive: true});
    await writeFile(resolvedOutput, desired);
  }
  return {path: OUTPUT_PATH, sha256: sha256(desired), report};
}

function helpText() {
  return `Usage: node scripts/build-ts008-host-function-binding.mjs [options]

Options:
  --check              Re-extract and verify the checked-in report without writing
  --ffdec <command>    FFDec 26.2.1 launcher (default: ffdec)
  --root <directory>   Project root (default: repository root)
  -h, --help           Show this help
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const result = await buildTs008HostFunctionBinding(options);
  process.stdout.write(
    `${options.check ? "Verified" : "Generated"} ${result.path} sha256:${result.sha256}\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
