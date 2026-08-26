#!/usr/bin/env node

import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {createReadStream, statSync} from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import {createServer} from "node:net";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultOutputRoot = path.join(projectRoot, "work", "adobe-course-host-fixtures-formulas");
const defaultReportPath = path.join(projectRoot, "reports", "formula-spanish-host-fixture-audit.json");
const flashPlayerPath = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";

export const FORMULA_PILOTS = Object.freeze([
  Object.freeze({
    animationId: "formula-elementary-conversion-01-01",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_1.swf",
    sourceSha256: "72d1e337b81939bace7eddf0b4994b469b73f3e4c8b103d82c06bda858dcd8a3",
    sourceBasename: "Conversion_1_1.swf",
    originalSelection: "Mc_SubLink_1_1",
    frameCount: 94,
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-02",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_2.swf",
    sourceSha256: "91d63f9f045d2097cd0f46c59ceacd4faefd95851f9039003589d8052c39e758",
    sourceBasename: "Conversion_1_2.swf",
    originalSelection: "Mc_SubLink_1_2",
    frameCount: 109,
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-03",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_3.swf",
    sourceSha256: "0a315ea564bcb79b809cabf1a5f406b3a16363f8ad654678ca2683534f09c818",
    sourceBasename: "Conversion_1_3.swf",
    originalSelection: "Mc_SubLink_1_3",
    frameCount: 170,
  }),
  Object.freeze({
    animationId: "formula-elementary-conversion-01-04",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_FORMULAS/ELEMENTARY/SWF/Conversion_1_4.swf",
    sourceSha256: "cbb7f3f529c8c5ca679da864c7c49ab472cac4d0feb2392eed5aa04d21a4e1a9",
    sourceBasename: "Conversion_1_4.swf",
    originalSelection: "Mc_SubLink_1_4",
    frameCount: 67,
  }),
]);

export const INDEX_ELM_HOSTS = Object.freeze([
  Object.freeze({
    role: "primary-shipped-host-evidence",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM.swf",
    sourceSha256: "04b5b25285268454a5fe24cd3f4ecf45a1cdaf0dcbc6e894f0ba0719054580bd",
  }),
  Object.freeze({
    role: "same-authority-april8-variant",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM_April8.swf",
    sourceSha256: "e7c5f548a81a5b10c0e35ce97b1f4b2f8ae77ee07175ead5e6a4e5cabf25f414",
  }),
  Object.freeze({
    role: "same-authority-local-variant",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM_Local.swf",
    sourceSha256: "6f1ff5d81c06cbb45d453598c63d171f132d8cc06a096d61016bc5eb4cb747fb",
  }),
  Object.freeze({
    role: "same-authority-local-april8-variant",
    source: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/indexELM_Local_April8.swf",
    sourceSha256: "52d4da17c1f8c2eb59e8dcb402f1cdd18c65964b7dc0a4853e1b5e09c9f803ef",
  }),
]);

const NATIVE_STAGE = Object.freeze({width: 780, height: 379});
const FPS = 12;
const BACKGROUND = Object.freeze({red: 228, green: 228, blue: 228, hex: "#e4e4e4"});
const BLOCKED_PRIMITIVES = /\b(?:getURL|fscommand|loadVariables(?:Num)?|ExternalInterface|LocalConnection|SharedObject|XMLSocket|XML|NetConnection)\s*(?:\.|\()/i;

function portable(value) {
  return value.split(path.sep).join("/");
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
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

async function evidenceMimeMatches(candidate, mimeType) {
  const bytes = await readFile(candidate);
  if (mimeType === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  }
  if (mimeType === "image/jpeg") {
    return bytes.length >= 4
      && bytes[0] === 0xff
      && bytes[1] === 0xd8
      && bytes[bytes.length - 2] === 0xff
      && bytes[bytes.length - 1] === 0xd9;
  }
  return false;
}

function findOnPath(name, pathValue = process.env.PATH || "") {
  for (const directory of pathValue.split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, name);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Optional executable not present in this PATH entry.
    }
  }
  return null;
}

