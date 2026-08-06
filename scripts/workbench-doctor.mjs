#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function add(name, level, detail, hint = "") {
  checks.push({ name, level, detail, hint });
}

function run(command, args = []) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 5000,
    windowsHide: true,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim().split(/\r?\n/)[0] || "";
  return { ok: !result.error && result.status === 0, output, error: result.error };
}

function firstWorking(candidates) {
  for (const [command, ...args] of candidates) {
    const result = run(command, args);
    if (result.ok) return { command, ...result };
  }
  return null;
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 22 && nodeMajor < 27) {
  add("Node.js", "PASS", `v${process.versions.node}${nodeMajor === 24 ? " (recommended LTS)" : ""}`);
  if (nodeMajor !== 24) add("Node.js 24 alignment", "WARN", `Running v${process.versions.node}`, "Use the version in .nvmrc for reproducible results");
} else add("Node.js", "FAIL", `v${process.versions.node}`, "Install Node.js 24 LTS");

const npm = run(process.platform === "win32" ? "npm.cmd" : "npm", ["--version"]);
add("npm", npm.ok ? "PASS" : "FAIL", npm.output || "not found", "Install npm with Node.js");

const python = firstWorking([
  ["python3", "--version"],
  ["python", "--version"],
  ["py", "-3", "--version"],
]);
if (python) {
  const match = python.output.match(/Python\s+(\d+)\.(\d+)/i);
  const supported = match && (Number(match[1]) > 3 || (Number(match[1]) === 3 && Number(match[2]) >= 11));
  add("Python", supported ? "PASS" : "FAIL", python.output, "Install Python 3.11 or newer");
} else add("Python", "FAIL", "not found", "Install Python 3.11 or newer");

for (const relative of [
  "AGENTS.md",
  "README.md",
  "docs/TOOLING.md",
  "skills/flash-to-js/SKILL.md",
  ".agents/skills/flash-to-js/SKILL.md",
  "templates/flash-migration/migration.json",
  "package.json",
  "package-lock.json",
]) {
  add(relative, existsSync(path.join(projectRoot, relative)) ? "PASS" : "FAIL", existsSync(path.join(projectRoot, relative)) ? "present" : "missing");
}

let packageJson = {};
try {
  packageJson = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
} catch (error) {
  add("package.json parse", "FAIL", error.message);
}
for (const dependency of ["@ruffle-rs/ruffle", "next", "react"]) {
  const version = packageJson.dependencies?.[dependency];
  add(`dependency ${dependency}`, version ? "PASS" : "FAIL", version || "missing");
}
for (const dependency of ["@playwright/test", "pixelmatch", "pngjs"]) {
  const version = packageJson.devDependencies?.[dependency];
  add(`dependency ${dependency}`, version ? "PASS" : "FAIL", version || "missing");
}

const ruffleFiles = ["public/ruffle/ruffle.js", "public/ruffle/LICENSE_MIT", "public/ruffle/LICENSE_APACHE"];
add("Self-hosted Ruffle", ruffleFiles.every((file) => existsSync(path.join(projectRoot, file))) ? "PASS" : "FAIL", "public/ruffle assets");

try {
  const { chromium } = await import("@playwright/test");
  const browserPath = chromium.executablePath();
  add("Playwright Chromium", existsSync(browserPath) ? "PASS" : "FAIL", existsSync(browserPath) ? browserPath : "browser binary missing", "Run: npx playwright install chromium");
} catch (error) {
  add("Playwright Chromium", "FAIL", error.message, "Run npm ci, then npx playwright install chromium");
}

const optional = [
  ["FFDec", [["ffdec", "-help"], ["ffdec", "--help"]], "Install the current stable JPEXS FFDec release"],
  ["Java runtime", [["java", "-version"]], "Needed by generic FFDec JAR/ZIP packages"],
  ["swfmill", [["swfmill", "-h"]], "Recommended for SWF-to-XML inspection"],
  ["FFmpeg", [["ffmpeg", "-version"]], "Needed when SWF contains audio or video"],
  ["ImageMagick", [["magick", "-version"]], "Optional independent RMSE check"],
];
for (const [name, candidates, hint] of optional) {
  const result = firstWorking(candidates);
  add(name, result ? "PASS" : "WARN", result?.output || "not available", hint);
}

if (process.platform === "darwin") {
  let animate = [];
  try {
    animate = readdirSync("/Applications").filter((name) => /^Adobe Animate/i.test(name));
  } catch {}
  add("Adobe Animate", animate.length ? "PASS" : "WARN", animate.join(", ") || "not detected", "Optional authoring-source inspection tool");
}

const widths = { name: 31, level: 5 };
for (const check of checks) {
  console.log(`${check.level.padEnd(widths.level)}  ${check.name.padEnd(widths.name)}  ${check.detail}`);
  if (check.hint && check.level !== "PASS") console.log(`       ${"".padEnd(widths.name)}  ${check.hint}`);
}

const failures = checks.filter((check) => check.level === "FAIL");
const warnings = checks.filter((check) => check.level === "WARN");
console.log(`\nWorkbench doctor: ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length) process.exitCode = 1;
