#!/usr/bin/env node

import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildFrameDomainDispositions,
} from "./build-frame-domain-dispositions.mjs";

const scriptPath = fileURLToPath(import.meta.url);

export function parseArguments(argv) {
  const options = {
    check: false,
    help: false,
    releaseId: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--release-id") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--release-id requires a value");
      }
      if (options.releaseId) {
        throw new Error("--release-id must not be repeated");
      }
      options.releaseId = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!options.help && !options.releaseId) {
    throw new Error("--release-id is required");
  }
  return options;
}

export function toExactReleaseCoreOptions(options) {
  if (!options?.releaseId) {
    throw new Error("An exact releaseId is required");
  }
  return {
    check: options.check === true,
    ids: [],
    releaseId: options.releaseId,
    allowFullReleaseSelection: true,
  };
}

export async function buildLessonReleaseFrameDomainDispositions(options) {
  return buildFrameDomainDispositions(toExactReleaseCoreOptions(options));
}

function usage() {
  return `Usage: node scripts/build-lesson-release-frame-domain-dispositions.mjs --release-id <release-id> [--check]

Selects every exact member of one hash-bound LessonRelease in ordinal order.
The underlying frame-domain builder retains its bounded legacy CLI; this
release-only entry point is the explicit authority to perform the full-release
preflight and atomic batch operation. It never changes migration acceptance,
reviews, strict status, preserved sources, or publication state.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
  } else {
    const results = await buildLessonReleaseFrameDomainDispositions(options);
    for (const result of results) {
      process.stdout.write(
        `${result.action}: ${result.animationId} -> ${result.output} `
        + `(${result.report.summary.reachableChildTimelineCount} reachable children, `
        + `${result.report.summary.dispositionCounts["composite-child-with-parent"]} `
        + `evidence-backed composite, ${result.report.summary.dispositionCounts.unresolved} unresolved)\n`,
      );
    }
  }
}
