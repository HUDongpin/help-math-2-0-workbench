import childProcess, {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants, createReadStream} from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {promisify} from "node:util";

import {
  buildGeneratedAuditScript,
  parseProcessTable,
  sha256,
} from "../probe-animate-jsfl-cli.mjs";
import {
  beginLessonAnimateOneRowLaunchAttemptV2,
  LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID,
  LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT,
  takeLessonAnimateOneRowExecutionContextV2,
} from "./lesson-animate-one-row-authorization-v2.mjs";
import {
  LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH,
} from "./lesson-animate-production-trust.mjs";

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const L10_ID_PATTERN = /^(?:course|shell)-g04-l10-/u;
const RUN_ID_PATTERN = /^run-[A-Za-z0-9_-]{8,96}$/u;
const CAPTURE_FRAME = 1;
const TIMEOUT_MS = 900_000;
const AUDIT_JSFL = "scripts/animate-audit-current-document.jsfl";
const AUTHORITY_KEYS = Object.freeze([
  "originalRuntimeBehavior",
  "ruffleBaseline",
  "audioCueAcceptance",
  "javascriptFidelity",
  "humanVisualReview",
  "ownerAcceptance",
  "strictAcceptance",
  "migrationCompletion",
  "wholeLessonIntegration",
  "publication",
]);
const execFile = promisify(execFileCallback);
const CORE_PROJECT_ROOT = await realpath(fileURLToPath(new URL("../../", import.meta.url)));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(root, file) {
  const relative = path.relative(root, file);
  invariant(relative && relative !== ".." && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative), `Path escapes the project root: ${file}`);
  return relative.split(path.sep).join("/");
}

function jsflString(value) {
  return JSON.stringify(String(value));
}

export function buildAssistedControllerJsfl({
  flaUri,
  auditScriptUri,
  outputRootUri,
  markerUri,
  captureFrame,
}) {
  invariant(Number.isInteger(captureFrame) && captureFrame >= 1,
    "captureFrame must be a positive integer");
  return String.raw`(function () {
  var flaUri = ${jsflString(flaUri)};
  var auditScriptUri = ${jsflString(auditScriptUri)};
  var outputRootUri = ${jsflString(outputRootUri)};
  var markerUri = ${jsflString(markerUri)};
  var captureFrame = ${captureFrame};
  var document = null;

  function escapeJSON(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n");
  }

  function writeMarker(status, message) {
    var payload = "{\"status\":\"" + escapeJSON(status) +
      "\",\"animateVersion\":\"" + escapeJSON(fl.version) +
      "\",\"documentName\":\"" + escapeJSON(document ? document.name : "") +
      "\",\"documentPathURI\":\"" + escapeJSON(document && document.pathURI ? document.pathURI : "") +
      "\",\"captureFrame\":" + captureFrame +
      ",\"message\":\"" + escapeJSON(message || "") + "\"}";
    FLfile.write(markerUri, payload);
  }

  try {
    fl.openDocument(flaUri);
    document = fl.getDocumentDOM();
    if (!document) {
      throw new Error("fl.openDocument produced no current document");
    }
    var timeline = document.getTimeline();
    if (!timeline || captureFrame > timeline.frameCount) {
      throw new Error("Pinned capture frame is outside the root timeline");
    }
    timeline.currentFrame = captureFrame - 1;
    fl.runScript(auditScriptUri);
    var reportUri = outputRootUri + "/" + String(document.name).replace(/[^A-Za-z0-9._-]+/g, "-") + "-authoring-audit.json";
    if (!FLfile.exists(reportUri)) {
      throw new Error("Audit JSFL did not create " + reportUri);
    }
    writeMarker("passed", "human-assisted legacy FLA authoring audit completed");
  } catch (error) {
    writeMarker("failed", String(error && error.message ? error.message : error));
  }

  if (document) {
    fl.closeDocument(document, false);
  }
  fl.quit(false);
})();
`;
}

function replaceExactlyOnce(value, needle, replacement, label) {
  const first = value.indexOf(needle);
  invariant(first >= 0 && value.indexOf(needle, first + needle.length) < 0,
    `Expected exactly one ${label} insertion point in the authoring-audit JSFL`);
  return `${value.slice(0, first)}${replacement}${value.slice(first + needle.length)}`;
}

