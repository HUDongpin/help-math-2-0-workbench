#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");

export const ANIMATION_ID = "shell-course-g04-l03-index-local";
export const EXPECTED_SHELL_SHA256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
export const DISPOSITIONS = Object.freeze([
  "local-nextjs-navigation-data-candidate",
  "disabled-legacy-side-effect",
  "unresolved-source-expression",
  "human-runtime-evidence-required",
]);

const REPORT_VERSION = 1;
const SHELL_PATH = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf";
const INPUT_PATHS = Object.freeze({
  productContract: "reports/g4-l3-lesson-product-navigation-contract.json",
  machineAudit: "reports/g4-l3-machine-source-audits.json",
  staticEventIndex: "reports/g4-l3-static-source-event-index.json",
  ruffleMatrix: "reports/g4-l3-ruffle-reference-matrix.json",
});
const OUTPUT_PATHS = Object.freeze({
  json: "reports/g4-l3-shell-legacy-host-dependency-contract.json",
  markdown: "reports/g4-l3-shell-legacy-host-dependency-contract.md",
});

const API_DEFINITIONS = Object.freeze([
  {api: "loadMovie", regex: /\bloadMovie\s*\(/g},
  {api: "XML.load", regex: /\bF_X\.load\s*\(/g},
  {api: "Sound.loadSound", regex: /\.loadSound\s*\(/g},
  {api: "fscommand", regex: /\bfscommand\s*\(/g},
  {api: "SharedObject.getLocal", regex: /\bSharedObject\.getLocal\s*\(/g},
  {api: "getURL", regex: /\bgetURL\s*\(/g},
  {api: "loadVariablesNum", regex: /\bloadVariablesNum\s*\(/g},
]);

const EXPECTED_STATIC_API_COUNTS = Object.freeze({
  "Sound.loadSound": 1,
  "SharedObject.getLocal": 1,
  "XML.load": 2,
  "fscommand": 5,
  "getURL": 3,
  "loadMovie": 5,
  "loadVariablesNum": 3,
});

const SUPPORTING_LINE_DEFINITIONS = Object.freeze([
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 842, token: "myCookie.data"},
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 844, token: "myCookie.data"},
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 864, token: "myCookie.clear"},
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 875, token: "SPLDATA"},
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 880, token: "myCookie.data"},
  {group: "bookmark-state", scriptPath: "frame_35/DoAction.as", lineNumber: 881, token: "myCookie.flush"},
  {group: "child-load", scriptPath: "frame_35/DoAction.as", lineNumber: 1005, token: "playSwfFileName"},
  {group: "spanish-audio", scriptPath: "frame_35/DoAction.as", lineNumber: 2178, token: "playSwfFileName.split"},
  {group: "spanish-audio", scriptPath: "frame_35/DoAction.as", lineNumber: 2181, token: '"/SA/"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 2677, token: '"DIG/"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 2688, token: '"XML/ELKTEG4.xml"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 2995, token: '"DIG/"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 3045, token: '"XML/ELKTSG4.xml"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 3063, token: '"XML/ELKTEG4.xml"'},
  {group: "keyterm-data", scriptPath: "frame_35/DoAction.as", lineNumber: 3309, token: '"DIG/"'},
  {group: "embedded-shell-sequence", scriptPath: "frame_35/DoAction.as", lineNumber: 3321, token: "LessonDetails ="},
  {group: "lesson-root", scriptPath: "frame_35/DoAction.as", lineNumber: 3468, token: "_root._url"},
  {group: "lesson-root", scriptPath: "frame_35/DoAction.as", lineNumber: 3469, token: 'split("index")'},
  {group: "lesson-root", scriptPath: "frame_35/DoAction.as", lineNumber: 3470, token: "_global.tempURL"},
  {group: "lesson-root", scriptPath: "frame_35/DoAction.as", lineNumber: 3471, token: "_global.xmlPath"},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 12, token: "_root.Report_URL"},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 13, token: "SPLDATA"},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 14, token: "&Book_Mark="},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 70, token: "_loc2_.Report_URL"},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 71, token: "SPLDATA"},
  {group: "telemetry", scriptPath: "DefineSprite_155/frame_15/DoAction.as", lineNumber: 72, token: "&Bookmark_URL="},
  {group: "telemetry", scriptPath: "DefineButton2_556/BUTTONCONDACTION on(release).as", lineNumber: 3, token: "_root.Report_URL"},
  {group: "telemetry", scriptPath: "DefineButton2_556/BUTTONCONDACTION on(release).as", lineNumber: 4, token: "SPLDATA"},
  {group: "telemetry", scriptPath: "DefineButton2_556/BUTTONCONDACTION on(release).as", lineNumber: 5, token: "&Bookmark_URL="},
  {group: "telemetry", scriptPath: "DefineSprite_164/frame_5/DoAction.as", lineNumber: 1, token: "strQuiz_Report_URL"},
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort(compareText).map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function readJson(candidate) {
  return JSON.parse(await readFile(candidate, "utf8"));
}

