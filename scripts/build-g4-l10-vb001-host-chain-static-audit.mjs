#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {
  access,
  chmod,
  lstat,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {readSwfHeader} from "./create-flash-migration.mjs";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

export const JSON_REPORT_RELATIVE =
  "reports/g4-l10-vb001-host-chain-static-audit.json";
export const MARKDOWN_REPORT_RELATIVE =
  "reports/g4-l10-vb001-host-chain-static-audit.md";

const SWF_RELATIVE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB01.swf";
const FLA_RELATIVE =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/VB/L10VB01.fla";

const EXPECTED = Object.freeze({
  swf: Object.freeze({
    bytes: 58_345,
    sha256: "3909cbf09c6bace7400687680e082007f8bc695bd16a279674a95bd266c109ec",
  }),
  fla: Object.freeze({
    bytes: 1_197_568,
    sha256: "6c098c272e8608e401f3a51e7d065eb2a5bf076b23e1e8947a5041f5705d34ff",
  }),
  swfmill: Object.freeze({
    version: "swfmill 0.3.6",
    xmlSha256: "7e940bc56fa453f8e8a320139bf2aaba9633356080c7cf4a60d695094f96696a",
  }),
  ffdec: Object.freeze({
    version: "JPEXS Free Flash Decompiler v.26.2.1",
  }),
});

const EXPECTED_SCRIPTS = Object.freeze({
  "frame_1/DoAction.as":
    '_level0.InternalPreloader.gotoAndPlay("jump_check");\nstop();',
  "frame_6/DoAction.as": "stop();",
  "DefineSprite_5/frame_1/DoAction.as": "stop();",
  "DefineSprite_5/frame_135/DoAction.as": "stop();",
  "DefineSprite_6/frame_1/DoAction.as": "stop();",
  "DefineSprite_6/frame_135/DoAction.as": "stop();",
  "DefineSprite_31/frame_1/DoAction.as":
    'tempNum = random(2);\n_global.tempRandomSoundMc = "Mc_Sound_" + tempNum;',
  "DefineSprite_31/frame_5/DoAction.as":
    "eval(_global.tempRandomSoundMc).gotoAndPlay(2);",
  "DefineSprite_31/frame_136/DoAction.as": "stop();",
});

function invariant(condition, message) {
  if (!condition) throw new Error(`G4 L10 VB001 host-chain audit: ${message}`);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function stableBinding(relativePath, expected) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(before.isFile() && !before.isSymbolicLink(), `${relativePath} is not a regular file`);
  invariant((before.mode & 0o222n) === 0n, `${relativePath} is not read-only`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    before.dev === after.dev && before.ino === after.ino &&
      before.size === after.size && before.mtimeNs === after.mtimeNs,
    `${relativePath} changed while read`,
  );
  invariant(bytes.length === expected.bytes, `${relativePath} byte count drifted`);
  invariant(sha256(bytes) === expected.sha256, `${relativePath} SHA-256 drifted`);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: Number(after.mode & 0o777n).toString(8).padStart(4, "0"),
    contents: bytes,
  };
}

async function findExecutable(command) {
  if (path.isAbsolute(command)) return command;
  for (const directory of (process.env.PATH || "").split(path.delimiter)) {
    if (!directory) continue;
    const candidate = path.join(directory, command);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(`executable not found on PATH: ${command}`);
}

async function run(command, args, options = {}) {
  const result = await execFileAsync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 300_000,
    ...options,
  });
  return {stdout: result.stdout || "", stderr: result.stderr || ""};
}

async function toolBinding(command, versionArgs, expectedFirstLine) {
  const executablePath = await findExecutable(command);
  const resolved = await stat(executablePath).then(() => executablePath);
  const versionResult = await run(resolved, versionArgs);
  const version = `${versionResult.stdout}\n${versionResult.stderr}`
    .split(/\r?\n/).map((line) => line.replace(/\x1b\[[0-9;]*m/g, "").trim())
    .find(Boolean);
  invariant(version === expectedFirstLine, `${command} version drifted: ${version || "missing"}`);
  const bytes = await readFile(resolved);
  return {
    invokedAs: command,
    executablePath: resolved,
    bytes: bytes.length,
    sha256: sha256(bytes),
    version,
  };
}

async function listFiles(root, current = root) {
  const output = [];
  for (const entry of await readdir(current, {withFileTypes: true})) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(root, absolute));
    else if (entry.isFile()) output.push(path.relative(root, absolute).split(path.sep).join("/"));
    else invariant(false, `unexpected exported non-file: ${absolute}`);
  }
  return output.sort();
}