export function buildDependencyGeneratedAuditScript(template, outputRootUri) {
  let generated = buildGeneratedAuditScript(template, outputRootUri);
  const elementNeedle = "      filters: filtersSummary(element)\n";
  generated = replaceExactlyOnce(generated, elementNeedle,
    "      filters: filtersSummary(element),\n" +
    "      attachedActionScript: optionalString(safeProperty(element, \"actionScript\")),\n" +
    "      attachedActionScriptLength: optionalString(safeProperty(element, \"actionScript\")) === null ? 0 : optionalString(safeProperty(element, \"actionScript\")).length\n",
  "element-script");
  const frameNeedle = "      actionScriptLength: frame.actionScript ? frame.actionScript.length : 0,\n";
  generated = replaceExactlyOnce(generated, frameNeedle, `${frameNeedle}` +
    "      actionScript: optionalString(safeProperty(frame, \"actionScript\")),\n",
  "frame-script");
  generated = replaceExactlyOnce(generated,
    "      var item = items[index];\n      var itemResult = {",
    "      var item = items[index];\n" +
    "      var itemName = optionalString(safeProperty(item, \"name\"));\n" +
    "      var itemType = optionalString(safeProperty(item, \"itemType\"));\n" +
    "      if (itemType === \"font\") {\n" +
    "        result.push({\n" +
    "          index: index,\n" +
    "          name: itemName,\n" +
    "          itemType: itemType,\n" +
    "          inspectionLimitation: \"metadata-only: Animate 2021 can abort while reading extended JSFL properties from legacy font library items\"\n" +
    "        });\n" +
    "        continue;\n" +
    "      }\n" +
    "      var itemResult = {",
  "font-library-metadata-only-guard");
  for (const [needle, replacement, label] of [
    ["name: optionalString(item.name)", "name: itemName", "library-name"],
    ["itemType: optionalString(item.itemType)", "itemType: itemType", "library-type"],
    ["linkageClassName: optionalString(item.linkageClassName)",
      "linkageClassName: optionalString(safeProperty(item, \"linkageClassName\"))", "library-linkage-class"],
    ["linkageIdentifier: optionalString(item.linkageIdentifier)",
      "linkageIdentifier: optionalString(safeProperty(item, \"linkageIdentifier\"))", "library-linkage-identifier"],
    ["linkageExportForAS: item.linkageExportForAS === true",
      "linkageExportForAS: safeProperty(item, \"linkageExportForAS\") === true", "library-linkage-export"],
    ["linkageImportForRS: item.linkageImportForRS === true",
      "linkageImportForRS: safeProperty(item, \"linkageImportForRS\") === true", "library-linkage-import"],
  ]) generated = replaceExactlyOnce(generated, needle, replacement, label);
  generated = replaceExactlyOnce(generated,
    "      if (item.timeline) {\n        itemResult.timeline = timelineSummary(item.timeline);\n      }",
    "      var itemTimeline = safeProperty(item, \"timeline\");\n" +
    "      if (itemTimeline) {\n        itemResult.timeline = timelineSummary(itemTimeline);\n      }",
  "library-timeline");
  generated = replaceExactlyOnce(generated,
    "    library: librarySummary(document.library),\n",
    "    library: [],\n" +
    "    librarySharded: true,\n" +
    "    libraryShardManifestFile: \"library-shard-manifest.json\",\n",
  "sharded-library-report");
  generated = replaceExactlyOnce(generated, "  writeResult(reportURI, report);\n",
    "  var libraryItems = document.library && document.library.items ? document.library.items : [];\n" +
    "  var libraryShardManifest = {\n" +
    "    schemaVersion: 1,\n" +
    "    evidenceKind: \"adobe-animate-library-item-shards\",\n" +
    "    expectedLibraryItemCount: libraryItems.length,\n" +
    "    items: []\n" +
    "  };\n" +
    "  for (var libraryIndex = 0; libraryIndex < libraryItems.length; libraryIndex += 1) {\n" +
    "    FLfile.write(OUTPUT_ROOT + \"/animate-audit-progress.txt\", \"starting \" + libraryIndex + \" \" + optionalString(safeProperty(libraryItems[libraryIndex], \"name\")) + \" \" + optionalString(safeProperty(libraryItems[libraryIndex], \"itemType\")) + \"\\n\");\n" +
    "    var libraryItemSummary = librarySummary({items: [libraryItems[libraryIndex]]})[0];\n" +
    "    libraryItemSummary.index = libraryIndex;\n" +
    "    var shardFileName = \"library-item-\" + (\"000000\" + libraryIndex).slice(-6) + \".json\";\n" +
    "    FLfile.write(OUTPUT_ROOT + \"/animate-audit-progress.txt\", \"writing \" + libraryIndex + \" \" + optionalString(safeProperty(libraryItems[libraryIndex], \"name\")) + \"\\n\");\n" +
    "    writeResult(OUTPUT_ROOT + \"/\" + shardFileName, libraryItemSummary);\n" +
    "    libraryShardManifest.items.push({index: libraryIndex, file: shardFileName});\n" +
    "    FLfile.write(OUTPUT_ROOT + \"/animate-audit-progress.txt\", \"wrote \" + libraryIndex + \" \" + optionalString(safeProperty(libraryItems[libraryIndex], \"name\")) + \"\\n\");\n" +
    "  }\n" +
    "  writeResult(OUTPUT_ROOT + \"/library-shard-manifest.json\", libraryShardManifest);\n" +
    "  writeResult(reportURI, report);\n",
  "sharded-library-writer");
  return generated;
}

export async function runningAnimate(animateBinary) {
  const {stdout} = await execFile("/bin/ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
    env: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
    maxBuffer: 4 * 1024 * 1024,
  });
  return parseProcessTable(stdout, animateBinary);
}

export function runChild(binary, args, timeoutMs, environment = undefined, {
  detachedProcessGroup = false,
  maxOutputBytes = 16 * 1024 * 1024,
  cwd = undefined,
} = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = childProcess.spawn(binary, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: detachedProcessGroup,
      ...(environment ? {env: environment} : {}),
      ...(cwd ? {cwd} : {}),
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let outputLimitExceeded = false;
    let killTimer = null;
    let killConfirmationTimer = null;
    let timeout = null;
    let settled = false;
    const releaseChildResources = ({unrefHandle = false} = {}) => {
      for (const stream of [child.stdin, child.stdout, child.stderr]) {
        try {
          stream?.destroy?.();
        } catch {
          // Resource release is best-effort, but must not prevent bounded
          // settlement of an already kill-unconfirmed child.
        }
      }
      if (unrefHandle) {
        try {
          child.unref?.();
        } catch {
          // The kill-unconfirmed result remains authoritative even if an
          // injected/nonstandard ChildProcess cannot be unrefed.
        }
      }
    };
    const signalExecution = (signal) => {
      try {
        if (detachedProcessGroup && Number.isInteger(child.pid)) {
          process.kill(-child.pid, signal);
          return true;
        }
        return child.kill(signal);
      } catch {
        return false;
      }
    };
    const settle = ({code, signal, killUnconfirmed = false}) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      if (killConfirmationTimer) clearTimeout(killConfirmationTimer);
      releaseChildResources({unrefHandle: killUnconfirmed});
      resolve({
        exitCode: code,
        signal,
        timedOut,
        outputLimitExceeded,
        killUnconfirmed,
        detachedProcessGroup,
        durationMs: Date.now() - startedAt,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    };
    const beginBoundedTermination = () => {
      signalExecution("SIGTERM");
      if (killTimer) return;
      killTimer = setTimeout(() => {
        signalExecution("SIGKILL");
        killConfirmationTimer = setTimeout(() => {
          settle({code: null, signal: "SIGKILL", killUnconfirmed: true});
        }, 5_000);
      }, 5_000);
    };
    const boundedCollect = (chunks, chunk, stream) => {
      const current = stream === "stdout" ? stdoutBytes : stderrBytes;
      const remaining = Math.max(0, maxOutputBytes - current);
      if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
      if (stream === "stdout") stdoutBytes += chunk.length;
      else stderrBytes += chunk.length;
      if (current + chunk.length > maxOutputBytes && !outputLimitExceeded) {
        outputLimitExceeded = true;
        timedOut = true;
        beginBoundedTermination();
      }
    };
    child.stdout.on("data", (chunk) => boundedCollect(stdout, chunk, "stdout"));
    child.stderr.on("data", (chunk) => boundedCollect(stderr, chunk, "stderr"));
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      if (killConfirmationTimer) clearTimeout(killConfirmationTimer);
      releaseChildResources();
      reject(error);
    });
    timeout = setTimeout(() => {
      timedOut = true;
      beginBoundedTermination();
    }, timeoutMs);
    child.once("exit", (code, signal) => {
      if (settled) return;
      setTimeout(() => settle({code, signal}), 250);
    });
  });
}

