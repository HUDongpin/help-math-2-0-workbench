#!/usr/bin/env node

import {appendFile} from "node:fs/promises";
import {
  DEFAULT_ATTEMPTS,
  DEFAULT_MAX_FAILURES,
  DEFAULT_ORIGIN,
  formatSummary,
  runRouteHealth,
} from "./lib/production-route-health.mjs";

function fail(message) {
  throw new Error(message);
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!["--origin", "--attempts", "--max-failures"].includes(key) || value === undefined) {
      fail("usage: production-route-health.mjs [--origin https://www.helpmath.ai] [--attempts 5] [--max-failures 1]");
    }
    if (values.has(key)) fail(`duplicate CLI option: ${key}`);
    values.set(key, value);
  }
  return {
    origin: values.get("--origin") ?? DEFAULT_ORIGIN,
    attempts: Number(values.get("--attempts") ?? DEFAULT_ATTEMPTS),
    maxFailures: Number(values.get("--max-failures") ?? DEFAULT_MAX_FAILURES),
  };
}

const report = await runRouteHealth(parseArguments(process.argv.slice(2)));
const summary = formatSummary(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary, "utf8");
process.stdout.write(summary);
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.healthy) {
  process.stderr.write("FAIL: production route failure rate exceeded the allowed threshold.\n");
  process.exitCode = 1;
}