async function freshStaticExtraction({ffdec, swfmill, swfPath}) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-g4-l10-vb001-"));
  invariant(path.dirname(temporaryRoot) === path.resolve(os.tmpdir()), "unsafe temporary directory");
  try {
    const scriptRoot = path.join(temporaryRoot, "ffdec");
    const xmlPath = path.join(temporaryRoot, "swfmill.xml");
    await run(ffdec.executablePath, ["-export", "script", scriptRoot, swfPath]);
    await run(swfmill.executablePath, ["-n", "swf2xml", swfPath, xmlPath]);
    const exportedRoot = path.join(scriptRoot, "scripts");
    const paths = await listFiles(exportedRoot);
    invariant(
      JSON.stringify(paths) === JSON.stringify(Object.keys(EXPECTED_SCRIPTS).sort()),
      `FFDec script inventory drifted: ${JSON.stringify(paths)}`,
    );
    const scripts = [];
    for (const relativePath of paths) {
      const bytes = await readFile(path.join(exportedRoot, relativePath));
      const source = bytes.toString("utf8").replace(/\r\n/g, "\n").trim();
      invariant(source === EXPECTED_SCRIPTS[relativePath], `${relativePath} ActionScript drifted`);
      scripts.push({
        path: relativePath,
        bytes: bytes.length,
        sha256: sha256(bytes),
        source,
      });
    }
    const xmlBytes = await readFile(xmlPath);
    const xml = xmlBytes.toString("utf8");
    invariant(sha256(xmlBytes) === EXPECTED.swfmill.xmlSha256, "fresh swfmill XML drifted");
    const anchors = [
      '<swf version="7" compressed="1">',
      '<Header framerate="12" frames="10">',
      '<Rectangle left="0" right="16000" top="0" bottom="12000"/>',
      '<FrameLabel label="begin">',
      '<DefineSprite objectID="5" frames="135">',
      '<DefineSprite objectID="6" frames="135">',
      '<DefineSprite objectID="31" frames="136">',
      '<PlaceObject2 replace="0" depth="31" objectID="5" name="Mc_Sound_0">',
      '<PlaceObject2 replace="0" depth="33" objectID="6" name="Mc_Sound_1">',
      '<PlaceObject2 replace="0" depth="1" objectID="31" morph="5" name="animation">',
    ];
    for (const anchor of anchors) invariant(xml.includes(anchor), `swfmill anchor drifted: ${anchor}`);
    return {
      scripts,
      scriptInventorySha256: sha256(Buffer.from(paths.join("\n") + "\n")),
      swfmill: {
        bytes: xmlBytes.length,
        sha256: sha256(xmlBytes),
        structuralAnchorCount: anchors.length,
        structuralAnchorsSha256: sha256(Buffer.from(anchors.join("\n") + "\n")),
      },
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function descriptor(binding) {
  const {contents, ...rest} = binding;
  return rest;
}

export async function buildReport({ffdecCommand = "ffdec", swfmillCommand = "swfmill"} = {}) {
  const [swf, fla, ffdec, swfmill] = await Promise.all([
    stableBinding(SWF_RELATIVE, EXPECTED.swf),
    stableBinding(FLA_RELATIVE, EXPECTED.fla),
    toolBinding(ffdecCommand, ["-help"], EXPECTED.ffdec.version),
    toolBinding(swfmillCommand, ["--version"], EXPECTED.swfmill.version),
  ]);
  invariant(
    fla.contents.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])),
    "FLA is not the expected classic OLE Compound File binary",
  );
  const swfHeader = await readSwfHeader(path.join(PROJECT_ROOT, SWF_RELATIVE));
  invariant(
    swfHeader?.swfSignature === "CWS" && swfHeader.swfVersion === 7 &&
      swfHeader.fps === 12 && swfHeader.frameCount === 10 &&
      swfHeader.stage?.width === 800 && swfHeader.stage?.height === 600,
    `SWF root header drifted: ${JSON.stringify(swfHeader)}`,
  );
  const extracted = await freshStaticExtraction({
    ffdec,
    swfmill,
    swfPath: path.join(PROJECT_ROOT, SWF_RELATIVE),
  });
  const nominalDomainDurationMs = 136 / 12 * 1000;
  const conservativePostDeliveryWaitMs = 3_084 + Math.ceil(nominalDomainDurationMs) + 1_000;
  return {
    schemaVersion: 1,
    reportType: "g4-l10-vb001-host-chain-static-audit",
    evidenceAsOf: "2026-08-02",
    status: "source-static-host-chain-timing-candidate-only",
    scope: {
      releaseId: "lesson-g04-l10-perimeter-area",
      playlistRole: "natural-entry-05-shell-playlist-only-vb01",
      activeCourseXmlMember: false,
      formalReleaseMember: false,
      migrationWorkspaceExists: false,
      purpose:
        "Close only the source-static timing gap before the sixth controlled Ruffle host Next release; do not add VB001 to the 47-member formal release denominator.",
    },
    sources: {
      swf: descriptor(swf),
      fla: {
        ...descriptor(fla),
        format: "classic-Adobe-FLA-OLE-Compound-File",
        custodyVerified: true,
        authoringTimelineAuditComplete: false,
      },
      sourceFilesModified: false,
    },
    tools: {ffdec, swfmill},
    swf: {
      header: swfHeader,
      actionScriptVersion: "AS1/2",
      freshSwfmill: extracted.swfmill,
      freshFfdecScriptInventorySha256: extracted.scriptInventorySha256,
      scripts: extracted.scripts,
    },
    frameDomains: {
      formalMigrationDeclarationCreated: false,
      sourceStaticHostChainDomains: [
        {
          timelineId: "root",
          frameCount: 10,
          role: "loaded child root",
          entry: "root frame 1 requests shell InternalPreloader jump_check and stops",
          begin: "root frame 6 is labeled begin, places instance animation from sprite-31, and stops",
        },
        {
          timelineId: "sprite-31",
          frameCount: 136,
          role: "principal nested animation and random-audio controller",
          rootPlacementFrame: 6,
          terminalActionFrame: 136,
          terminalAction: "stop();",
          authoritativeRuntimeEntryEstablished: false,
          authoritativeRuntimeTerminalEstablished: false,
        },
        {
          timelineId: "sprite-5",
          frameCount: 135,
          role: "embedded streaming-audio branch Mc_Sound_0",
          placementParent: "sprite-31",
          placementFrame: 1,
          activationParentFrame: 5,
          terminalActionFrame: 135,
        },
        {
          timelineId: "sprite-6",
          frameCount: 135,
          role: "embedded streaming-audio branch Mc_Sound_1",
          placementParent: "sprite-31",
          placementFrame: 1,
          activationParentFrame: 5,
          terminalActionFrame: 135,
        },
      ],
      randomBranchContract: {
        source: "sprite-31 frame 1 selects random(2); sprite-31 frame 5 starts the selected Mc_Sound_0 or Mc_Sound_1 at local frame 2",
        deterministicRuntimeBranchObserved: false,
        namedHumanListeningOccurred: false,
        audioSynchronizationEstablished: false,
      },
    },
    controlledNavigationTimingCandidate: {
      fps: 12,
      principalTimelineId: "sprite-31",
      principalFrameCount: 136,
      nominalDomainDurationMs,
      hostPreloaderSettleMs: 3_084,
      bufferMs: 1_000,
      conservativePostDeliveryWaitMs,
      permitsControlledRuffleProbePlanning: true,
      provesNaturalRuntimeEntry: false,
      provesNaturalRuntimeTerminal: false,
      provesAudioCompletionOrSynchronization: false,
      statement:
        "The wait only ensures that a source-declared time envelope has elapsed before the next shell control input; it is not playhead evidence.",
    },
    remainingUnknowns: [
      "Classic binary FLA authoring timeline has not been inspected in Adobe Animate by a named operator.",
      "Ruffle or Adobe natural entry into sprite-31 has not been observed with a playhead-bearing runtime trace.",
      "Neither random embedded audio branch has been listened to or synchronized by a named human.",
      "No English/Spanish baseline, full-frame comparison, RMSE, human review, owner review, strict completion, integration, or release authority is created.",
    ],
    authority: {
      sourceStaticHostChainTimingCandidateOnly: true,
      ruffleForensicReferenceOnly: true,
      authoritativeOriginalRuntime: false,
      originalRuntimeNaturalTrace: false,
      originalRuntimeBaseline: false,
      fullFrameBaseline: false,
      audioListeningOrSynchronization: false,
      visualFidelity: false,
      humanReview: false,
      ownerReview: false,
      strictCompletion: false,
      wholeLessonIntegration: false,
      releaseOrPublication: false,
      strictAcceptanceEffect: "none",
    },
  };
}