export function decodeFileUri(uri) {
  if (!uri || !uri.startsWith("file:")) return "";
  return decodeURIComponent(uri).replace(/^file:\/\/(?:\/Macintosh HD)?/u, "");
}

function pngDimensions(buffer, label) {
  invariant(buffer.length >= 24
    && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
  `${label} is not a PNG`);
  return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20)};
}

export async function materializeDependencyLibraryShards({
  runDir,
  reportFile,
  reportBytes,
  identity,
}) {
  const report = JSON.parse(reportBytes.toString("utf8"));
  if (report.librarySharded !== true) return {report, reportBytes, materialized: false};
  invariant(Array.isArray(report.library) && report.library.length === 0,
    `${identity}: sharded authoring report must begin with an empty library array`);
  invariant(report.libraryShardManifestFile === "library-shard-manifest.json",
    `${identity}: unexpected library shard manifest path`);
  const manifestFile = path.join(runDir, report.libraryShardManifestFile);
  invariant(path.dirname(manifestFile) === runDir,
    `${identity}: library shard manifest escapes the run directory`);
  const manifestBytes = await readFile(manifestFile);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  invariant(manifest.schemaVersion === 1
    && manifest.evidenceKind === "adobe-animate-library-item-shards",
  `${identity}: unexpected library shard manifest identity`);
  invariant(Number.isInteger(manifest.expectedLibraryItemCount)
    && manifest.expectedLibraryItemCount >= 0
    && manifest.expectedLibraryItemCount === report.document?.libraryItemCount
    && Array.isArray(manifest.items)
    && manifest.items.length === manifest.expectedLibraryItemCount,
  `${identity}: incomplete library shard manifest`);
  const library = [];
  const shards = [];
  for (let index = 0; index < manifest.items.length; index += 1) {
    const entry = manifest.items[index];
    const expectedFile = `library-item-${String(index).padStart(6, "0")}.json`;
    invariant(entry?.index === index && entry.file === expectedFile,
      `${identity}: library shard ${index} identity mismatch`);
    const shardFile = path.join(runDir, entry.file);
    invariant(path.dirname(shardFile) === runDir,
      `${identity}: library shard ${index} escapes the run directory`);
    const shardBytes = await readFile(shardFile);
    const item = JSON.parse(shardBytes.toString("utf8"));
    invariant(item?.index === index,
      `${identity}: library shard ${index} payload identity mismatch`);
    library.push(item);
    shards.push({index, file: entry.file, sha256: sha256(shardBytes), bytes: shardBytes.length});
  }
  const shardedHeadFile = path.join(runDir,
    `${path.basename(reportFile, ".json")}-sharded-head.json`);
  await writeFile(shardedHeadFile, reportBytes, {flag: "wx"});
  report.library = library;
  report.librarySharded = false;
  report.libraryMaterialization = {
    schemaVersion: 1,
    method: "node-hash-bound-library-item-shards",
    shardedHead: {file: path.basename(shardedHeadFile), sha256: sha256(reportBytes),
      bytes: reportBytes.length},
    shardManifest: {file: report.libraryShardManifestFile, sha256: sha256(manifestBytes),
      bytes: manifestBytes.length},
    shards,
  };
  const materializedBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  await writeFile(reportFile, materializedBytes);
  return {report, reportBytes: materializedBytes, materialized: true};
}