async function fileBinding(root, relativePath) {
  const bytes = await readFile(path.join(root, relativePath));
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function walkFiles(root, current = "") {
  const directory = path.join(root, current);
  const entries = await readdir(directory, {withFileTypes: true});
  const files = [];
  for (const entry of entries.sort((left, right) => compareText(left.name, right.name))) {
    const next = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, next));
    else if (entry.isFile()) files.push(portable(next));
  }
  return files;
}

async function resolveExecutable(command) {
  const candidates = command.includes(path.sep)
    ? [path.resolve(command)]
    : (process.env.PATH || "").split(path.delimiter).filter(Boolean).map((directory) => path.join(directory, command));
  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return realpath(candidate);
    } catch {
      // Keep resolving the explicitly selected executable.
    }
  }
  throw new Error(`Executable not found: ${command}`);
}

async function inspectFfdec(command) {
  const launcher = await resolveExecutable(command);
  const {stdout, stderr} = await execFileAsync(command, ["-help"], {
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  const version = `${stdout}\n${stderr}`
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  invariant(/^JPEXS Free Flash Decompiler v\.?\d/.test(version || ""), "Unrecognized FFDec version output");
  const launcherBytes = await readFile(launcher);
  const jarPath = path.join(path.dirname(launcher), "ffdec.jar");
  const jarBytes = await readFile(jarPath);
  return {
    command,
    version,
    launcherSha256: sha256(launcherBytes),
    ffdecJarSha256: sha256(jarBytes),
  };
}

async function exportScripts({root, ffdec, shellPath}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-host-contract-"));
  try {
    const exportRoot = path.join(temporaryRoot, "export");
    await execFileAsync(ffdec, [
      "-onerror", "abort",
      "-timeout", "30",
      "-exportTimeout", "120",
      "-exportFileTimeout", "30",
      "-export", "script",
      exportRoot,
      path.join(root, shellPath),
    ], {
      timeout: 180_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const scriptsRoot = path.join(exportRoot, "scripts");
    const files = (await walkFiles(scriptsRoot)).filter((candidate) => candidate.toLowerCase().endsWith(".as"));
    return Promise.all(files.map(async (relativePath) => {
      const text = (await readFile(path.join(scriptsRoot, relativePath), "utf8"))
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      return {
        path: relativePath,
        text,
        bytes: Buffer.byteLength(text),
        sha256: sha256(text),
      };
    }));
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function summarizeExportedScripts(scripts) {
  const ordered = [...scripts].sort((left, right) => compareText(left.path, right.path));
  const manifest = ordered.map(({path: scriptRelativePath, bytes, sha256: scriptSha256}) => ({
    path: scriptRelativePath,
    bytes,
    sha256: scriptSha256,
  }));
  return {
    exportedScriptFileCount: ordered.length,
    normalizedBytes: ordered.reduce((sum, file) => sum + file.bytes, 0),
    contentManifestSha256: sha256(`${JSON.stringify(manifest, null, 2)}\n`),
    normalizedBundleSha256: sha256(ordered.map((file) => `${file.path}\0${file.text.length}\0${file.text}\0`).join("")),
    manifest,
  };
}

function occurrenceCountByApi(candidates) {
  const counts = {};
  for (const candidate of candidates) counts[candidate.api] = (counts[candidate.api] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareText(left, right)));
}

function sourceRole(candidate) {
  const {api, scriptPath: sourcePath, lineNumber} = candidate;
  if (api === "loadMovie" && sourcePath === "FScrollPaneSymbol.as") return "generic-scroll-pane-content-load";
  if (api === "loadMovie" && lineNumber === 1007) return "lesson-child-swf-load";
  if (api === "loadMovie") return "keyterm-diagram-swf-load";
  if (api === "XML.load" && lineNumber === 2243) return "keyterm-xml-load-primary";
  if (api === "XML.load") return "keyterm-xml-load-secondary";
  if (api === "Sound.loadSound") return "spanish-page-audio-load";
  if (api === "SharedObject.getLocal") return "local-bookmark-persistence";
  if (api === "fscommand" && sourcePath.includes("DefineButton2_151")) return "close-player-host-command";
  if (api === "fscommand") return "legacy-flash-player-host-setting";
  if (api === "getURL" && sourcePath.includes("DefineButton2_151")) return "javascript-parent-close";
  if (api === "getURL" && sourcePath.includes("DefineButton2_247")) return "javascript-student-help-window";
  if (api === "getURL") return "lesson-report-and-bookmark-request";
  if (api === "loadVariablesNum" && sourcePath.includes("DefineSprite_164")) return "final-quiz-report-request";
  if (api === "loadVariablesNum" && lineNumber === 16) return "failure-report-request";
  if (api === "loadVariablesNum") return "download-time-and-bookmark-report-request";
  throw new Error(`No role mapping for ${api} ${sourcePath}:${lineNumber}`);
}

function dispositionForStatic(candidate) {
  if (candidate.api === "loadMovie" && candidate.scriptPath === "FScrollPaneSymbol.as") {
    return "unresolved-source-expression";
  }
  if (candidate.api === "loadMovie" || candidate.api === "XML.load") {
    return "local-nextjs-navigation-data-candidate";
  }
  if (candidate.api === "Sound.loadSound" || candidate.api === "SharedObject.getLocal") {
    return "human-runtime-evidence-required";
  }
  return "disabled-legacy-side-effect";
}

function dispositionReasonForStatic(candidate) {
  const disposition = dispositionForStatic(candidate);
  if (disposition === "local-nextjs-navigation-data-candidate") {
    return candidate.api === "XML.load"
      ? "The source names lesson-local keyterm data; any modern read must resolve to reviewed local data without executing the legacy loader."
      : "The source names course-child or keyterm-diagram content; it is a candidate for reviewed local Next.js navigation/data resolution, not a route implementation.";
  }
  if (disposition === "unresolved-source-expression") {
    return "The generic component receives url from an unresolved caller expression; static source does not establish the concrete resource or runtime reachability.";
  }
  if (disposition === "human-runtime-evidence-required") {
    return candidate.api === "Sound.loadSound"
      ? "The source constructs a Spanish MP3 expression, but file association, activation timing, synchronization, and listening acceptance are not established."
      : "The source reads and writes a Flash SharedObject bookmark, but required product semantics and authoritative runtime state transitions are not established.";
  }
  return "The legacy host/window/network effect is disabled by default and must not execute; a separate reviewed modern product requirement would be needed to rebuild it.";
}

export function extractStaticCandidates(scripts, sourceEventIdByScriptPath = new Map()) {
  const raw = [];
  for (const script of scripts) {
    const lines = script.text.split("\n");
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      for (const definition of API_DEFINITIONS) {
        definition.regex.lastIndex = 0;
        for (const match of line.matchAll(definition.regex)) {
          raw.push({
            api: definition.api,
            scriptPath: script.path,
            scriptSha256: script.sha256 || sha256(script.text),
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 1,
            sourceText: line.trim(),
          });
        }
      }
    }
  }
  raw.sort((left, right) =>
    compareText(left.scriptPath, right.scriptPath) ||
    left.lineNumber - right.lineNumber ||
    left.columnNumber - right.columnNumber ||
    compareText(left.api, right.api));
  return raw.map((candidate, index) => {
    const role = sourceRole(candidate);
    const disposition = dispositionForStatic(candidate);
    invariant(DISPOSITIONS.includes(disposition), `Invalid disposition ${disposition}`);
    return {
      candidateId: `static-${String(index + 1).padStart(3, "0")}`,
      evidenceKind: "static-exact-source-call",
      api: candidate.api,
      role,
      telemetryCandidate: [
        "lesson-report-and-bookmark-request",
        "final-quiz-report-request",
        "failure-report-request",
        "download-time-and-bookmark-report-request",
      ].includes(role),
      source: {
        scriptPath: candidate.scriptPath,
        scriptSha256: candidate.scriptSha256,
        sourceEventId: sourceEventIdByScriptPath.get(candidate.scriptPath) || null,
        lineNumber: candidate.lineNumber,
        columnNumber: candidate.columnNumber,
        exactCallText: candidate.sourceText,
      },
      upstreamMachineCandidateBound: candidate.api !== "XML.load",
      runtimeReachabilityEstablished: false,
      executedDuringStaticAudit: false,
      originalRuntimeObserved: false,
      disposition,
      dispositionReason: dispositionReasonForStatic(candidate),
    };
  });
}

function extractSupportingEvidence(scripts) {
  const byPath = new Map(scripts.map((script) => [script.path, script]));
  return SUPPORTING_LINE_DEFINITIONS.map((definition) => {
    const script = byPath.get(definition.scriptPath);
    invariant(script, `Missing supporting script ${definition.scriptPath}`);
    const lines = script.text.split("\n");
    const text = lines[definition.lineNumber - 1];
    invariant(text !== undefined, `Missing ${definition.scriptPath}:${definition.lineNumber}`);
    invariant(text.includes(definition.token), `Expected ${JSON.stringify(definition.token)} at ${definition.scriptPath}:${definition.lineNumber}`);
    return {
      group: definition.group,
      scriptPath: definition.scriptPath,
      scriptSha256: script.sha256,
      lineNumber: definition.lineNumber,
      exactSourceText: text.trim(),
    };
  });
}

function observedRole(request) {
  const parsed = new URL(request.url);
  if (request.method === "POST") return "observed-legacy-report-and-bookmark-request";
  if (parsed.pathname.endsWith("/IR/L3RW01.swf")) return "observed-initial-lesson-child-swf-read";
  if (parsed.pathname.endsWith("/XML/ELKTEG4.xml")) return "observed-english-keyterm-xml-read";
  throw new Error(`Unknown selected Ruffle request ${request.method} ${request.url}`);
}

function observedCandidates(shellDiagnostic) {
  invariant(shellDiagnostic.blockedRequestsReachedServer === false, "Selected Ruffle blocked requests unexpectedly reached the server");
  return shellDiagnostic.blockedLocalRequests.map((request, index) => {
    const role = observedRole(request);
    const disposition = request.method === "GET"
      ? "local-nextjs-navigation-data-candidate"
      : "disabled-legacy-side-effect";
    return {
      candidateId: `observed-${String(index + 1).padStart(3, "0")}`,
      evidenceKind: "selected-ruffle-diagnostic-observation",
      api: request.method === "GET" ? "HTTP.GET" : "HTTP.POST",
      role,
      telemetryCandidate: request.method === "POST",
      observation: {
        method: request.method,
        url: request.url,
        ruffleDisposition: request.disposition,
        blockedBeforeServer: true,
        fixedDelayAfterLoadMs: shellDiagnostic.fixedDelayAfterLoadMs,
        exactSourceFrameBinding: shellDiagnostic.screenshot.exactSourceFrameBinding,
      },
      originalRuntimeObserved: false,
      authoritativeRuntimeEvidence: false,
      disposition,
      dispositionReason: request.method === "GET"
        ? "The forensic Ruffle run attempted a contained local read. This corroborates a local navigation/data candidate but is not original-runtime or route-behavior proof."
        : "The forensic Ruffle run exposed a legacy telemetry attempt. It was blocked before the server and remains disabled; the URL is evidence only.",
    };
  });
}

function groupCount(values, keySelector) {
  const counts = {};
  for (const value of values) {
    const key = keySelector(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => compareText(left, right)));
}

function renderMarkdown(report) {
  const candidateRows = report.candidates.map((candidate) => {
    const location = candidate.evidenceKind === "static-exact-source-call"
      ? `${candidate.source.scriptPath}:${candidate.source.lineNumber}`
      : `${candidate.observation.method} ${new URL(candidate.observation.url).pathname}`;
    return `| ${candidate.candidateId} | ${candidate.api} | ${candidate.role} | \`${location}\` | ${candidate.disposition} |`;
  }).join("\n");
  const dispositionRows = DISPOSITIONS
    .map((disposition) => `| ${disposition} | ${report.summary.candidateCountsByDisposition[disposition] || 0} |`)
    .join("\n");
  const apiRows = Object.entries(report.summary.staticExactCallsByApi)
    .map(([api, count]) => `| ${api} | ${count} |`)
    .join("\n");
  const gateRows = Object.entries(report.acceptance.gates)
    .map(([gate, value]) => `| ${gate} | ${value} |`)
    .join("\n");
  const requestBlocks = report.observedRequests.map((request) =>
    `- \`${request.method}\` (${request.disposition}; blocked before server: ${request.blockedBeforeServer})\n\n  \`${request.url}\``).join("\n");
  const nextEvidence = report.requiredNextEvidence.map((item) => `- ${item}`).join("\n");
  return `# G4 L3 course-shell legacy host/dependency disposition contract

> Acceptance-neutral forensic contract. It does not implement a route, execute a legacy endpoint, prove original-runtime behavior, or complete the shell/lesson migration.

## Bound shell

- Animation: \`${report.shell.animationId}\`
- Source: \`${report.shell.source.path}\`
- SHA-256: \`${report.shell.source.sha256}\`
- Runtime: ${report.shell.runtime.stage.width}×${report.shell.runtime.stage.height}, ${report.shell.runtime.fps} FPS, ${report.shell.runtime.rootFrameCount} root frames
- Re-exported scripts: ${report.shell.staticScriptEvidence.exportedScriptFileCount}; normalized bundle \`${report.shell.staticScriptEvidence.normalizedBundleSha256}\`

## Product navigation boundary

The active lesson product contract contains **${report.productNavigationBoundary.activeProductPageCount} pages**. The shipped shell embeds **${report.productNavigationBoundary.shellStaticPageCount} entries**. The conflict remains unresolved; this contract does not silently promote the 44-entry static sequence over the 39 active XML pages.

## Candidate dispositions

| Disposition | Count |
|---|---:|
${dispositionRows}

There are ${report.summary.staticExactCallCount} exact static calls and ${report.summary.observedRequestCount} selected-Ruffle request observations, for ${report.summary.totalCandidateCount} one-to-one dispositions.

| Static API | Exact calls |
|---|---:|
${apiRows}

## Candidate ledger

| ID | API | Role | Evidence location | Disposition |
|---|---|---|---|---|
${candidateRows}

## Selected Ruffle observations

Ruffle is forensic-only. All three requests were contained locally and blocked before reaching the server. They are not authoritative Flash/original-runtime evidence.

${requestBlocks}

## Evidence boundaries

- The generator physically rehashes the shell, re-exports all FFDec scripts, and reproduces the upstream full-script manifest and normalized-bundle hashes.
- Static source proves exact expressions, not runtime reachability, concrete caller values, timing, branch behavior, or product requirements.
- The two XML calls are an exact-source extension beyond the upstream machine audit's 18 external-API occurrences.
- The Spanish audio expression has no established file association, activation timing, synchronization, or listening acceptance.
- SharedObject operations are recorded but were not read, written, cleared, or emulated by this work.
- No legacy URL or endpoint was executed by this generator.

## Required next evidence

${nextEvidence}

## Acceptance gates

| Gate | Value |
|---|---|
${gateRows}

${report.acceptance.statement}
`;
}

async function compareOrWrite(root, relativePath, desired, check) {
  const absolutePath = path.join(root, relativePath);
  if (check) {
    const actual = await readFile(absolutePath, "utf8");
    invariant(actual === desired, `${relativePath} is stale; regenerate it`);
  } else {
    await writeFile(absolutePath, desired);
  }
}

async function createReport({root, ffdec}) {
  const [
    productContract,
    machineAuditReport,
    staticEventReport,
    ruffleMatrix,
    shellBinding,
    productBinding,
    machineBinding,
    staticEventBinding,
    ruffleBinding,
    generatorBinding,
  ] = await Promise.all([
    readJson(path.join(root, INPUT_PATHS.productContract)),
    readJson(path.join(root, INPUT_PATHS.machineAudit)),
    readJson(path.join(root, INPUT_PATHS.staticEventIndex)),
    readJson(path.join(root, INPUT_PATHS.ruffleMatrix)),
    fileBinding(root, SHELL_PATH),
    fileBinding(root, INPUT_PATHS.productContract),
    fileBinding(root, INPUT_PATHS.machineAudit),
    fileBinding(root, INPUT_PATHS.staticEventIndex),
    fileBinding(root, INPUT_PATHS.ruffleMatrix),
    fileBinding(root, portable(path.relative(root, scriptPath))),
  ]);
  invariant(shellBinding.sha256 === EXPECTED_SHELL_SHA256, "Physical shell hash changed");
  invariant(shellBinding.bytes === 657421, "Physical shell byte count changed");

  const machineShell = machineAuditReport.items.find((item) => item.animationId === ANIMATION_ID);
  const eventShell = staticEventReport.items.find((item) => item.animationId === ANIMATION_ID);
  const ruffleShell = ruffleMatrix.representativeValidation.records.find((item) => item.animationId === ANIMATION_ID);
  invariant(machineShell, "Machine source audit has no G4 L3 shell");
  invariant(eventShell, "Static source-event index has no G4 L3 shell");
  invariant(ruffleShell, "Ruffle matrix has no selected G4 L3 shell diagnostic");
  invariant(productContract.shell.animationId === ANIMATION_ID, "Product contract shell animationId changed");
  invariant(productContract.shell.source.swf.sha256 === shellBinding.sha256, "Product contract shell hash mismatch");
  invariant(machineShell.source.swf.sha256 === shellBinding.sha256, "Machine audit shell hash mismatch");
  invariant(ruffleShell.sourceSwfSha256 === shellBinding.sha256, "Ruffle shell hash mismatch");
  invariant(eventShell.upstreamMachineAudit.auditFingerprintSha256 === machineShell.auditFingerprintSha256, "Static event/machine audit fingerprint mismatch");

  const currentFfdec = await inspectFfdec(ffdec);
  const expectedFfdec = machineAuditReport.sourceBindings.tools.ffdec;
  invariant(currentFfdec.version === expectedFfdec.version, "FFDec version differs from machine audit");
  invariant(currentFfdec.launcherSha256 === expectedFfdec.launcherSha256, "FFDec launcher hash differs from machine audit");
  invariant(currentFfdec.ffdecJarSha256 === expectedFfdec.ffdecJarSha256, "FFDec jar hash differs from machine audit");

  const scripts = await exportScripts({root, ffdec, shellPath: SHELL_PATH});
  const scriptSummary = summarizeExportedScripts(scripts);
  invariant(scriptSummary.exportedScriptFileCount === machineShell.scripts.exportedScriptFileCount, "Re-exported script count differs from machine audit");
  invariant(scriptSummary.normalizedBytes === machineShell.scripts.normalizedBytes, "Re-exported normalized bytes differ from machine audit");
  const firstManifestDifference = scriptSummary.manifest.find((entry, index) =>
    stableJson(entry) !== stableJson(machineShell.scripts.files[index]));
  invariant(
    !firstManifestDifference,
    `Re-exported full script manifest first differs at ${firstManifestDifference?.path}: ${JSON.stringify(firstManifestDifference)} != ${JSON.stringify(machineShell.scripts.files[scriptSummary.manifest.indexOf(firstManifestDifference)])}`,
  );
  invariant(
    scriptSummary.contentManifestSha256 === machineShell.scripts.contentManifestSha256,
    `Re-exported content manifest differs from machine audit: ${scriptSummary.contentManifestSha256} != ${machineShell.scripts.contentManifestSha256}`,
  );
  invariant(
    scriptSummary.normalizedBundleSha256 === machineShell.scripts.normalizedBundleSha256,
    `Re-exported normalized bundle differs from machine audit: ${scriptSummary.normalizedBundleSha256} != ${machineShell.scripts.normalizedBundleSha256}`,
  );
  invariant(stableJson(scriptSummary.manifest) === stableJson(machineShell.scripts.files), "Re-exported full script manifest differs from machine audit");

  const eventByScript = new Map(eventShell.sourceEvents.map((event) => [event.script.path, event.sourceEventId]));
  const staticCandidates = extractStaticCandidates(scripts, eventByScript);
  const staticCounts = occurrenceCountByApi(staticCandidates);
  invariant(stableJson(staticCounts) === stableJson(EXPECTED_STATIC_API_COUNTS), `Unexpected static API counts: ${JSON.stringify(staticCounts)}`);

  const upstreamCounts = Object.fromEntries(machineShell.externalDependencies.actionScriptApiCandidates
    .map((candidate) => [candidate.id, candidate.occurrences])
    .sort(([left], [right]) => compareText(left, right)));
  const staticCountsWithoutXml = Object.fromEntries(Object.entries(staticCounts)
    .filter(([api]) => api !== "XML.load")
    .map(([api, count]) => [api === "SharedObject.getLocal" ? "SharedObject" : api, count])
    .sort(([left], [right]) => compareText(left, right)));
  invariant(stableJson(upstreamCounts) === stableJson(staticCountsWithoutXml), "Static exact calls do not reproduce upstream 18 external API occurrences");
  invariant(eventShell.counts.externalApiOccurrences === 18, "Static source-event external occurrence count changed");

  const observed = observedCandidates(ruffleShell);
  invariant(observed.length === 3, "Selected Ruffle shell request count changed");
  invariant(ruffleShell.blockedLocalRequestCount === observed.length, "Selected Ruffle blocked request count mismatch");
  invariant(ruffleShell.blockedRequestsReachedServer === false, "Selected Ruffle requests reached the server");

  const diagnosticJsonBinding = await fileBinding(root, ruffleShell.json.path);
  const diagnosticPngBinding = await fileBinding(root, ruffleShell.screenshot.path);
  invariant(stableJson(diagnosticJsonBinding) === stableJson(ruffleShell.json), "Selected diagnostic JSON binding changed");
  invariant(
    diagnosticPngBinding.path === ruffleShell.screenshot.path &&
      diagnosticPngBinding.bytes === ruffleShell.screenshot.bytes &&
      diagnosticPngBinding.sha256 === ruffleShell.screenshot.sha256,
    "Selected diagnostic PNG binding changed",
  );

  const candidates = [...staticCandidates, ...observed];
  const dispositionCounts = groupCount(candidates, (candidate) => candidate.disposition);
  const expectedDispositionCounts = {
    "disabled-legacy-side-effect": 12,
    "human-runtime-evidence-required": 2,
    "local-nextjs-navigation-data-candidate": 8,
    "unresolved-source-expression": 1,
  };
  invariant(stableJson(dispositionCounts) === stableJson(expectedDispositionCounts), `Unexpected disposition counts: ${JSON.stringify(dispositionCounts)}`);
  invariant(candidates.every((candidate) => DISPOSITIONS.includes(candidate.disposition)), "Candidate missing valid disposition");

  const supportingEvidence = extractSupportingEvidence(scripts);
  const extraShellPaths = productContract.shell.staticSequence.sections
    .flatMap((section) => section.files)
    .map((file) => file.sectionRelativePath)
    .filter((relativePath) => !productContract.pages.some((page) => page.source?.swf?.path?.endsWith(`/L3/${relativePath}`)));
  invariant(productContract.summary.activePages === 39, "Active product page count changed");
  invariant(productContract.shell.staticSequence.pageCount === 44, "Shell static page count changed");
  invariant(extraShellPaths.length === 5, "Expected five shell-static extras");

  const report = {
    schemaVersion: REPORT_VERSION,
    reportType: "g4-l3-shell-legacy-host-dependency-disposition-contract",
    generator: {
      path: portable(path.relative(root, scriptPath)),
      version: REPORT_VERSION,
      sha256: generatorBinding.sha256,
    },
    sourceBindings: {
      shellSwf: shellBinding,
      lessonProductContract: productBinding,
      machineSourceAudit: machineBinding,
      staticSourceEventIndex: staticEventBinding,
      ruffleReferenceMatrix: ruffleBinding,
      selectedRuffleDiagnosticJson: diagnosticJsonBinding,
      selectedRuffleDiagnosticPng: {
        ...diagnosticPngBinding,
        width: ruffleShell.screenshot.width,
        height: ruffleShell.screenshot.height,
        uniqueRgbaColorCount: ruffleShell.screenshot.uniqueRgbaColorCount,
        exactSourceFrameBinding: ruffleShell.screenshot.exactSourceFrameBinding,
      },
      tool: {ffdec: currentFfdec},
    },
    shell: {
      animationId: ANIMATION_ID,
      assetId: machineShell.assetId,
      source: {
        ...shellBinding,
        physicalHashVerifiedNow: true,
        preservedByteForByte: true,
      },
      runtime: {
        stage: {
          width: machineShell.swf.header.stage.width,
          height: machineShell.swf.header.stage.height,
        },
        fps: machineShell.swf.header.fps,
        rootFrameCount: machineShell.swf.header.rootFrameCount,
        actionScriptVersion: machineShell.swf.actionScript.version,
      },
      machineAuditFingerprintSha256: machineShell.auditFingerprintSha256,
      staticEventIndexCounts: eventShell.counts,
      staticScriptEvidence: {
        extraction: "Fresh FFDec script export; LF normalized; paths sorted; every file/byte/hash compared with the upstream machine audit.",
        ...scriptSummary,
        manifest: undefined,
        upstreamScriptEvidenceFingerprintSha256: machineShell.scripts.scriptEvidenceFingerprintSha256,
      },
      catalogAssociatedExternalAudioFileCount: machineShell.audio.associatedFileCount,
      audioCueMappingEstablished: machineShell.audio.cueMappingEstablished,
      audioListeningAcceptanceEstablished: machineShell.audio.listeningAcceptanceEstablished,
    },
    productNavigationBoundary: {
      lesson: {
        grade: productContract.lesson.grade,
        lesson: productContract.lesson.lesson,
        titleEnglishRaw: productContract.lesson.titleEnglishRaw,
        domain: productContract.lesson.domain,
      },
      selectedProductSequenceAuthority: productContract.lesson.sequenceAuthority.selectedForThis39PageProductContract,
      activeProductPageCount: productContract.summary.activePages,
      shellStaticPageCount: productContract.shell.staticSequence.pageCount,
      shellStaticExtrasNotInActiveProductSequence: extraShellPaths,
      shellStaticConflictResolved: false,
      originalRuntimeBehaviorEstablished: false,
      productRule: "Keep the 39 active XML pages as the current product contract. The 44-entry static shell sequence remains conflicting forensic evidence until authoritative runtime and owner evidence resolves it.",
      keytermSourceConflict: {
        courseXmlReferencesMissingLessonSpecificFiles: true,
        shellReferencesPresentGradeWideFiles: true,
        runtimeResolutionVerified: false,
        productDispositionAccepted: false,
      },
    },
    method: {
      deterministic: true,
      physicalShellHashRepeated: true,
      fullFfdecScriptReexported: true,
      fullScriptManifestMatched: true,
      normalizedScriptBundleMatched: true,
      staticSourceLineCallsExact: true,
      selectedRuffleFilesPhysicallyRehashed: true,
      legacyEndpointsExecutedByGenerator: false,
      sourceAssetsModified: false,
      routesImplemented: false,
      runtimeReachabilityEstablished: false,
      behaviorParityEstablished: false,
      limitation: "Static ActionScript and a selected contained Ruffle diagnostic identify dependency candidates only. They do not prove original-runtime reachability, timing, branch semantics, language behavior, audio synchronization, or visual/behavioral parity.",
    },
    summary: {
      staticExactCallCount: staticCandidates.length,
      staticExactCallsByApi: staticCounts,
      upstreamMachineExternalApiOccurrenceCount: eventShell.counts.externalApiOccurrences,
      exactXmlCallsAddedBeyondUpstreamExternalApiFamilies: staticCounts["XML.load"],
      observedRequestCount: observed.length,
      totalCandidateCount: candidates.length,
      candidateCountsByDisposition: dispositionCounts,
      telemetryTaggedCandidateCount: candidates.filter((candidate) => candidate.telemetryCandidate).length,
      unresolvedSourceExpressionCount: dispositionCounts["unresolved-source-expression"],
      candidatesWithoutDisposition: candidates.filter((candidate) => !candidate.disposition).length,
    },
    candidates,
    observedRequests: observed.map((candidate) => ({
      candidateId: candidate.candidateId,
      method: candidate.observation.method,
      url: candidate.observation.url,
      ruffleDisposition: candidate.observation.ruffleDisposition,
      blockedBeforeServer: candidate.observation.blockedBeforeServer,
      disposition: candidate.disposition,
      authoritativeRuntimeEvidence: false,
    })),
    sourceSupportingExpressions: Object.entries(
      Object.groupBy(supportingEvidence, (evidence) => evidence.group),
    ).sort(([left], [right]) => compareText(left, right)).map(([group, evidence]) => ({group, evidence})),
    requiredNextEvidence: [
      "Capture an authorized original-runtime/Adobe Animate shell trace for initial child loading, navigation, language switching, keyterm reads, bookmark state, audio activation, and terminal behavior.",
      "Resolve the generic FScrollPane loadMovie(url) caller expression before assigning any concrete resource or modern implementation.",
      "Reconcile the 39 active XML pages with the shell's 44-entry static sequence; retain the five extras as unresolved forensic evidence until reviewed.",
      "Resolve the missing lesson-specific versus present grade-wide keyterm XML conflict with runtime and owner evidence.",
      "Bind each source-derived Spanish MP3 candidate to a physical file, hash, language, duration, start frame, synchronization trace, and listening acceptance.",
      "Define reviewed modern bookmark semantics before replacing SharedObject; do not read or write legacy local storage by default.",
      "Keep legacy close/window/fscommand/report/loadVariables effects disabled unless a separate reviewed product/API requirement authorizes a modern replacement.",
      "Complete behavior, bilingual, audio, accessibility, visual, human-review, owner, and strict migration gates before any completion claim.",
    ],
    acceptance: {
      acceptanceNeutral: true,
      gates: {
        authoritativeOriginalRuntimeBaseline: false,
        routeImplementation: false,
        runtimeReachability: false,
        behaviorParity: false,
        visualParity: false,
        bilingualAcceptance: false,
        audioAcceptance: false,
        accessibilityAcceptance: false,
        humanVisualReview: false,
        ownerAcceptance: false,
        strictMigrationCompletion: false,
      },
      sourceAssetChanges: 0,
      migrationWorkspaceChanges: 0,
      migrationStatusChanges: 0,
      completionLedgerChanges: 0,
      approvalOrReviewChanges: 0,
      productionRouteChanges: 0,
      legacyEndpointExecutions: 0,
      statement: "Every gate remains false. This contract records exact static dependency candidates and contained Ruffle observations only; it is not fidelity, parity, acceptance, or migration completion.",
    },
  };
  report.shell.staticScriptEvidence = Object.fromEntries(
    Object.entries(report.shell.staticScriptEvidence).filter(([, value]) => value !== undefined),
  );
  invariant(report.summary.staticExactCallCount === 20, "Expected 20 exact static calls");
  invariant(report.summary.totalCandidateCount === 23, "Expected 23 total candidates");
  invariant(report.summary.telemetryTaggedCandidateCount === 5, "Expected five telemetry-tagged candidates");
  invariant(Object.values(report.acceptance.gates).every((value) => value === false), "Every acceptance gate must remain false");
  return report;
}

export function parseArguments(argumentsList) {
  const options = {
    check: false,
    ffdec: "ffdec",
    root: projectRoot,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--ffdec" || value === "--root") {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--ffdec") options.ffdec = next;
      else options.root = path.resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return options;
}

export async function buildG4L3ShellLegacyHostDependencyContract({
  root = projectRoot,
  ffdec = "ffdec",
  check = false,
} = {}) {
  const report = await createReport({root, ffdec});
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  await compareOrWrite(root, OUTPUT_PATHS.json, json, check);
  await compareOrWrite(root, OUTPUT_PATHS.markdown, markdown, check);
  return {
    report,
    outputs: Object.values(OUTPUT_PATHS),
  };
}

function helpText() {
  return `Usage: node scripts/build-g4-l3-shell-legacy-host-dependency-contract.mjs [options]

Options:
  --check             Re-export and verify checked-in JSON/Markdown byte-for-byte
  --ffdec <command>   FFDec launcher (default: ffdec)
  --root <directory>  Project root (default: repository root)
  -h, --help          Show this help
`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(helpText());
    return;
  }
  const result = await buildG4L3ShellLegacyHostDependencyContract(options);
  process.stdout.write(`${options.check ? "Verified" : "Generated"} ${result.outputs.length} G4 L3 shell legacy host/dependency contract files.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