export function renderMarkdown(report) {
  const domains = report.frameDomains.sourceStaticHostChainDomains.map((domain) =>
    `| ${domain.timelineId} | ${domain.frameCount} | ${domain.role} |`).join("\n");
  return `# G4 L10 VB001 host-chain static audit\n\n` +
    `> **Acceptance-neutral machine evidence.** This report closes only the source-static timing gap before a controlled Ruffle host-chain probe. It is not Adobe original-runtime, natural-entry, audio-listening, visual-fidelity, human, owner, strict, whole-lesson, or release evidence.\n\n` +
    `## Result\n\n` +
    `VB001 is a real shell-playlist dependency but is not an active XML or formal 47-member release member. Its 10-frame root stops at frame 1 until the shell preloader calls \`begin\`; root frame 6 places \`sprite-31\`. The principal child has **136 frames at 12 FPS** and executes \`stop();\` on frame 136. Two 135-frame embedded streaming-audio branches are selected by \`random(2)\` and activated from child frame 5.\n\n` +
    `| Timeline | Frames | Static role |\n| --- | ---: | --- |\n${domains}\n\n` +
    `A conservative controlled-probe window is **${report.controlledNavigationTimingCandidate.conservativePostDeliveryWaitMs.toLocaleString("en-US")} ms after exact VB001 HTTP delivery**: 3,084 ms host-preloader settle + ceil(136/12 seconds) + 1,000 ms buffer. This is only a source-declared elapsed-time envelope; it does not prove runtime entry, terminal playhead arrival, or audio completion.\n\n` +
    `## Source custody\n\n` +
    `- SWF: \`${report.sources.swf.path}\`, SHA-256 \`${report.sources.swf.sha256}\`, ${report.sources.swf.bytes.toLocaleString("en-US")} bytes.\n` +
    `- FLA: \`${report.sources.fla.path}\`, SHA-256 \`${report.sources.fla.sha256}\`, ${report.sources.fla.bytes.toLocaleString("en-US")} bytes; classic OLE/Compound-File custody verified, Adobe authoring inspection still pending.\n` +
    `- Fresh swfmill XML SHA-256: \`${report.swf.freshSwfmill.sha256}\`.\n` +
    `- Source files modified: **false**.\n\n` +
    `## Authority boundary\n\n` +
    `Formal migration declaration created: **false**. Active release denominator changed: **false**. Named-human audio listening: **false**. Authoritative original runtime, baseline, RMSE, human/owner review, strict completion, whole-lesson integration, and publication: **all false**. Strict acceptance effect: \`none\`.\n`;
}