export async function validateAssistedArtifacts({
  runDir,
  animationId,
  evidenceId,
  workingCopy,
  captureFrame,
  requireScriptBodies = false,
}) {
  const identity = animationId || evidenceId;
  invariant(identity, "An animationId or evidenceId is required for artifact validation");
  const markerFile = path.join(runDir, "controller-result.json");
  const markerBytes = await readFile(markerFile);
  const marker = JSON.parse(markerBytes.toString("utf8"));
  invariant(marker.status === "passed",
    `${identity}: Animate controller reported ${marker.status}: ${marker.message || "no message"}`);
  invariant(marker.captureFrame === captureFrame,
    `${identity}: controller capture frame mismatch`);
  invariant(path.resolve(decodeFileUri(marker.documentPathURI)) === path.resolve(workingCopy),
    `${identity}: controller opened an unexpected document path`);
  const flaName = path.basename(workingCopy);
  const reportFile = path.join(runDir, `${flaName}-authoring-audit.json`);
  const rawReportBytes = await readFile(reportFile);
  const {report, reportBytes} = await materializeDependencyLibraryShards({
    runDir, reportFile, reportBytes: rawReportBytes, identity,
  });
  invariant(report.schemaVersion === 1
    && report.evidenceKind === "adobe-animate-authoring-audit"
    && report.recursiveLibraryTimelineAudit === true,
  `${identity}: unexpected or non-recursive raw authoring audit`);
  invariant(report.document?.name === flaName
    && path.resolve(decodeFileUri(report.document?.pathURI)) === path.resolve(workingCopy),
  `${identity}: raw audit did not come from the exact assist working copy`);
  invariant(report.timeline?.currentFlashFrame === captureFrame,
    `${identity}: raw audit frame mismatch`);
  invariant(marker.animateVersion && marker.animateVersion === report.animateVersion,
    `${identity}: Animate version marker/report mismatch`);
  invariant(Number.isFinite(report.document?.width) && report.document.width > 0
    && Number.isFinite(report.document?.height) && report.document.height > 0
    && Number.isFinite(report.document?.frameRate) && report.document.frameRate > 0
    && Number.isInteger(report.timeline?.frameCount)
    && report.timeline.frameCount >= captureFrame,
  `${identity}: native document/timeline metadata is invalid`);
  invariant(Array.isArray(report.timeline.layers),
    `${identity}: root authoring timeline is missing its layers inventory`);
  invariant(Number.isInteger(report.timeline.layerCount)
    && report.timeline.layerCount === report.timeline.layers.length,
  `${identity}: root authoring timeline layer count/inventory mismatch`);
  invariant(Array.isArray(report.library)
    && Number.isInteger(report.document.libraryItemCount)
    && report.document.libraryItemCount === report.library.length,
  `${identity}: authoring library count/inventory mismatch`);
  for (const [index, item] of report.library.entries()) {
    invariant(item && typeof item === "object" && !Array.isArray(item),
      `${identity}: authoring library item ${index} is invalid`);
    if (item.timeline) {
      invariant(Array.isArray(item.timeline.layers),
        `${identity}: authoring library timeline ${index} is missing its layers inventory`);
    }
  }
  let frameScriptsPresent = 0;
  let attachedScriptsPresent = 0;
  for (const timeline of [report.timeline,
    ...report.library.filter((item) => item.timeline).map((item) => item.timeline)]) {
    for (const layer of timeline.layers) {
      invariant(Array.isArray(layer.keyframes),
        `${identity}: authoring layer is missing keyframes`);
      for (const keyframe of layer.keyframes) {
        invariant(Array.isArray(keyframe.elements),
          `${identity}: authoring keyframe is missing elements`);
        if (requireScriptBodies) {
          invariant(Object.hasOwn(keyframe, "actionScript")
            && typeof keyframe.actionScriptLength === "number",
          `${identity}: authoring keyframe is missing its script inventory`);
          const length = typeof keyframe.actionScript === "string"
            ? keyframe.actionScript.length : 0;
          invariant(keyframe.actionScriptLength === length,
            `${identity}: authoring keyframe script length/body mismatch`);
          if (length > 0) frameScriptsPresent += 1;
          for (const element of keyframe.elements) {
            invariant(Object.hasOwn(element, "attachedActionScript")
              && typeof element.attachedActionScriptLength === "number",
            `${identity}: authoring element is missing its attached-script inventory`);
            const attachedLength = typeof element.attachedActionScript === "string"
              ? element.attachedActionScript.length : 0;
            invariant(element.attachedActionScriptLength === attachedLength,
              `${identity}: authoring element attached-script length/body mismatch`);
            if (attachedLength > 0) attachedScriptsPresent += 1;
          }
        }
      }
    }
  }
  const pngFile = path.join(runDir, `${flaName}-frame-${captureFrame}.png`);
  const pngBytes = await readFile(pngFile);
  const dimensions = pngDimensions(pngBytes, `${identity}: authoring frame`);
  invariant(dimensions.width === report.document.width
    && dimensions.height === report.document.height,
  `${identity}: authoring PNG dimensions do not match the document stage`);
  return {
    marker: {file: markerFile, sha256: sha256(markerBytes)},
    report: {file: reportFile, sha256: sha256(reportBytes)},
    png: {file: pngFile, sha256: sha256(pngBytes), ...dimensions},
    animateVersion: report.animateVersion,
    reportSummary: {
      capturedAt: report.capturedAt,
      stage: {width: report.document.width, height: report.document.height},
      fps: report.document.frameRate,
      frameCount: report.timeline.frameCount,
      backgroundColor: report.document.backgroundColor,
      rootLayerCount: report.timeline.layerCount,
      libraryItemCount: report.document.libraryItemCount,
      frameScriptsPresent,
      attachedScriptsPresent,
      scriptBodiesRequired: requireScriptBodies,
    },
  };
}

