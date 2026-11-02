#!/usr/bin/env node
// Lighthouse mobile baseline for key public routes.
// Usage: node scripts/perf/lighthouse-mobile.mjs [--base https://www.helpmath.ai] [--runs 3] [--out docs/perf/baseline.json] [route ...]
// Needs Chrome. Uses the pinned Lighthouse CLI via npx unless LIGHTHOUSE_BIN is set.
// For a protected Vercel preview, set VERCEL_AUTOMATION_BYPASS_SECRET; it is sent as x-vercel-protection-bypass.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const LIGHTHOUSE_VERSION = "12.8.2";
const DEFAULT_ROUTES = ["/", "/courses/3/2", "/es/courses/4/3"];

function parseArgs(argv) {
  const opts = { base: "https://www.helpmath.ai", runs: 3, out: null, routes: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base") opts.base = argv[++i];
    else if (arg === "--runs") opts.runs = Number(argv[++i]);
    else if (arg === "--out") opts.out = argv[++i];
    else opts.routes.push(arg);
  }
  if (!Number.isInteger(opts.runs) || opts.runs < 1) throw new Error("--runs must be a positive integer");
  if (opts.routes.length === 0) opts.routes = DEFAULT_ROUTES;
  return opts;
}

function runLighthouse(url, dir, index) {
  const outPath = join(dir, `run-${index}.json`);
  const flags = [
    url,
    "--form-factor=mobile",
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outPath}`,
    "--quiet",
    "--chrome-flags=--headless=new --no-sandbox",
  ];
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) flags.push(`--extra-headers=${JSON.stringify({ "x-vercel-protection-bypass": bypass })}`);
  const bin = process.env.LIGHTHOUSE_BIN;
  if (bin) execFileSync(bin, flags, { stdio: "inherit" });
  else execFileSync("npx", ["--yes", `lighthouse@${LIGHTHOUSE_VERSION}`, ...flags], { stdio: "inherit" });
  return JSON.parse(readFileSync(outPath, "utf8"));
}

function metrics(lhr, url) {
  const audit = (id) => {
    const value = lhr.audits[id]?.numericValue;
    if (typeof value !== "number") throw new Error(`${url}: Lighthouse returned no value for ${id}`);
    return value;
  };
  if (typeof lhr.categories.performance.score !== "number") throw new Error(`${url}: Lighthouse returned no performance score`);
  return {
    lighthouseVersion: lhr.lighthouseVersion,
    score: Math.round(lhr.categories.performance.score * 100),
    lcpMs: audit("largest-contentful-paint"),
    tbtMs: audit("total-blocking-time"),
    ttiMs: audit("interactive"),
    unusedJsBytes: lhr.audits["unused-javascript"]?.details?.overallSavingsBytes ?? 0,
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const NUMERIC_KEYS = ["score", "lcpMs", "tbtMs", "ttiMs", "unusedJsBytes"];

const opts = parseArgs(process.argv.slice(2));
const results = [];
for (const route of opts.routes) {
  const url = new URL(route, opts.base).toString();
  const dir = mkdtempSync(join(tmpdir(), "lh-"));
  const runs = [];
  try {
    for (let i = 0; i < opts.runs; i++) runs.push(metrics(runLighthouse(url, dir, i), url));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const summary = Object.fromEntries(NUMERIC_KEYS.map((k) => [k, median(runs.map((r) => r[k]))]));
  results.push({ route, url, median: summary, runs });
}

const fmt = (ms) => `${(ms / 1000).toFixed(1)} s`;
console.log("| Route | Perf | LCP | TBT | TTI | Unused JS |\n|---|---|---|---|---|---|");
for (const { route, median: m } of results) {
  console.log(`| ${route} | ${m.score} | ${fmt(m.lcpMs)} | ${Math.round(m.tbtMs)} ms | ${fmt(m.ttiMs)} | ${Math.round(m.unusedJsBytes / 1024)} KiB |`);
}

if (opts.out) {
  mkdirSync(dirname(opts.out), { recursive: true });
  const versions = [...new Set(results.flatMap((r) => r.runs.map((run) => run.lighthouseVersion)))];
  const report = { base: opts.base, runsPerRoute: opts.runs, lighthouse: versions.join(", "), measuredAt: new Date().toISOString(), results };
  writeFileSync(opts.out, `${JSON.stringify(report, null, 2)}\n`);
}
