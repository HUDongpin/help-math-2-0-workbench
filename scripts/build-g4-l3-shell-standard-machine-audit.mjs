#!/usr/bin/env node

import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {mkdir, mkdtemp, readFile, rename, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {auditMigration} from "./audit-pilot-swfs.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const workspace = path.join(projectRoot, "migrations", animationId);
const machineDirectory = path.join(workspace, "audit", "machine");
const execFileAsync = promisify(execFile);

export const STANDARD_MACHINE_FILES = Object.freeze([
  "ffdec-header.txt",
  "ffdec-script-index.txt",
  "ffdec-scripts.txt.gz",
  "ffdec-tags.txt.gz",
  "report.json",
  "swf-frame-domain-candidates.json",
  "swfmill-summary.json",
  "swfmill.xml.gz",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function normalizeVersionRecord(command, output, pattern) {
  const normalized = output.replace(/\r\n?/g, "\n").trim();
  const match = normalized.match(pattern);
  invariant(match?.[0], `${command} version output did not match the expected format`);
  return {command, version: match[0].trim(), success: true, exitCode: 0, error: ""};
}

export async function captureLiveToolRecords() {
  const [ffdec, swfmill, java, python] = await Promise.all([
    execFileAsync("ffdec", ["-help"], {maxBuffer: 8 * 1024 * 1024}),
    execFileAsync("swfmill", ["--version"], {maxBuffer: 1024 * 1024}),
    execFileAsync("java", ["-version"], {maxBuffer: 1024 * 1024}),
    execFileAsync("python3", ["--version"], {maxBuffer: 1024 * 1024}),
  ]);
  return {
    ffdec: normalizeVersionRecord("ffdec", `${ffdec.stdout}\n${ffdec.stderr}`, /JPEXS Free Flash Decompiler v\.[^\n]+/),
    swfmill: normalizeVersionRecord("swfmill", `${swfmill.stdout}\n${swfmill.stderr}`, /swfmill [^\n]+/),
    java: normalizeVersionRecord("java", `${java.stdout}\n${java.stderr}`, /(?:openjdk|java) version "[^"]+"[^\n]*/),
    xmlParser: {
      ...normalizeVersionRecord("python3", `${python.stdout}\n${python.stderr}`, /Python [^\n]+/),
      library: "Python standard library xml.etree.ElementTree.iterparse",
    },
  };
}

async function atomicWrite(candidate, bytes) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const temporary = `${candidate}.tmp-${process.pid}`;
  await writeFile(temporary, bytes);
  await rename(temporary, candidate);
}

export async function buildG4L3ShellStandardMachineAudit({check = false} = {}) {
  const [manifestBytes, tools] = await Promise.all([
    readFile(path.join(workspace, "migration.json")),
    captureLiveToolRecords(),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  invariant(manifest.animationId === animationId, "Shell migration identity drifted");

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "help-math-g4-l3-shell-audit-"));
  const temporaryWorkspace = path.join(temporaryRoot, animationId);
  try {
    await mkdir(temporaryWorkspace, {recursive: true});
    await writeFile(path.join(temporaryWorkspace, "migration.json"), manifestBytes);
    const report = await auditMigration(temporaryWorkspace, {
      tools,
      adobeAnimateAvailable: false,
    });
    invariant(report.animationId === animationId, "Generated machine report identity drifted");
    invariant(report.source.hashMatches === true, "Generated machine report did not verify the preserved SWF hash");
    invariant(Object.values(report.commands).every(({status}) => status === "success"), "One or more machine extraction commands failed");
    const generatedDirectory = path.join(temporaryWorkspace, "audit", "machine");
    const expectedFiles = new Set([...report.outputs.map(({path: outputPath}) => path.basename(outputPath)), "report.json"]);
    invariant(STANDARD_MACHINE_FILES.every((name) => expectedFiles.has(name)), "Generated standard machine file set is incomplete");
    invariant([...expectedFiles].every((name) => STANDARD_MACHINE_FILES.includes(name)), "Generated machine audit contains an unexpected managed file");

    const files = [];
    for (const name of STANDARD_MACHINE_FILES) {
      const generated = await readFile(path.join(generatedDirectory, name));
      const destination = path.join(machineDirectory, name);
      if (check) {
        const existing = await readFile(destination);
        invariant(existing.equals(generated), `${animationId}: audit/machine/${name} is stale`);
      } else {
        await atomicWrite(destination, generated);
      }
      files.push({name, bytes: generated.length, sha256: sha256(generated)});
    }
    return {
      animationId,
      action: check ? "verified" : "written",
      sourceSha256: manifest.source.swfSha256,
      fileCount: files.length,
      files,
      preservedSpecializedFiles: true,
      animateLaunched: false,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-g4-l3-shell-standard-machine-audit.mjs [--check]\n\nBuilds the standard FFDec/swfmill evidence files without deleting the existing G4 L3 specialized machine evidence. Adobe Animate is never launched.");
    return;
  }
  console.log(JSON.stringify(await buildG4L3ShellStandardMachineAudit(options), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {parseArguments};