async function sha256File(file) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function exactObjectKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value),
    `${label} must be one object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(actual.length === wanted.length
    && actual.every((key, index) => key === wanted[index]), `${label} keys drifted`);
}

function assertToolDescriptor(descriptor, expectedFile, label) {
  exactObjectKeys(descriptor, ["file", "sha256", "bytes", "mode"], label);
  invariant(descriptor.file === expectedFile && SHA256_PATTERN.test(descriptor.sha256)
    && Number.isInteger(descriptor.bytes) && descriptor.bytes > 0
    && /^[0-7]{4}$/u.test(descriptor.mode), `${label} descriptor drifted`);
}

function assertExecutionContext(context, root) {
  invariant(context && typeof context === "object" && Object.isFrozen(context),
    "dedicated L10 runner requires the frozen v2 execution context");
  invariant(context.releaseId === LESSON_ANIMATE_ONE_ROW_AUTHORIZATION_V2_RELEASE_ID
    && L10_ID_PATTERN.test(context.animationId || "")
    && context.assetId === `swf-${context.member?.swf?.source?.sha256}`
    && RUN_ID_PATTERN.test(context.runId || "")
    && context.acceptanceEffect === "none",
  "dedicated L10 release/member/run identity drifted");
  exactObjectKeys(context.receipts, ["assignmentSha256", "authorizationSha256",
    "executionCodeClosureSha256"], "dedicated L10 receipt hashes");
  invariant(Object.values(context.receipts).every((value) => SHA256_PATTERN.test(value)),
    "dedicated L10 receipt hash is invalid");
  exactObjectKeys(context.authorityBoundary, AUTHORITY_KEYS, "dedicated L10 authority boundary");
  invariant(AUTHORITY_KEYS.every((key) => context.authorityBoundary[key] === false),
    "dedicated L10 authority boundary must remain entirely false");
  invariant(context.operator?.roleId === "adobe-animate-human-dialog-operator"
    && typeof context.operator.fullName === "string"
    && context.operator.fullName.length >= 2
    && typeof context.operator.stableSubjectId === "string"
    && context.operator.stableSubjectId.length > 0
    && context.operator.automationUsed === false
    && JSON.stringify(context.operator.allowedHumanActions) === JSON.stringify([
      "acknowledge-legacy-actionscript-conversion-dialog", "close-without-saving",
    ]), "dedicated L10 named-human action boundary drifted");
  const member = context.member;
  invariant(member?.animationId === context.animationId && member.assetId === context.assetId
    && member.fla.source.sha256 === member.fla.releaseWorkingCopy.sha256
    && member.fla.source.sha256 === member.fla.assistWorkingCopy.sha256
    && member.swf.source.sha256 === member.swf.assistWorkingCopy.sha256,
  "dedicated L10 source/copy member binding drifted");
  const absoluteFor = (relative) => path.join(root, ...relative.split("/"));
  const evidenceDir = path.join(root, "work", "animate", "dependency-authoring-audits",
    context.animationId);
  const runDirectory = path.join(evidenceDir, "runs", context.runId);
  invariant(context.paths?.runDirectory === runDirectory
    && context.paths.sourceFla === absoluteFor(member.fla.source.file)
    && context.paths.sourceSwf === absoluteFor(member.swf.source.file)
    && context.paths.releaseFlaWorkingCopy === absoluteFor(member.fla.releaseWorkingCopy.file)
    && context.paths.assistFlaWorkingCopy === absoluteFor(member.fla.assistWorkingCopy.file)
    && context.paths.assistSwfWorkingCopy === absoluteFor(member.swf.assistWorkingCopy.file)
    && context.paths.assistSourceBinding
      === absoluteFor(context.bindings.assistSourceBinding.file),
  "dedicated L10 signed path mapping drifted");
  const audit = context.audit;
  invariant(audit?.captureFrame === CAPTURE_FRAME && audit.timeoutMs === TIMEOUT_MS
    && audit.auditJsfl === AUDIT_JSFL
    && audit.animateExecutable === context.executionCodeClosure.toolchain.animateExecutable.file
    && audit.processProbe === "/bin/ps"
    && audit.replayLockHelper === LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH
    && audit.oneFlaPerColdStartProcess === true
    && audit.openOnlyReadOnlyAssistWorkingCopy === true
    && audit.closeWithoutSaving === true && audit.saveAllowed === false
    && audit.publishAllowed === false && audit.automatedDialogInteractionAllowed === false,
  "dedicated L10 fixed audit protocol drifted");
  const closure = context.executionCodeClosure;
  invariant(closure.entrypoint === LESSON_ANIMATE_ONE_ROW_V2_PRODUCTION_RUNNER_ENTRYPOINT
    && closure.platform === process.platform && closure.arch === process.arch
    && closure.productionReplayLockHelperBound === true
    && SHA256_PATTERN.test(closure.manifestSha256),
  "dedicated L10 production closure drifted");
  exactObjectKeys(closure.toolchain, ["aclProbe", "nodeExecutable", "processProbe", "jsfl",
    "animateExecutable", "replayLockHelper"], "dedicated L10 toolchain");
  assertToolDescriptor(closure.toolchain.aclProbe, "/bin/ls", "ACL probe");
  assertToolDescriptor(closure.toolchain.nodeExecutable, process.execPath, "Node executable");
  assertToolDescriptor(closure.toolchain.processProbe, "/bin/ps", "process probe");
  assertToolDescriptor(closure.toolchain.jsfl, AUDIT_JSFL, "audit JSFL");
  assertToolDescriptor(closure.toolchain.animateExecutable, audit.animateExecutable,
    "Animate executable");
  assertToolDescriptor(closure.toolchain.replayLockHelper,
    LESSON_ANIMATE_PRODUCTION_REPLAY_LOCK_HELPER_PATH, "replay helper");
  return Object.freeze({evidenceDir, runDirectory});
}

async function fileIdentity(file, descriptor, label, {readOnly = false} = {}) {
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink()
    && information.nlink === 1 && await realpath(file) === file,
  `${label} must be one real single-link file`);
  if (readOnly) invariant((information.mode & 0o222) === 0, `${label} is writable`);
  invariant(/^[0-7]{4}$/u.test(descriptor.mode || "")
    && (information.mode & 0o7777) === Number.parseInt(descriptor.mode, 8),
  `${label} mode differs from its owner-signed descriptor`);
  const digest = await sha256File(file);
  invariant(digest === descriptor.sha256 && information.size === descriptor.bytes,
    `${label} differs from its owner-signed descriptor`);
  return Object.freeze({sha256: digest, bytes: information.size,
    mode: information.mode & 0o7777, dev: information.dev, ino: information.ino,
    uid: information.uid, gid: information.gid,
    mtimeMs: information.mtimeMs, ctimeMs: information.ctimeMs});
}

function sameFileIdentity(left, right) {
  return left.sha256 === right.sha256 && left.bytes === right.bytes
    && left.mode === right.mode && left.dev === right.dev && left.ino === right.ino
    && left.uid === right.uid && left.gid === right.gid
    && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

async function verifyExecutionFiles(context) {
  const member = context.member;
  const sourceFla = await fileIdentity(context.paths.sourceFla, member.fla.source,
    `${context.animationId}: source FLA`, {readOnly: true});
  const sourceSwf = await fileIdentity(context.paths.sourceSwf, member.swf.source,
    `${context.animationId}: source SWF`, {readOnly: true});
  const assistFla = await fileIdentity(context.paths.assistFlaWorkingCopy,
    member.fla.assistWorkingCopy, `${context.animationId}: assist FLA`, {readOnly: true});
  const assistSwf = await fileIdentity(context.paths.assistSwfWorkingCopy,
    member.swf.assistWorkingCopy, `${context.animationId}: assist SWF`, {readOnly: true});
  invariant(sourceFla.dev !== assistFla.dev || sourceFla.ino !== assistFla.ino,
    "assist FLA aliases the canonical source inode");
  invariant(sourceSwf.dev !== assistSwf.dev || sourceSwf.ino !== assistSwf.ino,
    "assist SWF aliases the canonical source inode");
  const binding = await fileIdentity(context.paths.assistSourceBinding,
    context.bindings.assistSourceBinding, `${context.animationId}: assist source binding`,
    {readOnly: true});
  invariant(binding.mode === 0o444, "assist source binding mode must remain exactly 0444");
  return Object.freeze({sourceFla, sourceSwf, assistFla, assistSwf, binding});
}

async function syncDirectory(directory) {
  const handle = await open(directory,
    fsConstants.O_RDONLY | fsConstants.O_DIRECTORY | fsConstants.O_NOFOLLOW);
  try { await handle.sync(); } finally { await handle.close(); }
}

async function createRunDirectory(runDirectory, evidenceDir) {
  const runsRoot = path.join(evidenceDir, "runs");
  invariant(path.dirname(runDirectory) === runsRoot,
    "dedicated L10 run directory escaped its exact signed runs root");
  const parent = await lstat(runsRoot);
  invariant(parent.isDirectory() && !parent.isSymbolicLink()
    && await realpath(runsRoot) === runsRoot,
  "dedicated L10 runs root must pre-exist as one real directory");
  await mkdir(runDirectory, {mode: 0o700});
  const information = await lstat(runDirectory);
  invariant(information.isDirectory() && !information.isSymbolicLink()
    && (information.mode & 0o7777) === 0o700
    && await realpath(runDirectory) === runDirectory,
  "dedicated L10 run directory must be one newly created exact-0700 directory");
  return runDirectory;
}

async function writeDurableExclusiveJson(file, document) {
  const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
  const handle = await open(file,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
    0o400);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const information = await lstat(file);
  invariant(information.isFile() && !information.isSymbolicLink()
    && information.nlink === 1 && (information.mode & 0o7777) === 0o400,
  "launch intent must be one exact-0400 single-link file");
  await syncDirectory(path.dirname(file));
  await syncDirectory(path.dirname(path.dirname(file)));
  return Object.freeze({file, sha256: sha256(bytes), bytes: bytes.length});
}

function cleanAnimateEnvironment() {
  const environment = {PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C"};
  for (const name of ["HOME", "USER", "LOGNAME", "TMPDIR"]) {
    if (typeof process.env[name] === "string" && process.env[name].length > 0) {
      environment[name] = process.env[name];
    }
  }
  return Object.freeze(environment);
}

function launchIntent(root, context, runDir, controllerFile, controller,
  generatedAuditFile, generatedAudit) {
  return {
    schemaVersion: 1,
    evidenceKind: "lesson-g04-l10-owner-authorized-animate-launch-intent",
    status: "durable-launch-intent-runtime-launch-possible-or-unknown",
    releaseId: context.releaseId,
    releaseOrdinal: context.releaseOrdinal,
    queueOrdinal: context.queueOrdinal,
    animationId: context.animationId,
    assetId: context.assetId,
    runId: context.runId,
    nonceSha256: context.nonceSha256,
    expiresAt: context.expiresAt,
    receipts: context.receipts,
    ownerSignatureVerified: true,
    authorizationEffect: "execution-only-never-review-or-acceptance",
    operatorActionBoundary: {
      designatedOperator: context.operator.fullName,
      stableSubjectId: context.operator.stableSubjectId,
      allowedActions: [...context.operator.allowedHumanActions],
      automatedDialogInteractionUsed: false,
      reviewOrAcceptanceDecisionRecorded: false,
    },
    source: {
      fla: context.member.fla.source,
      swf: context.member.swf.source,
      openedWorkingCopy: context.member.fla.assistWorkingCopy,
      shippedSwfExecuted: false,
    },
    command: {
      executable: context.audit.animateExecutable,
      executableSha256: context.executionCodeClosure.toolchain.animateExecutable.sha256,
      args: ["--run-jsfl", "-o", portable(root, controllerFile)],
      timeoutMs: context.audit.timeoutMs,
      detachedProcessGroup: true,
      cwd: root,
    },
    scripts: {
      generatedAudit: {file: path.basename(generatedAuditFile), sha256: sha256(generatedAudit)},
      controller: {file: path.basename(controllerFile), sha256: sha256(controller)},
    },
    runDirectory: portable(root, runDir),
    launchSemantics: {
      receiptDurableBeforeSpawn: true,
      runtimeLaunched: "possible-or-unknown-after-this-receipt",
      crashAfterReceipt: "treat-as-launch-possible-or-unknown-never-complete",
      sourceSaveAllowed: false,
      publishAllowed: false,
    },
    authorityBoundary: context.authorityBoundary,
    acceptanceEffect: "none",
  };
}

async function writeEvidence(root, context, filesBefore, filesAfter, runDir, artifacts,
  launchIntentDescriptor, processResult, remainingProcesses, templateBytes,
  generatedAuditFile, generatedAudit, controllerFile, controller) {
  const evidence = {
    schemaVersion: 2,
    evidenceKind: "lesson-g04-l10-owner-authorized-adobe-animate-authoring-audit",
    status: "verified-work-only-authoring-audit",
    releaseId: context.releaseId,
    animationId: context.animationId,
    assetId: context.assetId,
    runId: context.runId,
    receipts: context.receipts,
    acceptanceEffect: "none; not original-runtime, Ruffle, audio, JavaScript fidelity, human review, owner acceptance, strict completion, integration, or publication evidence",
    humanDialogBoundary: {
      designatedOperator: context.operator.fullName,
      stableSubjectId: context.operator.stableSubjectId,
      allowedActions: [...context.operator.allowedHumanActions],
      automationUsed: false,
      operatorNameIsNotReviewOrApproval: true,
    },
    protocol: {
      openedOnlyReadOnlyAssistWorkingCopy: true,
      openedSourceDirectly: false,
      saveAllowed: false,
      publishAllowed: false,
      closeWithoutSaving: true,
      shippedSwfExecuted: false,
    },
    sources: {
      fla: context.member.fla.source,
      swf: context.member.swf.source,
      assistFla: context.member.fla.assistWorkingCopy,
      assistSwf: context.member.swf.assistWorkingCopy,
      hashesStableAfterRun: filesBefore.sourceFla.sha256 === filesAfter.sourceFla.sha256
        && filesBefore.sourceSwf.sha256 === filesAfter.sourceSwf.sha256
        && filesBefore.assistFla.sha256 === filesAfter.assistFla.sha256
        && filesBefore.assistSwf.sha256 === filesAfter.assistSwf.sha256,
    },
    launchIntent: {file: portable(root, launchIntentDescriptor.file),
      sha256: launchIntentDescriptor.sha256, bytes: launchIntentDescriptor.bytes},
    command: {
      executable: context.audit.animateExecutable,
      executableSha256: context.executionCodeClosure.toolchain.animateExecutable.sha256,
      detachedProcessGroup: true,
      timeoutMs: context.audit.timeoutMs,
      cwd: root,
    },
    process: {
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      outputLimitExceeded: processResult.outputLimitExceeded,
      killUnconfirmed: processResult.killUnconfirmed,
      durationMs: processResult.durationMs,
      allAnimateProcessesExited: remainingProcesses.length === 0,
    },
    scripts: {
      template: {file: AUDIT_JSFL, sha256: sha256(templateBytes)},
      generated: {file: portable(root, generatedAuditFile), sha256: sha256(generatedAudit)},
      controller: {file: portable(root, controllerFile), sha256: sha256(controller)},
    },
    nativeMovie: artifacts.reportSummary,
    capturedAuthoringFrame: {
      flashFrame: context.audit.captureFrame,
      file: portable(root, artifacts.png.file),
      sha256: artifacts.png.sha256,
      width: artifacts.png.width,
      height: artifacts.png.height,
    },
    rawAudit: {file: portable(root, artifacts.report.file), sha256: artifacts.report.sha256},
    authorityBoundary: context.authorityBoundary,
    limitations: [
      "Animate 2021 may convert unsupported legacy ActionScript in memory before JSFL inventory.",
      "The shipped SWF is hash-bound but is not executed by this authoring audit.",
      "The named operator performs only the two authorized dialog/close actions and is not a reviewer or owner approver.",
    ],
  };
  const file = path.join(runDir, "dependency-authoring-audit-evidence.json");
  await writeFile(file, `${JSON.stringify(evidence, null, 2)}\n`, {flag: "wx"});
  return {file, sha256: await sha256File(file)};
}

export async function runAuthorizedLessonG4L10OneRowAudit(claimToken) {
  invariant(arguments.length === 1,
    "dedicated L10 runner accepts exactly one opaque v2 claim token");
  const context = await takeLessonAnimateOneRowExecutionContextV2(claimToken);
  const root = CORE_PROJECT_ROOT;
  const mapping = assertExecutionContext(context, root);
  const before = await verifyExecutionFiles(context);
  const auditScript = path.join(root, AUDIT_JSFL);
  await access(context.audit.animateExecutable, fsConstants.X_OK);
  await access(auditScript, fsConstants.R_OK);
  const activeBefore = await runningAnimate(context.audit.animateExecutable);
  invariant(activeBefore.length === 0,
    `Adobe Animate is already running (${activeBefore.map(({pid}) => pid).join(", ")})`);
  const runDir = await createRunDirectory(mapping.runDirectory, mapping.evidenceDir);
  const templateBytes = await readFile(auditScript);
  const generatedAudit = buildDependencyGeneratedAuditScript(templateBytes.toString("utf8"),
    pathToFileURL(runDir).href);
  const generatedAuditFile = path.join(runDir,
    "animate-audit-current-document.dependency.generated.jsfl");
  const controllerFile = path.join(runDir, "controller.jsfl");
  const markerFile = path.join(runDir, "controller-result.json");
  const controller = buildAssistedControllerJsfl({
    flaUri: pathToFileURL(context.paths.assistFlaWorkingCopy).href,
    auditScriptUri: pathToFileURL(generatedAuditFile).href,
    outputRootUri: pathToFileURL(runDir).href,
    markerUri: pathToFileURL(markerFile).href,
    captureFrame: context.audit.captureFrame,
  });
  await writeFile(generatedAuditFile, generatedAudit, {flag: "wx"});
  await writeFile(controllerFile, controller, {flag: "wx"});
  process.stderr.write(
    `ACTION REQUIRED FOR ${context.operator.fullName}: Adobe Animate will open ${path.basename(context.paths.assistFlaWorkingCopy)}. Acknowledge only the legacy ActionScript conversion warning; then close without saving. Do not save, publish, export, or acknowledge any other dialog.\n`,
  );
  const intent = await writeDurableExclusiveJson(path.join(runDir, "launch-intent.json"),
    launchIntent(root, context, runDir, controllerFile, controller,
      generatedAuditFile, generatedAudit));
  await beginLessonAnimateOneRowLaunchAttemptV2(claimToken);
  let processResult;
  let launchFailure = null;
  try {
    processResult = await runChild(context.audit.animateExecutable,
      ["--run-jsfl", "-o", controllerFile], context.audit.timeoutMs,
      cleanAnimateEnvironment(), {detachedProcessGroup: true, cwd: root});
  } catch (error) {
    launchFailure = error instanceof Error ? error.message : String(error);
    processResult = {exitCode: null, signal: null, timedOut: false,
      outputLimitExceeded: false, killUnconfirmed: false, durationMs: 0,
      stdout: Buffer.alloc(0), stderr: Buffer.from(launchFailure)};
  }
  const stdoutFile = path.join(runDir, "stdout.log");
  const stderrFile = path.join(runDir, "stderr.log");
  await writeFile(stdoutFile, processResult.stdout, {flag: "wx"});
  await writeFile(stderrFile, processResult.stderr, {flag: "wx"});
  const failures = [];
  if (launchFailure) failures.push(`Animate launch failed: ${launchFailure}`);
  let remaining = null;
  let postProbeSucceeded = false;
  try {
    remaining = await runningAnimate(context.audit.animateExecutable);
    postProbeSucceeded = true;
    invariant(remaining.length === 0,
      `Adobe Animate remains running (${remaining.map(({pid}) => pid).join(", ")})`);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  let artifacts = null;
  let evidence = null;
  let after = null;
  try {
    invariant(postProbeSucceeded && Array.isArray(remaining) && remaining.length === 0,
      `${context.animationId}: post-run Animate lifecycle is unknown or not empty`);
    invariant(processResult.timedOut !== true, `${context.animationId}: Animate timed out`);
    invariant(processResult.outputLimitExceeded !== true,
      `${context.animationId}: Animate output exceeded its fixed limit`);
    invariant(processResult.killUnconfirmed !== true,
      `${context.animationId}: process-group termination was not confirmed`);
    invariant(processResult.exitCode === 0,
      `${context.animationId}: Animate exited with code ${processResult.exitCode}`);
    artifacts = await validateAssistedArtifacts({runDir, evidenceId: context.animationId,
      workingCopy: context.paths.assistFlaWorkingCopy,
      captureFrame: context.audit.captureFrame, requireScriptBodies: true});
    after = await verifyExecutionFiles(context);
    invariant(["sourceFla", "sourceSwf", "assistFla", "assistSwf", "binding"]
      .every((key) => sameFileIdentity(before[key], after[key])),
    `${context.animationId}: source, assist copy, or binding identity changed during the run`);
    evidence = await writeEvidence(root, context, before, after, runDir, artifacts, intent,
      processResult, remaining, templateBytes, generatedAuditFile, generatedAudit,
      controllerFile, controller);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  if (!after) {
    try { after = await verifyExecutionFiles(context); }
    catch (error) { failures.push(error instanceof Error ? error.message : String(error)); }
  }
  const failure = failures.length > 0 ? [...new Set(failures)].join("; ") : null;
  const result = {
    schemaVersion: 2,
    evidenceKind: "lesson-g04-l10-owner-authorized-animate-one-row-run",
    status: failure ? "failed" : "passed",
    evidenceId: context.animationId,
    acceptanceEffect: "none",
    humanActionBoundary: {
      designatedOperator: context.operator.fullName,
      stableSubjectId: context.operator.stableSubjectId,
      allowedActions: [...context.operator.allowedHumanActions],
      reviewOrOwnerDecisionRecorded: false,
    },
    ownerAuthorizedOneRowExecution: {
      releaseId: context.releaseId,
      releaseOrdinal: context.releaseOrdinal,
      queueOrdinal: context.queueOrdinal,
      assetId: context.assetId,
      runId: context.runId,
      nonceSha256: context.nonceSha256,
      receipts: context.receipts,
      launchIntent: {file: portable(root, intent.file), sha256: intent.sha256,
        bytes: intent.bytes, runtimeLaunchDispositionBeforeResult:
          "possible-or-unknown-after-durable-intent"},
      acceptanceEffect: "none",
    },
    command: {
      executable: context.audit.animateExecutable,
      executableSha256: context.executionCodeClosure.toolchain.animateExecutable.sha256,
      args: ["--run-jsfl", "-o", portable(root, controllerFile)],
      spawnedAnimateProcessCount: launchFailure ? 0 : 1,
      cwd: root,
      saveAllowed: false,
      publishAllowed: false,
    },
    process: {
      exitCode: processResult.exitCode,
      signal: processResult.signal,
      timedOut: processResult.timedOut,
      outputLimitExceeded: processResult.outputLimitExceeded,
      killUnconfirmed: processResult.killUnconfirmed,
      durationMs: processResult.durationMs,
      stdout: {file: portable(root, stdoutFile), sha256: sha256(processResult.stdout)},
      stderr: {file: portable(root, stderrFile), sha256: sha256(processResult.stderr)},
    },
    postRunAnimateLifecycle: {
      processProbe: "/bin/ps",
      fixedProbeEnvironment: {LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin"},
      probeSucceeded: postProbeSucceeded,
      remainingProcessCount: Array.isArray(remaining) ? remaining.length : null,
      allAnimateProcessesExited: postProbeSucceeded
        && Array.isArray(remaining) && remaining.length === 0,
      requiredForPassing: true,
    },
    artifacts,
    workEvidence: evidence ? {file: portable(root, evidence.file), sha256: evidence.sha256} : null,
    migrationOrApprovalWrites: false,
    authorityBoundary: context.authorityBoundary,
    failure,
  };
  const resultFile = path.join(runDir, "assisted-run-result.json");
  await writeFile(resultFile, `${JSON.stringify(result, null, 2)}\n`, {flag: "wx"});
  if (failure) throw new Error(`${failure}; run receipt: ${portable(root, resultFile)}`);
  return {...result, resultFile};
}