async function main() {
  const check = process.argv.includes("--check");
  invariant(process.argv.length === (check ? 3 : 2), "usage: node scripts/build-g4-l10-vb001-host-chain-static-audit.mjs [--check]");
  const report = await buildReport();
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);
  const jsonPath = path.join(PROJECT_ROOT, JSON_REPORT_RELATIVE);
  const markdownPath = path.join(PROJECT_ROOT, MARKDOWN_REPORT_RELATIVE);
  if (check) {
    invariant(await readFile(jsonPath, "utf8") === json, `${JSON_REPORT_RELATIVE} is stale`);
    invariant(await readFile(markdownPath, "utf8") === markdown, `${MARKDOWN_REPORT_RELATIVE} is stale`);
    process.stdout.write(`${JSON_REPORT_RELATIVE}: pass\n`);
    return;
  }
  await writeFile(jsonPath, json, {mode: 0o444});
  await writeFile(markdownPath, markdown, {mode: 0o444});
  await chmod(jsonPath, 0o444);
  await chmod(markdownPath, 0o444);
  process.stdout.write(`${JSON_REPORT_RELATIVE}: wrote ${Buffer.byteLength(json)} bytes\n`);
  process.stdout.write(`${MARKDOWN_REPORT_RELATIVE}: wrote ${Buffer.byteLength(markdown)} bytes\n`);
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