function run(command, argumentsList, {cwd = projectRoot, timeoutMs = 120_000} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
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
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
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

async function firstLine(command, argumentsList) {
  try {
    const {stdout, stderr} = await run(command, argumentsList, {timeoutMs: 30_000});
    return (stdout || stderr).split(/\r?\n/).find(Boolean) || null;
  } catch (error) {
    return {error: error.message};
  }
}

export function parseArguments(argumentsList) {
  const options = {
    outputRoot: defaultOutputRoot,
    reportPath: defaultReportPath,
    ids: [],
    compile: true,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--no-compile") options.compile = false;
    else if (value === "--verify-fixture" || value === "--verify-launch") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a manifest path`);
      if (value === "--verify-fixture") options.verifyFixture = path.resolve(next);
      else options.verifyLaunch = path.resolve(next);
      index += 1;
    } else if (["--id", "--output", "--report"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--output") options.outputRoot = path.resolve(next);
      else options.reportPath = path.resolve(next);
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

async function probeToolchain() {
  const ffdec = findOnPath("ffdec");
  const swfmill = findOnPath("swfmill");
  const python = findOnPath("python3");
  const sandboxExec = findOnPath("sandbox-exec") || "/usr/bin/sandbox-exec";
  const toolchain = {
    ffdec: {
      path: ffdec,
      version: ffdec ? await firstLine(ffdec, ["-help"]) : null,
      role: "hash-pinned AS1/2 extraction and deterministic importScript compilation",
    },
    swfmill: {
      path: swfmill,
      version: swfmill ? await firstLine(swfmill, ["--version"]) : null,
      role: "SWF XML evidence and minimal one-frame parent container",
    },
    python: {
      path: python,
      version: python ? await firstLine(python, ["--version"]) : null,
      role: "stdlib ElementTree parsing of swfmill XML; no regex-based XML scraping",
    },
    flashPlayer: {
      path: flashPlayerPath,
      installed: await exists(flashPlayerPath),
      role: "authorized Adobe runtime; never launched by this factory",
    },
    sandboxExec: {
      path: await exists(sandboxExec) ? sandboxExec : null,
      role: "deny network, Apple Events, LaunchServices open/database operations, and out-of-bound writes",
    },
  };
  toolchain.canAudit = Boolean(ffdec && swfmill && python);
  toolchain.canCompile = Boolean(ffdec && swfmill);
  return toolchain;
}

async function walkFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(fullPath));
    else result.push(fullPath);
  }
  return result.sort(compareText);
}

function extractFunctionSource(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`function ${name} was not found`);
  const opening = source.indexOf("{", start);
  if (opening < 0) throw new Error(`function ${name} has no body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`function ${name} body was not balanced`);
}

async function parseSwfXmlEvidence({pythonPath, xmlPath}) {
  const program = String.raw`
import json, sys, xml.etree.ElementTree as ET
root = ET.parse(sys.argv[1]).getroot()
edits = []
for item in root.iter("DefineEditText"):
    if item.attrib.get("variableName") == "SpanishFormulas":
        size = item.find("./size/Rectangle")
        edits.append({
            "objectID": item.attrib.get("objectID"),
            "variableName": item.attrib.get("variableName"),
            "initialText": item.attrib.get("initialText"),
            "boundsTwips": dict(size.attrib) if size is not None else None,
        })
placements = []
for item in root.iter("PlaceObject2"):
    if item.attrib.get("name") in ("dtfSpanishFormulas", "Mc_FormulaDEF", "Mc_Formulas", "Mc_SD"):
        transform = item.find("./transform/Transform")
        placements.append({
            "name": item.attrib.get("name"),
            "objectID": item.attrib.get("objectID"),
            "depth": item.attrib.get("depth"),
            "transform": dict(transform.attrib) if transform is not None else None,
        })
print(json.dumps({"dynamicTextFields": edits, "namedPlacements": placements}, sort_keys=True))
`;
  const {stdout} = await run(pythonPath, ["-c", program, xmlPath], {timeoutMs: 30_000});
  return JSON.parse(stdout);
}

async function validateSourceHash(relativePath, expectedSha256) {
  const absolutePath = path.join(projectRoot, relativePath);
  const observedSha256 = await sha256File(absolutePath);
  if (observedSha256 !== expectedSha256) {
    throw new Error(`${relativePath}: expected ${expectedSha256}, observed ${observedSha256}`);
  }
  return {absolutePath, observedSha256};
}

async function extractScriptsAndXml({source, sourceSha256, toolchain, prefix}) {
  const {absolutePath, observedSha256} = await validateSourceHash(source, sourceSha256);
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    const scriptsRoot = path.join(directory, "scripts");
    const xmlPath = path.join(directory, "movie.xml");
    await run(toolchain.ffdec.path, ["-onerror", "abort", "-export", "script", scriptsRoot, absolutePath]);
    await run(toolchain.swfmill.path, ["swf2xml", absolutePath, xmlPath]);
    const scriptPaths = (await walkFiles(scriptsRoot)).filter((candidate) => candidate.endsWith(".as"));
    const scripts = [];
    for (const candidate of scriptPaths) {
      scripts.push({
        relativePath: portable(path.relative(scriptsRoot, candidate)),
        text: await readFile(candidate, "utf8"),
      });
    }
    return {
      source,
      sourceSha256: observedSha256,
      scriptCount: scripts.length,
      scripts,
      xml: await parseSwfXmlEvidence({pythonPath: toolchain.python.path, xmlPath}),
      swfmillXmlSha256: await sha256File(xmlPath),
    };
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

function oneScript(records, predicate, label) {
  const matches = records.filter((record) => predicate(record.text));
  if (matches.length !== 1) throw new Error(`${label}: expected one script, observed ${matches.length}`);
  return matches[0];
}

async function auditHostVariant(host, toolchain) {
  const extracted = await extractScriptsAndXml({...host, toolchain, prefix: "help-formula-indexelm-"});
  const root = oneScript(extracted.scripts, (text) => text.includes("function doDisplayFormulaDef(") && text.includes('_global.formulasPath + "SWF/"'), `${host.source} root formula loader`);
  const language = oneScript(extracted.scripts, (text) => text.includes('if(_root.dtfSpanishFormulas.text.toUpperCase() == "ON")') && text.includes("McFMSAudio"), `${host.source} formula language panel`);
  const capacity = oneScript(extracted.scripts, (text) => text.includes('arrET = ["Cup to fluid ounces"') && text.includes('strSWFName = "Conversion_"'), `${host.source} capacity selection`);
  const dynamicFields = extracted.xml.dynamicTextFields;
  const dynamicPlacements = extracted.xml.namedPlacements.filter((item) => item.name === "dtfSpanishFormulas");
  if (dynamicFields.length !== 1 || dynamicPlacements.length !== 1) {
    throw new Error(`${host.source}: expected one SpanishFormulas dynamic field and placement`);
  }
  if (dynamicPlacements[0].objectID !== dynamicFields[0].objectID) {
    throw new Error(`${host.source}: SpanishFormulas field/placement object IDs differ`);
  }
  const functionSource = extractFunctionSource(root.text, "doDisplayFormulaDef");
  const scriptAssignments = extracted.scripts.flatMap((record) => {
    const matches = record.text.match(/(?:dtfSpanishFormulas\.text|\bSpanishFormulas)\s*=\s*[^=]/g) || [];
    return matches.map((match) => ({script: record.relativePath, expressionPrefix: match.trim()}));
  });
  const formulasPathLines = root.text.split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line.includes("_global.formulasPath ="));
  if (!formulasPathLines.some((line) => line.includes("/HELP_FORMULAS/ELEMENTARY/"))) {
    throw new Error(`${host.source}: formula base path was not statically recovered`);
  }
  const expectedSelections = [1, 2, 3, 4].map((index) => `Mc_SubLink_1_${index}`);
  for (const selection of expectedSelections) {
    if (!capacity.text.includes(`this["Mc_SubLink_1_" + i]`)) break;
  }
  return {
    role: host.role,
    source: host.source,
    sourceSha256: extracted.sourceSha256,
    extractorScriptCount: extracted.scriptCount,
    swfmillXmlSha256: extracted.swfmillXmlSha256,
    dynamicTextContract: {
      field: dynamicFields[0],
      placement: dynamicPlacements[0],
      scriptAssignmentCount: scriptAssignments.length,
      scriptAssignments,
      externalInputFinding: scriptAssignments.length === 0
        ? "The host declares root dynamic text variable SpanishFormulas but does not assign its value in recovered ActionScript; ON is a controlled Spanish scenario input, not a recovered default."
        : "Review recovered script assignments before using this fixture.",
    },
    originalLoadContract: {
      functionScript: root.relativePath,
      functionScriptSha256: sha256Text(root.text),
      functionSourceSha256: sha256Text(functionSource),
      exactFunctionSource: functionSource,
      formulasPathLines,
      target: "_root.Mc_Formulas.Mc_FormulaDEF",
      relativePathExpression: 'SWF/ + strTempSWF + ".swf"',
    },
    originalActivationContract: {
      capacityScript: capacity.relativePath,
      capacityScriptSha256: sha256Text(capacity.text),
      capacityCategory: "Capacity and Volume",
      selectionInstancePattern: "Mc_SubLink_1_<n>",
      derivedBasenameExpression: '"Conversion_" + arrTemp[2] + "_" + arrTemp[3]',
      pilots: expectedSelections.map((selection, index) => ({selection, basename: `Conversion_1_${index + 1}`})),
    },
    languageUiContract: {
      script: language.relativePath,
      scriptSha256: sha256Text(language.text),
      condition: '_root.dtfSpanishFormulas.text.toUpperCase() == "ON"',
      finding: "ON exposes the Spanish formula title/audio controls in the host formula panel; any other value hides them.",
    },
    originalHostPlacement: {
      formulaContainerPlacements: extracted.xml.namedPlacements.filter((item) => item.name === "Mc_FormulaDEF"),
      formulaPanelPlacements: extracted.xml.namedPlacements.filter((item) => item.name === "Mc_Formulas"),
      useInFixture: false,
      rationale: "The acceptance baseline is the formula child's native 780x379 stage, matching the existing English standalone baseline; the original 800x600 shell scales and positions that child inside surrounding product chrome.",
    },
  };
}

async function auditChild(pilot, toolchain) {
  const extracted = await extractScriptsAndXml({
    source: pilot.source,
    sourceSha256: pilot.sourceSha256,
    toolchain,
    prefix: "help-formula-child-",
  });
  const frameOne = oneScript(extracted.scripts, (text) => text.includes('if(_root.dtfSpanishFormulas.text.toUpperCase() == "ON")') && text.includes("Mc_SD._visible"), `${pilot.animationId} frame-1 language script`);
  const allSource = extracted.scripts.map((record) => record.text).join("\n");
  if (BLOCKED_PRIMITIVES.test(allSource)) throw new Error(`${pilot.animationId}: unexpected blocked primitive in child scripts`);
  const rootReferences = [...new Set([...allSource.matchAll(/_root\.([A-Za-z_$][\w$]*)/g)].map((match) => `_root.${match[1]}`))].sort(compareText);
  const expectedRootReferences = ["_root.createClassObject", "_root.dtfSpanishFormulas", "_root.focusManager"];
  if (JSON.stringify(rootReferences) !== JSON.stringify(expectedRootReferences)) {
    throw new Error(`${pilot.animationId}: unexpected root references: ${rootReferences.join(", ")}`);
  }
  const spanishPlacements = extracted.xml.namedPlacements.filter((item) => item.name === "Mc_SD");
  if (!spanishPlacements.length) throw new Error(`${pilot.animationId}: Mc_SD placement was not found`);
  return {
    animationId: pilot.animationId,
    source: pilot.source,
    sourceSha256: extracted.sourceSha256,
    sourceBasename: pilot.sourceBasename,
    stage: NATIVE_STAGE,
    fps: FPS,
    frameCount: pilot.frameCount,
    actionScriptVersion: "AS1/2",
    frameOneLanguageScript: {
      script: frameOne.relativePath,
      scriptSha256: sha256Text(frameOne.text),
      exactSource: frameOne.text,
      condition: '_root.dtfSpanishFormulas.text.toUpperCase() == "ON"',
      trueBranch: "Mc_SD._visible = true",
      falseBranch: "Mc_SD._visible = false",
    },
    rootReferences,
    rootReferenceDisposition: {
      "_root.dtfSpanishFormulas": "required source-evidenced visual-language input supplied by the fixture before the child is loaded",
      "_root.focusManager": "Adobe MX component self-bootstrap; created only when absent by the child's own DoInitAction",
      "_root.createClassObject": "built-in MovieClip method used by the child's own Adobe MX component bootstrap",
    },
    spanishPanelPlacements: spanishPlacements,
    blockedPrimitiveCount: 0,
    externalAudioIncludedInVisualFixture: false,
  };
}

export function validateEquivalentHostContracts(hostAudits) {
  if (hostAudits.length !== INDEX_ELM_HOSTS.length) throw new Error("all four indexELM variants are required");
  const fields = [
    ["load function", (item) => item.originalLoadContract.functionSourceSha256],
    ["capacity selection", (item) => item.originalActivationContract.capacityScriptSha256],
    ["language panel", (item) => item.languageUiContract.scriptSha256],
  ];
  for (const [label, select] of fields) {
    const values = [...new Set(hostAudits.map(select))];
    if (values.length !== 1) throw new Error(`indexELM variants disagree on ${label}: ${values.join(", ")}`);
  }
  for (const audit of hostAudits) {
    if (audit.dynamicTextContract.scriptAssignmentCount !== 0) {
      throw new Error(`${audit.source}: SpanishFormulas has a recovered script assignment; controlled-input rationale must be re-audited`);
    }
  }
  return {
    equivalent: true,
    comparedVariants: hostAudits.length,
    loadFunctionSourceSha256: hostAudits[0].originalLoadContract.functionSourceSha256,
    capacitySelectionScriptSha256: hostAudits[0].originalActivationContract.capacityScriptSha256,
    languagePanelScriptSha256: hostAudits[0].languageUiContract.scriptSha256,
    finding: "All preserved indexELM variants share the same formula child selection, local path construction, root language-field contract, and formula-panel ON condition; their startup/server bootstrapping differences are outside this isolated visual fixture.",
  };
}

export function buildFixtureSpecification({pilot, childAudit, hostAudits, hostEquivalence}) {
  if (childAudit.animationId !== pilot.animationId || childAudit.sourceSha256 !== pilot.sourceSha256) {
    throw new Error(`${pilot.animationId}: child audit identity/hash mismatch`);
  }
  if (!hostEquivalence.equivalent) throw new Error("indexELM formula contract is not equivalent across preserved variants");
  const primaryHost = hostAudits.find((item) => item.role === "primary-shipped-host-evidence");
  if (!primaryHost) throw new Error("primary indexELM evidence is missing");
  return {
    schemaVersion: 1,
    animationId: pilot.animationId,
    fixtureKind: "native-child-isolation-avm1-spanish-context",
    authority: {
      sourceChildUntouched: true,
      originalShellExecuted: false,
      originalShellCopied: false,
      originalHostDefaultClaimed: false,
      controlledScenarioInput: "SpanishFormulas=ON",
      captureClassification: "candidate-authoritative-spanish-child-runtime-context-after-sandbox-smoke-and-runtime-contract-probe",
      rationale: "The untouched child has one source-evidenced visual-language input. The fixture recreates the original root field name/text contract before loading the exact child at its native stage; it does not recreate or claim the original 800x600 shell UI or its external default value.",
    },
    source: {
      childSwf: pilot.source,
      childSwfSha256: pilot.sourceSha256,
      stagedChildPath: `formula/${pilot.sourceBasename}`,
      stage: NATIVE_STAGE,
      fps: FPS,
      frameCount: pilot.frameCount,
      background: BACKGROUND.hex,
      actionScriptVersion: "AS1/2",
      childFrameOneScriptSha256: childAudit.frameOneLanguageScript.scriptSha256,
    },
    originalHostEvidence: {
      primaryHost: primaryHost.source,
      primaryHostSha256: primaryHost.sourceSha256,
      sameAuthorityVariants: hostAudits.filter((item) => item !== primaryHost).map((item) => ({source: item.source, sha256: item.sourceSha256, role: item.role})),
      equivalentContract: hostEquivalence,
      dynamicText: {
        instanceName: "dtfSpanishFormulas",
        variableName: "SpanishFormulas",
        originalScriptAssignmentCount: 0,
        scenarioValue: "ON",
        defaultValueStatus: "external-input-not-recovered-and-not-claimed",
      },
      originalSelection: {
        category: "Capacity and Volume",
        instance: pilot.originalSelection,
        derivedBasename: pilot.sourceBasename.replace(/\.swf$/i, ""),
      },
      originalLoad: {
        target: "_root.Mc_Formulas.Mc_FormulaDEF",
        basePath: "_global.ServerRoot + /HELP_FORMULAS/ELEMENTARY/",
        childPath: `SWF/${pilot.sourceBasename}`,
      },
    },
    visualLanguageContract: {
      beforeLoad: [
        '_root.SpanishFormulas = "ON"',
        '_root.createTextField("dtfSpanishFormulas", ...)',
        '_root.dtfSpanishFormulas.variable = "SpanishFormulas"',
        '_root.dtfSpanishFormulas.text = "ON"',
      ],
      childFrameOneCondition: childAudit.frameOneLanguageScript.condition,
      expectedResult: "Mc_SD._visible == true",
      englishAliasForbidden: true,
      hostPanelAudioAndTitleControlsInScope: false,
    },
    deterministicFrameControl: {
      status: "explicit-one-indexed-after-child-onLoadInit",
      frameCount: pilot.frameCount,
      validRange: {minimum: 1, maximum: pilot.frameCount},
      initialFreezeFrame: 1,
      autoplayAfterLoad: false,
      installGate: "MovieClipLoader.onLoadInit only",
      input: {
        mechanism: "keyboard decimal digits followed by Enter",
        editKeys: {backspace: "remove-last-digit", escape: "clear-buffer-and-hide-controller-overlay"},
        visiblePromptDuringEntry: true,
        visibleRequestedActualResultBeforeCapture: true,
        captureOverlayHideKey: "Escape",
      },
      target: "untouched child root loaded into _root.Mc_FormulaDEF",
      operation: "target.gotoAndStop(requested); target.stop()",
      auditEvents: {
        ready: "frame-controller-ready|range=1-<frameCount>;input=digits+enter",
        result: "frame-control|requested=<one-indexed>;actual=<child _currentframe>;source=<onLoadInit|keyboard-enter>",
        rejected: "frame-control-rejected|requested=<value>;actual=<child _currentframe>;range=1-<frameCount>;source=<caller>",
      },
      networkBridgeAudioEffect: "none",
      strictAcceptanceEffect: "controller enables deterministic Adobe capture but is not itself runtime, visual, audio, human, or owner evidence",
    },
    dependencyDisposition: childAudit.rootReferenceDisposition,
    stagedDependencies: [{
      sourceFile: pilot.source,
      expectedSha256: pilot.sourceSha256,
      fixturePath: `formula/${pilot.sourceBasename}`,
      executable: true,
    }],
    excludedDependencies: [
      "The original indexELM SWFs are static evidence only and are never copied or executed.",
      "EAD/SAD MP3 files are excluded because this fixture establishes Spanish visual child context only; authoritative audio listening/activation/synchronization remains separate.",
      "Remote ServerRoot, LMS/reporting, XML, JavaScript bridges, SharedObject, and network resources are absent and denied.",
    ],
    sideEffectPolicy: {
      hostAllowed: [`MovieClipLoader.loadClip for exact local formula/${pilot.sourceBasename}`],
      childBlockedPrimitiveCount: childAudit.blockedPrimitiveCount,
      networkDenied: true,
      appleEventsDenied: true,
      launchServicesOpenAndDatabaseDenied: true,
      writesRestrictedToFixtureAndOsTemp: true,
    },
    runtimeProbeObligations: [
      "The pre-load GUI smoke must show the exact animation ID and fixture digest without loading the child.",
      "After one explicit click, the event trace must record language-context-ready:ON before child-load-request.",
      "The loaded child must be the hash-listed local SWF and the status must report child-load-init.",
      "onLoadInit must install the controller, freeze the untouched child at one-indexed frame 1, and record requested=1 with actual=1.",
      "Decimal digits plus Enter must request only frames 1 through the source frameCount; every accepted or rejected committed request must record requested and actual child frame.",
      "A runtime inspection/capture must visibly confirm the Spanish Mc_SD panel and must not be inferred from the fixture source alone.",
      "Capture at the child-native 780x379 stage and 12 FPS. Do not include the original host's 0.9 scale or surrounding 800x600 chrome in child-frame RMSE.",
    ],
    captureProtocol: [
      "Run npm run verify:sources and verify this fixture manifest before launch.",
      "Launch smoke-sandboxed.sh first and do not click. Hash an app-window screenshot and complete capture/sandbox-gui-smoke-test.json.",
      "Only after verify-launch passes, launch through launch-sandboxed.sh and click exactly once to load the child.",
      "Wait for frame-controller-ready. Type a one-indexed decimal frame number and press Enter; do not click the loaded child or use Adobe Player playback controls.",
      "For each capture, require the visible READY result and a frame-control event whose requested and actual fields both equal the intended frame. A mismatch invalidates that capture; Escape then hides the controller overlay without changing the child frame.",
      "Confirm the Spanish visual panel from runtime output before accepting any frame capture as a Spanish child baseline.",
      "Capture every one-indexed child frame plus terminal and Replay states at native 780x379, record Adobe Player version/window crop/device scale, then hash the raw archive.",
      "Keep audio, human visual review, and owner acceptance pending; this fixture does not satisfy those gates.",
    ],
    strictAcceptanceEffect: "none-until-runtime-capture-is-complete-and-separately-validated; generation alone changes no migration, baseline, audio, human-review, or owner-acceptance status",
  };
}

function asString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n")}"`;
}

export function renderHostActionScript(specification, fixtureDigest) {
  const childPath = specification.source.stagedChildPath;
  return `// Generated safe AVM1 Spanish visual-context fixture. It is not the original indexELM shell.
Stage.scaleMode = "noScale";
Stage.align = "TL";
_global.__fixtureId = ${asString(specification.animationId)};
_global.__fixtureDigest = ${asString(fixtureDigest)};
_global.__fixtureChildPath = ${asString(childPath)};
_global.__fixtureChildSha256 = ${asString(specification.source.childSwfSha256)};
_global.__fixtureFrameCount = ${Number(specification.source.frameCount)};
_global.__fixtureLoadStarted = false;
_global.__fixtureLoaded = false;
_global.__fixtureFrameControllerInstalled = false;
_global.__fixtureFrameBuffer = "";
_global.__fixtureEvents = new Array();

function __fixtureRecord(kind, detail)
{
   var item = new Object();
   item.sequence = _global.__fixtureEvents.length + 1;
   item.timerMs = getTimer();
   item.kind = kind;
   item.detail = detail;
   _global.__fixtureEvents.push(item);
   trace("HELP_FORMULA_FIXTURE|" + item.sequence + "|" + item.timerMs + "|" + kind + "|" + detail);
}

_root.createEmptyMovieClip("Mc_FormulaDEF",10);
_root.createTextField("__fixtureStatus",100000,12,12,756,72);
_root.__fixtureStatus.selectable = false;
_root.__fixtureStatus.multiline = true;
_root.__fixtureStatus.wordWrap = true;
_root.__fixtureStatus.text = "SAFE LAZY FORMULA FIXTURE\\n" + _global.__fixtureId + "\\n" + _global.__fixtureDigest + "\\nclick once to load exact Spanish-context child; sandbox only";

_root.__fixturePrepareSpanishContext = function()
{
   _root.SpanishFormulas = "ON";
   _root.createTextField("dtfSpanishFormulas",99999,-20000,-20000,20,20);
   _root.dtfSpanishFormulas.variable = "SpanishFormulas";
   _root.dtfSpanishFormulas.text = "ON";
   _root.dtfSpanishFormulas._visible = false;
   __fixtureRecord("language-context-ready",_root.dtfSpanishFormulas.text);
};

_root.__fixtureShowFrameInput = function(message)
{
   _root.__fixtureStatus._visible = true;
   _root.__fixtureStatus.text = "DETERMINISTIC FRAME CONTROL\\n" + message + "\\nvalid one-indexed range: 1-" + _global.__fixtureFrameCount;
};

_root.__fixtureRequestFrame = function(requested,requestSource)
{
   var requestedText = String(requested);
   var actual = 0;
   if(_global.__fixtureFrameTarget != undefined)
   {
      actual = _global.__fixtureFrameTarget._currentframe;
   }
   if(!_global.__fixtureLoaded || !_global.__fixtureFrameControllerInstalled || _global.__fixtureFrameTarget == undefined)
   {
      __fixtureRecord("frame-control-rejected","requested=" + requestedText + ";actual=" + actual + ";range=1-" + _global.__fixtureFrameCount + ";source=" + requestSource + ";reason=controller-not-ready");
      return false;
   }
   var frameNumber = Number(requested);
   if(isNaN(frameNumber) || Math.floor(frameNumber) != frameNumber || frameNumber < 1 || frameNumber > _global.__fixtureFrameCount)
   {
      __fixtureRecord("frame-control-rejected","requested=" + requestedText + ";actual=" + actual + ";range=1-" + _global.__fixtureFrameCount + ";source=" + requestSource + ";reason=out-of-range-or-not-integer");
      _root.__fixtureShowFrameInput("REJECTED requested=" + requestedText + " actual=" + actual);
      return false;
   }
   _global.__fixtureFrameTarget.gotoAndStop(frameNumber);
   _global.__fixtureFrameTarget.stop();
   actual = _global.__fixtureFrameTarget._currentframe;
   __fixtureRecord("frame-control","requested=" + frameNumber + ";actual=" + actual + ";source=" + requestSource);
   if(actual != frameNumber)
   {
      _root.__fixtureShowFrameInput("MISMATCH requested=" + frameNumber + " actual=" + actual);
      return false;
   }
   _root.__fixtureShowFrameInput("READY requested=" + frameNumber + " actual=" + actual + "; press Escape to hide overlay before capture");
   return true;
};

_root.__fixtureInstallFrameController = function(target)
{
   if(_global.__fixtureFrameControllerInstalled)
   {
      return;
   }
   _global.__fixtureFrameTarget = target;
   _global.__fixtureFrameBuffer = "";
   _global.__fixtureFrameControllerInstalled = true;
   _global.__fixtureFrameKeyListener = new Object();
   _global.__fixtureFrameKeyListener.onKeyDown = function()
   {
      if(!_global.__fixtureLoaded || !_global.__fixtureFrameControllerInstalled)
      {
         return;
      }
      var keyCode = Key.getCode();
      var asciiCode = Key.getAscii();
      if(asciiCode >= 48 && asciiCode <= 57)
      {
         var digit = chr(asciiCode);
         var candidate = _global.__fixtureFrameBuffer + digit;
         var maximumDigits = String(_global.__fixtureFrameCount).length;
         if((candidate.length == 1 && candidate == "0") || candidate.length > maximumDigits || Number(candidate) > _global.__fixtureFrameCount)
         {
            __fixtureRecord("frame-input-rejected","candidate=" + candidate + ";actual=" + _global.__fixtureFrameTarget._currentframe + ";range=1-" + _global.__fixtureFrameCount);
            _root.__fixtureShowFrameInput("REJECTED candidate=" + candidate + " current=" + _global.__fixtureFrameTarget._currentframe);
            return;
         }
         _global.__fixtureFrameBuffer = candidate;
         __fixtureRecord("frame-input","buffer=" + _global.__fixtureFrameBuffer + ";actual=" + _global.__fixtureFrameTarget._currentframe);
         _root.__fixtureShowFrameInput("type digits, Enter to commit: " + _global.__fixtureFrameBuffer);
         return;
      }
      if(keyCode == 8)
      {
         _global.__fixtureFrameBuffer = _global.__fixtureFrameBuffer.substr(0,_global.__fixtureFrameBuffer.length - 1);
         __fixtureRecord("frame-input","buffer=" + _global.__fixtureFrameBuffer + ";actual=" + _global.__fixtureFrameTarget._currentframe);
         _root.__fixtureShowFrameInput("type digits, Enter to commit: " + _global.__fixtureFrameBuffer);
         return;
      }
      if(keyCode == 27)
      {
         _global.__fixtureFrameBuffer = "";
         _root.__fixtureStatus._visible = false;
         __fixtureRecord("frame-overlay-hidden","actual=" + _global.__fixtureFrameTarget._currentframe + ";source=escape");
         return;
      }
      if(keyCode == 13)
      {
         var requestedFrame = _global.__fixtureFrameBuffer;
         _global.__fixtureFrameBuffer = "";
         _root.__fixtureRequestFrame(requestedFrame,"keyboard-enter");
      }
   };
   Key.addListener(_global.__fixtureFrameKeyListener);
   __fixtureRecord("frame-controller-ready","range=1-" + _global.__fixtureFrameCount + ";input=digits+enter");
   _root.__fixtureRequestFrame(1,"onLoadInit");
};

_root.__fixtureStart = function()
{
   if(_global.__fixtureLoadStarted)
   {
      return;
   }
   _global.__fixtureLoadStarted = true;
   _root.__fixturePrepareSpanishContext();
   __fixtureRecord("child-load-request",_global.__fixtureChildPath);
   var listener = new Object();
   listener.onLoadError = function(target,errorCode,httpStatus)
   {
      _global.__fixtureLoadError = errorCode + ":" + httpStatus;
      _root.__fixtureStatus.text = "LOAD BLOCKED/FAILED: " + _global.__fixtureLoadError;
      __fixtureRecord("child-load-error",_global.__fixtureLoadError);
   };
   listener.onLoadInit = function(target)
   {
      _global.__fixtureLoaded = true;
      _global.__fixtureChildLoadTimerMs = getTimer();
      _root.__fixtureStatus._visible = false;
      delete _root.onMouseDown;
      __fixtureRecord("child-load-init",_global.__fixtureChildPath);
      __fixtureRecord("expected-spanish-visual","Mc_SD-visible-from-child-frame-1-condition");
      _root.__fixtureInstallFrameController(target);
   };
   _global.__fixtureLoader = new MovieClipLoader();
   _global.__fixtureLoader.addListener(listener);
   _global.__fixtureLoader.loadClip(_global.__fixtureChildPath,_root.Mc_FormulaDEF);
};

_root.onMouseDown = function()
{
   _root.__fixtureStart();
};

__fixtureRecord("fixture-ready",_global.__fixtureDigest);
stop();
`;
}

export function renderBaseSwfXml(stage = NATIVE_STAGE, fps = FPS, background = BACKGROUND) {
  const right = Number(stage.width) * 20;
  const bottom = Number(stage.height) * 20;
  if (!Number.isInteger(right) || !Number.isInteger(bottom) || right <= 0 || bottom <= 0) throw new Error("invalid native stage");
  return `<?xml version="1.0" encoding="UTF-8"?>
<swf version="8" compressed="1">
  <Header framerate="${Number(fps)}" frames="1">
    <size><Rectangle left="0" right="${right}" top="0" bottom="${bottom}"/></size>
    <tags>
      <SetBackgroundColor><color><Color red="${background.red}" green="${background.green}" blue="${background.blue}"/></color></SetBackgroundColor>
      <DoAction><actions><Stop/><EndAction/></actions></DoAction>
      <ShowFrame/>
      <End/>
    </tags>
  </Header>
</swf>
`;
}

function sandboxQuote(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function renderSandboxProfile({fixtureRoot, temporaryRoot}) {
  return `(version 1)
(allow default)
(deny network*)
(deny appleevent-send)
(deny mach-lookup
  (require-any
    (global-name "com.apple.lsd.open")
    (global-name "com.apple.lsd.modifydb")
    (global-name-regex #"^com\\.apple\\.lsd\\.")))
(deny file-write*
  (require-all
    (require-not (subpath ${sandboxQuote(fixtureRoot)}))
    (require-not (subpath ${sandboxQuote(temporaryRoot)}))
    (require-not (literal "/dev/null"))))
`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function probeSandboxProfile({profilePath, directory}) {
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/true"]);
  const insidePath = path.join(directory, "sandbox-write-probe.txt");
  await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf fixture-write-allowed > \"$1\"", "fixture-probe", insidePath]);
  if (await readFile(insidePath, "utf8") !== "fixture-write-allowed") throw new Error("sandbox did not permit fixture write probe");
  const outsidePath = `${directory}-sandbox-outside-write-must-not-exist`;
  if (await exists(outsidePath)) throw new Error(`outside-write probe path already exists: ${outsidePath}`);
  let outsideWriteDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/bin/sh", "-c", "printf forbidden > \"$1\"", "fixture-probe", outsidePath]);
  } catch {
    outsideWriteDenied = true;
  }
  if (!outsideWriteDenied || await exists(outsidePath)) throw new Error("sandbox allowed an out-of-bound write");
  let connected = false;
  const server = createServer((socket) => {
    connected = true;
    socket.end();
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  let networkDenied = false;
  try {
    await run("/usr/bin/sandbox-exec", ["-f", profilePath, "/usr/bin/nc", "-w", "1", "127.0.0.1", String(server.address().port)], {timeoutMs: 5_000});
  } catch {
    networkDenied = true;
  } finally {
    await closeServer(server);
  }
  if (!networkDenied || connected) throw new Error("sandbox allowed a local TCP connection");
  return {insidePath, outsideWriteDenied: true, localTcpDenied: true, syntaxSmokeTest: "passed"};
}

async function compileHost({directory, hostSource, baseXml, toolchain, frameCount}) {
  const baseXmlPath = path.join(directory, "host-base.xml");
  const baseSwfPath = path.join(directory, "host-base.swf");
  const scriptsRoot = path.join(directory, "as-import", "scripts");
  const actionPath = path.join(scriptsRoot, "frame_1", "DoAction.as");
  const firstPath = path.join(directory, "host-build-a.swf");
  const secondPath = path.join(directory, "host-build-b.swf");
  const hostPath = path.join(directory, "host.swf");
  const exportRoot = path.join(directory, "compiled-host-export");
  const decompiledPath = path.join(directory, "compiled-host-decompiled.as");
  await mkdir(path.dirname(actionPath), {recursive: true});
  await Promise.all([writeFile(baseXmlPath, baseXml, "utf8"), writeFile(actionPath, hostSource, "utf8")]);
  await run(toolchain.swfmill.path, ["xml2swf", baseXmlPath, baseSwfPath]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, firstPath, scriptsRoot]);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-importScript", baseSwfPath, secondPath, scriptsRoot]);
  const [firstHash, secondHash] = await Promise.all([sha256File(firstPath), sha256File(secondPath)]);
  if (firstHash !== secondHash) throw new Error(`non-deterministic fixture compilation: ${firstHash} != ${secondHash}`);
  await copyFile(firstPath, hostPath);
  await run(toolchain.ffdec.path, ["-onerror", "abort", "-export", "script", exportRoot, hostPath]);
  const exported = path.join(exportRoot, "scripts", "frame_1", "DoAction.as");
  const decompiled = await readFile(exported, "utf8");
  const requiredControllerMarkers = [
    "HELP_FORMULA_FIXTURE",
    "dtfSpanishFormulas",
    "child-load-request",
    `_global.__fixtureFrameCount = ${Number(frameCount)};`,
    "__fixtureInstallFrameController",
    "__fixtureRequestFrame",
    "frame-controller-ready",
    "requested=",
    "actual=",
    "READY requested=",
    "frame-overlay-hidden",
    "gotoAndStop",
    "Key.addListener",
  ];
  for (const marker of requiredControllerMarkers) {
    if (!decompiled.includes(marker)) throw new Error(`compiled host is missing required language/frame-controller marker: ${marker}`);
  }
  if (BLOCKED_PRIMITIVES.test(decompiled)) throw new Error("compiled host contains a blocked primitive");
  if (/https?:\/\//i.test(decompiled) || /\b(?:loadSound|new\s+Sound)\s*\(/i.test(decompiled)) {
    throw new Error("compiled host contains a blocked network or audio primitive");
  }
  await writeFile(decompiledPath, decompiled, "utf8");
  return {
    hostPath,
    hostSha256: firstHash,
    baseXmlPath,
    baseSwfPath,
    actionPath,
    firstPath,
    secondPath,
    exported,
    decompiledPath,
    decompiledSha256: await sha256File(decompiledPath),
    frameControllerProof: {
      frameCount: Number(frameCount),
      oneIndexedRange: {minimum: 1, maximum: Number(frameCount)},
      installGate: "MovieClipLoader.onLoadInit",
      initialFreezeFrame: 1,
      input: "decimal digits plus Enter",
      resultPrompt: "visible requested/actual READY result; Escape hides overlay without changing frame",
      resultEventFields: ["requested", "actual", "source"],
      autoplayAfterLoad: false,
    },
    deterministicDoubleBuild: true,
  };
}

async function copyVerified(relativeSource, destination, expectedSha256) {
  const source = path.join(projectRoot, relativeSource);
  if (await sha256File(source) !== expectedSha256) throw new Error(`${relativeSource}: source hash mismatch before copy`);
  await mkdir(path.dirname(destination), {recursive: true});
  if (await exists(destination)) {
    if (await sha256File(destination) !== expectedSha256) throw new Error(`${destination}: existing dependency hash mismatch`);
  } else await copyFile(source, destination);
  if (await sha256File(destination) !== expectedSha256) throw new Error(`${destination}: copied dependency hash mismatch`);
  return destination;
}

function renderLauncher({manifestPath, profilePath, hostPath, smokeOnly = false}) {
  const verification = smokeOnly
    ? `echo "GUI sandbox smoke only: verify the pre-load screen and DO NOT CLICK the stage."\nnode ${JSON.stringify(scriptPath)} --verify-fixture ${JSON.stringify(manifestPath)}`
    : `node ${JSON.stringify(scriptPath)} --verify-launch ${JSON.stringify(manifestPath)}`;
  return `#!/bin/sh
set -eu
${verification}
exec /usr/bin/sandbox-exec -f ${JSON.stringify(profilePath)} ${JSON.stringify(flashPlayerPath)} ${JSON.stringify(hostPath)}
`;
}

function renderSmokeTemplate(specification, fixtureDigest) {
  return stableJson({
    schemaVersion: 1,
    animationId: specification.animationId,
    fixtureDigest,
    status: "replace-with-passed-after-observed-sandboxed-pre-load-smoke",
    reviewer: "",
    reviewedAt: "",
    evidenceFile: "capture/replace-with-app-window-smoke-evidence.jpg",
    evidenceMimeType: "image/jpeg",
    evidenceSha256: "",
    observation: "Flash Player opened through smoke-sandboxed.sh, showed only this fixture's pre-load screen, and no child was loaded or clicked. This safety screenshot is not a visual-fidelity baseline.",
  });
}

function renderReadme(specification) {
  return `# ${specification.animationId} Spanish visual-context fixture

This content-addressed AVM1 parent creates the source-evidenced root field \`dtfSpanishFormulas.text = "ON"\` before lazily loading one untouched, hash-verified formula SWF at its native 780x379 stage.

It is not the original indexELM shell, does not claim the shell's external default value, and excludes formula audio. The four preserved indexELM variants are static evidence only; none is copied or executed.

1. Run \`./smoke-sandboxed.sh\` and **do not click**. Record and hash an app-window safety screenshot.
2. Complete \`capture/sandbox-gui-smoke-test.json\` from the template.
3. Run the generated manifest's verify-launch command.
4. Launch only through \`./launch-sandboxed.sh\`, click exactly once, and confirm the Spanish panel from runtime output before capturing frames.
5. After \`frame-controller-ready\`, type a one-indexed decimal frame and press Enter. Accept a capture only when the visible READY result and trace record equal \`requested\` and \`actual\` values. Backspace edits; Escape clears the buffer and hides the overlay without changing the child frame.

The untouched child is frozen at frame 1 from \`onLoadInit\`; the parent never calls \`play()\`. Network, audio loading, Apple Events, LaunchServices open/database operations, and writes outside this fixture/OS temp are denied. Generation and GUI smoke do not satisfy baseline, audio, RMSE, human-review, owner-acceptance, or migration-completion gates.
`;
}

async function buildOne({pilot, childAudit, hostAudits, hostEquivalence, outputRoot, toolchain, compile}) {
  const specification = buildFixtureSpecification({pilot, childAudit, hostAudits, hostEquivalence});
  const fixtureDigest = sha256Text(stableJson(specification));
  const directory = path.join(outputRoot, "generated", pilot.animationId, fixtureDigest.slice(0, 24));
  await mkdir(directory, {recursive: true});
  const specPath = path.join(directory, "fixture-spec.json");
  const hostSourcePath = path.join(directory, "host.as");
  const stagedChild = path.join(directory, specification.source.stagedChildPath);
  const hostSource = renderHostActionScript(specification, fixtureDigest);
  await Promise.all([
    writeFile(specPath, stableJson({...specification, fixtureDigest}), "utf8"),
    writeFile(hostSourcePath, hostSource, "utf8"),
    copyVerified(pilot.source, stagedChild, pilot.sourceSha256),
  ]);
  const compileResult = compile ? await compileHost({
    directory,
    hostSource,
    baseXml: renderBaseSwfXml(),
    toolchain,
    frameCount: specification.source.frameCount,
  }) : null;
  const profilePath = path.join(directory, "sandbox.sb");
  await writeFile(profilePath, renderSandboxProfile({fixtureRoot: await realpath(directory), temporaryRoot: await realpath(os.tmpdir())}), "utf8");
  const sandboxProbe = await probeSandboxProfile({profilePath, directory});
  const readmePath = path.join(directory, "README.md");
  await writeFile(readmePath, renderReadme(specification), "utf8");
  const manifestPath = path.join(directory, "fixture-manifest.json");
  const launcherPath = path.join(directory, "launch-sandboxed.sh");
  const smokePath = path.join(directory, "smoke-sandboxed.sh");
  const smokeTemplatePath = path.join(directory, "sandbox-gui-smoke-test.template.json");
  const hostPath = compileResult?.hostPath || path.join(directory, "host.swf");
  await Promise.all([
    writeFile(launcherPath, renderLauncher({manifestPath, profilePath, hostPath}), "utf8"),
    writeFile(smokePath, renderLauncher({manifestPath, profilePath, hostPath, smokeOnly: true}), "utf8"),
    writeFile(smokeTemplatePath, renderSmokeTemplate(specification, fixtureDigest), "utf8"),
  ]);
  await Promise.all([chmod(launcherPath, 0o755), chmod(smokePath, 0o755)]);
  const generatedFiles = [specPath, hostSourcePath, stagedChild, profilePath, sandboxProbe.insidePath, readmePath, launcherPath, smokePath, smokeTemplatePath];
  if (compileResult) generatedFiles.push(
    compileResult.hostPath,
    compileResult.baseXmlPath,
    compileResult.baseSwfPath,
    compileResult.actionPath,
    compileResult.firstPath,
    compileResult.secondPath,
    compileResult.exported,
    compileResult.decompiledPath,
  );
  const generatedFileHashes = [];
  for (const candidate of generatedFiles) {
    generatedFileHashes.push({path: portable(path.relative(directory, candidate)), sha256: await sha256File(candidate)});
  }
  generatedFileHashes.sort((left, right) => compareText(left.path, right.path));
  const manifest = {
    schemaVersion: 1,
    animationId: pilot.animationId,
    fixtureDigest,
    generatedBy: portable(path.relative(projectRoot, scriptPath)),
    generatedBySha256: await sha256File(scriptPath),
    directory: portable(path.relative(projectRoot, directory)),
    source: specification.source,
    originalHostEvidence: specification.originalHostEvidence,
    compilation: compileResult ? {
      status: "compiled-deterministic-double-build",
      hostSha256: compileResult.hostSha256,
      decompiledHostSha256: compileResult.decompiledSha256,
      frameControllerProof: compileResult.frameControllerProof,
      toolchain: {ffdec: toolchain.ffdec, swfmill: toolchain.swfmill},
    } : {status: "not-compiled"},
    sandbox: {
      syntaxSmokeTest: sandboxProbe.syntaxSmokeTest,
      outsideWriteDenied: sandboxProbe.outsideWriteDenied,
      localTcpDenied: sandboxProbe.localTcpDenied,
      networkDenied: true,
      appleEventsDenied: true,
      launchServicesOpenAndDatabaseDenied: true,
      adobeGuiSmokeTest: "pending-not-run-by-non-gui-factory",
    },
    guiSmokeAuthorization: {
      smokeLauncher: "smoke-sandboxed.sh",
      rule: "do not click the lazy pre-load stage during smoke",
      requiredApproval: "capture/sandbox-gui-smoke-test.json",
      template: "sandbox-gui-smoke-test.template.json",
    },
    launchPolicy: compile ? "launch-only-through-launch-sandboxed.sh-after-hash-verified-gui-smoke" : "blocked-host-not-compiled",
    generatedFileHashes,
    strictAcceptanceEffect: specification.strictAcceptanceEffect,
  };
  await writeFile(manifestPath, stableJson(manifest), "utf8");
  return {directory, manifestPath, manifest, specification};
}

export async function verifyFixtureManifest(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const directory = path.dirname(manifestPath);
  const errors = [];
  const expectedFiles = new Set((manifest.generatedFileHashes || []).map((item) => portable(item.path)));
  const expectedHashes = new Map((manifest.generatedFileHashes || []).map((item) => [portable(item.path), item.sha256]));
  if (expectedFiles.size !== (manifest.generatedFileHashes || []).length) errors.push("generatedFileHashes contains duplicate paths");
  for (const item of manifest.generatedFileHashes || []) {
    const candidate = path.resolve(directory, item.path);
    const relative = path.relative(directory, candidate);
    if (relative.startsWith("..") || path.isAbsolute(relative)) errors.push(`${item.path}: escapes fixture directory`);
    else if (!(await exists(candidate))) errors.push(`${item.path}: missing`);
    else if (await sha256File(candidate) !== item.sha256) errors.push(`${item.path}: hash mismatch`);
  }
  if (manifest.generatedBySha256 !== await sha256File(scriptPath)) errors.push("fixture generator hash differs; rebuild before launch");
  const walk = async (root, prefix = "") => {
    for (const entry of await readdir(root, {withFileTypes: true})) {
      const relative = portable(path.join(prefix, entry.name));
      if (relative === "capture" || relative.startsWith("capture/")) continue;
      if (entry.isDirectory()) await walk(path.join(root, entry.name), relative);
      else if (entry.isSymbolicLink()) errors.push(`${relative}: symbolic links are forbidden`);
      else if (relative !== "fixture-manifest.json" && !expectedFiles.has(relative)) errors.push(`${relative}: unlisted fixture file`);
    }
  };
  await walk(directory);
  const knownPilot = FORMULA_PILOTS.find((item) => item.animationId === manifest.animationId);
  if (knownPilot) {
    const requiredFiles = [
      "fixture-spec.json",
      "host.as",
      "host.swf",
      "compiled-host-decompiled.as",
      "sandbox.sb",
      "launch-sandboxed.sh",
      "smoke-sandboxed.sh",
      "sandbox-gui-smoke-test.template.json",
      `formula/${knownPilot.sourceBasename}`,
    ];
    for (const required of requiredFiles) {
      if (!expectedFiles.has(required)) errors.push(`${required}: required generated file is not hash-listed`);
    }
    if (expectedFiles.has("fixture-spec.json")) {
      const fixtureSpec = JSON.parse(await readFile(path.join(directory, "fixture-spec.json"), "utf8"));
      const {fixtureDigest, ...specification} = fixtureSpec;
      const calculatedDigest = sha256Text(stableJson(specification));
      if (fixtureDigest !== calculatedDigest) errors.push("fixture-spec digest does not match its canonical content");
      if (manifest.fixtureDigest !== calculatedDigest) errors.push("manifest fixtureDigest does not match fixture-spec content");
      if (fixtureSpec.animationId !== manifest.animationId) errors.push("fixture-spec animationId mismatch");
      if (fixtureSpec.source?.childSwfSha256 !== knownPilot.sourceSha256) errors.push("fixture-spec child source hash mismatch");
      if (fixtureSpec.source?.stagedChildPath !== `formula/${knownPilot.sourceBasename}`) errors.push("fixture-spec staged child path mismatch");
      const controller = fixtureSpec.deterministicFrameControl;
      if (controller?.status !== "explicit-one-indexed-after-child-onLoadInit"
        || controller?.frameCount !== knownPilot.frameCount
        || controller?.validRange?.minimum !== 1
        || controller?.validRange?.maximum !== knownPilot.frameCount
        || controller?.initialFreezeFrame !== 1
        || controller?.autoplayAfterLoad !== false
        || controller?.installGate !== "MovieClipLoader.onLoadInit only"
        || controller?.input?.visibleRequestedActualResultBeforeCapture !== true
        || controller?.input?.captureOverlayHideKey !== "Escape") {
        errors.push("fixture-spec deterministic frame-controller contract mismatch");
      }
    }
    const stagedChildPath = `formula/${knownPilot.sourceBasename}`;
    if (expectedFiles.has(stagedChildPath) && await sha256File(path.join(directory, stagedChildPath)) !== knownPilot.sourceSha256) {
      errors.push("staged untouched child hash does not match the source-pinned formula SWF");
    }
    if (expectedHashes.get(stagedChildPath) !== knownPilot.sourceSha256) errors.push("staged child manifest hash is not source-pinned");
    if (expectedFiles.has("host.as")) {
      const hostSource = await readFile(path.join(directory, "host.as"), "utf8");
      const activationCalls = hostSource.match(/_root\.__fixtureStart\(\);/g) || [];
      if (!hostSource.includes("_root.onMouseDown = function()") || activationCalls.length !== 1) {
        errors.push("host source is not single-click user-activated");
      }
      if (!hostSource.includes(`_global.__fixtureChildPath = ${asString(`formula/${knownPilot.sourceBasename}`)}`)) {
        errors.push("host source does not pin the expected local child path");
      }
      const controllerMarkers = [
        `_global.__fixtureFrameCount = ${knownPilot.frameCount};`,
        "_root.__fixtureRequestFrame = function(requested,requestSource)",
        "_root.__fixtureInstallFrameController = function(target)",
        "_global.__fixtureFrameTarget.gotoAndStop(frameNumber);",
        "_global.__fixtureFrameTarget.stop();",
        "Key.addListener(_global.__fixtureFrameKeyListener);",
        '__fixtureRecord("frame-controller-ready"',
        '__fixtureRecord("frame-control","requested=" + frameNumber + ";actual=" + actual + ";source=" + requestSource);',
        '"READY requested=" + frameNumber + " actual=" + actual',
        '__fixtureRecord("frame-overlay-hidden"',
        '_root.__fixtureRequestFrame(1,"onLoadInit");',
      ];
      for (const marker of controllerMarkers) {
        if (!hostSource.includes(marker)) errors.push(`host source is missing deterministic frame-controller proof: ${marker}`);
      }
      const installCalls = hostSource.match(/_root\.__fixtureInstallFrameController\(target\);/g) || [];
      const loadInitIndex = hostSource.indexOf("listener.onLoadInit = function(target)");
      const installCallIndex = hostSource.indexOf("_root.__fixtureInstallFrameController(target);");
      if (installCalls.length !== 1 || loadInitIndex < 0 || installCallIndex < loadInitIndex) {
        errors.push("frame controller is not installed exactly once from child onLoadInit");
      }
      if (/\.play\s*\(/.test(hostSource)) errors.push("host source contains an autoplay call");
      if (BLOCKED_PRIMITIVES.test(hostSource) || /https?:\/\//i.test(hostSource) || /\b(?:loadSound|new\s+Sound)\s*\(/i.test(hostSource)) {
        errors.push("host source contains a blocked network, bridge, or audio primitive");
      }
    }
    if (expectedFiles.has("compiled-host-decompiled.as")) {
      const decompiled = await readFile(path.join(directory, "compiled-host-decompiled.as"), "utf8");
      const decompiledMarkers = [
        `_global.__fixtureFrameCount = ${knownPilot.frameCount};`,
        "__fixtureRequestFrame",
        "__fixtureInstallFrameController",
        "gotoAndStop",
        "Key.addListener",
        "frame-controller-ready",
        "READY requested=",
        "frame-overlay-hidden",
        "requested=",
        "actual=",
      ];
      for (const marker of decompiledMarkers) {
        if (!decompiled.includes(marker)) errors.push(`decompiled host is missing deterministic frame-controller proof: ${marker}`);
      }
      if (BLOCKED_PRIMITIVES.test(decompiled) || /https?:\/\//i.test(decompiled) || /\b(?:loadSound|new\s+Sound)\s*\(/i.test(decompiled)) {
        errors.push("decompiled host contains a blocked network, bridge, or audio primitive");
      }
      if (manifest.compilation?.decompiledHostSha256 !== await sha256File(path.join(directory, "compiled-host-decompiled.as"))) {
        errors.push("decompiled host hash does not match manifest compilation record");
      }
    }
    if (expectedFiles.has("sandbox.sb")) {
      const sandbox = await readFile(path.join(directory, "sandbox.sb"), "utf8");
      for (const rule of ["(deny network*)", "(deny appleevent-send)", "(deny file-write*"]) {
        if (!sandbox.includes(rule)) errors.push(`sandbox is missing required rule: ${rule}`);
      }
    }
    if (expectedFiles.has("host.swf") && manifest.compilation?.hostSha256 !== await sha256File(path.join(directory, "host.swf"))) {
      errors.push("compiled host hash does not match manifest compilation record");
    }
    const frameControllerProof = manifest.compilation?.frameControllerProof;
    if (frameControllerProof?.frameCount !== knownPilot.frameCount
      || frameControllerProof?.oneIndexedRange?.minimum !== 1
      || frameControllerProof?.oneIndexedRange?.maximum !== knownPilot.frameCount
      || frameControllerProof?.installGate !== "MovieClipLoader.onLoadInit"
      || frameControllerProof?.initialFreezeFrame !== 1
      || !String(frameControllerProof?.resultPrompt || "").includes("visible requested/actual READY result")
      || frameControllerProof?.autoplayAfterLoad !== false) {
      errors.push("manifest compilation frame-controller proof mismatch");
    }
    if (manifest.launchPolicy !== "launch-only-through-launch-sandboxed.sh-after-hash-verified-gui-smoke") {
      errors.push("launch policy is not fail-closed on GUI smoke authorization");
    }
  }
  if (errors.length) throw new Error(`${manifest.animationId || manifestPath}: ${errors.join("; ")}`);
  return manifest;
}

export async function verifyLaunchAuthorization(manifestPath) {
  const manifest = await verifyFixtureManifest(manifestPath);
  const directory = path.dirname(manifestPath);
  const relativeApproval = manifest.guiSmokeAuthorization?.requiredApproval;
  if (relativeApproval !== "capture/sandbox-gui-smoke-test.json") throw new Error(`${manifest.animationId}: unsupported GUI approval path`);
  const approvalPath = path.join(directory, relativeApproval);
  if (!(await exists(approvalPath))) throw new Error(`${manifest.animationId}: GUI sandbox smoke evidence is pending`);
  const approval = JSON.parse(await readFile(approvalPath, "utf8"));
  const errors = [];
  if (approval.animationId !== manifest.animationId) errors.push("animationId mismatch");
  if (approval.fixtureDigest !== manifest.fixtureDigest) errors.push("fixtureDigest mismatch");
  if (approval.status !== "passed") errors.push("status must be passed");
  if (typeof approval.reviewer !== "string" || !approval.reviewer.trim()) errors.push("reviewer is required");
  if (typeof approval.reviewedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(approval.reviewedAt)) errors.push("reviewedAt must be ISO");
  if (typeof approval.evidenceFile !== "string" || !approval.evidenceFile.startsWith("capture/") || approval.evidenceFile.includes("..")) errors.push("evidenceFile must stay under capture/");
  if (!["image/jpeg", "image/png"].includes(approval.evidenceMimeType)) errors.push("evidenceMimeType must be image/jpeg or image/png");
  if (!/^[a-f0-9]{64}$/.test(approval.evidenceSha256 || "")) errors.push("evidenceSha256 must be SHA-256");
  if (typeof approval.observation !== "string" || !approval.observation.includes("no child was loaded")) errors.push("observation must confirm no child was loaded");
  if (!errors.length) {
    const evidencePath = path.resolve(directory, approval.evidenceFile);
    const relative = path.relative(path.join(directory, "capture"), evidencePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) errors.push("evidenceFile escapes capture/");
    else if (!(await exists(evidencePath))) errors.push("evidenceFile is missing");
    else if (await sha256File(evidencePath) !== approval.evidenceSha256) errors.push("evidenceFile hash mismatch");
    else if (!(await evidenceMimeMatches(evidencePath, approval.evidenceMimeType))) errors.push("evidenceFile bytes do not match evidenceMimeType");
  }
  if (errors.length) throw new Error(`${manifest.animationId}: GUI smoke approval invalid: ${errors.join("; ")}`);
  return {manifest, approval};
}

export async function buildAdobeFormulaSpanishHostFixtures(options = {}) {
  const outputRoot = path.resolve(options.outputRoot || defaultOutputRoot);
  const reportPath = path.resolve(options.reportPath || defaultReportPath);
  const ids = options.ids?.length ? options.ids : FORMULA_PILOTS.map((item) => item.animationId);
  const pilots = ids.map((id) => {
    const pilot = FORMULA_PILOTS.find((item) => item.animationId === id);
    if (!pilot) throw new Error(`unknown formula pilot: ${id}`);
    return pilot;
  });
  const toolchain = await probeToolchain();
  if (!toolchain.canAudit) throw new Error("FFDec, swfmill, and Python 3 are required for formula host evidence audit");
  if (options.compile !== false && !toolchain.canCompile) throw new Error("FFDec and swfmill are required to compile fixtures");
  await mkdir(outputRoot, {recursive: true});
  const hostAudits = [];
  for (const host of INDEX_ELM_HOSTS) hostAudits.push(await auditHostVariant(host, toolchain));
  const hostEquivalence = validateEquivalentHostContracts(hostAudits);
  const childAudits = [];
  for (const pilot of pilots) childAudits.push(await auditChild(pilot, toolchain));
  const fixtures = [];
  for (const pilot of pilots) {
    fixtures.push(await buildOne({
      pilot,
      childAudit: childAudits.find((item) => item.animationId === pilot.animationId),
      hostAudits,
      hostEquivalence,
      outputRoot,
      toolchain,
      compile: options.compile !== false,
    }));
  }
  const report = {
    schemaVersion: 1,
    generatedBy: portable(path.relative(projectRoot, scriptPath)),
    generatedBySha256: await sha256File(scriptPath),
    scope: "static-indexelm-contract-and-safe-spanish-visual-fixture-construction",
    toolchain,
    hostAudits,
    hostEquivalence,
    childAudits,
    fixtures: fixtures.map((item) => ({
      animationId: item.manifest.animationId,
      fixtureDigest: item.manifest.fixtureDigest,
      manifest: portable(path.relative(projectRoot, item.manifestPath)),
      hostSha256: item.manifest.compilation.hostSha256 || null,
      decompiledHostSha256: item.manifest.compilation.decompiledHostSha256 || null,
      frameControllerProof: item.manifest.compilation.frameControllerProof || null,
      guiSmokeStatus: item.manifest.sandbox.adobeGuiSmokeTest,
      launchPolicy: item.manifest.launchPolicy,
    })),
    conclusions: [
      "All four formula children have the same hash-verified frame-1 Spanish visibility condition and no additional unresolved host-provided visual binding.",
      "All four preserved indexELM variants expose the same root dynamic-text, formula selection, SWF path, and ON-language contract.",
      "No recovered indexELM ActionScript assigns the SpanishFormulas value; ON is an explicit Spanish scenario input, not a recovered original default.",
      "Each compiled fixture installs a source-frameCount-bound one-indexed controller only from child onLoadInit, freezes frame 1, accepts decimal digits plus Enter, and records requested/actual/source for every committed request.",
      "The fixture is eligible only for a controlled Spanish child-runtime probe after GUI smoke. Generation is not a baseline, RMSE result, audio acceptance, human review, owner acceptance, or completion claim.",
    ],
    unresolvedGates: [
      "sandboxed Adobe GUI smoke for each content-addressed fixture",
      "runtime confirmation that Mc_SD is visible after exact child load",
      "runtime confirmation that frame-controller-ready is emitted and every capture request reports requested equal to actual",
      "all-frame Spanish Adobe capture and archive hashes",
      "Spanish implementation comparison and RMSE",
      "formula English/Spanish audio listening, activation, completion, and synchronization",
      "human visual review and owner acceptance",
    ],
    strictAcceptanceEffect: "none",
  };
  await mkdir(path.dirname(reportPath), {recursive: true});
  await writeFile(reportPath, stableJson(report), "utf8");
  const index = {
    schemaVersion: 1,
    generatedBy: report.generatedBy,
    generatedBySha256: report.generatedBySha256,
    report: portable(path.relative(projectRoot, reportPath)),
    reportSha256: await sha256File(reportPath),
    fixtureCount: fixtures.length,
    fixtures: report.fixtures,
    authority: "static source evidence and safe fixture construction only; Adobe Player was not launched",
  };
  const indexPath = path.join(outputRoot, "manifest.json");
  await writeFile(indexPath, stableJson(index), "utf8");
  return {reportPath, indexPath, report, index, fixtures};
}

function usage() {
  return `Usage:
  node scripts/build-adobe-formula-spanish-host-fixtures.mjs [--id <formula-pilot>] [--output <dir>] [--report <json>] [--no-compile]
  node scripts/build-adobe-formula-spanish-host-fixtures.mjs --verify-fixture <fixture-manifest.json>
  node scripts/build-adobe-formula-spanish-host-fixtures.mjs --verify-launch <fixture-manifest.json>

Builds safe, lazy, content-addressed AVM1 parents that provide the source-evidenced Spanish root field to one untouched formula child. It never launches Adobe Player or an original indexELM shell.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) console.log(usage());
    else if (options.verifyFixture) {
      const manifest = await verifyFixtureManifest(options.verifyFixture);
      console.log(`Verified fixture ${manifest.animationId}: ${manifest.fixtureDigest}`);
    } else if (options.verifyLaunch) {
      const result = await verifyLaunchAuthorization(options.verifyLaunch);
      console.log(`Verified GUI sandbox smoke approval for ${result.manifest.animationId}: ${result.approval.reviewer}`);
    } else {
      const result = await buildAdobeFormulaSpanishHostFixtures(options);
      console.log(`Built ${result.index.fixtureCount} formula Spanish-context fixtures: ${portable(path.relative(projectRoot, result.indexPath))}`);
      console.log(`Static evidence report: ${portable(path.relative(projectRoot, result.reportPath))}`);
    }
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}
